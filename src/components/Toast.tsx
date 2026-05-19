import { useEffect } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { Icon } from './Icon';

export function Toast() {
  const notice = useAlbumStore((s) => s.notice);
  const dismiss = useAlbumStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(dismiss, 4000);
    return () => window.clearTimeout(t);
  }, [notice, dismiss]);

  if (!notice) return null;

  const isError = notice.added === 0 && notice.invalid > 0;
  const headline = isError
    ? `${notice.invalid} ${notice.invalid === 1 ? 'código inválido' : 'códigos inválidos'}`
    : `${notice.added} ${notice.added === 1 ? 'estampa agregada' : 'estampas agregadas'}`;
  const detail = notice.ids.length > 0 ? notice.ids.join(' · ') : 'Revisa el formato (ej. MEX1).';

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-anim fixed top-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] bg-secondary-fixed border border-secondary/30 border-l-4 border-l-secondary rounded-lg shadow-lg p-4 flex items-start gap-3"
    >
      <Icon
        name={isError ? 'error' : 'check_circle'}
        filled
        className="text-secondary mt-0.5"
        size={20}
      />
      <div className="flex-1 min-w-0">
        <p className="font-body-strong text-body-strong text-on-secondary-fixed-variant">
          {headline}
        </p>
        <p className="font-small text-small text-on-secondary-fixed-variant/80 mt-0.5 truncate">
          {detail}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-on-secondary-fixed-variant hover:opacity-80 transition-opacity shrink-0"
        aria-label="Cerrar"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
