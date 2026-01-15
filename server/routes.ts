import type { Express } from "express";
import { createServer, type Server } from "http";
import { api } from "@shared/routes";
import { SnapshotService } from "./application/services/SnapshotService";
import { MockAdapter } from "./infrastructure/adapters/MockAdapter";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Clean Architecture Setup ===
  // 1. Initialize Adapters (Infrastructure Layer)
  const ethereumAdapter = new MockAdapter("ethereum");
  const polygonAdapter = new MockAdapter("polygon");

  // 2. Initialize Service (Application Layer)
  const snapshotService = new SnapshotService([ethereumAdapter, polygonAdapter]);

  // === API Routes (Infrastructure Layer - Controller) ===
  
  app.get(api.snapshots.getLatest.path, async (req, res) => {
    try {
      const chain = req.params.chain;
      
      // Try to get from cache first, if not generate new
      let snapshot = snapshotService.getLatestSnapshot(chain);
      
      if (!snapshot) {
        // In a real app, this might trigger a background job or wait
        // For prototype, we generate on demand
        snapshot = await snapshotService.generateSnapshot(chain);
      } else {
        // Background refresh simulation: 
        // If snapshot is older than 5 seconds, regenerate in background
        if (Date.now() - snapshot.timestamp > 5000) {
           snapshotService.generateSnapshot(chain).catch(console.error);
        }
      }

      res.json(snapshot);
    } catch (error) {
      if (error instanceof Error && error.message.includes("No adapter")) {
        res.status(404).json({ message: "Chain not supported" });
      } else {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
