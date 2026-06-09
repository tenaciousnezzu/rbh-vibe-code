"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { YearData } from "@/lib/financialModel";
import { formatMoney, CurrencyCode } from "@/lib/currency";

// Optional loan display parameters — when present, chart adjusts to show equity + full cost lines
export interface LoanDisplayParams {
  active: boolean;
  equityAmt: number;   // INR — user's equity contribution
  annualEmi: number;   // INR — annual EMI payments
  tenureYears: number; // years of loan repayment
}

interface ChartDataPoint {
  name: string;
  year: number;
  savings: number;
  investment: number | null;
  fullCost: number | null;
  loanSavings: number | null;
  rawCashFlow: number;
}

interface Props {
  cashFlows: YearData[];
  paybackYears: number | null;
  netCapex: number;
  yr1Saving: number;
  currency: CurrencyCode;
  loanParams?: LoanDisplayParams | null;
}

const PROJECT_LIFE = 20;

export default function SavingsChart({ cashFlows, paybackYears, netCapex, currency, loanParams }: Props) {
  if (!cashFlows.length) return null;

  const loanActive = !!(loanParams?.active && loanParams.equityAmt > 0);
  const investmentLineValue = loanActive ? loanParams!.equityAmt : netCapex;

  // Build raw data points first (uniform type)
  const rawPoints: ChartDataPoint[] = [
    {
      name: "Yr 0",
      year: 0,
      savings: 0,
      investment: netCapex > 0 ? investmentLineValue : null,
      fullCost: loanActive ? netCapex : null,
      loanSavings: loanActive ? 0 : null,
      rawCashFlow: 0,
    },
    ...cashFlows.map((y): ChartDataPoint => ({
      name: `Yr ${y.year}`,
      year: y.year,
      savings: y.cumulative,
      investment: netCapex > 0 ? investmentLineValue : null,
      fullCost: loanActive ? netCapex : null,
      loanSavings: null, // will be filled in below
      rawCashFlow: y.cashFlow,
    })),
  ];

  // Fill in cumulative loan savings
  if (loanActive) {
    let cum = 0;
    rawPoints.forEach((d) => {
      if (d.year === 0) {
        d.loanSavings = 0;
      } else {
        const emi = d.year <= loanParams!.tenureYears ? loanParams!.annualEmi : 0;
        cum += d.rawCashFlow - emi;
        d.loanSavings = cum;
      }
    });
  }

  const maxCumSavings = cashFlows[cashFlows.length - 1]?.cumulative ?? 0;
  const maxY = Math.max(netCapex, maxCumSavings) * 1.15;

  const paybackRound = paybackYears ? Math.ceil(paybackYears) : null;
  const crossoverName = paybackRound ? `Yr ${paybackRound}` : null;
  const isPPA = netCapex === 0;

  if (process.env.NODE_ENV === "development") {
    console.log("[SavingsChart] netCapex:", netCapex, "| paybackYears:", paybackYears, "| currency:", currency);
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={rawPoints} margin={{ top: 28, right: 40, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />

          {/* Change 2+3: Y-axis uses formatMoney with selected currency — all positive */}
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatMoney(v, currency)}
            domain={[0, maxY]}
          />

          <RechartsTooltip
            formatter={(val, name) => {
              const label =
                name === "savings" ? "Cumulative savings" :
                name === "investment" ? (loanActive ? "Your equity contribution" : "Your investment") :
                name === "fullCost" ? "Full project cost" :
                name === "loanSavings" ? "Cumulative savings (loan)" :
                String(name);
              return [formatMoney(Number(val), currency), label];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
          />

          {/* Shaded areas — Change 7: no text labels on areas */}
          {crossoverName && !isPPA && (
            <ReferenceArea
              x1="Yr 0"
              x2={crossoverName}
              y1={0}
              y2={investmentLineValue}
              fill="#E24B4A"
              fillOpacity={0.06}
            />
          )}
          {crossoverName && !isPPA && (
            <ReferenceArea
              x1={crossoverName}
              x2={`Yr ${PROJECT_LIFE}`}
              y1={investmentLineValue}
              y2={maxY}
              fill="#1D9E75"
              fillOpacity={0.06}
            />
          )}

          {/* Payback crossover vertical line — Change 7: no label on line */}
          {crossoverName && !isPPA && (
            <ReferenceLine
              x={crossoverName}
              stroke="#185FA5"
              strokeDasharray="4 4"
            />
          )}

          {/* Investment line — POSITIVE flat line at netCapex (or equity in loan mode) */}
          {!isPPA && (
            <Line
              type="monotone"
              dataKey="investment"
              stroke="#E24B4A"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              name="investment"
              legendType="line"
              connectNulls
            />
          )}

          {/* Loan mode: extra dashed line at full project cost */}
          {loanActive && (
            <Line
              type="monotone"
              dataKey="fullCost"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="fullCost"
              legendType="line"
              connectNulls
            />
          )}

          {/* Loan mode: cumulative loan savings line */}
          {loanActive && (
            <Line
              type="monotone"
              dataKey="loanSavings"
              stroke="#0891B2"
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={false}
              name="loanSavings"
              legendType="line"
              connectNulls
            />
          )}

          {/* Cumulative savings line — Change 7: dots rendered without text annotations */}
          <Line
            type="monotone"
            dataKey="savings"
            stroke="#1D9E75"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#1D9E75" }}
            name="savings"
            legendType="line"
          />

          <Legend
            formatter={(value) => {
              if (value === "savings") return "Cumulative savings";
              if (value === "investment") return loanActive ? "Your equity contribution" : "Your investment (net of incentives)";
              if (value === "fullCost") return "Full project cost";
              if (value === "loanSavings") return "Cumulative savings (with loan)";
              return value;
            }}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {isPPA ? (
        <p className="text-xs text-[#1D9E75] text-center mt-2 font-medium">
          No investment required — savings begin from Day 1
        </p>
      ) : crossoverName ? (
        <p className="text-xs text-gray-400 mt-1 text-center">
          Lines cross at Year {paybackRound} — your investment is fully recovered · Green shading = net profit zone
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1 text-center">
          Investment line = net capex after all incentives · Green shading = net profit zone
        </p>
      )}
    </div>
  );
}
