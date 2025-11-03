# app029: 投資クイズ - 技術設計書

## 1. 技術スタック

### 1.1 フレームワーク・ライブラリ
- **Next.js**: 14.x (App Router)
- **React**: 18.x
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.x

### 1.2 選定理由
- **Next.js 14**: App Router、静的エクスポート可能、学習アプリに最適
- **React 18**: useTransition等の最新機能、スムーズな画面遷移
- **TypeScript**: クイズロジック・正答判定の型安全性が重要
- **Tailwind CSS**: 視認性の高いUIを迅速に構築

### 1.3 主要ライブラリ
- **状態管理**: Zustand
- **データ永続化**: LocalStorage
- **AI API**: @google/genai（Gemini API）
- **UI コンポーネント**: Radix UI
- **アイコン**: lucide-react
- **アニメーション**: framer-motion（正解時のアニメーション）

## 2. アーキテクチャ設計

### 2.1 全体アーキテクチャ
```
┌────────────────────────────────────────┐
│        Presentation Layer              │
│      (React Components + Quiz UI)      │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│       Application Layer                │
│    (State Management: Zustand)         │
│         (Quiz Engine)                  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│          Data Layer                    │
│   (LocalStorage + Gemini API)          │
└────────────────────────────────────────┘
```

### 2.2 コンポーネント構成
```
app/
├── page.tsx                    # ホーム画面
├── layout.tsx                  # ルートレイアウト
├── quiz/
│   └── page.tsx                # クイズ画面
└── components/
    ├── Home.tsx                # ホームコンポーネント
    ├── CategorySelector.tsx    # カテゴリー選択
    ├── QuizQuestion.tsx        # クイズ問題表示
    ├── QuizChoices.tsx         # 選択肢
    ├── QuizExplanation.tsx     # 解説表示
    ├── QuizResult.tsx          # 結果表示
    ├── ProgressIndicator.tsx   # 進捗表示
    ├── ScoreDisplay.tsx        # スコア表示
    ├── Statistics.tsx          # 統計表示
    ├── AIQuestionGenerator.tsx # AI問題生成
    ├── AIExplanationEnhancer.tsx # AI解説強化
    ├── AIWeaknessAnalyzer.tsx  # AI弱点分析
    ├── ApiKeySettings.tsx      # APIキー設定
    └── Header.tsx              # ヘッダー
```

## 3. データモデル設計

### 3.1 Question（問題）
```typescript
interface Question {
  id: string;                    // UUID
  category: string;              // カテゴリー
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // 難易度
  question: string;              // 問題文
  choices: string[];             // 選択肢配列（4つ）
  correctAnswer: number;         // 正解インデックス（0-3）
  explanation: string;           // 解説文
  tags?: string[];               // タグ（optional）
  aiGenerated?: boolean;         // AI生成フラグ
  createdAt?: Date;              // 作成日時
}
```

### 3.2 QuizSession（クイズセッション）
```typescript
interface QuizSession {
  id: string;                    // UUID
  category: string;              // カテゴリー
  difficulty: string;            // 難易度
  questions: Question[];         // 問題配列（10問）
  currentIndex: number;          // 現在の問題番号
  answers: (number | null)[];    // 回答配列
  startedAt: Date;               // 開始日時
  completedAt?: Date;            // 完了日時
}
```

### 3.3 UserProgress（ユーザー進捗）
```typescript
interface UserProgress {
  totalQuizzes: number;          // 総クイズ数
  totalCorrect: number;          // 総正解数
  totalQuestions: number;        // 総問題数
  categoryStats: Record<string, CategoryStat>; // カテゴリー別統計
  studyDays: number;             // 学習日数
  lastStudyDate: string;         // 最終学習日（YYYY-MM-DD）
  wrongQuestions: string[];      // 間違えた問題ID配列
}

interface CategoryStat {
  correct: number;               // 正解数
  total: number;                 // 総問題数
}
```

### 3.4 AppSettings（アプリ設定）
```typescript
interface AppSettings {
  geminiApiKey?: string;         // Gemini APIキー
  showExplanationImmediately: boolean; // 解説即時表示
  shuffleChoices: boolean;       // 選択肢シャッフル
}
```

