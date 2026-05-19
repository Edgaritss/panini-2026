import { useAlbumStore } from '../store/useAlbumStore';

interface Props {
  stickerId: string;
  number: number;
  sectionCode: string;
}

export function StickerCell({ stickerId, number, sectionCode }: Props) {
  const count = useAlbumStore((s) => s.counts[stickerId] ?? 0);
  const increment = useAlbumStore((s) => s.increment);
  const decrement = useAlbumStore((s) => s.decrement);

  const hasIt = count > 0;
  const dupes = count > 1 ? count - 1 : 0;

  const label = `${sectionCode} ${number}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => increment(stickerId)}
        aria-label={
          hasIt
            ? `${stickerId}: tienes ${count}. Toca para sumar otra repetida.`
            : `${stickerId}: falta. Toca para marcar como tenida.`
        }
        className={`w-full aspect-square min-h-[64px] sm:min-h-0 sm:w-sticker-size sm:h-sticker-size rounded flex items-center justify-center font-mono text-mono-code transition-all duration-150 active:scale-95 select-none ${
          hasIt
            ? 'bg-owned text-on-owned'
            : 'border border-dashed border-outline-variant text-on-tertiary-container hover:border-outline'
        }`}
      >
        {label}
      </button>
      {dupes > 0 && (
        <span
          className="pointer-events-none absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-secondary text-on-secondary text-caps font-semibold flex items-center justify-center border-2 border-surface-container-lowest"
          aria-hidden="true"
        >
          +{dupes}
        </span>
      )}
      {hasIt && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            decrement(stickerId);
          }}
          aria-label={`Restar una ${stickerId}`}
          className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface text-base leading-none flex items-center justify-center hover:bg-surface-container active:scale-95 shadow-sm"
        >
          −
        </button>
      )}
    </div>
  );
}
