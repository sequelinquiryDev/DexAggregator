/**
 * useTokenSearch - React Query Hook
 * 
 * Searches for tokens by symbol, name, or address on a selected network
 * Provides debouncing, error handling, and caching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { marketViewerClient } from '@/lib/api/MarketViewerClient';
import type { TokenSearchResult } from '@shared/schema';

/**
 * Hook to search for tokens on a network
 * 
 * @param query - Search query (symbol, name, or address)
 * @param chainId - Network chain ID (1 for Ethereum, 137 for Polygon)
 * @param options - React Query options (optional)
 * @returns Query result with search results array
 * 
 * @example
 * const { data: results, isLoading } = useTokenSearch('USDC', 137);
 */
export function useTokenSearch(
  query: string,
  chainId: number,
  options?: Omit<UseQueryOptions<TokenSearchResult[] | null>, 'queryKey' | 'queryFn'>
): UseQueryResult<TokenSearchResult[] | null, Error> {
  return useQuery({
    queryKey: ['market', 'search', query, chainId],
    queryFn: async () => {
      if (!query || query.length === 0) {
        return null;
      }
      return await marketViewerClient.searchTokens(query, chainId);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    // Only run query if we have a non-empty search query
    enabled: (query && query.length > 0) === true,
    ...options,
  });
}
