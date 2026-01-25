/**
 * ProvidersConfig - Centralized API Provider Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all external API calls:
 * - RPC Providers (Infura, Alchemy, Polygon)
 * - Block Explorer APIs (Etherscan, PolygonScan)
 * - Data Sources for Market Viewer and Swapper
 * 
 * API CALL SOURCES:
 * - Infura: RPC calls, JSON-RPC endpoints
 * - Alchemy: Enhanced RPC, token metadata
 * - Etherscan: Token info, transaction history
 * - Public RPCs: Fallback endpoints
 * 
 * SWITCHING ENDPOINTS:
 * Change values here to switch providers globally.
 * No other files need modification.
 */

interface ProviderEndpoints {
  rpc: string;
  etherscan: string;
  alchemy?: string;
  fallbackRpc: string;
}

interface ChainProviders {
  [chainId: number]: ProviderEndpoints;
}

class ProvidersConfig {
  private static instance: ProvidersConfig;
  
  // Environment variables (with fallbacks)
  private infuraApiKey: string;
  private alchemyApiKey: string;
  private etherscanApiKey: string;
  private polygonRpcUrl: string;

  // Provider endpoints per chain
  private chainProviders: ChainProviders;

  private constructor() {
    // Load from environment variables
    this.infuraApiKey = process.env.INFURA_API_KEY || '84842078b09946638c03157f83405213';
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || 'demo';
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || 'demo';
    this.polygonRpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

    // Initialize chain providers
    this.chainProviders = {
      // Ethereum Mainnet (Chain ID: 1)
      1: {
        rpc: `https://mainnet.infura.io/v3/${this.infuraApiKey}`,
        alchemy: `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
        etherscan: `https://api.etherscan.io/api?apikey=${this.etherscanApiKey}`,
        fallbackRpc: `https://eth-mainnet.alchemyapi.io/v2/${this.alchemyApiKey}`,
      },
      
      // Polygon (Chain ID: 137)
      137: {
        rpc: this.polygonRpcUrl,
        alchemy: `https://polygon-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
        etherscan: `https://api.polygonscan.com/api?apikey=${this.etherscanApiKey}`,
        fallbackRpc: 'https://polygon-rpc.com',
      },
    };

    this.logInitialization();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProvidersConfig {
    if (!ProvidersConfig.instance) {
      ProvidersConfig.instance = new ProvidersConfig();
    }
    return ProvidersConfig.instance;
  }

  /**
   * Get RPC endpoint for a specific chain
   * @param chainId Network chain ID (1 = Ethereum, 137 = Polygon)
   * @returns Primary RPC endpoint
   */
  public getRpcProvider(chainId: number): string {
    const provider = this.chainProviders[chainId];
    if (!provider) {
      throw new Error(`No RPC provider configured for chain ${chainId}`);
    }
    return provider.rpc;
  }

  /**
   * Get fallback RPC endpoint for a specific chain
   * @param chainId Network chain ID
   * @returns Fallback RPC endpoint
   */
  public getFallbackRpcProvider(chainId: number): string {
    const provider = this.chainProviders[chainId];
    if (!provider) {
      throw new Error(`No fallback RPC provider configured for chain ${chainId}`);
    }
    return provider.fallbackRpc;
  }

  /**
   * Get Alchemy endpoint for a specific chain
   * @param chainId Network chain ID
   * @returns Alchemy RPC endpoint
   */
  public getAlchemyProvider(chainId: number): string | undefined {
    const provider = this.chainProviders[chainId];
    if (!provider) {
      throw new Error(`No Alchemy provider configured for chain ${chainId}`);
    }
    return provider.alchemy;
  }

  /**
   * Get Etherscan API endpoint for a specific chain
   * @param chainId Network chain ID
   * @returns Etherscan API endpoint
   */
  public getEtherscanApi(chainId: number): string {
    const provider = this.chainProviders[chainId];
    if (!provider) {
      throw new Error(`No Etherscan API configured for chain ${chainId}`);
    }
    return provider.etherscan;
  }

  /**
   * Get all endpoints for a chain
   * @param chainId Network chain ID
   * @returns All configured endpoints for the chain
   */
  public getChainProviders(chainId: number): ProviderEndpoints {
    const provider = this.chainProviders[chainId];
    if (!provider) {
      throw new Error(`No providers configured for chain ${chainId}`);
    }
    return provider;
  }

  /**
   * Get supported chain IDs
   * @returns Array of supported chain IDs
   */
  public getSupportedChains(): number[] {
    return Object.keys(this.chainProviders).map(Number);
  }

  /**
   * Check if a chain is supported
   * @param chainId Network chain ID
   * @returns True if chain is supported
   */
  public isChainSupported(chainId: number): boolean {
    return chainId in this.chainProviders;
  }

  /**
   * Validate configuration
   * Logs warnings if API keys are missing or default
   */
  private logInitialization(): void {
    const warnings: string[] = [];

    if (this.infuraApiKey === '84842078b09946638c03157f83405213') {
      warnings.push('INFURA_API_KEY is using public fallback (may have rate limits)');
    }

    if (this.alchemyApiKey === 'demo') {
      warnings.push('ALCHEMY_API_KEY is using demo key (may have rate limits)');
    }

    if (this.etherscanApiKey === 'demo') {
      warnings.push('ETHERSCAN_API_KEY is using demo key (may have rate limits)');
    }

    if (this.polygonRpcUrl === 'https://polygon-rpc.com') {
      warnings.push('POLYGON_RPC_URL is using public endpoint (may have rate limits)');
    }

    if (warnings.length > 0) {
      console.warn('⚠️  ProvidersConfig Warnings:');
      warnings.forEach(w => console.warn(`   - ${w}`));
    } else {
      console.log('✓ ProvidersConfig: All API keys configured');
    }
  }

  /**
   * Get configuration status (for debugging)
   */
  public getStatus(): {
    chains: number[];
    infuraConfigured: boolean;
    alchemyConfigured: boolean;
    etherscanConfigured: boolean;
  } {
    return {
      chains: this.getSupportedChains(),
      infuraConfigured: this.infuraApiKey !== '84842078b09946638c03157f83405213',
      alchemyConfigured: this.alchemyApiKey !== 'demo',
      etherscanConfigured: this.etherscanApiKey !== 'demo',
    };
  }
}

// Export singleton instance
export const providersConfig = ProvidersConfig.getInstance();

// Also export the class for testing
export { ProvidersConfig };
