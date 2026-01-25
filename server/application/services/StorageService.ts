import fs from 'fs/promises';
import path from 'path';
import { Token, Pool } from '../../domain/entities';

// Resolve data directory relative to the server root
const DATA_DIR = path.resolve(path.dirname(import.meta.url.replace('file://', '')), '../../data');

export class StorageService {
  async read(fileName: string): Promise<any> {
    try {
      const filePath = path.join(DATA_DIR, fileName);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return default value for the specific file
        if (fileName.startsWith('pools_')) {
          return {};
        } else if (fileName === 'tokens.json' || fileName.startsWith('tokens_')) {
          return [];
        }
      }
      throw error;
    }
  }

  async write(fileName: string, data: any): Promise<void> {
    const filePath = path.join(DATA_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Get tokens for a specific network
   * @param chainId Network chain ID (1 = Ethereum, 137 = Polygon)
   * @returns Array of tokens for the network
   */
  async getTokensByNetwork(chainId: number): Promise<Token[]> {
    const fileName = `tokens_${chainId === 1 ? 'ethereum' : 'polygon'}.json`;
    return await this.read(fileName) as Token[];
  }

  /**
   * @deprecated Use getTokensByNetwork instead
   */
  async getTokens(): Promise<Token[]> {
    return await this.read('tokens.json') as Token[];
  }

  async savePools(pools: Pool[], chainId: number): Promise<void> {
    const fileName = `pools_${chainId === 1 ? 'ethereum' : 'polygon'}.json`;
    const existingPools = await this.read(fileName);

    pools.forEach(pool => {
      const poolKey = `${pool.token0.address}_${pool.token1.address}`;
      existingPools[poolKey] = pool.address;
    });

    await this.write(fileName, existingPools);
  }
}
