import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

const SS_KEY = 'panini-2026:splash_shown';
const SAFETY_MS = 6000;
const REDUCED_HOLD_MS = 700;

export function shouldShowSplash(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SS_KEY) !== '1';
}

export function clearSplashShown(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SS_KEY);
}

function markSplashShown(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SS_KEY, '1');
}

interface Props {
  onDone: () => void;
}

export function LogoSplash({ onDone }: Props) {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  function finish() {
    markSplashShown();
    setVisible(false);
  }

  useEffect(() => {
    if (reduce) {
      const t = window.setTimeout(finish, REDUCED_HOLD_MS);
      return () => window.clearTimeout(t);
    }
    const safety = window.setTimeout(finish, SAFETY_MS);
    return () => window.clearTimeout(safety);
  }, [reduce]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Bienvenida"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={finish}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0C0A09] cursor-pointer"
        >
          {reduce ? (
            <BrandLogo size="xl" decorative />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-hidden
              onEnded={finish}
              className="w-[min(80vw,480px)] aspect-square object-contain"
            >
              <source src="/brand/logo-intro.mp4" type="video/mp4" />
              <BrandLogo size="xl" decorative />
            </video>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            aria-label="Saltar introducción"
            className="absolute bottom-6 right-6 text-small text-white/50 hover:text-white/80 transition-colors"
          >
            Saltar →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
