/**
 * MarketViewerClient - Frontend API Abstraction for Market Data
 * 
 * Provides typed interface to backend MarketViewerService endpoints
 * All methods return data typed from shared/schema.ts for type safety
 */

import type { TokenMarketData, MarketOverview, TokenSearchResult } from '@shared/schema';

/**
 * Client for all market viewer API calls
 * Handles communication with /api/market/* endpoints
 */
export class MarketViewerClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch market overview for all tokens on a network
   * GET /api/market/overview?chainId=X
   * 
   * @param chainId - Network chain ID (1 for Ethereum, 137 for Polygon)
   * @returns Market overview with all tokens or null if error
   */
  public async getMarketOverview(chainId: number): Promise<MarketOverview | null> {
    try {
      console.log(`📊 [MarketViewer] Fetching overview for chain ${chainId}`);
      const response = await fetch(`${this.baseUrl}/market/overview?chainId=${chainId}`);

      if (!response.ok) {
        console.error(`[MarketViewer] Overview fetch failed: ${response.statusText}`);
        return null;
      }

      const data: MarketOverview = await response.json();
      console.log(
        `✓ [MarketViewer] Overview fetched: ${data.tokens?.length || 0} tokens, $${data.totalLiquidity?.toLocaleString()}`
      );
      return data;
    } catch (error) {
      console.error('[MarketViewer] Error fetching overview:', error);
      return null;
    }
  }

  /**
   * Fetch detailed market data for a single token
   * GET /api/market/token/:tokenAddress?chainId=X
   * 
   * @param tokenAddress - Token contract address
   * @param chainId - Network chain ID
   * @param forceRefresh - Bypass cache and fetch fresh data
   * @returns Token market data or null if error
   */
  public async getTokenMarketData(
    tokenAddress: string,
    chainId: number,
    forceRefresh: boolean = false
  ): Promise<TokenMarketData | null> {
    try {
      console.log(`💰 [MarketViewer] Fetching data for ${tokenAddress.slice(0, 6)}...`);
      const url = new URL(`${this.baseUrl}/market/token/${tokenAddress}`, window.location.origin);
      url.searchParams.append('chainId', String(chainId));
      if (forceRefresh) {
        url.searchParams.append('forceRefresh', 'true');
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`[MarketViewer] Token data fetch failed: ${response.statusText}`);
        return null;
      }

      const data: TokenMarketData = await response.json();
      console.log(`✓ [MarketViewer] Token data: ${data.symbol} $${data.price.toFixed(2)} (${data.dataSource})`);
      return data;
    } catch (error) {
      console.error('[MarketViewer] Error fetching token data:', error);
      return null;
    }
  }

  /**
   * Search for tokens by symbol, name, or address
   * GET /api/market/search?q=QUERY&chainId=X
   * 
   * @param query - Search query (symbol, name, or address)
   * @param chainId - Network chain ID
   * @returns Array of matching tokens sorted by relevance, or null if error
   */
  public async searchTokens(query: string, chainId: number): Promise<TokenSearchResult[] | null> {
    try {
      console.log(`🔍 [MarketViewer] Searching: "${query}"`);
      const url = new URL(`${this.baseUrl}/market/search`, window.location.origin);
      url.searchParams.append('q', query);
      url.searchParams.append('chainId', String(chainId));

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`[MarketViewer] Search failed: ${response.statusText}`);
        return null;
      }

      const data: TokenSearchResult[] = await response.json();
      console.log(`✓ [MarketViewer] Found ${data?.length || 0} tokens`);
      return data;
    } catch (error) {
      console.error('[MarketViewer] Error searching tokens:', error);
      return null;
    }
  }

  /**
   * Get cache status for debugging
   * GET /api/market/cache/status
   * 
   * @returns Cache statistics object
   */
  public async getCacheStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/cache/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[MarketViewer] Error getting cache status:', error);
      return null;
    }
  }

  /**
   * Clear the market viewer cache
   * DELETE /api/market/cache
   * 
   * @returns Success status
   */
  public async clearCache(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/market/cache`, {
        method: 'DELETE',
      });
      if (response.ok) {
        console.log('✓ [MarketViewer] Cache cleared');
      }
      return response.ok;
    } catch (error) {
      console.error('[MarketViewer] Error clearing cache:', error);
      return false;
    }
  }
}

// Export singleton instance
export const marketViewerClient = new MarketViewerClient();
