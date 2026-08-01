'use client';

import { useRef } from 'react';
import { deleteTransactionAction } from '@/actions/finance';
import { useLocale } from '@/i18n/locale-provider';

type DeleteTransactionFormProps = {
  transactionId: string;
  isDebtPayment: boolean;
};

export function DeleteTransactionForm({
  transactionId,
  isDebtPayment,
}: DeleteTransactionFormProps) {
  const { t } = useLocale();
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (!isDebtPayment) return;

    const accepted = window.confirm(t('transaction.deleteDebtPaymentConfirm'));
    if (!accepted) {
      event.preventDefault();
      return;
    }

    if (confirmationInput.current) confirmationInput.current.value = 'true';
  }

  return (
    <form action={deleteTransactionAction} className="inline-form" onSubmit={confirmDeletion}>
      <input type="hidden" name="id" value={transactionId} />
      <input ref={confirmationInput} type="hidden" name="confirm" value="false" />
      <button className="icon-button" type="submit" aria-label={t('transaction.delete')}>
        ⌫
      </button>
    </form>
  );
}
