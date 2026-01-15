// Generic storage interface - kept for architectural consistency
export interface IStorage {
  // Add methods here if needed for persistence later
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage
  }
}

export const storage = new MemStorage();
