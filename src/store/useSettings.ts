import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  stickAnimationEnabled: boolean;
  celebrationEnabled: boolean;
  reducedMotionEnabled: boolean;
  toggleStickAnimation: () => void;
  toggleCelebration: () => void;
  toggleReducedMotion: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      stickAnimationEnabled: true,
      celebrationEnabled: true,
      reducedMotionEnabled: false,
      toggleStickAnimation: () =>
        set((s) => ({ stickAnimationEnabled: !s.stickAnimationEnabled })),
      toggleCelebration: () =>
        set((s) => ({ celebrationEnabled: !s.celebrationEnabled })),
      toggleReducedMotion: () =>
        set((s) => ({ reducedMotionEnabled: !s.reducedMotionEnabled })),
    }),
    {
      name: 'panini-2026-settings',
      version: 1,
    },
  ),
);

export type AnimationKind = 'stick' | 'celebration';

export function shouldAnimate(kind: AnimationKind): boolean {
  if (typeof window === 'undefined') return false;
  const s = useSettings.getState();
  if (s.reducedMotionEnabled) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (kind === 'stick') return s.stickAnimationEnabled;
  if (kind === 'celebration') return s.celebrationEnabled;
  return true;
}

/**
 * The celebration overlay should still SHOW when reduced motion is on — only
 * its confetti / floating trophy are suppressed (handled inside the overlay).
 * It is only fully suppressed when the user toggles celebrations off.
 */
export function shouldCelebrate(): boolean {
  return useSettings.getState().celebrationEnabled;
}
