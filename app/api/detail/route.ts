import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { hotel, state, selectedOption, calculatedMetrics } = body;

  const prompt = `You are a renewable energy procurement expert for India. Provide a detailed implementation guide for ${hotel.name} in ${hotel.city}, ${hotel.state} choosing the "${selectedOption.label}" option.

Key metrics:
- Net investment: ₹${Math.round((calculatedMetrics.netCapex || 0) / 100000)} lakhs
- Annual saving: ₹${Math.round((calculatedMetrics.yr1Saving || 0) / 100000)} lakhs/yr
- System size: ${calculatedMetrics.systemKw || 0} kW
- Hotel: ${hotel.rooms} rooms, ${hotel.ownership} property, ${hotel.city}
- State: ${state.state} — DISCOM: ${state.discom}

Return JSON with exactly these fields:
{
  "steps": [
    {"number": 1, "title": "short title", "description": "2-3 sentence actionable description"},
    ... (4-5 steps total)
  ],
  "vendorsToContact": ["Vendor 1 (speciality)", "Vendor 2 (speciality)", "Vendor 3 (speciality)"],
  "typicalTimeline": "e.g. 4-6 months from signing to commissioning",
  "negotiatingPoints": ["point 1", "point 2", "point 3"],
  "redFlag": "one sentence describing the single biggest risk to watch out for"
}

Make vendors realistic for ${hotel.city} / ${hotel.state} region. Respond with ONLY valid JSON, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(text.trim());
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({
      steps: [
        { number: 1, title: "Site Assessment", description: `Commission a structural and solar assessment of ${hotel.name}. Engage a MNRE-empanelled vendor for shadow analysis, roof load capacity check, and shading report.` },
        { number: 2, title: "RFP & Vendor Selection", description: `Issue RFP to at least 3 EPC vendors in ${hotel.city}. Compare on system yield guarantee, O&M terms, and equipment brand warranties (min 25yr panel, 10yr inverter).` },
        { number: 3, title: "Regulatory Approvals", description: `Apply for net metering connection to ${state.discom}. Typical approval takes 30-60 days. Ensure building occupancy certificate is current.` },
        { number: 4, title: "Financial Closure", description: "Finalise capex funding (own equity, green loan at 7-8%, or SIDBI RE scheme). Claim 80% accelerated depreciation in first year to reduce effective outflow." },
        { number: 5, title: "Installation & Commissioning", description: "EPC installs panels, inverters, and monitoring system. Commissioning includes grid synchronisation test and handover of O&M documentation." },
      ],
      vendorsToContact: [
        `Tata Power Solar (nationwide, strong in ${hotel.state})`,
        `Amplus Solar (commercial rooftop specialists)`,
        `CleanMax Solar (hotel sector experience)`,
      ],
      typicalTimeline: "4-6 months from vendor selection to commissioning",
      negotiatingPoints: [
        "Lock in O&M cost at ₹0.4-0.5/kWh generated for 5 years with annual CPI cap",
        "Require performance ratio guarantee of ≥80% backed by bank guarantee",
        "Negotiate equipment brand approval rights — insist on Tier-1 panels only",
      ],
      redFlag: "Avoid vendors who do not provide a generation guarantee backed by a bank guarantee — underperforming systems are common and hard to remediate post-installation.",
    });
  }
}
