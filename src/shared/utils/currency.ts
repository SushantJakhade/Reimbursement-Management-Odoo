import fetch from 'node-fetch';
import { env } from '../../config/env';
import { logger } from './logger';
import { APP_CONSTANTS } from '../../config/constants';

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
}

const rateCache: Map<string, ExchangeRateCache> = new Map();

/**
 * Fetch exchange rate from exchangerate-api.com (with caching)
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const cacheKey = fromCurrency.toUpperCase();
  const cached = rateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < APP_CONSTANTS.EXCHANGE_RATE_CACHE_TTL) {
    const rate = cached.rates[toCurrency.toUpperCase()];
    if (rate) return rate;
  }

  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = (await response.json()) as { rates: Record<string, number> };

    // Cache the rates
    rateCache.set(cacheKey, {
      rates: data.rates,
      timestamp: Date.now(),
    });

    const rate = data.rates[toCurrency.toUpperCase()];
    if (!rate) {
      throw new Error(`No exchange rate found for ${toCurrency}`);
    }

    return rate;
  } catch (error) {
    logger.error('Failed to fetch exchange rate', { fromCurrency, toCurrency, error });
    throw new Error(`Currency conversion failed: ${fromCurrency} → ${toCurrency}`);
  }
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number }> {
  const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = Math.round(amount * exchangeRate * 100) / 100;

  return { convertedAmount, exchangeRate };
}

/**
 * Fetch country currency info from restcountries.com
 */
export async function getCountryCurrency(countryCode: string): Promise<string> {
  try {
    const url = `${env.restCountriesApiUrl}/alpha/${countryCode}?fields=currencies`;
    const response = await fetch(url);

    if (!response.ok) return 'USD';

    const data = (await response.json()) as { currencies: Record<string, { name: string; symbol: string }> };
    const currencies = Object.keys(data.currencies || {});
    return currencies[0] || 'USD';
  } catch (error) {
    logger.warn('Failed to fetch country currency, defaulting to USD', { countryCode, error });
    return 'USD';
  }
}
