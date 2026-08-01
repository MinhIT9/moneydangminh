'use client';

import { useRef } from 'react';
import { deleteDebtAction } from '@/actions/finance';

type DeleteDebtFormProps = {
  debtId: string;
  paymentCount: number;
};

export function DeleteDebtForm({ debtId, paymentCount }: DeleteDebtFormProps) {
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (paymentCount === 0) return;

    const accepted = window.confirm(
      `Khoản nợ này có ${paymentCount} lần thanh toán. Lịch sử thanh toán của khoản nợ sẽ bị xoá, còn các giao dịch thu/chi liên quan vẫn được giữ lại. Bạn có chắc chắn muốn tiếp tục?`,
    );
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
        Xóa khoản nợ
      </button>
    </form>
  );
}
