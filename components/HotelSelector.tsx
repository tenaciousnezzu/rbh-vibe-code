"use client";

import { Hotel } from "@/lib/financialModel";
import { useState } from "react";
import { formatINR } from "@/lib/formatters";

interface Props {
  hotels: Hotel[];
  onSelect: (hotel: Hotel) => void;
}

export default function HotelSelector({ hotels, onSelect }: Props) {
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [billOverride, setBillOverride] = useState("");

  const byCity = hotels.reduce<Record<string, Hotel[]>>((acc, h) => {
    acc[h.city] = acc[h.city] || [];
    acc[h.city].push(h);
    return acc;
  }, {});
  const sortedCities = Object.keys(byCity).sort();

  function handleContinue() {
    if (!selected) return;
    const hotel = { ...selected };
    if (billOverride && !isNaN(Number(billOverride))) {
      hotel.monthlyElectricityBillINR = Number(billOverride);
      hotel.billEstimated = false;
    }
    onSelect(hotel);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-32 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 font-medium">
            Radisson Blu
          </div>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">RE Strategy Tool · India</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3DE] text-[#1D9E75] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
            Powered by NASA POWER &amp; Claude AI
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            Find the right renewable energy path<br />for your property
          </h1>
          <p className="text-gray-500 text-base">
            Select your hotel to get a personalised analysis in under 60 seconds
          </p>
        </div>

        <div className="w-full max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select your property</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all"
              value={selected?.id || ""}
              onChange={(e) => {
                const h = hotels.find((x) => x.id === e.target.value) || null;
                setSelected(h);
                setBillOverride("");
              }}
            >
              <option value="">Choose a hotel…</option>
              {sortedCities.map((city) => (
                <optgroup key={city} label={city}>
                  {byCity[city].map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} · {h.rooms} rooms
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selected && (
            <div className="transition-all duration-300">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selected.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{selected.address}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">{selected.rooms} rooms</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">{selected.state}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">{selected.ownership}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Est. annual bill</div>
                    <div className="text-base font-bold text-gray-900">{formatINR(selected.monthlyElectricityBillINR * 12)}</div>
                  </div>
                </div>
              </div>

              {selected.billEstimated && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                    <div className="flex-1">
                      <p className="text-xs text-amber-800 font-medium">Electricity data estimated from emissions</p>
                      <p className="text-xs text-amber-700 mt-0.5">You can update this for more accurate results.</p>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          placeholder="Monthly bill (₹)"
                          value={billOverride}
                          onChange={(e) => setBillOverride(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        {billOverride && (
                          <button
                            className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg font-medium"
                            onClick={() => {}}
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selected}
            className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base transition-all duration-200 hover:bg-[#178560] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
