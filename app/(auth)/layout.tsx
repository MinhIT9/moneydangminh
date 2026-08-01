import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          Minh Finance
        </Link>
        {children}
      </section>
    </main>
  );
}
