import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterMode, Theme, View } from '../types';
import { sections } from '../data/album';

interface AlbumState {
  counts: Record<string, number>;
  theme: Theme;
  filter: FilterMode;
  search: string;
  view: View;
  openSections: Record<string, boolean>;

  increment: (id: string) => void;
  decrement: (id: string) => void;
  setCount: (id: string, count: number) => void;
  bulkIncrement: (ids: string[]) => void;
  reset: () => void;
  importData: (counts: Record<string, number>) => void;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setFilter: (filter: FilterMode) => void;
  setSearch: (search: string) => void;
  setView: (view: View) => void;
  toggleSection: (code: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set) => ({
      counts: {},
      theme: 'light',
      filter: 'all',
      search: '',
      view: 'home',
      openSections: {},

      increment: (id) =>
        set((state) => ({
          counts: { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 },
        })),
      decrement: (id) =>
        set((state) => {
          const current = state.counts[id] ?? 0;
          if (current <= 0) return state;
          const counts = { ...state.counts };
          if (current - 1 === 0) delete counts[id];
          else counts[id] = current - 1;
          return { counts };
        }),
      setCount: (id, count) =>
        set((state) => {
          const counts = { ...state.counts };
          if (count <= 0) delete counts[id];
          else counts[id] = Math.floor(count);
          return { counts };
        }),
      bulkIncrement: (ids) =>
        set((state) => {
          if (ids.length === 0) return state;
          const counts = { ...state.counts };
          for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
          return { counts };
        }),
      reset: () => set({ counts: {} }),
      importData: (counts) => set({ counts }),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setView: (view) => set({ view }),
      toggleSection: (code) =>
        set((s) => ({
          openSections: { ...s.openSections, [code]: !s.openSections[code] },
        })),
      expandAll: () =>
        set({
          openSections: Object.fromEntries(sections.map((s) => [s.code, true])),
        }),
      collapseAll: () => set({ openSections: {} }),
    }),
    {
      name: 'panini-2026-album',
      version: 1,
    },
  ),
);
