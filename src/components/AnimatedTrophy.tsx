import { motion, useReducedMotion } from 'motion/react';

interface Props {
  size?: number;
}

export function AnimatedTrophy({ size = 120 }: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <span
        aria-hidden
        className="material-symbols-outlined text-[#EAB308]"
        style={{ fontSize: size }}
      >
        emoji_events
      </span>
    );
  }

  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl bg-[#EAB308]/25"
      />
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], rotate: [180, 0, 0], opacity: 1 }}
        transition={{ duration: 0.8, times: [0, 0.6, 1], ease: 'easeOut' }}
        className="relative"
      >
        <motion.span
          aria-hidden
          animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="material-symbols-outlined filled text-[#EAB308] inline-block"
          style={{ fontSize: size, filter: 'drop-shadow(0 8px 24px rgba(234,179,8,0.45))' }}
        >
          emoji_events
        </motion.span>
      </motion.div>
    </div>
  );
}
