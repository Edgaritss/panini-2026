export type SectionCategory = 'special' | 'sponsor' | 'team';

export interface Section {
  code: string;
  name: string;
  group: string | null;
  stickerCount: number;
  category: SectionCategory;
}

export interface Sticker {
  id: string;
  number: number;
  sectionCode: string;
  sectionName: string;
  group: string | null;
  category: SectionCategory;
}

export type FilterMode = 'all' | 'missing' | 'have' | 'duplicate';

export type ActivityAction = 'add' | 'remove' | 'import';

export interface ActivityEntry {
  /** Sticker id (e.g. MEX10) or "__IMPORT__" for bulk imports. */
  stickerId: string;
  action: ActivityAction;
  /** ISO 8601 timestamp (client clock). */
  timestamp: string;
  /** For 'add'/'remove': count after the change. For 'import': total imported. */
  count?: number;
}
export type Theme = 'light' | 'dark' | 'auto';

export interface QuickAddNotice {
  added: number;
  ids: string[];
  invalid: number;
  at: number;
}

export type SyncStatus =
  | 'initializing'
  | 'idle'
  | 'saving'
  | 'offline'
  | 'error'
  | 'disabled';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  lastError: string | null;
}
