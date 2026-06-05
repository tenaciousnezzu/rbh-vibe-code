export function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatKwh(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} GWh`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MWh`;
  return `${Math.round(n)} kWh`;
}

export function formatTonnes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} kt CO₂`;
  return `${n.toFixed(1)} t CO₂`;
}
