import type { Metadata } from 'next';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';
import { SubmitButton } from '@/components/submit-button';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1>Chào mừng trở lại</h1>
      <p className="muted">Đăng nhập để tiếp tục quản lý thu chi của bạn.</p>
      <form action={loginAction} className="stack">
        {error ? <p className="notice">{error}</p> : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton pendingText="Đang đăng nhập…">Đăng nhập</SubmitButton>
      </form>
      <p className="auth-footer">
        Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link>
      </p>
    </>
  );
}
