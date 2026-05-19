import { useAlbumStore } from '../store/useAlbumStore';
import type { FilterMode } from '../types';
import { Icon } from './Icon';

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
    <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-outline-variant pb-4">
      <div className="flex gap-2 overflow-x-auto -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-1 md:pb-0">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-body-strong transition-colors ${
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:w-64 md:flex-none">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            size={18}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sección…"
            className="w-full h-10 pl-10 pr-3 bg-surface-container rounded-full text-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary"
            aria-label="Buscar sección"
          />
        </div>
        <button
          type="button"
          onClick={expandAll}
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Expandir todo"
          title="Expandir todo"
        >
          <Icon name="unfold_more" size={20} />
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Colapsar todo"
          title="Colapsar todo"
        >
          <Icon name="unfold_less" size={20} />
        </button>
      </div>
    </section>
  );
}
