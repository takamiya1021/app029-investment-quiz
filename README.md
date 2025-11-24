# ✨ 投資クイズアプリ

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-Store-44353B?logo=react&logoColor=white) ![Jest](https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-1.56-2EAD33?logo=playwright&logoColor=white) ![PWA Ready](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white) ![License](https://img.shields.io/badge/license-educational-yellow)

投資の基礎〜応用を 6 カテゴリー・54 問のクイズで学ぶ学習アプリです。学習ログをローカル保存し、Gemini 2.5 Flash を使った問題生成・解説強化・弱点診断で復習を最短化します。

![投資クイズアプリ - ホーム画面](doc/images/screenshot-home.png)

## デモ URL
公開準備中（デプロイ後にリンクを掲載します）

## Features
- ✏️ **3種類の出題モード** — カテゴリー別 / ランダム / 復習（間違えた問題）をワンタップで切り替え。
- 📊 **学習ログの自動可視化** — 累計正答率・受験セット数・学習日数とカテゴリー別スタッツをカード表示。
- 🤖 **Gemini 連携** — 問題生成・解説強化・弱点診断を API キー設定だけで利用可能。
- 🧽 **データ品質検証** — 54 問すべてをバリデーションし、AI 生成問題も JSON 検証や重複チェックを実施。
- 📱 **PWA & Offline** — ホーム画面に追加でき、オフラインになると自動で復旧案内ページへ切り替わります。

## 主要機能の詳細
1. **クイズ作成フロー** — カテゴリーやランダムを選ぶだけで 10 問セットを自動編成し、進捗バーと回答履歴をわかりやすく提示します。
2. **復習サイクル** — 間違えた問題は自動でストックされ、ワンタップで「復習10問」を作成して記憶の定着をサポートします。
3. **AI アシスト** — Gemini 2.5 Flash を使った問題生成・解説強化・弱点診断で、自分専用の学習素材とアドバイスを即座に取得できます。
4. **学習ダッシュボード** — ホームや詳細モーダルで累計正答率、受験回数、学習日数、カテゴリー別の強み弱みをグラフィカルに表示します。
5. **PWA 体験** — インストール感覚でホーム追加でき、オフライン時は専用ページに自動遷移して再接続を促します。

## 技術スタック
- **フレームワーク**: Next.js 16 (App Router), React 19, TypeScript 5
- **スタイリング**: Tailwind CSS 4, React Markdown + remark-gfm
- **状態管理**: Zustand 5 + LocalStorage 永続化ユーティリティ
- **AI 連携**: Google Gemini 2.5 Flash（API key 経由）
- **テスト**: Jest 30 + React Testing Library（16 suites）、Playwright 1.56
- **PWA**: @ducanh2912/next-pwa, カスタム `/offline` ページ

## セットアップ
### 前提条件
- Node.js 18.18 以上
- npm (推奨)

### インストール & 起動
```bash
git clone <repository-url>
cd app029-investment-quiz/app029
npm install
npm run dev   # http://localhost:3000
```

## テスト
```bash
npm test                 # Jest（Statements 86.34% @ 2025-11-19）
npm run test:e2e         # Playwright（127.0.0.1:3100 で dev サーバーを自動起動）
```

## プロジェクト構造
```
app029-investment-quiz/
├── README.md
├── doc/                        # 要件・設計メモ、スクリーンショット
└── app029/
    ├── README.md
    ├── src/
    │   ├── app/                # Home, Quiz, settings, offline, ai など
    │   ├── data/questions.json
    │   ├── lib/                # quizEngine, questionBank, geminiService...
    │   ├── store/useQuizStore.ts
    │   └── __tests__/          # lib/store/UI/AI のテスト
    ├── e2e/                    # Playwright シナリオ
    ├── public/                 # アイコン & PWA アセット
    └── coverage/, test-results/
```

## PWA / Design
- サイトをホーム追加すると、アイコンからフルスクリーン表示で利用できます。
- オフライン時は専用ページに切り替わり、再接続ボタンで復旧を促します。
- UI はダークトーンのTailwindデザインで統一し、AI 機能は API キー未設定時に自動で非表示になります。

## ビルド & デプロイ
```bash
npm run build
npm start   # 本番サーバー（PWA を含む）
```
PWA を含むため HTTPS 環境でホストし、Gemini API キーは必ずアプリ内の設定画面から登録してください。

## Gemini API キー
1. 画面右上の「⚙️ 設定」または `/settings` でキーを保存（ブラウザ `localStorage` 上に `gemini_api_key` として平文保管）。
2. 取得済みキーはクライアント側 localStorage のみを参照し、サーバー環境変数からは読み取りません。
3. キー未設定時は AI 機能のトグルやボタンが自動的に非活性化されます。

## AI 機能について
- 🧠 **AI問題生成**: カテゴリー・難易度・出題数(3/5/10)を選ぶと、Gemini 2.5 Flash が新しい4択問題を返し、品質チェックを通過したものだけが出題候補に追加されます。
- 📖 **解説強化**: 各設問の解説をボタンひとつで詳しいMarkdown解説に書き換え、同じ問題はキャッシュ済みテキストをそのまま再表示します。
- 🔍 **弱点診断**: 学習ログを渡すと、苦手カテゴリーと改善ポイント、推奨トピックを JSON で受け取り、そのままモーダルに表示します。
- ☔ **フェイルセーフ**: API キーが保存されていない / 通信できない場合は AI ボタンが自動で隠れ、従来のクイズ・復習・統計のみで利用できます。

## 開発ドキュメント
- `doc/requirements.md`
- `doc/design.md`
- `doc/implementation.md`
- `doc/phase13-requirements.md`
- `doc/phase13-technical-design.md`

## コントリビューション
Issue / Pull Request を歓迎します。再現手順・期待結果・スクリーンショットやログを添えてください。

## ライセンス
教育目的で提供されており、商用利用や再配布に関するライセンスは別途ご相談ください。

## 作者
[吉倉大晄 (Yoshikura Hiroaki)](https://github.com/yoshikurahiroaki)

## 謝辞
- Next.js / React / Tailwind CSS / Zustand / Jest / Playwright コミュニティ
- Google Gemini チーム（Generative AI API）
- @ducanh2912/next-pwa メンテナのみなさん
