import { useMemo, useState } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { sections, stickersBySection } from '../data/album';

type Mode = 'duplicates' | 'missing';

export function Trades() {
  const counts = useAlbumStore((s) => s.counts);
  const [mode, setMode] = useState<Mode>('duplicates');
  const [copied, setCopied] = useState(false);

  const { text, total } = useMemo(() => buildList(counts, mode), [counts, mode]);

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const empty = total === 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('duplicates')}
          className={`flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
            mode === 'duplicates'
              ? 'bg-fg text-bg'
              : 'bg-surface border border-border'
          }`}
        >
          Repetidas (cambio)
        </button>
        <button
          type="button"
          onClick={() => setMode('missing')}
          className={`flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
            mode === 'missing'
              ? 'bg-fg text-bg'
              : 'bg-surface border border-border'
          }`}
        >
          Me faltan
        </button>
      </div>

      <section className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xl font-semibold tabular-nums">{total}</div>
            <div className="text-xs text-muted">
              {mode === 'duplicates'
                ? 'estampas para intercambiar'
                : 'estampas que te faltan'}
            </div>
          </div>
          <button
            type="button"
            onClick={copy}
            disabled={empty}
            className="min-h-[44px] px-4 rounded-xl bg-accent text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {copied ? '✓ Copiado' : 'Copiar texto'}
          </button>
        </div>
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto text-fg">
          {empty
            ? mode === 'duplicates'
              ? 'Aún no tienes repetidas.'
              : '¡Tienes todas las estampas! 🎉'
            : text}
        </pre>
      </section>
    </div>
  );
}

function buildList(
  counts: Record<string, number>,
  mode: Mode,
): { text: string; total: number } {
  const lines: string[] = [];
  let total = 0;
  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    if (mode === 'duplicates') {
      const items = all
        .map((s) => ({ s, dupes: Math.max(0, (counts[s.id] ?? 0) - 1) }))
        .filter((x) => x.dupes > 0);
      if (items.length === 0) continue;
      const parts = items.map((x) =>
        x.dupes === 1 ? `${x.s.number}` : `${x.s.number}(x${x.dupes})`,
      );
      total += items.reduce((acc, x) => acc + x.dupes, 0);
      lines.push(`${section.code} · ${section.name}: ${parts.join(', ')}`);
    } else {
      const missing = all.filter((s) => !(counts[s.id] ?? 0));
      if (missing.length === 0) continue;
      total += missing.length;
      lines.push(
        `${section.code} · ${section.name}: ${missing.map((s) => s.number).join(', ')}`,
      );
    }
  }
  const header =
    mode === 'duplicates'
      ? `Repetidas para intercambio (${total}):\n`
      : `Estampas que me faltan (${total}):\n`;
  return { text: lines.length ? header + lines.join('\n') : '', total };
}
