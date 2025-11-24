'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { hasApiKey } from '@/lib/apiKeyManager';
import WeaknessAnalysisModal from './ai/WeaknessAnalysisModal';
import CategoryDetailModal from './CategoryDetailModal';

const percent = (value: number): string => `${Math.round(value)}%`;

export default function Home() {
  const progress = useQuizStore((state) => state.progress);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isCategoryDetailOpen, setIsCategoryDetailOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // クライアント側でのみAPIキーの有無を確認（Hydration Error回避）
  useEffect(() => {
    setHasKey(hasApiKey());
    setIsMounted(true);
  }, []);

  const totalAccuracy = useMemo(() => {
    if (!isMounted || !progress.totalQuestions) {
      return 0;
    }
    return (progress.totalCorrect / progress.totalQuestions) * 100;
  }, [isMounted, progress.totalCorrect, progress.totalQuestions]);

  // 上位3カテゴリーのみ表示（簡易版）
  const categoryBreakdown = useMemo(() => {
    if (!isMounted) {
      return [];
    }
    return Object.entries(progress.categoryStats)
      .filter(([, stat]) => stat.total > 0)
      .map(([category, stat]) => ({
        category,
        accuracy: (stat.correct / stat.total) * 100,
        total: stat.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3); // 上位3カテゴリーのみ
  }, [isMounted, progress.categoryStats]);

  const statCards = useMemo(
    () => [
      {
        label: '累計正答率',
        value: percent(Number.isNaN(totalAccuracy) ? 0 : totalAccuracy),
        helper: `${isMounted ? progress.totalCorrect : 0}/${isMounted ? progress.totalQuestions : 0}問`,
      },
      {
        label: '受験したセット',
        value: `${isMounted ? progress.totalQuizzes : 0}回`,
        helper: 'クイズ履歴',
      },
      {
        label: '学習日数',
        value: `${isMounted ? progress.studyDays : 0}日`,
        helper:
          isMounted && progress.lastStudyDate
            ? `最終: ${progress.lastStudyDate}`
            : 'まだ記録がありません',
      },
    ],
    [isMounted, totalAccuracy, progress]
  );

  return (
    <section className="min-h-[calc(100vh-80px)] bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            投資リテラシーの第一歩
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            投資クイズで基礎力を磨こう
          </h1>
          <p className="mt-4 text-lg text-white/70">
            株式・債券・投資信託からリスク管理まで。1セット10問のクイズで弱点を可視化し、解説で知識を定着させましょう。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              クイズを始める
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40"
            >
              ⚙️ 設定
            </Link>
            {hasKey && (
              <button
                onClick={() => setIsAnalysisOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-blue-400/40 bg-blue-400/10 px-6 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/20"
              >
                🔍 弱点診断
              </button>
            )}
          </div>
          {!hasKey && isMounted && (
            <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 backdrop-blur">
              <p className="text-sm text-yellow-200">
                💡 AI機能（問題生成・解説強化・弱点診断）を使うには、
                <Link href="/settings" className="ml-1 underline font-semibold hover:text-yellow-100">
                  設定画面
                </Link>
                でGemini APIキーを設定してください
              </p>
            </div>
          )}
          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <dt className="text-sm text-white/70">{card.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-white">{card.value}</dd>
                <p className="text-sm text-white/60">{card.helper}</p>
              </div>
            ))}
          </dl>
        </div>

        <div
          id="category-insights"
          className="flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              上位3カテゴリー
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">学習状況</h2>
          </div>
          <ul className="space-y-3 mb-5">
            {categoryBreakdown.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/70 text-center">
                まだ記録がありません
              </li>
            )}
            {categoryBreakdown.map((item) => (
              <li
                key={item.category}
                className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{item.category}</p>
                    <p className="text-xs text-white/60">{item.total}問</p>
                  </div>
                  <span className="text-lg font-semibold text-emerald-300">
                    {percent(item.accuracy)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.min(100, Math.round(item.accuracy))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setIsCategoryDetailOpen(true)}
            className="w-full rounded-full border border-blue-400/40 bg-blue-400/10 px-6 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/20 hover:border-blue-400/60"
          >
            📊 カテゴリー詳細を見る
          </button>
        </div>
      </div>

      {/* 弱点診断モーダル */}
      <WeaknessAnalysisModal isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} />

      {/* カテゴリー詳細モーダル */}
      <CategoryDetailModal
        isOpen={isCategoryDetailOpen}
        onClose={() => setIsCategoryDetailOpen(false)}
      />
    </section>
  );
}
