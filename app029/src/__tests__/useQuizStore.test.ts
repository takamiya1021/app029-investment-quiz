import { act } from '@testing-library/react';
import { create } from 'zustand';
import { Question } from '@/lib/types';
import { createQuizStore } from '@/store/useQuizStore';

const sampleQuestions: Question[] = [
  {
    id: 'q1',
    category: '株式投資の基本',
    difficulty: 'beginner',
    question: '株式の主な利益源は？',
    choices: ['配当と値上がり益', '利息', '家賃', '給与'],
    correctAnswer: 0,
    explanation: '株式は配当と値上がり益が期待できる。',
  },
  {
    id: 'q2',
    category: 'リスク管理',
    difficulty: 'beginner',
    question: 'リスク分散の例は？',
    choices: ['1銘柄集中', '複数資産に投資', '現金のみ', '借金'],
    correctAnswer: 1,
    explanation: '複数資産に広げるのがリスク分散。',
  },
];

describe('useQuizStore', () => {
  it('starts a quiz and initialises session state', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
    });

    const state = store.getState();
    expect(state.status).toBe('in-progress');
    expect(state.currentSession).not.toBeNull();
    expect(state.currentSession?.questions).toHaveLength(2);
    expect(state.currentSession?.answers).toEqual([null, null]);
  });

  it('records an answer without advancing index', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
    });

    act(() => {
      store.getState().answerQuestion(0);
    });

    const state = store.getState();
    expect(state.currentSession?.answers[0]).toBe(0);
    expect(state.currentSession?.currentIndex).toBe(0);
  });

  it('advances to next question safely', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
    });

    act(() => {
      store.getState().nextQuestion();
    });

    expect(store.getState().currentSession?.currentIndex).toBe(1);
  });

  it('finishes a quiz and records result', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
      store.getState().answerQuestion(0);
      store.getState().nextQuestion();
      store.getState().answerQuestion(2);
      store.getState().finishQuiz();
    });

    const state = store.getState();
    expect(state.status).toBe('completed');
    expect(state.currentSession?.completedAt).toBeInstanceOf(Date);
    expect(state.lastResult).toMatchObject({
      totalQuestions: 2,
      correctAnswers: 1,
    });
  });

  it('collects wrong question IDs', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().addWrongQuestion('q123');
      store.getState().addWrongQuestion('q456');
    });

    expect(store.getState().wrongQuestions).toEqual(['q123', 'q456']);
  });
});
