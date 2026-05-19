import {
  COLLECTION_ID,
  supabase,
  supabaseConfigured,
  type CollectionRow,
} from './supabase';
import { useAlbumStore } from '../store/useAlbumStore';
import type { SyncState } from '../types';

const DEBOUNCE_MS = 600;
let saveTimer: number | undefined;
let initialized = false;
let pushing = false;

function setStatus(patch: Partial<SyncState>): void {
  useAlbumStore.getState().setSync(patch);
}

export async function initSync(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Always subscribe to mutations so we mark dirty + schedule save.
  useAlbumStore.subscribe((state, prev) => {
    if (
      state.counts === prev.counts &&
      state.firstAddedAt === prev.firstAddedAt
    ) {
      return;
    }
    scheduleSave();
  });

  if (!supabaseConfigured) {
    setStatus({ status: 'disabled', lastError: 'No configurado' });
    return;
  }

  window.addEventListener('online', () => {
    void saveNow();
  });
  window.addEventListener('offline', () => {
    setStatus({ status: 'offline' });
  });

  if (!navigator.onLine) {
    setStatus({ status: 'offline' });
    return;
  }

  await hydrate();
}

async function hydrate(): Promise<void> {
  if (!supabase || !COLLECTION_ID) return;
  setStatus({ status: 'initializing' });
  const { data, error } = await supabase
    .from('collections')
    .select('id, owned, first_added_at, updated_at')
    .eq('id', COLLECTION_ID)
    .single<CollectionRow>();

  if (error || !data) {
    setStatus({
      status: 'error',
      lastError: error?.message ?? 'Fila no encontrada',
    });
    return;
  }

  const remoteUpdatedAt = new Date(data.updated_at).getTime();
  const remoteFirstAdded = data.first_added_at
    ? new Date(data.first_added_at).getTime()
    : null;
  const localUpdatedAt = useAlbumStore.getState().localUpdatedAt;

  if (remoteUpdatedAt >= localUpdatedAt) {
    useAlbumStore.getState().hydrateFromRemote({
      counts: data.owned ?? {},
      firstAddedAt: remoteFirstAdded,
      remoteUpdatedAt,
    });
  } else {
    // Local is newer → push it up.
    setStatus({ status: 'idle', lastSyncedAt: remoteUpdatedAt });
    void saveNow();
  }
}

function scheduleSave(): void {
  if (!supabaseConfigured) return;
  if (saveTimer) window.clearTimeout(saveTimer);
  setStatus({ status: 'saving' });
  saveTimer = window.setTimeout(() => {
    void saveNow();
  }, DEBOUNCE_MS);
}

export async function saveNow(): Promise<void> {
  if (!supabase || !COLLECTION_ID) return;
  if (pushing) return;
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  if (!navigator.onLine) {
    setStatus({ status: 'offline' });
    return;
  }

  pushing = true;
  setStatus({ status: 'saving' });
  const state = useAlbumStore.getState();
  const updatedAt = new Date().toISOString();
  const firstAddedAt = state.firstAddedAt
    ? new Date(state.firstAddedAt).toISOString()
    : null;

  const { error } = await supabase
    .from('collections')
    .update({
      owned: state.counts,
      first_added_at: firstAddedAt,
      updated_at: updatedAt,
    })
    .eq('id', COLLECTION_ID);

  pushing = false;

  if (error) {
    setStatus({ status: 'error', lastError: error.message });
    return;
  }
  setStatus({ status: 'idle', lastSyncedAt: Date.now(), lastError: null });
}
