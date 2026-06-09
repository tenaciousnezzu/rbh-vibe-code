"use client";

import { OptionResult } from "@/lib/financialModel";
import { formatPct } from "@/lib/formatters";
import { formatMoney, CurrencyCode } from "@/lib/currency";
import { Track } from "./TrackSelector";
import Tooltip from "./Tooltip";

interface Props {
  options: OptionResult[];
  track: Track;
  recommendedId: string;
  currency: CurrencyCode;
  selectedSolarLabel?: string;
  onExplore: (option: OptionResult) => void;
}

const ZEROCAPEX_IDS = ["ppa-onsite", "ppa-offsite", "green-tariff", "eac"];

// Change 8: short description per zero-capex option
const SHORT_DESC: Record<string, string> = {
  "ppa-onsite":   "Developer installs at no cost — pay per unit at below-grid rate",
  "ppa-offsite":  "Off-site solar plant wheels power to your hotel via the grid",
  "green-tariff": "Pay a small premium to your DISCOM for certified renewable energy",
  "eac":          "Buy certificates for instant RE100 / ESG compliance reporting",
};

export default function OptionsTable({ options, track, recommendedId, currency, selectedSolarLabel, onExplore }: Props) {
  const capexOptions = options.filter((o) => o.track === "ownership");
  const zerocapexOptions = options.filter((o) => o.track === "zerocapex");

  const recIsZerocapex = ZEROCAPEX_IDS.includes(recommendedId);

  // Sort zero-capex by yr1Saving descending; exclude unavailable PPA offsite
  const unavailablePPAOffsite = zerocapexOptions.find((o) => o.id === "ppa-offsite" && !o.available);
  const rankedZerocapex = zerocapexOptions
    .filter((o) => !(o.id === "ppa-offsite" && !o.available))
    .sort((a, b) => b.yr1Saving - a.yr1Saving);

  const rankColors = [
    { bg: "#1D9E75", text: "white" },
    { bg: "#EAF3DE", text: "#1D9E75" },
    { bg: "#E5E7EB", text: "#6B7280" },
    { bg: "#F3F4F6", text: "#9CA3AF" },
  ];

  const renderCapexTable = (opts: OptionResult[]) => (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className={`text-[18px] font-[500] pl-3 border-l-[3px] border-[#1D9E75] ${recIsZerocapex && track === "both" ? "text-gray-500" : "text-[#1E1E1E]"}`}>
          Ownership options
        </h3>
        {recIsZerocapex && track === "both" && (
          <span className="text-xs text-gray-400 italic">Not recommended for this property</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[460px]">
          <thead>
            <tr>
              <td className="text-xs font-semibold text-gray-400 py-2 pr-4 w-44 align-bottom sticky left-0 bg-white" />
              {opts.map((opt) => {
                const isRec = opt.id === recommendedId;
                return (
                  <th key={opt.id}
                    className={`text-left py-0 px-3 pb-0 align-bottom min-w-[170px] ${isRec ? "rounded-t-xl" : ""}`}
                    style={isRec ? { borderTop: "4px solid #1D9E75", background: "#F0FAF4" } : {}}
                  >
                    {isRec && (
                      <div className="text-center py-2">
                        <span className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold" style={{ background: "#1D9E75" }}>
                          ⭐ Best for your property
                        </span>
                      </div>
                    )}
                    <div className={`pb-3 pt-1 px-0 ${!isRec ? "pt-3" : ""}`}>
                      {/* Change 8: removed "Ownership option" badge */}
                      <span className={`text-sm font-bold ${isRec ? "text-[#1D9E75]" : "text-gray-900"}`}>{opt.label}</span>
                      {/* Change 6A: solar space note under Onsite PV column header — green italic */}
                      {opt.id === "onsite-owned" && selectedSolarLabel && (
                        <div className="text-[11px] text-[#1D9E75] italic mt-1">
                          📐 Sized for {selectedSolarLabel}
                        </div>
                      )}
                      {!opt.available && <div className="text-[10px] text-amber-600 font-medium mt-1">⚠ {opt.unavailableReason}</div>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: "Net investment",
                tooltip: "Your actual cost after all government subsidies, tax benefits and GST credits.",
                render: (o: OptionResult) => (
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{formatMoney(o.netCapex, currency)}</span>
                  </div>
                ),
              },
              {
                label: "Annual savings",
                tooltip: "How much less you pay for electricity each year as % of your current bill.",
                render: (o: OptionResult) => (
                  <div>
                    <div className={`text-lg font-bold ${o.annualSavingPct < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                      {o.available ? formatPct(Math.abs(o.annualSavingPct), 0) : "—"}
                    </div>
                    {o.available && o.yr1Saving !== 0 && (
                      <div className={`text-xs font-medium ${o.yr1Saving < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                        {formatMoney(Math.abs(o.yr1Saving), currency)}/yr
                      </div>
                    )}
                  </div>
                ),
              },
              {
                label: "Energy offset",
                tooltip: "Share of your hotel's electricity covered by renewable energy.",
                render: (o: OptionResult) => (
                  <span className={`text-sm font-semibold ${o.available ? "text-[#1D9E75]" : "text-gray-300"}`}>
                    {o.available ? formatPct(o.energyOffsetPct, 0) : "—"}
                  </span>
                ),
              },
              {
                label: "IRR",
                tooltip: "Annual % return on your investment. Above 12% is excellent. FDs return ~7%.",
                render: (o: OptionResult) =>
                  o.irr !== null
                    ? <span className="text-sm font-semibold text-gray-900">{formatPct(o.irr * 100)}</span>
                    : <span className="text-gray-400 text-sm">N/A</span>,
              },
              {
                label: "Payback",
                tooltip: "Years until savings repay your investment. Pure profit after this point.",
                render: (o: OptionResult) => (
                  <span className="text-sm font-semibold text-gray-900">{o.paybackLabel}</span>
                ),
              },
              {
                label: "Tax savings",
                tooltip: undefined as string | undefined,
                render: (o: OptionResult) =>
                  o.taxSaved > 0
                    ? <span className="text-sm text-blue-700 font-medium">{formatMoney(o.taxSaved, currency)}</span>
                    : <span className="text-gray-300">—</span>,
              },
            ].map((row) => (
              <tr key={row.label} className="border-t border-gray-100">
                <td className="text-xs text-gray-500 py-2.5 pr-4 sticky left-0 bg-white font-medium">
                  <div className="flex items-center gap-1">
                    {row.label}
                    {row.tooltip && <Tooltip text={row.tooltip} />}
                  </div>
                </td>
                {opts.map((opt) => {
                  const isRec = opt.id === recommendedId;
                  return (
                    <td key={opt.id}
                      className={`py-2.5 px-3 ${!opt.available ? "opacity-40" : ""}`}
                      style={isRec ? { background: "#F0FAF4" } : {}}
                    >
                      {row.render(opt)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Explore buttons row */}
            <tr className="border-t border-gray-100">
              <td className="sticky left-0 bg-white" />
              {opts.map((opt) => {
                const isRec = opt.id === recommendedId;
                return (
                  <td key={opt.id} className="py-3 px-3" style={isRec ? { background: "#F0FAF4", borderRadius: "0 0 12px 12px" } : {}}>
                    <button
                      onClick={() => opt.available && onExplore(opt)}
                      disabled={!opt.available}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isRec
                          ? "bg-[#1D9E75] text-white hover:bg-[#178560] shadow-sm"
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
      {/* Change 6A: footnote removed — solar note is now under column header */}
    </div>
  );

  // Change 8: zero-capex cards — single column, horizontal layout, no type badge
  const renderZeroCapexCards = (opts: OptionResult[]) => (
    <div className="mb-6">
      <h3 className={`pl-3 border-l-[3px] border-[#1D9E75] mb-1 ${
        recIsZerocapex
          ? "text-[20px] font-[600] text-[#1D9E75]"
          : "text-[18px] font-[500] text-[#1E1E1E]"
      }`}>
        Zero-investment options — use without owning
      </h3>
      <p className="text-[12px] text-gray-400 italic mb-4 pl-1">Ranked by annual financial impact — best first</p>

      {/* Change 8: single column */}
      <div className="flex flex-col gap-3">
        {opts.map((opt, rankIdx) => {
          const isRec = opt.id === recommendedId;
          const isPPA = opt.id.startsWith("ppa");
          const rankColor = rankColors[Math.min(rankIdx, rankColors.length - 1)];
          const shortDesc = SHORT_DESC[opt.id] ?? "";

          return (
            <div key={opt.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all ${
                isRec ? "border-2 border-[#1D9E75]" : "border border-gray-100"
              } ${!opt.available ? "opacity-50" : ""}`}
            >
              {isRec && (
                <div className="text-center py-1.5 text-white text-xs font-semibold" style={{ background: "#1D9E75" }}>
                  ⭐ Best for your property
                </div>
              )}

              {/* Change 8: horizontal card — left 60% / right 40% */}
              <div className="flex" style={isRec ? { background: "#F0FAF4" } : {}}>
                {/* Left section — rank badge + name + desc + annual impact */}
                <div className="flex items-start gap-3 p-4" style={{ flex: "0 0 60%" }}>
                  {/* Rank badge */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5"
                    style={{ background: rankColor.bg, color: rankColor.text }}
                  >
                    #{rankIdx + 1}
                  </div>
                  <div className="min-w-0">
                    {/* Change 8: no "Zero-investment option" teal badge */}
                    <div className={`font-bold text-sm ${isRec ? "text-[#1D9E75]" : "text-gray-900"}`}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">{shortDesc}</div>
                    {!opt.available && opt.unavailableReason && (
                      <div className="text-[10px] text-amber-600 font-medium mt-1">⚠ {opt.unavailableReason}</div>
                    )}
                    {/* Annual impact */}
                    <div className={`text-sm font-semibold mt-2 ${opt.yr1Saving < 0 ? "text-[#E24B4A]" : "text-[#1D9E75]"}`}>
                      {opt.available
                        ? (opt.yr1Saving < 0
                          ? `+${formatMoney(Math.abs(opt.yr1Saving), currency)}/yr cost`
                          : `${formatMoney(opt.yr1Saving, currency)}/yr saving`)
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Right section — chips + Explore */}
                <div
                  className="flex flex-col items-end justify-between p-4 border-l border-gray-100"
                  style={{ flex: "0 0 40%" }}
                >
                  <div className="flex flex-wrap justify-end gap-1.5 mb-3">
                    {isPPA && opt.available && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#EAF3DE", color: "#1D9E75" }}>
                        {formatPct(opt.energyOffsetPct, 0)} offset
                      </span>
                    )}
                    {/* Change 5: use formatMoney for zero capex */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#EAF3DE", color: "#1D9E75" }}>
                      {formatMoney(0, currency)} capex
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#E0F2F1", color: "#0F6E56" }}>
                      From Day 1
                    </span>
                  </div>
                  <button
                    onClick={() => opt.available && onExplore(opt)}
                    disabled={!opt.available}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all w-full text-center ${
                      isRec
                        ? "bg-[#1D9E75] text-white hover:bg-[#178560] shadow-sm"
                        : opt.available
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Explore →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Excluded PPA offsite note */}
      {unavailablePPAOffsite && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
          PPA Offsite not available in this state — open access regulations pending.
        </p>
      )}
    </div>
  );

  const showCapex = track === "ownership" || track === "both";
  const showZeroCapex = track === "zerocapex" || track === "both";

  return (
    <div>
      {showCapex && capexOptions.length > 0 && renderCapexTable(capexOptions)}
      {track === "both" && (
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">— or, use without owning —</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}
      {showZeroCapex && rankedZerocapex.length > 0 && renderZeroCapexCards(rankedZerocapex)}
    </div>
  );
}
