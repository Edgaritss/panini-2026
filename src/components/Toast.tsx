import { useEffect } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { Icon } from './Icon';

type Tone = 'success' | 'mixed' | 'error';

const STYLES: Record<
  Tone,
  {
    container: string;
    icon: string;
    iconName: string;
    text: string;
  }
> = {
  success: {
    container:
      'bg-[#D1FAE5] dark:bg-[#022C22] border-[#15803D]/30 dark:border-[#22c55e]/40 border-l-4 border-l-[#15803D] dark:border-l-[#22c55e]',
    icon: 'text-[#15803D] dark:text-[#22c55e]',
    iconName: 'check_circle',
    text: 'text-[#065F46] dark:text-[#A7F3D0]',
  },
  mixed: {
    container:
      'bg-[#FEF3C7] dark:bg-[#451A03] border-[#F59E0B]/40 border-l-4 border-l-[#F59E0B]',
    icon: 'text-[#B45309] dark:text-[#FCD34D]',
    iconName: 'info',
    text: 'text-[#92400E] dark:text-[#FCD34D]',
  },
  error: {
    container:
      'bg-secondary-fixed border-secondary/30 border-l-4 border-l-secondary',
    icon: 'text-secondary',
    iconName: 'error',
    text: 'text-on-secondary-fixed-variant',
  },
};

export function Toast() {
  const notice = useAlbumStore((s) => s.notice);
  const dismiss = useAlbumStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(dismiss, 4000);
    return () => window.clearTimeout(t);
  }, [notice, dismiss]);

  if (!notice) return null;

  const tone: Tone =
    notice.added === 0 && notice.invalid > 0
      ? 'error'
      : notice.invalid > 0
        ? 'mixed'
        : 'success';
  const s = STYLES[tone];

  const addedLabel =
    notice.added === 1 ? 'estampa agregada' : 'estampas agregadas';
  const invalidLabel =
    notice.invalid === 1 ? 'código inválido' : 'códigos inválidos';

  let headline: string;
  if (tone === 'error') {
    headline = `${notice.invalid} ${invalidLabel}`;
  } else if (tone === 'mixed') {
    headline = `${notice.added} ${addedLabel} · ${notice.invalid} ${invalidLabel}`;
  } else {
    headline = `${notice.added} ${addedLabel}`;
  }

  const detail =
    notice.ids.length > 0
      ? notice.ids.join(' · ')
      : 'Revisa el formato (ej. MEX1).';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-anim fixed top-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg shadow-lg p-4 flex items-start gap-3 border ${s.container}`}
    >
      <Icon name={s.iconName} filled className={`${s.icon} mt-0.5`} size={20} />
      <div className="flex-1 min-w-0">
        <p className={`font-body-strong text-body-strong ${s.text}`}>
          {headline}
        </p>
        <p className={`font-small text-small ${s.text} opacity-80 mt-0.5 truncate`}>
          {detail}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={`${s.text} hover:opacity-80 transition-opacity shrink-0`}
        aria-label="Cerrar"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
