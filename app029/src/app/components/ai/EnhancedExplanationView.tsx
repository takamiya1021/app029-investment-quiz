/**
 * EnhancedExplanationView.tsx
 * AI解説強化ビューコンポーネント（Phase 13-2）
 *
 * 責務: 強化解説の表示と取得制御
 * - enhanceExplanation API呼び出し
 * - キャッシュ管理（同じ問題の解説は再取得しない）
 * - ローディング状態管理
 * - エラーハンドリング
 */

'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question } from '@/lib/types';
import { enhanceExplanation } from '@/lib/geminiService';
import { hasApiKey } from '@/lib/apiKeyManager';

interface EnhancedExplanationViewProps {
  question: Question;
}

export default function EnhancedExplanationView({ question }: EnhancedExplanationViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // キャッシュ管理（同じ問題IDの解説は再取得しない）
  const enhancedCache = useRef<Map<string, string>>(new Map());

  // APIキー未設定時は非表示
  if (!hasApiKey()) {
    return null;
  }

  /**
   * 解説強化を実行
   * キャッシュがあればそれを使用し、なければAPI呼び出し
   */
  const handleEnhance = async () => {
    // 既に展開済みで解説がある場合は折りたたむだけ
    if (isExpanded && enhancedText) {
      setIsExpanded(false);
      return;
    }

    // キャッシュチェック
    const cached = enhancedCache.current.get(question.id);
    if (cached) {
      setEnhancedText(cached);
      setIsExpanded(true);
      setError(null);
      return;
    }

    // API呼び出し
    setIsLoading(true);
    setError(null);

    try {
      const enhanced = await enhanceExplanation(question);

      // キャッシュに保存
      enhancedCache.current.set(question.id, enhanced);

      setEnhancedText(enhanced);
      setIsExpanded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * リトライ処理
   * エラー時にキャッシュをクリアして再取得
   */
  const handleRetry = () => {
    enhancedCache.current.delete(question.id);
    setEnhancedText(null);
    setError(null);
    handleEnhance();
  };

  return (
    <div className="mt-4">
      {/* ボタンエリア */}
      <div className="flex justify-end">
        <button
          onClick={handleEnhance}
          disabled={isLoading}
          className={`
            flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
            transition-all duration-200
            ${
              isLoading
                ? 'cursor-not-allowed bg-slate-700/50 text-slate-400'
                : isExpanded && enhancedText
                  ? 'bg-slate-700/50 text-slate-200 hover:bg-slate-700'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
            }
          `}
          aria-label={isExpanded && enhancedText ? '折りたたむ' : 'もっと詳しく'}
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              <span>解説を生成中...</span>
            </>
          ) : isExpanded && enhancedText ? (
            <>
              <span>▲</span>
              <span>折りたたむ</span>
            </>
          ) : (
            <>
              <span>📖</span>
              <span>もっと詳しく</span>
            </>
          )}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-400">解説の生成に失敗しました: {error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 rounded-lg bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            再試行
          </button>
        </div>
      )}

      {/* 強化解説表示 */}
      {isExpanded && enhancedText && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h4 className="text-sm font-semibold text-emerald-200">AI解説</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-white/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {enhancedText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
