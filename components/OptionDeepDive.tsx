"use client";

import { useEffect, useState, useCallback } from "react";
import { OptionResult, Hotel, StateData } from "@/lib/financialModel";
import { formatPct, formatTonnes } from "@/lib/formatters";
import { formatMoney, CurrencyCode, RATES, SYMBOLS } from "@/lib/currency";
import SavingsChart, { LoanDisplayParams } from "./SavingsChart";
import Tooltip from "./Tooltip";
import VendorConnectBox from "./VendorConnectBox";
import LoanCalculator from "./LoanCalculator";

interface ProcurementGuide {
  steps: { number: number; title: string; description: string }[];
  typicalTimeline: string;
  negotiatingPoints: string[];
  redFlag: string;
}

interface Incentive {
  name: string;
  applicableTo: string[];
  amount: string;
  savingsINR?: number;
}

interface Props {
  option: OptionResult;
  hotel: Hotel;
  state: StateData;
  incentives: Incentive[];
  currency: CurrencyCode;
  selectedSolarLabel?: string;  // Change 7: e.g. "1,500 – 3,000 sqm"
  onBack: () => void;
}

// Options that need vendor connect
const NEEDS_VENDOR = ["onsite-owned", "offsite-owned", "ppa-onsite", "ppa-offsite"];
// Options that get loan calculator (Change 10)
const NEEDS_LOAN_CALC = ["onsite-owned", "offsite-owned"];

