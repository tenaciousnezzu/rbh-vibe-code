"use client";

interface Incentive {
  name: string;
  type: "subsidy" | "tax_benefit" | "regulation";
  amount: string;
  howToUse: string;
  applicableTo: string[];
}

interface Props {
  incentives: Incentive[];
}

const typeBadge: Record<string, { label: string; cls: string }> = {
  subsidy: { label: "Subsidy", cls: "bg-green-100 text-green-700" },
  tax_benefit: { label: "Tax Benefit", cls: "bg-blue-100 text-blue-700" },
  regulation: { label: "Regulation", cls: "bg-gray-100 text-gray-600" },
};

const optionLabels: Record<string, string> = {
  "onsite-owned": "Owned Onsite",
  "offsite-owned": "Owned Offsite",
  "ppa-onsite": "PPA Onsite",
  "ppa-offsite": "PPA Offsite",
  "green-tariff": "Green Tariff",
  "eac": "EAC",
};

export default function IncentiveCards({ incentives }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {incentives.map((inc, i) => {
        const badge = typeBadge[inc.type] || typeBadge.regulation;
        return (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-sm text-gray-900 leading-tight">{inc.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1D9E75] mb-2">{inc.amount}</div>
            <div className="text-xs text-gray-500 mb-3">
              <span className="font-medium text-gray-700">How to claim: </span>
              {inc.howToUse}
            </div>
            {inc.applicableTo?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {inc.applicableTo.map((opt) => (
                  <span key={opt} className="px-2 py-0.5 rounded-full bg-[#EAF3DE] text-[#1D9E75] text-xs font-medium">
                    {optionLabels[opt] || opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
