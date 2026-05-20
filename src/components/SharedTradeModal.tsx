import { useEffect, useMemo, useState } from 'react';
import { sections, stickersBySection } from '../data/album';
import { Icon } from './Icon';
import { downloadSharedMissingExcel } from '../lib/exportExcel';

export type TradeKind = 'missing' | 'duplicates';

interface Bucket {
  code: string;
  name: string;
  group: string | null;
  items: { id: string; label: string; count: number }[];
}

interface Props {
  kind: TradeKind;
  owned: Record<string, number>;
  ownerLabel: string;
  onClose: () => void;
}

const GROUP_CHIPS: string[] = ['todas', 'fwc', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function SharedTradeModal({ kind, owned, ownerLabel, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('todas');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const buckets = useMemo<Bucket[]>(() => {
    const out: Bucket[] = [];
    for (const section of sections) {
      const all = stickersBySection.get(section.code) ?? [];
      const items: Bucket['items'] = [];
      for (const st of all) {
        const c = owned[st.id] ?? 0;
        if (kind === 'missing') {
          if (c < 1) items.push({ id: st.id, label: st.id, count: 1 });
        } else {
          const spare = c - 1;
          if (spare > 0) items.push({ id: st.id, label: st.id, count: spare });
        }
      }
      if (items.length === 0) continue;
      out.push({ code: section.code, name: section.name, group: section.group, items });
    }
    return out;
  }, [owned, kind]);

  const total = useMemo(
    () => buckets.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.count, 0), 0),
    [buckets],
  );

  const filtered = useMemo<Bucket[]>(() => {
    const q = search.trim().toLowerCase();
    return buckets
      .filter((b) => {
        if (groupFilter === 'todas') return true;
        if (groupFilter === 'fwc') return b.code === 'FWC';
        return b.group === groupFilter;
      })
      .map((b) => {
        if (!q) return b;
        const items = b.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q) ||
            b.name.toLowerCase().includes(q),
        );
        if (items.length === 0 && !b.code.toLowerCase().includes(q) && !b.name.toLowerCase().includes(q)) {
          return null;
        }
        return { ...b, items };
      })
      .filter((b): b is Bucket => !!b);
  }, [buckets, groupFilter, search]);

  const visibleTotal = useMemo(
    () => filtered.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.count, 0), 0),
    [filtered],
  );

  function buildText(): string {
    const title =
      kind === 'missing'
        ? `Estampas que le faltan a ${ownerLabel} (${total})`
        : `Estampas que le sobran a ${ownerLabel} (${total})`;
    const lines: string[] = [title, ''];
    for (const b of buckets) {
      const codes = b.items.map((i) =>
        kind === 'duplicates' && i.count > 1 ? `${i.label} x${i.count}` : i.label,
      );
      lines.push(`${b.code} · ${b.name}: ${codes.join(', ')}`);
    }
    return lines.join('\n');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = buildText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownload() {
    if (kind !== 'missing') return;
    try {
      setDownloading(true);
      await downloadSharedMissingExcel(owned, ownerLabel);
    } finally {
      setDownloading(false);
    }
  }

  const title = kind === 'missing' ? 'Lo que le falta' : 'Repetidas disponibles';
  const subtitle =
    kind === 'missing'
      ? `${total} estampas faltantes en el álbum de ${ownerLabel}`
      : `${total} estampas disponibles para intercambio`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-on-surface/40 backdrop-blur-sm p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 md:px-6 py-4 border-b border-outline-variant flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-heading text-on-surface">{title}</h2>
            <p className="text-small text-on-surface-variant mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="px-5 md:px-6 py-3 border-b border-outline-variant flex flex-col gap-3">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código o país…"
              aria-label="Buscar código o país"
              className="w-full h-10 pl-10 pr-10 rounded-full bg-surface-container border border-outline-variant text-body text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6 pb-1">
            {GROUP_CHIPS.map((g) => {
              const label = g === 'todas' ? 'Todas' : g === 'fwc' ? 'FWC' : `Grupo ${g}`;
              const active = groupFilter === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupFilter(g)}
                  className={`shrink-0 px-3 h-8 rounded-full text-small whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Icon
                name={kind === 'missing' ? 'celebration' : 'inventory_2'}
                size={32}
                className="text-on-surface-variant mb-2"
              />
              <p className="text-body text-on-surface-variant">
                {search.trim() || groupFilter !== 'todas'
                  ? 'Sin resultados.'
                  : kind === 'missing'
                    ? 'No le falta ninguna. ¡Álbum completo!'
                    : 'No tiene repetidas disponibles.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {filtered.map((b) => (
                <li key={b.code}>
                  <header className="flex items-baseline justify-between mb-2">
                    <h3 className="text-body-strong text-on-surface">
                      <span className="font-mono">{b.code}</span>
                      {b.code !== 'FWC' && (
                        <span className="text-on-surface-variant ml-2">{b.name}</span>
                      )}
                    </h3>
                    <span className="text-small text-on-surface-variant">
                      {kind === 'missing' ? `Le faltan ${b.items.length}` : `Sobran ${b.items.reduce((a, i) => a + i.count, 0)}`}
                    </span>
                  </header>
                  <div className="flex flex-wrap gap-1.5">
                    {b.items.map((i) => (
                      <span
                        key={i.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-mono-code border ${
                          kind === 'missing'
                            ? 'bg-[#FEE2E2] dark:bg-secondary/15 border-[#FCA5A5] dark:border-secondary/30 text-[#991B1B] dark:text-[#F87171]'
                            : 'bg-[#FEF3C7] dark:bg-[#451A03]/60 border-[#FCD34D] dark:border-[#F59E0B]/40 text-[#92400E] dark:text-[#FCD34D]'
                        }`}
                      >
                        {i.label}
                        {kind === 'duplicates' && i.count > 1 && (
                          <span className="ml-1 text-small opacity-80">×{i.count}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="px-5 md:px-6 py-3 border-t border-outline-variant flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <p className="text-small text-on-surface-variant flex-1">
            {search.trim() || groupFilter !== 'todas'
              ? `${visibleTotal} de ${total} visibles`
              : `${total} en total`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={total === 0}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size={16} />
              {copied ? '¡Copiado!' : 'Copiar lista'}
            </button>
            {kind === 'missing' && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={total === 0 || downloading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-secondary text-on-secondary text-small font-body-strong hover:bg-secondary-container transition-colors disabled:opacity-50"
              >
                <Icon name="download" size={16} />
                {downloading ? 'Generando…' : 'Excel'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
