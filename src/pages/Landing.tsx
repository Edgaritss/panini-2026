import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { FloatingTiles } from '../components/landing/FloatingTiles';
import { DemoMockup } from '../components/landing/DemoMockup';
import { Icon } from '../components/Icon';
import { BrandLogo } from '../components/BrandLogo';

const heroVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

export function Landing() {
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();
  const videoRef = useRef<HTMLVideoElement>(null);

  function freezeOnEnd() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    if (Number.isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.01);
  }

  return (
    <div
      className="dark min-h-screen text-on-surface relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(1100px 600px at 20% -10%, rgba(220,38,38,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(21,128,61,0.12), transparent 55%), linear-gradient(180deg, #0c0a09 0%, #1c1917 100%)',
      }}
    >
      <FloatingTiles />

      <header className="relative z-10 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="Inicio">
          <BrandLogo size="md" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-3 sm:px-4 h-10 inline-flex items-center text-body-strong text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="px-4 h-10 inline-flex items-center rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="relative z-10 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop pt-8 md:pt-12 pb-20 md:pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-8 md:mb-10 w-[220px] sm:w-[260px] md:w-[300px] aspect-square"
        >
          {reduce ? (
            <BrandLogo size="xl" decorative className="!w-full !h-full" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-hidden
              onEnded={freezeOnEnd}
              className="w-full h-full object-contain"
            >
              <source src="/brand/logo-intro.mp4" type="video/mp4" />
            </video>
          )}
        </motion.div>
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-caps text-on-surface-variant uppercase mb-6"
        >
          FIFA World Cup · 2026
        </motion.p>
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-[56px] sm:text-[72px] md:text-[88px] leading-[0.95] font-bold tracking-[-0.04em]"
        >
          Tu álbum,
          <br />
          completo
          <motion.span
            animate={reduce ? undefined : { opacity: [1, 0, 1, 0, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.8, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
            className="text-secondary"
          >
            .
          </motion.span>
        </motion.h1>
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-body sm:text-[18px] md:text-[20px] text-on-surface-variant max-w-2xl mx-auto mt-6"
        >
          Lleva el control de tus 980 estampas Panini desde cualquier dispositivo.
          Marca lo que tienes, identifica lo que te falta, organiza tus intercambios.
        </motion.p>
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/registro"
            className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors shadow-lg shadow-secondary/20"
          >
            Empezar ahora <Icon name="arrow_forward" size={20} />
          </Link>
          <Link
            to="/login"
            className="h-12 px-6 inline-flex items-center justify-center rounded-full border border-on-surface/30 text-on-surface text-body-strong hover:bg-on-surface/5 transition-colors"
          >
            Iniciar sesión
          </Link>
        </motion.div>
        <motion.p
          custom={4}
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-small text-on-surface-variant mt-12 flex items-center justify-center gap-3 flex-wrap"
        >
          <span>980 estampas</span>
          <span className="opacity-40">·</span>
          <span>49 selecciones</span>
          <span className="opacity-40">·</span>
          <span>12 grupos</span>
        </motion.p>
      </section>

      <section className="relative z-10 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-caps text-secondary uppercase mb-4">Panorama</p>
          <h2 className="text-[36px] md:text-[48px] leading-[1.05] font-bold tracking-[-0.03em]">
            Visualiza tu progreso
          </h2>
          <p className="text-body md:text-[17px] text-on-surface-variant mt-4 max-w-md">
            Una vista clara de las 49 selecciones del Mundial. Marca con un tap,
            registra repetidas, filtra por estado. Tu álbum, ordenado.
          </p>
        </motion.div>
        <DemoMockup />
      </section>

      <section className="relative z-10 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-20 md:py-28">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-[32px] md:text-[40px] font-bold tracking-[-0.03em] text-center mb-12"
        >
          Diseñado para coleccionistas
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Feature
            icon="cloud_sync"
            title="Sincronización en tiempo real"
            body="Tu progreso te sigue. Marca una estampa en el celular en el camino y revísala en la computadora al llegar."
            delay={0}
          />
          <Feature
            icon="swap_horiz"
            title="Intercambios sin enredos"
            body="Exporta listas de faltantes y repetidas en Excel o cópialas como texto para mandar por WhatsApp."
            delay={0.1}
          />
          <Feature
            icon="bar_chart"
            title="Estadísticas y avance"
            body="Mira qué selección llevas más completa, qué estampa te sale repetida más veces, tu porcentaje total."
            delay={0.2}
          />
        </div>
      </section>

      <section className="relative z-10 max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-[40px] md:text-[56px] font-bold tracking-[-0.04em] leading-[1.05]">
            ¿Listo para empezar?
          </h2>
          <p className="text-body md:text-[18px] text-on-surface-variant mt-4 max-w-lg mx-auto">
            Crea tu cuenta gratis y arranca con tu álbum.
          </p>
          <Link
            to="/registro"
            className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors shadow-lg shadow-secondary/20"
          >
            Crear mi cuenta <Icon name="arrow_forward" size={20} />
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-outline-variant/40 py-10">
        <p className="text-small text-on-surface-variant/70 text-center max-w-xl mx-auto px-margin-mobile">
          Hecho con amor para el Mundial 2026. Proyecto personal, no afiliado a Panini
          ni a la FIFA. © {year}
        </p>
      </footer>
    </div>
  );
}

interface FeatureProps {
  icon: string;
  title: string;
  body: string;
  delay: number;
}

function Feature({ icon, title, body, delay }: FeatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="bg-surface-container-lowest/60 border border-outline-variant rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="w-12 h-12 rounded-lg bg-secondary/15 text-secondary inline-flex items-center justify-center mb-4">
        <Icon name={icon} filled size={26} />
      </div>
      <h3 className="text-heading text-on-surface">{title}</h3>
      <p className="text-body text-on-surface-variant mt-2">{body}</p>
    </motion.div>
  );
}
