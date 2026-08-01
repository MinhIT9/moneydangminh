'use client';

import { useRef } from 'react';
import { deleteCategoryAction } from '@/actions/finance';

type DeleteCategoryFormProps = {
  categoryId: string;
  transactionCount: number;
};

export function DeleteCategoryForm({ categoryId, transactionCount }: DeleteCategoryFormProps) {
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (transactionCount === 0) return;

    const accepted = window.confirm(
      `Danh mục này đang có ${transactionCount} giao dịch. Sau khi xoá, các giao dịch đó sẽ thành “Chưa phân loại”. Bạn có chắc chắn muốn tiếp tục?`,
    );
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
        Xóa
      </button>
    </form>
  );
}
