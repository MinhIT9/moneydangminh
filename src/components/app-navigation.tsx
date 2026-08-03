'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/locale-provider';

type NavigationIconName =
  'categories' | 'dashboard' | 'debts' | 'games' | 'plan' | 'settings' | 'transactions' | 'admin';

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const paths: Record<NavigationIconName, React.ReactNode> = {
    dashboard: <path d="M4 13h6V4H4Zm10 7h6V11h-6ZM4 20h6v-3H4Zm10-13h6V4h-6Z" />,
    plan: (
      <>
        <circle cx="11" cy="13" r="8" />
        <circle cx="11" cy="13" r="3" />
        <path d="m14 10 7-7M17 3h4v4" />
      </>
    ),
    transactions: (
      <>
        <path d="M4 8h15m0 0-3-3m3 3-3 3M20 16H5m0 0 3-3m-3 3 3 3" />
      </>
    ),
    categories: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    debts: (
      <>
        <path d="M5 7h14v12H5zM8 4h8v3M8 11h8M8 15h5" />
      </>
    ),
    games: (
      <>
        <path d="M8 8h8a5 5 0 0 1 4.8 6.5l-1 3a2 2 0 0 1-3.3.8L14 16h-4l-2.5 2.3a2 2 0 0 1-3.3-.8l-1-3A5 5 0 0 1 8 8Z" />
        <path d="M7 11v4M5 13h4M16 12h.01M18 14h.01" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.5 3.1h5l.5-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
      </>
    ),
    admin: (
      <>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z" />
        <path d="M9 12h6M12 9v6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function AppNavigation({
  mobile = false,
  isAdmin = false,
}: {
  mobile?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const links = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: 'dashboard' as const },
    { href: '/income-plan', label: t('nav.incomePlan'), icon: 'plan' as const },
    { href: '/transactions', label: t('nav.transactions'), icon: 'transactions' as const },
    { href: '/categories', label: t('nav.categories'), icon: 'categories' as const },
    { href: '/debts', label: t('nav.debts'), icon: 'debts' as const },
    { href: '/games', label: t('nav.games'), icon: 'games' as const },
    { href: '/settings', label: t('nav.settings'), icon: 'settings' as const },
  ];
  const adminLink = { href: '/admin', label: t('nav.admin'), icon: 'admin' as const };
  const navigationLinks = isAdmin ? [...links, adminLink] : links;

  return (
    <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label={t('nav.application')}>
      {navigationLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch
          aria-current={
            pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'page' : undefined
          }
        >
          {!mobile ? <NavigationIcon name={link.icon} /> : null}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
