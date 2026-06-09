import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/money";
import { sanitizeObjectCurrency } from "@/lib/sanitizeCurrency";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { state, city, ownership, annualKwh, annualBill, currency = "INR" } = body;

  const curr = CURRENCIES[currency as keyof typeof CURRENCIES] ?? CURRENCIES.INR;
  const { symbol, rate } = curr;

  const annualBillDisplay = `${symbol}${((annualBill || 0) * rate / 100_000).toFixed(1)}L`;

  const systemPrompt = `CRITICAL: The user's currency is ${currency} (symbol: ${symbol}). Use ONLY ${symbol} for ALL monetary values. NEVER use a different currency symbol.`;

  const prompt = `You are an expert in India's renewable energy policy. Return exactly 4 incentives/subsidies available for a hotel in ${city}, ${state} (${ownership} hotel).

Hotel details:
- Annual electricity consumption: ${Math.round(annualKwh / 1000)} MWh
- Annual electricity bill: ${annualBillDisplay}
- Ownership type: ${ownership}

Return a JSON array of exactly 4 incentives. Each incentive must have:
- name: string (concise name)
- type: "subsidy" | "tax_benefit" | "regulation"
- amount: string (e.g., "${symbol}2,000/kW" or "80% accelerated depreciation" or "${symbol}1.5/W")
- howToUse: string (1-2 sentences, plain English, actionable)
- applicableTo: array of option IDs from ["onsite-owned", "offsite-owned", "ppa-onsite", "ppa-offsite", "green-tariff", "eac"]

All monetary values in 'amount' must use ${symbol}. Prioritise: state-specific subsidies for ${state}, central government MNRE schemes, tax incentives (Section 32/33IC), and any relevant regulations.

Respond with ONLY valid JSON array, no markdown, no explanation.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(text.trim());
    return NextResponse.json({ subsidies: sanitizeObjectCurrency(json, symbol, rate) });
  } catch {
    const stateSubsidyAmt = `${symbol}${(1.5 * rate).toFixed(2)}–${symbol}${(2 * rate).toFixed(2)}/W on system cost`;
    const fallback = [
      {
        name: "Accelerated Depreciation (60%)",
        type: "tax_benefit",
        amount: "60% in Year 1",
        howToUse: "Claim 60% of solar system cost as depreciation in Year 1 under Section 32 of Income Tax Act. Effectively reduces net capex by ~15% for entities in 25% tax bracket.",
        applicableTo: ["onsite-owned", "offsite-owned"],
      },
      {
        name: `${state} State Solar Subsidy`,
        type: "subsidy",
        amount: stateSubsidyAmt,
        howToUse: `Apply via the state nodal agency (RESCO/SEDA equivalent for ${state}). Submit technical proposal with load data and roof assessment.`,
        applicableTo: ["onsite-owned"],
      },
      {
        name: "GST Input Tax Credit (12%)",
        type: "tax_benefit",
        amount: "45% of 12% GST recovered",
        howToUse: "Claim ITC on solar equipment purchase (panels, inverters, BOS) if hotel is GST registered. Approximately 45% of GST paid is recoverable.",
        applicableTo: ["onsite-owned", "offsite-owned"],
      },
      {
        name: "MNRE PM-KUSUM Component C",
        type: "regulation",
        amount: "Govt-facilitated PPA rates",
        howToUse: "Approach state DISCOM to procure RE under PM-KUSUM scheme. Government-facilitated rates often lower than open market PPAs.",
        applicableTo: ["ppa-onsite", "ppa-offsite"],
      },
    ];
    return NextResponse.json({ subsidies: sanitizeObjectCurrency(fallback, symbol, rate) });
  }
}
