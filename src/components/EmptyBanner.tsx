import { Icon } from './Icon';

export function EmptyBanner() {
  return (
    <section className="bg-secondary-fixed border border-secondary/20 rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shadow-sm">
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-secondary/15 flex items-center justify-center text-on-secondary-fixed-variant shrink-0">
        <Icon name="auto_awesome" filled size={28} />
      </div>
      <div className="flex-1">
        <h2 className="text-heading text-on-secondary-fixed-variant mb-1">
          Bienvenido a tu álbum
        </h2>
        <p className="text-body text-on-secondary-fixed-variant/80 max-w-2xl">
          Pega los códigos de tus primeras estampas arriba para empezar a registrar tu
          colección. Las secciones se llenan a medida que agregas estampas nuevas o
          repetidas.
        </p>
      </div>
    </section>
  );
}
