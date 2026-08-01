'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Tổng quan', icon: '◔' },
  { href: '/transactions', label: 'Giao dịch', icon: '↔' },
  { href: '/categories', label: 'Danh mục', icon: '▦' },
  { href: '/debts', label: 'Khoản nợ', icon: '◫' },
  { href: '/settings', label: 'Cài đặt', icon: '⚙' },
];

const adminLink = { href: '/admin', label: 'Quản trị', icon: '◈' };

export function AppNavigation({
  mobile = false,
  isAdmin = false,
}: {
  mobile?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navigationLinks = isAdmin ? [...links, adminLink] : links;

  return (
    <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label="Điều hướng ứng dụng">
      {navigationLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
        >
          {!mobile ? <span aria-hidden="true">{link.icon}</span> : null}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
