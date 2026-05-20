import { useMemo } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { sections } from '../data/album';
import { ProgressBar } from '../components/ProgressBar';
import { Filters } from '../components/Filters';
import { CountryCard } from '../components/CountryCard';
import { GroupHeader } from '../components/GroupHeader';
import { EmptyBanner } from '../components/EmptyBanner';
import type { Section } from '../types';

interface Counts {
  owned: number;
  duplicates: number;
}

export function Home() {
  const counts = useAlbumStore((s) => s.counts);
  const filter = useAlbumStore((s) => s.filter);
  const search = useAlbumStore((s) => s.search);

  const isEmpty = Object.keys(counts).length === 0;

  function sectionCounts(section: Section): Counts {
    let owned = 0;
    let duplicates = 0;
    for (let n = 1; n <= section.stickerCount; n += 1) {
      const c = counts[`${section.code}${n}`] ?? 0;
      if (c >= 1) owned += 1;
      if (c > 1) duplicates += c - 1;
    }
    return { owned, duplicates };
  }

  function passesFilter(section: Section): boolean {
    if (filter === 'all') return true;
    const { owned, duplicates } = sectionCounts(section);
    if (filter === 'missing') return owned < section.stickerCount;
    if (filter === 'have') return owned > 0;
    return duplicates > 0;
  }

  function passesSearch(section: Section): boolean {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const groupLabel = section.group ? `grupo ${section.group}`.toLowerCase() : '';
    return (
      section.name.toLowerCase().includes(q) ||
      section.code.toLowerCase().includes(q) ||
      groupLabel.includes(q) ||
      (section.group ? section.group.toLowerCase() === q : false)
    );
  }

  const { specials, groups } = useMemo(() => {
    const visible = sections.filter((s) => passesSearch(s) && passesFilter(s));
    const specials = visible.filter((s) => s.group === null);

    // Position index 1..N across the team sections (specials excluded).
    const indexByCode = new Map<string, number>();
    let i = 0;
    for (const s of sections) {
      if (s.group === null) continue;
      i += 1;
      indexByCode.set(s.code, i);
    }

    const grouped = new Map<string, Section[]>();
    for (const s of visible) {
      if (s.group === null) continue;
      const list = grouped.get(s.group) ?? [];
      list.push(s);
      grouped.set(s.group, list);
    }
    const ordered = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        items: items.map((s) => ({ section: s, index: indexByCode.get(s.code)! })),
      }));
    return { specials, groups: ordered };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, filter, search]);

  const nothingMatches = specials.length === 0 && groups.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <ProgressBar />
      {isEmpty && <EmptyBanner />}
      <Filters />

      {nothingMatches ? (
        <div className="text-center text-body text-on-surface-variant py-12">
          {search.trim()
            ? 'Sin selecciones que coincidan con la búsqueda.'
            : 'Sin selecciones con estampas en este filtro.'}
        </div>
      ) : (
        <div className="flex flex-col">
          {specials.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {specials.map((s) => (
                <CountryCard key={s.code} section={s} />
              ))}
            </section>
          )}
          {groups.map(({ group, items }) => (
            <section key={group}>
              <GroupHeader
                label={`Grupo ${group}`}
                caption={`${items.length} ${items.length === 1 ? 'selección' : 'selecciones'}`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {items.map(({ section, index }) => (
                  <CountryCard key={section.code} section={section} index={index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
