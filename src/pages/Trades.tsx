import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import {
  NEAR_COMPLETE_THRESHOLD,
  useTradesFilters,
  type TradesStatus,
} from '../store/useTradesFilters';
import { sections, stickersBySection, sectionByCode } from '../data/album';
import {
  continentLabels,
  continentOf,
  type Continent,
} from '../data/sectionMetadata';
import type { Sticker } from '../types';
import { Icon } from '../components/Icon';
import { TradesFiltersDrawer } from '../components/TradesFiltersDrawer';
import { formatTradesList, type FormatBucket } from '../lib/formatTradesList';

type Item = { id: string; label: string; count: number };
type Bucket = { code: string; sectionName: string; items: Item[] };

interface BuiltBuckets {
  missing: Bucket[];
  duplicates: Bucket[];
  totalMissing: number;
  totalDuplicates: number;
  /** Sections (codes) that pass the current section-level filter set. */
  visibleSectionCount: number;
}

const SEARCH_DEBOUNCE_MS = 200;

const STATUS_OPTIONS: { id: TradesStatus; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: 'list' },
  { id: 'missing', label: 'Solo faltantes', icon: 'remove_circle_outline' },
  { id: 'duplicates', label: 'Solo repetidas', icon: 'content_copy' },
  { id: 'near-complete', label: 'Cerca de completar', icon: 'flag' },
];

export function Trades() {
  const counts = useAlbumStore((s) => s.counts);

  const search = useTradesFilters((s) => s.search);
  const status = useTradesFilters((s) => s.status);
  const groups = useTradesFilters((s) => s.groups);
  const continents = useTradesFilters((s) => s.continents);
  const setSearch = useTradesFilters((s) => s.setSearch);
  const setStatus = useTradesFilters((s) => s.setStatus);
  const clearAll = useTradesFilters((s) => s.clearAll);
  const toggleGroup = useTradesFilters((s) => s.toggleGroup);
  const toggleContinent = useTradesFilters((s) => s.toggleContinent);
  const activeFiltersCount = useTradesFilters((s) => s.activeFiltersCount());
  const isAnyFilterActive = useTradesFilters((s) => s.isAnyFilterActive());

  const [inputValue, setInputValue] = useState(search);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedSide, setCopiedSide] = useState<'missing' | 'duplicates' | null>(
    null,
  );

  // Debounce search input → store
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(inputValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [inputValue, setSearch]);

  // Keep local input synced when the store is cleared from elsewhere
  useEffect(() => {
    if (search === '' && inputValue !== '') setInputValue('');
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const built = useMemo<BuiltBuckets>(
    () => buildBuckets(counts, { search, status, groups, continents }),
    [counts, search, status, groups, continents],
  );

  const showMissingCol = status !== 'duplicates';
  const showDuplicatesCol = status === 'all' || status === 'duplicates';

  const totalShown =
    (showMissingCol ? built.totalMissing : 0) +
    (showDuplicatesCol ? built.totalDuplicates : 0);

  async function copy(side: 'missing' | 'duplicates') {
    const buckets = side === 'missing' ? built.missing : built.duplicates;
    const total = side === 'missing' ? built.totalMissing : built.totalDuplicates;
    const formatBuckets: FormatBucket[] = buckets.map((b) => ({
      code: b.code,
      name: b.sectionName,
      items: b.items.map((i) => ({ id: i.id, count: i.count })),
    }));
    const filterSuffix = buildFilterSuffix({
      search,
      status,
      groups,
      continents,
    });
    const text = formatTradesList({
      kind: side,
      buckets: formatBuckets,
      total,
      filterSuffix: filterSuffix.length > 0 ? filterSuffix : undefined,
    });
    await copyToClipboard(text);
    setCopiedSide(side);
    window.setTimeout(() => setCopiedSide(null), 1500);
  }

  async function copyToClipboard(text: string): Promise<void> {
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
  }

  function removeChip(chipKey: ActiveChip['key']) {
    if (chipKey.kind === 'search') {
      setInputValue('');
      setSearch('');
    } else if (chipKey.kind === 'status') {
      setStatus('all');
    } else if (chipKey.kind === 'group') {
      toggleGroup(chipKey.value);
    } else if (chipKey.kind === 'continent') {
      toggleContinent(chipKey.value);
    }
  }

  function handleClearAll() {
    clearAll();
    setInputValue('');
  }

  const activeChips = buildActiveChips({ search, status, groups, continents });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-display-l text-on-surface">Intercambios</h1>
          <p className="text-body text-on-surface-variant">
            Listo para copiar y compartir.
          </p>
        </div>
        <Link
          to="/comparar"
          className="inline-flex items-center gap-2 px-4 h-11 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors self-start md:self-auto"
        >
          <Icon name="swap_horiz" size={18} />
          Comparar con alguien más
        </Link>
      </div>

      {/* Search + Filters button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            size={18}
          />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar código, número o país (ej: MEX5, México, 10)…"
            aria-label="Buscar estampa"
            className="w-full h-11 pl-10 pr-10 bg-surface-container rounded-full text-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          {inputValue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setSearch('');
              }}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative inline-flex items-center gap-2 h-11 px-4 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-body-strong"
        >
          <Icon name="tune" size={18} />
          <span className="hidden sm:inline">Filtros</span>
          {(groups.length > 0 || continents.length > 0) && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-secondary text-on-secondary text-caps">
              {groups.length + continents.length}
            </span>
          )}
        </button>
      </div>

      {/* Status chips */}
      <div className="flex gap-2 overflow-x-auto -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-1">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatus(opt.id)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap text-body-strong transition-colors ${
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Icon name={opt.icon} size={16} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => removeChip(chip.key)}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30 text-small hover:bg-secondary/15 transition-colors"
            >
              <span>{chip.label}</span>
              <Icon name="close" size={14} />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-small text-on-surface-variant hover:text-on-surface underline-offset-2 hover:underline ml-1"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* Result counter */}
      <ResultCounter
        totalShown={totalShown}
        isFiltered={isAnyFilterActive}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Two columns */}
      <div
        className={`grid grid-cols-1 ${
          showMissingCol && showDuplicatesCol ? 'lg:grid-cols-2' : ''
        } gap-6`}
      >
        {showMissingCol && (
          <TradeCard
            title="Me faltan"
            total={built.totalMissing}
            buckets={built.missing}
            tone="neutral"
            renderItem={(item) => (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant font-mono text-mono-code text-on-surface">
                {item.label}
              </span>
            )}
            copyVariant="outline"
            copied={copiedSide === 'missing'}
            onCopy={() => copy('missing')}
            emptyText={
              isAnyFilterActive
                ? 'Ninguna estampa faltante coincide con los filtros.'
                : '¡Tienes todas las estampas! 🎉'
            }
          />
        )}
        {showDuplicatesCol && (
          <TradeCard
            title="Tengo repetidas"
            total={built.totalDuplicates}
            buckets={built.duplicates}
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
            emptyText={
              isAnyFilterActive
                ? 'Ninguna repetida coincide con los filtros.'
                : 'Aún no tienes repetidas.'
            }
          />
        )}
      </div>

      <TradesFiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={totalShown}
      />
    </div>
  );
}

