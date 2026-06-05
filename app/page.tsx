"use client";

import { useState, useEffect, useCallback } from "react";
import { Hotel, StateData, OptionResult, calculateAllOptions } from "@/lib/financialModel";
import { NasaData } from "@/lib/nasaPower";
import StepIndicator from "@/components/StepIndicator";
import HotelSelector from "@/components/HotelSelector";
import TrackSelector, { Track } from "@/components/TrackSelector";
import AnalysisDashboard from "@/components/AnalysisDashboard";

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

export default function Home() {
  const [step, setStep] = useState(1);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [nasa, setNasa] = useState<NasaData | null>(null);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [options, setOptions] = useState<OptionResult[]>([]);
  const [loadingApis, setLoadingApis] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/data/hotels.json").then((r) => r.json()),
      fetch("/data/states.json").then((r) => r.json()),
    ]).then(([h, s]) => {
      setHotels(h);
      setStates(s);
    });
  }, []);

  const getStateData = useCallback(
    (stateName: string) => states.find((s) => s.state === stateName) || null,
    [states]
  );

  const handleHotelSelect = useCallback(
    async (hotel: Hotel) => {
      setSelectedHotel(hotel);
      setStep(2);
      setLoadingApis(true);
      setNasa(null);
      setIncentives([]);
      setRecommendation(null);

      const stateData = getStateData(hotel.state);
      if (!stateData) { setLoadingApis(false); return; }

      const fallbackNasa: NasaData = {
        solarIrradiance: stateData.solarIrradianceKwhM2Day,
        windSpeed: 4.0,
        source: "estimated",
      };

      const [nasaRes, subsidyRes] = await Promise.allSettled([
        fetch(
          `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,WS10M&community=RE&longitude=${hotel.lng}&latitude=${hotel.lat}&format=JSON`
        )
          .then((r) => r.json())
          .then((d) => ({
            solarIrradiance: d.properties.parameter.ALLSKY_SFC_SW_DWN.ANN as number,
            windSpeed: d.properties.parameter.WS10M.ANN as number,
            source: "live" as const,
          }))
          .catch(() => fallbackNasa),
        fetch("/api/subsidies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotelId: hotel.id,
            state: hotel.state,
            city: hotel.city,
            ownership: hotel.ownership,
            annualKwh: hotel.annualElectricityKwh,
            annualBill: hotel.monthlyElectricityBillINR * 12,
          }),
        }).then((r) => r.json()),
      ]);

      const nasaData: NasaData =
        nasaRes.status === "fulfilled" ? nasaRes.value : fallbackNasa;

      const subsidiesData =
        subsidyRes.status === "fulfilled"
          ? (subsidyRes.value as { subsidies: Incentive[] }).subsidies || []
          : [];

      setNasa(nasaData);
      setIncentives(subsidiesData);

      const calcOptions = calculateAllOptions(hotel, stateData, nasaData);
      setOptions(calcOptions);

      try {
        const recRes = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotel,
            state: stateData,
            nasa: nasaData,
            calculatedOptions: calcOptions,
          }),
        });
        const rec = await recRes.json();
        setRecommendation(rec);
      } catch {
        // recommendation stays null
      }

      setLoadingApis(false);
    },
    [getStateData]
  );

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    setStep(3);
  };

  const handleUpdateBill = (amount: number) => {
    if (!selectedHotel) return;
    const updated = { ...selectedHotel, monthlyElectricityBillINR: amount, billEstimated: false };
    setSelectedHotel(updated);
    const stateData = getStateData(updated.state);
    if (stateData && nasa) {
      setOptions(calculateAllOptions(updated, stateData, nasa));
    }
  };

  const stateData = selectedHotel ? getStateData(selectedHotel.state) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {step > 1 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <StepIndicator currentStep={step} />
          </div>
        </div>
      )}

      {step === 1 && <HotelSelector hotels={hotels} onSelect={handleHotelSelect} />}

      {step === 2 && selectedHotel && (
        <TrackSelector
          hotel={selectedHotel}
          loading={loadingApis}
          nasaCity={selectedHotel.city}
          onSelect={handleTrackSelect}
        />
      )}

      {step === 3 && selectedHotel && stateData && nasa && selectedTrack && (
        <>
          <div className="border-b border-gray-100 bg-white px-8 py-4">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <div className="w-32 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 font-medium">
                Radisson Blu
              </div>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedHotel(null);
                  setSelectedTrack(null);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Start over
              </button>
            </div>
          </div>
          <AnalysisDashboard
            hotel={selectedHotel}
            state={stateData}
            nasa={nasa}
            options={options}
            incentives={incentives}
            recommendation={recommendation}
            track={selectedTrack}
            onUpdateBill={handleUpdateBill}
          />
        </>
      )}
    </div>
  );
}
