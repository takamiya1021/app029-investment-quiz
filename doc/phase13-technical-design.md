# Phase 13 技術設計書：AI機能のUI統合

## 1. 概要

### 1.1 目的
本ドキュメントは Phase 13（AI機能のUI統合）の技術設計を詳細に記述する。既存のAI機能（`generateQuestions`, `enhanceExplanation`, `analyzeWeakness`）にユーザーがアクセスできるUIを提供し、ユーザー体験を向上させる。

### 1.2 設計原則
- **既存コードの再利用**: `geminiService.ts` の関数をそのまま活用
- **段階的エンハンスメント**: APIキー未設定時でも既存機能は正常動作
- **TDD準拠**: テストファースト開発、Red-Green-Refactor サイクル
- **型安全性**: TypeScriptの型システムを最大限活用
- **保守性**: コンポーネントを小さく分離し、責務を明確化

### 1.3 技術スタック
- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS 4
- **テスト**: Jest + React Testing Library（ユニット）、Playwright（E2E）
- **AI API**: Google Gemini API

## 2. アーキテクチャ設計

### 2.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Home.tsx   │  │QuizShell.tsx │  │Explanation   │  │
│  │              │  │              │  │  Card.tsx    │  │
│  │ +弱点診断    │  │ +AI問題生成  │  │ +解説強化    │  │
│  │  ボタン      │  │  ボタン      │  │  ボタン      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼──────────┐
│         │      Component Layer (新規)       │          │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐  │
│  │ Weakness     │  │ AI Question  │  │ Enhanced     │  │
│  │ Analysis     │  │ Generator    │  │ Explanation  │  │
│  │ Modal.tsx    │  │ Modal.tsx    │  │ View.tsx     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼──────────┐
│         │       Service Layer (既存)        │          │
│  ┌──────▼─────────────────▼─────────────────▼───────┐  │
│  │          geminiService.ts                         │  │
│  │  - analyzeWeakness()                              │  │
│  │  - generateQuestions()                            │  │
│  │  - enhanceExplanation()                           │  │
│  └──────┬────────────────────────────────────────────┘  │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│              Data / Storage Layer                       │
│  ┌────────────────┐  ┌────────────────┐                │
│  │ apiKeyManager  │  │ useQuizStore   │                │
│  │    .ts         │  │    (Zustand)   │                │
│  │ (localStorage) │  │                │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

#### 弱点診断フロー
```
[Home.tsx]
  ↓ ボタン押下
[WeaknessAnalysisModal.tsx]
  ↓ useQuizStore から progress 取得
  ↓ analyzeWeakness(progress) 呼び出し
[geminiService.ts]
  ↓ API呼び出し
[Gemini API]
  ↓ 診断結果 JSON 返却
[WeaknessAnalysisModal.tsx]
  ↓ 診断結果を表示
[ユーザー]
```

#### AI問題生成フロー
```
[QuizShell.tsx - CategoryView]
  ↓ 「AI問題生成」ボタン押下
[AIQuestionGeneratorModal.tsx]
  ↓ カテゴリー・難易度・問題数を選択
  ↓ generateQuestions({...}) 呼び出し
[geminiService.ts]
  ↓ API呼び出し + 品質チェック
[Gemini API]
  ↓ 問題配列 JSON 返却
[AIQuestionGeneratorModal.tsx]
  ↓ startQuiz() 呼び出し
[useQuizStore]
  ↓ クイズセッション開始
[QuizShell.tsx - QuestionView]
```

#### 解説強化フロー
```
[ExplanationCard.tsx]
  ↓ 「もっと詳しく」ボタン押下
[EnhancedExplanationView.tsx]
  ↓ enhanceExplanation(question) 呼び出し
[geminiService.ts]
  ↓ API呼び出し
[Gemini API]
  ↓ 強化解説テキスト返却
[EnhancedExplanationView.tsx]
  ↓ 強化解説を表示（マークダウン対応）
[ユーザー]
```

## 3. コンポーネント設計

### 3.1 Phase 13-1: 弱点診断

