import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
}

/** Centred dialog with Escape / backdrop close and body scroll lock. */
export function Modal({ title, subtitle, open, onClose, children, footer, error }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {error && <p className="modal__error">{error}</p>}

        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

export default Modal;
