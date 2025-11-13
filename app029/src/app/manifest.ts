import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '投資クイズ - 投資の基礎を学ぶ',
    short_name: '投資クイズ',
    description: '投資の基礎知識を楽しく学べるクイズアプリ。株式、債券、投資信託、リスク管理などの問題を解いて、投資の知識を身につけましょう。',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // ダークモードの背景色に合わせる
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    // より良いディスプレイモード（Android）
    display_override: ['standalone', 'minimal-ui'],
    icons: [
      // Android用 - PNG（推奨）
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      // フォールバック用 - SVG
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
    // ショートカット（ホーム画面アイコン長押しで表示）
    shortcuts: [
      {
        name: 'クイズを始める',
        short_name: 'クイズ',
        description: 'すぐにクイズを開始',
        url: '/quiz',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: '設定',
        short_name: '設定',
        description: 'アプリの設定を開く',
        url: '/settings',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ],
    // スプラッシュスクリーン用の設定（background_colorとtheme_colorで基本的なスプラッシュスクリーンが表示される）
    // より詳細なカスタマイズが必要な場合は、以下のようにapple-touch-startup-imageを追加
    // screenshots: [] // アプリストアでの表示用（オプション）
  }
}
