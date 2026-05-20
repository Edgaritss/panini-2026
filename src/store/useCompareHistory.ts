import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareHistoryEntry {
  id: string;
  /** UNIX ms */
  at: number;
  kind: 'missing' | 'duplicates' | 'unknown';
  source: 'app' | 'permissive';
  pasteTotal: number;
  matchedTotal: number;
  /** Raw text so the user can re-open it without re-pasting. */
  rawText: string;
  /** What the user picked when the source was ambiguous. */
  resolvedKind: 'missing' | 'duplicates';
}

const MAX_ENTRIES = 5;

interface HistoryState {
  entries: CompareHistoryEntry[];
  add: (entry: Omit<CompareHistoryEntry, 'id' | 'at'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompareHistory = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => {
          const next: CompareHistoryEntry = {
            ...entry,
            id: `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            at: Date.now(),
          };
          return { entries: [next, ...state.entries].slice(0, MAX_ENTRIES) };
        }),
      remove: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'panini-2026-compare-history', version: 1 },
  ),
);
