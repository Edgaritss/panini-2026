import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicShare, type PublicSharePayload } from '../lib/share';
import { sections, TOTAL } from '../data/album';
import { useAlbumStore } from '../store/useAlbumStore';
import { useAuthMode } from '../store/useAuth';
import { CountryCard } from '../components/CountryCard';
import { GroupHeader } from '../components/GroupHeader';
import { Icon } from '../components/Icon';
import { SharedSectionDrawer } from '../components/SharedSectionDrawer';
import { SharedTradeModal } from '../components/SharedTradeModal';
import { SharedCompareModal } from '../components/SharedCompareModal';

type ModalKind = 'missing' | 'duplicates' | 'compare' | null;

export function SharedAlbum() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ok'; data: PublicSharePayload }
    | { status: 'not-found' }
    | { status: 'error'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ status: 'not-found' });
      return;
    }
    let alive = true;
    fetchPublicShare(id)
      .then((data) => {
        if (!alive) return;
        if (!data) setState({ status: 'not-found' });
        else setState({ status: 'ok', data });
      })
      .catch((err) => {
        if (!alive) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Error desconocido',
        });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="dark min-h-screen flex flex-col bg-background text-on-background">
      <header className="border-b border-outline-variant">
        <div className="max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" aria-label="Inicio">
            <span className="w-8 h-8 bg-secondary rounded-sm shrink-0" aria-hidden />
            <span className="font-semibold text-heading tracking-tight">
              Mundial '26
            </span>
          </Link>
          <span className="text-caps text-on-surface-variant uppercase tracking-widest">
            Vista compartida
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-10">
        {state.status === 'loading' && <Spinner />}
        {state.status === 'not-found' && <NotFound />}
        {state.status === 'error' && <ErrorView message={state.message} />}
        {state.status === 'ok' && (
          <SharedView
            owned={state.data.owned}
            firstAddedAt={state.data.firstAddedAt}
            label={state.data.share.display_label ?? 'Sin nombre'}
          />
        )}
      </main>

      <ConversionFooter />
    </div>
  );
}

function Spinner() {
  return (
    <div className="py-20 flex items-center justify-center">
      <div
        role="status"
        aria-label="Cargando"
        className="w-8 h-8 border-2 border-on-surface-variant border-t-secondary rounded-full animate-spin"
      />
    </div>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <Icon name="link_off" size={48} className="text-on-surface-variant mb-4" />
      <h1 className="text-display-l text-on-surface">Enlace no disponible</h1>
      <p className="text-body text-on-surface-variant mt-2 max-w-md mx-auto">
        Este enlace fue revocado o expiró. Pídele al dueño del álbum un enlace
        nuevo.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
      >
        Ir al inicio
      </Link>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-display-l text-on-surface">Algo salió mal</h1>
      <p className="text-body text-on-surface-variant mt-2">{message}</p>
    </div>
  );
}

function ConversionFooter() {
  return (
    <footer className="border-t border-outline-variant py-8">
      <div className="max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop text-center">
        <p className="text-body text-on-surface-variant">
          ¿Quieres llevar el control de tu propio álbum?
        </p>
        <Link
          to="/registro"
          className="mt-3 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
        >
          Crear cuenta gratis <Icon name="arrow_forward" size={18} />
        </Link>
        <p className="mt-3 text-small text-on-surface-variant/70">
          O empieza sin cuenta en menos de 5 segundos.
        </p>
      </div>
    </footer>
  );
}

interface SharedViewProps {
  owned: Record<string, number>;
  firstAddedAt: string | null;
  label: string;
}

