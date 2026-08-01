'use client';

import { useRef } from 'react';
import { deleteUserAction } from '@/actions/admin';

export function DeleteUserForm({ userId, email }: { userId: string; email: string }) {
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    const accepted = window.confirm(
      `Xóa tài khoản ${email}? Toàn bộ dữ liệu thu chi, danh mục và khoản nợ của tài khoản này sẽ bị xóa vĩnh viễn.`,
    );
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
        Xóa
      </button>
    </form>
  );
}
