import { useGetCurrentRateQuery } from '../store/apis/exchangeRatesApi';
import { KHR_RATE as FALLBACK } from '../features/shifts/shiftsSlice';

/**
 * Returns the live KHR-per-USD rate from the API.
 * Falls back to the hardcoded constant while the request is in-flight
 * or if no rate has been configured yet.
 */
export function useKhrRate() {
  const { data } = useGetCurrentRateQuery();
  return data?.rate ?? FALLBACK;
}
