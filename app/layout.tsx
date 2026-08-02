import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://heoxinh.vn').replace(/\/$/, '');

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Heo Xinh — Tiết kiệm và giải trí',
    template: '%s | Heo Xinh',
  },
  description: 'Heo Xinh giúp bạn ghi thu chi rõ ràng, tiết kiệm vui hơn và giải trí mỗi ngày.',
  applicationName: 'Heo Xinh',
  keywords: ['sổ thu chi', 'quản lý chi tiêu', 'quản lý tài chính cá nhân', 'ghi chép thu chi'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Heo Xinh',
    title: 'Heo Xinh — Tiết kiệm và giải trí',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heo Xinh — Tiết kiệm và giải trí',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={beVietnamPro.variable}
      lang="vi"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={beVietnamPro.className}>{children}</body>
    </html>
  );
}
