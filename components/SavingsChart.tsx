"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { YearData } from "@/lib/financialModel";

interface Props {
  cashFlows: YearData[];
  paybackYears: number | null;
  netCapex: number;
}

export default function SavingsChart({ cashFlows, paybackYears, netCapex }: Props) {
  const data = cashFlows.map((y) => ({
    year: `Yr ${y.year}`,
    yearNum: y.year,
    cumulative: Math.round((y.cumulative - netCapex) / 100000) / 10,
    cashFlow: Math.round(y.cashFlow / 100000) / 10,
  }));

  const paybackLine = paybackYears ? Math.round(paybackYears) : null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="prePayback" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#93B4D4" />
            <stop offset={paybackLine ? `${(paybackLine / 20) * 100}%` : "100%"} stopColor="#93B4D4" />
            <stop offset={paybackLine ? `${(paybackLine / 20) * 100}%` : "100%"} stopColor="#1D9E75" />
            <stop offset="100%" stopColor="#1D9E75" />
          </linearGradient>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#1D9E75" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={3} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v}L`}
        />
        <Tooltip
          formatter={(val) => [`₹${val} L`, "Net savings"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
        />
        {paybackLine && (
          <ReferenceLine
            x={`Yr ${paybackLine}`}
            stroke="#BA7517"
            strokeDasharray="4 4"
            label={{ value: "Investment recovered", position: "top", fontSize: 10, fill: "#BA7517" }}
          />
        )}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="url(#prePayback)"
          strokeWidth={2}
          fill="url(#areaFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
