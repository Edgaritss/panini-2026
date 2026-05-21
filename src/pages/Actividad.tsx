import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { ActivityRow } from '../components/ActivityRow';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { dayKey, formatDayHeader } from '../lib/formatActivityTime';
import type { ActivityEntry } from '../types';

export function Actividad() {
  const activity = useAlbumStore((s) => s.recentActivity);
  const clearActivity = useAlbumStore((s) => s.clearActivity);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const groups = useMemo(() => groupByDay(activity), [activity]);
  const isEmpty = activity.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-display-l text-on-surface flex items-center gap-3">
            <Icon name="schedule" size={28} />
            Actividad completa
          </h1>
          <p className="text-body text-on-surface-variant mt-1">
            Las últimas {activity.length}{' '}
            {activity.length === 1 ? 'acción' : 'acciones'} sobre tu colección.
          </p>
        </div>
        <Link
          to="/estadisticas"
          className="text-small text-on-surface-variant hover:text-secondary"
        >
          ← Volver
        </Link>
      </div>

      {isEmpty ? (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
          <span className="text-5xl" aria-hidden>
            📋
          </span>
          <p className="text-body-strong text-on-surface">
            Sin actividad registrada todavía.
          </p>
          <p className="text-small text-on-surface-variant max-w-md">
            Cada vez que marques una estampa como obtenida o la quites, vas a
            ver el registro aquí.
          </p>
          <Link
            to="/album"
            className="mt-2 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-secondary text-on-secondary text-body-strong text-small hover:bg-secondary-container transition-colors"
          >
            Ir al álbum
            <Icon name="arrow_forward" size={16} />
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section
              key={group.key}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
            >
              <header className="px-5 py-3 border-b border-outline-variant">
                <h2 className="text-caps text-on-surface-variant uppercase">
                  {group.label}
                </h2>
              </header>
              <ul className="divide-y divide-outline-variant">
                {group.entries.map((entry) => (
                  <li key={`${entry.stickerId}-${entry.timestamp}`}>
                    <ActivityRow entry={entry} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-small text-on-surface-variant hover:text-secondary"
            >
              Limpiar historial
            </button>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Borrar todo el historial?"
        description="Se borrarán las entradas guardadas. Tu colección de estampas queda intacta."
        icon={{ name: 'history_toggle_off', tone: 'danger' }}
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                clearActivity();
                setConfirmOpen(false);
              }}
              className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm"
            >
              Sí, borrar
            </button>
          </>
        }
      />
    </div>
  );
}

interface DayGroup {
  key: string;
  label: string;
  entries: ActivityEntry[];
}

function groupByDay(entries: ActivityEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const entry of entries) {
    const key = dayKey(entry.timestamp);
    const existing = map.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      map.set(key, {
        key,
        label: formatDayHeader(entry.timestamp),
        entries: [entry],
      });
    }
  }
  return Array.from(map.values());
}
