"use client";

import { Hotel } from "@/lib/financialModel";
import { formatMoney, CurrencyCode } from "@/lib/currency";

interface Props {
  hotel: Hotel;
  currency?: CurrencyCode;
}

export default function BaselineStrip({ hotel, currency = "INR" }: Props) {
  const annualBill = hotel.monthlyElectricityBillINR * 12;
  const co2Tonnes = hotel.emissionsKgCO2e / 1000;
  const costPerRoomNight = hotel.roomNights > 0 ? annualBill / hotel.roomNights : 0;
  const occupancyPct = (hotel.roomNights / (hotel.rooms * 365)) * 100;

  const cards = [
    {
      label: "Current annual electricity spend",
      value: formatMoney(annualBill, currency),
      color: "#E24B4A",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      estimated: hotel.billEstimated,
    },
    {
      label: "Current CO₂ footprint",
      value: co2Tonnes >= 1000
        ? `${(co2Tonnes / 1000).toFixed(1)} kt CO₂/yr`
        : `${co2Tonnes.toFixed(0)} t CO₂/yr`,
      color: "#BA7517",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      estimated: false,
    },
    {
      label: "Energy cost per room per night",
      value: formatMoney(costPerRoomNight, currency),
      color: "#185FA5",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18M5 7v10M19 7v10" />
        </svg>
      ),
      estimated: hotel.billEstimated,
    },
    {
      label: "Occupancy rate",
      value: `${occupancyPct.toFixed(0)}%`,
      color: "#1D9E75",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      estimated: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div style={{ color: c.color }}>{c.icon}</div>
            {c.estimated && (
              <span className="px-1 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Est.</span>
            )}
          </div>
          <div className="text-2xl font-bold leading-tight" style={{ color: c.color, fontSize: 22 }}>
            {c.value}
          </div>
          <div className="text-xs text-gray-500 mt-1 leading-tight">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