interface ResultCounterProps {
  totalShown: number;
  isFiltered: boolean;
  activeFiltersCount: number;
}

function ResultCounter({
  totalShown,
  isFiltered,
  activeFiltersCount,
}: ResultCounterProps) {
  if (!isFiltered) {
    return (
      <p className="text-small text-on-surface-variant">
        {totalShown} {totalShown === 1 ? 'estampa pendiente' : 'estampas pendientes'}
      </p>
    );
  }
  return (
    <p className="text-small text-on-surface-variant">
      <span className="text-on-surface font-body-strong">{totalShown}</span>{' '}
      {totalShown === 1 ? 'estampa' : 'estampas'} con{' '}
      {activeFiltersCount} filtro{activeFiltersCount === 1 ? '' : 's'} activo
      {activeFiltersCount === 1 ? '' : 's'}.
    </p>
  );
}

// --- Filtering ---------------------------------------------------------------

interface FilterParams {
  search: string;
  status: TradesStatus;
  groups: string[];
  continents: Continent[];
}

function buildBuckets(
  counts: Record<string, number>,
  filters: FilterParams,
): BuiltBuckets {
  const { search, status, groups, continents } = filters;
  const searchQ = search.trim().toLowerCase();
  const searchNum = searchQ.length > 0 ? Number.parseInt(searchQ, 10) : NaN;
  const groupSet = new Set(groups);
  const continentSet = new Set(continents);

  // Precompute per-section "near-complete" eligibility based on missing count
  // (only meaningful when status === 'near-complete').
  const nearCompleteByCode = new Map<string, boolean>();
  if (status === 'near-complete') {
    for (const s of sections) {
      const all = stickersBySection.get(s.code) ?? [];
      let missingHere = 0;
      for (const st of all) {
        if ((counts[st.id] ?? 0) === 0) missingHere += 1;
      }
      const eligible = missingHere > 0 && missingHere <= NEAR_COMPLETE_THRESHOLD;
      nearCompleteByCode.set(s.code, eligible);
    }
  }

  const missing: Bucket[] = [];
  const duplicates: Bucket[] = [];
  let tm = 0;
  let td = 0;
  let visibleSectionCount = 0;

  for (const s of sections) {
    // Section-level filters: group, continent, near-complete
    if (!matchesSectionGroup(s.code, s.group, groupSet)) continue;
    if (!matchesSectionContinent(s.code, continentSet)) continue;
    if (status === 'near-complete' && !nearCompleteByCode.get(s.code)) continue;

    visibleSectionCount += 1;

    const all = stickersBySection.get(s.code) ?? [];

    const miss: Item[] = [];
    const dup: Item[] = [];
    for (const st of all) {
      if (!matchesSearch(st, searchQ, searchNum)) continue;
      const owned = counts[st.id] ?? 0;
      if (owned === 0) {
        miss.push({ id: st.id, label: `${st.sectionCode}${st.number}`, count: 1 });
      } else if (owned >= 2) {
        dup.push({
          id: st.id,
          label: `${st.sectionCode}${st.number}`,
          count: owned - 1,
        });
      }
    }

    if (miss.length > 0) {
      missing.push({ code: s.code, sectionName: s.name, items: miss });
      tm += miss.length;
    }
    if (dup.length > 0) {
      duplicates.push({ code: s.code, sectionName: s.name, items: dup });
      td += dup.reduce((acc, x) => acc + x.count, 0);
    }
  }

  return {
    missing,
    duplicates,
    totalMissing: tm,
    totalDuplicates: td,
    visibleSectionCount,
  };
}

