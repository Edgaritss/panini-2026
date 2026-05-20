import { useEffect } from 'react';
import { sections } from '../data/album';
import {
  continentLabels,
  continentOrder,
} from '../data/sectionMetadata';
import { useTradesFilters } from '../store/useTradesFilters';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pending count under current filters — shown in header for live feedback. */
  resultCount: number;
}

// Special (group=null) sections each get their own chip; regular sections
// share a group letter. Keys hold the actual section code (FWC, CC) or the
// group letter (A..L), so the matcher in Trades.tsx can use code-vs-group
// branching directly.

function buildGroupOptions(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (const s of sections) {
    if (s.group === null) {
      const label =
        s.category === 'sponsor'
          ? `${s.code} (${s.name})`
          : `${s.code} (Especiales)`;
      out.push({ key: s.code, label });
    }
  }
  const seen = new Set<string>();
  const groupLetters: string[] = [];
  for (const s of sections) {
    if (s.group === null) continue;
    if (seen.has(s.group)) continue;
    seen.add(s.group);
    groupLetters.push(s.group);
  }
  groupLetters.sort();
  for (const g of groupLetters) out.push({ key: g, label: `Grupo ${g}` });
  return out;
}

const GROUP_OPTIONS = buildGroupOptions();
// 'special' lives as a group ("Portada"), so we don't repeat it in continents.
const CONTINENT_OPTIONS = continentOrder.filter((c) => c !== 'special');

export function TradesFiltersDrawer({ open, onClose, resultCount }: Props) {
  const groups = useTradesFilters((s) => s.groups);
  const continents = useTradesFilters((s) => s.continents);
  const toggleGroup = useTradesFilters((s) => s.toggleGroup);
  const toggleContinent = useTradesFilters((s) => s.toggleContinent);
  const setGroups = useTradesFilters((s) => s.setGroups);
  const setContinents = useTradesFilters((s) => s.setContinents);
  const clearAll = useTradesFilters((s) => s.clearAll);
  const activeCount = useTradesFilters((s) => s.activeFiltersCount());

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const allGroupKeys = GROUP_OPTIONS.map((g) => g.key);
  const allGroupsSelected =
    groups.length === allGroupKeys.length &&
    allGroupKeys.every((k) => groups.includes(k));
  const allContinentsSelected =
    continents.length === CONTINENT_OPTIONS.length &&
    CONTINENT_OPTIONS.every((c) => continents.includes(c));

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex-1 bg-on-surface/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros avanzados"
        onClick={(e) => e.stopPropagation()}
        className="drawer-anim w-full sm:max-w-[420px] bg-surface-bright border-l border-outline-variant flex flex-col h-full overflow-hidden"
      >
        <header className="px-5 py-4 border-b border-outline-variant flex items-center justify-between gap-3 sticky top-0 bg-surface-bright">
          <div className="min-w-0">
            <h2 className="text-heading text-on-surface">Filtros</h2>
            <p className="text-small text-on-surface-variant truncate">
              {resultCount} {resultCount === 1 ? 'estampa' : 'estampas'}
              {activeCount > 0 ? ` · ${activeCount} filtro${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-caps text-on-surface-variant uppercase">Grupo</h3>
              <button
                type="button"
                onClick={() =>
                  setGroups(allGroupsSelected ? [] : allGroupKeys)
                }
                className="text-small text-secondary hover:underline"
              >
                {allGroupsSelected ? 'Limpiar' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GROUP_OPTIONS.map((g) => (
                <ChipToggle
                  key={g.key}
                  active={groups.includes(g.key)}
                  onClick={() => toggleGroup(g.key)}
                  label={g.label}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-caps text-on-surface-variant uppercase">
                Continente
              </h3>
              <button
                type="button"
                onClick={() =>
                  setContinents(allContinentsSelected ? [] : [...CONTINENT_OPTIONS])
                }
                className="text-small text-secondary hover:underline"
              >
                {allContinentsSelected ? 'Limpiar' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {CONTINENT_OPTIONS.map((c) => (
                <ChipToggle
                  key={c}
                  active={continents.includes(c)}
                  onClick={() => toggleContinent(c)}
                  label={continentLabels[c]}
                />
              ))}
            </div>
          </section>
        </div>

        <footer className="px-5 py-4 border-t border-outline-variant flex items-center justify-between gap-3 sticky bottom-0 bg-surface-bright">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeCount === 0}
            className="text-small text-on-surface-variant hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar todos
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-10 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
          >
            Aplicar
          </button>
        </footer>
      </aside>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function ChipToggle({ active, onClick, label }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-small text-left transition-colors ${
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
          active
            ? 'border-on-secondary bg-on-secondary/20'
            : 'border-outline-variant'
        }`}
      >
        {active && <Icon name="check" size={12} />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
