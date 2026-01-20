import { Pool } from "../../domain/entities";
import { IChainAdapter } from "./MockAdapter";
import { ethers } from "ethers";

// MakerDAO Multicall3 address (same on most chains)
const MULTICALL_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11";
const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)"
];

// Uniswap V3 Pool ABI snippet
const POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() view returns (uint128)"
];

export class EthersAdapter implements IChainAdapter {
  private chainName: string;
  private provider: ethers.JsonRpcProvider;
  private stableTokenAddress: string;
  private etherscanApiKey: string;

  constructor(chainName: string, rpcUrl: string, stableTokenAddress: string, etherscanApiKey: string) {
    console.log(`Initializing ${chainName} adapter with RPC: ${rpcUrl.substring(0, 20)}...`);
    this.chainName = chainName;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.stableTokenAddress = stableTokenAddress;
    this.etherscanApiKey = etherscanApiKey;
    
    // Test provider connection immediately
    this.provider.getNetwork().then(network => {
      console.log(`Connected to network: ${network.name} (${network.chainId})`);
    }).catch(err => {
      console.error(`Failed to connect to RPC for ${chainName}:`, err);
    });
  }

  getChainName(): string {
    return this.chainName;
  }

  getStableTokenAddress(): string {
    return this.stableTokenAddress;
  }

  async getTopPools(limit: number): Promise<Pool[]> {
    try {
      // Direct known high-liquidity Uniswap V3 pool addresses for Ethereum
      // Since Etherscan API is restricted, we'll use these verified pool addresses
      const knownPools = [
        "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // WETH/USDC 0.05%
        "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8", // WETH/USDC 0.3%
        "0x11b81a04b0d8cd7460f33088e6e85ef610ee87ca", // WETH/USDT 0.05%
        "0x4e68ccd0e5f129c0ad164741100d4c82c67759ff", // WETH/USDT 0.3%
        "0x60594a40393a30f5832bd721244345d199b5ad1f", // WETH/DAI 0.05%
        "0xc2e9f25be33638c030d947e133396c21a9a47361", // WBTC/WETH 0.05%
        "0xcbc300c4e0965e630138d58c87895f36e319b0f4", // LINK/WETH 0.3%
        "0x99ac8ca80195a51d03322c3b3e48242d0d37679b", // WBTC/USDC 0.3%
        "0x290a6a7460b3d8c199047c3f33310408434a535f", // LINK/USDC 0.3%
        "0x5777d92f208679db4b9778590fa3cab3ac9e2168", // DAI/USDC 0.01%
        "0xa63b490aa02ee571997850107a8265d61993050d", // WBTC/USDT 0.3%
        "0xfad57cc8ad19483c9068f6dcc00e885c7222046d"  // LINK/USDT 0.3%
      ];

      const poolInterface = new ethers.Interface([
        "function token0() view returns (address)",
        "function token1() view returns (address)",
        "function fee() view returns (uint24)"
      ]);

      const multicall = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, this.provider);
      const calls = knownPools.flatMap((address: string) => [
        { target: address, callData: poolInterface.encodeFunctionData("token0") },
        { target: address, callData: poolInterface.encodeFunctionData("token1") },
        { target: address, callData: poolInterface.encodeFunctionData("fee") }
      ]);

      const [, returnData] = await multicall.aggregate(calls);
      
      const pools: Pool[] = [];
      for (let i = 0; i < knownPools.length; i++) {
        try {
          const res0 = returnData[i * 3];
          const res1 = returnData[i * 3 + 1];
          const res2 = returnData[i * 3 + 2];
          
          if (!res0 || res0 === "0x" || !res1 || res1 === "0x" || !res2 || res2 === "0x") continue;
          
          const t0 = poolInterface.decodeFunctionResult("token0", res0)[0];
          const t1 = poolInterface.decodeFunctionResult("token1", res1)[0];
          const fee = poolInterface.decodeFunctionResult("fee", res2)[0];
          
          pools.push({
            address: knownPools[i],
            token0: { symbol: "...", name: "...", address: t0, decimals: 18 },
            token1: { symbol: "...", name: "...", address: t1, decimals: 18 },
            reserve0: BigInt(0),
            reserve1: BigInt(0),
            feeTier: Number(fee)
          });
        } catch (e) {
          continue;
        }
      }
      
      console.log(`[BOOTSTRAP] Loaded ${pools.length} verified Uniswap V3 pools for price discovery`);
      return pools;
    } catch (error) {
      console.error(`Error fetching pools for ${this.chainName}:`, error);
      return [];
    }
  }

  async getBatchPoolData(poolAddresses: string[]): Promise<any[]> {
    if (poolAddresses.length === 0) return [];

    const multicall = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, this.provider);
    const poolInterface = new ethers.Interface(POOL_ABI);

    // Filter out invalid addresses
    const validAddresses = poolAddresses.filter((addr: string) => ethers.isAddress(addr));
    if (validAddresses.length === 0) return [];

    const calls = validAddresses.flatMap(address => [
      {
        target: address,
        callData: poolInterface.encodeFunctionData("slot0")
      },
      {
        target: address,
        callData: poolInterface.encodeFunctionData("liquidity")
      }
    ]);

    try {
      const [, returnData] = await multicall.aggregate(calls);
      
      const results = [];
      for (let i = 0; i < validAddresses.length; i++) {
        try {
          const slot0Data = poolInterface.decodeFunctionResult("slot0", returnData[i * 2]);
          const liquidityData = poolInterface.decodeFunctionResult("liquidity", returnData[i * 2 + 1]);
          
          results.push({
            address: validAddresses[i],
            sqrtPriceX96: BigInt(slot0Data.sqrtPriceX96.toString()),
            liquidity: BigInt(liquidityData[0].toString())
          });
        } catch (e) {
          continue;
        }
      }
      return results;
    } catch (error) {
      console.error("Multicall aggregate failed:", error);
      return [];
    }
  }
}
