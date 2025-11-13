'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuizStore } from '@/store/useQuizStore';
import { generateQuiz, generateReviewQuiz } from '@/lib/quizEngine';
import { getAvailableCategories, getQuestionsByCategory } from '@/lib/questionBank';
import type { Difficulty, Question } from '@/lib/types';
import { hasApiKey } from '@/lib/apiKeyManager';
import ExplanationCard from './ExplanationCard';
import AIQuestionGeneratorModal from '@/app/components/ai/AIQuestionGeneratorModal';

const DEFAULT_DIFFICULTY: Difficulty = 'beginner';

const categories = getAvailableCategories();

const difficultyLabel: Record<Difficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

export default function QuizShell() {
  const status = useQuizStore((state) => state.status);
  const currentSession = useQuizStore((state) => state.currentSession);
  const lastResult = useQuizStore((state) => state.lastResult);
  const loadQuestions = useQuizStore((state) => state.loadQuestions);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  if (status === 'completed' && lastResult) {
    return <CompletedView />;
  }

  if (!currentSession || status === 'idle') {
    return <CategoryView />;
  }

  return <QuestionView />;
}

function CategoryView() {
  const startQuiz = useQuizStore((state) => state.startQuiz);
  const categoryAccuracy = useQuizStore((state) => state.categoryAccuracy);
  const getWrongQuestions = useQuizStore((state) => state.getWrongQuestions);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const hasKey = hasApiKey();

  const wrongQuestions = getWrongQuestions();
  const hasWrongQuestions = wrongQuestions.length > 0;

  const handleStart = (category: string) => {
    const available = getQuestionsByCategory(category).length;
    if (available === 0) {
      console.warn(`No questions available for ${category}`);
      return;
    }
    const count = Math.min(10, available);
    try {
      const quiz = generateQuiz({
        category,
        count,
      });
      startQuiz({
        category,
        difficulty: DEFAULT_DIFFICULTY,
        questions: quiz,
      });
    } catch (error) {
      console.error('Failed to start quiz', error);
    }
  };

  const handleRandomStart = () => {
    const quiz = generateQuiz({ count: 10 });
    startQuiz({
      category: 'ランダム',
      difficulty: DEFAULT_DIFFICULTY,
      questions: quiz,
    });
  };

  const handleReviewStart = () => {
    const reviewCount = Math.min(10, wrongQuestions.length);
    const quiz = generateReviewQuiz(wrongQuestions, reviewCount);
    startQuiz({
      category: '復習モード',
      difficulty: DEFAULT_DIFFICULTY,
      questions: quiz,
    });
  };

  /**
   * AI生成問題でクイズを開始（Phase 13-3）
   */
  const handleGenerated = (questions: Question[], category: string) => {
    startQuiz({
      category: `AI: ${category}`,
      difficulty: DEFAULT_DIFFICULTY,
      questions,
    });
    setIsGeneratorOpen(false);
  };

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">クイズカテゴリー</p>
          <h1 className="mt-3 text-3xl font-semibold">学びたいテーマを選んでください</h1>
          <p className="mt-2 text-white/70">
            どのカテゴリーも10問セット。必要に応じてランダム出題で総合力をチェックできます。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRandomStart}
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
            >
              ランダム10問
            </button>
            {hasWrongQuestions && (
              <button
                type="button"
                onClick={handleReviewStart}
                className="rounded-full border border-orange-400/40 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-300 transition hover:border-orange-400/60 hover:bg-orange-400/20"
              >
                復習モード（{wrongQuestions.length}問）
              </button>
            )}
            {/* AI問題生成ボタン (Phase 13-3) */}
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              disabled={!hasKey}
              className={`
                rounded-full border px-5 py-3 text-sm font-semibold transition
                ${
                  hasKey
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-400/20'
                    : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                }
              `}
              title={hasKey ? 'AI問題を生成' : 'APIキーを設定してください'}
            >
              ✨ AI問題を生成
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:border-white/40"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleStart(category)}
              className="flex flex-col rounded-3xl border border-white/15 bg-white/5 p-5 text-left transition hover:border-emerald-300/50 hover:bg-white/10"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {difficultyLabel[DEFAULT_DIFFICULTY]}
              </span>
              <span className="mt-2 text-xl font-semibold text-white">{category}</span>
              <span className="mt-1 text-sm text-white/70">
                正答率 {categoryAccuracy(category)}%
              </span>
            </button>
          ))}
        </div>

        {/* AI問題生成モーダル (Phase 13-3) */}
        <AIQuestionGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          onGenerated={handleGenerated}
        />
      </div>
    </section>
  );
}

