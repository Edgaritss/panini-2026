export interface Section {
  code: string;
  name: string;
  group: string | null;
}

export interface Sticker {
  id: string;
  number: number;
  sectionCode: string;
  sectionName: string;
  group: string | null;
}

export type FilterMode = 'all' | 'missing' | 'have' | 'duplicate';
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
