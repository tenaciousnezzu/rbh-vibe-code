import { formatINR } from "./formatters";

// ASSUMPTION: Commercial rooftop solar India 2024, ₹/W
const CAPEX_ONSITE_PER_W = 42;
// ASSUMPTION: Ground mount / offsite solar India 2024, ₹/W
const CAPEX_OFFSITE_PER_W = 38;
// ASSUMPTION: Standard system efficiency ratio
const SOLAR_PERFORMANCE_RATIO = 0.80;
// ASSUMPTION: Levelised cost of solar generation, ₹/kWh
const SOLAR_LCOE = 2.50;
// ASSUMPTION: Standard financial discount rate (used as hurdle rate reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DISCOUNT_RATE = 0.12;
// ASSUMPTION: India CEA grid emission factor 2023, kgCO2/kWh
const INDIA_GRID_EF = 0.82;
const PROJECT_LIFE = 20;

export interface Hotel {
  id: string;
  name: string;
  ownership: string;
  city: string;
  state: string;
  address: string;
  rooms: number;
  floorAreaSqm: number;
  roomNights: number;
  emissionsKgCO2e: number;
  lat: number;
  lng: number;
  monthlyElectricityBillINR: number;
  annualElectricityKwh: number;
  billEstimated: boolean;
}

export interface StateData {
  state: string;
  discom: string;
  commercialTariffPerUnit: number;
  tariffEscalationPctPerYear: number;
  stateSubsidyPerW: number;
  corporateTaxRate: number;
  adDepreciationPct: number;
  gstOnEquipmentPct: number;
  openAccessAvailable: boolean;
  openAccessChargePerUnit: number;
  bestSolarPPATariff: number;
  bestWindPPATariff: number | null;
  greenTariffPremiumPerUnit: number;
  recPricePerUnit: number;
  electricityDutyWaiverYears: number;
  netMeteringLimitKW: number;
  windViable: boolean;
  solarIrradianceKwhM2Day: number;
  stateSchemeNote: string;
}

export interface NasaData {
  solarIrradiance: number;
  windSpeed: number;
  source: "live" | "estimated";
}

export interface YearData {
  year: number;
  cashFlow: number;
  cumulative: number;
}

export interface OptionResult {
  id: string;
  label: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
  netCapex: number;
  grossCapex: number;
  adBenefit: number;
  subsidyAmt: number;
  gstITC: number;
  taxSaved: number;
  systemKw: number;
  annualGenKwh: number;
  yr1Saving: number;
  annualSavingPct: number;
  irr: number | null;
  paybackYears: number | null;
  paybackLabel: string;
  co2AvoidedTonnes: number;
  cashFlows: YearData[];
  complexity: "Very Low" | "Low" | "Medium" | "High";
  track: "ownership" | "zerocapex";
  annualCostImpact: number;
}

export function calculateNPV(cashFlows: number[], initial: number, rate: number): number {
  return cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0) - initial;
}

export function calculateIRR(initialInvestment: number, cashFlows: number[]): number {
  if (initialInvestment <= 0) return 0;
  let rate = 0.15;
  for (let iter = 0; iter < 200; iter++) {
    let npv = -initialInvestment;
    let dnpv = 0;
    cashFlows.forEach((cf, i) => {
      npv += cf / Math.pow(1 + rate, i + 1);
      dnpv -= (i + 1) * cf / Math.pow(1 + rate, i + 2);
    });
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) { rate = newRate; break; }
    rate = Math.max(-0.99, Math.min(5, newRate));
  }
  return rate;
}

function buildCashFlows(yr1: number, escalation: number, years = PROJECT_LIFE): YearData[] {
  const flows: YearData[] = [];
  let cumulative = 0;
  for (let y = 1; y <= years; y++) {
    const cf = yr1 * Math.pow(1 + escalation / 100, y - 1);
    cumulative += cf;
    flows.push({ year: y, cashFlow: Math.round(cf), cumulative: Math.round(cumulative) });
  }
  return flows;
}

