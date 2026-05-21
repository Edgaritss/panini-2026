import type { ActivityAction, ActivityEntry } from '../types';

/** Hard cap kept in storage. UI usually shows 5 (Stats card) or 50 (full page). */
export const MAX_ACTIVITY_ENTRIES = 50;

export const IMPORT_STICKER_ID = '__IMPORT__';

interface AddEntryParams {
  current: ActivityEntry[];
  stickerId: string;
  action: ActivityAction;
  count?: number;
  /** Optional clock override (useful for tests / staggered bulk inserts). */
  at?: number;
}

/**
 * Prepends a new entry to the activity list and trims to MAX_ACTIVITY_ENTRIES.
 * Pure: returns a new array, does not mutate.
 */
export function addActivityEntry(params: AddEntryParams): ActivityEntry[] {
  const { current, stickerId, action, count, at } = params;
  const entry: ActivityEntry = {
    stickerId,
    action,
    timestamp: new Date(at ?? Date.now()).toISOString(),
    ...(count !== undefined ? { count } : {}),
  };
  return [entry, ...current].slice(0, MAX_ACTIVITY_ENTRIES);
}

/**
 * Append several entries (one per sticker id) in chronological order, each
 * timestamp 1ms apart so the rendering order is deterministic.
 */
export function addBulkAddEntries(
  current: ActivityEntry[],
  ids: string[],
  countsAfter: Record<string, number>,
): ActivityEntry[] {
  if (ids.length === 0) return current;
  const now = Date.now();
  const additions: ActivityEntry[] = ids.map((id, i) => ({
    stickerId: id,
    action: 'add',
    timestamp: new Date(now + i).toISOString(),
    count: countsAfter[id],
  }));
  // newest first: reverse and prepend.
  return [...additions.reverse(), ...current].slice(0, MAX_ACTIVITY_ENTRIES);
}

export function isImportEntry(e: ActivityEntry): boolean {
  return e.action === 'import' || e.stickerId === IMPORT_STICKER_ID;
}
