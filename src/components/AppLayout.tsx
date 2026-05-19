import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { CelebrationOverlay } from './CelebrationOverlay';
import { GuestBanner } from './GuestBanner';
import { MigrationPrompt } from './MigrationPrompt';
import { useAuthMode } from '../store/useAuth';

export function AppLayout() {
  const mode = useAuthMode();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />
      {mode === 'guest' && <GuestBanner />}
      <main className="flex-1 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
      <Toast />
      <CelebrationOverlay />
      <MigrationPrompt />
    </div>
  );
}
