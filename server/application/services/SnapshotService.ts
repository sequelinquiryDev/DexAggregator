import { Token, Pool } from "../../domain/entities";
import { EthersAdapter } from "../../infrastructure/adapters/EthersAdapter";

export class SnapshotService {
  private ethersAdapter: EthersAdapter;

  constructor(ethersAdapter: EthersAdapter) {
    this.ethersAdapter = ethersAdapter;
  }

  async bootstrapPools(tokens: Token[]): Promise<Pool[]> {
    const pools: Pool[] = [];

    const chainId = await this.ethersAdapter.getChainId();
    const chainTokens = tokens.filter(t => t.chainId === chainId);

    for (let i = 0; i < chainTokens.length; i++) {
        for (let j = i + 1; j < chainTokens.length; j++) {
            const tokenA = chainTokens[i];
            const tokenB = chainTokens[j];

            const foundPools = await this.ethersAdapter.getPools(tokenA, tokenB);
            pools.push(...foundPools);
        }
    }

    return pools;
  }
}