function labelForGroupKey(key: string): string {
  // Special sections (FWC, CC) use their section code as the filter key.
  const sec = sectionByCode.get(key);
  if (sec) {
    return sec.category === 'sponsor' ? `${sec.code} (${sec.name})` : `${sec.code}`;
  }
  return `Grupo ${key}`;
}

function matchesSectionGroup(
  code: string,
  group: string | null,
  selected: Set<string>,
): boolean {
  if (selected.size === 0) return true;
  // Special sections (group === null) use the section code as their filter key.
  if (group === null) return selected.has(code);
  return selected.has(group);
}

function matchesSectionContinent(
  code: string,
  selected: Set<Continent>,
): boolean {
  if (selected.size === 0) return true;
  return selected.has(continentOf(code));
}

function matchesSearch(
  st: Sticker,
  q: string,
  numQ: number,
): boolean {
  if (!q) return true;
  if (st.id.toLowerCase().includes(q)) return true;
  if (st.sectionCode.toLowerCase().includes(q)) return true;
  if (st.sectionName.toLowerCase().includes(q)) return true;
  if (!Number.isNaN(numQ) && st.number === numQ) return true;
  return false;
}

// --- Active chips ------------------------------------------------------------

type ActiveChip = {
  id: string;
  label: string;
  key:
    | { kind: 'search' }
    | { kind: 'status' }
    | { kind: 'group'; value: string }
    | { kind: 'continent'; value: Continent };
};

function buildActiveChips(filters: FilterParams): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (filters.search.trim()) {
    chips.push({
      id: 'search',
      label: `“${filters.search.trim()}”`,
      key: { kind: 'search' },
    });
  }
  if (filters.status !== 'all') {
    const label =
      STATUS_OPTIONS.find((s) => s.id === filters.status)?.label ?? filters.status;
    chips.push({
      id: `status-${filters.status}`,
      label,
      key: { kind: 'status' },
    });
  }
  for (const g of filters.groups) {
    const label = labelForGroupKey(g);
    chips.push({
      id: `group-${g}`,
      label,
      key: { kind: 'group', value: g },
    });
  }
  for (const c of filters.continents) {
    chips.push({
      id: `continent-${c}`,
      label: continentLabels[c],
      key: { kind: 'continent', value: c },
    });
  }
  return chips;
}

function buildFilterSuffix(filters: FilterParams): string {
  const parts: string[] = [];
  if (filters.status !== 'all') {
    const label = STATUS_OPTIONS.find((s) => s.id === filters.status)?.label;
    if (label) parts.push(label);
  }
  for (const g of filters.groups) {
    parts.push(labelForGroupKey(g));
  }
  for (const c of filters.continents) {
    parts.push(continentLabels[c]);
  }
  if (filters.search.trim()) parts.push(`búsqueda “${filters.search.trim()}”`);
  return parts.join(', ');
}

// --- Trade card --------------------------------------------------------------

interface TradeCardProps {
  title: string;
  total: number;
  buckets: Bucket[];
  tone: 'neutral' | 'danger';
  renderItem: (item: Item) => React.ReactNode;
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

