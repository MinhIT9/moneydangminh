'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/locale-provider';

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
    { href: '/dashboard', label: t('nav.dashboard'), icon: '◔' },
    { href: '/transactions', label: t('nav.transactions'), icon: '↔' },
    { href: '/categories', label: t('nav.categories'), icon: '▦' },
    { href: '/debts', label: t('nav.debts'), icon: '◫' },
    { href: '/settings', label: t('nav.settings'), icon: '⚙' },
  ];
  const adminLink = { href: '/admin', label: t('nav.admin'), icon: '◈' };
  const navigationLinks = isAdmin ? [...links, adminLink] : links;

  return (
    <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label={t('nav.application')}>
      {navigationLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch
          aria-current={pathname === link.href ? 'page' : undefined}
        >
          {!mobile ? <span aria-hidden="true">{link.icon}</span> : null}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
