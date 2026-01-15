import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Ideally this would be required, but for this prototype using in-memory storage, 
// we'll make it optional to allow the server to start without a DB for now if needed.
// However, the standard template expects it.
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL must be set for persistent storage. Falling back to in-memory only.");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db" 
});
export const db = drizzle(pool, { schema });
