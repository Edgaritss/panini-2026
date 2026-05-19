import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAlbumStore } from './store/useAlbumStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { Trades } from './pages/Trades';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { SectionPage } from './pages/SectionPage';

export default function App() {
  const theme = useAlbumStore((s) => s.theme);

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
    };
    apply();
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />
      <main className="flex-1 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cambios" element={<Trades />} />
          <Route path="/estadisticas" element={<Stats />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/seccion/:code" element={<SectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
