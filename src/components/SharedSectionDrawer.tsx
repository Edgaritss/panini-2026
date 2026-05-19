import { useEffect } from 'react';
import { sections, stickersBySection } from '../data/album';
import { FlagCircle } from './FlagCircle';
import { Icon } from './Icon';

interface Props {
  sectionCode: string;
  owned: Record<string, number>;
  onClose: () => void;
  onNavigate: (newCode: string) => void;
}

export function SharedSectionDrawer({
  sectionCode,
  owned,
  onClose,
  onNavigate,
}: Props) {
  const idx = sections.findIndex((s) => s.code === sectionCode);
  const section = idx >= 0 ? sections[idx] : null;
  const list = section ? (stickersBySection.get(section.code) ?? []) : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const prev = sections[(idx - 1 + sections.length) % sections.length];
        onNavigate(prev.code);
      }
      if (e.key === 'ArrowRight') {
        const next = sections[(idx + 1) % sections.length];
        onNavigate(next.code);
      }
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [idx, onClose, onNavigate]);

  if (!section) return null;

  const isFWC = section.group === null;
  const longName = isFWC ? 'FIFA World Cup 2026' : section.name;
  let ownedCount = 0;
  let duplicates = 0;
  for (const st of list) {
    const c = owned[st.id] ?? 0;
    if (c >= 1) ownedCount += 1;
    if (c > 1) duplicates += c - 1;
  }
  const prev = sections[(idx - 1 + sections.length) % sections.length];
  const next = sections[(idx + 1) % sections.length];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-on-surface/40 backdrop-blur-sm p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-outline-variant flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isFWC ? (
              <span
                className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-secondary text-on-secondary shrink-0"
                aria-hidden
              >
                <Icon name="emoji_events" filled size={18} />
              </span>
            ) : (
              <FlagCircle code={section.code} size={32} />
            )}
            <div className="min-w-0">
              <p className="text-caps font-mono uppercase tracking-widest text-on-surface-variant">
                {section.code}
                {section.group && (
                  <span className="ml-2">· Grupo {section.group}</span>
                )}
              </p>
              <h2 className="text-heading text-on-surface truncate">
                {longName}
              </h2>
              <p className="text-small text-on-surface-variant">
                {ownedCount}/20 estampas
                {duplicates > 0 && (
                  <span className="text-secondary">
                    {' · '}
                    {duplicates} {duplicates === 1 ? 'repetida' : 'repetidas'}
                  </span>
                )}
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {list.map((st) => {
              const count = owned[st.id] ?? 0;
              const hasIt = count > 0;
              const dupes = count > 1 ? count - 1 : 0;
              return (
                <div key={st.id} className="relative">
                  <div
                    aria-label={
                      hasIt
                        ? `${st.id}: tiene ${count}.`
                        : `${st.id}: no la tiene.`
                    }
                    className={`w-full aspect-square rounded flex items-center justify-center font-mono text-mono-code select-none ${
                      hasIt
                        ? 'bg-[#15803D] text-white'
                        : 'border border-dashed border-outline-variant text-on-tertiary-container'
                    }`}
                  >
                    {st.sectionCode} {st.number}
                  </div>
                  {dupes > 0 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-secondary text-on-secondary text-caps font-semibold flex items-center justify-center border-2 border-surface-container-lowest"
                    >
                      +{dupes}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <nav className="px-5 py-3 border-t border-outline-variant grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate(prev.code)}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            <span className="truncate">
              {prev.code}
              {prev.code !== 'FWC' && ` · ${prev.name}`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(next.code)}
            className="inline-flex items-center justify-end gap-2 h-10 px-3 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="truncate">
              {next.code}
              {next.code !== 'FWC' && ` · ${next.name}`}
            </span>
            <Icon name="arrow_forward" size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}
