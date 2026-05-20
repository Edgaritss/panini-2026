import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { useSettings } from '../store/useSettings';
import { useTheme } from '../store/useTheme';
import { themes, type ThemePalette } from '../lib/themes';
import { useAuthMode } from '../store/useAuth';
import { importJSONFile } from '../lib/exportImport';
import { downloadExcel } from '../lib/exportExcel';
import { TOTAL, stickers, sections as allSections } from '../data/album';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Toggle } from '../components/Toggle';
import type { Theme } from '../types';

const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'light', label: 'Claro', icon: 'light_mode' },
  { id: 'dark', label: 'Oscuro', icon: 'dark_mode' },
  { id: 'auto', label: 'Auto', icon: 'hdr_auto' },
];

export function Settings() {
  const reset = useAlbumStore((s) => s.reset);
  const counts = useAlbumStore((s) => s.counts);
  const theme = useAlbumStore((s) => s.theme);
  const setTheme = useAlbumStore((s) => s.setTheme);
  const paletteId = useTheme((s) => s.paletteId);
  const setPalette = useTheme((s) => s.setPalette);
  const stickAnimationEnabled = useSettings((s) => s.stickAnimationEnabled);
  const celebrationEnabled = useSettings((s) => s.celebrationEnabled);
  const reducedMotionEnabled = useSettings((s) => s.reducedMotionEnabled);
  const toggleStickAnimation = useSettings((s) => s.toggleStickAnimation);
  const toggleCelebration = useSettings((s) => s.toggleCelebration);
  const toggleReducedMotion = useSettings((s) => s.toggleReducedMotion);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [needsAccountOpen, setNeedsAccountOpen] = useState(false);
  const [busy, setBusy] = useState<'export' | null>(null);
  const [importMsg, setImportMsg] = useState<{
    tone: 'ok' | 'error';
    text: string;
  } | null>(null);
  const mode = useAuthMode();
  const navigate = useNavigate();

  function handleShareClick() {
    if (mode === 'authed') navigate('/ajustes/compartir');
    else setNeedsAccountOpen(true);
  }

  async function handleExport() {
    try {
      setBusy('export');
      await downloadExcel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setImportMsg({ tone: 'error', text: `Error al exportar: ${msg}` });
      window.setTimeout(() => setImportMsg(null), 5000);
    } finally {
      setBusy(null);
    }
  }

  const owned = stickers.reduce(
    (acc, st) => acc + ((counts[st.id] ?? 0) >= 1 ? 1 : 0),
    0,
  );

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importJSONFile(file);
      setImportMsg({
        tone: 'ok',
        text: `Importado: ${n} ${n === 1 ? 'estampa' : 'estampas'} (${file.name}).`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setImportMsg({ tone: 'error', text: `Error al importar: ${msg}` });
    }
    window.setTimeout(() => setImportMsg(null), 5000);
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
      <h1 className="text-display-l text-on-surface">Ajustes</h1>

      <section className="space-y-4">
        <h3 className="text-caps text-on-surface-variant uppercase">Datos</h3>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
          <SettingsRow
            icon="ios_share"
            label="Compartir mi álbum"
            onClick={handleShareClick}
            divider
          />
          <SettingsRow
            icon="table_chart"
            label={busy === 'export' ? 'Generando Excel…' : 'Exportar Excel (.xlsx)'}
            onClick={handleExport}
            disabled={busy === 'export'}
          />
          <SettingsRow
            icon="upload"
            label="Importar archivo (.json)"
            onClick={() => fileRef.current?.click()}
            divider
          />
          <SettingsRow
            icon="delete_forever"
            label="Reiniciar colección"
            tone="danger"
            onClick={() => setConfirmOpen(true)}
          />
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
            className={`text-small ${
              importMsg.tone === 'ok' ? 'text-owned' : 'text-secondary'
            }`}
          >
            {importMsg.text}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-caps text-on-surface-variant uppercase">Apariencia</h3>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 space-y-5">
          <div>
            <p className="text-body-strong text-on-surface mb-1">Modo</p>
            <p className="text-small text-on-surface-variant mb-3">
              Tema claro, oscuro o según el sistema.
            </p>
            <div className="flex bg-surface-container p-1 rounded-lg">
              {THEMES.map((opt) => {
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md text-small transition-colors ${
                      active
                        ? 'bg-surface-bright shadow-sm text-on-surface border border-outline-variant/60'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon name={opt.icon} size={18} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-body-strong text-on-surface mb-1">Paleta de colores</p>
            <p className="text-small text-on-surface-variant mb-3">
              Elige los colores que mejor te van. El cambio se aplica al instante.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {themes.map((t) => (
                <ThemeCard
                  key={t.id}
                  palette={t}
                  active={paletteId === t.id}
                  isDark={theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)}
                  onClick={() => setPalette(t.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-caps text-on-surface-variant uppercase">Animaciones</h3>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
          <ToggleRow
            title="Animación al pegar estampas"
            description="Pequeña animación cuando marcas una estampa como obtenida."
            checked={stickAnimationEnabled}
            onChange={toggleStickAnimation}
          />
          <ToggleRow
            title="Celebración al completar un país"
            description="Confeti y trofeo cuando completas todas las estampas de un país."
            checked={celebrationEnabled}
            onChange={toggleCelebration}
            divider
          />
          <ToggleRow
            title="Reducir movimiento"
            description="Desactiva todas las animaciones (igual que la opción del sistema)."
            checked={reducedMotionEnabled}
            onChange={toggleReducedMotion}
            divider
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-caps text-on-surface-variant uppercase">Acerca de</h3>
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-on-secondary text-heading font-semibold">
              M
            </div>
            <div>
              <h4 className="text-body-strong text-on-surface">Mundial '26 Tracker</h4>
              <p className="text-small text-on-surface-variant">
                {TOTAL} estampas · {allSections.length} secciones · Datos guardados localmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <p className="text-center text-small text-on-surface-variant/70">
        Diseñado para coleccionistas.
      </p>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Reiniciar toda la colección?"
        description={
          <>
            Esta acción no se puede deshacer. Se perderán las{' '}
            <strong>{owned}</strong> estampas registradas.
          </>
        }
        icon={{ name: 'warning', tone: 'danger' }}
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirmOpen(false);
              }}
              className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm"
            >
              Sí, reiniciar
            </button>
          </>
        }
      />

      <Modal
        open={needsAccountOpen}
        onClose={() => setNeedsAccountOpen(false)}
        title="Necesitas una cuenta"
        description={
          <>
            Para compartir tu álbum necesitas crear una cuenta. Tu progreso
            del modo invitado puede migrarse automáticamente cuando te
            registres.
          </>
        }
        icon={{ name: 'lock', tone: 'danger' }}
        actions={
          <>
            <button
              type="button"
              onClick={() => setNeedsAccountOpen(false)}
              className="px-4 py-2 rounded border border-outline-variant bg-surface text-on-surface font-body-strong hover:bg-surface-container transition-colors"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={() => {
                setNeedsAccountOpen(false);
                navigate('/registro');
              }}
              className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors shadow-sm"
            >
              Crear cuenta
            </button>
          </>
        }
      />
    </div>
  );
}

interface RowProps {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: 'danger';
  divider?: boolean;
  disabled?: boolean;
}

function SettingsRow({ icon, label, onClick, tone, divider, disabled }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed ${
        divider ? 'border-b border-outline-variant' : ''
      } ${tone === 'danger' ? 'border-t border-outline-variant' : ''}`}
    >
      <Icon
        name={icon}
        className={tone === 'danger' ? 'text-secondary' : 'text-on-surface-variant'}
      />
      <span
        className={`text-body ${tone === 'danger' ? 'text-secondary' : 'text-on-surface'}`}
      >
        {label}
      </span>
    </button>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  divider?: boolean;
}

interface ThemeCardProps {
  palette: ThemePalette;
  active: boolean;
  isDark: boolean;
  onClick: () => void;
}

function ThemeCard({ palette, active, isDark, onClick }: ThemeCardProps) {
  const colors = isDark ? palette.dark : palette.light;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative text-left p-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        active
          ? 'border-secondary ring-2 ring-secondary/30 bg-surface-bright'
          : 'border-outline-variant hover:border-outline bg-surface-container-lowest'
      }`}
    >
      <div className="flex gap-1.5 mb-2.5">
        <span
          className="w-7 h-7 rounded-md"
          style={{ backgroundColor: colors.secondary }}
        />
        <span
          className="w-7 h-7 rounded-md"
          style={{ backgroundColor: colors.owned }}
        />
        <span
          className="w-7 h-7 rounded-md"
          style={{ backgroundColor: colors.duplicate }}
        />
      </div>
      <p className="text-small text-on-surface-variant leading-none mb-0.5">
        {palette.emoji}
      </p>
      <p className="text-small font-body-strong text-on-surface leading-tight">
        {palette.name}
      </p>
      {active && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
          <Icon name="check" size={14} />
        </span>
      )}
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange, divider }: ToggleRowProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 ${
        divider ? 'border-t border-outline-variant' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-body text-on-surface">{title}</p>
        <p className="text-small text-on-surface-variant mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
