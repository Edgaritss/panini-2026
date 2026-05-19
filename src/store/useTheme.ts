import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  defaultTheme,
  findTheme,
  type ThemeColors,
  type ThemePalette,
} from '../lib/themes';

interface ThemeState {
  paletteId: string;
  setPalette: (id: string) => void;
  getPalette: () => ThemePalette;
}

const STORAGE_KEY = 'panini-2026-theme';
const TRANSITION_CLASS = 'theme-transitioning';
const TRANSITION_MS = 220;

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      paletteId: defaultTheme.id,
      setPalette: (id) => {
        const palette = findTheme(id);
        set({ paletteId: palette.id });
        applyPalette(palette, currentMode());
      },
      getPalette: () => findTheme(get().paletteId),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    },
  ),
);

function currentMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

let transitionTimer: number | null = null;

/**
 * Writes the palette's CSS variables to :root and (briefly) enables a
 * crossfade so the swap looks intentional. Mode tells us which side of the
 * palette to pull from; the .dark class itself is managed by App.tsx.
 */
export function applyPalette(
  palette: ThemePalette,
  mode: 'light' | 'dark',
  options: { animate?: boolean } = {},
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const colors: ThemeColors = mode === 'dark' ? palette.dark : palette.light;

  const animate =
    options.animate !== false &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate) {
    root.classList.add(TRANSITION_CLASS);
    if (transitionTimer !== null) window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      root.classList.remove(TRANSITION_CLASS);
      transitionTimer = null;
    }, TRANSITION_MS);
  }

  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-container', colors.secondaryContainer);
  root.style.setProperty('--on-secondary', colors.onSecondary);
  root.style.setProperty('--owned', colors.owned);
  root.style.setProperty('--on-owned', colors.onOwned);
  root.style.setProperty('--duplicate', colors.duplicate);
  root.style.setProperty('--on-duplicate', colors.onDuplicate);
}

/**
 * Apply the persisted palette before first paint (called from main.tsx) and
 * keep other tabs in sync via the storage event.
 */
export function initializeTheme(): void {
  if (typeof document === 'undefined') return;

  // Sync on load: the dark class isn't set yet (App.tsx's effect runs after
  // mount), so figure out the effective mode from the persisted album theme
  // and the OS preference.
  applyPalette(useTheme.getState().getPalette(), guessInitialMode(), {
    animate: false,
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    // Zustand's persist will rehydrate on its own; we just need to repaint.
    applyPalette(useTheme.getState().getPalette(), currentMode());
  });
}

function guessInitialMode(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem('panini-2026-album');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: string } };
      const t = parsed.state?.theme;
      if (t === 'dark') return 'dark';
      if (t === 'light') return 'light';
    }
  } catch {
    // ignore — fall through to system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
