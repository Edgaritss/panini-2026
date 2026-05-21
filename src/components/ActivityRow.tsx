import { useNavigate } from 'react-router-dom';
import type { ActivityEntry } from '../types';
import { sectionByCode } from '../data/album';
import {
  formatAbsoluteShort,
  formatRelative,
} from '../lib/formatActivityTime';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { Icon } from './Icon';
import { isImportEntry } from '../lib/recordActivity';

interface Props {
  entry: ActivityEntry;
  /** When true, omits the lower line (absolute date) for compact layouts. */
  compact?: boolean;
}

export function ActivityRow({ entry, compact = false }: Props) {
  // The hook re-renders the component every 30s so relative strings stay fresh.
  useRelativeTime();
  const navigate = useNavigate();
  const isImport = isImportEntry(entry);
  const relative = formatRelative(entry.timestamp);
  const absolute = formatAbsoluteShort(entry.timestamp);

  if (isImport) {
    return (
      <div className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface-container/40 transition-colors">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-on-surface-variant shrink-0">
            <Icon name="upload" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-body text-on-surface truncate">
              <span className="font-body-strong">Importación masiva</span>
              {entry.count !== undefined && (
                <>
                  {' '}
                  · <span className="text-on-surface-variant">{entry.count}</span>{' '}
                  {entry.count === 1 ? 'estampa' : 'estampas'}
                </>
              )}
            </p>
            {!compact && (
              <p className="text-small text-on-surface-variant mt-0.5">
                {absolute}
              </p>
            )}
          </div>
        </div>
        <p className="text-small text-on-surface-variant text-right shrink-0">
          {relative}
        </p>
      </div>
    );
  }

  const section = sectionByCode.get(extractSectionCode(entry.stickerId));
  const sectionName = section?.name ?? '';
  const number = extractNumber(entry.stickerId);
  const isAdd = entry.action === 'add';

  function goToSection() {
    if (!section) return;
    navigate(`/seccion/${section.code}`, {
      state: { highlight: entry.stickerId },
    });
  }

  return (
    <button
      type="button"
      onClick={goToSection}
      className="w-full text-left flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface-container/60 transition-colors"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-small font-body-strong shrink-0 ${
            isAdd
              ? 'bg-owned/15 text-owned'
              : 'bg-secondary/15 text-secondary'
          }`}
        >
          {isAdd ? '+1' : '−1'}
        </span>
        <div className="min-w-0">
          <p className="text-body text-on-surface truncate">
            <span className="font-mono font-body-strong">{entry.stickerId}</span>
            {sectionName && (
              <>
                {' '}
                <span className="text-on-surface-variant">· {sectionName}</span>
              </>
            )}
          </p>
          {!compact && (
            <p className="text-small text-on-surface-variant mt-0.5">
              {number !== null ? `Posición ${number} · ` : ''}
              {absolute}
            </p>
          )}
        </div>
      </div>
      <p className="text-small text-on-surface-variant text-right shrink-0">
        {relative}
      </p>
    </button>
  );
}

function extractSectionCode(id: string): string {
  const m = id.match(/^([A-Z]{2,4})/);
  return m ? m[1] : '';
}

function extractNumber(id: string): number | null {
  const m = id.match(/(\d+)$/);
  return m ? Number.parseInt(m[1], 10) : null;
}
