export interface ConversionResult {
  amount: number
  from: string
  to: string
  rate: number
  convertedAmount: number
  date: string
  timestamp: string
  isStale?: boolean
  staleMessage?: string
}

// Validation function for currency codes
export function isValidCurrencyCode(code: string): boolean {
  return COMMON_CURRENCIES.some(currency =>
    currency.code.toUpperCase() === code.toUpperCase()
  );
}

// Function to get a default currency (e.g., from user profile or fallback)
export function getDefaultCurrency(): string {
  // In a real app, you might fetch the user's default currency from their profile
  // For now, we'll default to USD
  return 'USD';
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

// In-memory cache layer for currency pairs
interface CachedRate {
  rate: number
  date: string
  timestamp: string
  fetchedAt: number // epoch ms
}

const RATE_CACHE: Record<string, CachedRate> = {}

function getCacheKey(from: string, to: string): string {
  return `${from.toUpperCase()}_${to.toUpperCase()}`
}

function formatAgo(fetchedAt: number): string {
  const diffSec = Math.floor((Date.now() - fetchedAt) / 1000)
  if (diffSec < 60) return 'less than a minute'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  return `${diffHours} hour(s)`
}

async function fetchWithRetry(url: string, retries = 1, delayMs = 300): Promise<Response> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.ok) return res
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delayMs))
      return fetchWithRetry(url, retries - 1, delayMs)
    }
  }
  throw new Error('Fetch failed')
}

export async function convertCurrency(
  amount: number,
  from: string = 'USD',
  to: string = 'EUR'
): Promise<ConversionResult> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  // Validate input currencies
  if (!isValidCurrencyCode(fromUpper)) {
    throw new Error(`Invalid source currency: ${from}`)
  }
  if (!isValidCurrencyCode(toUpper)) {
    throw new Error(`Invalid target currency: ${to}`)
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date().toISOString().split('T')[0]
  const cacheKey = getCacheKey(fromUpper, toUpper)

  if (fromUpper === toUpper) {
    return {
      amount,
      from: fromUpper,
      to: toUpper,
      rate: 1,
      convertedAmount: amount,
      date: dateStr,
      timestamp: nowStr,
      isStale: false,
    }
  }

  // 1. Try fresh API call with 1 retry
  try {
    const res = await fetchWithRetry(
      `https://api.frankfurter.app/latest?amount=1&from=${fromUpper}&to=${toUpper}`,
      1,
      300
    )

    const data = await res.json()
    const rate = data.rates?.[toUpper]
    if (rate && typeof rate === 'number') {
      const resultRate = Math.round(rate * 10000) / 10000
      // Cache successful response
      RATE_CACHE[cacheKey] = {
        rate: resultRate,
        date: data.date || dateStr,
        timestamp: nowStr,
        fetchedAt: Date.now(),
      }

      return {
        amount,
        from: fromUpper,
        to: toUpper,
        rate: resultRate,
        convertedAmount: Math.round(amount * resultRate * 100) / 100,
        date: data.date || dateStr,
        timestamp: nowStr,
        isStale: false,
      }
    }
  } catch {
    // API failed, proceed to cache / fallback
  }

  // 2. Fall back to cached rate if available
  const cached = RATE_CACHE[cacheKey]
  if (cached) {
    const ago = formatAgo(cached.fetchedAt)
    return {
      amount,
      from: fromUpper,
      to: toUpper,
      rate: cached.rate,
      convertedAmount: Math.round(amount * cached.rate * 100) / 100,
      date: cached.date,
      timestamp: cached.timestamp,
      isStale: true,
      staleMessage: `Showing last known rate from ${ago} ago — live rates unavailable right now.`,
    }
  }

  // 3. Fall back to static estimation
  const fromRate = FALLBACK_RATES[fromUpper] || 1
  const toRate = FALLBACK_RATES[toUpper] || 1
  const rate = Math.round((toRate / fromRate) * 10000) / 10000

  return {
    amount,
    from: fromUpper,
    to: toUpper,
    rate,
    convertedAmount: Math.round(amount * rate * 100) / 100,
    date: dateStr,
    timestamp: `${nowStr} (estimated)`,
    isStale: true,
    staleMessage: 'Live exchange rates unavailable right now — showing estimated rate.',
  }
}
