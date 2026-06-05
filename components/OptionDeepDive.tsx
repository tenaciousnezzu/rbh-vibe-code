"use client";

import { useEffect, useState } from "react";
import { OptionResult, Hotel, StateData } from "@/lib/financialModel";
import { formatINR, formatPct, formatTonnes } from "@/lib/formatters";
import SavingsChart from "./SavingsChart";

interface ProcurementGuide {
  steps: { number: number; title: string; description: string }[];
  vendorsToContact: string[];
  typicalTimeline: string;
  negotiatingPoints: string[];
  redFlag: string;
}

interface Props {
  option: OptionResult;
  hotel: Hotel;
  state: StateData;
  incentives: { name: string; applicableTo: string[]; amount: string }[];
  onBack: () => void;
}

export default function OptionDeepDive({ option, hotel, state, incentives, onBack }: Props) {
  const [guide, setGuide] = useState<ProcurementGuide | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(true);

  const _annualBill = hotel.monthlyElectricityBillINR * 12; void _annualBill;
  const now = new Date();
  const fyEnd = new Date(now.getFullYear() < 4 || (now.getFullYear() === now.getFullYear() && now.getMonth() < 3) ? now.getFullYear() : now.getFullYear() + 1, 2, 31);
  const monthsLeft = Math.max(0, Math.ceil((fyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const monthlyDelayCost = option.yr1Saving > 0 ? Math.round(option.yr1Saving / 12) : 0;
  const fyOpportunityCost = monthlyDelayCost * monthsLeft;

  const co2Baseline = hotel.emissionsKgCO2e / 1000;
  const co2Reduction = option.co2AvoidedTonnes;
  const co2PctReduction = (co2Reduction / co2Baseline) * 100;
  const flightsEquivalent = Math.round(co2Reduction / 0.255);

  const appliedIncentives = incentives.filter((inc) => inc.applicableTo.includes(option.id));

  useEffect(() => {
    setLoadingGuide(true);
    fetch("/api/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel,
        state,
        selectedOption: { label: option.label },
        calculatedMetrics: {
          netCapex: option.netCapex,
          yr1Saving: option.yr1Saving,
          systemKw: option.systemKw,
        },
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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all options
      </button>

      {/* Shock line */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          Choosing <span className="text-[#1D9E75]">{option.label}</span> could save your{" "}
          {hotel.city} property{" "}
          <span className="text-[#1D9E75]">{formatINR(Math.abs(option.yr1Saving))}</span>{" "}
          {option.yr1Saving >= 0 ? "in Year 1" : "— but adds cost for compliance"}
        </p>

        {monthlyDelayCost > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            <span className="font-semibold">Every month you wait costs {formatINR(monthlyDelayCost)}.</span>{" "}
            That&apos;s {formatINR(fyOpportunityCost)} of unrealised savings before 31 March.
          </div>
        )}
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Annual saving",
            value: formatINR(Math.abs(option.yr1Saving)),
            note: option.yr1Saving < 0 ? "additional cost" : "/year",
            color: option.yr1Saving >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]",
          },
          {
            label: "Net investment",
            value: option.netCapex === 0 ? "₹0" : formatINR(option.netCapex),
            note: "after all incentives",
            color: "text-gray-900",
          },
          {
            label: "Payback period",
            value: option.paybackLabel,
            note: "",
            color: "text-gray-900",
          },
          {
            label: "IRR",
            value: option.irr !== null ? formatPct(option.irr * 100) : "N/A",
            note: option.irr !== null ? "FDs return ~7%" : "not applicable",
            color: option.irr !== null && option.irr > 0.15 ? "text-[#1D9E75]" : "text-gray-900",
          },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            {m.note && <div className="text-xs text-gray-400 mt-0.5">{m.note}</div>}
          </div>
        ))}
      </div>

      {/* Incentives applicable */}
      {appliedIncentives.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Incentives that apply to this option</h4>
          <div className="space-y-2">
            {appliedIncentives.map((inc, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{inc.name}</span>
                <span className="text-sm font-semibold text-[#1D9E75]">{inc.amount}</span>
              </div>
            ))}
          </div>
          {option.id === "onsite-owned" || option.id === "offsite-owned" ? (
            <p className="text-xs text-gray-400 italic mt-2">
              CAPEX assumption: ₹{option.id === "onsite-owned" ? "42" : "38"}/W for system cost basis.
            </p>
          ) : null}
        </div>
      )}

      {/* Year-by-year table */}
      {yearRows.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Year-by-year cash flows (Years 1–10)</h4>
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
                {yearRows.map((row) => {
                  const netPosition = row.cumulative - option.netCapex;
                  return (
                    <tr key={row.year} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-700">Yr {row.year}</td>
                      <td className="py-1.5 text-right text-[#1D9E75] font-medium">{formatINR(row.cashFlow)}</td>
                      <td className="py-1.5 text-right text-gray-700">{formatINR(row.cumulative)}</td>
                      <td className={`py-1.5 text-right font-semibold ${netPosition >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]"}`}>
                        {netPosition >= 0 ? "+" : ""}{formatINR(netPosition)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 20-year chart */}
      {option.cashFlows.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 text-sm">20-year cumulative savings</h4>
          <SavingsChart
            cashFlows={option.cashFlows}
            paybackYears={option.paybackYears}
            netCapex={option.netCapex}
          />
        </div>
      )}

      {/* Environmental */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Environmental impact</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-[#1D9E75]">{formatTonnes(co2Reduction)}</div>
            <div className="text-xs text-gray-500">CO₂ avoided per year</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#1D9E75]">{co2PctReduction.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">reduction from baseline</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#1D9E75]">{flightsEquivalent.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-500">Delhi–Mumbai flights equivalent</div>
          </div>
        </div>
      </div>

      {/* Procurement Guide */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4">AI Procurement Guide</h4>
        {loadingGuide ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-[#1D9E75] rounded-full animate-spin" />
            Generating step-by-step guide for {hotel.city}…
          </div>
        ) : guide ? (
          <div className="space-y-5">
            <div>
              {guide.steps.map((step) => (
                <div key={step.number} className="flex gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#1D9E75] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.number}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Vendors to contact in {hotel.city}</div>
                <ul className="space-y-1">
                  {guide.vendorsToContact.map((v, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#1D9E75] mt-0.5">•</span> {v}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Negotiating points</div>
                <ul className="space-y-1">
                  {guide.negotiatingPoints.map((p, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#185FA5] mt-0.5">→</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Typical timeline: <span className="font-medium text-gray-700">{guide.typicalTimeline}</span>
            </div>

            {guide.redFlag && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-2">
                <span className="text-amber-500 text-sm flex-shrink-0">⚠</span>
                <span className="text-xs text-amber-800">{guide.redFlag}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Could not load guide. Please ensure your API key is set.</p>
        )}
      </div>
    </div>
  );
}
