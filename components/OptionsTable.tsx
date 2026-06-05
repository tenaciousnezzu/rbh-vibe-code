"use client";

import { OptionResult } from "@/lib/financialModel";
import { formatINR, formatPct } from "@/lib/formatters";
import { Track } from "./TrackSelector";

interface Props {
  options: OptionResult[];
  track: Track;
  recommendedId: string;
  secondBestId?: string;
  hotel?: unknown;
  state?: unknown;
  onExplore: (option: OptionResult) => void;
}

const complexityColor: Record<string, string> = {
  "Very Low": "text-green-600",
  Low: "text-green-600",
  Medium: "text-amber-600",
  High: "text-red-500",
};

export default function OptionsTable({ options, track, recommendedId, onExplore }: Props) {
  const ownershipOptions = options.filter((o) => o.track === "ownership");
  const zerocapexOptions = options.filter((o) => o.track === "zerocapex");

  const renderTable = (opts: OptionResult[], title: string) => (
    <div className="mb-8">
      <h3 className="text-base font-bold text-gray-800 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <td className="text-xs font-semibold text-gray-500 py-2 pr-4 w-36 align-bottom sticky left-0 bg-white">Metric</td>
              {opts.map((opt) => {
                const isRec = opt.id === recommendedId;
                return (
                  <th
                    key={opt.id}
                    className={`text-left py-2 px-3 pb-3 align-bottom min-w-[140px] ${isRec ? "border-l-2 border-[#1D9E75] bg-[#EAF3DE] rounded-t-lg" : ""}`}
                  >
                    <div className="flex flex-col gap-1">
                      {isRec && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1D9E75] mb-0.5">
                          ⭐ Recommended
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                      {!opt.available && (
                        <span className="text-[10px] text-amber-600 font-medium">⚠ {opt.unavailableReason}</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: "What is this",
                render: (o: OptionResult) => (
                  <span className="text-xs text-gray-500 leading-tight">{o.description.split(".").slice(0, 2).join(".") + "."}</span>
                ),
              },
              {
                label: "Capex required",
                render: (o: OptionResult) => (
                  <span className={`text-sm font-semibold ${o.netCapex === 0 ? "text-[#1D9E75]" : "text-gray-900"}`}>
                    {o.netCapex === 0 ? "₹0" : formatINR(o.netCapex)}
                  </span>
                ),
              },
              {
                label: "Capex note",
                render: (o: OptionResult) =>
                  o.id === "onsite-owned" ? <span className="text-[11px] text-gray-400 italic">₹42/W assumed</span>
                  : o.id === "offsite-owned" ? <span className="text-[11px] text-gray-400 italic">₹38/W assumed</span>
                  : <span className="text-gray-300">—</span>,
              },
              {
                label: "Annual saving %",
                render: (o: OptionResult) => (
                  <span className={`text-sm font-semibold ${o.annualSavingPct < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                    {o.available ? formatPct(o.annualSavingPct) : <span className="text-gray-300">—</span>}
                  </span>
                ),
              },
              {
                label: "Annual saving ₹",
                render: (o: OptionResult) =>
                  o.available ? (
                    <span className={`text-sm font-semibold ${o.yr1Saving < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                      {formatINR(Math.abs(o.yr1Saving))}{o.yr1Saving < 0 ? " cost" : "/yr"}
                    </span>
                  ) : <span className="text-gray-300">—</span>,
              },
              {
                label: "Tax savings",
                render: (o: OptionResult) =>
                  o.taxSaved > 0 ? (
                    <span className="text-sm text-blue-700 font-medium">{formatINR(o.taxSaved)}</span>
                  ) : <span className="text-gray-300">—</span>,
              },
              {
                label: "IRR",
                render: (o: OptionResult) =>
                  o.irr !== null ? (
                    <span className="text-sm font-semibold text-gray-900">{formatPct(o.irr * 100)}</span>
                  ) : <span className="text-gray-400 text-sm">N/A</span>,
              },
              {
                label: "Payback",
                render: (o: OptionResult) => (
                  <span className="text-sm font-semibold text-gray-900">{o.paybackLabel}</span>
                ),
              },
              {
                label: "Availability",
                render: (o: OptionResult) => (
                  <span>{o.available ? "✓ Available" : <span className="text-gray-300 text-sm">✗ Restricted</span>}</span>
                ),
              },
              {
                label: "Complexity",
                render: (o: OptionResult) => (
                  <span className={`text-sm font-medium ${complexityColor[o.complexity]}`}>{o.complexity}</span>
                ),
              },
            ].map((row) => (
              <tr key={row.label} className="border-t border-gray-100">
                <td className="text-xs text-gray-500 py-2.5 pr-4 sticky left-0 bg-white font-medium">{row.label}</td>
                {opts.map((opt) => {
                  const isRec = opt.id === recommendedId;
                  return (
                    <td
                      key={opt.id}
                      className={`py-2.5 px-3 ${isRec ? "border-l-2 border-[#1D9E75] bg-[#EAF3DE]" : ""} ${!opt.available ? "opacity-40" : ""}`}
                    >
                      {row.render(opt)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-gray-100">
              <td className="sticky left-0 bg-white" />
              {opts.map((opt) => {
                const isRec = opt.id === recommendedId;
                return (
                  <td key={opt.id} className={`py-3 px-3 ${isRec ? "border-l-2 border-b-2 border-[#1D9E75] bg-[#EAF3DE] rounded-b-lg" : ""}`}>
                    <button
                      onClick={() => opt.available && onExplore(opt)}
                      disabled={!opt.available}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isRec
                          ? "bg-[#1D9E75] text-white hover:bg-[#178560]"
                          : opt.available
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Explore →
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderZeroCapexCards = (opts: OptionResult[]) => (
    <div className="mb-8">
      <h3 className="text-base font-bold text-gray-800 mb-4">Zero Capex &amp; Compliance Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opts.map((opt) => {
          const isRec = opt.id === recommendedId;
          return (
            <div
              key={opt.id}
              className={`bg-white rounded-xl p-5 border ${isRec ? "border-l-4 border-[#1D9E75] bg-[#EAF3DE]" : "border-gray-100"} shadow-sm`}
            >
              {isRec && <div className="text-[10px] font-semibold text-[#1D9E75] mb-1">⭐ Recommended</div>}
              <div className="font-bold text-gray-900 mb-1">{opt.label}</div>
              <div className="text-xs text-gray-500 mb-3 leading-relaxed">{opt.description}</div>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Annual cost impact</span>
                  <span className={`font-semibold ${opt.yr1Saving < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                    {opt.yr1Saving < 0 ? `+${formatINR(Math.abs(opt.yr1Saving))} cost` : formatINR(opt.yr1Saving) + " saving"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Complexity</span>
                  <span className={`font-medium ${complexityColor[opt.complexity]}`}>{opt.complexity}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Capex</span>
                  <span className="font-semibold text-[#1D9E75]">₹0</span>
                </div>
              </div>
              <button
                onClick={() => onExplore(opt)}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${isRec ? "bg-[#1D9E75] text-white hover:bg-[#178560]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Explore →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {(track === "ownership" || track === "both") &&
        renderTable(ownershipOptions, "Ownership & Procurement Options")}
      {(track === "zerocapex" || track === "both") &&
        renderZeroCapexCards(zerocapexOptions)}
    </div>
  );
}