function QuestionView() {
  const session = useQuizStore((state) => state.currentSession)!;
  const answerQuestion = useQuizStore((state) => state.answerQuestion);
  const nextQuestion = useQuizStore((state) => state.nextQuestion);
  const finishQuiz = useQuizStore((state) => state.finishQuiz);

  const currentIndex = session.currentIndex;
  const question = session.questions[currentIndex];
  const selectedAnswer = session.answers[currentIndex];
  const total = session.questions.length;
  const isLast = currentIndex === total - 1;

  const handleChoice = (choiceIndex: number) => {
    answerQuestion(choiceIndex);
  };

  const handleNext = () => {
    if (isLast) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  };

  const countdownLabel = `第${currentIndex + 1}問 / 全${total}問`;

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-300">{question.category}</p>
          <h1 className="text-3xl font-semibold">投資クイズ</h1>
          <p className="text-white/70">{countdownLabel}</p>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </header>

        <article className="rounded-3xl border border-white/15 bg-slate-900/50 p-6 shadow-2xl backdrop-blur">
          <p className="text-lg text-white/80">{question.question}</p>
          <div className="mt-6 grid gap-4">
            {question.choices.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleChoice(index)}
                  aria-label={`選択肢 ${index + 1}`}
                  className={`flex flex-col rounded-2xl border px-5 py-4 text-left transition ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-white/15 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-semibold text-white/60">選択肢 {index + 1}</span>
                  <span className="mt-1 text-base font-medium text-white">{choice}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/40 disabled:text-slate-600"
            >
              {isLast ? '結果を見る' : '次の問題へ'}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function CompletedView() {
  const lastResult = useQuizStore((state) => state.lastResult)!;
  const session = useQuizStore((state) => state.currentSession);
  const reset = useQuizStore((state) => state.reset);

  const stats = useMemo(() => {
    return Object.entries(lastResult.categoryBreakdown)
      .map(([category, values]) => ({
        category,
        accuracy: values.accuracy,
        correct: values.correct,
        total: values.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [lastResult.categoryBreakdown]);

  if (!session) {
    return (
      <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center backdrop-blur">
          <h1 className="text-2xl font-semibold">結果を表示できません</h1>
          <p className="mt-2 text-white/70">再度クイズを受けてください。</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900"
          >
            クイズ一覧へ戻る
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-wide text-emerald-300">クイズ結果</p>
        <h1 className="text-3xl font-semibold">お疲れさまでした！</h1>
        <p className="text-white/70">
          {lastResult.totalQuestions}問中{lastResult.correctAnswers}問正解（
          {Math.round(lastResult.accuracy)}%）
        </p>

        <dl className="grid gap-4 sm:grid-cols-2">
          {stats.map((item) => (
            <div key={item.category} className="rounded-2xl border border-white/10 p-4">
              <dt className="text-sm text-white/70">{item.category}</dt>
              <dd className="text-2xl font-semibold text-white">
                {Math.round(item.accuracy)}%
                <span className="ml-2 text-sm text-white/60">
                  {item.correct}/{item.total}問
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
          >
            もう一度チャレンジ
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80"
          >
            ホームに戻る
          </Link>
        </div>

        <div className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold text-white">問題ごとの解説</h2>
          <p className="text-sm text-white/70">あなたの回答と解説を振り返りましょう。</p>
          <div className="space-y-4">
            {session.questions.map((question, index) => (
              <ExplanationCard
                key={question.id}
                question={question}
                userAnswer={session.answers[index]}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
