import { useAlbumStore } from '../store/useAlbumStore';
import type { SyncStatus } from '../types';

const COPY: Record<SyncStatus, { dot: string; label: string }> = {
  initializing: { dot: 'bg-on-surface-variant animate-pulse', label: 'Conectando…' },
  idle: { dot: 'bg-owned', label: 'Sincronizado' },
  saving: { dot: 'bg-secondary-fixed animate-pulse', label: 'Guardando…' },
  offline: { dot: 'bg-on-surface-variant', label: 'Sin conexión' },
  error: { dot: 'bg-secondary', label: 'Error al sincronizar' },
  disabled: { dot: 'bg-outline-variant', label: 'Solo local (sin Supabase)' },
};

export function SyncIndicator() {
  const sync = useAlbumStore((s) => s.sync);
  const { dot, label } = COPY[sync.status];
  const detail =
    sync.status === 'error' && sync.lastError
      ? `${label}: ${sync.lastError}`
      : sync.lastSyncedAt
        ? `${label} · ${formatRelative(sync.lastSyncedAt)}`
        : label;

  return (
    <span
      role="status"
      title={detail}
      aria-label={detail}
      className="hidden sm:inline-flex items-center gap-2 text-small text-on-surface-variant px-3 py-1 rounded-full bg-surface-container"
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
      <span className="hidden md:inline">{label}</span>
    </span>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'hace segundos';
  const min = Math.round(diff / 60_000);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return new Date(ts).toLocaleDateString();
}
