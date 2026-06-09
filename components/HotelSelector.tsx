"use client";

import { Hotel, StateData } from "@/lib/financialModel";
import { useState } from "react";
import { formatMoney, CurrencyCode, RATES, SYMBOLS } from "@/lib/currency";

interface Props {
  hotels: Hotel[];
  states: StateData[];
  initialCurrency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onSelect: (hotel: Hotel, hasSolarSpace: boolean, solarLabel: string) => void;
}

const CURRENCIES = Object.keys(RATES) as CurrencyCode[];

// Change 1: 5 solar range options — "No space" removed
const SOLAR_OPTIONS = [
  { label: "Up to 100 sqm",      midpoint: 75 },
  { label: "100 – 500 sqm",      midpoint: 300 },
  { label: "500 – 1,500 sqm",    midpoint: 1000 },
  { label: "1,500 – 3,000 sqm",  midpoint: 2250 },
  { label: "3,000+ sqm",         midpoint: 4000 },
];

// Auto-match index based on hotel floorArea (updated ranges — no index 0 "No space")
function getAutoMatchIdx(sqm: number): number {
  if (sqm < 500)    return 0; // Up to 100 sqm (small property, or if floor area < 500 m² total)
  if (sqm < 2000)   return 1; // 100–500 sqm
  if (sqm < 5000)   return 2; // 500–1,500 sqm
  if (sqm < 15000)  return 3; // 1,500–3,000 sqm
  return 4;                    // 3,000+ sqm
}

const BILL_PLACEHOLDER: Record<CurrencyCode, string> = {
  INR: "e.g. 2800000 (full number, not in lakhs)",
  USD: "e.g. 33600", EUR: "e.g. 30800", GBP: "e.g. 26600",
  SGD: "e.g. 44800", AED: "e.g. 123200",
};
const BILL_HELPER: Record<CurrencyCode, string> = {
  INR: "Full number only — e.g. 2800000 for 28 lakhs (no commas)",
  USD: "e.g. $33,600 per month", EUR: "e.g. €30,800 per month",
  GBP: "e.g. £26,600 per month", SGD: "e.g. S$44,800 per month",
  AED: "e.g. AED 123,200 per month",
};