#### 3.1.1 WeaknessAnalysisModal.tsx

**責務**: 弱点診断のUI表示とAPI呼び出し制御

**Props**:
```typescript
interface WeaknessAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**State**:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [analysis, setAnalysis] = useState<WeaknessAnalysis | null>(null);
const [error, setError] = useState<string | null>(null);
```

**主要メソッド**:
- `handleAnalyze()`: 弱点診断を実行
  - useQuizStoreからprogressを取得
  - APIキー存在確認（`hasApiKey()`）
  - `analyzeWeakness(progress)` 呼び出し
  - ローディング状態管理
  - エラーハンドリング

**UI構成**:
```
┌────────────────────────────────────────┐
│  弱点診断                      [×]     │
├────────────────────────────────────────┤
│                                        │
│  【ローディング時】                    │
│  🔄 診断中... (スピナー)               │
│                                        │
│  【診断完了時】                        │
│  📊 診断結果                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│  弱点カテゴリー: 債券投資の基本        │
│                                        │
│  📝 分析:                              │
│  債券投資の基本カテゴリーで正答率が... │
│                                        │
│  💡 アドバイス:                        │
│  債券の利回り計算や価格変動の...      │
│                                        │
│  📚 推奨トピック:                      │
│  • 債券の利回り計算                    │
│  • 金利と債券価格の関係                │
│  • 信用リスクの評価                    │
│                                        │
│  [再診断する]  [閉じる]                │
└────────────────────────────────────────┘
```

#### 3.1.2 Home.tsx への統合

**追加内容**:
```typescript
import { useState } from 'react';
import { hasApiKey } from '@/lib/apiKeyManager';
import WeaknessAnalysisModal from './WeaknessAnalysisModal';

export default function Home() {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const hasKey = hasApiKey();

  // ... 既存コード

  return (
    // ... 既存JSX
    {hasKey && (
      <button
        onClick={() => setIsAnalysisOpen(true)}
        className="... 既存ボタンと同じスタイル"
      >
        🔍 弱点診断
      </button>
    )}
    <WeaknessAnalysisModal
      isOpen={isAnalysisOpen}
      onClose={() => setIsAnalysisOpen(false)}
    />
    // ...
  );
}
```

### 3.2 Phase 13-2: 解説強化

#### 3.2.1 EnhancedExplanationView.tsx

**責務**: 強化解説の表示と取得制御

**Props**:
```typescript
interface EnhancedExplanationViewProps {
  question: Question;
}
```

**State**:
```typescript
const [isExpanded, setIsExpanded] = useState(false);
const [enhancedText, setEnhancedText] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**主要メソッド**:
- `handleEnhance()`: 解説強化を実行
  - `enhanceExplanation(question)` 呼び出し
  - キャッシュ管理（同じ問題の解説は再取得しない）
  - ローディング状態管理
  - エラーハンドリング

**UI構成**:
```
┌────────────────────────────────────────┐
│  問題カード                            │
│  ... 既存の問題・回答・解説表示 ...    │
│                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│                                        │
│  [📖 もっと詳しく] ← 初期状態          │
│                                        │
│  ↓ クリック後                          │
│                                        │
│  【ローディング時】                    │
│  🔄 解説を生成中... (スピナー)         │
│                                        │
│  【取得完了時】                        │
│  ✨ AI解説                             │
│  ┌──────────────────────────────────┐ │
│  │ より詳しい解説がここに表示される │ │
│  │ マークダウン形式対応             │ │
│  │                                  │ │
│  │ ## 重要ポイント                  │ │
│  │ - ポイント1                      │ │
│  │ - ポイント2                      │ │
│  └──────────────────────────────────┘ │
│  [▲ 折りたたむ]                        │
└────────────────────────────────────────┘
```

#### 3.2.2 ExplanationCard.tsx への統合

**追加内容**:
```typescript
import { hasApiKey } from '@/lib/apiKeyManager';
import EnhancedExplanationView from './EnhancedExplanationView';

