/**
 * AIQuestionGeneratorModal.tsx
 * AI問題生成モーダルコンポーネント（Phase 13-3）
 *
 * 責務: AI問題生成のパラメータ選択とAPI呼び出し制御
 * - generateQuestions API呼び出し
 * - 進捗バー更新（疑似的に0% → 50% → 100%）
 * - 品質チェック結果のエラーハンドリング
 * - 生成成功時に onGenerated() コールバック実行
 */

'use client';

import { useState, useEffect } from 'react';
import { Question, Difficulty } from '@/lib/types';
import { generateQuestions } from '@/lib/geminiService';
import { useQuizStore } from '@/store/useQuizStore';

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (questions: Question[], category: string) => void;
}

const CATEGORIES = [
  '株式投資の基本',
  '債券投資の基本',
  '投資信託・ETF',
  'リスク管理',
  '税金・制度',
  '経済用語',
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

const COUNTS = [3, 5, 10];

export default function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  onGenerated,
}: AIQuestionGeneratorModalProps) {
  const [category, setCategory] = useState('株式投資の基本');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [count, setCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // モーダルが開かれたときに状態をリセット
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setProgress(0);
    }
  }, [isOpen]);

  // モーダルが表示されていない場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  /**
   * 問題生成を実行
   */
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // 疑似的な進捗表示（0% → 30%）
      setProgress(30);

      // API呼び出し
      const questions = await generateQuestions({
        category,
        difficulty,
        count,
      });

      // 進捗表示（30% → 100%）
      setProgress(100);

      // 成功時のコールバック
      setTimeout(() => {
        // 生成された問題をストアに保存
        questions.forEach(q => {
          useQuizStore.getState().addAIGeneratedQuestion(q);
        });

        onGenerated(questions, category);
        onClose();
      }, 300); // 進捗バーを一瞬見せるため
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * リトライ処理
   */
  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white">✨ AI問題を生成</h2>
          <button
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white"
            aria-label="閉じる"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* エラー表示 */}
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-400">問題の生成に失敗しました: {error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 rounded-lg bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
              >
                再試行
              </button>
            </div>
          )}

          {/* ローディング表示 */}
          {isLoading && (
            <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-950/30 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                <span className="text-sm text-emerald-200">🤖 問題を生成中...</span>
              </div>
              {/* 進捗バー */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-white/60">{progress}%</p>
            </div>
          )}

          {/* フォーム */}
          <div className="space-y-5">
            {/* カテゴリー選択 */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-white/90">
                📚 カテゴリー
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white transition-colors hover:border-white/20 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 難易度選択 */}
            <div>
              <p className="block text-sm font-semibold text-white/90">📊 難易度</p>
              <div className="mt-2 flex gap-3">
                {DIFFICULTIES.map((diff) => (
                  <label
                    key={diff.value}
                    className={`
                      flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-all
                      ${difficulty === diff.value
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-slate-800 text-white/70 hover:border-white/20 hover:text-white'
                      }
                      ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={diff.value}
                      checked={difficulty === diff.value}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      disabled={isLoading}
                      className="sr-only"
                      aria-label={diff.label}
                    />
                    {diff.label}
                  </label>
                ))}
              </div>
            </div>

            {/* 問題数選択 */}
            <div>
              <p className="block text-sm font-semibold text-white/90">📝 問題数</p>
              <div className="mt-2 flex gap-3">
                {COUNTS.map((c) => (
                  <label
                    key={c}
                    className={`
                      flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-all
                      ${count === c
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-slate-800 text-white/70 hover:border-white/20 hover:text-white'
                      }
                      ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="count"
                      value={c}
                      checked={count === c}
                      onChange={(e) => setCount(Number(e.target.value))}
                      disabled={isLoading}
                      className="sr-only"
                      aria-label={`${c}問`}
                    />
                    {c}問
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            生成する
          </button>
        </div>
      </div>
    </div>
  );
}
