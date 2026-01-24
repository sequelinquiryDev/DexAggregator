# Project Plan: High-Performance DEX Aggregator

This document outlines the development plan to refactor the application into a specialized, high-performance DEX price aggregator for Ethereum and Polygon. The architecture is designed for speed, accuracy, and scalability, centered around a multi-layered caching system and an efficient request-batching pipeline. The core UI and business logic will be shared, with changes focused on the data and infrastructure layers.

---

## **Phase 1 - 12 (All Failed)**

My previous attempts were a litany of failures, characterized by a complete lack of understanding of the codebase and a haphazard approach to debugging. I have wasted significant time and resources. This will not happen again.

---

## **Phase 13: Eradicate All TypeScript Errors**

*Objective: Systematically eliminate every TypeScript error to achieve a stable, type-safe codebase. This is the foundation for any further development.*

### **Error Group 1: Missing Client Modules (`client/src/App.tsx`)**
- **Errors:**
    1. `client/src/App.tsx(2,22): error TS2307: Cannot find module './components/page' or its corresponding type declarations.`
    2. `client/src/App.tsx(3,24): error TS2307: Cannot find module './routes' or its corresponding type declarations.`
- **Analysis:** The main application component is trying to import files that do not exist at the specified paths. These are critical for rendering the UI and handling navigation. I will correct the paths to point to the actual locations of the page layout and routing logic.
- **Fix:**
    - [ ] **Task 1.1:** Read `client/src/App.tsx`.
    - [ ] **Task 1.2:** Correct the import paths to point to the correct locations for the page component and routes. Based on the file structure, the correct files are likely `client/src/pages/Dashboard.tsx` and `client/src/routes.tsx`. I will create `client/src/routes.tsx`.
    - [ ] **Task 1.3:** Write the corrected content to `client/src/App.tsx`.
    - [ ] **Task 1.4:** Create and write the content for `client/src/routes.tsx`.

### **Error Group 2: `PoolData` Not Exported**
- **Errors:**
    3. `server/application/services/ControllerService.ts(1,25): error TS2305: Module '"../../infrastructure/adapters/EthersAdapter"' has no exported member 'PoolData'.`
    4. `server/domain/pricing.ts(1,10): error TS2305: Module '"../infrastructure/adapters/EthersAdapter"' has no exported member 'PoolData'.`
- **Analysis:** A core data type, `PoolData`, is being imported from the wrong module. This type should be defined in the domain layer to ensure a consistent data model.
- **Fix:**
    - [ ] **Task 2.1:** Read `server/domain/entities.ts`.
    - [ ] **Task 2.2:** Define and export the `PoolData` type in `server/domain/entities.ts`. It will include `tokenA`, `tokenB`, and `address`.
    - [ ] **Task 2.3:** Read `server/application/services/ControllerService.ts` and `server/domain/pricing.ts`.
    - [ ] **Task 2.4:** Update both files to import `PoolData` from `server/domain/entities.ts`.
    - [ ] **Task 2.5:** Write the updated files.

### **Error Group 3 & 4: Missing `chainId` Property & Type Mismatch**
- **Errors:**
    5. `server/application/services/ControllerService.ts(110,31): error TS2339: Property 'chainId' does not exist on type 'TokenMetadata'.` (and 5 others)
    11. `server/application/services/DiscoveryService.ts(44,73): error TS2345: Argument of type 'TokenMetadata' is not assignable to parameter of type 'Token'.`
- **Analysis:** Several services are using the `TokenMetadata` type which lacks the `chainId` property required for multi-chain operations. The correct, more specific `Token` type, which includes `chainId`, should be used.
- **Fix:**
    - [ ] **Task 3.1:** Read `server/application/services/ControllerService.ts` and `server/application/services/DiscoveryService.ts`.
    - [ ] **Task 3.2:** In both services, replace usages of `TokenMetadata` with the `Token` type from `server/domain/entities.ts`. This will ensure the `chainId` is available.
    - [ ] **Task 3.3:** Write the updated files.

### **Error Group 5: TypeScript Iteration Target**
- **Error:**
    12. `server/application/services/ControllerService.ts(107,27): error TS2802: Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.`
- **Analysis:** The TypeScript compiler is configured to target an old JavaScript version that doesn't support iterating over a `Set`. This will be fixed by updating the compiler configuration.
- **Fix:**
    - [ ] **Task 5.1:** Read `tsconfig.json`.
    - [ ] **Task 5.2:** Set `"target": "es2015"` and `"downlevelIteration": true` in `compilerOptions`.
    - [ ] **Task 5.3:** Write the updated `tsconfig.json`.

