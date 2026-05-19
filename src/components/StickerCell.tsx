import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAlbumStore } from '../store/useAlbumStore';
import { useStickerEvent } from '../store/useAnimations';

interface Props {
  stickerId: string;
  number: number;
  sectionCode: string;
  vibrating?: boolean;
}

const STICK_EASE = [0.34, 1.56, 0.64, 1] as const;

export function StickerCell({ stickerId, number, sectionCode, vibrating }: Props) {
  const count = useAlbumStore((s) => s.counts[stickerId] ?? 0);
  const increment = useAlbumStore((s) => s.increment);
  const decrement = useAlbumStore((s) => s.decrement);
  const ev = useStickerEvent(stickerId);

  const hasIt = count > 0;
  const dupes = count > 1 ? count - 1 : 0;
  const label = `${sectionCode} ${number}`;

  // Reseed the random tilt on each new "stick" event.
  const tilt = useMemo(() => {
    if (ev?.event === 'stick') return (Math.random() - 0.5) * 6;
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev?.tick]);

  const isStick = ev?.event === 'stick';
  const isDuplicate = ev?.event === 'duplicate';
  const isUnstick = ev?.event === 'unstick';

  const wrapInitial = isStick
    ? { scale: 1.15, rotate: tilt, y: -8, filter: 'brightness(1.15)' }
    : isUnstick
      ? { scale: 1 }
      : false;

  const wrapAnimate = isDuplicate
    ? { scale: [1, 1.08, 1] }
    : isUnstick
      ? { scale: [1, 1.1, 0.95, 1] }
      : vibrating
        ? { x: [0, 1, -1, 1, 0], y: [0, -1, 1, -1, 0] }
        : { scale: 1, rotate: 0, y: 0, filter: 'brightness(1)' };

  const wrapTransition = isStick
    ? { duration: 0.4, ease: STICK_EASE }
    : isDuplicate
      ? { duration: 0.2, ease: 'easeOut' as const }
      : isUnstick
        ? { duration: 0.2, ease: 'easeOut' as const }
        : vibrating
          ? { duration: 0.15, ease: 'linear' as const }
          : { duration: 0.2, ease: 'easeOut' as const };

  return (
    <motion.div
      key={ev?.tick ?? 'idle'}
      initial={wrapInitial}
      animate={wrapAnimate}
      transition={wrapTransition}
      className="relative"
      style={{ willChange: 'transform' }}
    >
      {isStick && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded bg-black -z-10"
            initial={{ scale: 1.1, opacity: 0.3, filter: 'blur(8px)', y: 6 }}
            animate={{ scale: 1, opacity: 0.08, filter: 'blur(3px)', y: 2 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded bg-white"
            style={{ mixBlendMode: 'overlay' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 0.25, times: [0, 0.3, 1], ease: 'easeOut' }}
          />
        </>
      )}

      <button
        type="button"
        onClick={() => increment(stickerId)}
        aria-label={
          hasIt
            ? `${stickerId}: tienes ${count}. Toca para sumar otra repetida.`
            : `${stickerId}: falta. Toca para marcar como tenida.`
        }
        className={`w-full aspect-square min-h-[64px] sm:min-h-0 sm:w-sticker-size sm:h-sticker-size rounded flex items-center justify-center font-mono text-mono-code transition-colors duration-200 active:scale-95 select-none ${
          hasIt
            ? 'bg-owned text-on-owned'
            : 'border border-dashed border-outline-variant text-on-tertiary-container hover:border-outline'
        }`}
      >
        {label}
      </button>

      {dupes > 0 && (
        <motion.span
          key={`badge-${count}`}
          aria-hidden
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 1] }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-secondary text-on-secondary text-caps font-semibold flex items-center justify-center border-2 border-surface-container-lowest"
        >
          +{dupes}
        </motion.span>
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
    </motion.div>
  );
}
