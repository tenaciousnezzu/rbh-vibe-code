"use client";

import { useState } from "react";
import { formatMoney, CurrencyCode } from "@/lib/currency";

export interface Incentive {
  name: string;
  type: "subsidy" | "tax_benefit" | "regulation";
  amount: string;
  howToUse: string;
  applicableTo: string[];
  savingsINR?: number;
}

interface Props {
  incentives: Incentive[];
  state?: string;
  currency?: CurrencyCode;
}

function rewriteHeadline(name: string, state = ""): { header: string; subtext: string } {
  const n = name.toLowerCase();
  if (n.includes("accelerated depreciation") || n.includes("write off") || n.includes("section 32")) {
    return {
      header: "Write off 60% of your solar investment in Year 1",
      subtext: "Under IT Act Section 32 — reduces your effective investment by ~15% if your entity pays corporate tax at 25%",
    };
  }
  if (n.includes("subsidy") || n.includes("grant") || n.includes("capital")) {
    return {
      header: `Direct cash grant from ${state || "state"} government — no repayment ever`,
      // Change 5: removed hardcoded rupee — generic description
      subtext: `State government subsidy applied on system commissioning via the state nodal agency. Your EPC installer handles the application.`,
    };
  }
  if (n.includes("gst") || n.includes("input tax")) {
    return {
      header: "Recover 45% of GST paid on all solar equipment",
      subtext: "Claim on your next GST return. Applies to panels, inverters, mounting structures. Requires GST registration.",
    };
  }
  if (n.includes("net meter") || n.includes("open access") || n.includes("kusum") || n.includes("banking") || n.includes("regulation")) {
    return {
      header: "Sell unused solar power back to the grid",
      subtext: `Units generated beyond your consumption are credited to your bill. Approved for commercial rooftop installations in ${state || "your state"}.`,
    };
  }
  return { header: name, subtext: "" };
}

export default function IncentiveCards({ incentives, state, currency = "INR" }: Props) {
  const [open, setOpen] = useState(false);

  if (incentives.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75]">
            Incentives unlocked for your property
          </span>
          {!open && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {incentives.length} incentives — tap to see full breakdown
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incentives.map((inc, i) => {
              const { header, subtext } = rewriteHeadline(inc.name, state);
              return (
                <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="font-bold text-sm text-gray-900 mb-1 leading-snug">{header}</div>
                  {subtext && <div className="text-xs text-gray-500 mb-2 leading-relaxed">{subtext}</div>}
                  <div className="text-2xl font-bold text-[#1D9E75] mb-2">{inc.amount}</div>
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">How to claim: </span>
                    {inc.howToUse}
                  </div>
                  {/* Change 5: use formatMoney instead of formatINR */}
                  {inc.savingsINR && inc.savingsINR > 0 && (
                    <div className="text-xs text-[#1D9E75] font-medium border-t border-[#1D9E75]/20 pt-2 mt-2">
                      ✓ Saves you {formatMoney(inc.savingsINR, currency)} — already reflected in all figures on this page
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
