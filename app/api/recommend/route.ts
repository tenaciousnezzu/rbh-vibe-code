import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { hotel, state, nasa, calculatedOptions } = body;

  const optionSummary = calculatedOptions
    .filter((o: { available: boolean }) => o.available)
    .map((o: { id: string; label: string; irr: number | null; paybackYears: number | null; annualSavingPct: number; netCapex: number }) =>
      `${o.label}: IRR=${o.irr ? (o.irr * 100).toFixed(1) + "%" : "N/A"}, Payback=${o.paybackYears ? o.paybackYears.toFixed(1) + "yrs" : o.id === "ppa-onsite" || o.id === "ppa-offsite" ? "Immediate" : "N/A"}, Saving=${o.annualSavingPct.toFixed(1)}%, Capex=₹${Math.round(o.netCapex / 100000)}L`
    )
    .join("\n");

  const prompt = `You are a renewable energy advisor for Indian hotels. Analyse these options for ${hotel.name} in ${hotel.city}, ${hotel.state}:

Hotel: ${hotel.rooms} rooms, ${Math.round(hotel.annualElectricityKwh / 1000)} MWh/yr, ${hotel.ownership} property
Solar irradiance: ${nasa.solarIrradiance} kWh/m²/day
Open access available: ${state.openAccessAvailable}

Options calculated:
${optionSummary}

Return JSON with exactly these fields:
{
  "bestOptionId": "<one of the option IDs>",
  "reason": "<exactly 3 sentences explaining why this is best for this specific hotel>",
  "secondBestOptionId": "<option ID>",
  "watchOutFor": "<one concise sentence about the main risk or consideration>"
}

Valid option IDs: onsite-owned, offsite-owned, ppa-onsite, ppa-offsite, green-tariff, eac

Respond with ONLY valid JSON, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(text.trim());
    return NextResponse.json(json);
  } catch {
    const best = calculatedOptions
      .filter((o: { available: boolean }) => o.available)
      .sort((a: { annualSavingPct: number }, b: { annualSavingPct: number }) => b.annualSavingPct - a.annualSavingPct)[0];
    return NextResponse.json({
      bestOptionId: best?.id || "ppa-onsite",
      reason: `Based on ${hotel.city}'s solar irradiance of ${nasa.solarIrradiance} kWh/m²/day and current grid tariff of ₹${state.commercialTariffPerUnit}/unit, this option delivers the strongest financial return for your property. The combination of state incentives in ${hotel.state} and favourable economics makes this the optimal starting point. This recommendation balances financial return with implementation complexity appropriate for a ${hotel.ownership.toLowerCase()} property.`,
      secondBestOptionId: "ppa-onsite",
      watchOutFor: "Ensure roof structural assessment is completed before committing to system size.",
    });
  }
}
