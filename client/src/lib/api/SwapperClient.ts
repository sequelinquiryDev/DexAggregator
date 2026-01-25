/**
 * SwapperClient - Frontend API Abstraction for Swap Operations
 * 
 * Provides typed interface to backend SwapController endpoints
 * All methods return data typed from shared/schema.ts for type safety
 */

import type { SwapQuote, QuoteResponse } from '@shared/schema';

/**
 * Parameters for requesting a swap quote
 */
export interface QuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  chainId: number;
}

/**
 * Client for all swapper API calls
 * Handles communication with /api/swap/* endpoints
 */
export class SwapperClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get a quote for a swap
   * POST /api/swap/quote
   * 
   * Returns the best route(s) and output amount for the given swap parameters.
   * May return a single route or multi-route distribution.
   * 
   * @param params - Quote request parameters
   * @returns Swap quote with route and amount details, or null if error
   */
  public async getQuote(params: QuoteParams): Promise<SwapQuote | null> {
    try {
      const { tokenIn, tokenOut, amountIn, chainId } = params;
      console.log(`🔄 [Swapper] Getting quote: ${amountIn} from ${tokenIn.slice(0, 6)}... to ${tokenOut.slice(0, 6)}...`);

      const response = await fetch(`${this.baseUrl}/swap/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenIn,
          tokenOut,
          amountIn,
          chainId,
        }),
      });

      if (!response.ok) {
        console.error(`[Swapper] Quote fetch failed: ${response.statusText}`);
        return null;
      }

      const data: QuoteResponse = await response.json();

      if (data.success && data.quote) {
        const outAmount = data.quote.amountOut || data.quote.finalAmountOut || '0';
        console.log(`✓ [Swapper] Quote received: ${outAmount}`);
        return data.quote;
      } else {
        console.warn(`[Swapper] Quote failed: ${data.error}`);
        return null;
      }
    } catch (error) {
      console.error('[Swapper] Error fetching quote:', error);
      return null;
    }
  }

  /**
   * Validate if a swap route exists
   * 
   * @param params - Quote request parameters
   * @returns True if route exists and has output
   */
  public async validateRoute(params: QuoteParams): Promise<boolean> {
    try {
      const quote = await this.getQuote(params);
      const hasOutput = quote && (quote.amountOut || quote.finalAmountOut);
      return !!hasOutput;
    } catch (error) {
      console.error('[Swapper] Error validating route:', error);
      return false;
    }
  }

  /**
   * Calculate estimated slippage for a quote
   * 
   * @param quote - Quote data
   * @param slippageTolerance - Slippage tolerance in percentage (default 0.5%)
   * @returns Estimated slippage percentage as string
   */
  public calculateSlippage(quote: SwapQuote, slippageTolerance: number = 0.5): string {
    try {
      if (!quote.amountOut && !quote.finalAmountOut) return '0';

      const routeCount = quote.distribution?.length || (quote.route ? 1 : 0);
      // Simple estimate: ~0.3% slippage per route hop
      const estimatedSlippage = 0.3 * routeCount;

      return estimatedSlippage.toFixed(2);
    } catch (error) {
      console.error('[Swapper] Error calculating slippage:', error);
      return '0';
    }
  }

  /**
   * Format quote data for display in UI
   * 
   * @param quote - Quote data
   * @returns Formatted display data
   */
  public formatQuote(quote: SwapQuote): {
    amountIn: string;
    amountOut: string;
    routeCount: number;
    priceImpact: string;
  } {
    const routeCount = quote.distribution?.length || (quote.route ? 1 : 0);
    const amountOut = quote.finalAmountOut || quote.amountOut || '0';
    const priceImpact = this.calculateSlippage(quote);

    return {
      amountIn: quote.amountIn,
      amountOut,
      routeCount,
      priceImpact,
    };
  }

  /**
   * Get human-readable route description
   * 
   * @param route - Array of token addresses
   * @returns Route description like "USDC → WETH → DAI"
   */
  public formatRoute(route?: string[]): string {
    if (!route || route.length === 0) return 'No route';
    return route.map(addr => addr.slice(0, 6) + '...').join(' → ');
  }
}

// Export singleton instance
export const swapperClient = new SwapperClient();
