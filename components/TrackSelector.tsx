"use client";

import { Hotel } from "@/lib/financialModel";
import { useState } from "react";

export type Track = "ownership" | "zerocapex" | "both";

interface Props {
  hotel: Hotel;
  loading: boolean;
  nasaCity?: string;
  onSelect: (track: Track) => void;
}

export default function TrackSelector({ hotel, loading, nasaCity, onSelect }: Props) {
  const [selected, setSelected] = useState<Track | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-32 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 font-medium">
            Radisson Blu
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="font-semibold text-gray-900">{hotel.name}</span>
          <span className="text-gray-400 text-sm">{hotel.city}, {hotel.state}</span>
          <span className="text-gray-400 text-sm">{hotel.rooms} rooms</span>
          <span className="text-gray-400 text-sm">{hotel.ownership}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to procure renewable energy?</h2>
            <p className="text-gray-500">This shapes which options are relevant for your property.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSelected("ownership")}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                selected === "ownership"
                  ? "border-[#185FA5] bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-[#185FA5] hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected === "ownership" ? "bg-[#185FA5]" : "bg-blue-100"}`}>
                  <svg className={`w-4 h-4 ${selected === "ownership" ? "text-white" : "text-[#185FA5]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${selected === "ownership" ? "text-[#185FA5]" : "text-gray-500"}`}>Track 1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">I want to own or directly procure RE</h3>
              <p className="text-sm text-gray-500 mb-4">Higher upfront investment. Better long-term economics. Full control.</p>
              <ul className="space-y-1 mb-4">
                {["Owned Onsite PV", "Owned Offsite PV", "Physical PPA (Onsite)", "Physical PPA (Offsite)"].map((opt) => (
                  <li key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] flex-shrink-0" />
                    {opt}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-400 italic">Best for: Properties with long lease horizons and capex decision authority</div>
            </button>

            <button
              onClick={() => setSelected("zerocapex")}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                selected === "zerocapex"
                  ? "border-[#0F6E56] bg-[#EAF3DE] shadow-md"
                  : "border-gray-200 bg-white hover:border-[#0F6E56] hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected === "zerocapex" ? "bg-[#0F6E56]" : "bg-[#EAF3DE]"}`}>
                  <svg className={`w-4 h-4 ${selected === "zerocapex" ? "text-white" : "text-[#0F6E56]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${selected === "zerocapex" ? "text-[#0F6E56]" : "text-gray-500"}`}>Track 2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">I want RE with no capital investment</h3>
              <p className="text-sm text-gray-500 mb-4">Immediate compliance. No procurement complexity.</p>
              <ul className="space-y-1 mb-4">
                {["Utility Green Tariff", "Energy Attribute Certificates (EAC)"].map((opt) => (
                  <li key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] flex-shrink-0" />
                    {opt}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-400 italic">Best for: Franchised properties or fast ESG compliance needs</div>
            </button>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={() => setSelected("both")}
              className={`text-sm underline text-gray-500 hover:text-gray-800 transition-colors ${selected === "both" ? "text-gray-800 font-medium" : ""}`}
            >
              Not sure? Show me all options →
            </button>
          </div>

          {loading ? (
            <div className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-500 text-sm text-center font-medium">
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-[#1D9E75] rounded-full animate-spin" />
                {nasaCity
                  ? `Fetching live solar data for ${nasaCity}… Analysing incentives…`
                  : "Loading data…"}
              </div>
            </div>
          ) : (
            <button
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base transition-all duration-200 hover:bg-[#178560] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              See my analysis →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
