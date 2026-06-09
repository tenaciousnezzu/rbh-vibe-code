"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Hotel, StateData, OptionResult, calculateAllOptions } from "@/lib/financialModel";
import { NasaData } from "@/lib/nasaPower";
import { CurrencyCode, SYMBOLS, RATES } from "@/lib/currency";
import StepIndicator from "@/components/StepIndicator";
import HotelSelector from "@/components/HotelSelector";
import TrackSelector, { Track } from "@/components/TrackSelector";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import { Incentive } from "@/components/IncentiveCards";

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
  const [loadingIncentives, setLoadingIncentives] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [hasSolarSpace, setHasSolarSpace] = useState<boolean>(true);
  const [selectedSolarLabel, setSelectedSolarLabel] = useState<string>("");

  // Keep a ref to currency so callbacks always see the latest value
  const currencyRef = useRef<CurrencyCode>(currency);
  useEffect(() => { currencyRef.current = currency; }, [currency]);

  // Change 1D: dev-mode ₹ guard — fires on every render when currency is not INR
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && currency !== "INR") {
      const bodyText = document.body.innerText;
      if (bodyText.includes(SYMBOLS.INR)) {
        console.error(
          `CURRENCY BUG: ${SYMBOLS.INR} symbol found in DOM but selected currency is ${currency}. Find and fix the hardcoded symbol.`
        );
      }
    }
  });

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

  // Called when user clicks Continue on Step 1
  const handleHotelSelect = useCallback(
    async (hotel: Hotel, solarSpace: boolean, solarLabel: string) => {
      // Read currency from ref to always get current value
      const activeCurrency = currencyRef.current;
      const activeSymbol   = SYMBOLS[activeCurrency];
      const activeRate     = RATES[activeCurrency];

      setSelectedHotel(hotel);
      setHasSolarSpace(solarSpace);
      setSelectedSolarLabel(solarLabel);
      setStep(2);
      setLoadingApis(true);
      setLoadingIncentives(true);
      setLoadingRecommendation(true);
      setNasa(null);
      setIncentives([]);
      setRecommendation(null);

      const stateData = getStateData(hotel.state);
      if (!stateData) { setLoadingApis(false); setLoadingIncentives(false); setLoadingRecommendation(false); return; }

      const fallbackNasa: NasaData = { solarIrradiance: stateData.solarIrradianceKwhM2Day, windSpeed: 4.0, source: "estimated" };

      const [nasaRes, subsidyRes] = await Promise.allSettled([
        fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,WS10M&community=RE&longitude=${hotel.lng}&latitude=${hotel.lat}&format=JSON`)
          .then((r) => r.json())
          .then((d) => ({ solarIrradiance: d.properties.parameter.ALLSKY_SFC_SW_DWN.ANN as number, windSpeed: d.properties.parameter.WS10M.ANN as number, source: "live" as const }))
          .catch(() => fallbackNasa),
        // Pass currency to subsidies API
        fetch("/api/subsidies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotelId: hotel.id, state: hotel.state, city: hotel.city,
            ownership: hotel.ownership, annualKwh: hotel.annualElectricityKwh,
            annualBill: hotel.monthlyElectricityBillINR * 12,
            currency: activeCurrency, currencySymbol: activeSymbol, currencyRate: activeRate,
          }),
        }).then((r) => r.json()),
      ]);

      const nasaData: NasaData = nasaRes.status === "fulfilled" ? nasaRes.value : fallbackNasa;
      const subsidiesData: Incentive[] = subsidyRes.status === "fulfilled" ? (subsidyRes.value as { subsidies: Incentive[] }).subsidies || [] : [];

      setNasa(nasaData);
      setIncentives(subsidiesData);
      setLoadingIncentives(false);

      const calcOptions = calculateAllOptions(hotel, stateData, nasaData);
      setOptions(calcOptions);
      setLoadingApis(false);

      try {
        // Pass currency to recommend API
        const recRes = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotel, state: stateData, nasa: nasaData, calculatedOptions: calcOptions,
            currency: activeCurrency, currencySymbol: activeSymbol, currencyRate: activeRate,
          }),
        });
        const rec = await recRes.json();
        setRecommendation(rec);
      } catch { /* stays null */ }
      setLoadingRecommendation(false);
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
    if (stateData && nasa) setOptions(calculateAllOptions(updated, stateData, nasa));
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

      {step === 1 && (
        <HotelSelector
          hotels={hotels}
          states={states}
          initialCurrency={currency}
          onCurrencyChange={setCurrency}
          onSelect={handleHotelSelect}
        />
      )}

      {step === 2 && selectedHotel && (
        <TrackSelector
          hotel={selectedHotel}
          loading={loadingApis}
          nasaCity={selectedHotel.city}
          hasSolarSpace={hasSolarSpace}
          recommendedOptionId={recommendation?.bestOptionId}
          options={options}
          currency={currency}
          selectedSolarLabel={selectedSolarLabel}
          onSelect={handleTrackSelect}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedHotel && stateData && nasa && selectedTrack && (
        <>
          <div className="border-b border-gray-100 bg-white px-8 py-4">
            <div className="max-w-5xl mx-auto">
              <span className="text-base font-semibold text-[#1E1E1E]">AI Dashboard</span>
            </div>
          </div>
          <AnalysisDashboard
            hotel={selectedHotel}
            state={stateData}
            nasa={nasa}
            options={options}
            incentives={incentives}
            recommendation={recommendation}
            loadingIncentives={loadingIncentives}
            loadingRecommendation={loadingRecommendation}
            track={selectedTrack}
            currency={currency}
            selectedSolarLabel={selectedSolarLabel}
            onUpdateBill={handleUpdateBill}
            onBack={() => setStep(2)}
          />
        </>
      )}
    </div>
  );
}
