'use client';

import { useFormStatus } from 'react-dom';
import { useLocale } from '@/i18n/locale-provider';

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function SubmitButton({ children, className = 'button', pendingText }: SubmitButtonProps) {
  const { t } = useLocale();
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? (pendingText ?? t('common.saving')) : children}
    </button>
  );
}
