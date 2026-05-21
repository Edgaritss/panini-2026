import { useEffect, useState } from 'react';

/**
 * Returns a number that increments every `intervalMs` ms, forcing components
 * that depend on relative-time strings to re-render.
 */
export function useRelativeTime(intervalMs = 30_000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return tick;
}
