import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/money";
import { sanitizeObjectCurrency } from "@/lib/sanitizeCurrency";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { hotel, state, selectedOption, calculatedMetrics, currency = "INR" } = body;

  const curr = CURRENCIES[currency as keyof typeof CURRENCIES] ?? CURRENCIES.INR;
  const { symbol, rate } = curr;

  const netCapexDisplay   = `${symbol}${((calculatedMetrics.netCapex  || 0) * rate / 100_000).toFixed(1)}L`;
  const yr1SavingDisplay  = `${symbol}${((calculatedMetrics.yr1Saving || 0) * rate / 100_000).toFixed(1)}L/yr`;

  const systemPrompt = `You are a renewable energy procurement expert for India.
Never truncate any response. Every sentence must be complete and end with a full stop.
Do not use '...' or trail off mid-sentence. Every field in the JSON must be a complete sentence.
CRITICAL: The user's currency is ${currency} (symbol: ${symbol}, rate from INR: ${rate}). Use ONLY ${symbol} for ALL monetary values. NEVER use a different currency symbol.`;

  const prompt = `Provide a detailed implementation guide for ${hotel.name} in ${hotel.city}, ${hotel.state} choosing the "${selectedOption.label}" option.

Key metrics:
- Net investment: ${netCapexDisplay}
- Annual saving: ${yr1SavingDisplay}
- System size: ${calculatedMetrics.systemKw || 0} kW
- Hotel: ${hotel.rooms} rooms, ${hotel.ownership} property, ${hotel.city}
- State: ${state.state} — DISCOM: ${state.discom}

Return JSON with exactly these fields:
{
  "steps": [
    {"number": 1, "title": "short title (3-5 words)", "description": "2-3 complete sentences with actionable detail. Must end with a full stop."},
    ... (4-5 steps total)
  ],
  "vendorsToContact": ["Vendor 1 (speciality)", "Vendor 2 (speciality)", "Vendor 3 (speciality)"],
  "typicalTimeline": "e.g. 4-6 months from signing to commissioning",
  "negotiatingPoints": ["one complete sentence per point ending with full stop.", "another complete sentence ending with full stop.", "another complete sentence ending with full stop."],
  "redFlag": "one complete sentence, maximum 25 words, describing the single biggest risk. Must end with a full stop and must not be truncated."
}

All monetary values must use ${symbol}. Make vendors realistic for ${hotel.city} / ${hotel.state} region. Respond with ONLY valid JSON, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(text.trim());
    return NextResponse.json(sanitizeObjectCurrency(json, symbol, rate));
  } catch {
    const omRate = `${symbol}${(0.45 * rate).toFixed(2)}–${symbol}${(0.5 * rate).toFixed(2)}/kWh`;
    return NextResponse.json(sanitizeObjectCurrency({
      steps: [
        { number: 1, title: "Site Assessment", description: `Commission a structural and solar assessment of ${hotel.name}. Engage a MNRE-empanelled vendor for shadow analysis, roof load capacity check, and shading report. This typically takes 2–3 weeks to complete.` },
        { number: 2, title: "RFP & Vendor Selection", description: `Issue RFP to at least 3 EPC vendors in ${hotel.city}. Compare on system yield guarantee, O&M terms, and equipment brand warranties — minimum 25 years for panels and 10 years for inverters. Shortlist based on references from similar hotel projects.` },
        { number: 3, title: "Regulatory Approvals", description: `Apply for net metering connection to ${state.discom}. Typical approval takes 30–60 days. Ensure building occupancy certificate is current before submission.` },
        { number: 4, title: "Financial Closure", description: "Finalise capex funding using own equity, a green loan at 7–8%, or SIDBI RE scheme. Claim 60% accelerated depreciation in the first year to reduce effective outflow significantly." },
        { number: 5, title: "Installation & Commissioning", description: "EPC installs panels, inverters, and monitoring system over 4–8 weeks. Commissioning includes grid synchronisation test, performance verification, and handover of O&M documentation." },
      ],
      vendorsToContact: [
        `Tata Power Solar (nationwide, strong in ${state.state})`,
        `Amplus Solar (commercial rooftop specialists)`,
        `CleanMax Solar (hotel sector experience)`,
      ],
      typicalTimeline: "4–6 months from vendor selection to commissioning",
      negotiatingPoints: [
        `Lock in O&M cost at ${omRate} generated for 5 years with an annual CPI escalation cap.`,
        "Require a performance ratio guarantee of at least 80% backed by a bank guarantee.",
        "Negotiate equipment brand approval rights and insist on Tier-1 panels and inverters only.",
      ],
      redFlag: "Avoid vendors who do not provide a generation guarantee backed by a bank guarantee, as underperforming systems are common and difficult to remediate post-installation.",
    }, symbol, rate));
  }
}
