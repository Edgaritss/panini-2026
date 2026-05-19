import { useEffect } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';

export function ThemeToggle() {
  const theme = useAlbumStore((s) => s.theme);
  const toggle = useAlbumStore((s) => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([media])',
    );
    if (meta) meta.content = theme === 'dark' ? '#0A0A0A' : '#FAFAFA';
  }, [theme]);

  const next = theme === 'light' ? 'oscuro' : 'claro';

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-surface border border-border hover:bg-bg transition-colors"
      aria-label={`Cambiar a tema ${next}`}
      title={`Cambiar a tema ${next}`}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36 10.14 10.14 0 1 0 22 14.05a1 1 0 0 0-.36-1.05z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM3 11h2a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2zm16 0h2a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2zM5.64 4.22l1.41 1.41a1 1 0 1 1-1.41 1.41L4.22 5.64a1 1 0 0 1 1.42-1.42zm12.73 12.73 1.41 1.41a1 1 0 1 1-1.41 1.41l-1.41-1.41a1 1 0 1 1 1.41-1.41zM4.22 18.36l1.42-1.41a1 1 0 1 1 1.41 1.41l-1.41 1.41a1 1 0 0 1-1.42-1.41zm12.73-12.73 1.41-1.41a1 1 0 1 1 1.42 1.42l-1.41 1.41a1 1 0 1 1-1.42-1.42z" />
        </svg>
      )}
    </button>
  );
}
