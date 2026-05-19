import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, useAuthMode } from '../store/useAuth';
import {
  buildCollabUrl,
  buildQrDataUrl,
  buildShareUrl,
  createCollabShare,
  createReadOnlyShare,
  listMyShares,
  listShareActivity,
  revokeShare,
  maskEmail,
  type CollabDuration,
  type ShareLogEntry,
  type ShareRow,
} from '../lib/share';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

export function SharePage() {
  const mode = useAuthMode();
  const user = useAuth((s) => s.user);
  const [shares, setShares] = useState<ShareRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ShareRow | null>(null);
  const [created, setCreated] = useState<ShareRow | null>(null);
  const [collabCreated, setCollabCreated] = useState<{ share: ShareRow; pin: string } | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);
  const [activityFor, setActivityFor] = useState<ShareRow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function refresh() {
    try {
      const list = await listMyShares();
      setShares(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  useEffect(() => {
    if (mode !== 'authed') return;
    void refresh();
  }, [mode]);

  if (mode === 'guest') {
    return <Navigate to="/ajustes" replace />;
  }

  async function handleCreate() {
    setError(null);
    setBusy(true);
    try {
      const s = await createReadOnlyShare(user?.email ?? null);
      setCreated(s);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCollab(
    duration: CollabDuration,
    allowRemove: boolean,
  ) {
    setError(null);
    setBusy(true);
    try {
      const result = await createCollabShare({
        currentEmail: user?.email ?? null,
        duration,
        allowRemove,
      });
      setCollabOpen(false);
      setCollabCreated(result);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(share: ShareRow) {
    try {
      await revokeShare(share.id);
      setConfirmRevoke(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(url);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const activeShares = (shares ?? []).filter((s) => !s.revoked);
  const revokedShares = (shares ?? []).filter((s) => s.revoked);

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div>
        <Link
          to="/ajustes"
          className="inline-flex items-center gap-2 text-body-strong text-on-surface-variant hover:text-secondary transition-colors"
        >
          <Icon name="arrow_back" size={18} />
          Volver a Ajustes
        </Link>
        <h1 className="text-display-l text-on-surface mt-4">Compartir mi álbum</h1>
        <p className="text-body text-on-surface-variant mt-1">
          Genera enlaces para que otras personas vean tu progreso. Puedes
          revocarlos cuando quieras.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="visibility" size={18} className="text-on-surface-variant" />
              <h2 className="text-heading text-on-surface">Solo lectura</h2>
            </div>
            <p className="text-small text-on-surface-variant mt-2">
              Cualquier persona con el link puede ver tu álbum pero no
              editarlo. Sin expiración.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="self-start h-11 px-5 rounded-full bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Generando…' : 'Generar enlace →'}
          </button>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="edit_note" size={20} className="text-on-surface-variant" />
              <h2 className="text-heading text-on-surface">Colaboración</h2>
            </div>
            <p className="text-small text-on-surface-variant mt-2">
              Link + PIN para que alguien edite contigo (agregar y, opcional,
              quitar). Expira y se puede revocar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollabOpen(true)}
            disabled={busy}
            className="self-start h-11 px-5 rounded-full border border-on-surface/30 text-on-surface font-body-strong hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generar link y PIN →
          </button>
        </section>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-container bg-secondary-fixed p-3 text-small text-on-error-container flex items-start gap-2"
        >
          <Icon name="error" filled size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-caps text-on-surface-variant uppercase">
          Enlaces activos {activeShares.length > 0 && `· ${activeShares.length}`}
        </h2>
        {shares === null ? (
          <p className="text-body text-on-surface-variant">Cargando…</p>
        ) : activeShares.length === 0 ? (
          <p className="text-body text-on-surface-variant">
            No tienes enlaces activos. Genera uno para empezar a compartir.
          </p>
        ) : (
          <ul className="space-y-3">
            {activeShares.map((s) => (
              <ShareRowItem
                key={s.id}
                share={s}
                copied={copied}
                onCopy={copy}
                onRevoke={() => setConfirmRevoke(s)}
                onOpenQr={() => setCreated(s)}
                onShowActivity={
                  s.mode === 'collaborative' ? () => setActivityFor(s) : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>

      {revokedShares.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-caps text-on-surface-variant uppercase">
            Revocados
          </h2>
          <ul className="space-y-2">
            {revokedShares.map((s) => (
              <li
                key={s.id}
                className="bg-surface-container/60 border border-outline-variant rounded-lg p-3 text-small text-on-surface-variant flex items-center justify-between gap-3"
              >
                <span className="font-mono truncate">{s.id.slice(0, 8)}…</span>
                <span>Revocado · {new Date(s.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {created && (
        <ShareCreatedModal share={created} onClose={() => setCreated(null)} />
      )}

      {collabOpen && (
        <CollabGenerateModal
          busy={busy}
          onCancel={() => setCollabOpen(false)}
          onSubmit={handleCreateCollab}
        />
      )}

      {collabCreated && (
        <CollabCreatedModal
          share={collabCreated.share}
          pin={collabCreated.pin}
          onClose={() => setCollabCreated(null)}
        />
      )}

      {activityFor && (
        <ActivityModal
          share={activityFor}
          onClose={() => setActivityFor(null)}
        />
      )}

      {confirmRevoke && (
        <Modal
          open
          onClose={() => setConfirmRevoke(null)}
          title="¿Revocar este enlace?"
          description={
            <>
              El link dejará de funcionar inmediatamente. Las personas que lo
              tengan verán un mensaje de "enlace no disponible".
            </>
          }
          icon={{ name: 'warning', tone: 'danger' }}
          actions={
            <>
              <button
                type="button"
                onClick={() => setConfirmRevoke(null)}
                className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRevoke(confirmRevoke)}
                className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm"
              >
                Sí, revocar
              </button>
            </>
          }
        />
      )}

      <p className="text-small text-on-surface-variant/70">
        El enlace muestra solo tu progreso de forma anónima como{' '}
        <strong>{maskEmail(user?.email ?? null)}</strong>.
      </p>
    </div>
  );
}

interface RowProps {
  share: ShareRow;
  copied: string | null;
  onCopy: (url: string) => void;
  onRevoke: () => void;
  onOpenQr: () => void;
  onShowActivity?: () => void;
}

function ShareRowItem({
  share,
  copied,
  onCopy,
  onRevoke,
  onOpenQr,
  onShowActivity,
}: RowProps) {
  const url =
    share.mode === 'collaborative'
      ? buildCollabUrl(share.id)
      : buildShareUrl(share.id);
  const wasCopied = copied === url;
  const expiry = share.expires_at ? new Date(share.expires_at) : null;
  const expired = expiry && expiry.getTime() < Date.now();
  return (
    <li className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-body-strong text-on-surface flex items-center gap-2">
          {share.mode === 'readonly' ? 'Solo lectura' : 'Colaboración'}
          {share.mode === 'collaborative' && (
            <span className="text-caps uppercase px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
              PIN
            </span>
          )}
        </p>
        <p className="text-small text-on-surface-variant truncate font-mono">
          {url}
        </p>
        <p className="text-small text-on-surface-variant/70 mt-1">
          Creado {new Date(share.created_at).toLocaleDateString()}
          {expiry && (
            <>
              {' · '}
              {expired ? 'expirado' : `expira ${expiry.toLocaleString()}`}
            </>
          )}
          {share.last_accessed_at &&
            ` · último acceso ${new Date(share.last_accessed_at).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onCopy(url)}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors"
        >
          <Icon name={wasCopied ? 'check' : 'content_copy'} size={16} />
          {wasCopied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={onOpenQr}
          aria-label="Ver QR"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
        >
          <Icon name="qr_code" size={18} />
        </button>
        {onShowActivity && (
          <button
            type="button"
            onClick={onShowActivity}
            aria-label="Ver actividad"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
          >
            <Icon name="history" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={onRevoke}
          aria-label="Revocar"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-outline-variant text-secondary hover:bg-error-container/30 transition-colors"
        >
          <Icon name="link_off" size={18} />
        </button>
      </div>
    </li>
  );
}

function ShareCreatedModal({
  share,
  onClose,
}: {
  share: ShareRow;
  onClose: () => void;
}) {
  const url = buildShareUrl(share.id);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    buildQrDataUrl(url).then((data) => {
      if (alive) setQr(data);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `compartido-${share.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="modal-anim w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-heading text-on-surface text-center">
          Enlace listo
        </h2>
        {qr ? (
          <img
            src={qr}
            alt={`Código QR para ${url}`}
            width={256}
            height={256}
            className="rounded-md border border-outline-variant"
          />
        ) : (
          <div className="w-64 h-64 bg-surface-container animate-pulse rounded-md" />
        )}
        <div className="w-full flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 h-10 px-3 rounded-md bg-surface-container border border-outline-variant text-small font-mono text-on-surface"
          />
          <button
            type="button"
            onClick={copy}
            className="h-10 px-3 rounded-md bg-secondary text-on-secondary text-small font-body-strong hover:bg-secondary-container transition-colors shrink-0"
          >
            {copied ? '✓' : 'Copiar'}
          </button>
        </div>
        <p className="text-small text-on-surface-variant text-center">
          Cualquier persona con este link puede ver tu álbum. Puedes revocarlo
          cuando quieras.
        </p>
        <div className="flex items-center gap-2 mt-2 w-full">
          <button
            type="button"
            onClick={downloadQr}
            disabled={!qr}
            className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <Icon name="download" size={16} />
            Descargar QR
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-md bg-on-surface text-background text-small font-body-strong hover:opacity-90 transition-opacity"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CollabGenerateModalProps {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (duration: CollabDuration, allowRemove: boolean) => void;
}

const DURATIONS: { id: CollabDuration; label: string }[] = [
  { id: '1h', label: '1 hora' },
  { id: '4h', label: '4 horas' },
  { id: '24h', label: '24 horas' },
  { id: '7d', label: '7 días' },
];

function CollabGenerateModal({ busy, onCancel, onSubmit }: CollabGenerateModalProps) {
  const [duration, setDuration] = useState<CollabDuration>('4h');
  const [allowRemove, setAllowRemove] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="modal-anim w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 className="text-heading text-on-surface">Generar link de colaboración</h2>
          <p className="text-small text-on-surface-variant mt-1">
            La persona necesitará el link <strong>y</strong> el PIN que verás
            al final para entrar.
          </p>
        </header>

        <section className="space-y-2">
          <p className="text-caps text-on-surface-variant uppercase tracking-wider">
            Duración
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuration(d.id)}
                className={`h-10 px-3 rounded-md border text-small transition-colors ${
                  duration === d.id
                    ? 'bg-secondary text-on-secondary border-secondary'
                    : 'border-outline-variant text-on-surface hover:bg-surface-container'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-caps text-on-surface-variant uppercase tracking-wider">
            Permisos
          </p>
          <button
            type="button"
            onClick={() => setAllowRemove(false)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              !allowRemove
                ? 'border-secondary/60 bg-secondary/5'
                : 'border-outline-variant hover:bg-surface-container'
            }`}
          >
            <p className="text-body-strong text-on-surface">
              Solo agregar
              {!allowRemove && (
                <span className="ml-2 text-caps uppercase text-secondary">
                  Más seguro
                </span>
              )}
            </p>
            <p className="text-small text-on-surface-variant mt-0.5">
              Pueden marcar estampas pero no quitarlas.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAllowRemove(true)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              allowRemove
                ? 'border-secondary/60 bg-secondary/5'
                : 'border-outline-variant hover:bg-surface-container'
            }`}
          >
            <p className="text-body-strong text-on-surface">Agregar y quitar</p>
            <p className="text-small text-on-surface-variant mt-0.5">
              Edición completa, igual que si fueras tú.
            </p>
          </button>
        </section>

        <footer className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit(duration, allowRemove)}
            disabled={busy}
            className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm disabled:opacity-50"
          >
            {busy ? 'Generando…' : 'Generar →'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CollabCreatedModal({
  share,
  pin,
  onClose,
}: {
  share: ShareRow;
  pin: string;
  onClose: () => void;
}) {
  const url = buildCollabUrl(share.id);
  const [copied, setCopied] = useState<'url' | 'pin' | null>(null);

  async function copy(value: string, kind: 'url' | 'pin') {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const expiry = share.expires_at ? new Date(share.expires_at) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="modal-anim w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 className="text-heading text-on-surface">Link de colaboración listo</h2>
          <p className="text-small text-on-surface-variant mt-1">
            Manda el link y el PIN <strong>por separado</strong> para mayor
            seguridad. Por ejemplo, el link por WhatsApp y el PIN en persona.
          </p>
        </header>

        <section>
          <p className="text-caps text-on-surface-variant uppercase mb-1">PIN</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[40px] tracking-[0.3em] text-secondary tabular-nums select-all">
              {pin}
            </p>
            <button
              type="button"
              onClick={() => copy(pin, 'pin')}
              className="h-9 px-3 rounded-md border border-outline-variant text-small text-on-surface hover:bg-surface-container transition-colors"
            >
              {copied === 'pin' ? '✓' : 'Copiar PIN'}
            </button>
          </div>
          <p className="text-small text-on-surface-variant mt-1">
            No podrás recuperar este PIN después. Si lo pierdes, revoca y genera otro.
          </p>
        </section>

        <section>
          <p className="text-caps text-on-surface-variant uppercase mb-1">Link</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 h-10 px-3 rounded-md bg-surface-container border border-outline-variant text-small font-mono text-on-surface"
            />
            <button
              type="button"
              onClick={() => copy(url, 'url')}
              className="h-10 px-3 rounded-md bg-secondary text-on-secondary text-small font-body-strong hover:bg-secondary-container transition-colors shrink-0"
            >
              {copied === 'url' ? '✓' : 'Copiar'}
            </button>
          </div>
        </section>

        {expiry && (
          <p className="text-small text-on-surface-variant text-center">
            Expira el <strong>{expiry.toLocaleString()}</strong>.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-md bg-on-surface text-background text-small font-body-strong hover:opacity-90 transition-opacity"
        >
          Ya lo guardé
        </button>
      </div>
    </div>
  );
}

function ActivityModal({
  share,
  onClose,
}: {
  share: ShareRow;
  onClose: () => void;
}) {
  const [log, setLog] = useState<ShareLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listShareActivity(share.id)
      .then(setLog)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [share.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="modal-anim w-full max-w-[560px] max-h-[80vh] bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h2 className="text-heading text-on-surface">Actividad</h2>
            <p className="text-small text-on-surface-variant font-mono truncate">
              {share.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <p className="text-small text-secondary">{error}</p>
          )}
          {log === null && !error && (
            <p className="text-small text-on-surface-variant">Cargando…</p>
          )}
          {log && log.length === 0 && (
            <p className="text-small text-on-surface-variant text-center py-8">
              Aún no hay actividad registrada en este enlace.
            </p>
          )}
          {log && log.length > 0 && (
            <ul className="divide-y divide-outline-variant">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      name={entry.action === 'add' ? 'add' : 'remove'}
                      filled
                      size={16}
                      className={
                        entry.action === 'add'
                          ? 'text-[#15803D] dark:text-[#22c55e]'
                          : 'text-secondary'
                      }
                    />
                    <span className="font-mono text-mono-code text-on-surface">
                      {entry.sticker_id}
                    </span>
                    <span className="text-small text-on-surface-variant">
                      {entry.count_before} → {entry.count_after}
                    </span>
                  </div>
                  <span className="text-small text-on-surface-variant/80 tabular-nums shrink-0">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
