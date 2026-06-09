"use client";

import { Hotel, OptionResult } from "@/lib/financialModel";
import { formatMoney, CurrencyCode, SYMBOLS, RATES } from "@/lib/currency";
import { formatPct } from "@/lib/formatters";
import { useEffect, useState } from "react";

export type Track = "ownership" | "zerocapex" | "both";

interface Props {
  hotel: Hotel;
  loading: boolean;
  nasaCity?: string;
  hasSolarSpace: boolean;
  recommendedOptionId?: string;
  options: OptionResult[];
  currency: CurrencyCode;
  selectedSolarLabel?: string;
  onSelect: (track: Track) => void;
  onBack?: () => void;
}

const ZEROCAPEX_IDS = ["ppa-onsite", "ppa-offsite", "green-tariff", "eac"];

const OPTION_EXPLAINERS = [
  {
    name: "Owned Onsite PV",
    text: "You buy and own solar panels installed on your property's roof or grounds.",
  },
  {
    name: "Owned Offsite PV",
    text: "You invest in a solar plant at a separate location — power is wheeled to your hotel via the grid.",
  },
  {
    name: "Physical PPA",
    text: "A developer installs solar at no cost to you — you simply buy the electricity generated at a fixed rate below your current tariff.",
  },
  {
    name: "Green Tariff",
    text: "Your electricity provider supplies certified renewable energy for a small premium over your current rate.",
  },
  {
    name: "Energy Attribute Certificates (EAC)",
    text: "You purchase certificates proving renewable energy was generated on your behalf — instant RE100 compliance, no physical change at your property.",
  },
];

