import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useAuthMode } from '../store/useAuth';
import { Icon } from './Icon';

export function UserMenu() {
  const mode = useAuthMode();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const exitGuest = useAuth((s) => s.exitGuest);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (mode !== 'authed' && mode !== 'guest') return null;

  const isGuest = mode === 'guest';
  const initial = isGuest ? '?' : (user?.email ?? '?').charAt(0).toUpperCase();
  const trigger = isGuest
    ? 'bg-surface-container text-on-surface-variant border border-outline-variant'
    : 'bg-secondary text-on-secondary hover:bg-secondary-container';

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/', { replace: true });
  }

  function handleExitGuest() {
    setOpen(false);
    exitGuest();
    navigate('/', { replace: true });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isGuest ? 'Menú de invitado' : 'Menú de usuario'}
        className={`w-10 h-10 inline-flex items-center justify-center rounded-full font-semibold transition-colors ${trigger}`}
      >
        {isGuest ? <Icon name="person_outline" size={20} /> : initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 min-w-[240px] bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl p-1"
        >
          <div className="px-3 py-2 border-b border-outline-variant">
            <p className="text-caps text-on-surface-variant uppercase">
              {isGuest ? 'Modo invitado' : 'Sesión'}
            </p>
            <p className="text-small text-on-surface truncate">
              {isGuest
                ? 'Sin cuenta · solo este dispositivo'
                : user?.email}
            </p>
          </div>
          {isGuest ? (
            <>
              <Link
                to="/registro"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-body text-secondary hover:bg-surface-container transition-colors"
              >
                <Icon name="person_add" size={18} />
                Crear cuenta para sincronizar
              </Link>
              <Link
                to="/login"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-body text-on-surface hover:bg-surface-container transition-colors"
              >
                <Icon name="login" size={18} />
                Iniciar sesión
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleExitGuest}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-body text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <Icon name="logout" size={18} />
                Salir del modo invitado
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-body text-on-surface hover:bg-surface-container transition-colors"
            >
              <Icon name="logout" size={18} />
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </div>
  );
}
