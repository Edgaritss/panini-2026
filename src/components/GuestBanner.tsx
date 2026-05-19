import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

const KEY = 'panini-2026:guest-banner-collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === '1';
}

function writeCollapsed(v: boolean): void {
  if (typeof window === 'undefined') return;
  if (v) localStorage.setItem(KEY, '1');
  else localStorage.removeItem(KEY);
}

export function GuestBanner() {
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed());

  // Keep in sync if the value changes from somewhere else (e.g. settings reset).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setCollapsed(e.newValue === '1');
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function collapse() {
    writeCollapsed(true);
    setCollapsed(true);
  }
  function expand() {
    writeCollapsed(false);
    setCollapsed(false);
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={expand}
        className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FCD34D] border border-[#F59E0B]/60 shadow-sm hover:opacity-90 transition-opacity"
        aria-label="Mostrar aviso de modo invitado"
      >
        <Icon name="info" filled size={14} />
        <span className="text-small">Modo invitado</span>
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Aviso de modo invitado"
      className="sticky top-16 z-30 bg-[#FEF3C7] text-[#92400E] dark:bg-[#451A03] dark:text-[#FCD34D] border-b border-[#F59E0B]"
    >
      <div className="max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-2 flex items-center gap-3">
        <Icon
          name="info"
          filled
          size={18}
          className="shrink-0"
        />
        <p className="flex-1 text-small leading-snug">
          Estás en modo invitado. Tu progreso se guarda solo en este navegador
          — si limpias el caché, lo pierdes.
        </p>
        <Link
          to="/registro"
          className="hidden sm:inline-flex shrink-0 items-center gap-1 text-small font-semibold hover:underline"
        >
          Crear cuenta para sincronizar →
        </Link>
        <button
          type="button"
          onClick={collapse}
          aria-label="Minimizar aviso"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
