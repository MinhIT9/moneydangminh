import Link from 'next/link';
import type { Metadata } from 'next';
import { logoutAction } from '@/actions/auth';
import { AppNavigation } from '@/components/app-navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LocaleProvider } from '@/i18n/locale-provider';
import { requireUser } from '@/lib/auth';
import { getTranslations } from '@/i18n/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const { locale, t } = await getTranslations();

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/dashboard">
            <span className="brand-mark">V</span>
            {t('brand.name')}
          </Link>
          <AppNavigation isAdmin={user.role === 'ADMIN'} />
          <div className="sidebar-bottom">
            <span className="user-email">{user.email}</span>
            <LanguageSwitcher className="sidebar-language" />
            <form action={logoutAction}>
              <button className="logout-button" type="submit">
                {t('auth.logout')}
              </button>
            </form>
          </div>
        </aside>
        <div>
          <header className="mobile-header">
            <Link className="brand" href="/dashboard">
              <span className="brand-mark">V</span>
              {t('brand.name')}
            </Link>
            <AppNavigation mobile isAdmin={user.role === 'ADMIN'} />
            <LanguageSwitcher compact className="mobile-language" />
            <form action={logoutAction}>
              <button className="mobile-logout" type="submit" aria-label={t('auth.logout')}>
                ↪
              </button>
            </form>
          </header>
          <main className="app-main">{children}</main>
        </div>
      </div>
    </LocaleProvider>
  );
}
