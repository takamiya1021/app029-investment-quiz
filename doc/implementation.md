# app029: 投資クイズ - 実装計画書（TDD準拠版）

## 概要
本実装計画書は、TDD（Test-Driven Development）の原則に従い、全ての機能実装において**Red-Green-Refactor**サイクルを適用します。クイズエンジン、AI問題生成、学習進捗管理を段階的に実装します。

## 完了条件
- ✅ 全テストがパス（Jest + React Testing Library + Playwright）
- ✅ コードカバレッジ80%以上
- ✅ ESLintエラー・警告ゼロ
- ✅ 50問以上のプリセット問題
- ✅ 要件定義書の全機能が実装済み

## 工数見積もり合計
**約42時間**（TDD対応分を含む）

---

## Phase 0: テスト環境構築（予定工数: 3時間）

### タスク

#### 【x】0-1. Next.jsプロジェクト初期化（30分）
- `npx create-next-app@latest app029 --typescript --tailwind --app`
- **Red**: 動作確認テスト
- **Green**: プロジェクト起動確認
- **Refactor**: 不要ファイル削除

#### 【x】0-2. Jestセットアップ（1時間）
- **Red**: Jest設定ファイルのテスト
- **Green**: Jest, @testing-library/react インストール
- **Refactor**: 設定最適化

#### 【x】0-3. Playwrightセットアップ（1時間）
- **Red**: E2Eテストスケルトン
- **Green**: Playwright インストール・設定
- **Refactor**: テスト構成整理

#### 【x】0-4. テスト実行確認（30分）
- **Red**: ダミーテスト作成
- **Green**: テスト実行スクリプト設定
- **Refactor**: テストコマンド整理

---

## Phase 1: データモデル・状態管理実装（予定工数: 5時間）

### タスク

#### 【x】1-1. 型定義作成（1時間）
- **Red**: 型定義のテスト
- **Green**: Question, QuizSession, UserProgress, AppSettings 定義
- **Refactor**: 型の共通化

#### 【x】1-2. Zustand Store実装（3時間）
- **Red**: Store各アクションのテスト
  ```typescript
  test('should start quiz', () => {
    const { startQuiz, currentSession } = useQuizStore.getState();
    startQuiz('株式投資の基本', 'beginner');
    expect(currentSession).toBeDefined();
  });
  ```
- **Green**: `store/useQuizStore.ts` 実装
  - startQuiz, answerQuestion, nextQuestion, finishQuiz
  - recordResult, addWrongQuestion
- **Refactor**: 状態管理最適化

#### 【x】1-3. LocalStorage統合（1時間）
- **Red**: 永続化テスト
- **Green**: `lib/storage.ts` 実装
- **Refactor**: デバウンス処理

---

## Phase 2: 問題バンク作成（予定工数: 6時間）

### 目的
50問のプリセット問題を作成し、JSON形式で管理。

### タスク

#### 【x】2-1. 問題データ構造設計（1時間）
- **Red**: データ読み込みテスト
- **Green**: `data/questions.json` フォーマット設計
- **Refactor**: スキーマ最適化

#### 【x】2-2. カテゴリー別問題作成（4時間）
- **Red**: 各カテゴリー問題テスト
- **Green**: 50問作成
  - 株式投資の基本（10問）
  - 債券投資の基本（8問）
  - 投資信託・ETF（10問）
  - リスク管理（10問）
  - 税金・制度（8問）
  - 経済用語（8問）
- **Refactor**: 問題内容レビュー・改善

#### 【 】2-3. questionBankモジュール実装（1時間）
- **Red**: 問題読み込みテスト
- **Green**: `lib/questionBank.ts` 実装
  - JSON読み込み
  - カテゴリー別フィルタリング
- **Refactor**: キャッシュ実装

---

## Phase 3: クイズエンジン実装（予定工数: 5時間）

### タスク

#### 【 】3-1. 問題選択ロジック（2時間）
- **Red**: 問題選択テスト
- **Green**: `lib/quizEngine.ts` 実装
  ```typescript
  function generateQuiz(category: string, difficulty: string, count: number): Question[]
  ```
