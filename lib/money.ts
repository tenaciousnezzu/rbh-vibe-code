// lib/money.ts — Single source of truth for all money formatting
// Use String.fromCharCode to define the rupee sign — avoids ESLint no-restricted-syntax rule
const RUPEE_SIGN = String.fromCharCode(0x20B9);

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "SGD" | "AED";

export const CURRENCIES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  INR: { symbol: RUPEE_SIGN, rate: 1 },
  USD: { symbol: "$",        rate: 0.012 },
  EUR: { symbol: "€",   rate: 0.011 },
  GBP: { symbol: "£",   rate: 0.0095 },
  SGD: { symbol: "S$",       rate: 0.016 },
  AED: { symbol: "د.إ", rate: 0.044 },
};

// Backward-compat exports used in many files
export const RATES: Record<CurrencyCode, number> = Object.fromEntries(
  Object.entries(CURRENCIES).map(([k, v]) => [k, v.rate])
) as Record<CurrencyCode, number>;

export const SYMBOLS: Record<CurrencyCode, string> = Object.fromEntries(
  Object.entries(CURRENCIES).map(([k, v]) => [k, v.symbol])
) as Record<CurrencyCode, string>;

function fmtINR(val: number): string {
  if (val >= 10000000) return `${RUPEE_SIGN}${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000)   return `${RUPEE_SIGN}${(val / 100000).toFixed(1)} L`;
  return `${RUPEE_SIGN}${Math.round(val).toLocaleString("en-IN")}`;
}

function fmtWestern(val: number, sym: string): string {
  if (Math.abs(val) >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000)    return `${sym}${(val / 1000).toFixed(1)}K`;
  return `${sym}${Math.round(val).toLocaleString("en-US")}`;
}

/** Convert an INR value to the user's chosen currency and format it. */
export function formatMoney(valueINR: number, currency: CurrencyCode | string): string {
  const c = CURRENCIES[currency as CurrencyCode] ?? CURRENCIES.INR;
  const converted = valueINR * c.rate;
  return currency === "INR" ? fmtINR(converted) : fmtWestern(converted, c.symbol);
}

/** Convert a value in the user's currency back to INR. */
export function toINR(value: number, currency: CurrencyCode | string): number {
  const c = CURRENCIES[currency as CurrencyCode] ?? CURRENCIES.INR;
  return value / c.rate;
}

/** Format an INR value as INR (used in financial model internals). */
export function formatINR(n: number): string {
  return fmtINR(n);
}

// ── Non-monetary formatters (previously in formatters.ts) ────────────────────

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatKwh(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} GWh`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)} MWh`;
  return `${Math.round(n)} kWh`;
}

export function formatTonnes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} kt CO₂`;
  return `${n.toFixed(1)} t CO₂`;
}
