import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import type {
  FilterMode,
  QuickAddNotice,
  SyncState,
  Theme,
} from '../types';
import { sections } from '../data/album';

interface AlbumState {
  counts: Record<string, number>;
  theme: Theme;
  filter: FilterMode;
  search: string;
  openSections: Record<string, boolean>;
  notice: QuickAddNotice | null;
  firstAddedAt: number | null;
  localUpdatedAt: number;
  sync: SyncState;

  increment: (id: string) => void;
  decrement: (id: string) => void;
  setCount: (id: string, count: number) => void;
  bulkIncrement: (ids: string[], invalidCount?: number) => void;
  dismissNotice: () => void;
  reset: () => void;
  importData: (counts: Record<string, number>) => void;

  setTheme: (theme: Theme) => void;
  setFilter: (filter: FilterMode) => void;
  setSearch: (search: string) => void;
  toggleSection: (code: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  setSync: (patch: Partial<SyncState>) => void;
  hydrateFromRemote: (data: {
    counts: Record<string, number>;
    firstAddedAt: number | null;
    remoteUpdatedAt: number;
  }) => void;
}

type Persisted = Pick<
  AlbumState,
  | 'counts'
  | 'theme'
  | 'filter'
  | 'openSections'
  | 'firstAddedAt'
  | 'localUpdatedAt'
>;

const persistOptions: PersistOptions<AlbumState, Persisted> = {
  name: 'panini-2026-album',
  version: 3,
  partialize: (state) => ({
    counts: state.counts,
    theme: state.theme,
    filter: state.filter,
    openSections: state.openSections,
    firstAddedAt: state.firstAddedAt,
    localUpdatedAt: state.localUpdatedAt,
  }),
  migrate: (persistedState, version) => {
    const s = (persistedState ?? {}) as Partial<Persisted> & {
      view?: unknown;
    };
    if (version < 3) {
      delete s.view;
      if (s.firstAddedAt === undefined) s.firstAddedAt = null;
      if (s.localUpdatedAt === undefined) s.localUpdatedAt = 0;
    }
    return s as Persisted;
  },
};

function withFirstAdded(
  state: AlbumState,
  newCounts: Record<string, number>,
): { firstAddedAt: number | null; localUpdatedAt: number } {
  const had = state.firstAddedAt !== null;
  const has = Object.keys(newCounts).length > 0;
  return {
    firstAddedAt: had ? state.firstAddedAt : has ? Date.now() : null,
    localUpdatedAt: Date.now(),
  };
}

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set) => ({
      counts: {},
      theme: 'auto',
      filter: 'all',
      search: '',
      openSections: {},
      notice: null,
      firstAddedAt: null,
      localUpdatedAt: 0,
      sync: { status: 'initializing', lastSyncedAt: null, lastError: null },

      increment: (id) =>
        set((state) => {
          const counts = { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 };
          return { counts, ...withFirstAdded(state, counts) };
        }),
      decrement: (id) =>
        set((state) => {
          const current = state.counts[id] ?? 0;
          if (current <= 0) return state;
          const counts = { ...state.counts };
          if (current - 1 === 0) delete counts[id];
          else counts[id] = current - 1;
          return { counts, localUpdatedAt: Date.now() };
        }),
      setCount: (id, count) =>
        set((state) => {
          const counts = { ...state.counts };
          if (count <= 0) delete counts[id];
          else counts[id] = Math.floor(count);
          return { counts, ...withFirstAdded(state, counts) };
        }),
      bulkIncrement: (ids, invalidCount = 0) =>
        set((state) => {
          if (ids.length === 0 && invalidCount === 0) return state;
          const counts = { ...state.counts };
          for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
          return {
            counts,
            ...withFirstAdded(state, counts),
            notice: {
              added: ids.length,
              ids: ids.slice(0, 6),
              invalid: invalidCount,
              at: Date.now(),
            },
          };
        }),
      dismissNotice: () => set({ notice: null }),
      reset: () =>
        set({
          counts: {},
          notice: null,
          firstAddedAt: null,
          localUpdatedAt: Date.now(),
        }),
      importData: (counts) =>
        set((state) => ({
          counts,
          notice: null,
          ...withFirstAdded(state, counts),
        })),

      setTheme: (theme) => set({ theme }),
      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      toggleSection: (code) =>
        set((s) => ({
          openSections: { ...s.openSections, [code]: !s.openSections[code] },
        })),
      expandAll: () =>
        set({
          openSections: Object.fromEntries(sections.map((s) => [s.code, true])),
        }),
      collapseAll: () => set({ openSections: {} }),

      setSync: (patch) =>
        set((state) => ({ sync: { ...state.sync, ...patch } })),
      hydrateFromRemote: ({ counts, firstAddedAt, remoteUpdatedAt }) =>
        set((state) => ({
          counts,
          firstAddedAt,
          localUpdatedAt: remoteUpdatedAt,
          sync: {
            ...state.sync,
            status: 'idle',
            lastSyncedAt: remoteUpdatedAt,
            lastError: null,
          },
        })),
    }),
    persistOptions,
  ),
);
