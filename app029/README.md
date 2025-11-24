# ✨ 投資クイズアプリ（App）

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-Store-44353B?logo=react&logoColor=white) ![Jest](https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-1.56-2EAD33?logo=playwright&logoColor=white)

6 カテゴリー・54 問の投資クイズで学べる Next.js アプリです。学習ログはローカル保存され、Gemini 2.5 Flash による問題生成・解説強化・弱点診断を備えています。

![投資クイズアプリ - ホーム画面](../doc/images/screenshot-home.png)

## Features
- ✏️ カテゴリー別 / ランダム / 復習の 3 モードを 10 問セットで提供
- 📊 累計正答率・受験回数・学習日数・カテゴリー別スタッツを自動記録
- 🤖 Gemini 連携で問題生成 / 解説強化 / 弱点診断（API キー未設定時は非表示）
- 📱 @ducanh2912/next-pwa で `/offline` フォールバックを提供

## 技術スタック
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, React Markdown + remark-gfm
- Zustand 5, LocalStorage 永続化ユーティリティ
- Jest + React Testing Library、Playwright

## セットアップ
```bash
npm install
npm run dev   # http://localhost:3000
```
本番ビルド: `npm run build && npm start`

## テスト
```bash
npm test
npm run test:e2e
```

## プロジェクト構造
```
src/
├── app/        # Home, Quiz, settings, offline, ai ...
├── data/questions.json
├── lib/        # quizEngine, questionBank, geminiService, storage...
├── store/
└── __tests__/  # lib/store/UI/AI

e2e/            # Playwright シナリオ
public/         # アイコン & PWA assets
```

## Gemini API キー
1. `/settings` でキーを保存（ブラウザ `localStorage` の `gemini_api_key` に平文保存されるので共有端末では削除推奨）。
2. アプリは localStorage からのみキーを読み取り、環境変数は使用しません。
3. キー未設定時は AI 機能が自動で非表示になります。

### AI 機能詳細
- 🧠 **AI問題生成**: カテゴリー / 難易度 / 出題数を指定して Gemini 2.5 Flash から JSON 形式で受信し、重複やテキスト長を検証。
- 📖 **解説強化**: 各問題の解説を Markdown で再生成し、同じ問題IDはキャッシュ済みテキストを再利用。
- 🔍 **弱点診断**: 学習ログを送信し、弱点カテゴリー・アドバイス・推奨トピックを JSON で返して表示。
- 🚫 **API未設定時の動作**: これらのボタンは UI から非表示になり、通常のクイズ・復習・統計機能のみが利用できます。

## ビルド & デプロイ
- `npm run build`
- `npm start`（PWA 動作確認時）
HTTPS 環境でホストし、Gemini API キーは必ず設定画面から登録してください。

## 免責事項
教育目的で提供しており、投資助言ではありません。実際の投資判断は自己責任でお願いします。
