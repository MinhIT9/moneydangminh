import type { Metadata } from 'next';
import Link from 'next/link';
import { registerAction } from '@/actions/auth';
import { SubmitButton } from '@/components/submit-button';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Đăng ký',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const registrationSetting = await db.appSetting.findUnique({
    where: { key: 'registration_open' },
  });
  const registrationOpen = registrationSetting?.value !== 'false';

  if (!registrationOpen) {
    return (
      <>
        <h1>Đăng ký đang tạm đóng</h1>
        <p className="muted">Bạn vẫn có thể đăng nhập nếu đã có tài khoản.</p>
        <Link className="button" href="/login">
          Đi đến đăng nhập
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Tạo sổ thu chi của bạn</h1>
      <p className="muted">Chỉ mất một phút để bắt đầu ghi chép rõ ràng hơn mỗi ngày.</p>
      <form action={registerAction} className="stack">
        {error ? <p className="notice">{error}</p> : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ví dụ: 0901234567"
            pattern="0[35789][0-9]{8}"
            maxLength={10}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="passwordConfirmation">Nhập lại mật khẩu</label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <SubmitButton pendingText="Đang tạo tài khoản…">Tạo tài khoản miễn phí</SubmitButton>
      </form>
      <p className="auth-footer">
        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
