import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "投資クイズ - 投資の基礎を学ぶ",
  description: "投資の基礎知識を楽しく学べるクイズアプリ。株式、債券、投資信託、リスク管理などの問題を解いて、投資の知識を身につけましょう。",
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
