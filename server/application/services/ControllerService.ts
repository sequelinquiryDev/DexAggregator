import { EthersAdapter } from '../../infrastructure/adapters/EthersAdapter';
import { StorageService } from './StorageService';
import { Token } from '../../domain/entities';
import { QuoteRequest } from './RequestBatcher';
import { CacheService } from './CacheService';
import { DispatcherService } from './DispatcherService';
import { calculateBestPrice, Quote } from '../../domain/pricing';
import { Pool } from '../../domain/entities';

const REFRESH_INTERVAL = 10000; // 10 seconds

export class ControllerService {
  private lastUpdated: Map<string, number> = new Map();
  private tokenMetadata: Map<string, Token> = new Map();
  private ethereumPools: Record<string, string> = {};
  private polygonPools: Record<string, string> = {};

  constructor(
    private readonly ethersAdapter: EthersAdapter,
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
    private readonly dispatcherService: DispatcherService
  ) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    console.log("Controller: Loading initial token and pool data...");
    const tokens = await this.storageService.getTokens();
    this.tokenMetadata = new Map(tokens.map(t => [t.address, t]));

    this.ethereumPools = await this.storageService.read('pools_ethereum.json');
    this.polygonPools = await this.storageService.read('pools_polygon.json');
    console.log("Controller: Initial data loaded.");
  }

  public async getQuotes(requests: QuoteRequest[]): Promise<void> {
    requests.forEach(req => this.dispatcherService.register(req.id, req.resolve));
    const uniqueRequests = Array.from(new Map(requests.map(req => [req.id, req])).values());

    for (const request of uniqueRequests) {
      const cacheKey = this.cacheService.generateKey(request.tokenIn.address, request.tokenOut.address, request.amount);
      const cachedQuote = this.cacheService.getQuote(cacheKey);

      if (cachedQuote) {
        this.dispatcherService.dispatch(request.id, cachedQuote);
        continue;
      }

      const tokensToUpdate = new Set<string>([request.tokenIn.address, request.tokenOut.address]);
      const now = Date.now();

      const needsUpdate = Array.from(tokensToUpdate).some(address => {
        const lastUpdate = this.lastUpdated.get(address);
        return !lastUpdate || (now - lastUpdate) > REFRESH_INTERVAL;
      });

      if (needsUpdate) {
        const tokensByChain = this.groupTokensByChain(Array.from(tokensToUpdate));

        for (const [chainId, addresses] of Object.entries(tokensByChain)) {
          const chainIdNum = parseInt(chainId, 10);
          const poolsToQuery = this.getAssociatedPools(addresses, chainIdNum);
          
          if (poolsToQuery.length > 0) {
            const poolData = await this.ethersAdapter.getBatchPoolData(poolsToQuery.map(p => p.address), chainIdNum);
            const tokenIn = this.tokenMetadata.get(request.tokenIn.address);
            const tokenOut = this.tokenMetadata.get(request.tokenOut.address);
            if (tokenIn && tokenOut) {
                const quote = calculateBestPrice(tokenIn, tokenOut, request.amount, poolData);
                if (quote) {
                    this.cacheService.setQuote(cacheKey, quote);
                    this.dispatcherService.dispatch(request.id, quote);
                    addresses.forEach(address => this.lastUpdated.set(address, now));
                } else {
                    this.dispatcherService.dispatch(request.id, { error: 'Could not calculate price' } as any);
                }
            }
          }
        }
      } else {
        const tokensByChain = this.groupTokensByChain(Array.from(tokensToUpdate));
        for (const [chainId, addresses] of Object.entries(tokensByChain)) {
          const chainIdNum = parseInt(chainId, 10);
          const poolsToQuery = this.getAssociatedPools(addresses, chainIdNum);
          if (poolsToQuery.length > 0) {
            const poolData = await this.ethersAdapter.getBatchPoolData(poolsToQuery.map(p => p.address), chainIdNum);
            const tokenIn = this.tokenMetadata.get(request.tokenIn.address);
            const tokenOut = this.tokenMetadata.get(request.tokenOut.address);
            if (tokenIn && tokenOut) {
                const quote = calculateBestPrice(tokenIn, tokenOut, request.amount, poolData);
                if (quote) {
                    this.cacheService.setQuote(cacheKey, quote);
                    this.dispatcherService.dispatch(request.id, quote);
                }
            }
          }
        }
      }
    }
  }

  private groupTokensByChain(tokenAddresses: string[]): Record<number, string[]> {
    const grouped: Record<number, string[]> = {};
    for (const address of tokenAddresses) {
      const metadata = this.tokenMetadata.get(address);
      if (metadata) {
        if (!grouped[metadata.chainId]) {
          grouped[metadata.chainId] = [];
        }
        grouped[metadata.chainId].push(address);
      }
    }
    return grouped;
  }

  private getAssociatedPools(tokenAddresses: string[], chainId: number): Pool[] {
    const relevantPools = chainId === 1 ? this.ethereumPools : this.polygonPools;
    const poolsToQuery: Pool[] = [];

    const addressSet = new Set(tokenAddresses);

    for (const [poolKey, poolAddress] of Object.entries(relevantPools)) {
      const [tokenA_address, tokenB_address] = poolKey.split('_');
      if (addressSet.has(tokenA_address) || addressSet.has(tokenB_address)) {
        const tokenA = this.tokenMetadata.get(tokenA_address);
        const tokenB = this.tokenMetadata.get(tokenB_address);

        if (tokenA && tokenB) {
            poolsToQuery.push({
                address: poolAddress,
                token0: tokenA,
                token1: tokenB,
                sqrtPriceX96: BigInt(0),
                liquidity: BigInt(0),
                reserve0: BigInt(0), 
                reserve1: BigInt(0), 
                feeTier: 0
            });
        }
      }
    }

    return poolsToQuery;
  }
}