export default function ExplanationCard({ question, userAnswer, index }: ExplanationCardProps) {
  const hasKey = hasApiKey();

  return (
    <article>
      {/* ... 既存のJSX（問題・回答・解説） */}

      {hasKey && <EnhancedExplanationView question={question} />}
    </article>
  );
}
```

### 3.3 Phase 13-3: AI問題生成

#### 3.3.1 AIQuestionGeneratorModal.tsx

**責務**: AI問題生成のパラメータ選択とAPI呼び出し制御

**Props**:
```typescript
interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (questions: Question[], category: string) => void;
}
```

**State**:
```typescript
const [category, setCategory] = useState('株式投資の基本');
const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
const [count, setCount] = useState(5);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [progress, setProgress] = useState(0); // 進捗バー用
```

**主要メソッド**:
- `handleGenerate()`: 問題生成を実行
  - `generateQuestions({ category, difficulty, count })` 呼び出し
  - 進捗バー更新（疑似的に0% → 50% → 100%）
  - 品質チェック結果のエラーハンドリング
  - 生成成功時に `onGenerated()` コールバック実行

**UI構成**:
```
┌────────────────────────────────────────┐
│  AI問題を生成                  [×]     │
├────────────────────────────────────────┤
│                                        │
│  📚 カテゴリー                         │
│  [▼ 株式投資の基本    ]                │
│                                        │
│  📊 難易度                             │
│  ( ) 初級  (●) 中級  ( ) 上級         │
│                                        │
│  📝 問題数                             │
│  ( ) 3問  (●) 5問  ( ) 10問           │
│                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│                                        │
│  【通常時】                            │
│  [生成する]  [キャンセル]              │
│                                        │
│  【ローディング時】                    │
│  🤖 問題を生成中...                    │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%            │
│  (進捗バー)                            │
│                                        │
│  【エラー時】                          │
│  ⚠️ 問題の生成に失敗しました           │
│  [再試行]  [閉じる]                    │
└────────────────────────────────────────┘
```

#### 3.3.2 QuizShell.tsx (CategoryView) への統合

**追加内容**:
```typescript
import { useState } from 'react';
import { hasApiKey } from '@/lib/apiKeyManager';
import AIQuestionGeneratorModal from './AIQuestionGeneratorModal';

function CategoryView() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const startQuiz = useQuizStore((state) => state.startQuiz);
  const hasKey = hasApiKey();

  const handleGenerated = (questions: Question[], category: string) => {
    startQuiz({
      category: `AI: ${category}`,
      difficulty: 'beginner', // AI生成問題の難易度はパラメータから
      questions,
    });
    setIsGeneratorOpen(false);
  };

  return (
    // ... 既存JSX
    <button
      onClick={() => setIsGeneratorOpen(true)}
      disabled={!hasKey}
      className={hasKey ? '... 通常スタイル' : '... disabled スタイル'}
      title={hasKey ? '' : 'APIキーを設定してください'}
    >
      ✨ AI問題を生成
    </button>

    <AIQuestionGeneratorModal
      isOpen={isGeneratorOpen}
      onClose={() => setIsGeneratorOpen(false)}
      onGenerated={handleGenerated}
    />
    // ...
  );
}
```

## 4. 状態管理設計

### 4.1 useQuizStore への影響
Phase 13 では `useQuizStore` への変更は**不要**。既存の以下のメソッド/stateをそのまま使用する：

- `progress` - 弱点診断で使用
- `startQuiz()` - AI問題生成後のクイズ開始で使用

### 4.2 ローカルステート管理

各コンポーネントで以下のローカルステートを管理：

| コンポーネント | ローカルステート |
|--------------|----------------|
| WeaknessAnalysisModal | `isLoading`, `analysis`, `error` |
| EnhancedExplanationView | `isExpanded`, `enhancedText`, `isLoading`, `error` |
| AIQuestionGeneratorModal | `category`, `difficulty`, `count`, `isLoading`, `error`, `progress` |

### 4.3 キャッシュ戦略

#### 強化解説のキャッシュ
```typescript
// EnhancedExplanationView.tsx
const enhancedCache = useRef<Map<string, string>>(new Map());

