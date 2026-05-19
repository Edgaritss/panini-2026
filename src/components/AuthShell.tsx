import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="dark min-h-screen bg-background text-on-surface flex flex-col">
      <header className="px-margin-mobile md:px-margin-desktop py-5">
        <Link to="/" className="inline-flex items-center gap-3" aria-label="Inicio">
          <span className="w-8 h-8 bg-secondary rounded-sm" aria-hidden />
          <span className="font-semibold text-heading tracking-tight">
            Mundial '26
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-start justify-center px-margin-mobile pb-10">
        <div className="w-full max-w-md mt-6 md:mt-10">
          <div className="mb-8 text-center">
            <h1 className="text-display-l text-on-surface">{title}</h1>
            {subtitle && (
              <p className="text-body text-on-surface-variant mt-2">{subtitle}</p>
            )}
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-lg">
            {children}
          </div>
          {footer && (
            <p className="text-center text-small text-on-surface-variant mt-6">
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
