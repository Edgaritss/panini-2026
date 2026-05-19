import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/useAuth';

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
  const status = useAuth((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (status === 'disabled') {
    // Sin Supabase configurado: dejamos pasar para que la app no quede inservible
    // en desarrollo sin .env.local.
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const status = useAuth((s) => s.status);
  if (status === 'loading') return <Spinner />;
  if (status === 'authenticated') return <Navigate to="/album" replace />;
  return <Outlet />;
}
