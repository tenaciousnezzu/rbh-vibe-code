"use client";

import { useState, useEffect, useCallback } from "react";
import { YearData, calculateIRR } from "@/lib/financialModel";
import { formatMoney, CurrencyCode } from "@/lib/currency";
import { formatPct } from "@/lib/formatters";
import { LoanDisplayParams } from "./SavingsChart";

interface Props {
  netCapex: number;          // INR — total net investment
  cashFlows: YearData[];     // escalating annual savings
  upfrontIrr: number | null;
  upfrontPayback: number | null;
  currency: CurrencyCode;
  onLoanParamsChange: (params: LoanDisplayParams | null) => void;
}

export default function LoanCalculator({
  netCapex, cashFlows, upfrontIrr, upfrontPayback, currency, onLoanParamsChange
}: Props) {
  const [mode, setMode] = useState<"upfront" | "loan">("upfront");
  const [loanPct, setLoanPct] = useState(70);   // % of netCapex borrowed
  const [rate, setRate] = useState(8.0);         // % per annum
  const [tenure, setTenure] = useState(7);       // years

  const loanAmt = Math.round(netCapex * loanPct / 100);
  const equityAmt = netCapex - loanAmt;

  // EMI calculation (reducing balance)
  const monthlyRate = rate / 12 / 100;
  const n = tenure * 12;
  const emi = monthlyRate > 0 && n > 0
    ? loanAmt * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1)
    : loanAmt / Math.max(n, 1);
  const annualEmi = emi * 12;
  const totalInterest = Math.max(0, emi * n - loanAmt);

  // Loan mode IRR
  const loanModeIRR = useCallback(() => {
    if (equityAmt <= 0 || cashFlows.length === 0) return null;
    const loanCashFlows = cashFlows.map((y) =>
      y.cashFlow - (y.year <= tenure ? annualEmi : 0)
    );
    return calculateIRR(equityAmt, loanCashFlows);
  }, [equityAmt, cashFlows, tenure, annualEmi]);

  // Break-even year in loan mode
  const loanBreakEven = useCallback(() => {
    if (equityAmt <= 0) return null;
    let cum = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const emiThisYear = cashFlows[i].year <= tenure ? annualEmi : 0;
      cum += cashFlows[i].cashFlow - emiThisYear;
      if (cum >= equityAmt) return cashFlows[i].year;
    }
    return null;
  }, [equityAmt, cashFlows, tenure, annualEmi]);

  const lIRR = loanModeIRR();
  const lBreakEven = loanBreakEven();
  const equityPct = Math.round(100 - loanPct);

  // Notify parent when loan params change
  useEffect(() => {
    if (mode === "loan") {
      onLoanParamsChange({ active: true, equityAmt, annualEmi, tenureYears: tenure });
    } else {
      onLoanParamsChange(null);
    }
  }, [mode, equityAmt, annualEmi, tenure, onLoanParamsChange]);

  // Reset to upfront
  function resetToUpfront() {
    setMode("upfront");
    setLoanPct(70);
    setRate(8.0);
    setTenure(7);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    background: "white",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h4 className="text-[18px] font-[500] text-[#1E1E1E] pl-3 border-l-[3px] border-[#1D9E75] mb-1">Financing your investment</h4>
      <p className="text-xs text-gray-500 mb-4 pl-4">See how a loan changes your returns</p>

      {/* Toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode("upfront")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "upfront"
              ? "bg-[#1D9E75] text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pay upfront
        </button>
        <button
          onClick={() => setMode("loan")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "loan"
              ? "bg-[#185FA5] text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Finance with a loan
        </button>
      </div>

      {mode === "upfront" ? (
        <div className="text-center py-4 text-sm text-gray-500">
          Full investment of <span className="font-semibold text-gray-800">{formatMoney(netCapex, currency)}</span> paid upfront.
          {upfrontIrr !== null && (
            <span> IRR: <span className="font-semibold text-[#1D9E75]">{formatPct(upfrontIrr * 100)}</span> · Payback: <span className="font-semibold text-gray-800">{upfrontPayback?.toFixed(1)} yrs</span>.</span>
          )}
        </div>
      ) : (
        <>
          {/* Sliders */}
          <div className="space-y-4 mb-5">
            {/* Loan amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Loan amount</label>
                <span className="text-xs font-semibold text-[#185FA5]">{formatMoney(loanAmt, currency)} ({loanPct}%)</span>
              </div>
              <input
                type="range" min={0} max={100} step={5} value={loanPct}
                onChange={(e) => setLoanPct(Number(e.target.value))}
                className="w-full accent-[#185FA5]"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Equity contribution: {formatMoney(equityAmt, currency)} ({equityPct}%)
              </p>
            </div>

            {/* Interest rate */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Annual interest rate</label>
                <input
                  type="number" min={5} max={15} step={0.5} value={rate}
                  onChange={(e) => setRate(Math.min(15, Math.max(5, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 70, textAlign: "center" }}
                />
              </div>
              <input
                type="range" min={5} max={15} step={0.5} value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-[#185FA5]"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                SIDBI green energy loans: 7–9% · Commercial RE loans: 9–12%
              </p>
            </div>

            {/* Tenure */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Loan tenure</label>
                <span className="text-xs font-semibold text-[#185FA5]">{tenure} years</span>
              </div>
              <input
                type="range" min={3} max={15} step={1} value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full accent-[#185FA5]"
              />
            </div>
          </div>

          {/* Output cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-gray-500 mb-1">Monthly EMI</div>
              <div className="text-base font-bold text-gray-900">{formatMoney(emi, currency)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-gray-500 mb-1">Total interest</div>
              <div className="text-base font-bold text-[#E24B4A]">{formatMoney(totalInterest, currency)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-gray-500 mb-1">Effective IRR</div>
              <div className="text-base font-bold text-[#1D9E75]">
                {lIRR !== null ? formatPct(lIRR * 100) : "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-gray-500 mb-1">Break-even</div>
              <div className="text-base font-bold text-gray-900">
                {lBreakEven ? `Year ${lBreakEven}` : "N/A"}
              </div>
            </div>
          </div>

          {/* Comparison strip */}
          <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
            <div className="grid grid-cols-2">
              <div className="p-3 bg-gray-50 border-r border-gray-100">
                <div className="text-[11px] font-semibold text-gray-500 mb-2">Upfront</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">IRR</span><span className="font-semibold text-[#1D9E75]">{upfrontIrr !== null ? formatPct(upfrontIrr * 100) : "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payback</span><span className="font-semibold">{upfrontPayback ? `${upfrontPayback.toFixed(1)} yrs` : "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Equity needed</span><span className="font-semibold">{formatMoney(netCapex, currency)}</span></div>
                </div>
              </div>
              <div className="p-3 bg-blue-50">
                <div className="text-[11px] font-semibold text-[#185FA5] mb-2">With loan ({loanPct}% debt)</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">IRR</span><span className="font-semibold text-[#1D9E75]">{lIRR !== null ? formatPct(lIRR * 100) : "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Break-even</span><span className="font-semibold">{lBreakEven ? `Year ${lBreakEven}` : "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Equity needed</span><span className="font-semibold text-[#185FA5]">{formatMoney(equityAmt, currency)} ({equityPct}%)</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1 mb-4 text-[11px] text-gray-400">
            <p>EMI calculated on reducing balance basis.</p>
            <p>Tax benefit on interest: interest paid on RE loans is deductible as a business expense — effective rate is rate × (1 − tax rate).</p>
            <p>Green financing options: SIDBI RE loans, REC green bonds, state nodal agency soft loans.</p>
          </div>

          <button onClick={resetToUpfront}
            className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
          >
            Reset to upfront
          </button>
        </>
      )}
    </div>
  );
}
