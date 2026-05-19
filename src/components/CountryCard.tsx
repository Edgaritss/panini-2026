import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { FlagCircle } from './FlagCircle';
import { Icon } from './Icon';
import type { Section } from '../types';

interface Props {
  section: Section;
  index?: number;
  /** Override counts (e.g. when rendering someone else's shared album). */
  countsOverride?: Record<string, number>;
  /** Render the card without an internal link to /seccion/:code. */
  readOnly?: boolean;
  /** When provided in read-only mode, wraps the card in a button instead. */
  onClick?: () => void;
}

export function CountryCard({
  section,
  index,
  countsOverride,
  readOnly,
  onClick,
}: Props) {
  const storeCounts = useAlbumStore((s) => s.counts);
  const counts = countsOverride ?? storeCounts;
  let owned = 0;
  for (let n = 1; n <= 20; n += 1) {
    if ((counts[`${section.code}${n}`] ?? 0) >= 1) owned += 1;
  }
  const total = 20;
  const pct = owned / total;
  const status: 'empty' | 'progress' | 'complete' =
    owned === 0 ? 'empty' : owned === total ? 'complete' : 'progress';
  const isFWC = section.group === null;
  const longName = isFWC ? 'FIFA World Cup 2026' : section.name;

  const interactive = !readOnly || !!onClick;
  const baseClassName = `group relative h-[180px] flex flex-col rounded-xl overflow-hidden transition-all duration-150 text-left ${
    interactive ? 'hover:-translate-y-0.5 hover:shadow-md' : ''
  } ${
    status === 'complete'
      ? 'border border-[#15803D]/30 dark:border-[#22c55e]/40 bg-[#15803D]/[0.04] dark:bg-[#22c55e]/[0.06]'
      : `border border-outline-variant bg-surface-container-lowest ${
          interactive ? 'hover:border-on-surface-variant/40' : ''
        }`
  } ${isFWC ? 'md:col-span-2' : ''}`;

  const inner = (
    <>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between">
          {index !== undefined && (
            <span className="text-[10px] font-mono text-on-surface-variant/60 tracking-wider">
              #{String(index).padStart(3, '0')}
            </span>
          )}
          {isFWC && <span className="text-[10px] font-mono text-on-surface-variant/60 tracking-wider">PORTADA</span>}
          {status === 'complete' && (
            <Icon name="check_circle" filled size={16} className="text-[#15803D] dark:text-[#22c55e]" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {isFWC ? (
            <span
              className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-secondary text-on-secondary shrink-0"
              aria-hidden
            >
              <Icon name="emoji_events" filled size={16} />
            </span>
          ) : (
            <FlagCircle code={section.code} size={28} />
          )}
          <span className="text-[30px] leading-none font-bold font-mono text-on-surface">
            {section.code}
          </span>
        </div>

        <p className="text-caps text-on-surface-variant uppercase mt-2 truncate">
          {longName}
        </p>

        <div className="mt-auto flex items-center gap-2">
          <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct * 100}%`,
                background:
                  status === 'empty'
                    ? 'transparent'
                    : 'linear-gradient(90deg, #15803D, #22c55e)',
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-on-surface-variant tabular-nums shrink-0">
            {owned}/{total}
          </span>
        </div>
      </div>

      <div
        className={`px-4 py-2 text-center text-[12px] font-semibold tracking-wider ${
          status === 'empty'
            ? 'bg-secondary/10 text-secondary'
            : status === 'complete'
              ? 'bg-[#15803D] dark:bg-[#22c55e] text-white dark:text-[#052e16]'
              : 'bg-surface-container text-[#15803D] dark:text-[#22c55e]'
        }`}
      >
        {status === 'complete' ? '✓ COMPLETO' : `FALTAN ${total - owned}`}
      </div>
    </>
  );

  if (readOnly) {
    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={baseClassName}>
          {inner}
        </button>
      );
    }
    return <article className={baseClassName}>{inner}</article>;
  }

  return (
    <Link to={`/seccion/${section.code}`} className={baseClassName}>
      {inner}
    </Link>
  );
}
