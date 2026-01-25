import { sharedStateCache } from './SharedStateCache';

export class TradeSimulator {

  constructor() {}

  /**
   * Simulates a trade along a given path to calculate the output amount.
   * @param path An array of token addresses representing the trade route.
   * @param amountIn The amount of the input token.
   * @returns The estimated output amount of the final token in the path.
   */
  public simulatePath(path: string[], amountIn: bigint): bigint | null {
    let currentAmount = amountIn;

    for (let i = 0; i < path.length - 1; i++) {
      const tokenIn = path[i];
      const tokenOut = path[i + 1];

      const poolAddress = this.findPool(tokenIn, tokenOut);
      if (!poolAddress) {
        return null; // Pool not found for this leg of the trade
      }
      
      const poolState = sharedStateCache.getPoolState(poolAddress);
      if (!poolState) {
        return null;
      }

      const amountOut = this.getAmountOut(poolState, tokenIn, currentAmount);
      if (amountOut === null) {
        return null;
      }
      currentAmount = amountOut;
    }

    return currentAmount;
  }

  private getAmountOut(poolState: any, tokenIn: string, amountIn: bigint): bigint | null {
    const zeroForOne = tokenIn === poolState.token0;
    const liquidity = BigInt(poolState.liquidity);
    const sqrtPriceX96 = BigInt(poolState.sqrtPriceX96);
    const fee = poolState.fee || 3000; // Default to 0.3% fee
    const feeAmount = (amountIn * BigInt(fee)) / 1000000n; // Fee is in basis points
    const amountInAfterFee = amountIn - feeAmount;

    if (liquidity === 0n) return 0n;

    // Simplified constant product formula: x * y = k
    // amountOut = (reserve1 * amountInAfterFee) / (reserve0 + amountInAfterFee)
    if (zeroForOne) {
      // Trading token0 for token1
      const reserve0 = liquidity;
      const reserve1 = (sqrtPriceX96 * sqrtPriceX96 * liquidity) / (1n << 192n);
      const numerator = reserve1 * amountInAfterFee;
      const denominator = reserve0 + amountInAfterFee;
      return numerator / denominator;
    } else {
      // Trading token1 for token0
      const reserve1 = liquidity;
      const reserve0 = (liquidity * (1n << 192n)) / (sqrtPriceX96 * sqrtPriceX96);
      const numerator = reserve0 * amountInAfterFee;
      const denominator = reserve1 + amountInAfterFee;
      return numerator / denominator;
    }
  }

  private findPool(tokenA: string, tokenB: string): string | undefined {
    const pools = sharedStateCache.getPoolsForToken(tokenA);
    const pool = pools.find(pool => (pool.token0 === tokenA && pool.token1 === tokenB) || (pool.token0 === tokenB && pool.token1 === tokenA));
    return pool ? (pool as any).address : undefined;
  }
}