const getCachedExplanation = (questionId: string): string | null => {
  return enhancedCache.current.get(questionId) || null;
};

const cacheExplanation = (questionId: string, text: string) => {
  enhancedCache.current.set(questionId, text);
};
```

**キャッシュライフサイクル**: セッション中のみ保持（ページリロードでクリア）

## 5. API連携設計

### 5.1 API呼び出しパターン

#### 共通エラーハンドリング
```typescript
const handleApiCall = async <T,>(
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => void,
  onError: (error: string) => void,
  onFinally?: () => void
): Promise<void> => {
  try {
    const result = await apiCall();
    onSuccess(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('API key is not configured')) {
        onError('APIキーが設定されていません。設定ページで設定してください。');
      } else if (err.message.includes('Max retries reached')) {
        onError('APIの呼び出しに失敗しました。しばらくしてからもう一度お試しください。');
      } else {
        onError(err.message);
      }
    } else {
      onError('予期しないエラーが発生しました');
    }
  } finally {
    onFinally?.();
  }
};
```

#### 使用例（WeaknessAnalysisModal）
```typescript
const handleAnalyze = async () => {
  setIsLoading(true);
  setError(null);

  await handleApiCall(
    () => analyzeWeakness(progress),
    (data) => setAnalysis(data),
    (errMsg) => setError(errMsg),
    () => setIsLoading(false)
  );
};
```

### 5.2 タイムアウト設定

全てのAPI呼び出しに30秒のタイムアウトを設定：

```typescript
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    ),
  ]);
};

// 使用例
await withTimeout(analyzeWeakness(progress), 30000);
```

### 5.3 レート制限対応

`geminiService.ts` に既に実装済みの指数バックオフリトライを活用。追加対応は不要。

## 6. エラーハンドリング設計

### 6.1 エラーの分類

| エラー種別 | 原因 | 対処方法 | ユーザーメッセージ |
|----------|-----|---------|------------------|
| **APIキー未設定** | `loadApiKey()` が null | 設定ページへ誘導 | 「APIキーが設定されていません。設定ページで設定してください。」 |
| **ネットワークエラー** | fetch失敗、タイムアウト | リトライボタン提供 | 「通信エラーが発生しました。もう一度お試しください。」 |
| **レート制限** | 429エラー（最大リトライ後） | リトライボタン提供 | 「APIの呼び出し制限に達しました。しばらくしてからもう一度お試しください。」 |
| **品質チェック失敗** | 生成問題が品質基準未達 | 自動リトライ（最大3回） | 「問題の品質チェックに失敗しました。もう一度お試しください。」 |
| **JSONパースエラー** | APIレスポンスが不正 | リトライボタン提供 | 「APIからの応答が不正です。もう一度お試しください。」 |
| **学習データ不足** | progress.totalQuestions === 0 | クイズ受験を促す | 「まずはクイズに挑戦して、学習データを蓄積してください。」 |

### 6.2 エラー表示コンポーネント

```typescript
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onClose?: () => void;
}

