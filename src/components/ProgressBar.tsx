import { useMemo } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { TOTAL, stickers } from '../data/album';

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

  const pct = Math.round((owned / TOTAL) * 100);

  return (
    <section className="bg-surface border border-border rounded-xl p-4">
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <div className="text-2xl font-semibold tabular-nums leading-tight">
            {owned} <span className="text-muted text-lg font-normal">/ {TOTAL}</span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            Faltan {TOTAL - owned} · {duplicates} repetidas
          </div>
        </div>
        <div className="text-2xl font-semibold tabular-nums text-accent">{pct}%</div>
      </div>
      <div className="h-2 bg-missing rounded-full overflow-hidden">
        <div
          className="h-full bg-have transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}