- **Refactor**: シャッフルアルゴリズム最適化

#### 【 】3-2. 正答判定ロジック（1時間）
- **Red**: 正答判定テスト
- **Green**: checkAnswer 実装
- **Refactor**: ロジック最適化

#### 【 】3-3. スコア計算（1時間）
- **Red**: スコア計算テスト
- **Green**: calculateScore 実装
- **Refactor**: パーセンテージ計算

#### 【 】3-4. 選択肢シャッフル（1時間）
- **Red**: シャッフルテスト
- **Green**: Fisher-Yatesアルゴリズム実装
- **Refactor**: 正解インデックス追跡

---

## Phase 4: UIコンポーネント実装（予定工数: 8時間）

### タスク

#### 【 】4-1. Homeコンポーネント（1時間）
- **Red**: ホーム画面表示テスト
- **Green**: ホームUI実装
- **Refactor**: レイアウト調整

#### 【 】4-2. CategorySelectorコンポーネント（2時間）
- **Red**: カテゴリー選択テスト
- **Green**: カテゴリー一覧、正答率表示実装
- **Refactor**: UX改善

#### 【 】4-3. QuizQuestionコンポーネント（2時間）
- **Red**: 問題表示テスト
- **Green**: 問題文、進捗表示実装
- **Refactor**: レスポンシブ対応

#### 【 】4-4. QuizChoicesコンポーネント（2時間）
- **Red**: 選択肢表示・選択テスト
- **Green**: 4択ボタン、視覚的フィードバック実装
- **Refactor**: framer-motion統合

#### 【 】4-5. QuizExplanationコンポーネント（1時間）
- **Red**: 解説表示テスト
- **Green**: 正誤表示、解説文表示実装
- **Refactor**: レイアウト改善

---

## Phase 5: 結果表示・統計機能実装（予定工数: 4時間）

### タスク

#### 【 】5-1. QuizResultコンポーネント（2時間）
- **Red**: 結果表示テスト
- **Green**: スコア、正答率、カテゴリー別正答率表示実装
- **Refactor**: ビジュアル改善

#### 【 】5-2. Statisticsコンポーネント（2時間）
- **Red**: 統計表示テスト
- **Green**: 学習履歴、累計正答率、学習日数表示実装
- **Refactor**: グラフ表示（optional）

---

## Phase 6: 学習モード実装（予定工数: 3時間）

### タスク

#### 【 】6-1. 間違えた問題の抽出（1時間）
- **Red**: 復習問題抽出テスト
- **Green**: getWrongQuestions 実装
- **Refactor**: フィルタリング最適化

#### 【 】6-2. 復習モード（2時間）
- **Red**: 復習モードテスト
- **Green**: 復習専用クイズ生成実装
- **Refactor**: UX改善

---

## Phase 7: AI機能実装（Gemini API）（予定工数: 7時間）

### タスク

#### 【 】7-1. Gemini API統合（1時間）
- **Red**: API接続テスト（モック）
- **Green**: `lib/geminiService.ts` 実装
- **Refactor**: エラーハンドリング

#### 【 】7-2. 問題自動生成（3時間）
- **Red**: 問題生成テスト
- **Green**: generateQuestions 実装
  - カテゴリー・難易度指定
  - 4択問題形式
  - JSON解析・検証
- **Refactor**: プロンプト最適化

#### 【 】7-3. 解説強化（2時間）
- **Red**: 解説強化テスト
- **Green**: enhanceExplanation 実装
  - 既存解説を詳細化
  - 初心者向け補足
- **Refactor**: 解説品質向上

#### 【 】7-4. 弱点診断・学習アドバイス（1時間）
- **Red**: 弱点診断テスト
- **Green**: analyzeWeakness 実装
  - カテゴリー別正答率分析
  - 学習ロードマップ提示
- **Refactor**: アドバイス内容改善

---

## Phase 8: エラーハンドリング・バリデーション（予定工数: 3時間）

### タスク

