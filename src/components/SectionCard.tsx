import { useAlbumStore } from '../store/useAlbumStore';
import { StickerCell } from './StickerCell';
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

  return (
    <article className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggle(section.code)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[56px] hover:bg-bg/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-semibold text-muted w-10 shrink-0">
            {section.code}
          </span>
          <div className="min-w-0">
            <div className="font-medium leading-tight truncate">
              {section.name}
            </div>
            <div className="text-xs text-muted">
              {section.group ? `Grupo ${section.group}` : 'Portada / Trofeo'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {duplicates > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-duplicate/15 text-duplicate font-medium">
              +{duplicates}
            </span>
          )}
          <span
            className={`text-sm tabular-nums ${complete ? 'text-have font-semibold' : 'text-muted'}`}
          >
            {owned}/{total}
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </button>
      {open && visibleStickers.length > 0 && (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 pt-2 border-t border-border">
          {visibleStickers.map((st) => (
            <StickerCell key={st.id} stickerId={st.id} number={st.number} />
          ))}
        </div>
      )}
      {open && visibleStickers.length === 0 && (
        <div className="px-4 py-3 text-xs text-muted border-t border-border">
          Nada que mostrar con el filtro actual.
        </div>
      )}
    </article>
  );
}
