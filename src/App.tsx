import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAlbumStore } from './store/useAlbumStore';
import { applyPalette, useTheme } from './store/useTheme';
import { Home } from './pages/Home';
import { Trades } from './pages/Trades';
import { Comparar } from './pages/Comparar';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { SectionPage } from './pages/SectionPage';
import { SharePage } from './pages/SharePage';
import { SharedAlbum } from './pages/SharedAlbum';
import { CollabAlbum } from './pages/CollabAlbum';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';

export default function App() {
  const theme = useAlbumStore((s) => s.theme);
  const paletteId = useTheme((s) => s.paletteId);
  const getPalette = useTheme((s) => s.getPalette);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark =
        theme === 'dark' ||
        (theme === 'auto' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]:not([media])',
      );
      if (meta) meta.content = dark ? '#0c0a09' : '#f9f9f8';
      applyPalette(getPalette(), dark ? 'dark' : 'light');
    };
    apply();
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, paletteId, getPalette]);

  return (
    <Routes>
      <Route path="/compartido/:id" element={<SharedAlbum />} />
      <Route path="/colaborar/:id" element={<CollabAlbum />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/album" element={<Home />} />
          <Route path="/cambios" element={<Trades />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/estadisticas" element={<Stats />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/ajustes/compartir" element={<SharePage />} />
          <Route path="/seccion/:code" element={<SectionPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
