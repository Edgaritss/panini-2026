import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { StickerCell } from './StickerCell';
import { Icon } from './Icon';
import type { Section, Sticker } from '../types';

interface Props {
  section: Section;
  allStickers: Sticker[];
  visibleStickers: Sticker[];
}

export function SectionCard({ section, allStickers, visibleStickers }: Props) {
  const open = useAlbumStore((s) => !!s.openSections[section.code]);
  const toggle = useAlbumStore((s) => s.toggleSection);
  const counts = useAlbumStore((s) => s.counts);

  let owned = 0;
  let duplicates = 0;
  for (const st of allStickers) {
    const c = counts[st.id] ?? 0;
    if (c >= 1) owned += 1;
    if (c > 1) duplicates += c - 1;
  }
  const total = allStickers.length;
  const complete = owned === total;
  const title =
    section.code === 'FWC'
      ? `${section.code} · FIFA World Cup 2026`
      : `${section.code} · ${section.name}`;

  return (
    <article
      className={`bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden ${
        complete ? 'relative' : ''
      }`}
    >
      {complete && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 bg-owned"
          aria-hidden
        />
      )}
      <div
        className={`flex items-center justify-between gap-3 p-4 ${
          complete ? 'pl-5' : ''
        } ${open ? 'border-b border-outline-variant' : ''}`}
      >
        <Link
          to={`/seccion/${section.code}`}
          className="flex items-center gap-3 min-w-0 -mx-2 -my-2 px-2 py-2 rounded hover:bg-surface-bright transition-colors"
        >
          <h2 className="font-semibold text-heading text-on-surface truncate">
            {title}
          </h2>
          {complete && (
            <Icon name="check_circle" filled className="text-owned shrink-0" size={20} />
          )}
        </Link>
        <button
          type="button"
          onClick={() => toggle(section.code)}
          aria-expanded={open}
          aria-label={`${open ? 'Colapsar' : 'Expandir'} ${section.code}`}
          className="flex items-center gap-3 shrink-0 -mx-2 -my-2 px-2 py-2 rounded hover:bg-surface-bright transition-colors"
        >
          {duplicates > 0 && (
            <span className="text-caps text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full uppercase">
              +{duplicates}
            </span>
          )}
          <span
            className={`text-body-strong tabular-nums ${
              complete ? 'text-owned' : 'text-on-surface-variant'
            }`}
          >
            {owned}/{total}
          </span>
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            className="text-on-surface-variant"
          />
        </button>
      </div>
      {open && visibleStickers.length > 0 && (
        <div className="p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-gutter">
          {visibleStickers.map((st) => (
            <StickerCell
              key={st.id}
              stickerId={st.id}
              number={st.number}
              sectionCode={st.sectionCode}
            />
          ))}
        </div>
      )}
      {open && visibleStickers.length === 0 && (
        <div className="px-4 py-3 text-small text-on-surface-variant">
          Nada que mostrar con el filtro actual.
        </div>
      )}
    </article>
  );
}
