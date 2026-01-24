import { SnapshotService } from '../services/SnapshotService';
import { StorageService } from '../services/StorageService';
import { Pool } from '../../domain/entities';

export class SnapshotWorker {
  private snapshotService: SnapshotService;
  private storageService: StorageService;
  private interval: NodeJS.Timeout | null = null;

  constructor(snapshotService: SnapshotService, storageService: StorageService) {
    this.snapshotService = snapshotService;
    this.storageService = storageService;
  }

  start(refreshIntervalMs: number) {
    console.log('Starting snapshot worker...');
    this.interval = setInterval(() => this.run(), refreshIntervalMs);
    this.run(); // Run once immediately
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async run() {
    try {
      console.log('Refreshing pool data...');
      const tokens = await this.storageService.getTokens();
      const pools = await this.snapshotService.bootstrapPools(tokens);

      // Group pools by chain ID
      const poolsByChain: { [chainId: number]: Pool[] } = {};
      for (const pool of pools) {
        const chainId = pool.token0.chainId; // Assuming token0 and token1 have the same chainId
        if (!poolsByChain[chainId]) {
          poolsByChain[chainId] = [];
        }
        poolsByChain[chainId].push(pool);
      }

      // Save pools for each chain
      for (const chainId in poolsByChain) {
        await this.storageService.savePools(poolsByChain[chainId], Number(chainId));
      }

      console.log('Pool data refreshed successfully.');
    } catch (error) {
      console.error('Error refreshing pool data:', error);
    }
  }
}
