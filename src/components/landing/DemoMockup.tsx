import { motion } from 'motion/react';

const CELLS: Array<'have' | 'miss' | 'dup'> = [
  'have','have','have','have','have',
  'have','have','have','have','have',
  'miss','miss','miss','miss','miss',
  'miss','miss','dup','dup','dup',
];

export function DemoMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full max-w-xl mx-auto"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-secondary/40 via-transparent to-[#15803D]/20 blur-2xl opacity-60" aria-hidden />
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
          <span className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/30" />
          <span className="ml-3 text-caps text-on-surface-variant uppercase tracking-wider">
            mundial-26.vercel.app
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[42px] leading-none font-bold tabular-nums">247</p>
              <p className="text-small text-on-surface-variant mt-1">25% completo</p>
            </div>
            <span className="text-caps text-secondary uppercase">MEX · México</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CELLS.map((kind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.02, ease: 'easeOut' }}
                className={`aspect-square rounded relative flex items-center justify-center text-[10px] font-mono ${
                  kind === 'have'
                    ? 'bg-[#15803D] text-white'
                    : kind === 'dup'
                      ? 'bg-[#15803D] text-white'
                      : 'border border-dashed border-on-surface-variant/60 text-on-surface-variant/60'
                }`}
              >
                MEX {i + 1}
                {kind === 'dup' && (
                  <span className="absolute -top-1 -right-1 text-[9px] px-1 rounded-full bg-secondary text-white border border-surface-container-lowest">
                    +1
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
