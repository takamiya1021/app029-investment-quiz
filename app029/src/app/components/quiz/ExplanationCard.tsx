'use client';

import { useMemo } from 'react';
import { Question } from '@/lib/types';

interface ExplanationCardProps {
  question: Question;
  userAnswer: number | null;
  index: number;
}

export default function ExplanationCard({ question, userAnswer, index }: ExplanationCardProps) {
  const isCorrect = userAnswer === question.correctAnswer;
  const statusLabel = isCorrect ? '正解' : '不正解';

  const answerText = useMemo(() => {
    if (userAnswer === null) return '未回答';
    return question.choices[userAnswer];
  }, [question.choices, userAnswer]);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <header className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-emerald-200">第{index + 1}問</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isCorrect ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'
          }`}
        >
          {statusLabel}
        </span>
      </header>
      <h3 className="mt-2 text-base font-semibold text-white">{question.question}</h3>
      <div className="mt-4 space-y-1 text-sm text-white/80">
        <p>
          <span className="font-semibold text-white/90">あなたの回答:</span> {answerText}
        </p>
        <p>
          <span className="font-semibold text-white/90">正解:</span> {question.choices[question.correctAnswer]}
        </p>
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/80">{question.explanation}</p>
    </article>
  );
}