export function calculateAllOptions(hotel: Hotel, state: StateData, nasa: NasaData): OptionResult[] {
  const tariff = state.commercialTariffPerUnit;
  const esc = state.tariffEscalationPctPerYear;
  const annualKwh = hotel.annualElectricityKwh;
  const annualBill = hotel.monthlyElectricityBillINR * 12;
  const solar = nasa.solarIrradiance;
  const results: OptionResult[] = [];

  // --- Option 1: Owned Onsite PV ---
  {
    const maxFromArea = hotel.floorAreaSqm * 0.012;
    const maxFromLoad = (annualKwh * 0.55) / (solar * 365 * SOLAR_PERFORMANCE_RATIO);
    const systemKw = Math.min(maxFromArea, maxFromLoad);
    const grossCapex = systemKw * 1000 * CAPEX_ONSITE_PER_W;
    const adBenefit = grossCapex * (state.adDepreciationPct / 100) * state.corporateTaxRate;
    const subsidyAmt = systemKw * 1000 * state.stateSubsidyPerW;
    const gstITC = grossCapex * (state.gstOnEquipmentPct / 100) * 0.45;
    const netCapex = grossCapex - adBenefit - subsidyAmt - gstITC;
    const annualGenKwh = systemKw * solar * 365 * SOLAR_PERFORMANCE_RATIO;
    const yr1Saving = annualGenKwh * (tariff - SOLAR_LCOE);
    const cashFlows = buildCashFlows(yr1Saving, esc);
    const irr = calculateIRR(netCapex, cashFlows.map(c => c.cashFlow));
    const paybackYears = yr1Saving > 0 ? netCapex / yr1Saving : null;
    const co2AvoidedTonnes = (annualGenKwh * INDIA_GRID_EF) / 1000;
    results.push({
      id: "onsite-owned",
      label: "Owned Onsite PV",
      description: "Install rooftop or carport solar panels on your property. You own the system and capture all financial benefits and depreciation.",
      available: true,
      netCapex: Math.round(netCapex),
      grossCapex: Math.round(grossCapex),
      adBenefit: Math.round(adBenefit),
      subsidyAmt: Math.round(subsidyAmt),
      gstITC: Math.round(gstITC),
      taxSaved: Math.round(adBenefit),
      systemKw: Math.round(systemKw),
      annualGenKwh: Math.round(annualGenKwh),
      yr1Saving: Math.round(yr1Saving),
      annualSavingPct: (yr1Saving / annualBill) * 100,
      irr: irr,
      paybackYears: paybackYears,
      paybackLabel: paybackYears ? `${paybackYears.toFixed(1)} yrs` : "N/A",
      co2AvoidedTonnes: Math.round(co2AvoidedTonnes * 10) / 10,
      cashFlows,
      complexity: "High",
      track: "ownership",
      annualCostImpact: Math.round(yr1Saving),
    });
  }

  // --- Option 2: Owned Offsite PV ---
  {
    const available = state.openAccessAvailable;
    const systemKw = (annualKwh * 0.65) / (solar * 365 * SOLAR_PERFORMANCE_RATIO);
    const grossCapex = systemKw * 1000 * CAPEX_OFFSITE_PER_W;
    const adBenefit = grossCapex * (state.adDepreciationPct / 100) * state.corporateTaxRate;
    const gstITC = grossCapex * (state.gstOnEquipmentPct / 100) * 0.45;
    const netCapex = grossCapex - adBenefit - gstITC;
    const annualGenKwh = systemKw * solar * 365 * SOLAR_PERFORMANCE_RATIO;
    const effectiveCostPerUnit = SOLAR_LCOE - 0.3 + state.openAccessChargePerUnit;
    const yr1Saving = annualKwh * 0.65 * (tariff - effectiveCostPerUnit);
    const cashFlows = buildCashFlows(yr1Saving, esc);
    const irr = available ? calculateIRR(netCapex, cashFlows.map(c => c.cashFlow)) : null;
    const paybackYears = available && yr1Saving > 0 ? netCapex / yr1Saving : null;
    const annualGenForEmissions = annualKwh * 0.65;
    const co2AvoidedTonnes = (annualGenForEmissions * INDIA_GRID_EF) / 1000;
    results.push({
      id: "offsite-owned",
      label: "Owned Offsite PV",
      description: "Own a ground-mounted solar farm outside city limits and wheel the power to your hotel via open access. Best economics for large loads.",
      available,
      unavailableReason: !available ? `Open access not yet available in ${state.state}` : undefined,
      netCapex: Math.round(netCapex),
      grossCapex: Math.round(grossCapex),
      adBenefit: Math.round(adBenefit),
      subsidyAmt: 0,
      gstITC: Math.round(gstITC),
      taxSaved: Math.round(adBenefit),
      systemKw: Math.round(systemKw),
      annualGenKwh: Math.round(annualGenKwh),
      yr1Saving: available ? Math.round(yr1Saving) : 0,
      annualSavingPct: available ? (yr1Saving / (hotel.monthlyElectricityBillINR * 12)) * 100 : 0,
      irr,
      paybackYears,
      paybackLabel: available && paybackYears ? `${paybackYears.toFixed(1)} yrs` : "N/A",
      co2AvoidedTonnes: Math.round(co2AvoidedTonnes * 10) / 10,
      cashFlows: available ? cashFlows : [],
      complexity: "High",
      track: "ownership",
      annualCostImpact: available ? Math.round(yr1Saving) : 0,
    });
  }

  // --- Option 3: Physical PPA Onsite ---
  {
    const maxFromArea = hotel.floorAreaSqm * 0.012;
    const maxFromLoad = (annualKwh * 0.55) / (solar * 365 * SOLAR_PERFORMANCE_RATIO);
    const systemKw = Math.min(maxFromArea, maxFromLoad);
    const annualGenKwh = systemKw * solar * 365 * SOLAR_PERFORMANCE_RATIO;
    const yr1Saving = annualGenKwh * (tariff - state.bestSolarPPATariff);
    const cashFlows = buildCashFlows(yr1Saving, esc);
    const co2AvoidedTonnes = (annualGenKwh * INDIA_GRID_EF) / 1000;
    results.push({
      id: "ppa-onsite",
      label: "Physical PPA (Onsite)",
      description: "A developer installs and owns rooftop solar on your property. You buy the power at a fixed tariff lower than grid rate — zero capex required.",
      available: true,
      netCapex: 0,
      grossCapex: 0,
      adBenefit: 0,
      subsidyAmt: 0,
      gstITC: 0,
      taxSaved: 0,
      systemKw: Math.round(systemKw),
      annualGenKwh: Math.round(annualGenKwh),
      yr1Saving: Math.round(yr1Saving),
      annualSavingPct: (yr1Saving / (hotel.monthlyElectricityBillINR * 12)) * 100,
      irr: null,
      paybackYears: null,
      paybackLabel: "Immediate",
      co2AvoidedTonnes: Math.round(co2AvoidedTonnes * 10) / 10,
      cashFlows,
      complexity: "Low",
      track: "ownership",
      annualCostImpact: Math.round(yr1Saving),
    });
  }

  // --- Option 4: Physical PPA Offsite ---
  {
    const available = state.openAccessAvailable;
    const effectiveRate = state.bestSolarPPATariff + state.openAccessChargePerUnit;
    const yr1Saving = annualKwh * 0.80 * (tariff - effectiveRate);
    const annualGenKwh = annualKwh * 0.80;
    const cashFlows = buildCashFlows(yr1Saving, esc);
    const co2AvoidedTonnes = (annualGenKwh * INDIA_GRID_EF) / 1000;
    results.push({
      id: "ppa-offsite",
      label: "Physical PPA (Offsite)",
      description: "Buy solar power from a third-party plant via open access wheeling. Covers up to 80% of your load. No capex, lower effective rate.",
      available,
      unavailableReason: !available ? `Open access not yet available in ${state.state}` : undefined,
      netCapex: 0,
      grossCapex: 0,
      adBenefit: 0,
      subsidyAmt: 0,
      gstITC: 0,
      taxSaved: 0,
      systemKw: 0,
      annualGenKwh: Math.round(annualGenKwh),
      yr1Saving: available ? Math.round(yr1Saving) : 0,
      annualSavingPct: available ? (yr1Saving / (hotel.monthlyElectricityBillINR * 12)) * 100 : 0,
      irr: null,
      paybackYears: null,
      paybackLabel: "Immediate",
      co2AvoidedTonnes: Math.round(co2AvoidedTonnes * 10) / 10,
      cashFlows: available ? cashFlows : [],
      complexity: "Medium",
      track: "ownership",
      annualCostImpact: available ? Math.round(yr1Saving) : 0,
    });
  }

  // --- Option 5: Utility Green Tariff ---
  {
    const yr1Impact = -(annualKwh * state.greenTariffPremiumPerUnit);
    results.push({
      id: "green-tariff",
      label: "Utility Green Tariff",
      description: "Pay a small premium to your DISCOM to source certified renewable energy. Immediate RE100 compliance with zero procurement complexity.",
      available: true,
      netCapex: 0,
      grossCapex: 0,
      adBenefit: 0,
      subsidyAmt: 0,
      gstITC: 0,
      taxSaved: 0,
      systemKw: 0,
      annualGenKwh: 0,
      yr1Saving: Math.round(yr1Impact),
      annualSavingPct: (yr1Impact / (hotel.monthlyElectricityBillINR * 12)) * 100,
      irr: null,
      paybackYears: null,
      paybackLabel: "N/A",
      co2AvoidedTonnes: (annualKwh * INDIA_GRID_EF) / 1000,
      cashFlows: buildCashFlows(yr1Impact, esc),
      complexity: "Very Low",
      track: "zerocapex",
      annualCostImpact: Math.round(yr1Impact),
    });
  }

  // --- Option 6: EAC / REC ---
  {
    const annualCost = annualKwh * state.recPricePerUnit;
    results.push({
      id: "eac",
      label: "Energy Attribute Certificates",
      description: "Purchase RECs or I-RECs to claim renewable electricity for Scope 2 reporting. RE100 and GHG Protocol compliant. No physical energy change.",
      available: true,
      netCapex: 0,
      grossCapex: 0,
      adBenefit: 0,
      subsidyAmt: 0,
      gstITC: 0,
      taxSaved: 0,
      systemKw: 0,
      annualGenKwh: 0,
      yr1Saving: -Math.round(annualCost),
      annualSavingPct: (-annualCost / (hotel.monthlyElectricityBillINR * 12)) * 100,
      irr: null,
      paybackYears: null,
      paybackLabel: "N/A",
      co2AvoidedTonnes: (annualKwh * INDIA_GRID_EF) / 1000,
      cashFlows: buildCashFlows(-annualCost, 2),
      complexity: "Very Low",
      track: "zerocapex",
      annualCostImpact: -Math.round(annualCost),
    });
  }

  return results;
}

export { formatINR };