## 4. ファイル構成

```
app029/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── quiz/
│   │   └── page.tsx
│   └── components/
│       ├── Home.tsx
│       ├── CategorySelector.tsx
│       ├── QuizQuestion.tsx
│       ├── QuizChoices.tsx
│       ├── QuizExplanation.tsx
│       ├── QuizResult.tsx
│       ├── ProgressIndicator.tsx
│       ├── ScoreDisplay.tsx
│       ├── Statistics.tsx
│       ├── AIQuestionGenerator.tsx
│       ├── AIExplanationEnhancer.tsx
│       ├── AIWeaknessAnalyzer.tsx
│       ├── ApiKeySettings.tsx
│       └── Header.tsx
├── lib/
│   ├── quizEngine.ts           # クイズエンジン
│   ├── questionBank.ts         # 問題バンク
│   ├── geminiService.ts        # Gemini API呼び出し
│   └── storage.ts              # LocalStorage管理
├── store/
│   └── useQuizStore.ts         # Zustand Store
├── types/
│   └── index.ts                # 型定義
├── data/
│   └── questions.json          # プリセット問題（50問）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 5. API・インターフェース設計

### 5.1 Zustand Store
```typescript
interface QuizStore {
  // State
  currentSession: QuizSession | null;
  progress: UserProgress;
  questions: Question[];

  // Quiz Actions
  startQuiz: (category: string, difficulty: string) => void;
  answerQuestion: (answerIndex: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;

  // Progress Actions
  recordResult: (correct: number, total: number, category: string) => void;
  addWrongQuestion: (questionId: string) => void;

  // Question Management
  loadQuestions: () => Promise<void>;
  addAIGeneratedQuestion: (question: Question) => void;

  // Computed
  currentQuestion: () => Question | null;
  score: () => { correct: number; total: number };
  categoryAccuracy: (category: string) => number;
}
```

### 5.2 Quiz Engine
```typescript
interface QuizEngine {
  // クイズ生成
  generateQuiz(
    category: string,
    difficulty: string,
    count: number
  ): Question[];

  // 選択肢シャッフル
  shuffleChoices(question: Question): Question;

  // 正答判定
  checkAnswer(question: Question, answerIndex: number): boolean;

  // スコア計算
  calculateScore(answers: (number | null)[], questions: Question[]): {
    correct: number;
    total: number;
    percentage: number;
  };
}
```

### 5.3 Gemini API インターフェース
```typescript
interface GeminiService {
  // 問題自動生成
  generateQuestions(
    category: string,
    difficulty: string,
    count: number
  ): Promise<Question[]>;

  // 解説強化
  enhanceExplanation(
    question: Question,
    userAnswer: number
  ): Promise<string>;

  // 弱点診断
  analyzeWeakness(progress: UserProgress): Promise<{
    weakCategories: string[];
    recommendations: string[];
    studyPlan: string[];
  }>;

