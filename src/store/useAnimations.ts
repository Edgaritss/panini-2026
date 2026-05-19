import { create } from 'zustand';

export type StickerEvent = 'stick' | 'duplicate' | 'unstick';

interface Tagged {
  event: StickerEvent;
  // Monotonic counter so consumers can detect "another event arrived" even
  // when the same kind happens twice on the same sticker in a row.
  tick: number;
}

interface AnimationsState {
  /** Map of sticker id → latest event tag. */
  events: Map<string, Tagged>;
  trigger: (stickerId: string, event: StickerEvent) => void;
  clear: (stickerId: string) => void;
}

let counter = 0;
const TTL_MS = 600;
const timers = new Map<string, number>();

export const useAnimations = create<AnimationsState>((set, get) => ({
  events: new Map(),
  trigger: (stickerId, event) => {
    counter += 1;
    const tick = counter;
    const next = new Map(get().events);
    next.set(stickerId, { event, tick });
    set({ events: next });

    const existing = timers.get(stickerId);
    if (existing) window.clearTimeout(existing);
    const t = window.setTimeout(() => get().clear(stickerId), TTL_MS);
    timers.set(stickerId, t);
  },
  clear: (stickerId) => {
    const cur = get().events.get(stickerId);
    if (!cur) return;
    const next = new Map(get().events);
    next.delete(stickerId);
    set({ events: next });
    timers.delete(stickerId);
  },
}));

/** Read-only subscription helper for a specific sticker. */
export function useStickerEvent(stickerId: string): Tagged | null {
  return useAnimations((s) => s.events.get(stickerId) ?? null);
}