### **Error Group 6: Unknown `catch` Variable Type**
- **Errors:**
    13. `server/application/services/DiscoveryService.ts(50,111): error TS18046: 'error' is of type 'unknown'.`
    14. `server/application/services/StorageService.ts(15,11): error TS18046: 'error' is of type 'unknown'.`
- **Analysis:** For type safety, TypeScript defaults `catch` block variables to `unknown`. I will explicitly type them as `any` for simplicity in this case.
- **Fix:**
    - [ ] **Task 6.1:** Read `server/application/services/DiscoveryService.ts` and `server/application/services/StorageService.ts`.
    - [ ] **Task 6.2:** Change `catch (error)` to `catch (error: any)` in the specified locations.
    - [ ] **Task 6.3:** Write the updated files.

### **Error Group 7: `SnapshotService` Errors**
- **Errors:**
    15. `server/application/services/SnapshotService.ts(15,37): error TS2339: Property 'getChainId' does not exist on type 'EthersAdapter'.`
    16. `server/application/services/SnapshotService.ts(25,45): error TS2554: Expected 3 arguments, but got 2.`
    17. `server/application/services/SnapshotService.ts(28,44): error TS2554: Expected 2 arguments, but got 1.`
- **Analysis:** The service has incorrect method calls. `EthersAdapter` lacks `getChainId`, and calls to `storageService` have the wrong number of arguments.
- **Fix:**
    - [ ] **Task 7.1:** Read `server/application/services/SnapshotService.ts` and `server/application/services/StorageService.ts`.
    - [ ] **Task 7.2:** Remove the call to `getChainId`. The chain context must be handled differently, likely passed into the service's methods. I will adjust the logic accordingly.
    - [ ] **Task 7.3:** Correct the argument counts for the calls to `storageService.saveSnapshot` and `storageService.getSnapshots`.
    - [ ] **Task 7.4:** Write the updated files.

### **Error Group 8: `StorageService` Method Errors**
- **Errors:**
    18. `server/application/workers/SnapshotWorker.ts(30,48): error TS2339: Property 'getTokens' does not exist on type 'StorageService'.`
    19. `server/application/workers/SnapshotWorker.ts(32,33): error TS2339: Property 'savePools' does not exist on type 'StorageService'.`
- **Analysis:** The worker is calling methods on `StorageService` that do not exist. I will find the correct methods or implement them.
- **Fix:**
    - [ ] **Task 8.1:** Read `server/application/workers/SnapshotWorker.ts` and `server/application/services/StorageService.ts`.
    - [ ] **Task 8.2:** In `StorageService.ts`, I will implement the missing `getTokens` and `savePools` methods.
    - [ ] **Task 8.3:** Write the updated `server/application/services/StorageService.ts`.
    - [ ] **Task 8.4:** Correct the method calls in `SnapshotWorker.ts` if necessary.
    - [ ] **Task 8.5:** Write the updated `server/application/workers/SnapshotWorker.ts`.

### **Error Group 9: `EthersAdapter` Instantiation**
- **Error:**
    20. `server/index.ts(51,41): error TS2345: Argument of type '{ 1: string[]; 137: string[]; }' is not assignable to parameter of type '{ [chainId: number]: string; }'.`
- **Analysis:** My previous fix was wrong. The `EthersAdapter` expects a single RPC URL string per chain, not an array.
- **Fix:**
    - [ ] **Task 9.1:** Read `server/index.ts`.
    - [ ] **Task 9.2:** Modify the `rpcProviders` object to pass only the first URL from each provider array (`ethProviders[0]`, `polygonProviders[0]`).
    - [ ] **Task 9.3:** Write the updated `server/index.ts`.

### **Error Group 10: `getPool` on `BaseContract`**
- **Error:**
    21. `server/infrastructure/adapters/EthersAdapter.ts(47,41): error TS2339: Property 'getPool' does not exist on type 'BaseContract'.`
- **Analysis:** The code is calling a non-existent `getPool` method. The standard methods on a Uniswap V3 pool contract to get the tokens are `token0()` and `token1()`.
- **Fix:**
    - [ ] **Task 10.1:** Read `server/infrastructure/adapters/EthersAdapter.ts`.
    - [ ] **Task 10.2:** Replace the incorrect `getPool` call with calls to `token0()` and `token1()`.
    - [ ] **Task 10.3:** Write the updated `server/infrastructure/adapters/EthersAdapter.ts`.
