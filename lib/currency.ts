// lib/currency.ts — re-exports from lib/money.ts for backward compatibility
export type { CurrencyCode } from "./money";
export { RATES, SYMBOLS, formatMoney, toINR, CURRENCIES } from "./money";
