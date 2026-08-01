'use client';

import { useRef } from 'react';
import { deleteUserAction } from '@/actions/admin';
import { useLocale } from '@/i18n/locale-provider';

export function DeleteUserForm({ userId, email }: { userId: string; email: string }) {
  const { t } = useLocale();
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    const accepted = window.confirm(t('admin.deleteUserConfirm', { email }));
    if (!accepted) {
      event.preventDefault();
      return;
    }

    if (confirmationInput.current) confirmationInput.current.value = 'true';
  }

  return (
    <form action={deleteUserAction} className="inline-form" onSubmit={confirmDeletion}>
      <input type="hidden" name="id" value={userId} />
      <input ref={confirmationInput} type="hidden" name="confirm" value="false" />
      <button className="button-danger" type="submit">
        {t('common.delete')}
      </button>
    </form>
  );
}
