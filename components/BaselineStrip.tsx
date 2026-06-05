"use client";

import { Hotel } from "@/lib/financialModel";
import { formatINR, formatTonnes } from "@/lib/formatters";

interface Props {
  hotel: Hotel;
}

export default function BaselineStrip({ hotel }: Props) {
  const annualBill = hotel.monthlyElectricityBillINR * 12;
  const co2Tonnes = hotel.emissionsKgCO2e / 1000;
  const costPerRoomNight = hotel.monthlyElectricityBillINR * 12 / Math.max(hotel.roomNights, 1);
  const occupancyPct = (hotel.roomNights / (hotel.rooms * 365)) * 100;

  const chips = [
    { label: "Current annual spend", value: formatINR(annualBill) },
    { label: "Current CO₂ footprint", value: formatTonnes(co2Tonnes) + "/yr" },
    { label: "Energy cost per room-night", value: formatINR(costPerRoomNight) },
    { label: "Occupancy", value: `${occupancyPct.toFixed(0)}%` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {chips.map((c) => (
        <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className="text-xl font-bold text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
