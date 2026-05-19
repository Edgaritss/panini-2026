import { supabase, supabaseConfigured, type UserCollectionRow } from './supabase';
import { useAlbumStore } from '../store/useAlbumStore';
import { useAuth } from '../store/useAuth';
import { useMigration } from '../store/useMigration';
import type { SyncState } from '../types';

const DEBOUNCE_MS = 600;
let saveTimer: number | undefined;
let initialized = false;
let pushing = false;
let lastUserId: string | null = null;
let switching = false;

function setStatus(patch: Partial<SyncState>): void {
  useAlbumStore.getState().setSync(patch);
}

function currentUserId(): string | null {
  return useAuth.getState().user?.id ?? null;
}

export async function initSync(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Push debounced when the local data changes (only if a user is authed).
  useAlbumStore.subscribe((state, prev) => {
    if (
      state.counts === prev.counts &&
      state.firstAddedAt === prev.firstAddedAt &&
      state.fullAlbumCelebratedAt === prev.fullAlbumCelebratedAt
    ) {
      return;
    }
    if (switching || !currentUserId()) return;
    scheduleSave();
  });

  // React to auth changes.
  useAuth.subscribe((state, prev) => {
    if (state.user?.id === prev.user?.id) return;
    void handleUserChange(state.user?.id ?? null);
  });

  if (!supabaseConfigured) {
    setStatus({ status: 'disabled', lastError: 'No configurado' });
    return;
  }

  window.addEventListener('online', () => {
    if (currentUserId()) void saveNow();
  });
  window.addEventListener('offline', () => {
    setStatus({ status: 'offline' });
  });

  // Take the current snapshot (may be already authed via persisted session).
  await handleUserChange(currentUserId());
}

async function handleUserChange(userId: string | null): Promise<void> {
  if (userId === lastUserId) return;
  lastUserId = userId;
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }

  // If we're transitioning into an authed user AND the local state belongs to
  // a different (or no) previous user, capture a snapshot so the user can
  // decide whether to keep, merge, or discard those local counts.
  if (userId) {
    const album = useAlbumStore.getState();
    const localHasData = Object.keys(album.counts).length > 0;
    const ownsLocal = album.lastAuthedUserId === userId;
    if (localHasData && !ownsLocal) {
      useMigration.getState().capture({
        counts: album.counts,
        firstAddedAt: album.firstAddedAt,
      });
    }
  }

  // Clear any in-memory data from a previous user without triggering a save.
  switching = true;
  useAlbumStore.setState({
    counts: {},
    firstAddedAt: null,
    fullAlbumCelebratedAt: null,
    localUpdatedAt: 0,
    notice: null,
  });
  switching = false;

  if (!userId) {
    setStatus({ status: 'disabled', lastSyncedAt: null, lastError: null });
    return;
  }
  if (!supabaseConfigured) {
    setStatus({ status: 'disabled' });
    return;
  }
  if (!navigator.onLine) {
    setStatus({ status: 'offline' });
    return;
  }
  await hydrate(userId);
}

async function hydrate(userId: string): Promise<void> {
  if (!supabase) return;
  setStatus({ status: 'initializing' });
  const { data, error } = await supabase
    .from('user_collections')
    .select(
      'user_id, owned, first_added_at, full_album_celebrated_at, created_at, updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle<UserCollectionRow>();

  if (error) {
    setStatus({ status: 'error', lastError: error.message });
    return;
  }

  if (!data) {
    // Trigger should have created the row at signup. If it's missing, push current state to create it.
    setStatus({ status: 'saving' });
    await saveNow();
    return;
  }

  const remoteUpdatedAt = new Date(data.updated_at).getTime();
  const remoteFirstAdded = data.first_added_at
    ? new Date(data.first_added_at).getTime()
    : null;
  const remoteFullCelebrated = data.full_album_celebrated_at
    ? new Date(data.full_album_celebrated_at).getTime()
    : null;
  useAlbumStore.getState().hydrateFromRemote({
    counts: data.owned ?? {},
    firstAddedAt: remoteFirstAdded,
    fullAlbumCelebratedAt: remoteFullCelebrated,
    remoteUpdatedAt,
    userId,
  });
}

function scheduleSave(): void {
  if (!supabaseConfigured || !currentUserId()) return;
  if (saveTimer) window.clearTimeout(saveTimer);
  setStatus({ status: 'saving' });
  saveTimer = window.setTimeout(() => {
    void saveNow();
  }, DEBOUNCE_MS);
}

export async function saveNow(): Promise<void> {
  if (!supabase) return;
  const userId = currentUserId();
  if (!userId) return;
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
  const firstAddedAt = state.firstAddedAt
    ? new Date(state.firstAddedAt).toISOString()
    : null;
  const fullAlbumCelebratedAt = state.fullAlbumCelebratedAt
    ? new Date(state.fullAlbumCelebratedAt).toISOString()
    : null;

  const { error } = await supabase
    .from('user_collections')
    .upsert(
      {
        user_id: userId,
        owned: state.counts,
        first_added_at: firstAddedAt,
        full_album_celebrated_at: fullAlbumCelebratedAt,
      },
      { onConflict: 'user_id' },
    );

  pushing = false;

  if (error) {
    setStatus({ status: 'error', lastError: error.message });
    return;
  }
  setStatus({ status: 'idle', lastSyncedAt: Date.now(), lastError: null });
}
