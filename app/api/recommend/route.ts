import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/money";
import { sanitizeObjectCurrency } from "@/lib/sanitizeCurrency";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { hotel, state, nasa, calculatedOptions, currency = "INR" } = body;

  // Derive symbol and rate server-side — never from a string literal
  const curr = CURRENCIES[currency as keyof typeof CURRENCIES] ?? CURRENCIES.INR;
  const { symbol, rate } = curr;

  const optionSummary = calculatedOptions
    .filter((o: { available: boolean }) => o.available)
    .map((o: { id: string; label: string; irr: number | null; paybackYears: number | null; annualSavingPct: number; netCapex: number }) => {
      const capexDisplay = `${symbol}${(o.netCapex * rate / 100_000).toFixed(1)}L`;
      return `${o.label}: IRR=${o.irr ? (o.irr * 100).toFixed(1) + "%" : "N/A"}, Payback=${o.paybackYears ? o.paybackYears.toFixed(1) + "yrs" : o.id === "ppa-onsite" || o.id === "ppa-offsite" ? "Immediate" : "N/A"}, Saving=${o.annualSavingPct.toFixed(1)}%, Capex=${capexDisplay}`;
    })
    .join("\n");

  const systemPrompt = `CRITICAL: The user's currency is ${currency} (symbol: ${symbol}, rate from INR: ${rate}). You MUST use ONLY ${symbol} for ALL monetary values in your entire response. NEVER use a different currency symbol. Every monetary figure must be converted by multiplying the INR amount by ${rate}.`;

  const prompt = `You are a renewable energy advisor for Indian hotels. Analyse these options for ${hotel.name} in ${hotel.city}, ${hotel.state}:

Hotel: ${hotel.rooms} rooms, ${Math.round(hotel.annualElectricityKwh / 1000)} MWh/yr, ${hotel.ownership} property
Solar irradiance: ${nasa.solarIrradiance} kWh/m²/day
Open access available: ${state.openAccessAvailable}

Options calculated:
${optionSummary}

Return JSON with exactly these fields:
{
  "bestOptionId": "<one of the option IDs>",
  "reason": "<exactly 3 sentences explaining why this is best for this specific hotel. Use ${symbol} for any monetary values.>",
  "secondBestOptionId": "<option ID>",
  "watchOutFor": "<one concise sentence about the main risk or consideration>"
}

Valid option IDs: onsite-owned, offsite-owned, ppa-onsite, ppa-offsite, green-tariff, eac

Respond with ONLY valid JSON, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(text.trim());
    return NextResponse.json(sanitizeObjectCurrency(json, symbol, rate));
  } catch {
    const best = calculatedOptions
      .filter((o: { available: boolean }) => o.available)
      .sort((a: { annualSavingPct: number }, b: { annualSavingPct: number }) => b.annualSavingPct - a.annualSavingPct)[0];
    const tariffDisplay = `${symbol}${(state.commercialTariffPerUnit * rate).toFixed(2)}`;
    const fallback = {
      bestOptionId: best?.id || "ppa-onsite",
      reason: `Based on ${hotel.city}'s solar irradiance of ${nasa.solarIrradiance} kWh/m²/day and current grid tariff of ${tariffDisplay}/unit, this option delivers the strongest financial return for your property. The combination of state incentives in ${hotel.state} and favourable economics makes this the optimal starting point. This recommendation balances financial return with implementation complexity appropriate for a ${hotel.ownership.toLowerCase()} property.`,
      secondBestOptionId: "ppa-onsite",
      watchOutFor: "Ensure roof structural assessment is completed before committing to system size.",
    };
    return NextResponse.json(sanitizeObjectCurrency(fallback, symbol, rate));
  }
}
