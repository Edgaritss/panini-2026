import { useAlbumStore } from '../store/useAlbumStore';
import { Icon } from './Icon';

interface Props {
  stickerId: string;
  number: number;
  sectionCode: string;
}

export function StickerCard({ stickerId, number, sectionCode }: Props) {
  const count = useAlbumStore((s) => s.counts[stickerId] ?? 0);
  const increment = useAlbumStore((s) => s.increment);
  const decrement = useAlbumStore((s) => s.decrement);

  const hasIt = count > 0;
  const dupes = count > 1 ? count - 1 : 0;

  return (
    <article
      className={`group relative h-56 rounded-2xl overflow-hidden border transition-all duration-150 hover:-translate-y-1 hover:shadow-lg ${
        hasIt
          ? 'bg-[#15803D] text-white border-transparent shadow-sm'
          : 'bg-surface-container-lowest border-dashed border-outline-variant text-on-tertiary-container'
      }`}
    >
      <div className="absolute inset-0 flex flex-col p-4">
        <header className="flex items-start justify-between">
          <span
            className={`text-caps font-mono uppercase ${
              hasIt ? 'text-white/80' : 'text-on-surface-variant'
            }`}
          >
            {sectionCode} {number}
          </span>
          {hasIt && !dupes && (
            <span
              className="w-7 h-7 rounded-full bg-white/15 inline-flex items-center justify-center"
              aria-hidden
            >
              <Icon name="check" size={18} />
            </span>
          )}
          {dupes > 0 && (
            <span className="text-caps font-semibold px-2 py-1 rounded-full bg-[#F59E0B] text-[#451A03] uppercase">
              ×{count}
            </span>
          )}
        </header>

        <div className="flex-1 flex items-center justify-center">
          <span
            className={`text-[80px] leading-none font-bold tabular-nums ${
              hasIt ? 'text-white' : 'text-on-tertiary-container/40'
            }`}
          >
            {number}
          </span>
        </div>

        <footer className="flex items-end justify-between">
          <div className="flex">
            <button
              type="button"
              onClick={() => decrement(stickerId)}
              disabled={!hasIt}
              aria-label={`Restar ${stickerId}`}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-l-lg border ${
                hasIt
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant disabled:opacity-30'
              }`}
            >
              <Icon name="remove" size={18} />
            </button>
            <button
              type="button"
              onClick={() => increment(stickerId)}
              aria-label={`Sumar ${stickerId}`}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-r-lg border -ml-px ${
                hasIt
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Icon name="add" size={18} />
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}
