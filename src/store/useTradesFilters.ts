import { create } from 'zustand';
import type { Continent } from '../data/sectionMetadata';

export type TradesStatus = 'all' | 'missing' | 'duplicates' | 'near-complete';

// Sections where "casi completo" kicks in: ≤ NEAR_COMPLETE_THRESHOLD missing
export const NEAR_COMPLETE_THRESHOLD = 3;

interface TradesFiltersState {
  search: string;
  status: TradesStatus;
  groups: string[];
  continents: Continent[];

  setSearch: (q: string) => void;
  setStatus: (s: TradesStatus) => void;
  toggleGroup: (g: string) => void;
  toggleContinent: (c: Continent) => void;
  setGroups: (groups: string[]) => void;
  setContinents: (continents: Continent[]) => void;
  clearAll: () => void;

  activeFiltersCount: () => number;
  isAnyFilterActive: () => boolean;
}

const initial: Pick<
  TradesFiltersState,
  'search' | 'status' | 'groups' | 'continents'
> = {
  search: '',
  status: 'all',
  groups: [],
  continents: [],
};

// NOT persisted: each visit to /cambios starts clean.
export const useTradesFilters = create<TradesFiltersState>((set, get) => ({
  ...initial,

  setSearch: (q) => set({ search: q }),
  setStatus: (s) => set({ status: s }),
  toggleGroup: (g) =>
    set((state) => ({
      groups: state.groups.includes(g)
        ? state.groups.filter((x) => x !== g)
        : [...state.groups, g],
    })),
  toggleContinent: (c) =>
    set((state) => ({
      continents: state.continents.includes(c)
        ? state.continents.filter((x) => x !== c)
        : [...state.continents, c],
    })),
  setGroups: (groups) => set({ groups }),
  setContinents: (continents) => set({ continents }),
  clearAll: () => set(initial),

  activeFiltersCount: () => {
    const s = get();
    let n = 0;
    if (s.search.trim().length > 0) n += 1;
    if (s.status !== 'all') n += 1;
    n += s.groups.length;
    n += s.continents.length;
    return n;
  },
  isAnyFilterActive: () => get().activeFiltersCount() > 0,
}));