  // 類似問題生成
  generateSimilarQuestions(
    baseQuestion: Question,
    count: number
  ): Promise<Question[]>;
}
```

## 6. 主要機能の実装方針

### 6.1 クイズエンジン

**問題選択ロジック**:
```typescript
function generateQuiz(
  category: string,
  difficulty: string,
  count: number
): Question[] {
  const filtered = questions.filter(
    q => q.category === category && q.difficulty === difficulty
  );

  // シャッフル（Fisher-Yates）
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  // 指定数取得
  return shuffled.slice(0, count);
}
```

**選択肢シャッフル**:
```typescript
function shuffleChoices(question: Question): Question {
  const choices = [...question.choices];
  const correctChoice = choices[question.correctAnswer];

  // Fisher-Yatesシャッフル
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  // 新しい正解インデックス
  const newCorrectAnswer = choices.indexOf(correctChoice);

  return { ...question, choices, correctAnswer: newCorrectAnswer };
}
```

### 6.2 正答判定・フィードバック

**即座に正誤判定**:
```typescript
function answerQuestion(answerIndex: number) {
  const question = currentSession.questions[currentSession.currentIndex];
  const isCorrect = answerIndex === question.correctAnswer;

  // 回答を記録
  currentSession.answers[currentSession.currentIndex] = answerIndex;

  // 視覚的フィードバック
  if (isCorrect) {
    showSuccessAnimation();
  } else {
    showErrorAnimation();
  }

  // 解説を表示
  showExplanation(question, isCorrect);
}
```

**アニメーション実装**:
```typescript
// components/QuizChoices.tsx
import { motion } from 'framer-motion';

function ChoiceButton({ choice, index, isCorrect, isSelected }) {
  return (
    <motion.button
      animate={isSelected ? (isCorrect ? 'correct' : 'wrong') : 'default'}
      variants={{
        correct: { backgroundColor: '#10b981', scale: 1.05 },
        wrong: { backgroundColor: '#ef4444', scale: 0.95 },
        default: { backgroundColor: '#f3f4f6' }
      }}
    >
      {choice}
    </motion.button>
  );
}
```

### 6.3 進捗管理

**カテゴリー別正答率**:
```typescript
function calculateCategoryAccuracy(category: string): number {
  const stat = progress.categoryStats[category];
  if (!stat || stat.total === 0) return 0;
  return Math.round((stat.correct / stat.total) * 100);
}
```

**学習日数カウント**:
```typescript
function updateStudyDays() {
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastStudyDate !== today) {
    progress.studyDays += 1;
    progress.lastStudyDate = today;
  }
}
```

### 6.4 間違えた問題の復習

**間違えた問題の抽出**:
```typescript
function getWrongQuestions(): Question[] {
  return questions.filter(q => progress.wrongQuestions.includes(q.id));
}
```

**復習モード**:
```typescript
function startReviewMode() {
  const wrongQuestions = getWrongQuestions();
  if (wrongQuestions.length === 0) {
    alert('復習する問題がありません！');
    return;
  }

  startQuiz('復習モード', 'mixed', wrongQuestions);
}
```

### 6.5 問題データの管理

**JSON形式**:
```json
{
  "questions": [
    {
      "id": "q001",
      "category": "株式投資の基本",
      "difficulty": "beginner",
      "question": "株式を購入することで得られる主な利益は次のうちどれでしょうか？",
      "choices": [
        "配当金と値上がり益",
        "利息",
        "家賃収入",
        "給与"
      ],
      "correctAnswer": 0,
      "explanation": "株式を保有することで、企業から配当金を受け取ることができます。また、株価が上昇した時に売却すれば値上がり益（キャピタルゲイン）を得られます。"
    }
  ]
}
```

**動的読み込み**:
```typescript
async function loadQuestions() {
  const response = await fetch('/data/questions.json');
  const data = await response.json();
  setQuestions(data.questions);
}
```

### 6.6 AI機能（Gemini API）

#### 問題自動生成
```typescript
async function generateQuestions(
  category: string,
  difficulty: string,
  count: number
): Promise<Question[]> {
  const prompt = `投資の基礎知識に関する4択クイズ問題を${count}問生成してください。

カテゴリー: ${category}
難易度: ${difficulty}

各問題は以下の形式で出力してください：
{
  "question": "問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctAnswer": 0,
  "explanation": "解説文"
}

JSON配列形式で出力してください。`;

  const response = await geminiAPI.generateContent(prompt);
  const questions = JSON.parse(response.text);

  return questions.map(q => ({
    ...q,
    id: generateUUID(),
    category,
    difficulty,
    aiGenerated: true,
    createdAt: new Date()
  }));
}
```

#### 解説強化
```typescript
async function enhanceExplanation(
  question: Question,
  userAnswer: number
): Promise<string> {
  const isCorrect = userAnswer === question.correctAnswer;

  const prompt = `以下の投資クイズについて、より詳しい解説を生成してください。

問題: ${question.question}
正解: ${question.choices[question.correctAnswer]}
ユーザーの回答: ${question.choices[userAnswer]}
結果: ${isCorrect ? '正解' : '不正解'}

既存の解説: ${question.explanation}

初心者にも分かりやすく、具体例を含めた詳細な解説をお願いします。`;

  const response = await geminiAPI.generateContent(prompt);
  return response.text;
}
```

#### 弱点診断・学習アドバイス
```typescript
async function analyzeWeakness(progress: UserProgress): Promise<Analysis> {
  const categoryAccuracies = Object.entries(progress.categoryStats).map(
    ([category, stat]) => ({
      category,
      accuracy: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0
    })
  );

  const prompt = `ユーザーの投資クイズ学習履歴:

カテゴリー別正答率:
${categoryAccuracies.map(c => `- ${c.category}: ${c.accuracy.toFixed(1)}%`).join('\n')}

総合正答率: ${((progress.totalCorrect / progress.totalQuestions) * 100).toFixed(1)}%
学習日数: ${progress.studyDays}日

この履歴から以下を分析してください：
1. 理解が不足しているカテゴリー
2. 重点的に学習すべきトピック
3. 効果的な学習ロードマップ（3〜5ステップ）`;

  const response = await geminiAPI.generateContent(prompt);
  return parseWeaknessAnalysis(response.text);
}
```

#### 類似問題の自動生成
```typescript
async function generateSimilarQuestions(
  baseQuestion: Question,
  count: number
): Promise<Question[]> {
  const prompt = `以下の投資クイズ問題に類似した問題を${count}問生成してください。

元の問題:
${JSON.stringify(baseQuestion, null, 2)}

同じ概念を異なる角度から問う問題を作成し、理解を深めるための練習問題としてください。`;

  const response = await geminiAPI.generateContent(prompt);
  return parseGeneratedQuestions(response.text);
}
```

## 7. パフォーマンス最適化

### 7.1 問題データ
- 初期ロード時に全問題を読み込み（50問程度なら軽量）
- useMemo でフィルタリング結果をキャッシュ

### 7.2 React最適化
- React.memo で選択肢ボタン再レンダリング抑制
- useTransition で画面遷移を最適化

### 7.3 LocalStorage管理
- 進捗データはクイズ完了時のみ保存
- デバウンス処理は不要（頻繁な更新なし）

## 8. セキュリティ対策

### 8.1 入力検証
- AI生成問題のサニタイズ（XSS対策）
- JSON.parse時のエラーハンドリング

### 8.2 APIキー管理
- LocalStorage保存（平文）
- 設定画面でマスク表示

### 8.3 教育的配慮
- 投資勧誘と誤解されない表現
- 免責事項の明示

## 9. エラーハンドリング

### 9.1 問題データ
- 問題ファイル読み込み失敗: 「問題データの読み込みに失敗しました」
- JSON解析エラー: 「データ形式が不正です」

### 9.2 Gemini API
- APIキー未設定: 「APIキーを設定してください」
- レート制限: 「APIリクエスト制限に達しました」
- 生成失敗: 「問題生成に失敗しました」
- 品質チェック: 生成された問題のバリデーション必須

### 9.3 LocalStorage
- 容量不足: 「ストレージ容量が不足しています」
- データ破損: 「進捗データの読み込みに失敗しました」

## 10. テスト戦略

### 10.1 単体テスト
- quizEngine の各関数
- 正答判定ロジック
- スコア計算

### 10.2 統合テスト
- クイズ開始 → 回答 → 結果表示
- 進捗記録 → 統計表示
- AI問題生成 → 問題追加

### 10.3 E2Eテスト
- ユーザーシナリオ全体
- ブラウザ間互換性

## 11. デプロイ・運用

### 11.1 ビルド
- `next build` で静的エクスポート
- 問題データを public/ に配置

### 11.2 ブラウザ対応
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

### 11.3 モニタリング
- エラー追跡（Sentry等）
- ユーザーフィードバック収集

## 12. 今後の拡張性

### 12.1 追加機能候補
- タイマー機能（タイムアタックモード）
- マルチプレイヤー対戦
- ランキング機能
- 実際のニュースを基にした時事問題

### 12.2 技術的改善
- Service Worker（PWA化）
- IndexedDB（大量問題管理）
- WebSocket（リアルタイム対戦）