export default function TrackSelector({
  hotel, loading, nasaCity, hasSolarSpace, recommendedOptionId,
  options, currency, selectedSolarLabel, onSelect, onBack,
}: Props) {
  const [selected, setSelected] = useState<Track | null>(null);

  // Change 3D: open by default for first-time visitors (localStorage)
  const [explainOpen, setExplainOpen] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem("optionsDescriptionSeen");
    if (!seen) {
      setExplainOpen(true);
      localStorage.setItem("optionsDescriptionSeen", "true");
    }
  }, []);

  useEffect(() => {
    if (!hasSolarSpace) setSelected("zerocapex");
  }, [hasSolarSpace]);

  const isZerocapexRec = recommendedOptionId ? ZEROCAPEX_IDS.includes(recommendedOptionId) : false;

  // Change 2: identify the single best ownership and zero-capex options
  const onsiteOwned  = options.find((o) => o.id === "onsite-owned");
  const offsiteOwned = options.find((o) => o.id === "offsite-owned");
  let bestOwnership: OptionResult | undefined;
  if (onsiteOwned && offsiteOwned) {
    bestOwnership = (onsiteOwned.irr ?? 0) >= (offsiteOwned.irr ?? 0) ? onsiteOwned : offsiteOwned;
  } else {
    bestOwnership = onsiteOwned || offsiteOwned;
  }

  const ppaOnsite  = options.find((o) => o.id === "ppa-onsite");
  const ppaOffsite = options.find((o) => o.id === "ppa-offsite" && o.available);
  const greenTariff = options.find((o) => o.id === "green-tariff");
  const eac         = options.find((o) => o.id === "eac");
  // Best zero-capex = best annual financial impact
  const rankedZero = [ppaOffsite, ppaOnsite, greenTariff, eac]
    .filter((o): o is OptionResult => o !== undefined && o.available !== false)
    .sort((a, b) => b.yr1Saving - a.yr1Saving);
  const bestZeroCapex = rankedZero[0];

  const sym  = SYMBOLS[currency];
  const rate = RATES[currency];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <div className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-base font-semibold text-[#1E1E1E]">AI Dashboard</span>
          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 border border-[#1D9E75] text-[#1D9E75] rounded-lg text-sm font-medium hover:bg-[#1D9E75] hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to property selection
            </button>
          )}
        </div>
      </div>

      {/* Hotel strip */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="font-semibold text-gray-900">{hotel.name}</span>
          <span className="text-gray-400 text-sm">{hotel.city}, {hotel.state}</span>
          <span className="text-gray-400 text-sm">{hotel.rooms} rooms</span>
          <span className="text-gray-400 text-sm">{hotel.ownership}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to procure renewable energy?</h2>
          </div>

          {!hasSolarSpace && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              Based on your available solar space, zero-investment options are recommended for your property.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* ── TRACK 1 ── */}
            {hasSolarSpace && (
              <div className="flex flex-col">
                <button
                  onClick={() => setSelected("ownership")}
                  className={`text-left p-6 rounded-2xl transition-all duration-200 flex-1 ${
                    selected === "ownership"
                      ? "border-2 border-[#1D9E75] bg-[#EAF3DE] shadow-md"
                      : "border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {/* Change 2: ⭐ on Track 1 when ownership is recommended */}
                  {!isZerocapexRec && recommendedOptionId && (
                    <div className="text-[10px] font-semibold text-[#1D9E75] bg-[#EAF3DE] rounded-full px-2 py-0.5 inline-block mb-2">
                      ⭐ Recommended for your property
                    </div>
                  )}
                  {isZerocapexRec && (
                    <div className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 inline-block mb-2">
                      Higher investment required
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected === "ownership" ? "bg-[#1D9E75]" : "bg-gray-100"}`}>
                      <svg className={`w-4 h-4 ${selected === "ownership" ? "text-white" : "text-gray-500"}`} fill={selected === "ownership" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${selected === "ownership" ? "text-[#1D9E75]" : "text-gray-500"}`}>Track 1</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Own the asset</h3>
                  <p className="text-sm text-gray-500 mb-4">Invest upfront. Own the plant. Best long-term returns.</p>
                  <ul className="space-y-1">
                    {["Owned Onsite PV", "Owned Offsite PV"].map((opt) => (
                      <li key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected === "ownership" ? "bg-[#1D9E75]" : "bg-gray-400"}`} />
                        {opt}
                      </li>
                    ))}
                  </ul>
                </button>

                {/* Change 2: metrics for bestOwnershipOption */}
                <div className="mt-2 px-1">
                  {loading ? (
                    <div className="h-6 w-full bg-gray-100 rounded-full animate-pulse" />
                  ) : bestOwnership ? (
                    <>
                      {/* Option name label */}
                      <div className="text-[11px] font-semibold text-[#1D9E75] mb-1.5">{bestOwnership.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {bestOwnership.irr !== null && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#EAF3DE", color: "#1D9E75" }}>
                            IRR: {formatPct(bestOwnership.irr * 100, 0)}
                          </span>
                        )}
                        {bestOwnership.paybackYears !== null && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#EAF3DE", color: "#1D9E75" }}>
                            Payback: {bestOwnership.paybackYears.toFixed(1)} yrs
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#EAF3DE", color: "#1D9E75" }}>
                          Saves: {formatPct(Math.abs(bestOwnership.annualSavingPct), 0)}/yr
                        </span>
                      </div>
                      {/* Solar note for onsite */}
                      {bestOwnership.id === "onsite-owned" && selectedSolarLabel && (
                        <div className="text-[10px] text-gray-400 mt-1">📐 Based on {selectedSolarLabel}</div>
                      )}
                      <div className="text-[10px] text-gray-400 italic mt-1">Best ownership option for your property</div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── TRACK 2 ── */}
            <div className="flex flex-col">
              <button
                onClick={() => setSelected("zerocapex")}
                className={`text-left p-6 rounded-2xl transition-all duration-200 flex-1 ${
                  selected === "zerocapex"
                    ? "border-2 border-[#1D9E75] bg-[#EAF3DE] shadow-md"
                    : "border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {/* Change 2: ⭐ on Track 2 when zerocapex is recommended */}
                {isZerocapexRec && (
                  <div className="text-[10px] font-semibold text-[#1D9E75] bg-[#EAF3DE] rounded-full px-2 py-0.5 inline-block mb-2">
                    ⭐ Recommended for your property
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected === "zerocapex" ? "bg-[#1D9E75]" : "bg-gray-100"}`}>
                    <svg className={`w-4 h-4 ${selected === "zerocapex" ? "text-white" : "text-gray-500"}`} fill={selected === "zerocapex" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${selected === "zerocapex" ? "text-[#1D9E75]" : "text-gray-500"}`}>Track 2</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Use without owning</h3>
                <p className="text-sm text-gray-500 mb-4">Zero investment. Immediate savings or compliance.</p>
                <ul className="space-y-1">
                  {["Physical PPA", "Green Tariff", "Energy Attribute Certificates"].map((opt) => (
                    <li key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected === "zerocapex" ? "bg-[#1D9E75]" : "bg-gray-400"}`} />
                      {opt}
                    </li>
                  ))}
                </ul>
              </button>

              {/* Change 2: metrics for bestZeroCapexOption */}
              <div className="mt-2 px-1">
                {loading ? (
                  <div className="h-6 w-full bg-gray-100 rounded-full animate-pulse" />
                ) : bestZeroCapex ? (
                  <>
                    {/* Option name label */}
                    <div className="text-[11px] font-semibold text-teal-700 mb-1.5">{bestZeroCapex.label}</div>
                    <div className="flex flex-wrap gap-2">
                      {/* Show yr1Saving in currency */}
                      {bestZeroCapex.yr1Saving > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#E0F2F1", color: "#0F6E56" }}>
                          Saves: {formatMoney(bestZeroCapex.yr1Saving, currency)}/yr
                        </span>
                      )}
                      {/* For PPA: show rate */}
                      {bestZeroCapex.id.startsWith("ppa") && bestZeroCapex.ppaTariff != null && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#E0F2F1", color: "#0F6E56" }}>
                          Rate: {sym}{(bestZeroCapex.ppaTariff * rate).toFixed(2)}/unit
                        </span>
                      )}
                      {/* For green tariff / eac: show annual cost */}
                      {(bestZeroCapex.id === "green-tariff" || bestZeroCapex.id === "eac") && bestZeroCapex.yr1Saving < 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          Cost: {formatMoney(Math.abs(bestZeroCapex.yr1Saving), currency)}/yr
                        </span>
                      )}
                      {/* RE100 for EAC */}
                      {bestZeroCapex.id === "eac" && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#E0F2F1", color: "#0F6E56" }}>
                          RE100: Yes
                        </span>
                      )}
                      {/* Zero investment */}
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#E0F2F1", color: "#0F6E56" }}>
                        {formatMoney(0, currency)} investment
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 italic mt-1">Best zero-investment option for your property</div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {hasSolarSpace && (
            <div className="text-center mb-6">
              <button onClick={() => onSelect("both")}
                className="text-sm text-[#1D9E75] underline hover:text-[#178560] transition-colors font-medium"
              >
                Not sure? Show me all options →
              </button>
            </div>
          )}

          {/* Change 3: prominent accordion */}
          <div className="mb-6 mt-2">
            {/* Change 3C: label above trigger */}
            <p className="text-[13px] text-gray-500 mb-2">Not familiar with these options?</p>

            {/* Change 3A: styled trigger button */}
            <div
              className="rounded-[10px] overflow-hidden"
              style={{ border: "1.5px solid #1D9E75" }}
            >
              <button
                onClick={() => setExplainOpen(!explainOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{
                  background: explainOpen ? "#E0F5EA" : "#F0FAF4",
                }}
              >
                {/* Left side: info icon + label */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                    style={{ background: "#1D9E75" }}
                  >
                    ℹ
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#1D9E75" }}>
                    Description of the available options
                  </span>
                </div>
                {/* Right side: rotating chevron */}
                <svg
                  className="w-5 h-5 transition-transform duration-200"
                  style={{ color: "#1D9E75", transform: explainOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Change 3B: content — seamless border, no top border (joins trigger) */}
              {explainOpen && (
                <div
                  style={{
                    background: "white",
                    borderTop: "1.5px solid #1D9E75",
                    padding: "16px 20px",
                    borderRadius: "0 0 10px 10px",
                  }}
                >
                  {OPTION_EXPLAINERS.map((item, i) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        padding: "12px 0",
                        borderBottom: i < OPTION_EXPLAINERS.length - 1 ? "1px solid #F3F4F6" : "none",
                        gap: "4px 8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, minWidth: 200, flexShrink: 0, color: "#1E1E1E", fontSize: 14, lineHeight: 1.5 }}>
                        {item.name}
                      </span>
                      <span style={{ margin: "0 4px", color: "#9CA3AF", flexShrink: 0, fontSize: 14, lineHeight: 1.5 }}>→</span>
                      <span style={{ color: "#6B7280", flex: "1 1 220px", fontSize: 13, lineHeight: 1.5 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="w-full py-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-200 border-t-[#1D9E75] rounded-full animate-spin" />
                <span className="text-sm text-gray-500">{nasaCity ? `Fetching solar data for ${nasaCity}…` : "Loading…"}</span>
              </div>
            </div>
          ) : (
            <button onClick={() => selected && onSelect(selected)} disabled={!selected}
              className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base transition-all duration-200 hover:bg-[#178560] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              See my analysis →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
