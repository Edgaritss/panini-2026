import { useEffect } from 'react';
import { useAlbumStore } from './store/useAlbumStore';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Trades } from './pages/Trades';
import { Settings } from './pages/Settings';

export default function App() {
  const view = useAlbumStore((s) => s.view);
  const theme = useAlbumStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-4 pb-24">
        {view === 'home' && <Home />}
        {view === 'trades' && <Trades />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  );
}
