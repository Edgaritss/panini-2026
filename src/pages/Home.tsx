import { useMemo } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { sections, stickersBySection } from '../data/album';
import { ProgressBar } from '../components/ProgressBar';
import { Filters } from '../components/Filters';
import { SectionCard } from '../components/SectionCard';
import type { Sticker } from '../types';

export function Home() {
  const counts = useAlbumStore((s) => s.counts);
  const filter = useAlbumStore((s) => s.filter);
  const search = useAlbumStore((s) => s.search);

  const visibleSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) => {
      const groupLabel = s.group ? `grupo ${s.group}`.toLowerCase() : '';
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        groupLabel.includes(q) ||
        (s.group ? s.group.toLowerCase() === q : false)
      );
    });
  }, [search]);

  function applyFilter(items: Sticker[]): Sticker[] {
    if (filter === 'all') return items;
    if (filter === 'missing') return items.filter((s) => !counts[s.id]);
    if (filter === 'have') return items.filter((s) => (counts[s.id] ?? 0) >= 1);
    return items.filter((s) => (counts[s.id] ?? 0) > 1);
  }

  const rendered = visibleSections
    .map((section) => {
      const all = stickersBySection.get(section.code) ?? [];
      const visible = applyFilter(all);
      if (filter !== 'all' && visible.length === 0) return null;
      return (
        <SectionCard
          key={section.code}
          section={section}
          allStickers={all}
          visibleStickers={visible}
        />
      );
    })
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <ProgressBar />
      <Filters />
      <div className="space-y-2">
        {rendered.length > 0 ? (
          rendered
        ) : (
          <div className="text-center text-sm text-muted py-8">
            {search.trim()
              ? 'Sin secciones que coincidan con la búsqueda.'
              : 'Sin secciones con estampas en este filtro.'}
          </div>
        )}
      </div>
    </div>
  );
}
