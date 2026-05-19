import { useMemo } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { TOTAL, stickers } from '../data/album';
import { QuickAddBar } from './QuickAddBar';

export function ProgressBar() {
  const counts = useAlbumStore((s) => s.counts);

  const { owned, duplicates } = useMemo(() => {
    let owned = 0;
    let duplicates = 0;
    for (const st of stickers) {
      const c = counts[st.id] ?? 0;
      if (c >= 1) owned += 1;
      if (c > 1) duplicates += c - 1;
    }
    return { owned, duplicates };
  }, [counts]);

  const missing = TOTAL - owned;
  const pct = Math.round((owned / TOTAL) * 100);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-8 lg:items-end">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <h1 className="text-display-xl text-on-surface">{owned}</h1>
            <span className="text-heading text-on-surface-variant">/ {TOTAL}</span>
          </div>
          <p className="text-body text-on-surface-variant mt-1">
            {pct}% completo · {duplicates} {duplicates === 1 ? 'repetida' : 'repetidas'}
          </p>
          <div className="w-full bg-surface-variant h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <QuickAddBar />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="TENGO" value={owned} />
        <StatCard label="FALTAN" value={missing} />
        <StatCard label="REPETIDAS" value={duplicates} />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-3 md:p-4 flex flex-col items-center justify-center shadow-sm">
      <span className="text-caps text-on-surface-variant mb-1 uppercase">{label}</span>
      <span className="text-display-l text-on-surface tabular-nums">{value}</span>
    </div>
  );
}