#### 【 】8-1. 問題データバリデーション（1時間）
- **Red**: データ検証テスト
- **Green**: JSONスキーマ検証、問題データ検証実装
- **Refactor**: エラーメッセージ改善

#### 【 】8-2. Gemini APIエラーハンドリング（1時間）
- **Red**: APIエラーテスト
- **Green**: レート制限、生成失敗処理
- **Refactor**: リトライロジック

#### 【 】8-3. 生成問題の品質チェック（1時間）
- **Red**: 品質チェックテスト
- **Green**: AIが生成した問題のバリデーション実装
- **Refactor**: 品質基準強化

---

## Phase 9: E2Eテスト・統合テスト（予定工数: 4時間）

### タスク

#### 【 】9-1. クイズ出題・回答シナリオ（1時間）
- **Red**: E2Eテスト作成
- **Green**: テストパス確認
- **Refactor**: アサーション強化

#### 【 】9-2. 結果表示・統計シナリオ（1時間）
- **Red**: E2Eテスト作成
- **Green**: テストパス確認
- **Refactor**: データ整合性確認

#### 【 】9-3. 復習モードシナリオ（1時間）
- **Red**: E2Eテスト作成
- **Green**: テストパス確認
- **Refactor**: エッジケース追加

#### 【 】9-4. AI機能統合テスト（1時間）
- **Red**: AI機能E2Eテスト作成
- **Green**: モックAPI使用テスト
- **Refactor**: テスト安定性向上

---

## Phase 10: デプロイ準備・最終調整（予定工数: 2時間）

### タスク

#### 【 】10-1. 問題データ配置（30分）
- data/questions.json 配置
- 問題内容最終確認

#### 【 】10-2. 静的エクスポート設定（30分）
- next.config.js 設定
- ビルドエラー修正

#### 【 】10-3. ビルド・動作確認（30分）
- `npm run build` 実行
- 全機能動作確認

#### 【 】10-4. README・免責事項作成（30分）
- セットアップ手順、使い方
- 「投資助言ではない」旨の免責事項

---

## マイルストーン

### M1: 基本機能実装完了（Phase 0-4）
- 期限: 開始から1週間
- 完了条件: クイズ出題、回答、正誤判定が動作

### M2: 学習管理機能実装完了（Phase 5-6）
- 期限: 開始から2週間
- 完了条件: 結果表示、統計、復習モードが動作

### M3: AI機能実装完了（Phase 7）
- 期限: 開始から3週間
- 完了条件: Gemini APIが動作、問題自動生成

### M4: 品質保証・デプロイ準備完了（Phase 8-10）
- 期限: 開始から4週間
- 完了条件: 全テストパス、50問完成

---

## 依存関係

- Phase 0 → 全Phase（テスト環境必須）
- Phase 1 → Phase 3, 4, 7（データモデル依存）
- Phase 2 → Phase 3, 4（問題データ依存）
- Phase 3 → Phase 4, 5, 6（クイズエンジン依存）
- Phase 7 → Phase 2（問題データ依存）
- Phase 8, 9 → 全機能実装完了後

---

## リスク管理

### 高リスク項目
1. **問題作成**: 50問の作成に時間がかかる
   - 対策: 既存の投資教育資料を参考、AI支援活用
2. **Gemini API生成問題の品質**: 不正確な問題が生成される
   - 対策: 品質チェック必須、ユーザーレビュー機能

### 中リスク項目
1. **投資助言と誤解される**: 法的リスク
   - 対策: 免責事項明示、「教育目的のみ」強調

---

## 品質チェックリスト

### コード品質
- [ ] ESLint エラー・警告ゼロ
- [ ] TypeScript型エラーゼロ
- [ ] 50問以上のプリセット問題

### テスト品質
- [ ] 単体テストカバレッジ80%以上
- [ ] E2Eテスト全シナリオパス

### 教育品質
- [ ] 問題内容が正確
- [ ] 解説が分かりやすい
- [ ] 投資助言ではないことが明確

### UX品質
- [ ] クイズがスムーズ
- [ ] 解説が適切なタイミングで表示
- [ ] 達成感を感じられる
