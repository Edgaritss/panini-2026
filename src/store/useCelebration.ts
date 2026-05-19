import { create } from 'zustand';

const SS_KEY = 'panini-2026:celebrated-sections';

function readCelebrated(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = sessionStorage.getItem(SS_KEY) ?? '';
  return new Set(raw.split(',').filter(Boolean));
}

function persistCelebrated(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SS_KEY, Array.from(set).join(','));
}

export function alreadyCelebrated(sectionCode: string): boolean {
  return readCelebrated().has(sectionCode);
}

export function markCelebrated(sectionCode: string): void {
  const set = readCelebrated();
  set.add(sectionCode);
  persistCelebrated(set);
}

export function unmarkCelebrated(sectionCode: string): void {
  const set = readCelebrated();
  if (!set.has(sectionCode)) return;
  set.delete(sectionCode);
  persistCelebrated(set);
}

export function clearAllCelebrated(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SS_KEY);
}

interface CelebrationState {
  active: boolean;
  sectionCode: string | null;
  isFullAlbum: boolean;
  trigger: (sectionCode: string, isFullAlbum: boolean) => void;
  dismiss: () => void;
}

export const useCelebration = create<CelebrationState>((set) => ({
  active: false,
  sectionCode: null,
  isFullAlbum: false,
  trigger: (sectionCode, isFullAlbum) =>
    set({ active: true, sectionCode, isFullAlbum }),
  dismiss: () => set({ active: false }),
}));