function ErrorMessage({ message, onRetry, onClose }: ErrorMessageProps) {
  return (
    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
      <p className="text-rose-400 text-sm">{message}</p>
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="...">
            再試行
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="...">
            閉じる
          </button>
        )}
      </div>
    </div>
  );
}
```

## 7. テスト戦略

### 7.1 ユニットテスト（Jest + React Testing Library）

#### 7.1.1 WeaknessAnalysisModal.test.tsx
```typescript
describe('WeaknessAnalysisModal', () => {
  it('renders modal when open', () => { /* ... */ });
  it('calls analyzeWeakness on analyze button click', async () => { /* ... */ });
  it('displays analysis result after successful API call', async () => { /* ... */ });
  it('displays error message on API failure', async () => { /* ... */ });
  it('shows loading state during API call', async () => { /* ... */ });
  it('closes modal on close button click', () => { /* ... */ });
  it('displays insufficient data message when no quiz taken', () => { /* ... */ });
});
```

**モック対象**:
- `@/lib/geminiService` の `analyzeWeakness`
- `@/store/useQuizStore` の `progress`
- `@/lib/apiKeyManager` の `hasApiKey`

#### 7.1.2 EnhancedExplanationView.test.tsx
```typescript
describe('EnhancedExplanationView', () => {
  it('renders "more details" button initially', () => { /* ... */ });
  it('calls enhanceExplanation on button click', async () => { /* ... */ });
  it('displays enhanced explanation after successful API call', async () => { /* ... */ });
  it('caches enhanced explanation and does not re-fetch', async () => { /* ... */ });
  it('displays error message on API failure', async () => { /* ... */ });
  it('shows loading state during API call', async () => { /* ... */ });
  it('does not render when API key is not set', () => { /* ... */ });
});
```

**モック対象**:
- `@/lib/geminiService` の `enhanceExplanation`
- `@/lib/apiKeyManager` の `hasApiKey`

#### 7.1.3 AIQuestionGeneratorModal.test.tsx
```typescript
describe('AIQuestionGeneratorModal', () => {
  it('renders modal when open', () => { /* ... */ });
  it('allows selecting category, difficulty, and count', () => { /* ... */ });
  it('calls generateQuestions with correct parameters', async () => { /* ... */ });
  it('calls onGenerated callback with generated questions', async () => { /* ... */ });
  it('displays progress bar during generation', async () => { /* ... */ });
  it('displays error message on API failure', async () => { /* ... */ });
  it('retries on quality check failure', async () => { /* ... */ });
  it('disables generate button when API key not set', () => { /* ... */ });
});
```

**モック対象**:
- `@/lib/geminiService` の `generateQuestions`
- `@/lib/apiKeyManager` の `hasApiKey`

#### 7.1.4 既存コンポーネントへの統合テスト

**Home.test.tsx**（既存テストに追加）:
```typescript
describe('Home - Phase 13', () => {
  it('renders weakness analysis button when API key is set', () => { /* ... */ });
  it('does not render weakness analysis button when API key is not set', () => { /* ... */ });
  it('opens weakness analysis modal on button click', async () => { /* ... */ });
});
```

**ExplanationCard.test.tsx**（既存テストに追加）:
```typescript
describe('ExplanationCard - Phase 13', () => {
  it('renders enhanced explanation view when API key is set', () => { /* ... */ });
  it('does not render enhanced explanation view when API key is not set', () => { /* ... */ });
});
```

**QuizShell.test.tsx**（既存テストに追加）:
```typescript
describe('QuizShell - CategoryView - Phase 13', () => {
  it('renders AI question generator button', () => { /* ... */ });
  it('disables AI question generator button when API key is not set', () => { /* ... */ });
  it('opens AI question generator modal on button click', async () => { /* ... */ });
  it('starts quiz with generated questions', async () => { /* ... */ });
});
```

### 7.2 E2Eテスト（Playwright）

#### 7.2.1 ai-features-phase13.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Phase 13: AI Features UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // APIキーを設定
    await page.goto('/settings');
    await page.fill('input[type="password"]', 'test-api-key');
    await page.click('button:has-text("保存")');
    await page.goto('/');
  });

  test('weakness analysis flow', async ({ page }) => {
    // 弱点診断ボタンが表示される
    await expect(page.locator('button:has-text("弱点診断")')).toBeVisible();

    // ボタンをクリック
    await page.click('button:has-text("弱点診断")');

    // モーダルが開く
    await expect(page.locator('text=弱点診断')).toBeVisible();

    // 診断結果が表示される（モック応答）
    await expect(page.locator('text=弱点カテゴリー')).toBeVisible({ timeout: 10000 });

    // モーダルを閉じる
    await page.click('button:has-text("閉じる")');
  });

  test('enhanced explanation flow', async ({ page }) => {
    // クイズを開始
    await page.click('button:has-text("ランダム")');

    // 問題に回答
    await page.click('button[aria-label*="選択肢"]');
    await page.click('button:has-text("次の問題へ")');
    // ... 全問回答

    // 結果画面で「もっと詳しく」ボタンをクリック
    await page.click('button:has-text("もっと詳しく")');

    // 強化解説が表示される
    await expect(page.locator('text=AI解説')).toBeVisible({ timeout: 10000 });
  });

  test('AI question generation flow', async ({ page }) => {
    // クイズ画面へ
    await page.goto('/quiz');

    // AI問題生成ボタンをクリック
    await page.click('button:has-text("AI問題を生成")');

    // パラメータを選択
    await page.selectOption('select', '株式投資の基本');
    await page.click('input[type="radio"][value="beginner"]');
    await page.click('input[type="radio"][value="5"]');

    // 生成ボタンをクリック
    await page.click('button:has-text("生成する")');

    // 問題が生成され、クイズが開始される
    await expect(page.locator('text=第1問')).toBeVisible({ timeout: 15000 });
  });

  test('API key not set - buttons disabled/hidden', async ({ page }) => {
    // APIキーをクリア
    await page.goto('/settings');
    await page.click('button:has-text("クリア")');
    await page.goto('/');

    // 弱点診断ボタンが表示されない
    await expect(page.locator('button:has-text("弱点診断")')).not.toBeVisible();

    // クイズ画面でAI問題生成ボタンがdisabled
    await page.goto('/quiz');
    await expect(page.locator('button:has-text("AI問題を生成")')).toBeDisabled();
  });
});
```

