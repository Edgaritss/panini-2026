import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { sections, stickersBySection } from '../data/album';
import { useAlbumStore } from '../store/useAlbumStore';
import { useAnimations } from '../store/useAnimations';
import { StickerCell } from '../components/StickerCell';
import { StickerCard } from '../components/StickerCard';
import { Icon } from '../components/Icon';
import { FlagCircle } from '../components/FlagCircle';
import { neighborIndices, useGridCols } from '../hooks/useGridCols';

type Mode = 'grid' | 'cards';

export function SectionPage() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const counts = useAlbumStore((s) => s.counts);
  const [mode, setMode] = useState<Mode>('grid');
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Highlight signal from /actividad navigation.
  useEffect(() => {
    const state = location.state as { highlight?: string } | null;
    const id = state?.highlight;
    if (!id) return;
    setHighlightId(id);
    const t = window.setTimeout(() => setHighlightId(null), 2200);
    return () => window.clearTimeout(t);
  }, [location.key, location.state]);

  const idx = sections.findIndex((s) => s.code === code);
  const section = idx >= 0 ? sections[idx] : null;
  const stickers = section ? (stickersBySection.get(section.code) ?? []) : [];

  const { owned, duplicates } = useMemo(() => {
    let owned = 0;
    let duplicates = 0;
    for (const st of stickers) {
      const c = counts[st.id] ?? 0;
      if (c >= 1) owned += 1;
      if (c > 1) duplicates += c - 1;
    }
    return { owned, duplicates };
  }, [counts, stickers]);

  const cols = useGridCols();
  const indexByStickerId = useMemo(() => {
    const m = new Map<string, number>();
    stickers.forEach((s, i) => m.set(s.id, i));
    return m;
  }, [stickers]);

  // Vibrate up to 4 neighbours when a sticker in this grid gets a "stick" event.
  const [vibrating, setVibrating] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (mode !== 'grid') return;
    let lastSeenTick = 0;
    const unsub = useAnimations.subscribe((state) => {
      for (const [id, tag] of state.events) {
        if (tag.tick <= lastSeenTick) continue;
        lastSeenTick = tag.tick;
        if (tag.event !== 'stick') continue;
        const idx = indexByStickerId.get(id);
        if (idx === undefined) continue;
        const ns = new Set(neighborIndices(idx, cols, stickers.length));
        setVibrating(ns);
        window.setTimeout(() => setVibrating(new Set()), 200);
      }
    });
    return unsub;
  }, [mode, cols, indexByStickerId, stickers.length]);

  if (!section) return <Navigate to="/" replace />;

  const total = stickers.length;
  const pct = total ? Math.round((owned / total) * 100) : 0;
  const prev = sections[(idx - 1 + sections.length) % sections.length];
  const next = sections[(idx + 1) % sections.length];

  const subtitle =
    section.group === null
      ? `${section.category === 'sponsor' ? 'Patrocinador' : 'Portada'} · ${owned} de ${total} estampas`
      : `Grupo ${section.group} · ${owned} de ${total} estampas`;

  const longName = section.name;
  const isSpecial = section.group === null;
  const isSponsor = section.category === 'sponsor';

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 self-start text-body-strong text-on-surface-variant hover:text-secondary transition-colors"
      >
        <Icon name="arrow_back" size={18} />
        Volver al álbum
      </Link>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          {isSpecial ? (
            <span
              aria-hidden
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary text-on-secondary inline-flex items-center justify-center shrink-0 shadow-sm"
            >
              <Icon name={isSponsor ? 'local_drink' : 'emoji_events'} filled size={36} />
            </span>
          ) : (
            <FlagCircle
              code={section.code}
              size={80}
              className="md:!w-20 md:!h-20 shadow-sm shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-on-surface-variant tracking-wide text-[44px] md:text-[56px] leading-none">
              {section.code}
            </p>
            <h1 className="text-display-l text-on-surface mt-2">{longName}</h1>
            <p className="text-body text-on-surface-variant mt-1">{subtitle}</p>
            {duplicates > 0 && (
              <p className="text-small text-secondary mt-1">
                {duplicates} {duplicates === 1 ? 'repetida' : 'repetidas'} disponibles para intercambio
              </p>
            )}
            <div className="mt-4 flex items-center gap-3 max-w-lg">
              <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-body-strong text-on-surface tabular-nums w-12 text-right">
                {pct}%
              </span>
            </div>
          </div>
        </div>

        <div className="self-start lg:self-end bg-surface-container p-1 rounded-lg inline-flex">
          {(['grid', 'cards'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-md text-small inline-flex items-center gap-2 transition-colors ${
                mode === m
                  ? 'bg-surface-bright text-on-surface shadow-sm border border-outline-variant/60'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name={m === 'grid' ? 'grid_view' : 'view_agenda'} size={18} />
              {m === 'grid' ? 'Grid' : 'Cards'}
            </button>
          ))}
        </div>
      </header>

      {mode === 'grid' ? (
        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm p-4 md:p-6 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-gutter">
          {stickers.map((st, i) => (
            <div
              key={st.id}
              className={
                highlightId === st.id ? 'sticker-highlight rounded-md' : ''
              }
            >
              <StickerCell
                stickerId={st.id}
                number={st.number}
                sectionCode={st.sectionCode}
                vibrating={vibrating.has(i)}
              />
            </div>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stickers.map((st) => (
            <div
              key={st.id}
              className={
                highlightId === st.id ? 'sticker-highlight rounded-md' : ''
              }
            >
              <StickerCard
                stickerId={st.id}
                number={st.number}
                sectionCode={st.sectionCode}
              />
            </div>
          ))}
        </section>
      )}

      <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to={`/seccion/${prev.code}`}
          className="flex items-center gap-3 p-4 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-bright transition-colors"
        >
          <Icon name="arrow_back" size={20} className="text-on-surface-variant" />
          <div className="min-w-0">
            <p className="text-caps text-on-surface-variant uppercase">Anterior</p>
            <p className="text-body-strong text-on-surface truncate">
              {prev.code} · {prev.name}
            </p>
          </div>
        </Link>
        <Link
          to={`/seccion/${next.code}`}
          className="flex items-center gap-3 p-4 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-bright transition-colors justify-end text-right"
        >
          <div className="min-w-0">
            <p className="text-caps text-on-surface-variant uppercase">Siguiente</p>
            <p className="text-body-strong text-on-surface truncate">
              {next.code} · {next.name}
            </p>
          </div>
          <Icon name="arrow_forward" size={20} className="text-on-surface-variant" />
        </Link>
      </nav>
    </div>
  );
}
