import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAlbumStore } from '../store/useAlbumStore';
import { useStickerEvent } from '../store/useAnimations';
import { Icon } from './Icon';

interface Props {
  stickerId: string;
  number: number;
  sectionCode: string;
}

const STICK_EASE = [0.34, 1.56, 0.64, 1] as const;

export function StickerCard({ stickerId, number, sectionCode }: Props) {
  const count = useAlbumStore((s) => s.counts[stickerId] ?? 0);
  const increment = useAlbumStore((s) => s.increment);
  const decrement = useAlbumStore((s) => s.decrement);
  const ev = useStickerEvent(stickerId);

  const hasIt = count > 0;
  const dupes = count > 1 ? count - 1 : 0;

  const tilt = useMemo(() => {
    if (ev?.event === 'stick') return (Math.random() - 0.5) * 5;
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev?.tick]);

  const isStick = ev?.event === 'stick';
  const isDuplicate = ev?.event === 'duplicate';
  const isUnstick = ev?.event === 'unstick';

  const wrapInitial = isStick
    ? { scale: 1.05, rotate: tilt, y: -12, filter: 'brightness(1.12)' }
    : isUnstick
      ? { scale: 1 }
      : false;

  const wrapAnimate = isDuplicate
    ? { scale: [1, 1.04, 1] }
    : isUnstick
      ? { scale: [1, 1.04, 0.97, 1] }
      : { scale: 1, rotate: 0, y: 0, filter: 'brightness(1)' };

  const wrapTransition = isStick
    ? { duration: 0.45, ease: STICK_EASE }
    : isDuplicate
      ? { duration: 0.22, ease: 'easeOut' as const }
      : isUnstick
        ? { duration: 0.22, ease: 'easeOut' as const }
        : { duration: 0.2, ease: 'easeOut' as const };

  return (
    <motion.article
      key={ev?.tick ?? 'idle'}
      initial={wrapInitial}
      animate={wrapAnimate}
      transition={wrapTransition}
      style={{ willChange: 'transform' }}
      className={`group relative h-56 rounded-2xl overflow-hidden border transition-colors duration-150 hover:-translate-y-1 hover:shadow-lg ${
        hasIt
          ? 'bg-[#15803D] text-white border-transparent shadow-sm'
          : 'bg-surface-container-lowest border-dashed border-outline-variant text-on-tertiary-container'
      }`}
    >
      {isStick && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-black"
            style={{ zIndex: -1 }}
            initial={{ scale: 1.08, opacity: 0.35, filter: 'blur(14px)', y: 10 }}
            animate={{ scale: 1, opacity: 0.1, filter: 'blur(5px)', y: 3 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-white"
            style={{ mixBlendMode: 'overlay' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 0.3, times: [0, 0.3, 1], ease: 'easeOut' }}
          />
        </>
      )}

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
            <motion.span
              key={`badge-${count}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.2, 1] }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-caps font-semibold px-2 py-1 rounded-full bg-[#F59E0B] text-[#451A03] uppercase"
            >
              ×{count}
            </motion.span>
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
    </motion.article>
  );
}
