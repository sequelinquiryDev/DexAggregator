import { RoutingEngine } from './RoutingEngine';
import { TradeSimulator } from './TradeSimulator';
import { sharedStateCache } from './SharedStateCache';

export interface TradeExecutionPlan {
  finalAmountOut: string;
  distribution: {
    route: string[];
    amount: string;
  }[];
}

export class SwapController {
  private routingEngine: RoutingEngine;
  private tradeSimulator: TradeSimulator;

  constructor() {
    this.routingEngine = new RoutingEngine();
    this.tradeSimulator = new TradeSimulator();
  }

  /**
   * Finds the best trade and returns a quote.
   * @param tokenIn The address of the input token.
   * @param tokenOut The address of the output token.
   * @param amountIn The amount of the input token.
   * @returns The best quote found, including the route and output amount, or a split distribution.
   */
  public async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{ route?: string[]; amountOut?: string; distribution?: any } | null> {
    const routes = this.routingEngine.findRoutes(tokenIn, tokenOut);
    if (routes.length === 0) {
      return null; // No routes found
    }

    const amountInBI = BigInt(amountIn);

    // For a single route, just return the best one
    if (routes.length === 1) {
      const amountOut = this.tradeSimulator.simulatePath(routes[0], amountInBI);
      if (!amountOut) {
        return null;
      }
      return {
        route: routes[0],
        amountOut: amountOut.toString(),
      };
    }

    // For multiple routes, find the optimal split allocation
    const plan = this.findOptimalSplit(routes, amountInBI);
    if (!plan) {
      return null;
    }

    return plan;
  }

  /**
   * Allocates the input amount across multiple routes to maximize output.
   * Uses an iterative algorithm that greedily allocates to the best marginal rate.
   * @param routes All available trading routes.
   * @param amountIn Total input amount to split.
   * @returns A trade execution plan with distribution across routes.
   */
  private findOptimalSplit(
    routes: string[][],
    amountIn: bigint
  ): TradeExecutionPlan | null {
    if (routes.length === 0) {
      return null;
    }

    // Initialize allocations for each route
    const allocations: bigint[] = routes.map(() => 0n);
    const incrementSize = amountIn / BigInt(100); // Use 1% increments for granularity

    if (incrementSize === 0n) {
      // If amount is too small, just use the first route
      const amountOut = this.tradeSimulator.simulatePath(routes[0], amountIn);
      if (!amountOut) {
        return null;
      }
      return {
        finalAmountOut: amountOut.toString(),
        distribution: [{ route: routes[0], amount: amountIn.toString() }],
      };
    }

    let remainingAmount = amountIn;

    // Greedy allocation: repeatedly assign increments to the best marginal route
    while (remainingAmount > 0n) {
      const allocAmount = remainingAmount < incrementSize ? remainingAmount : incrementSize;
      let bestRouteIdx = 0;
      let bestMarginalOutput = 0n;

      // Find which route offers the best marginal output for this increment
      for (let i = 0; i < routes.length; i++) {
        const testAllocation = allocations[i] + allocAmount;
        const outputForRoute = this.tradeSimulator.simulatePath(routes[i], testAllocation);

        if (outputForRoute) {
          // Marginal output is the additional output from this increment
          const marginalOutput = outputForRoute - (allocations[i] > 0n ? this.tradeSimulator.simulatePath(routes[i], allocations[i]) || 0n : 0n);
          if (marginalOutput > bestMarginalOutput) {
            bestMarginalOutput = marginalOutput;
            bestRouteIdx = i;
          }
        }
      }

      allocations[bestRouteIdx] += allocAmount;
      remainingAmount -= allocAmount;
    }

    // Calculate final outputs for each route and total
    let totalAmountOut = 0n;
    const distribution: { route: string[]; amount: string; output: string }[] = [];

    for (let i = 0; i < routes.length; i++) {
      if (allocations[i] > 0n) {
        const output = this.tradeSimulator.simulatePath(routes[i], allocations[i]);
        if (output) {
          distribution.push({
            route: routes[i],
            amount: allocations[i].toString(),
            output: output.toString(),
          });
          totalAmountOut += output;
        }
      }
    }

    if (distribution.length === 0) {
      return null;
    }

    return {
      finalAmountOut: totalAmountOut.toString(),
      distribution,
    };
  }
}

