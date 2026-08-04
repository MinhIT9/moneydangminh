'use client';

import { useState } from 'react';

type AuthFieldIcon = 'email' | 'lock' | 'phone';

type AuthFormFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  icon: AuthFieldIcon;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

function FieldIcon({ name }: { name: AuthFieldIcon }) {
  if (name === 'email') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m5 8 7 5 7-5" />
      </svg>
    );
  }

  if (name === 'phone') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8.2 3.5 10 7.8 7.7 9.3a15 15 0 0 0 7 7l1.5-2.3 4.3 1.8-.4 3.4a2 2 0 0 1-2 1.8C10 20.5 3.5 14 3 5.9a2 2 0 0 1 1.8-2Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
      {hidden ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

export function AuthFormField({
  label,
  icon,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  type = 'text',
  ...inputProps
}: AuthFormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && isPasswordVisible ? 'text' : type;

  return (
    <div className="hx-auth-field">
      <label htmlFor={inputProps.id}>{label}</label>
      <div className="hx-auth-field__control">
        <span className="hx-auth-field__icon">
          <FieldIcon name={icon} />
        </span>
        <input {...inputProps} type={resolvedType} />
        {isPassword ? (
          <button
            type="button"
            className="hx-auth-field__toggle"
            aria-label={isPasswordVisible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            <EyeIcon hidden={isPasswordVisible} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
