'use client';

import { useRef } from 'react';
import { deleteCategoryAction } from '@/actions/finance';
import { useLocale } from '@/i18n/locale-provider';

type DeleteCategoryFormProps = {
  categoryId: string;
  transactionCount: number;
};

export function DeleteCategoryForm({ categoryId, transactionCount }: DeleteCategoryFormProps) {
  const { t } = useLocale();
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (transactionCount === 0) return;

    const accepted = window.confirm(t('category.deleteConfirm', { count: transactionCount }));
    if (!accepted) {
      event.preventDefault();
      return;
    }

    if (confirmationInput.current) confirmationInput.current.value = 'true';
  }

  return (
    <form action={deleteCategoryAction} onSubmit={confirmDeletion}>
      <input type="hidden" name="id" value={categoryId} />
      <input ref={confirmationInput} type="hidden" name="confirm" value="false" />
      <button className="button-danger" type="submit">
        {t('common.delete')}
      </button>
    </form>
  );
}
