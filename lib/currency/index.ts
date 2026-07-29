export interface ConversionResult {
  amount: number
  from: string
  to: string
  rate: number
  convertedAmount: number
  date: string
  timestamp: string
}

export const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'PKR', name: 'Pakistani Rupee (Rs)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
]

// Fallback rates if API fails or offline
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
  INR: 83.1,
  PKR: 278.5,
  JPY: 155.2,
  CHF: 0.91,
  SGD: 1.35,
}

export async function convertCurrency(
  amount: number,
  from: string = 'USD',
  to: string = 'EUR'
): Promise<ConversionResult> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date().toISOString().split('T')[0]

  if (fromUpper === toUpper) {
    return {
      amount,
      from: fromUpper,
      to: toUpper,
      rate: 1,
      convertedAmount: amount,
      date: dateStr,
      timestamp: nowStr,
    }
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?amount=1&from=${fromUpper}&to=${toUpper}`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    })
    if (res.ok) {
      const data = await res.json()
      const rate = data.rates?.[toUpper]
      if (rate && typeof rate === 'number') {
        return {
          amount,
          from: fromUpper,
          to: toUpper,
          rate,
          convertedAmount: Math.round(amount * rate * 100) / 100,
          date: data.date || dateStr,
          timestamp: nowStr,
        }
      }
    }
  } catch {
    // Ignore fetch error and use fallback
  }

  // Fallback calculation
  const fromRate = FALLBACK_RATES[fromUpper] || 1
  const toRate = FALLBACK_RATES[toUpper] || 1
  const rate = toRate / fromRate
  return {
    amount,
    from: fromUpper,
    to: toUpper,
    rate: Math.round(rate * 10000) / 10000,
    convertedAmount: Math.round(amount * rate * 100) / 100,
    date: dateStr,
    timestamp: `${nowStr} (estimated)`,
  }
}
