import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: { name: string; tone: 'danger' };
  actions: ReactNode;
}

export function Modal({ open, onClose, title, description, icon, actions }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-anim w-full max-w-[440px] bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  icon.tone === 'danger'
                    ? 'bg-error-container text-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <Icon name={icon.name} filled size={28} />
              </div>
            )}
            <h2
              id="modal-title"
              className="text-heading text-on-surface pt-1"
            >
              {title}
            </h2>
          </div>
          {description && (
            <div className={icon ? 'pl-16' : ''}>
              <p className="text-body text-on-surface-variant">{description}</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
}