export default function HotelSelector({ hotels, states, initialCurrency, onCurrencyChange, onSelect }: Props) {
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [billOverride, setBillOverride] = useState("");
  const [billUpdated, setBillUpdated] = useState(false);
  const [manualIdx, setManualIdx] = useState<number | null>(null);
  const [autoMatchIdx, setAutoMatchIdx] = useState<number | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);

  const byCity = hotels.reduce<Record<string, Hotel[]>>((acc, h) => {
    acc[h.city] = acc[h.city] || [];
    acc[h.city].push(h);
    return acc;
  }, {});
  const sortedCities = Object.keys(byCity).sort();

  const stateData = selected ? states.find((s) => s.state === selected.state) : null;
  const irradiance = stateData?.solarIrradianceKwhM2Day || 5.0;

  const effectiveIdx = manualIdx ?? autoMatchIdx;
  // Change 1: idx 0 = "Up to 100 sqm" → hasSolarSpace=false (too small for viable onsite solar)
  const hasSolarSpace = effectiveIdx !== null && effectiveIdx !== 0;
  const midpointSqm = effectiveIdx !== null ? SOLAR_OPTIONS[effectiveIdx].midpoint : 0;
  const systemKw = Math.round(midpointSqm * 0.012 * 0.40);
  const annualGenKwh = Math.round(systemKw * irradiance * 365 * 0.80);

  const canContinue = selected !== null && effectiveIdx !== null;

  function handleCurrencyChange(c: CurrencyCode) {
    setCurrency(c);
    onCurrencyChange(c);
    setBillOverride("");
    setBillUpdated(false);
  }

  function handleContinue() {
    if (!selected || effectiveIdx === null) return;
    const hotel = { ...selected };
    if (billOverride && !isNaN(Number(billOverride))) {
      hotel.monthlyElectricityBillINR = Math.round(Number(billOverride) / RATES[currency]);
      hotel.billEstimated = false;
    }
    const solarLabel = SOLAR_OPTIONS[effectiveIdx].label;
    onSelect(hotel, hasSolarSpace, solarLabel);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-base font-semibold text-[#1E1E1E]">AI Dashboard</span>
          <span className="text-xs text-gray-400">RE Strategy Tool · India</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3DE] text-[#1D9E75] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
            Powered by NASA POWER
          </div>
          {/* Change 5: full title */}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Find your Renewable Energy Path</h1>
        </div>

        <div className="w-full max-w-lg space-y-5">
          {/* Hotel dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select your property</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all"
              value={selected?.id || ""}
              onChange={(e) => {
                const h = hotels.find((x) => x.id === e.target.value) || null;
                setSelected(h);
                setBillOverride("");
                setBillUpdated(false);
                setManualIdx(null);
                setAutoMatchIdx(h ? getAutoMatchIdx(h.floorAreaSqm) : null);
              }}
            >
              <option value="">Choose a hotel…</option>
              {sortedCities.map((city) => (
                <optgroup key={city} label={city}>
                  {byCity[city].map((h) => (
                    <option key={h.id} value={h.id}>{h.name} · {h.rooms} rooms</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Currency pills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <button key={c} onClick={() => handleCurrencyChange(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    currency === c ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {SYMBOLS[c]} {c}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Conversion rates are approximate</p>
          </div>

          {/* Hotel card + bill */}
          {selected && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selected.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{selected.city}, {selected.state}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">{selected.rooms} rooms</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">{selected.ownership}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                      Est. annual bill
                      {selected.billEstimated && !billUpdated && (
                        <span className="px-1 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Est.</span>
                      )}
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {formatMoney(selected.monthlyElectricityBillINR * 12, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {selected.billEstimated && !billUpdated && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                    <div className="flex-1">
                      <p className="text-xs text-amber-800 font-medium">Bill estimated — update for accuracy</p>
                      <div className="mt-2 flex gap-2 items-center">
                        <span className="text-xs text-amber-700 font-semibold">{SYMBOLS[currency]}</span>
                        <input type="number" placeholder={BILL_PLACEHOLDER[currency]} value={billOverride}
                          onChange={(e) => setBillOverride(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-amber-200 rounded-lg bg-white focus:outline-none" />
                        {billOverride && (
                          <button onClick={() => setBillUpdated(true)} className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg font-medium">Update</button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{BILL_HELPER[currency]}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Change 1: 5-option solar range selector */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Solar space available at your property</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SOLAR_OPTIONS.map((opt, i) => {
                    const isManualSelected = manualIdx === i;
                    const isAutoMatch = autoMatchIdx === i && manualIdx === null;

                    let btnStyle = "";
                    if (isManualSelected) {
                      btnStyle = "bg-[#1D9E75] text-white border-transparent";
                    } else if (isAutoMatch) {
                      btnStyle = "bg-white text-[#1D9E75] border-2 border-[#1D9E75]";
                    } else {
                      btnStyle = "bg-white text-gray-500 border border-[#D1D5DB] hover:border-gray-400";
                    }

                    return (
                      <div key={i} className="flex flex-col items-center">
                        <button
                          onClick={() => setManualIdx(i)}
                          className={`px-4 py-2 rounded-full text-[13px] cursor-pointer transition-all ${btnStyle}`}
                        >
                          {opt.label}
                        </button>
                        {isAutoMatch && (
                          <span className="text-[11px] text-[#1D9E75] mt-0.5 font-medium">✓ Matches your property</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Change 3: disclaimer shown ONLY when "Up to 100 sqm" is selected */}
                {effectiveIdx === 0 && (
                  <div className="rounded-lg px-3 py-2 mb-2 text-xs" style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }}>
                    ⚠ Solar installations typically require a minimum of 100 sqm. Properties with less space may not be suitable for onsite solar — zero-investment options are recommended.
                  </div>
                )}

                {/* Feedback line — for small space, emphasise zero-investment */}
                {effectiveIdx === 0 && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    We will focus on zero-investment options for your property.
                  </p>
                )}
                {effectiveIdx !== null && effectiveIdx > 0 && systemKw > 0 && (
                  <p className="text-xs text-[#1D9E75] bg-[#EAF3DE] rounded-lg px-3 py-2">
                    Estimated system: <strong>{systemKw} kWp</strong> · <strong>{annualGenKwh.toLocaleString("en-IN")} kWh/year</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <button onClick={handleContinue} disabled={!canContinue}
            className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base transition-all duration-200 hover:bg-[#178560] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
