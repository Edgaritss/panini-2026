import { Link, useNavigate } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { sectionByCode } from '../data/album';
import { formatRelative } from '../lib/formatActivityTime';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { isImportEntry } from '../lib/recordActivity';
import { Icon } from './Icon';

const VISIBLE = 3;

export function MiniActivityWidget() {
  useRelativeTime();
  const navigate = useNavigate();
  const activity = useAlbumStore((s) => s.recentActivity);
  const shown = activity.slice(0, VISIBLE);
  if (shown.length === 0) return null;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 flex items-center gap-3 overflow-x-auto">
      <p className="text-caps text-on-surface-variant uppercase whitespace-nowrap">
        Últimas estampas
      </p>
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
        {shown.map((entry) => {
          const code = entry.stickerId.match(/^([A-Z]{2,4})/)?.[1];
          const section = code ? sectionByCode.get(code) : undefined;
          const importEntry = isImportEntry(entry);
          const label = importEntry
            ? `+${entry.count ?? 0} importadas`
            : `${entry.action === 'add' ? '+1' : '−1'} ${entry.stickerId}`;
          return (
            <button
              key={`${entry.stickerId}-${entry.timestamp}`}
              type="button"
              onClick={() => {
                if (section && !importEntry) {
                  navigate(`/seccion/${section.code}`, {
                    state: { highlight: entry.stickerId },
                  });
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-small whitespace-nowrap transition-colors ${
                entry.action === 'add' || importEntry
                  ? 'bg-owned/10 text-owned hover:bg-owned/20'
                  : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
              }`}
            >
              <span className="font-mono">{label}</span>
              <span className="opacity-70">· {formatRelative(entry.timestamp)}</span>
            </button>
          );
        })}
      </div>
      <Link
        to="/actividad"
        className="text-small text-on-surface-variant hover:text-secondary whitespace-nowrap inline-flex items-center gap-1"
      >
        Ver todas
        <Icon name="arrow_forward" size={14} />
      </Link>
    </section>
  );
}
