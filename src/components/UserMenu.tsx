import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { Icon } from './Icon';

export function UserMenu() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
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

  if (!user) return null;

  const initial = (user.email ?? '?').charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
        className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-secondary text-on-secondary font-semibold hover:bg-secondary-container transition-colors"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 min-w-[220px] bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl p-1"
        >
          <div className="px-3 py-2 border-b border-outline-variant">
            <p className="text-caps text-on-surface-variant uppercase">
              Sesión
            </p>
            <p className="text-small text-on-surface truncate" title={user.email ?? ''}>
              {user.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-body text-on-surface hover:bg-surface-container transition-colors"
          >
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
