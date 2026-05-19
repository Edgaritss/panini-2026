import { create } from 'zustand';

interface Snapshot {
  counts: Record<string, number>;
  firstAddedAt: number | null;
}

interface MigrationState {
  pendingSnapshot: Snapshot | null;
  capture: (s: Snapshot) => void;
  clear: () => void;
}

export const useMigration = create<MigrationState>((set) => ({
  pendingSnapshot: null,
  capture: (s) => set({ pendingSnapshot: s }),
  clear: () => set({ pendingSnapshot: null }),
}));
