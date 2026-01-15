import { IChainAdapter } from "../../infrastructure/adapters/MockAdapter";
import { ChainSnapshot, SnapshotEntry } from "../../domain/entities";
import { computeSpotPrice, computeLiquidityUSD } from "../../domain/pricing";

export class SnapshotService {
  private adapters: Map<string, IChainAdapter>;
  // In-memory storage for the latest snapshot per chain
  private cache: Map<string, ChainSnapshot>;

  constructor(adapters: IChainAdapter[]) {
    this.adapters = new Map();
    this.cache = new Map();
    adapters.forEach(adapter => this.adapters.set(adapter.getChainName().toLowerCase(), adapter));
  }

  async generateSnapshot(chain: string): Promise<ChainSnapshot> {
    const adapter = this.adapters.get(chain.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${chain}`);
    }

    const pools = await adapter.getTopPools(10);
    const stableAddress = adapter.getStableTokenAddress();

    const entries: SnapshotEntry[] = pools.map(pool => {
      // Determine which token is being priced (the non-stable one)
      const isToken0Stable = pool.token0.address === stableAddress;
      const targetToken = isToken0Stable ? pool.token1 : pool.token0;

      const price = computeSpotPrice(pool, targetToken.address, stableAddress);
      
      // For liquidity, we treat stable price as $1 and target token price as calculated
      const liquidity = computeLiquidityUSD(
        pool, 
        isToken0Stable ? 1 : price, 
        isToken0Stable ? price : 1
      );

      return {
        token: targetToken,
        priceUSD: price,
        liquidityUSD: liquidity,
        volumeUSD: liquidity * 0.15, // Mock volume as 15% of liquidity
        marketCapUSD: price * 10_000_000 // Mock supply
      };
    });

    const snapshot: ChainSnapshot = {
      timestamp: Date.now(),
      chain: adapter.getChainName(),
      entries
    };

    this.cache.set(chain.toLowerCase(), snapshot);
    return snapshot;
  }

  getLatestSnapshot(chain: string): ChainSnapshot | undefined {
    return this.cache.get(chain.toLowerCase());
  }
}
