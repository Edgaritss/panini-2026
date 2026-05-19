import { Link, NavLink } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { Icon } from './Icon';
import { SyncIndicator } from './SyncIndicator';
import { UserMenu } from './UserMenu';
import { BrandLogo } from './BrandLogo';

const tabs = [
  { to: '/album', label: 'Álbum', end: true },
  { to: '/cambios', label: 'Cambios', end: false },
  { to: '/estadisticas', label: 'Estadísticas', end: false },
  { to: '/ajustes', label: 'Ajustes', end: false },
];

export function Header() {
  const theme = useAlbumStore((s) => s.theme);
  const setTheme = useAlbumStore((s) => s.setTheme);

  const effective: 'light' | 'dark' =
    theme === 'auto'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link
            to="/album"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Ir al álbum"
          >
            <BrandLogo size="md" />
          </Link>

          <nav
            className="hidden lg:flex items-center gap-6 h-full"
            aria-label="Vistas"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `relative h-16 flex items-center px-1 text-body-strong transition-colors ${
                    isActive
                      ? 'text-on-surface'
                      : 'text-on-surface-variant hover:text-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {tab.label}
                    {isActive && (
                      <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-secondary" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <SyncIndicator />
            <button
              type="button"
              onClick={() => setTheme(effective === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors"
              aria-label={`Cambiar a tema ${effective === 'dark' ? 'claro' : 'oscuro'}`}
              title={`Cambiar a tema ${effective === 'dark' ? 'claro' : 'oscuro'}`}
            >
              <Icon name={effective === 'dark' ? 'light_mode' : 'dark_mode'} />
            </button>
            <UserMenu />
          </div>
        </div>

        <nav
          className="lg:hidden flex gap-5 overflow-x-auto -mt-1 pb-1"
          aria-label="Vistas"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `relative pb-2 whitespace-nowrap text-body-strong transition-colors ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-secondary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
