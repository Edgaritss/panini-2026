import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import type {
  ActivityEntry,
  FilterMode,
  QuickAddNotice,
  SyncState,
  Theme,
} from '../types';
import { sections, TOTAL } from '../data/album';
import {
  addActivityEntry,
  addBulkAddEntries,
  IMPORT_STICKER_ID,
} from '../lib/recordActivity';
import {
  alreadyCelebrated,
  clearAllCelebrated,
  markCelebrated,
  unmarkCelebrated,
  useCelebration,
} from './useCelebration';
import { useAnimations, type StickerEvent } from './useAnimations';
import { shouldAnimate, shouldCelebrate } from './useSettings';

const STICK_DELAY_MS = 400;
const BULK_STAGGER_MS = 80;
const BULK_ANIMATION_LIMIT = 5;

function dispatchStickerEvent(id: string, event: StickerEvent, delay = 0): void {
  if (!shouldAnimate('stick')) return;
  if (delay > 0) {
    window.setTimeout(() => useAnimations.getState().trigger(id, event), delay);
  } else {
    useAnimations.getState().trigger(id, event);
  }
}

interface AlbumState {
  counts: Record<string, number>;
  recentActivity: ActivityEntry[];
  theme: Theme;
  filter: FilterMode;
  search: string;
  openSections: Record<string, boolean>;
  notice: QuickAddNotice | null;
  firstAddedAt: number | null;
  localUpdatedAt: number;
  fullAlbumCelebratedAt: number | null;
  lastAuthedUserId: string | null;
  sync: SyncState;

  increment: (id: string) => void;
  decrement: (id: string) => void;
  setCount: (id: string, count: number) => void;
  bulkIncrement: (ids: string[], invalidCount?: number, silent?: boolean) => void;
  dismissNotice: () => void;
  reset: () => void;
  importData: (counts: Record<string, number>) => void;
  clearActivity: () => void;

