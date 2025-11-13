/**
 * CategoryDetailModal.tsx
 * カテゴリー詳細モーダルコンポーネント
 */

'use client';

import { useMemo } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { getAllQuestions } from '@/lib/questionBank';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const percent = (value: number): string => `${Math.round(value)}%`;

export default function CategoryDetailModal({ isOpen, onClose }: CategoryDetailModalProps) {
  const progress = useQuizStore((state) => state.progress);

  // 全カテゴリーの統計（制限なし）
  const allCategories = useMemo(() => {
    return Object.entries(progress.categoryStats)
      .filter(([, stat]) => stat.total > 0)
      .map(([category, stat]) => ({
        category,
        correct: stat.correct,
        total: stat.total,
        accuracy: (stat.correct / stat.total) * 100,
      }))
      .sort((a, b) => a.accuracy - b.accuracy); // 正答率の低い順
  }, [progress.categoryStats]);

  // カテゴリー別の間違えた問題
  const wrongQuestionsByCategory = useMemo(() => {
    const allQuestions = getAllQuestions();
    const wrongQuestionIds = new Set(progress.wrongQuestions);

    const categoryMap: Record<string, typeof allQuestions> = {};

    allQuestions.forEach((q) => {
      if (wrongQuestionIds.has(q.id)) {
        if (!categoryMap[q.category]) {
          categoryMap[q.category] = [];
        }
        categoryMap[q.category].push(q);
      }
    });

    return categoryMap;
  }, [progress.wrongQuestions]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">📊 カテゴリー詳細分析</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-2xl"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 統計情報がない場合 */}
          {allCategories.length === 0 && (
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 text-center">
              <p className="text-blue-400">まだクイズに挑戦していません。まずは1セット解いてみましょう。</p>
            </div>
          )}

          {/* セクション1: 全カテゴリーの統計 */}
          {allCategories.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">📈 全カテゴリー統計</h3>
              <div className="space-y-3">
                {allCategories.map((item, index) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-white/10 bg-slate-800/40 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white/40">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{item.category}</p>
                          <p className="text-xs text-white/60">
                            {item.correct}/{item.total}問正解
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xl font-semibold ${
                          item.accuracy >= 80
                            ? 'text-emerald-300'
                            : item.accuracy >= 60
                              ? 'text-yellow-300'
                              : 'text-rose-300'
                        }`}
                      >
                        {percent(item.accuracy)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          item.accuracy >= 80
                            ? 'bg-emerald-400'
                            : item.accuracy >= 60
                              ? 'bg-yellow-400'
                              : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.round(item.accuracy))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* セクション2: カテゴリー別の間違えた問題 */}
          {Object.keys(wrongQuestionsByCategory).length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">❌ 間違えた問題一覧</h3>
              <div className="space-y-4">
                {Object.entries(wrongQuestionsByCategory).map(([category, questions]) => (
                  <div
                    key={category}
                    className="rounded-2xl border border-white/10 bg-slate-800/40 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-white">{category}</h4>
                      <span className="text-sm text-white/60">{questions.length}問</span>
                    </div>
                    <ul className="space-y-2">
                      {questions.map((q) => (
                        <li
                          key={q.id}
                          className="text-sm text-white/80 pl-4 border-l-2 border-rose-500/50 py-1"
                        >
                          {q.question}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* セクション3: 学習の推奨事項 */}
          {allCategories.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">💡 学習のヒント</h3>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                {allCategories[0].accuracy < 60 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-blue-300 mb-2">
                      🎯 優先的に学習すべきカテゴリー
                    </p>
                    <p className="text-sm text-white/80">
                      <strong className="text-white">{allCategories[0].category}</strong> の正答率が{' '}
                      {percent(allCategories[0].accuracy)} です。このカテゴリーを重点的に学習することをお勧めします。
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-2">📚 学習方法の提案</p>
                  <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
                    <li>間違えた問題を復習モードで再挑戦しましょう</li>
                    <li>正答率が低いカテゴリーを集中的に学習しましょう</li>
                    <li>AI機能の「弱点診断」で詳しい分析を受けましょう</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
