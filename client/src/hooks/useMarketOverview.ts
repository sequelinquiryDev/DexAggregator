/**
 * useMarketOverview - React Query Hook
 * 
 * Fetches market overview for all tokens on a selected network
 * Provides caching, error handling, and automatic refetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { marketViewerClient } from '@/lib/api/MarketViewerClient';
import type { MarketOverview } from '@shared/schema';

/**
 * Hook to fetch market overview for a network
 * 
 * @param chainId - Network chain ID (1 for Ethereum, 137 for Polygon)
 * @param options - React Query options (optional)
 * @returns Query result with market overview data
 * 
 * @example
 * const { data: overview, isLoading } = useMarketOverview(137);
 */
export function useMarketOverview(
  chainId: number,
  options?: Omit<UseQueryOptions<MarketOverview | null>, 'queryKey' | 'queryFn'>
): UseQueryResult<MarketOverview | null, Error> {
  return useQuery({
    queryKey: ['market', 'overview', chainId],
    queryFn: async () => await marketViewerClient.getMarketOverview(chainId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    ...options,
  });
}
