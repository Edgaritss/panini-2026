import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { ActivityRow } from './ActivityRow';
import { Icon } from './Icon';

const DEFAULT_VISIBLE = 5;

export function RecentActivityCard({ visible = DEFAULT_VISIBLE }: { visible?: number }) {
  const activity = useAlbumStore((s) => s.recentActivity);
  const shown = activity.slice(0, visible);
  const isEmpty = shown.length === 0;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <header className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="text-caps text-on-surface-variant uppercase flex items-center gap-2">
          <Icon name="schedule" size={16} />
          Actividad reciente
        </h3>
        {!isEmpty && activity.length > visible && (
          <Link
            to="/actividad"
            className="text-small text-on-surface-variant hover:text-secondary transition-colors"
          >
            Ver actividad completa →
          </Link>
        )}
      </header>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-outline-variant">
          {shown.map((entry) => (
            <li key={`${entry.stickerId}-${entry.timestamp}`}>
              <ActivityRow entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
      <span className="text-5xl" aria-hidden>
        📋
      </span>
      <div>
        <p className="text-body-strong text-on-surface">
          Aún no has marcado estampas
        </p>
        <p className="text-small text-on-surface-variant mt-1 max-w-xs">
          Empieza a llenar tu álbum y verás tu progreso reciente aquí.
        </p>
      </div>
      <Link
        to="/album"
        className="mt-2 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-secondary text-on-secondary text-body-strong text-small hover:bg-secondary-container transition-colors"
      >
        Ir al álbum
        <Icon name="arrow_forward" size={16} />
      </Link>
    </div>
  );
}
