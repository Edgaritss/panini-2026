import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { sections, stickersBySection } from '../data/album';
import { Icon } from './Icon';

interface Props {
  ownerOwned: Record<string, number>;
  ownerLabel: string;
  viewerCounts: Record<string, number>;
  onClose: () => void;
}

interface Pair {
  code: string;
  name: string;
  group: string | null;
  items: { id: string; label: string; ownerHas: number; viewerHas: number }[];
}

function isEmpty(counts: Record<string, number>): boolean {
  return Object.keys(counts).length === 0;
}

export function SharedCompareModal({
  ownerOwned,
  ownerLabel,
  viewerCounts,
  onClose,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const empty = isEmpty(viewerCounts);

  const { iCanGive, heCanGive } = useMemo(() => {
    const i: Pair[] = [];
    const h: Pair[] = [];
    for (const section of sections) {
      const all = stickersBySection.get(section.code) ?? [];
      const iItems: Pair['items'] = [];
      const hItems: Pair['items'] = [];
      for (const st of all) {
        const owner = ownerOwned[st.id] ?? 0;
        const me = viewerCounts[st.id] ?? 0;
        if (me > 1 && owner < 1) {
          iItems.push({ id: st.id, label: st.id, ownerHas: owner, viewerHas: me });
        }
        if (owner > 1 && me < 1) {
          hItems.push({ id: st.id, label: st.id, ownerHas: owner, viewerHas: me });
        }
      }
      if (iItems.length > 0) {
        i.push({ code: section.code, name: section.name, group: section.group, items: iItems });
      }
      if (hItems.length > 0) {
        h.push({ code: section.code, name: section.name, group: section.group, items: hItems });
      }
    }
    return { iCanGive: i, heCanGive: h };
  }, [ownerOwned, viewerCounts]);

  const iCount = iCanGive.reduce((a, b) => a + b.items.length, 0);
  const hCount = heCanGive.reduce((a, b) => a + b.items.length, 0);
  const perfectMatch = iCount > 0 && hCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-on-surface/40 backdrop-blur-sm p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 md:px-6 py-4 border-b border-outline-variant flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-heading text-on-surface">Comparar con mi álbum</h2>
            <p className="text-small text-on-surface-variant mt-0.5">
              Match para intercambio con <strong>{ownerLabel}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {empty ? (
            <div className="text-center py-10">
              <Icon
                name="auto_awesome"
                filled
                size={36}
                className="text-secondary mb-3"
              />
              <h3 className="text-heading text-on-surface">
                Empieza tu álbum para ver matches
              </h3>
              <p className="text-body text-on-surface-variant mt-2 max-w-md mx-auto">
                Cuando registres tus propias estampas vas a poder comparar tu
                colección contra la de {ownerLabel} y descubrir qué pueden
                intercambiarse.
              </p>
              <Link
                to="/registro"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors"
              >
                Crear cuenta gratis <Icon name="arrow_forward" size={18} />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {perfectMatch && (
                <div className="rounded-lg border border-[#15803D]/40 bg-[#15803D]/10 dark:bg-[#22c55e]/10 px-4 py-3 flex items-start gap-3">
                  <Icon
                    name="swap_horiz"
                    size={20}
                    className="text-[#15803D] dark:text-[#22c55e] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-body-strong text-on-surface">
                      ¡Pueden intercambiar!
                    </p>
                    <p className="text-small text-on-surface-variant mt-0.5">
                      Tienes {iCount} que le puedes regalar y él tiene {hCount} que
                      te puede regalar. Hagan trato.
                    </p>
                  </div>
                </div>
              )}

              <Bucket
                title="Le puedes regalar"
                subtitle={`Repetidas tuyas que a ${ownerLabel} le faltan`}
                count={iCount}
                emptyText="Ninguna de tus repetidas le falta."
                tone="green"
                buckets={iCanGive}
              />

              <Bucket
                title="Te puede regalar"
                subtitle={`Repetidas de ${ownerLabel} que te faltan a ti`}
                count={hCount}
                emptyText="No tiene repetidas que tú necesites."
                tone="amber"
                buckets={heCanGive}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface BucketProps {
  title: string;
  subtitle: string;
  count: number;
  emptyText: string;
  tone: 'green' | 'amber';
  buckets: Pair[];
}

function Bucket({ title, subtitle, count, emptyText, tone, buckets }: BucketProps) {
  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-body-strong text-on-surface">{title}</h3>
          <p className="text-small text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="text-caps uppercase tracking-wider text-on-surface-variant">
          {count}
        </span>
      </header>
      {count === 0 ? (
        <p className="text-body text-on-surface-variant py-4">{emptyText}</p>
      ) : (
        <ul className="space-y-4">
          {buckets.map((b) => (
            <li key={b.code}>
              <p className="text-small text-on-surface mb-1.5">
                <span className="font-mono">{b.code}</span>
                {b.code !== 'FWC' && (
                  <span className="text-on-surface-variant ml-2">{b.name}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {b.items.map((i) => (
                  <span
                    key={i.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-mono-code border ${
                      tone === 'green'
                        ? 'bg-[#D1FAE5] dark:bg-[#22c55e]/10 border-[#15803D]/40 text-[#065F46] dark:text-[#A7F3D0]'
                        : 'bg-[#FEF3C7] dark:bg-[#451A03]/60 border-[#FCD34D] dark:border-[#F59E0B]/40 text-[#92400E] dark:text-[#FCD34D]'
                    }`}
                  >
                    {i.label}
                    {tone === 'green' && i.viewerHas > 1 && (
                      <span className="text-small opacity-80">×{i.viewerHas - 1}</span>
                    )}
                    {tone === 'amber' && i.ownerHas > 1 && (
                      <span className="text-small opacity-80">×{i.ownerHas - 1}</span>
                    )}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
