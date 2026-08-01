'use client';

import { useRef } from 'react';
import { deleteTransactionAction } from '@/actions/finance';

type DeleteTransactionFormProps = {
  transactionId: string;
  isDebtPayment: boolean;
};

export function DeleteTransactionForm({
  transactionId,
  isDebtPayment,
}: DeleteTransactionFormProps) {
  const confirmationInput = useRef<HTMLInputElement>(null);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (!isDebtPayment) return;

    const accepted = window.confirm(
      'Đây là giao dịch tạo từ một lần thanh toán nợ. Xóa nó sẽ khôi phục số còn lại của khoản nợ. Bạn có chắc chắn muốn tiếp tục?',
    );
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
      <button className="icon-button" type="submit" aria-label="Xóa giao dịch">
        ⌫
      </button>
    </form>
  );
}
