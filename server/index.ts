import { json } from 'body-parser';
import express from 'express';
import { registerRoutes } from './routes.ts';
import { EthersAdapter } from './infrastructure/adapters/EthersAdapter';
import { DiscoveryService } from './application/services/DiscoveryService';
import { StorageService } from './application/services/StorageService';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(json());

// Provide public RPC fallbacks for resilience
const { ALCHEMY_API_KEY, INFURA_API_KEY, POLYGON_RPC_URL } = process.env;

if (!INFURA_API_KEY) {
  console.warn(
    'INFURA_API_KEY not found, using public RPC. This may result in rate-limiting.'
  );
}
if (!ALCHEMY_API_KEY) {
  console.warn(
    'ALCHEMY_API_KEY not found, using public RPC. This may result in rate-limiting.'
  );
}
if (!POLYGON_RPC_URL) {
  console.warn(
    'POLYGON_RPC_URL not found, using public RPC. This may result in rate-limiting.'
  );
}

const ethProviders = [
  `https://mainnet.infura.io/v3/${INFURA_API_KEY || '84842078b09946638c03157f83405213'}`,
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY || 'demo'}`,
];

const polygonProviders = [
  POLYGON_RPC_URL || 'https://polygon-rpc.com',
];

const ethersAdapter = new EthersAdapter(ethProviders, polygonProviders);
const storageService = new StorageService();

const discoveryService = new DiscoveryService(ethersAdapter, storageService);
discoveryService.discover();

// Register the routes
registerRoutes(server, app);

const port = process.env.PORT || 3001;
server.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);
