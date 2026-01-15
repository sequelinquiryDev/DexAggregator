import { Token, Pool } from "../../domain/entities";

export interface IChainAdapter {
  getChainName(): string;
  getTopPools(limit: number): Promise<Pool[]>;
  getStableTokenAddress(): string;
}

export class MockAdapter implements IChainAdapter {
  private chainName: string;
  private stableToken: Token;
  private tokens: Token[];

  constructor(chainName: string) {
    this.chainName = chainName;
    
    // Mock Data Setup
    this.stableToken = {
      symbol: "USDC",
      name: "USD Coin",
      address: `0xUSDC_${chainName}`,
      decimals: 6
    };

    this.tokens = [
      { symbol: "WETH", name: "Wrapped Ether", address: `0xWETH_${chainName}`, decimals: 18 },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: `0xWBTC_${chainName}`, decimals: 8 },
      { symbol: "UNI", name: "Uniswap", address: `0xUNI_${chainName}`, decimals: 18 },
      { symbol: "AAVE", name: "Aave", address: `0xAAVE_${chainName}`, decimals: 18 },
      { symbol: "LINK", name: "Chainlink", address: `0xLINK_${chainName}`, decimals: 18 },
    ];
  }

  getChainName(): string {
    return this.chainName;
  }

  getStableTokenAddress(): string {
    return this.stableToken.address;
  }

  async getTopPools(limit: number): Promise<Pool[]> {
    // Return mock pools with random variations to simulate live data
    return this.tokens.map(token => {
      // Simulate random reserves
      const basePrice = this.getBasePrice(token.symbol);
      const variation = 1 + (Math.random() * 0.02 - 0.01); // +/- 1%
      const price = basePrice * variation;

      // Create a pool with the stable token
      // 1 Token = price USDC
      // ReserveRatio = price
      
      const stableReserveVal = 1_000_000 * price; // $1M liquidity
      const tokenReserveVal = 1_000_000;

      return {
        address: `0xPool_${token.symbol}_${this.chainName}`,
        token0: token,
        token1: this.stableToken,
        reserve0: BigInt(Math.floor(tokenReserveVal * Math.pow(10, token.decimals))),
        reserve1: BigInt(Math.floor(stableReserveVal * Math.pow(10, this.stableToken.decimals))),
        feeTier: 3000 // 0.3%
      };
    });
  }

  private getBasePrice(symbol: string): number {
    switch (symbol) {
      case "WETH": return 3500;
      case "WBTC": return 65000;
      case "UNI": return 10;
      case "AAVE": return 120;
      case "LINK": return 18;
      default: return 1;
    }
  }
}
