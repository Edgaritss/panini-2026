import { useAlbumStore } from '../store/useAlbumStore';

interface Props {
  stickerId: string;
  number: number;
}

export function StickerCell({ stickerId, number }: Props) {
  const count = useAlbumStore((s) => s.counts[stickerId] ?? 0);
  const increment = useAlbumStore((s) => s.increment);
  const decrement = useAlbumStore((s) => s.decrement);

  const hasIt = count > 0;
  const dupes = count > 1 ? count - 1 : 0;

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
        className={`w-full aspect-square min-h-[44px] rounded-xl flex items-center justify-center font-semibold tabular-nums text-base transition-all duration-150 active:scale-95 select-none ${
          hasIt
            ? 'bg-have text-white shadow-sm'
            : 'bg-missing text-muted hover:text-fg'
        }`}
      >
        {number}
      </button>
      {dupes > 0 && (
        <span
          className="pointer-events-none absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-duplicate text-white text-[11px] font-bold flex items-center justify-center shadow"
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
          className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-full bg-bg border border-border text-fg text-lg leading-none flex items-center justify-center hover:bg-surface active:scale-95 before:content-[''] before:absolute before:-inset-2"
        >
          −
        </button>
      )}
    </div>
  );
}
