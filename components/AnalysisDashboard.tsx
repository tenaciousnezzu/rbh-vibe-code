"use client";

import { useState } from "react";
import { Hotel, StateData, OptionResult } from "@/lib/financialModel";
import { NasaData } from "@/lib/nasaPower";
import { formatKwh } from "@/lib/formatters";
import { Track } from "./TrackSelector";
import IncentiveCards from "./IncentiveCards";
import OptionsTable from "./OptionsTable";
import BaselineStrip from "./BaselineStrip";
import OptionDeepDive from "./OptionDeepDive";

interface Incentive {
  name: string;
  type: "subsidy" | "tax_benefit" | "regulation";
  amount: string;
  howToUse: string;
  applicableTo: string[];
}

interface Recommendation {
  bestOptionId: string;
  reason: string;
  secondBestOptionId: string;
  watchOutFor: string;
}

interface Props {
  hotel: Hotel;
  state: StateData;
  nasa: NasaData;
  options: OptionResult[];
  incentives: Incentive[];
  recommendation: Recommendation | null;
  track: Track;
  onUpdateBill: (amount: number) => void;
}

export default function AnalysisDashboard({
  hotel, state, nasa, options, incentives, recommendation, track, onUpdateBill,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<OptionResult | null>(null);
  const [billInput, setBillInput] = useState("");
  const [billBannerDismissed, setBillBannerDismissed] = useState(!hotel.billEstimated);

  if (selectedOption) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OptionDeepDive
          option={selectedOption}
          hotel={hotel}
          state={state}
          incentives={incentives}
          onBack={() => setSelectedOption(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header strip */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="font-bold text-gray-900">{hotel.name}</div>
            <div className="text-sm text-gray-500">{hotel.city}, {hotel.state}</div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-gray-600">{hotel.rooms} rooms</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">{formatKwh(hotel.annualElectricityKwh)}/year</span>
            <span className="text-gray-400">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-700">Solar</span>
              <span className="font-bold text-gray-900">{nasa.solarIrradiance.toFixed(1)} kWh/m²/d</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${nasa.source === "live" ? "bg-[#EAF3DE] text-[#1D9E75]" : "bg-amber-100 text-amber-700"}`}>
                {nasa.source === "live" ? "Live" : "Estimated"}
              </span>
            </div>
            <span className="text-gray-400">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-700">Wind</span>
              <span className="font-bold text-gray-900">{nasa.windSpeed.toFixed(1)} m/s</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${nasa.source === "live" ? "bg-[#EAF3DE] text-[#1D9E75]" : "bg-amber-100 text-amber-700"}`}>
                {nasa.source === "live" ? "Live" : "Estimated"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estimated bill banner */}
      {hotel.billEstimated && !billBannerDismissed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <span className="text-amber-500">⚠</span>
          <div className="flex-1">
            <span className="text-sm text-amber-800">
              Electricity bill estimated from emissions data. Enter your actual monthly bill for more accurate results:
            </span>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                placeholder="Monthly bill (₹)"
                value={billInput}
                onChange={(e) => setBillInput(e.target.value)}
                className="px-3 py-1.5 text-sm border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 w-48"
              />
              <button
                onClick={() => {
                  if (billInput && !isNaN(Number(billInput))) {
                    onUpdateBill(Number(billInput));
                    setBillBannerDismissed(true);
                  }
                }}
                className="px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
              >
                Update
              </button>
            </div>
          </div>
          <button onClick={() => setBillBannerDismissed(true)} className="text-amber-400 hover:text-amber-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Section A — Incentives */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Incentives unlocked for your property</h2>
        <p className="text-sm text-gray-500 mb-4">Based on {state.state} state policy and central government schemes</p>
        {incentives.length > 0 ? (
          <IncentiveCards incentives={incentives} />
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">Loading incentives…</div>
        )}
      </div>

      {/* Section B — Options */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your renewable energy options</h2>
        <p className="text-sm text-gray-500 mb-4">Calculated for {hotel.city} · Grid tariff: ₹{state.commercialTariffPerUnit}/unit · {state.discom}</p>

        {recommendation && (
          <div className="mb-4 p-4 rounded-xl bg-[#EAF3DE] border border-[#1D9E75] border-opacity-30">
            <div className="flex items-start gap-2">
              <span className="text-[#1D9E75] text-lg">⭐</span>
              <div>
                <div className="text-sm font-semibold text-[#1D9E75] mb-1">AI Recommendation</div>
                <p className="text-sm text-gray-700">{recommendation.reason}</p>
                {recommendation.watchOutFor && (
                  <p className="mt-2 text-sm text-amber-700">
                    <span className="font-semibold">Watch out for:</span> {recommendation.watchOutFor}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <OptionsTable
          options={options}
          track={track}
          recommendedId={recommendation?.bestOptionId || "onsite-owned"}
          secondBestId={recommendation?.secondBestOptionId || "ppa-onsite"}
          hotel={hotel}
          state={state}
          onExplore={setSelectedOption}
        />
      </div>

      {/* Section C — Baseline */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Your baseline</h2>
        <BaselineStrip hotel={hotel} />
      </div>
    </div>
  );
}
