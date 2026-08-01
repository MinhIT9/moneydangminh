import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://minhfinance.vn').replace(/\/$/, '');

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ví Smart — Thu chi rõ ràng, sống nhẹ nhàng',
    template: '%s | Ví Smart',
  },
  description: 'Ví Smart giúp bạn ghi thu chi rõ ràng để sống nhẹ nhàng hơn mỗi ngày.',
  applicationName: 'Ví Smart',
  keywords: ['sổ thu chi', 'quản lý chi tiêu', 'quản lý tài chính cá nhân', 'ghi chép thu chi'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Ví Smart',
    title: 'Ví Smart — Thu chi rõ ràng, sống nhẹ nhàng',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ví Smart — Thu chi rõ ràng, sống nhẹ nhàng',
    description: 'Ghi thu chi trong vài giây, nhìn rõ thói quen tiền bạc và chủ động hơn mỗi ngày.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={beVietnamPro.variable} lang="vi" suppressHydrationWarning>
      <body className={beVietnamPro.className}>{children}</body>
    </html>
  );
}