// Change 6d: plain English — no card title, 2 bullets only
function PlainEnglishBullets({ option, state, currency, selectedSolarLabel }: { option: OptionResult; state: StateData; currency: CurrencyCode; selectedSolarLabel?: string }) {
  const tariff = state.commercialTariffPerUnit;
  const sym = SYMBOLS[currency];
  const rate = RATES[currency];
  let bullets: string[] = [];
  if (option.id === "onsite-owned") {
    // Change 6C: first bullet mentions solar space if available
    const solarNote = selectedSolarLabel ? ` using ${selectedSolarLabel} of solar space` : "";
    bullets = [
      `Invest ${formatMoney(option.netCapex, currency)}${solarNote} — government covers ${formatMoney(option.totalIncentives, currency)} in incentives`,
      `Bill drops by ${formatMoney(option.yr1Saving, currency)}/year. Recovered in ${option.paybackLabel}.`,
    ];
  } else if (option.id === "offsite-owned") {
    bullets = [
      `Invest ${formatMoney(option.netCapex, currency)} (land assumed leased — see note) — government covers ${formatMoney(option.totalIncentives, currency)} in incentives`,
      `Bill drops by ${formatMoney(option.yr1Saving, currency)}/year. Recovered in ${option.paybackLabel}.`,
    ];
  } else if (option.id === "ppa-onsite" || option.id === "ppa-offsite") {
    // Change 5: currency-aware PPA tariff display
    const ppaTariffDisplay = `${sym}${((option.ppaTariff ?? 0) * rate).toFixed(2)}`;
    const gridTariffDisplay = `${sym}${(tariff * rate).toFixed(2)}`;
    bullets = [
      `Zero investment — developer installs at no cost`,
      `Pay ${ppaTariffDisplay}/unit vs ${gridTariffDisplay}/unit — saving ${formatMoney(option.yr1Saving, currency)}/yr`,
    ];
  } else if (option.id === "green-tariff") {
    bullets = [
      `One form with your DISCOM — immediate RE100 compliance`,
      `Additional cost: ${formatMoney(Math.abs(option.yr1Saving), currency)}/year`,
    ];
  } else {
    bullets = [
      `Buy certificates on IEX/PXIL — no physical change`,
      `Annual cost: ${formatMoney(Math.abs(option.yr1Saving), currency)} for RE100 compliance`,
    ];
  }
  return (
    <div className="rounded-xl p-4 border-l-4 border-[#185FA5]" style={{ background: "#E6F1FB" }}>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
            <span className="text-[#185FA5] font-bold mt-0.5 flex-shrink-0">✓</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OptionDeepDive({ option, hotel, state, incentives, currency, selectedSolarLabel, onBack }: Props) {
  const [guide, setGuide] = useState<ProcurementGuide | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(true);
  // Change 10: loan params for chart
  const [loanParams, setLoanParams] = useState<LoanDisplayParams | null>(null);

  const handleLoanParamsChange = useCallback((params: LoanDisplayParams | null) => {
    setLoanParams(params);
  }, []);

  const now = new Date();
  const fyEndYear = now.getMonth() < 3 ? now.getFullYear() : now.getFullYear() + 1;
  const fyEnd = new Date(fyEndYear, 2, 31);
  const monthsLeft = Math.max(0, Math.ceil((fyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const fyOpportunityCost = option.yr1Saving > 0 ? Math.round((option.yr1Saving / 12) * monthsLeft) : 0;

  const co2Tonnes = option.co2AvoidedTonnes;
  const co2PctReduction = option.co2ReductionPct;
  const flightsEquivalent = Math.round(co2Tonnes / 0.255);
  const totalIncentiveINR = option.totalIncentives;
  const incentivePct = option.grossCapex > 0 ? (totalIncentiveINR / option.grossCapex) * 100 : 0;
  const appliedIncentives = incentives.filter((inc) => inc.applicableTo.includes(option.id));
  const isCapex = option.track === "ownership";
  const isOffsite = option.id === "offsite-owned";

  useEffect(() => {
    setLoadingGuide(true);
    setLoanParams(null);
    fetch("/api/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel, state,
        selectedOption: { label: option.label },
        calculatedMetrics: { netCapex: option.netCapex, yr1Saving: option.yr1Saving, systemKw: option.systemKw },
        currency,
      }),
    })
      .then((r) => r.json())
      .then((d) => setGuide(d))
      .catch(() => setGuide(null))
      .finally(() => setLoadingGuide(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option.id]);

  const yearRows = option.cashFlows.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div className="mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-[#1D9E75] text-[#1D9E75] rounded-lg text-sm font-medium hover:bg-[#1D9E75] hover:text-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all options
        </button>
      </div>

      {/* ① Badge + name */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isCapex ? "bg-blue-100 text-[#185FA5]" : "bg-teal-100 text-[#0F6E56]"
        }`}>
          {isCapex ? "Ownership option" : "Zero-investment option"}
        </span>
        <h2 className="text-xl font-bold text-gray-900">{option.label}</h2>
      </div>

      {/* ② Plain English bullets */}
      <PlainEnglishBullets option={option} state={state} currency={currency} selectedSolarLabel={selectedSolarLabel} />

      {/* ③ Incentive strip */}
      {isCapex && totalIncentiveINR > 0 && (
        <div className="bg-white border-l-4 border-[#1D9E75] rounded-xl p-4 shadow-sm flex flex-wrap gap-6">
          <div>
            <div className="text-[20px] font-bold text-[#1D9E75]">{formatMoney(totalIncentiveINR, currency)}</div>
            <div className="text-xs text-gray-500">in incentives</div>
          </div>
          <div>
            <div className="text-[20px] font-bold text-[#1D9E75]">{incentivePct.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">capex reduction</div>
          </div>
          {option.paybackYears && option.grossPaybackYears && (
            <div>
              <div className="text-[20px] font-bold text-[#1D9E75]">
                {option.paybackYears.toFixed(1)} yrs
                <span className="text-sm text-gray-400 font-normal ml-1">vs {option.grossPaybackYears.toFixed(1)} without</span>
              </div>
              <div className="text-xs text-gray-500">payback with incentives</div>
            </div>
          )}
        </div>
      )}

      {/* ④ Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Annual savings",
            tooltip: "How much less you pay for electricity each year as % of your current bill.",
            value: option.yr1Saving < 0 ? `+${formatMoney(Math.abs(option.yr1Saving), currency)}` : formatMoney(option.yr1Saving, currency),
            note: option.yr1Saving < 0 ? "extra cost/yr" : "/year",
            subNote: null as string | null,
            color: option.yr1Saving >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]",
          },
          {
            label: "Net investment",
            // Change 8C: offsite gets specific tooltip about land
            tooltip: isOffsite
              ? "Investment covers plant construction and grid connection. Land is assumed leased — purchase cost not included."
              : "Your actual cost after all government subsidies, tax benefits and GST credits.",
            value: formatMoney(option.netCapex, currency),
            note: option.netCapex > 0 ? "after incentives" : "no upfront cost",
            // Change 7: solar space note for onsite; Change 8A: land note for offsite
            subNote: option.id === "onsite-owned" && selectedSolarLabel
              ? `📐 Sized for ${selectedSolarLabel} solar space`
              : isOffsite
              ? `Excludes land cost — assumes leased land or RE zone allocation at ${formatMoney(0, currency)}–${formatMoney(200_000, currency)}/acre/year`
              : null,
            color: "text-gray-900",
          },
          {
            label: "Payback",
            tooltip: "Years until savings repay your investment. Pure profit after this point.",
            value: option.paybackLabel,
            note: option.irr !== null ? `IRR: ${formatPct(option.irr * 100)}` : "",
            subNote: null,
            color: "text-gray-900",
          },
          {
            label: "Energy offset",
            tooltip: "Share of your hotel's electricity covered by renewable energy.",
            value: `${option.energyOffsetPct.toFixed(0)}%`,
            note: "of consumption",
            subNote: null,
            color: "text-[#1D9E75]",
          },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              {m.label}<Tooltip text={m.tooltip} />
            </div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            {m.note && <div className="text-xs text-gray-400 mt-0.5">{m.note}</div>}
            {/* Change 7 + 8A: sub-note italic */}
            {m.subNote && (
              <div className="text-[11px] text-gray-400 italic mt-1" style={{ wordWrap: "break-word" }}>
                {m.subNote}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ⑤ Unrealised savings */}
      {fyOpportunityCost > 0 && (
        <div className="p-4 rounded-xl border flex items-center gap-2" style={{ background: "#FAEEDA", borderColor: "#F0D0A0" }}>
          <Tooltip text="Savings missed by not switching yet. Every month of delay has a cost." />
          <span className="text-sm text-amber-900 font-medium">
            {formatMoney(fyOpportunityCost, currency)} in missed savings before 31 March {fyEndYear}.
          </span>
        </div>
      )}

      {/* Change 10: Loan calculator — only for ownership options */}
      {isCapex && NEEDS_LOAN_CALC.includes(option.id) && option.netCapex > 0 && option.cashFlows.length > 0 && (
        <LoanCalculator
          netCapex={option.netCapex}
          cashFlows={option.cashFlows}
          upfrontIrr={option.irr}
          upfrontPayback={option.paybackYears}
          currency={currency}
          onLoanParamsChange={handleLoanParamsChange}
        />
      )}

      {/* ⑥ Chart */}
      {isCapex && option.cashFlows.length > 0 && option.netCapex > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-4">20-year investment vs savings</h4>
          <SavingsChart
            cashFlows={option.cashFlows}
            paybackYears={option.paybackYears}
            netCapex={option.netCapex}
            yr1Saving={option.yr1Saving}
            currency={currency}
            loanParams={loanParams}
          />
        </div>
      )}

      {/* Zero-capex: text only */}
      {!isCapex && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">
            <strong>No investment required.</strong>{" "}
            Annual impact:{" "}
            <span className={option.yr1Saving < 0 ? "text-[#E24B4A] font-bold" : "text-[#1D9E75] font-bold"}>
              {option.yr1Saving < 0 ? `+${formatMoney(Math.abs(option.yr1Saving), currency)} cost` : `${formatMoney(option.yr1Saving, currency)} saving`}
            </span>/year.
            {/* Change 5: currency-aware PPA rate display */}
            {option.id.startsWith("ppa") && (
              <span className="text-gray-500"> Rate fixed at {SYMBOLS[currency]}{((option.ppaTariff ?? 0) * RATES[currency]).toFixed(2)}/unit while grid tariffs rise.</span>
            )}
          </div>
        </div>
      )}

      {/* ⑦ Cashflow table */}
      {yearRows.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">Year-by-year (Years 1–10)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Year</th>
                  <th className="text-right py-2 font-medium">Annual saving</th>
                  <th className="text-right py-2 font-medium">Cumulative</th>
                  <th className="text-right py-2 font-medium">Net position</th>
                </tr>
              </thead>
              <tbody>
                {yearRows.map((row) => (
                  <tr key={row.year} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-700">Yr {row.year}</td>
                    <td className={`py-1.5 text-right font-medium ${row.cashFlow >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]"}`}>
                      {formatMoney(row.cashFlow, currency)}
                    </td>
                    <td className="py-1.5 text-right text-gray-700">{formatMoney(Math.abs(row.cumulative), currency)}</td>
                    <td className={`py-1.5 text-right font-semibold ${row.netPosition >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]"}`}>
                      {row.netPosition >= 0 ? "+" : ""}{formatMoney(row.netPosition, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⑧ Incentives */}
      {isCapex && appliedIncentives.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">Incentives applied</h4>
          <div className="space-y-2">
            {appliedIncentives.map((inc, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{inc.name}</span>
                <span className="text-sm font-semibold text-[#1D9E75]">{inc.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change 8B: land cost note for offsite PV */}
      {isOffsite && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-2">
          <span className="text-amber-500 flex-shrink-0">ℹ</span>
          <span className="text-xs text-amber-800">
            <strong>Land cost not included:</strong> Land is typically leased (not purchased) in government RE zones — this is not included in the investment figure above. Budget up to {formatMoney(200_000, currency)}/acre/year additionally.
          </span>
        </div>
      )}

      {/* ⑨ Environmental */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">Environmental impact</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-[#1D9E75]">{formatTonnes(co2Tonnes)}</div>
            <div className="text-xs text-gray-500">CO₂ avoided/year</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#1D9E75]">{co2PctReduction.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">from baseline</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#1D9E75]">{flightsEquivalent.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-500">DEL–BOM flights</div>
          </div>
        </div>
      </div>

      {/* ⑩ Procurement Guide — Change 4: FULL text, no truncation */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-4">Procurement Guide</h4>
        {loadingGuide ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : guide ? (
          <div className="space-y-4">
            <div>
              {guide.steps.map((step) => (
                <div key={step.number} className="flex gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#1D9E75] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step.number}</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{step.title}</div>
                    {/* Change 4: FULL description — no w() truncation */}
                    <div className="text-xs text-gray-600 mt-0.5 leading-relaxed" style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline: <span className="font-medium text-gray-700">{guide.typicalTimeline}</span>
            </div>
            {guide.negotiatingPoints?.length > 0 && (
              <ul className="space-y-1.5">
                {guide.negotiatingPoints.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5" style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
                    <span className="text-[#185FA5] flex-shrink-0">→</span>
                    {/* Change 4: FULL text — no w() truncation */}
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            {guide.redFlag && (
              /* Change 4: full red flag — no w() truncation, no max-height, no overflow:hidden */
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-2" style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
                <span className="text-amber-500 flex-shrink-0">⚠</span>
                <span className="text-xs text-amber-800">{guide.redFlag}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Could not load guide. Check your API key.</p>
        )}
      </div>

      {/* Vendor section */}
      {NEEDS_VENDOR.includes(option.id) && (
        <VendorConnectBox city={hotel.city} />
      )}

      {option.id === "green-tariff" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">How to get started</h4>
          <p className="text-sm text-gray-700">
            To switch to a green tariff, contact your DISCOM directly:{" "}
            <strong>{state.discom}</strong>. No third-party vendor needed.
          </p>
        </div>
      )}

      {option.id === "eac" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-3">Where to buy RECs</h4>
          <p className="text-sm text-gray-700 mb-2">Purchase RECs directly — no vendor required.</p>
          <div className="flex gap-3">
            <a href="https://www.iexindia.com" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-[#185FA5] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              IEX India ↗
            </a>
            <a href="https://www.pxil.co.in" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-[#185FA5] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              PXIL ↗
            </a>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex gap-3 justify-end pb-4">
        <button className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Download PDF</button>
        <button className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Share via WhatsApp</button>
      </div>
    </div>
  );
}
