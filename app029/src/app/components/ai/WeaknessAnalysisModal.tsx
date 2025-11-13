/**
 * WeaknessAnalysisModal.tsx
 * 弱点診断モーダルコンポーネント
 */

'use client';

import { useState } from 'react';
import { analyzeWeakness } from '@/lib/geminiService';
import { useQuizStore } from '@/store/useQuizStore';
import type { WeaknessAnalysis } from '@/lib/types';

interface WeaknessAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeaknessAnalysisModal({ isOpen, onClose }: WeaknessAnalysisModalProps) {
  const progress = useQuizStore((state) => state.progress);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WeaknessAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (progress.totalQuestions === 0) {
      setError('まずはクイズに挑戦して、学習データを蓄積してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeWeakness(progress);
      setAnalysis(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('API key is not configured')) {
          setError('APIキーが設定されていません。設定ページで設定してください。');
        } else if (err.message.includes('Max retries reached')) {
          setError('APIの呼び出しに失敗しました。しばらくしてからもう一度お試しください。');
        } else {
          setError('診断に失敗しました。もう一度お試しください。');
        }
      } else {
        setError('予期しないエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAnalyze();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">🔍 弱点診断</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 学習データ不足 */}
          {progress.totalQuestions === 0 && (
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 text-center">
              <p className="text-blue-400">まずはクイズに挑戦して、学習データを蓄積してください。</p>
            </div>
          )}

          {/* 診断前の状態 */}
          {!analysis && !isLoading && !error && progress.totalQuestions > 0 && (
            <div className="space-y-4">
              <p className="text-white/80">
                これまでの学習データを分析し、あなたの弱点カテゴリーと学習アドバイスを提供します。
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-indigo-700"
                  aria-label="診断する"
                >
                  診断する
                </button>
              </div>
            </div>
          )}

          {/* ローディング */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>
              <p className="mt-4 text-white/80">診断中...</p>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6">
                <p className="text-rose-400">{error}</p>
              </div>
              <div className="flex justify-center gap-3">
                {!error.includes('まずはクイズ') && (
                  <button
                    onClick={handleRetry}
                    className="rounded-full bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
                  >
                    再試行
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/20 px-6 py-2 font-semibold text-white/90 transition hover:border-white/40"
                  aria-label="閉じる"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {/* 診断結果 */}
          {analysis && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">📊 診断結果</h3>

                {/* 弱点カテゴリー */}
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-1">弱点カテゴリー:</p>
                  <p className="text-lg font-semibold text-rose-400">{analysis.weakestCategory}</p>
                </div>

                {/* 分析 */}
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-1">📝 分析:</p>
                  <p className="text-white/90">{analysis.analysis}</p>
                </div>

                {/* アドバイス */}
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-1">💡 アドバイス:</p>
                  <p className="text-white/90">{analysis.advice}</p>
                </div>

                {/* 推奨トピック */}
                <div>
                  <p className="text-sm text-white/60 mb-2">📚 推奨トピック:</p>
                  <ul className="space-y-2">
                    {analysis.recommendedTopics.map((topic, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <span className="text-white/90">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setError(null);
                  }}
                  className="rounded-full bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
                >
                  再診断する
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/20 px-6 py-2 font-semibold text-white/90 transition hover:border-white/40"
                  aria-label="閉じる"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
