import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { CelebrationOverlay } from './CelebrationOverlay';
import { LogoSplash, shouldShowSplash } from './LogoSplash';

export function AppLayout() {
  const [splashOpen, setSplashOpen] = useState<boolean>(() => shouldShowSplash());

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />
      <main className="flex-1 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
      <Toast />
      <CelebrationOverlay />
      {splashOpen && <LogoSplash onDone={() => setSplashOpen(false)} />}
    </div>
  );
}
