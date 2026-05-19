import { useAlbumStore } from '../store/useAlbumStore';
import type { FilterMode } from '../types';

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'missing', label: 'Faltantes' },
  { id: 'have', label: 'Tengo' },
  { id: 'duplicate', label: 'Repetidas' },
];

export function Filters() {
  const filter = useAlbumStore((s) => s.filter);
  const setFilter = useAlbumStore((s) => s.setFilter);
  const search = useAlbumStore((s) => s.search);
  const setSearch = useAlbumStore((s) => s.setSearch);
  const expandAll = useAlbumStore((s) => s.expandAll);
  const collapseAll = useAlbumStore((s) => s.collapseAll);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`min-h-[36px] px-3 rounded-full text-sm whitespace-nowrap transition-colors ${
                active
                  ? 'bg-fg text-bg'
                  : 'bg-surface border border-border text-fg hover:bg-bg/60'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar: México, MEX, A..."
          className="flex-1 min-h-[40px] px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted"
          aria-label="Buscar sección"
        />
        <button
          type="button"
          onClick={expandAll}
          className="min-h-[40px] px-3 rounded-xl bg-surface border border-border text-sm hover:bg-bg/60"
        >
          Expandir
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="min-h-[40px] px-3 rounded-xl bg-surface border border-border text-sm hover:bg-bg/60"
        >
          Colapsar
        </button>
      </div>
    </div>
  );
}
