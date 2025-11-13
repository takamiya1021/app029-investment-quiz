import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '投資クイズ - 投資の基礎を学ぶ',
    short_name: '投資クイズ',
    description: '投資の基礎知識を楽しく学べるクイズアプリ。株式、債券、投資信託、リスク管理などの問題を解いて、投資の知識を身につけましょう。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    categories: ['education', 'finance'],
    lang: 'ja',
    dir: 'ltr',
    scope: '/',
    // Screenshots are optional and can be added later
    // screenshots: []
  }
}