  setTheme: (theme: Theme) => void;
  setFilter: (filter: FilterMode) => void;
  setSearch: (search: string) => void;
  toggleSection: (code: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  setSync: (patch: Partial<SyncState>) => void;
  hydrateFromRemote: (data: {
    counts: Record<string, number>;
    recentActivity: ActivityEntry[];
    firstAddedAt: number | null;
    fullAlbumCelebratedAt: number | null;
    remoteUpdatedAt: number;
    userId: string;
  }) => void;
  markFullAlbumCelebrated: () => void;
}

type Persisted = Pick<
  AlbumState,
  | 'counts'
  | 'recentActivity'
  | 'theme'
  | 'filter'
  | 'openSections'
  | 'firstAddedAt'
  | 'localUpdatedAt'
  | 'fullAlbumCelebratedAt'
  | 'lastAuthedUserId'
>;

const persistOptions: PersistOptions<AlbumState, Persisted> = {
  name: 'panini-2026-album',
  version: 6,
  partialize: (state) => ({
    counts: state.counts,
    recentActivity: state.recentActivity,
    theme: state.theme,
    filter: state.filter,
    openSections: state.openSections,
    firstAddedAt: state.firstAddedAt,
    localUpdatedAt: state.localUpdatedAt,
    fullAlbumCelebratedAt: state.fullAlbumCelebratedAt,
    lastAuthedUserId: state.lastAuthedUserId,
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
    if (version < 5) {
      if (s.lastAuthedUserId === undefined) s.lastAuthedUserId = null;
    }
    if (version < 6) {
      if (s.recentActivity === undefined) s.recentActivity = [];
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
    for (let i = 1; i <= s.stickerCount; i += 1) {
      if ((counts[`${s.code}${i}`] ?? 0) >= 1) n += 1;
    }
    perSection.set(s.code, n);
    totalOwned += n;
  }
  return { perSection, totalOwned };
}

function processCompletions(
  before: Record<string, number>,
  after: Record<string, number>,
  silent: boolean,
): void {
  const a = tally(before);
  const b = tally(after);
  const completedNow: string[] = [];
  for (const s of sections) {
    const was = a.perSection.get(s.code) ?? 0;
    const now = b.perSection.get(s.code) ?? 0;
    const target = s.stickerCount;
    // If a section falls out of "complete", allow it to celebrate again next time.
    if (was === target && now < target) unmarkCelebrated(s.code);
    if (was < target && now === target && !alreadyCelebrated(s.code)) {
      completedNow.push(s.code);
    }
  }
  if (silent || completedNow.length === 0) return;

  const last = completedNow[completedNow.length - 1];
  markCelebrated(last);

  const albumFull = b.totalOwned === TOTAL;
  const previouslyCelebratedAlbum =
    useAlbumStore.getState().fullAlbumCelebratedAt !== null;
  const isFullAlbumMoment = albumFull && !previouslyCelebratedAlbum;

  if (isFullAlbumMoment) {
    useAlbumStore.setState({ fullAlbumCelebratedAt: Date.now() });
  }
  // The celebration overlay always shows when the user has it enabled, even
  // under prefers-reduced-motion — the overlay itself drops the confetti and
  // the floating trophy in that case.
  if (!shouldCelebrate()) return;
  // Wait for the stick animation (if any) to finish before showing the overlay.
  const delay = shouldAnimate('stick') ? STICK_DELAY_MS : 0;
  if (delay > 0) {
    window.setTimeout(
      () => useCelebration.getState().trigger(last, isFullAlbumMoment),
      delay,
    );
  } else {
    useCelebration.getState().trigger(last, isFullAlbumMoment);
  }
}

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set, get) => ({
      counts: {},
      recentActivity: [],
      theme: 'auto',
      filter: 'all',
      search: '',
      openSections: {},
      notice: null,
      firstAddedAt: null,
      localUpdatedAt: 0,
      fullAlbumCelebratedAt: null,
      lastAuthedUserId: null,
      sync: { status: 'initializing', lastSyncedAt: null, lastError: null },

      increment: (id) => {
        const before = get().counts;
        set((state) => {
          const counts = { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 };
          return {
            counts,
            ...withFirstAdded(state, counts),
            recentActivity: addActivityEntry({
              current: state.recentActivity,
              stickerId: id,
              action: 'add',
              count: counts[id],
            }),
          };
        });
        const prev = before[id] ?? 0;
        dispatchStickerEvent(id, prev === 0 ? 'stick' : 'duplicate');
        processCompletions(before, get().counts, false);
      },
      decrement: (id) => {
        const before = get().counts;
        set((state) => {
          const current = state.counts[id] ?? 0;
          if (current <= 0) return state;
          const counts = { ...state.counts };
          if (current - 1 === 0) delete counts[id];
          else counts[id] = current - 1;
          return {
            counts,
            localUpdatedAt: Date.now(),
            recentActivity: addActivityEntry({
              current: state.recentActivity,
              stickerId: id,
              action: 'remove',
              count: counts[id] ?? 0,
            }),
          };
        });
        // Pass silent=true: a decrement never triggers a celebration,
        // but we still want to clear the "celebrated" flag if a section
        // fell out of 20/20 so it can celebrate again later.
        processCompletions(before, get().counts, true);
        const prev = before[id] ?? 0;
        const now = get().counts[id] ?? 0;
        if (prev === 1 && now === 0) dispatchStickerEvent(id, 'unstick');
      },
      setCount: (id, count) => {
        const before = get().counts;
        set((state) => {
          const counts = { ...state.counts };
          if (count <= 0) delete counts[id];
          else counts[id] = Math.floor(count);
          const prevC = state.counts[id] ?? 0;
          const newC = counts[id] ?? 0;
          let activity = state.recentActivity;
          if (newC !== prevC) {
            activity = addActivityEntry({
              current: activity,
              stickerId: id,
              action: newC > prevC ? 'add' : 'remove',
              count: newC,
            });
          }
          return {
            counts,
            ...withFirstAdded(state, counts),
            recentActivity: activity,
          };
        });
        const prev = before[id] ?? 0;
        const now = get().counts[id] ?? 0;
        if (prev === 0 && now >= 1) dispatchStickerEvent(id, 'stick');
        else if (prev >= 1 && now > prev) dispatchStickerEvent(id, 'duplicate');
        else if (prev >= 1 && now === 0) dispatchStickerEvent(id, 'unstick');
        processCompletions(before, get().counts, false);
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
            recentActivity: addBulkAddEntries(state.recentActivity, ids, counts),
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

        // Stagger sticker animations only when adding a small handful.
        if (!silent && ids.length > 0 && ids.length <= BULK_ANIMATION_LIMIT) {
          const running: Record<string, number> = { ...before };
          ids.forEach((id, i) => {
            const prev = running[id] ?? 0;
            running[id] = prev + 1;
            const event: StickerEvent = prev === 0 ? 'stick' : 'duplicate';
            dispatchStickerEvent(id, event, i * BULK_STAGGER_MS);
          });
        }

        processCompletions(before, get().counts, silent);
      },
      dismissNotice: () => set({ notice: null }),
      reset: () => {
        clearAllCelebrated();
        set({
          counts: {},
          recentActivity: [],
          notice: null,
          firstAddedAt: null,
          fullAlbumCelebratedAt: null,
          localUpdatedAt: Date.now(),
        });
      },
      importData: (counts) =>
        set((state) => {
          const importedTotal = Object.values(counts).reduce(
            (a, c) => a + (c > 0 ? 1 : 0),
            0,
          );
          return {
            counts,
            notice: null,
            ...withFirstAdded(state, counts),
            recentActivity: addActivityEntry({
              current: state.recentActivity,
              stickerId: IMPORT_STICKER_ID,
              action: 'import',
              count: importedTotal,
            }),
          };
        }),
      clearActivity: () =>
        set({ recentActivity: [], localUpdatedAt: Date.now() }),

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
        recentActivity,
        firstAddedAt,
        fullAlbumCelebratedAt,
        remoteUpdatedAt,
        userId,
      }) =>
        set((state) => ({
          counts,
          recentActivity,
          firstAddedAt,
          fullAlbumCelebratedAt,
          localUpdatedAt: remoteUpdatedAt,
          lastAuthedUserId: userId,
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
