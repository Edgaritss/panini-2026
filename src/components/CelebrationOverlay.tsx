import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion, useReducedMotion } from 'motion/react';
import { useCelebration } from '../store/useCelebration';
import { useAlbumStore } from '../store/useAlbumStore';
import { sections, TOTAL } from '../data/album';
import { AnimatedTrophy } from './AnimatedTrophy';

const PALETTE = ['#DC2626', '#15803D', '#EAB308', '#FAFAF9'];

function fireConfetti(intense: boolean) {
  const base = intense ? 200 : 100;
  confetti({
    particleCount: base,
    spread: intense ? 110 : 70,
    origin: { y: 0.6 },
    colors: PALETTE,
    shapes: ['square'],
  });
  window.setTimeout(() => {
    confetti({
      particleCount: intense ? 90 : 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: PALETTE,
      shapes: ['square'],
    });
  }, 250);
  window.setTimeout(() => {
    confetti({
      particleCount: intense ? 90 : 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: PALETTE,
      shapes: ['square'],
    });
  }, 400);
  if (intense) {
    window.setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 90,
        origin: { y: 0.4 },
        colors: PALETTE,
        shapes: ['square'],
      });
    }, 700);
    window.setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: PALETTE,
        shapes: ['square'],
      });
    }, 1100);
  }
}

export function CelebrationOverlay() {
  const active = useCelebration((s) => s.active);
  const sectionCode = useCelebration((s) => s.sectionCode);
  const isFullAlbum = useCelebration((s) => s.isFullAlbum);
  const dismiss = useCelebration((s) => s.dismiss);
  const counts = useAlbumStore((s) => s.counts);
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const section = useMemo(
    () => sections.find((s) => s.code === sectionCode) ?? null,
    [sectionCode],
  );

  const totals = useMemo(() => {
    let owned = 0;
    let completedSections = 0;
    for (const s of sections) {
      let n = 0;
      for (let i = 1; i <= s.stickerCount; i += 1) {
        if ((counts[`${s.code}${i}`] ?? 0) >= 1) n += 1;
      }
      owned += n;
      if (n === s.stickerCount) completedSections += 1;
    }
    return { owned, completedSections };
    // counts dependency suffices; using stickers length implicit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts]);

  useEffect(() => {
    if (!active || reduce) return;
    fireConfetti(isFullAlbum);
  }, [active, isFullAlbum, reduce]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, dismiss]);

  if (!active || !section) return null;

  const longName = section.name;
  const pct = Math.round((totals.owned / TOTAL) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/50 backdrop-blur-md p-4"
      onClick={dismiss}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0.2 : 0.4, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[440px] bg-surface-container-lowest border rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col items-center text-center ${
          isFullAlbum ? 'border-2 border-[#EAB308]' : 'border border-outline-variant'
        }`}
      >
        <div className="mb-4">
          <AnimatedTrophy size={isFullAlbum ? 160 : 120} />
        </div>

        <h2
          id="celebration-title"
          className="text-[28px] font-bold text-on-surface tracking-tight"
        >
          {isFullAlbum ? '¡ÁLBUM COMPLETO!' : '¡País completo!'}
        </h2>
        <p className="text-body text-on-surface-variant mt-2">
          {isFullAlbum
            ? `Has completado las ${TOTAL} estampas del Mundial 2026.`
            : `Acabas de completar las ${section.stickerCount} estampas de`}
        </p>
        {!isFullAlbum && (
          <>
            <p className="text-[32px] font-bold text-on-surface mt-2 leading-tight">
              {longName}
            </p>
            <p className="text-caps text-on-surface-variant uppercase tracking-widest mt-0.5">
              {section.code}
            </p>
          </>
        )}

        <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
          <Chip>
            Sección completa #{totals.completedSections} de {sections.length}
          </Chip>
          <Chip>{pct}% del álbum total</Chip>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-8 w-full h-12 rounded-lg bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors"
        >
          Continuar
        </button>
        {isFullAlbum ? (
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate('/estadisticas');
            }}
            className="mt-3 text-small text-on-surface-variant hover:text-secondary transition-colors"
          >
            Ver estadísticas finales →
          </button>
        ) : (
          <Link
            to="/album"
            onClick={dismiss}
            className="mt-3 text-small text-on-surface-variant hover:text-secondary transition-colors"
          >
            Ver mi álbum →
          </Link>
        )}
      </motion.div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-caps text-on-surface-variant uppercase tracking-wider bg-surface-container border border-outline-variant rounded-full px-3 py-1.5">
      {children}
    </span>
  );
}

