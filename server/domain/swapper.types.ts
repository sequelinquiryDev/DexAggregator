/**
 * SwapperService Type Definitions
 * 
 * RESPONSIBILITY: Type system for swap/trade execution
 * - Route finding and representation
 * - Quote generation
 * - Trade execution plans
 * - Slippage protection
 * - Transaction building
 * 
 * DATA SOURCES:
 * 1. Pool state from SharedStateCache
 * 2. Route simulation via TradeSimulator
 * 3. Transaction building for execution
 */

/**
 * Represents a single trading route (path of token addresses)
 * Example: [USDC → WETH → DAI] = [0xA0b8..., 0xC02a..., 0x6B17...]
 */
export type TradingRoute = string[];

/**
 * Quote for a single trading route
 */
export interface RouteQuote {
  route: TradingRoute;
  amountIn: string;
  amountOut: string;
  priceImpact?: number; // Percentage, e.g., 2.5
  executionPrice?: number; // Output tokens per input token
}

/**
 * Single route in a multi-route distribution
 */
export interface RouteAllocation {
  route: TradingRoute;
  amount: string; // Amount of input token for this route
  output: string; // Output amount for this specific route
}

/**
 * Quote result with optional multi-route distribution
 * 
 * Single route:
 * { route: [USDC, WETH], amountOut: "100" }
 * 
 * Multi-route distribution:
 * {
 *   finalAmountOut: "150",
 *   distribution: [
 *     { route: [USDC, WETH], amount: "60", output: "80" },
 *     { route: [USDC, DAI, WETH], amount: "40", output: "70" }
 *   ]
 * }
 */
export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  // Single route quote
  route?: TradingRoute;
  amountOut?: string;
  // Multi-route distribution
  distribution?: RouteAllocation[];
  finalAmountOut?: string;
  // Metadata
  timestamp: number;
  chainId: number;
}

/**
 * Execution plan for a swap
 * Used to build transactions and track routing
 */
export interface TradeExecutionPlan {
  finalAmountOut: string;
  distribution: {
    route: TradingRoute;
    amount: string;
    output?: string;
  }[];
}

/**
 * Request parameters for getting a quote
 */
export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  chainId: number;
  slippage?: number; // Percentage, default 0.5%
}

/**
 * Quote response with optional error handling
 */
export interface QuoteResponse {
  success: boolean;
  quote?: SwapQuote;
  error?: string;
  routes?: TradingRoute[]; // All routes found (for debugging)
  timestamp: number;
}

/**
 * Parameters for executing a swap on-chain
 */
export interface SwapExecutionParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMinimum: string; // Slippage protection
  route: TradingRoute; // For single route
  distribution?: RouteAllocation[]; // For multi-route
  deadlineSeconds?: number;
  chainId: number;
  walletAddress: string;
}

/**
 * Result of a swap execution
 */
export interface SwapExecutionResult {
  success: boolean;
  transactionHash?: string;
  amountIn: string;
  amountOut: string;
  priceImpact?: number;
  gasUsed?: string;
  error?: string;
  timestamp: number;
}

/**
 * Swap status tracker for polling
 */
export interface SwapStatusQuery {
  transactionHash: string;
  chainId: number;
}

/**
 * Swap execution status
 */
export interface SwapStatus {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  amountOut?: string;
  error?: string;
  timestamp: number;
}

/**
 * Configuration for swap behavior
 */
export interface SwapConfig {
  // Maximum hops in a route
  maxRouteDepth: number;
  // Default slippage tolerance (percentage)
  defaultSlippage: number;
  // Whether to attempt multi-route splits
  allowMultiRoute: boolean;
  // Minimum liquidity to consider a pool
  minPoolLiquidity: string;
}

/**
 * Route analysis metadata
 */
export interface RouteAnalysis {
  route: TradingRoute;
  hopCount: number;
  estimatedPriceImpact: number;
  liquidityRisk: 'high' | 'medium' | 'low';
  slippagePrediction: number; // Expected slippage percentage
}

/**
 * Request to analyze multiple routes
 */
export interface RouteAnalysisRequest {
  routes: TradingRoute[];
  amountIn: string;
  chainId: number;
}

/**
 * Trade simulation result
 */
export interface SimulationResult {
  amountOut: bigint;
  priceImpact: number;
  executionPrice: number;
}

/**
 * API response wrapper for quotes
 */
export interface QuoteApiResponse {
  data?: SwapQuote;
  error?: string;
  routes?: TradingRoute[];
  timestamp: number;
}

/**
 * API response wrapper for execution
 */
export interface ExecutionApiResponse {
  data?: SwapExecutionResult;
  error?: string;
  timestamp: number;
}
