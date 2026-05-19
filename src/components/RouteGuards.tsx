import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthMode } from '../store/useAuth';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        role="status"
        aria-label="Cargando"
        className="w-8 h-8 border-2 border-on-surface-variant border-t-secondary rounded-full animate-spin"
      />
    </div>
  );
}

export function ProtectedRoute() {
  const mode = useAuthMode();
  const location = useLocation();
  if (mode === 'loading') return <Spinner />;
  if (mode === 'authed' || mode === 'guest') return <Outlet />;
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function PublicOnlyRoute() {
  const mode = useAuthMode();
  if (mode === 'loading') return <Spinner />;
  // Authed users go straight to the app. Guests can still access the landing
  // and the login/register screens — they may want to upgrade to a real account.
  if (mode === 'authed') return <Navigate to="/album" replace />;
  return <Outlet />;
}