function SharedView({ owned, firstAddedAt, label }: SharedViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const mode = useAuthMode();
  const viewerCounts = useAlbumStore((s) => s.counts);
  const hasViewerData = Object.keys(viewerCounts).length > 0;

  const stats = useMemo(() => {
    let totalOwned = 0;
    let duplicates = 0;
    for (const s of sections) {
      for (let n = 1; n <= 20; n += 1) {
        const c = owned[`${s.code}${n}`] ?? 0;
        if (c >= 1) totalOwned += 1;
        if (c > 1) duplicates += c - 1;
      }
    }
    return { totalOwned, duplicates, missing: TOTAL - totalOwned };
  }, [owned]);

  const pct = TOTAL === 0 ? 0 : stats.totalOwned / TOTAL;
  const days =
    firstAddedAt
      ? Math.max(1, Math.floor((Date.now() - new Date(firstAddedAt).getTime()) / 86400000))
      : null;

  const initial = label.charAt(0).toUpperCase();

  const fwc = sections.find((s) => s.group === null) ?? null;
  const groups = useMemo(() => {
    const indexByCode = new Map<string, number>();
    let i = 0;
    for (const s of sections) {
      if (s.group === null) continue;
      i += 1;
      indexByCode.set(s.code, i);
    }
    const map = new Map<string, { code: string; index: number }[]>();
    for (const s of sections) {
      if (s.group === null) continue;
      const list = map.get(s.group) ?? [];
      list.push({ code: s.code, index: indexByCode.get(s.code)! });
      map.set(s.group, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({ group, items }));
  }, []);

  const showCompareCta = mode === 'authed' || mode === 'guest' || hasViewerData;

  return (
    <div className="flex flex-col gap-8">
      <div
        role="status"
        className="rounded-lg border border-[#F59E0B] bg-[#451A03]/40 text-[#FCD34D] px-4 py-3 flex items-center gap-3"
      >
        <Icon name="visibility" filled size={18} />
        <p className="text-small leading-snug">
          Estás viendo el álbum compartido de <strong>{label}</strong>. No puedes
          editarlo.
        </p>
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="w-14 h-14 shrink-0 rounded-full bg-secondary text-on-secondary inline-flex items-center justify-center text-heading font-semibold"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-caps text-on-surface-variant uppercase tracking-widest">
              Álbum compartido
            </p>
            <h1 className="text-display-l text-on-surface mt-1 truncate">{label}</h1>
            <p className="text-body text-on-surface-variant mt-1">
              {stats.totalOwned}/{TOTAL} estampas · {(pct * 100).toFixed(1)}% completo
              {days !== null && (
                <span className="ml-1">· coleccionando hace {days} {days === 1 ? 'día' : 'días'}</span>
              )}
            </p>
          </div>
        </div>
        <div className="w-full lg:w-72 h-2 bg-surface-variant rounded-full overflow-hidden self-end">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct * 100}%`,
              background: 'linear-gradient(90deg, #15803D, #22c55e)',
            }}
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModal('missing')}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors shadow-sm"
        >
          <Icon name="search" size={18} />
          Lo que le falta · {stats.missing}
        </button>
        {stats.duplicates > 0 && (
          <button
            type="button"
            onClick={() => setModal('duplicates')}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-outline-variant text-on-surface text-body-strong hover:bg-surface-container transition-colors"
          >
            <Icon name="inventory_2" size={18} />
            Repetidas · {stats.duplicates}
          </button>
        )}
        {showCompareCta && (
          <button
            type="button"
            onClick={() => setModal('compare')}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-on-surface/30 text-on-surface text-body-strong hover:bg-surface-container transition-colors"
          >
            <Icon name="swap_horiz" size={18} />
            Comparar con mi álbum
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {fwc && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <CountryCard
              section={fwc}
              countsOverride={owned}
              readOnly
              onClick={() => setExpanded(fwc.code)}
            />
          </section>
        )}
        {groups.map(({ group, items }) => (
          <section key={group}>
            <GroupHeader label={`Grupo ${group}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {items.map(({ code, index }) => {
                const section = sections.find((s) => s.code === code)!;
                return (
                  <CountryCard
                    key={section.code}
                    section={section}
                    index={index}
                    countsOverride={owned}
                    readOnly
                    onClick={() => setExpanded(section.code)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {expanded && (
        <SharedSectionDrawer
          sectionCode={expanded}
          owned={owned}
          onClose={() => setExpanded(null)}
          onNavigate={(c) => setExpanded(c)}
        />
      )}

      {modal === 'missing' && (
        <SharedTradeModal
          kind="missing"
          owned={owned}
          ownerLabel={label}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'duplicates' && (
        <SharedTradeModal
          kind="duplicates"
          owned={owned}
          ownerLabel={label}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'compare' && (
        <SharedCompareModal
          ownerOwned={owned}
          ownerLabel={label}
          viewerCounts={viewerCounts}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
