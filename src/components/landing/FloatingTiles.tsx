import { motion, useReducedMotion } from 'motion/react';

interface Tile {
  code: string;
  x: string;
  y: string;
  size: number;
  rotate: number;
  delay: number;
  owned: boolean;
  amp: number;
  dur: number;
}

const TILES: Tile[] = [
  { code: 'ARG 10', x: '6%',  y: '14%', size: 80, rotate: -8, delay: 0,    owned: true,  amp: 8, dur: 11 },
  { code: 'MEX 1',  x: '20%', y: '72%', size: 72, rotate: 5,  delay: 0.6, owned: true,  amp: 6, dur: 9  },
  { code: 'BRA 5',  x: '14%', y: '46%', size: 64, rotate: -3, delay: 1.2, owned: false, amp: 5, dur: 8  },
  { code: 'GER 7',  x: '34%', y: '24%', size: 56, rotate: 9,  delay: 1.8, owned: true,  amp: 7, dur: 10 },
  { code: 'FRA 2',  x: '46%', y: '84%', size: 88, rotate: -6, delay: 0.3, owned: false, amp: 5, dur: 12 },
  { code: 'ENG 11', x: '60%', y: '12%', size: 64, rotate: 4,  delay: 1.0, owned: true,  amp: 6, dur: 9  },
  { code: 'ESP 4',  x: '74%', y: '38%', size: 72, rotate: -10,delay: 0.5, owned: false, amp: 8, dur: 11 },
  { code: 'POR 8',  x: '82%', y: '70%', size: 80, rotate: 7,  delay: 1.4, owned: true,  amp: 6, dur: 10 },
  { code: 'JPN 3',  x: '90%', y: '20%', size: 56, rotate: -4, delay: 2.0, owned: false, amp: 5, dur: 8  },
  { code: 'NED 6',  x: '54%', y: '52%', size: 64, rotate: 6,  delay: 0.8, owned: false, amp: 4, dur: 9  },
  { code: 'USA 13', x: '40%', y: '60%', size: 56, rotate: -2, delay: 1.6, owned: true,  amp: 6, dur: 10 },
  { code: 'COL 9',  x: '68%', y: '60%', size: 72, rotate: -7, delay: 0.2, owned: false, amp: 7, dur: 11 },
];

export function FloatingTiles() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {TILES.map((t) => (
        <motion.div
          key={t.code}
          initial={{ opacity: 0 }}
          animate={
            reduce
              ? { opacity: t.owned ? 0.12 : 0.08 }
              : {
                  opacity: t.owned ? 0.12 : 0.08,
                  y: [0, -t.amp, 0, t.amp, 0],
                  x: [0, t.amp / 2, 0, -t.amp / 2, 0],
                }
          }
          transition={
            reduce
              ? { duration: 0.6, delay: t.delay }
              : {
                  duration: t.dur,
                  delay: t.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  opacity: { duration: 1.2, delay: t.delay, repeat: 0 },
                }
          }
          style={{
            left: t.x,
            top: t.y,
            width: t.size,
            height: t.size,
            transform: `rotate(${t.rotate}deg)`,
          }}
          className={`absolute rounded-md flex items-center justify-center font-mono text-[10px] tracking-wide ${
            t.owned
              ? 'bg-[#15803D]/80 text-white border border-[#15803D]'
              : 'border border-dashed border-on-surface-variant text-on-surface-variant'
          }`}
        >
          {t.code}
        </motion.div>
      ))}
    </div>
  );
}
