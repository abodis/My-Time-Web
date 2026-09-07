// Currencies supported by the backend. Order shown in dropdowns.
export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"]

// Single source of truth for rendering monetary amounts. Produces a currency
// symbol followed by a well-formatted number (e.g. "$65.00", "€1,234.50") with
// no trailing currency code — the symbol already identifies the currency.
export function formatMoney(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    // Unknown/invalid currency code — fall back to code + fixed number.
    return `${currency} ${value.toFixed(2)}`
  }
}
