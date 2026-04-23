/**
 * Format a monetary amount with the correct currency symbol.
 */
export function formatAmount(
    amount: number | string,
    currency: string = "USD"
  ): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
  
    if (isNaN(num)) return `${currency} 0.00`
  
    const localeMap: Record<string, string> = {
      USD: "en-US",
      INR: "en-IN",
    }
  
    const locale = localeMap[currency] || "en-US"
  
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }
  
  /**
   * Get currency symbol only.
   */
  export function getCurrencySymbol(currency: string = "USD"): string {
    const symbols: Record<string, string> = {
      USD: "$",
      INR: "₹",
    }
    return symbols[currency] || currency
  }
  