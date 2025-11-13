import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  title: "投資クイズ - 投資の基礎を学ぶ",
  description: "投資の基礎知識を楽しく学べるクイズアプリ。株式、債券、投資信託、リスク管理などの問題を解いて、投資の知識を身につけましょう。",
  applicationName: "投資クイズ",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "投資クイズ",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "投資クイズ",
    title: "投資クイズ - 投資の基礎を学ぶ",
    description: "投資の基礎知識を楽しく学べるクイズアプリ",
  },
  twitter: {
    card: "summary",
    title: "投資クイズ - 投資の基礎を学ぶ",
    description: "投資の基礎知識を楽しく学べるクイズアプリ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
