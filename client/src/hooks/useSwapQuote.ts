/**
 * useSwapQuote - React Query Hook
 * 
 * Fetches swap quotes for given token pair and amount
 * Provides caching, error handling, and automatic refetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { swapperClient } from '@/lib/api/SwapperClient';
import type { SwapQuote } from '@shared/schema';

interface UseSwapQuoteParams {
  tokenIn: string | null | undefined;
  tokenOut: string | null | undefined;
  amountIn: string;
  chainId: number;
}

/**
 * Hook to fetch a swap quote
 * 
 * @param params - Quote parameters (tokenIn, tokenOut, amountIn, chainId)
 * @param options - React Query options (optional)
 * @returns Query result with swap quote data
 * 
 * @example
 * const { data: quote, isLoading } = useSwapQuote({
 *   tokenIn: '0xA0b8...',
 *   tokenOut: '0xC02a...',
 *   amountIn: '1000000',
 *   chainId: 137
 * });
 */
export function useSwapQuote(
  params: UseSwapQuoteParams,
  options?: Omit<UseQueryOptions<SwapQuote | null>, 'queryKey' | 'queryFn'>
): UseQueryResult<SwapQuote | null, Error> {
  const { tokenIn, tokenOut, amountIn, chainId } = params;

  return useQuery({
    queryKey: ['swap', 'quote', tokenIn, tokenOut, amountIn, chainId],
    queryFn: async () => {
      if (!tokenIn || !tokenOut || !amountIn || amountIn === '0') {
        return null;
      }
      return await swapperClient.getQuote({
        tokenIn,
        tokenOut,
        amountIn,
        chainId,
      });
    },
    staleTime: 30 * 1000, // 30 seconds (quotes refresh frequently)
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    // Only run query if we have valid parameters
    enabled: (!!tokenIn && !!tokenOut && !!amountIn && amountIn !== '0') === true,
    ...options,
  });
}
