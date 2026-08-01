import Link from 'next/link';
import type { Metadata } from 'next';
import { logoutAction } from '@/actions/auth';
import { AppNavigation } from '@/components/app-navigation';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">M</span>
          Minh Finance
        </Link>
        <AppNavigation isAdmin={user.role === 'ADMIN'} />
        <div className="sidebar-bottom">
          <span className="user-email">{user.email}</span>
          <form action={logoutAction}>
            <button className="logout-button" type="submit">
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <div>
        <header className="mobile-header">
          <Link className="brand" href="/dashboard">
            <span className="brand-mark">M</span>
            Minh
          </Link>
          <AppNavigation mobile isAdmin={user.role === 'ADMIN'} />
          <form action={logoutAction}>
            <button className="mobile-logout" type="submit" aria-label="Đăng xuất">
              ↪
            </button>
          </form>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
