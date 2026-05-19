import { useRef, useState } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { downloadJSON, importJSONFile } from '../lib/exportImport';
import { TOTAL } from '../data/album';

export function Settings() {
  const reset = useAlbumStore((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [importMsg, setImportMsg] = useState<{
    tone: 'ok' | 'error';
    text: string;
  } | null>(null);

  function handleReset() {
    if (confirmStep === 0) return setConfirmStep(1);
    if (confirmStep === 1) return setConfirmStep(2);
    reset();
    setConfirmStep(0);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importJSONFile(file);
      setImportMsg({
        tone: 'ok',
        text: `Importado: ${n} ${n === 1 ? 'estampa registrada' : 'estampas registradas'} (${file.name}).`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setImportMsg({ tone: 'error', text: `Error al importar: ${msg}` });
    }
    window.setTimeout(() => setImportMsg(null), 5000);
  }

  return (
    <div className="space-y-3">
      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-1">Respaldo</h2>
        <p className="text-sm text-muted mb-3">
          Exporta o restaura tu progreso como archivo JSON. Recomendado cuando cambias
          de navegador o dispositivo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadJSON}
            className="min-h-[44px] px-4 rounded-xl bg-fg text-bg font-medium hover:opacity-90"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-[44px] px-4 rounded-xl bg-surface border border-border font-medium hover:bg-bg/60"
          >
            Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {importMsg && (
          <p
            className={`text-sm mt-3 ${importMsg.tone === 'ok' ? 'text-have' : 'text-accent'}`}
          >
            {importMsg.text}
          </p>
        )}
      </section>

      <section className="bg-surface border border-accent/40 rounded-xl p-4">
        <h2 className="font-semibold mb-1 text-accent">Zona de peligro</h2>
        <p className="text-sm text-muted mb-3">
          Borrar todo tu progreso de las {TOTAL} estampas. Esta acción no se puede
          deshacer.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className={`min-h-[44px] px-4 rounded-xl font-medium transition-colors ${
              confirmStep === 0
                ? 'bg-surface border border-accent text-accent hover:bg-accent/5'
                : confirmStep === 1
                  ? 'bg-accent/15 border border-accent text-accent'
                  : 'bg-accent text-white'
            }`}
          >
            {confirmStep === 0 && 'Resetear álbum'}
            {confirmStep === 1 && '¿Seguro? Toca para confirmar'}
            {confirmStep === 2 && 'Confirmar definitivamente'}
          </button>
          {confirmStep > 0 && (
            <button
              type="button"
              onClick={() => setConfirmStep(0)}
              className="min-h-[44px] px-3 text-sm text-muted hover:text-fg"
            >
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-1">Acerca</h2>
        <p className="text-sm text-muted">
          Panini · Mundial 2026 — organizador personal de estampas.
          {' '}49 secciones × 20 = {TOTAL} estampas. Datos guardados localmente en este
          navegador.
        </p>
      </section>
    </div>
  );
}
