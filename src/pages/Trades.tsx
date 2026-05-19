import { useMemo, useState } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { sections, stickersBySection } from '../data/album';
import { Icon } from '../components/Icon';

type Bucket = {
  code: string;
  items: { id: string; label: string; count: number }[];
};

export function Trades() {
  const counts = useAlbumStore((s) => s.counts);
  const [copiedSide, setCopiedSide] = useState<'missing' | 'duplicates' | null>(null);

  const { missing, duplicates, totalMissing, totalDuplicates } = useMemo(() => {
    const miss: Bucket[] = [];
    const dup: Bucket[] = [];
    let tm = 0;
    let td = 0;
    for (const s of sections) {
      const all = stickersBySection.get(s.code) ?? [];
      const m = all
        .filter((st) => !(counts[st.id] ?? 0))
        .map((st) => ({
          id: st.id,
          label: `${st.sectionCode}${st.number}`,
          count: 1,
        }));
      const d = all
        .map((st) => ({
          id: st.id,
          label: `${st.sectionCode}${st.number}`,
          count: Math.max(0, (counts[st.id] ?? 0) - 1),
        }))
        .filter((x) => x.count > 0);
      if (m.length) miss.push({ code: s.code, items: m });
      if (d.length) dup.push({ code: s.code, items: d });
      tm += m.length;
      td += d.reduce((a, x) => a + x.count, 0);
    }
    return {
      missing: miss,
      duplicates: dup,
      totalMissing: tm,
      totalDuplicates: td,
    };
  }, [counts]);

  async function copy(side: 'missing' | 'duplicates') {
    const text =
      side === 'missing'
        ? buildText('Me faltan', missing, (i) => i.label)
        : buildText('Tengo repetidas', duplicates, (i) =>
            i.count > 1 ? `${i.label} x${i.count}` : i.label,
          );
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopiedSide(side);
    window.setTimeout(() => setCopiedSide(null), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-l text-on-surface">Intercambios</h1>
        <p className="text-body text-on-surface-variant mt-1">
          Listo para copiar y compartir.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard
          title="Me faltan"
          total={totalMissing}
          buckets={missing}
          tone="neutral"
          renderItem={(item) => (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant font-mono text-mono-code text-on-surface">
              {item.label}
            </span>
          )}
          copyVariant="outline"
          copied={copiedSide === 'missing'}
          onCopy={() => copy('missing')}
          emptyText="¡Tienes todas las estampas! 🎉"
        />
        <TradeCard
          title="Tengo repetidas"
          total={totalDuplicates}
          buckets={duplicates}
          tone="danger"
          renderItem={(item) => (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-fixed border border-error-container font-mono text-mono-code text-on-error-container">
              {item.label}
              {item.count > 1 && (
                <span className="text-small opacity-80">x{item.count}</span>
              )}
            </span>
          )}
          copyVariant="filled"
          copied={copiedSide === 'duplicates'}
          onCopy={() => copy('duplicates')}
          emptyText="Aún no tienes repetidas."
        />
      </div>
    </div>
  );
}

interface TradeCardProps {
  title: string;
  total: number;
  buckets: Bucket[];
  tone: 'neutral' | 'danger';
  renderItem: (item: Bucket['items'][number]) => React.ReactNode;
  copyVariant: 'outline' | 'filled';
  copied: boolean;
  onCopy: () => void;
  emptyText: string;
}

function TradeCard({
  title,
  total,
  buckets,
  renderItem,
  copyVariant,
  copied,
  onCopy,
  emptyText,
}: TradeCardProps) {
  const empty = total === 0;
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
      <div className="p-6 border-b border-outline-variant">
        <h2 className="text-heading text-on-surface">
          {title} · <span className="text-on-surface-variant">{total}</span>
        </h2>
      </div>
      <div className="p-6 flex-1 space-y-6 max-h-[60vh] overflow-y-auto">
        {empty ? (
          <p className="text-body text-on-surface-variant text-center py-8">
            {emptyText}
          </p>
        ) : (
          buckets.map((b) => (
            <div key={b.code}>
              <h3 className="text-caps text-on-surface-variant mb-3 uppercase">
                {b.code}
              </h3>
              <div className="flex flex-wrap gap-2">
                {b.items.map((item) => (
                  <span key={item.id}>{renderItem(item)}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-6 border-t border-outline-variant">
        <button
          type="button"
          onClick={onCopy}
          disabled={empty}
          className={`w-full py-3 px-4 rounded-lg font-body-strong text-body-strong flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            copyVariant === 'filled'
              ? 'bg-secondary text-on-secondary hover:bg-secondary-container'
              : 'border border-on-surface text-on-surface hover:bg-surface-container'
          }`}
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={18} />
          {copied ? '¡Copiado!' : 'Copiar lista'}
        </button>
      </div>
    </section>
  );
}

function buildText(
  header: string,
  buckets: Bucket[],
  itemLabel: (i: Bucket['items'][number]) => string,
): string {
  if (buckets.length === 0) return `${header}: nada por compartir.`;
  const total = buckets.reduce(
    (acc, b) => acc + b.items.reduce((a, i) => a + i.count, 0),
    0,
  );
  const lines = [`${header} (${total}):`];
  for (const b of buckets) {
    lines.push(`${b.code}: ${b.items.map(itemLabel).join(', ')}`);
  }
  return lines.join('\n');
}
