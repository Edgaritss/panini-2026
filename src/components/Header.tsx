import { useAlbumStore } from '../store/useAlbumStore';
import { QuickAddBar } from './QuickAddBar';
import { ThemeToggle } from './ThemeToggle';
import type { View } from '../types';

const tabs: { id: View; label: string }[] = [
  { id: 'home', label: 'Álbum' },
  { id: 'trades', label: 'Intercambios' },
  { id: 'settings', label: 'Ajustes' },
];

export function Header() {
  const view = useAlbumStore((s) => s.view);
  const setView = useAlbumStore((s) => s.setView);

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Panini <span className="text-accent">·</span> Mundial 2026
          </h1>
          <ThemeToggle />
        </div>
        <QuickAddBar />
        <nav className="flex gap-1 mt-3" role="tablist" aria-label="Vistas">
          {tabs.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.id)}
                className={`min-h-[40px] px-4 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-fg text-bg'
                    : 'bg-surface text-fg hover:bg-border/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