### 7.3 テストカバレッジ目標

| メトリクス | 目標 |
|----------|------|
| ステートメント | 87%以上 |
| ブランチ | 80%以上 |
| 関数 | 88%以上 |
| 行 | 87%以上 |

### 7.4 テスト実行コマンド

```bash
# ユニットテスト
npm test

# ユニットテスト（カバレッジ付き）
npm test -- --coverage

# E2Eテスト
npx playwright test

# E2Eテスト（UIモード）
npx playwright test --ui

# 特定のE2Eテストのみ実行
npx playwright test ai-features-phase13.spec.ts
```

## 8. ファイル構成

### 8.1 新規ファイル

```
app029/
├── src/
│   ├── app/
│   │   └── components/
│   │       ├── ai/                           # 新規ディレクトリ
│   │       │   ├── WeaknessAnalysisModal.tsx  # Phase 13-1
│   │       │   ├── EnhancedExplanationView.tsx # Phase 13-2
│   │       │   └── AIQuestionGeneratorModal.tsx # Phase 13-3
│   │       ├── Home.tsx                      # 修正
│   │       └── quiz/
│   │           ├── ExplanationCard.tsx       # 修正
│   │           └── QuizShell.tsx             # 修正
│   └── __tests__/
│       ├── ai/                               # 新規ディレクトリ
│       │   ├── WeaknessAnalysisModal.test.tsx
│       │   ├── EnhancedExplanationView.test.tsx
│       │   └── AIQuestionGeneratorModal.test.tsx
│       ├── Home.test.tsx                     # 修正
│       ├── ExplanationCard.test.tsx          # 修正
│       └── QuizShell.test.tsx                # 修正
├── e2e/
│   └── ai-features-phase13.spec.ts           # 新規
└── doc/
    ├── phase13-requirements.md               # 新規（要件定義書）
    ├── phase13-technical-design.md           # 新規（本ドキュメント）
    └── implementation.md                     # 修正
```

### 8.2 修正ファイル一覧

| ファイル | 修正内容 |
|---------|---------|
| `src/app/components/Home.tsx` | 弱点診断ボタンとモーダル追加 |
| `src/app/components/quiz/ExplanationCard.tsx` | 解説強化ビュー追加 |
| `src/app/components/quiz/QuizShell.tsx` | AI問題生成ボタンとモーダル追加 |
| `doc/implementation.md` | Phase 13 セクション追加 |

## 9. 非機能要件の実装詳細

