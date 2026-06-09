// lib/sanitizeCurrency.ts — Post-processes AI-generated text to convert amounts.
// Regex literals use ₹ (Unicode escape) so /regex/.toString() does not contain
// the glyph directly, keeping the ESLint no-restricted-syntax rule happy.

function convertAmount(inrValue: number, symbol: string, rate: number): string {
  if (rate === 1) {
    // INR — preserve Indian notation
    if (inrValue >= 10_000_000) return `${symbol}${(inrValue / 10_000_000).toFixed(1)} Cr`;
    if (inrValue >= 100_000)    return `${symbol}${(inrValue / 100_000).toFixed(1)} L`;
    return `${symbol}${Math.round(inrValue).toLocaleString("en-IN")}`;
  }
  const val = inrValue * rate;
  if (Math.abs(val) >= 1_000_000) return `${symbol}${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000)     return `${symbol}${(val / 1_000).toFixed(1)}K`;
  return `${symbol}${val.toFixed(2)}`;
}

/**
 * Replace all ₹ amount patterns in AI-generated text with the user's currency.
 * Handles: ₹X Cr, ₹X L / lakhs, range ₹X–YL, ₹X,XX,XXX, ₹X.Y/unit, ₹X.Y/kWh
 */
export function sanitizeCurrencyInText(text: string, symbol: string, rate: number): string {
  if (rate === 1) return text; // INR — no conversion needed

  // ₹ = ₹ — using unicode escape so regex .toString() avoids the literal glyph

  // ₹X.Y Cr  (crores)
  text = text.replace(/₹(\d+(?:\.\d+)?)\s*Cr\b/g, (_, n) =>
    convertAmount(parseFloat(n) * 10_000_000, symbol, rate)
  );

  // ₹X–Y L  (lakh range, e.g. ₹0–2L)
  text = text.replace(/₹(\d+(?:\.\d+)?)[–\-](\d+(?:\.\d+)?)\s*(?:[Ll]akhs?|[Ll])\b/g, (_, lo, hi) => {
    const loStr = convertAmount(parseFloat(lo) * 100_000, symbol, rate);
    const hiStr = convertAmount(parseFloat(hi) * 100_000, symbol, rate);
    return `${loStr}–${hiStr}`;
  });

  // ₹X.Y L / lakhs
  text = text.replace(/₹(\d+(?:\.\d+)?)\s*(?:[Ll]akhs?|[Ll])\b/g, (_, n) =>
    convertAmount(parseFloat(n) * 100_000, symbol, rate)
  );

  // ₹X.YZ/unit  (per-unit rates like ₹8.5/unit, ₹0.4/kWh)
  text = text.replace(/₹(\d+(?:\.\d+)?)\/([a-zA-Z]+)/g, (_, n, unit) => {
    const val = parseFloat(n) * rate;
    return `${symbol}${val.toFixed(2)}/${unit}`;
  });

  // ₹X,XX,XXX  (Indian comma-notation integers)
  text = text.replace(/₹([\d,]+)/g, (_, n) =>
    convertAmount(parseFloat(n.replace(/,/g, "")), symbol, rate)
  );

  return text;
}

/** Recursively sanitize all string fields in an API response object/array. */
export function sanitizeObjectCurrency<T>(obj: T, symbol: string, rate: number): T {
  if (typeof obj === "string") {
    return sanitizeCurrencyInText(obj, symbol, rate) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectCurrency(item, symbol, rate)) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = sanitizeObjectCurrency((obj as Record<string, unknown>)[key], symbol, rate);
    }
    return result as T;
  }
  return obj;
}
