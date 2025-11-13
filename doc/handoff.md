# 引継ぎ文書 - 投資クイズアプリ実装継続

## 📋 現状サマリー

### 実装完了状況
- ✅ **Phase 0-10**: 完了（基本機能、統計、復習モード、AI機能、E2Eテスト、デプロイ準備）
- ✅ **Phase 11**: 完了（APIキー設定UI実装）
- ⏳ **Phase 12**: 未着手（PWA対応実装）

### テスト状況
- **全105テストパス**
- カバレッジ: 87.12%以上
- ESLint/TypeScriptエラー: 0件

### サーバー状態
- **開発サーバー**: ポート3029番で起動中
- アクセス: `http://[WSL_IP]:3029`

---

## 🎯 次に実装すべき内容：Phase 12 PWA対応

### Phase 12の5タスク（予定工数: 3時間）

#### 【 】12-1. manifest.json作成（30分）
**場所**: `app029/public/manifest.json`

**内容**:
```json
{
  "name": "投資クイズアプリ",
  "short_name": "投資クイズ",
  "description": "投資の基礎知識を学べるクイズアプリ",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#0f172a",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 【 】12-2. next-pwa設定（1時間）
**手順**:
1. パッケージインストール
   ```bash
   cd app029
   npm install next-pwa
   ```

2. `next.config.ts`修正
   ```typescript
   import withPWA from 'next-pwa';

   const pwaConfig = withPWA({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
     register: true,
     skipWaiting: true,
   });

   export default pwaConfig({
     // 既存のNext.js設定
   });
   ```

3. `.gitignore`に追加
   ```
   # PWA
   public/sw.js
   public/workbox-*.js
   public/worker-*.js
   public/fallback-*.js
   ```

#### 【 】12-3. アイコン作成・配置（30分）
**必要なアイコン**:
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/favicon.ico`
- `public/apple-touch-icon.png`

**アイコンデザイン案**:
- 背景色: 緑系（#10b981）
- モチーフ: 投資・グラフ・クイズを連想させるシンプルなデザイン
- テキスト: なるべく避ける（小さいサイズで見づらいため）

**作成方法**:
- オンラインツール使用（例: favicon.io, realfavicongenerator.net）
- または画像編集ソフトで作成

#### 【 】12-4. メタタグ・layout.tsx修正（30分）
**場所**: `app029/src/app/layout.tsx`

**追加するメタタグ**:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#10b981" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

#### 【 】12-5. PWA動作確認（30分）
**確認項目**:
1. ビルド実行
   ```bash
   npm run build
   npm start
   ```

2. Chrome DevTools確認
   - Application → Manifest 確認
   - Application → Service Workers 確認
   - Lighthouse → PWA スコア確認（80点以上）

3. 実機確認
   - Chromeで「ホーム画面に追加」が表示されるか
   - インストール後、standalone modeで起動するか

---

## 📁 重要なファイル・ディレクトリ

### 実装計画書
- `doc/implementation.md` - 全Phase詳細（Phase 11・12含む）
- `doc/handoff.md` - この引継ぎ文書

### 新規実装ファイル（Phase 11）
- `src/lib/apiKeyManager.ts` - APIキー管理ロジック
- `src/app/components/settings/ApiKeySettings.tsx` - 設定UI
- `src/app/settings/page.tsx` - 設定ページ
- `src/__tests__/apiKeyManager.test.ts` - APIキー管理テスト
- `src/__tests__/ApiKeySettings.test.tsx` - 設定UIテスト

### Phase 12で追加予定
- `public/manifest.json` - PWA manifest
- `public/icons/` - アイコンディレクトリ
- `next.config.ts` - PWA設定追加

---

## 🧪 テスト実行方法

### 全テスト実行
```bash
cd app029
npm test
```

### カバレッジ付き
```bash
npm test -- --coverage
```

### 特定テストのみ
```bash
npm test -- apiKeyManager.test.ts
```

### E2Eテスト
```bash
npx playwright test
```

---

## 🔧 開発サーバー管理

### 現在のサーバー
- **ポート**: 3029
- **プロセスID**: `ss -tlnp | grep :3029` で確認可能

### サーバー再起動（必要時）
```bash
# 既存プロセスを確認
ss -tlnp | grep :3029

# 停止（PIDを確認してから）
kill [PID]

# 起動
cd app029
tmux new-session -d -s dev-server-3029 "npm run dev -- --hostname 0.0.0.0 --port 3029"
```

---

## 📝 実装時の注意事項

### TDD原則遵守
Phase 12も**Red → Green → Refactor**サイクルで実装すること。

### コミットルール
- Phase 12-1完了時: コミット
- Phase 12-2完了時: コミット
- Phase 12全完了時: コミット
- implementation.md更新時: コミット

### コミットメッセージ形式
```
Phase 12-X: [タスク名]

【実装内容】
- 具体的な実装内容

【テスト結果】
- テスト追加/全テストパス状況

【完了条件達成】
- チェックリスト
```

---

## 🎯 Phase 12完了条件

- [ ] manifest.jsonが正しく配信される
- [ ] Service Workerが登録される
- [ ] 「ホーム画面に追加」が表示される
- [ ] オフラインで基本画面（ホーム、クイズ選択）が表示される
- [ ] Lighthouse PWAスコア80点以上
- [ ] 各種デバイスでインストール可能

---

## 🔗 参考リンク

### PWA関連
- [next-pwa公式ドキュメント](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### アイコン生成ツール
- [favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### テストツール
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 🚀 実装後のアクション

Phase 12完了後:
1. implementation.mdを更新（Phase 12完了マーク）
2. README.mdにPWA対応を追記
3. 最終動作確認（全機能）
4. デプロイ準備完了の確認

---

## 💬 質問・不明点がある場合

- `doc/implementation.md` を参照
- Phase 11の実装コード（`src/lib/apiKeyManager.ts`等）を参考に
- TDD原則に従ってテストから書く

---

**作成日**: 2025-11-13
**作成者**: クロ（Claude Code CLI）
**プロジェクト**: app029-investment-quiz
**ブランチ**: master
**最終コミット**: Phase 11完了（53405d0）