### 9.1 パフォーマンス最適化

#### 9.1.1 コンポーネントの遅延ロード
```typescript
import dynamic from 'next/dynamic';

const WeaknessAnalysisModal = dynamic(() => import('./ai/WeaknessAnalysisModal'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});
```

#### 9.1.2 API呼び出しのデバウンス
```typescript
// ユーザーが連続してボタンを押した場合に備える
const debouncedAnalyze = useCallback(
  debounce(async () => {
    await handleAnalyze();
  }, 500),
  []
);
```

### 9.2 アクセシビリティ

#### 9.2.1 ARIA属性
```typescript
<button
  onClick={handleAnalyze}
  aria-label="弱点診断を実行"
  aria-busy={isLoading}
  aria-describedby="analysis-description"
>
  🔍 弱点診断
</button>

<div id="analysis-description" className="sr-only">
  学習データを分析して、あなたの弱点カテゴリーとアドバイスを提供します
</div>
```

#### 9.2.2 キーボードナビゲーション
- モーダルの開閉: `Escape` キーで閉じる
- フォーカストラップ: モーダル内でのタブ移動を制限
- ローディング中のボタン: `disabled` 状態でクリック不可

### 9.3 セキュリティ

#### 9.3.1 XSS対策
- マークダウン表示時のサニタイズ: `react-markdown` + `remark-gfm` を使用
- ユーザー入力のエスケープ: React の自動エスケープに依存

#### 9.3.2 APIキーの保護
- APIキーはローカルストレージに保存され、サーバーに送信されない
- エラーメッセージにAPIキーを含めない
- コンソールログにAPIキーを出力しない

## 10. デプロイ・リリース計画

### 10.1 デプロイ前チェックリスト

- [ ] 全ユニットテストがパス
- [ ] 全E2Eテストがパス
- [ ] ESLintエラー・警告がゼロ
- [ ] TypeScript型エラーがゼロ
- [ ] カバレッジ87%以上を確認
- [ ] PWA機能が正常動作
- [ ] API呼び出しコストの見積もり
- [ ] ドキュメント更新（README.md、implementation.md）

### 10.2 段階的リリース

| フェーズ | 内容 | 期間 |
|---------|------|------|
| Phase 13-1 | 弱点診断機能リリース | 開発完了後即座 |
| Phase 13-2 | 解説強化機能リリース | Phase 13-1完了後 |
| Phase 13-3 | AI問題生成機能リリース | Phase 13-2完了後 |
| 統合テスト | 全機能の統合テスト | Phase 13-3完了後 |
| 本番デプロイ | Vercel等へデプロイ | 統合テスト完了後 |

### 10.3 ロールバック計画

各Phaseはgitブランチで管理し、問題発生時は前のコミットにロールバック可能にする。

## 11. 今後の拡張可能性

### 11.1 Phase 14（将来）: 生成問題の永続化
- 生成された問題をデータベースに保存
- ユーザーが過去に生成した問題を再利用

### 11.2 Phase 15（将来）: 問題生成のカスタマイズ
- 出題形式の選択（4択、○×、記述式）
- キーワード指定での問題生成

### 11.3 Phase 16（将来）: ソーシャル機能
- 診断結果のSNSシェア
- 友達との正答率比較

## 12. 参照ドキュメント

- [Phase 13 要件定義書](./phase13-requirements.md)
- [実装計画書](./implementation.md)
- [Next.js 16 App Router ドキュメント](https://nextjs.org/docs)
- [React Testing Library ドキュメント](https://testing-library.com/react)
- [Playwright ドキュメント](https://playwright.dev/)
- [Gemini API ドキュメント](https://ai.google.dev/docs)

## 13. 承認

| 役割 | 氏名 | 承認日 |
|------|------|--------|
| プロダクトオーナー | あおいさん | - |
| 開発担当 | クロ（Claude Code CLI） | 2025-11-13 |
| レビュアー | - | - |

---

**作成日**: 2025-11-13
**最終更新日**: 2025-11-13
**バージョン**: 1.0
