'use client';

import { useEffect, useId, useRef } from 'react';
import { useLocale } from '@/i18n/locale-provider';

type DebtModalProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  children: React.ReactNode;
};

export function DebtModal({
  title,
  description,
  triggerLabel,
  triggerClassName = 'button-ghost',
  children,
}: DebtModalProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      if (dialog?.open) dialog.close();
      document.body.classList.remove('debt-modal-open');
    };
  }, []);

  function openModal() {
    const dialog = dialogRef.current;
    if (!dialog) return;

    document.body.classList.add('debt-modal-open');
    dialog.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button className={triggerClassName} type="button" aria-haspopup="dialog" onClick={openModal}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="debt-modal"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClose={() => document.body.classList.remove('debt-modal-open')}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className="debt-modal__panel">
          <header className="debt-modal__header">
            <div>
              <h2 id={titleId}>{title}</h2>
              {description ? <p id={descriptionId}>{description}</p> : null}
            </div>
            <button
              className="debt-modal__close"
              type="button"
              aria-label={t('common.close')}
              onClick={closeModal}
            >
              ×
            </button>
          </header>
          <div className="debt-modal__body">{children}</div>
        </div>
      </dialog>
    </>
  );
}
