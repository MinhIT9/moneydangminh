'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function SubmitButton({
  children,
  className = 'button',
  pendingText = 'Đang lưu…',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
