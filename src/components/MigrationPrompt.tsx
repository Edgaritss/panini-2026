import { useMemo, useState } from 'react';
import { useMigration } from '../store/useMigration';
import { useAlbumStore } from '../store/useAlbumStore';
import { saveNow } from '../lib/sync';
import { Modal } from './Modal';

export function MigrationPrompt() {
  const snapshot = useMigration((s) => s.pendingSnapshot);
  const clear = useMigration((s) => s.clear);
  const remoteCounts = useAlbumStore((s) => s.counts);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const localOwned = useMemo(
    () => (snapshot ? Object.keys(snapshot.counts).length : 0),
    [snapshot],
  );
  const remoteOwned = useMemo(
    () => Object.keys(remoteCounts).length,
    [remoteCounts],
  );

  if (!snapshot) return null;

  function applyUse() {
    if (!snapshot) return;
    useAlbumStore.setState((s) => ({
      counts: { ...snapshot.counts },
      firstAddedAt: snapshot.firstAddedAt ?? s.firstAddedAt,
      localUpdatedAt: Date.now(),
    }));
    clear();
    void saveNow();
  }

  function applyMerge() {
    if (!snapshot) return;
    useAlbumStore.setState((s) => {
      const merged: Record<string, number> = { ...s.counts };
      for (const [id, n] of Object.entries(snapshot.counts)) {
        merged[id] = Math.max(merged[id] ?? 0, n);
      }
      return {
        counts: merged,
        firstAddedAt:
          s.firstAddedAt && snapshot.firstAddedAt
            ? Math.min(s.firstAddedAt, snapshot.firstAddedAt)
            : (s.firstAddedAt ?? snapshot.firstAddedAt),
        localUpdatedAt: Date.now(),
      };
    });
    clear();
    void saveNow();
  }

  function requestDiscard() {
    setConfirmDiscard(true);
  }
  function confirmAndDiscard() {
    clear();
    setConfirmDiscard(false);
  }

  if (confirmDiscard) {
    return (
      <Modal
        open
        onClose={() => setConfirmDiscard(false)}
        title="¿Descartar la colección local?"
        description={
          <>
            Vas a perder las <strong>{localOwned}</strong> estampas que tenías
            como invitado. Esta acción no se puede deshacer.
          </>
        }
        icon={{ name: 'warning', tone: 'danger' }}
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmDiscard(false)}
              className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmAndDiscard}
              className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm"
            >
              Sí, descartar
            </button>
          </>
        }
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4"
    >
      <div
        className="modal-anim w-full max-w-[520px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 flex flex-col gap-4">
          <h2
            id="migration-title"
            className="text-heading text-on-surface"
          >
            Tenías una colección como invitado
          </h2>
          <p className="text-body text-on-surface-variant">
            En este navegador hay{' '}
            <strong>
              {localOwned} {localOwned === 1 ? 'estampa' : 'estampas'}
            </strong>{' '}
            registradas sin cuenta.{' '}
            {remoteOwned > 0
              ? `Tu cuenta ya tiene ${remoteOwned} ${
                  remoteOwned === 1 ? 'estampa' : 'estampas'
                } sincronizadas.`
              : 'Tu cuenta nueva está vacía.'}{' '}
            ¿Qué quieres hacer?
          </p>

          <div className="flex flex-col gap-2 mt-2">
            <Option
              title="Usar la colección local"
              description="Sobrescribe la colección de tu cuenta con lo que tenías como invitado."
              onClick={applyUse}
            />
            <Option
              title="Combinar ambas"
              description="Conserva el mayor conteo de cada estampa entre las dos colecciones."
              recommended
              onClick={applyMerge}
            />
            <Option
              title="Descartar la local"
              description="Ignora los datos del invitado y quédate con lo sincronizado."
              tone="danger"
              onClick={requestDiscard}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface OptionProps {
  title: string;
  description: string;
  onClick: () => void;
  recommended?: boolean;
  tone?: 'danger';
}

function Option({ title, description, onClick, recommended, tone }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-4 transition-colors ${
        tone === 'danger'
          ? 'border-outline-variant hover:bg-error-container/30 text-on-surface'
          : recommended
            ? 'border-secondary/50 bg-secondary/5 hover:bg-secondary/10'
            : 'border-outline-variant hover:bg-surface-container'
      }`}
    >
      <p
        className={`text-body-strong ${
          tone === 'danger' ? 'text-secondary' : 'text-on-surface'
        }`}
      >
        {title}
        {recommended && (
          <span className="ml-2 text-caps uppercase text-secondary">
            Recomendado
          </span>
        )}
      </p>
      <p className="text-small text-on-surface-variant mt-1">{description}</p>
    </button>
  );
}
