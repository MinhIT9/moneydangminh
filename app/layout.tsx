import type { Metadata } from 'next';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://minhfinance.vn').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Minh Finance — Sổ thu chi đơn giản mỗi ngày',
    template: '%s | Minh Finance',
  },
  description: 'Sổ thu chi cá nhân đơn giản cho học sinh, sinh viên, gia đình trẻ và người đi làm.',
  applicationName: 'Minh Finance',
  keywords: ['sổ thu chi', 'quản lý chi tiêu', 'quản lý tài chính cá nhân', 'ghi chép thu chi'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Minh Finance',
    title: 'Minh Finance — Sổ thu chi đơn giản mỗi ngày',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minh Finance — Sổ thu chi đơn giản mỗi ngày',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
