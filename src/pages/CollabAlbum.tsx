import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  applyCollabChange,
  clearPinAttempts,
  fetchPublicShare,
  forgetCollabPin,
  getPinRateState,
  readCollabPin,
  recordPinFailure,
  rememberCollabPin,
  validateCollabPin,
  type PublicSharePayload,
} from '../lib/share';
import { sections, stickersBySection, TOTAL } from '../data/album';
import { CountryCard } from '../components/CountryCard';
import { GroupHeader } from '../components/GroupHeader';
import { Icon } from '../components/Icon';

type State =
  | { kind: 'loading' }
  | { kind: 'gone' }
  | { kind: 'not-collab' }
  | { kind: 'error'; message: string }
  | { kind: 'pin'; data: PublicSharePayload }
  | { kind: 'ready'; data: PublicSharePayload; pin: string };

export function CollabAlbum() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ kind: 'gone' });
      return;
    }
    let alive = true;
    fetchPublicShare(id)
      .then(async (data) => {
        if (!alive) return;
        if (!data) {
          setState({ kind: 'gone' });
          return;
        }
        if (data.share.mode !== 'collaborative') {
          setState({ kind: 'not-collab' });
          return;
        }
        const cachedPin = readCollabPin(id);
        if (cachedPin) {
          const ok = await validateCollabPin(id, cachedPin).catch(() => false);
          if (ok) {
            setState({ kind: 'ready', data, pin: cachedPin });
            return;
          }
          forgetCollabPin();
        }
        setState({ kind: 'pin', data });
      })
      .catch((err) => {
        if (!alive) return;
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Error',
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
            Colaboración
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-10">
        {state.kind === 'loading' && <Spinner />}
        {state.kind === 'gone' && <GoneView />}
        {state.kind === 'not-collab' && <NotCollabView shareId={id ?? ''} />}
        {state.kind === 'error' && <ErrorView message={state.message} />}
        {state.kind === 'pin' && id && (
          <PinGate
            shareId={id}
            label={state.data.share.display_label ?? 'el álbum'}
            onOk={(pin) => setState({ kind: 'ready', data: state.data, pin })}
          />
        )}
        {state.kind === 'ready' && id && (
          <CollabView
            shareId={id}
            pin={state.pin}
            initialOwned={state.data.owned}
            label={state.data.share.display_label ?? 'Sin nombre'}
            allowRemove={state.data.share.allow_remove}
          />
        )}
      </main>
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

function GoneView() {
  return (
    <div className="py-20 text-center">
      <Icon name="link_off" size={48} className="text-on-surface-variant mb-4" />
      <h1 className="text-display-l text-on-surface">Enlace no disponible</h1>
      <p className="text-body text-on-surface-variant mt-2 max-w-md mx-auto">
        Este enlace fue revocado o expiró.
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

function NotCollabView({ shareId }: { shareId: string }) {
  return (
    <div className="py-20 text-center">
      <Icon name="info" filled size={48} className="text-on-surface-variant mb-4" />
      <h1 className="text-display-l text-on-surface">Enlace no editable</h1>
      <p className="text-body text-on-surface-variant mt-2 max-w-md mx-auto">
        Este enlace es de solo lectura. Pídele al dueño un enlace de colaboración.
      </p>
      <Link
        to={`/compartido/${shareId}`}
        className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
      >
        Ver en modo lectura
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

interface PinGateProps {
  shareId: string;
  label: string;
  onOk: (pin: string) => void;
}

function PinGate({ shareId, label, onOk }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(() => getPinRateState(shareId));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (rate.blocked) return;
    if (!/^\d{6}$/.test(pin)) {
      setError('El PIN debe ser de 6 dígitos.');
      return;
    }
    setBusy(true);
    try {
      const ok = await validateCollabPin(shareId, pin);
      if (ok) {
        clearPinAttempts(shareId);
        rememberCollabPin(shareId, pin);
        onOk(pin);
        return;
      }
      const next = recordPinFailure(shareId);
      setRate(next);
      setError(
        next.blocked
          ? 'Demasiados intentos. Vuelve a intentar más tarde.'
          : `PIN incorrecto. Te quedan ${next.attemptsLeft} ${
              next.attemptsLeft === 1 ? 'intento' : 'intentos'
            }.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-12 flex flex-col items-center">
      <Icon name="lock" filled size={40} className="text-on-surface-variant mb-4" />
      <h1 className="text-display-l text-on-surface text-center">PIN requerido</h1>
      <p className="text-body text-on-surface-variant mt-2 text-center">
        Para colaborar en el álbum de <strong>{label}</strong>, ingresa el
        PIN de 6 dígitos que te compartieron.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 w-full">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={rate.blocked}
          placeholder="••••••"
          aria-label="PIN de 6 dígitos"
          className="w-full text-center font-mono text-[36px] tracking-[0.5em] h-16 bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary placeholder:text-on-surface-variant/30"
        />
        {error && (
          <p
            role="alert"
            className="mt-3 text-small text-secondary text-center"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || rate.blocked || pin.length !== 6}
          className="mt-4 w-full h-12 rounded-lg bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Validando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

interface CollabViewProps {
  shareId: string;
  pin: string;
  initialOwned: Record<string, number>;
  label: string;
  allowRemove: boolean;
}

function CollabView({
  shareId,
  pin,
  initialOwned,
  label,
  allowRemove,
}: CollabViewProps) {
  const [owned, setOwned] = useState(initialOwned);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const totals = useMemo(() => {
    let count = 0;
    for (const s of sections) {
      for (let n = 1; n <= 20; n += 1) {
        if ((owned[`${s.code}${n}`] ?? 0) >= 1) count += 1;
      }
    }
    return count;
  }, [owned]);

  const pct = TOTAL === 0 ? 0 : totals / TOTAL;
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

  function applyLocal(stickerId: string, after: number) {
    setOwned((cur) => {
      const next = { ...cur };
      if (after <= 0) delete next[stickerId];
      else next[stickerId] = after;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        role="status"
        className="rounded-lg border border-[#22c55e]/60 bg-[#15803D]/15 text-[#A7F3D0] px-4 py-3 flex items-center gap-3"
      >
        <Icon name="edit_note" size={18} />
        <p className="text-small leading-snug">
          Colaborando en el álbum de <strong>{label}</strong>.{' '}
          {allowRemove
            ? 'Puedes agregar y quitar estampas. Tus cambios quedan registrados.'
            : 'Solo puedes agregar estampas. Tus cambios quedan registrados.'}
        </p>
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-caps text-on-surface-variant uppercase tracking-widest">
            Álbum compartido
          </p>
          <h1 className="text-display-l text-on-surface mt-1">{label}</h1>
          <p className="text-body text-on-surface-variant mt-1">
            {totals}/{TOTAL} estampas · {(pct * 100).toFixed(1)}%
          </p>
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

      <div className="flex flex-col">
        {fwc && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <CardWrapper onClick={() => setOpenSection(fwc.code)}>
              <CountryCard section={fwc} countsOverride={owned} readOnly />
            </CardWrapper>
          </section>
        )}
        {groups.map(({ group, items }) => (
          <section key={group}>
            <GroupHeader label={`Grupo ${group}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {items.map(({ code, index }) => {
                const section = sections.find((s) => s.code === code)!;
                return (
                  <CardWrapper
                    key={section.code}
                    onClick={() => setOpenSection(section.code)}
                  >
                    <CountryCard
                      section={section}
                      index={index}
                      countsOverride={owned}
                      readOnly
                    />
                  </CardWrapper>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {openSection && (
        <CollabSectionDrawer
          shareId={shareId}
          pin={pin}
          sectionCode={openSection}
          owned={owned}
          allowRemove={allowRemove}
          onClose={() => setOpenSection(null)}
          onUpdate={applyLocal}
        />
      )}
    </div>
  );
}

function CardWrapper({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition-transform hover:-translate-y-0.5"
    >
      {children}
    </button>
  );
}

interface DrawerProps {
  shareId: string;
  pin: string;
  sectionCode: string;
  owned: Record<string, number>;
  allowRemove: boolean;
  onClose: () => void;
  onUpdate: (stickerId: string, after: number) => void;
}

function CollabSectionDrawer({
  shareId,
  pin,
  sectionCode,
  owned,
  allowRemove,
  onClose,
  onUpdate,
}: DrawerProps) {
  const section = sections.find((s) => s.code === sectionCode);
  const list = section ? (stickersBySection.get(section.code) ?? []) : [];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!section) return null;

  async function dispatch(stickerId: string, delta: 1 | -1) {
    setError(null);
    setBusy(stickerId);
    try {
      const result = await applyCollabChange(shareId, pin, stickerId, delta);
      onUpdate(stickerId, result.after);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  const ownedCount = list.reduce(
    (acc, st) => acc + ((owned[st.id] ?? 0) >= 1 ? 1 : 0),
    0,
  );

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
          <div className="min-w-0">
            <p className="text-caps text-on-surface-variant uppercase tracking-widest">
              {section.code}
            </p>
            <h2 className="text-heading text-on-surface truncate">
              {section.code === 'FWC' ? 'FIFA World Cup 2026' : section.name}
            </h2>
            <p className="text-small text-on-surface-variant">
              {ownedCount}/20 estampas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {error && (
            <p role="alert" className="text-small text-secondary mb-3">
              {error}
            </p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {list.map((st) => {
              const count = owned[st.id] ?? 0;
              const hasIt = count > 0;
              const dupes = count > 1 ? count - 1 : 0;
              const isBusy = busy === st.id;
              return (
                <div key={st.id} className="relative">
                  <button
                    type="button"
                    onClick={() => dispatch(st.id, 1)}
                    disabled={isBusy}
                    aria-label={`Sumar ${st.id}`}
                    className={`w-full aspect-square rounded flex items-center justify-center font-mono text-mono-code transition-colors duration-200 active:scale-95 ${
                      hasIt
                        ? 'bg-[#15803D] text-white'
                        : 'border border-dashed border-outline-variant text-on-tertiary-container hover:border-outline'
                    } ${isBusy ? 'opacity-60' : ''}`}
                  >
                    {st.sectionCode} {st.number}
                  </button>
                  {dupes > 0 && (
                    <span className="pointer-events-none absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-secondary text-on-secondary text-caps font-semibold flex items-center justify-center border-2 border-surface-container-lowest">
                      +{dupes}
                    </span>
                  )}
                  {hasIt && allowRemove && (
                    <button
                      type="button"
                      onClick={() => dispatch(st.id, -1)}
                      disabled={isBusy}
                      aria-label={`Restar ${st.id}`}
                      className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface text-base leading-none flex items-center justify-center hover:bg-surface-container active:scale-95 shadow-sm"
                    >
                      −
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
