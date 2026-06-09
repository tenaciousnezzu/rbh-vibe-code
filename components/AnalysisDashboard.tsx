"use client";

import { useState } from "react";
import { Hotel, StateData, OptionResult } from "@/lib/financialModel";
import { NasaData } from "@/lib/nasaPower";
import { formatMoney, CurrencyCode, RATES, SYMBOLS } from "@/lib/currency";
import { Track } from "./TrackSelector";
import IncentiveCards, { Incentive } from "./IncentiveCards";
import OptionsTable from "./OptionsTable";
import BaselineStrip from "./BaselineStrip";
import OptionDeepDive from "./OptionDeepDive";
import Footer from "./Footer";
import Tooltip from "./Tooltip";

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
  loadingIncentives: boolean;
  loadingRecommendation: boolean;
  track: Track;
  currency: CurrencyCode;
  selectedSolarLabel?: string;
  onUpdateBill: (amount: number) => void;
  onBack: () => void;
}

function SkeletonCard({ h = "h-24" }: { h?: string }) {
  return <div className={`${h} bg-gray-100 rounded-xl animate-pulse`} />;
}

function shortRec(text: string): string {
  const ws = text.trim().split(/\s+/);
  return ws.length <= 20 ? text : ws.slice(0, 20).join(" ") + "…";
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 border border-[#1D9E75] text-[#1D9E75] rounded-lg text-sm font-medium hover:bg-[#1D9E75] hover:text-white transition-all"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

export default function AnalysisDashboard({
  hotel, state, nasa, options, incentives, recommendation,
  loadingIncentives, loadingRecommendation, track, currency, selectedSolarLabel, onUpdateBill, onBack,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<OptionResult | null>(null);
  const [billInput, setBillInput] = useState("");
  const [billBannerDismissed, setBillBannerDismissed] = useState(!hotel.billEstimated);

  const bestCapexOption = options.find((o) => o.id === "onsite-owned");
  const recommendedOption = recommendation ? options.find((o) => o.id === recommendation.bestOptionId) : null;

  // Deep dive view — only OptionDeepDive renders its own back button (no duplicate)
  if (selectedOption) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OptionDeepDive
          option={selectedOption}
          hotel={hotel}
          state={state}
          incentives={incentives}
          currency={currency}
          selectedSolarLabel={selectedSolarLabel}
          onBack={() => setSelectedOption(null)}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Single back button — top of main view */}
      <div>
        <BackBtn label="Change procurement track" onClick={onBack} />
      </div>

      {/* Hotel header strip */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="font-bold text-gray-900">{hotel.name}</div>
            <div className="text-sm text-gray-500">{hotel.city}, {hotel.state}</div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-gray-600">{hotel.rooms} rooms</span>
            <span className="text-gray-400">·</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Solar {nasa.solarIrradiance.toFixed(1)} kWh/m²/d</span>
              <Tooltip text="Solar energy your location receives daily per square metre. Higher = better solar economics." />
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${nasa.source === "live" ? "bg-[#EAF3DE] text-[#1D9E75]" : "bg-amber-100 text-amber-700"}`}>
                {nasa.source === "live" ? "Live" : "Est."}
              </span>
            </div>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">Wind {nasa.windSpeed.toFixed(1)} m/s</span>
          </div>
        </div>
      </div>

      {/* Change 1: YOUR BASELINE — first thing after header */}
      <div>
        <h2 className="text-[16px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">Your baseline</h2>
        <BaselineStrip hotel={hotel} currency={currency} />
      </div>

      {/* Estimated bill banner */}
      {hotel.billEstimated && !billBannerDismissed && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <span className="text-amber-500">⚠</span>
          <div className="flex-1 text-sm text-amber-800">
            Bill estimated — <input type="number" placeholder={`Monthly bill (${SYMBOLS[currency]})`} value={billInput}
              onChange={(e) => setBillInput(e.target.value)}
              className="inline-block w-36 px-2 py-0.5 text-xs border border-amber-200 rounded bg-white mx-1" />
            {/* Change 4: convert entered value from display currency back to INR before passing up */}
            <button onClick={() => { if (billInput && !isNaN(Number(billInput))) { onUpdateBill(Number(billInput) / RATES[currency]); setBillBannerDismissed(true); } }}
              className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Update</button>
          </div>
          <button onClick={() => setBillBannerDismissed(true)} className="text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Incentive impact strip */}
      {bestCapexOption && bestCapexOption.totalIncentives > 0 && (
        <div className="bg-white border-l-4 border-[#1D9E75] rounded-xl px-5 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <span className="font-bold text-[#1D9E75] text-base">{formatMoney(bestCapexOption.totalIncentives, currency)}</span>
            <span className="text-gray-400 text-sm">incentives</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="font-bold text-[#1D9E75] text-base">
              {bestCapexOption.grossCapex > 0 ? ((bestCapexOption.totalIncentives / bestCapexOption.grossCapex) * 100).toFixed(0) : 0}%
            </span>
            <span className="text-gray-400 text-sm">capex reduction</span>
            {bestCapexOption.paybackYears && bestCapexOption.grossPaybackYears && (
              <>
                <span className="text-gray-300 mx-1">·</span>
                <span className="font-bold text-[#1D9E75] text-base">{bestCapexOption.paybackYears.toFixed(1)} yr</span>
                <span className="text-gray-400 text-sm">payback (vs {bestCapexOption.grossPaybackYears.toFixed(1)} yr without)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Incentive cards */}
      {loadingIncentives
        ? <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        : <IncentiveCards incentives={incentives} state={state.state} currency={currency} />
      }

      {/* Options section */}
      <div>
        <h2 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-1">Your options</h2>
        {/* Change 5: use currency-aware tariff display */}
        <p className="text-sm text-gray-500 mb-4">{hotel.city} · {SYMBOLS[currency]}{(state.commercialTariffPerUnit * RATES[currency]).toFixed(2)}/unit · {state.discom}</p>

        {loadingIncentives
          ? <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} h="h-36" />)}</div>
          : <OptionsTable options={options} track={track} recommendedId={recommendation?.bestOptionId || "onsite-owned"} currency={currency} selectedSolarLabel={selectedSolarLabel} onExplore={setSelectedOption} />
        }

        {/* Green recommendation callout */}
        {!loadingRecommendation && recommendedOption && (
          <div className="mt-6 rounded-xl p-5" style={{ background: "#1D9E75" }}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="text-white font-bold text-base mb-1">
                  ⭐ Our recommendation: {recommendedOption.label}
                </div>
                <p className="text-white text-sm" style={{ opacity: 0.9 }}>{shortRec(recommendation!.reason)}</p>
              </div>
              <button onClick={() => setSelectedOption(recommendedOption)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-[#1D9E75] hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Explore this option →
              </button>
            </div>
          </div>
        )}
        {loadingRecommendation && <div className="mt-6 h-20 rounded-xl animate-pulse bg-[#1D9E75]/20" />}
      </div>

      <Footer />
    </div>
  );
}
