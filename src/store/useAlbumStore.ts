import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import type {
  FilterMode,
  QuickAddNotice,
  SyncState,
  Theme,
} from '../types';
import { sections } from '../data/album';
import {
  alreadyCelebrated,
  markCelebrated,
  useCelebration,
} from './useCelebration';

interface AlbumState {
  counts: Record<string, number>;
  theme: Theme;
  filter: FilterMode;
  search: string;
  openSections: Record<string, boolean>;
  notice: QuickAddNotice | null;
  firstAddedAt: number | null;
  localUpdatedAt: number;
  fullAlbumCelebratedAt: number | null;
  sync: SyncState;

  increment: (id: string) => void;
  decrement: (id: string) => void;
  setCount: (id: string, count: number) => void;
  bulkIncrement: (ids: string[], invalidCount?: number, silent?: boolean) => void;
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
    fullAlbumCelebratedAt: number | null;
    remoteUpdatedAt: number;
  }) => void;
  markFullAlbumCelebrated: () => void;
}

type Persisted = Pick<
  AlbumState,
  | 'counts'
  | 'theme'
  | 'filter'
  | 'openSections'
  | 'firstAddedAt'
  | 'localUpdatedAt'
  | 'fullAlbumCelebratedAt'
>;

const persistOptions: PersistOptions<AlbumState, Persisted> = {
  name: 'panini-2026-album',
  version: 4,
  partialize: (state) => ({
    counts: state.counts,
    theme: state.theme,
    filter: state.filter,
    openSections: state.openSections,
    firstAddedAt: state.firstAddedAt,
    localUpdatedAt: state.localUpdatedAt,
    fullAlbumCelebratedAt: state.fullAlbumCelebratedAt,
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
    if (version < 4) {
      if (s.fullAlbumCelebratedAt === undefined) s.fullAlbumCelebratedAt = null;
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

interface PerSectionTotals {
  perSection: Map<string, number>;
  totalOwned: number;
}

function tally(counts: Record<string, number>): PerSectionTotals {
  const perSection = new Map<string, number>();
  let totalOwned = 0;
  for (const s of sections) {
    let n = 0;
    for (let i = 1; i <= 20; i += 1) {
      if ((counts[`${s.code}${i}`] ?? 0) >= 1) n += 1;
    }
    perSection.set(s.code, n);
    totalOwned += n;
  }
  return { perSection, totalOwned };
}

function maybeFireCelebration(
  before: Record<string, number>,
  after: Record<string, number>,
  silent: boolean,
): void {
  if (silent) return;
  const a = tally(before);
  const b = tally(after);
  const completedNow: string[] = [];
  for (const s of sections) {
    const was = a.perSection.get(s.code) ?? 0;
    const now = b.perSection.get(s.code) ?? 0;
    if (was < 20 && now === 20 && !alreadyCelebrated(s.code)) {
      completedNow.push(s.code);
    }
  }
  if (completedNow.length === 0) return;

  const last = completedNow[completedNow.length - 1];
  markCelebrated(last);

  const albumFull = b.totalOwned === sections.length * 20;
  const previouslyCelebratedAlbum =
    useAlbumStore.getState().fullAlbumCelebratedAt !== null;
  const isFullAlbumMoment = albumFull && !previouslyCelebratedAlbum;

  if (isFullAlbumMoment) {
    useAlbumStore.setState({ fullAlbumCelebratedAt: Date.now() });
  }
  useCelebration.getState().trigger(last, isFullAlbumMoment);
}

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set, get) => ({
      counts: {},
      theme: 'auto',
      filter: 'all',
      search: '',
      openSections: {},
      notice: null,
      firstAddedAt: null,
      localUpdatedAt: 0,
      fullAlbumCelebratedAt: null,
      sync: { status: 'initializing', lastSyncedAt: null, lastError: null },

      increment: (id) => {
        const before = get().counts;
        set((state) => {
          const counts = { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 };
          return { counts, ...withFirstAdded(state, counts) };
        });
        maybeFireCelebration(before, get().counts, false);
      },
      decrement: (id) =>
        set((state) => {
          const current = state.counts[id] ?? 0;
          if (current <= 0) return state;
          const counts = { ...state.counts };
          if (current - 1 === 0) delete counts[id];
          else counts[id] = current - 1;
          return { counts, localUpdatedAt: Date.now() };
        }),
      setCount: (id, count) => {
        const before = get().counts;
        set((state) => {
          const counts = { ...state.counts };
          if (count <= 0) delete counts[id];
          else counts[id] = Math.floor(count);
          return { counts, ...withFirstAdded(state, counts) };
        });
        maybeFireCelebration(before, get().counts, false);
      },
      bulkIncrement: (ids, invalidCount = 0, silent = false) => {
        if (ids.length === 0 && invalidCount === 0) return;
        const before = get().counts;
        set((state) => {
          const counts = { ...state.counts };
          for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
          return {
            counts,
            ...withFirstAdded(state, counts),
            notice: silent
              ? state.notice
              : {
                  added: ids.length,
                  ids: ids.slice(0, 6),
                  invalid: invalidCount,
                  at: Date.now(),
                },
          };
        });
        maybeFireCelebration(before, get().counts, silent);
      },
      dismissNotice: () => set({ notice: null }),
      reset: () =>
        set({
          counts: {},
          notice: null,
          firstAddedAt: null,
          fullAlbumCelebratedAt: null,
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
      hydrateFromRemote: ({
        counts,
        firstAddedAt,
        fullAlbumCelebratedAt,
        remoteUpdatedAt,
      }) =>
        set((state) => ({
          counts,
          firstAddedAt,
          fullAlbumCelebratedAt,
          localUpdatedAt: remoteUpdatedAt,
          sync: {
            ...state.sync,
            status: 'idle',
            lastSyncedAt: remoteUpdatedAt,
            lastError: null,
          },
        })),
      markFullAlbumCelebrated: () =>
        set((state) => ({
          fullAlbumCelebratedAt:
            state.fullAlbumCelebratedAt ?? Date.now(),
          localUpdatedAt: Date.now(),
        })),
    }),
    persistOptions,
  ),
);
