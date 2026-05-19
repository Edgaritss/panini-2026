import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, useAuthMode } from '../store/useAuth';
import {
  buildQrDataUrl,
  buildShareUrl,
  createReadOnlyShare,
  listMyShares,
  revokeShare,
  maskEmail,
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

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-heading text-on-surface">Solo lectura</h2>
          <p className="text-small text-on-surface-variant mt-1">
            Cualquier persona con el link puede ver tu álbum pero no editarlo.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="self-start h-11 px-5 rounded-full bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Generando…' : 'Generar enlace de solo lectura →'}
        </button>
      </section>

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
}

function ShareRowItem({ share, copied, onCopy, onRevoke, onOpenQr }: RowProps) {
  const url = buildShareUrl(share.id);
  const wasCopied = copied === url;
  return (
    <li className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-body-strong text-on-surface">
          {share.mode === 'readonly' ? 'Solo lectura' : 'Colaboración'}
        </p>
        <p className="text-small text-on-surface-variant truncate font-mono">
          {url}
        </p>
        <p className="text-small text-on-surface-variant/70 mt-1">
          Creado {new Date(share.created_at).toLocaleDateString()}
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
