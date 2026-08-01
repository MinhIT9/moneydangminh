'use client';

import { useRef } from 'react';
import { deleteDebtAction } from '@/actions/finance';
import { useLocale } from '@/i18n/locale-provider';

type DeleteDebtFormProps = {
  debtId: string;
  paymentCount: number;
};

export function DeleteDebtForm({ debtId, paymentCount }: DeleteDebtFormProps) {
  const { t } = useLocale();
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (paymentCount === 0) return;

    const accepted = window.confirm(t('debt.deleteConfirm', { count: paymentCount }));
    if (!accepted) {
      event.preventDefault();
      return;
    }

    if (confirmationInput.current) confirmationInput.current.value = 'true';
  }

  return (
    <form action={deleteDebtAction} className="form-actions" onSubmit={confirmDeletion}>
      <input type="hidden" name="id" value={debtId} />
      <input ref={confirmationInput} type="hidden" name="confirm" value="false" />
      <button className="button-danger" type="submit">
        {t('debt.delete')}
      </button>
    </form>
  );
}
