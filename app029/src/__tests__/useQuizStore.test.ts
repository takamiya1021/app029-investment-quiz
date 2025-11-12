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

beforeEach(() => {
  localStorage.clear();
});

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
    expect(state.progress.totalQuizzes).toBe(1);
    expect(state.progress.totalQuestions).toBe(2);
    expect(state.progress.totalCorrect).toBe(1);
    expect(state.progress.categoryStats['株式投資の基本']).toMatchObject({ correct: 1, total: 1 });
    expect(state.progress.categoryStats['リスク管理']).toMatchObject({ correct: 0, total: 1 });
    expect(state.progress.wrongQuestions).toContain('q2');
  });

  it('collects wrong question IDs through explicit calls', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().addWrongQuestion('q123');
      store.getState().addWrongQuestion('q456');
      store.getState().addWrongQuestion('q123');
    });

    expect(store.getState().progress.wrongQuestions).toEqual(['q123', 'q456']);
  });

  it('loads questions into state', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().loadQuestions();
    });
    expect(store.getState().questions.length).toBeGreaterThanOrEqual(50);
  });

  it('adds AI generated questions', () => {
    const store = create(createQuizStore);
    const aiQuestion: Question = {
      id: 'ai-1',
      category: 'AI',
      difficulty: 'intermediate',
      question: 'AI generated?',
      choices: ['Yes', 'No', 'Maybe', 'N/A'],
      correctAnswer: 0,
      explanation: 'Sample',
    };

    act(() => {
      store.getState().addAIGeneratedQuestion(aiQuestion);
    });

    expect(store.getState().questions.find((q) => q.id === 'ai-1')).toBeDefined();
  });

  it('returns the current question helper', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
    });

    expect(store.getState().currentQuestion()?.id).toBe('q1');

    act(() => {
      store.getState().nextQuestion();
    });

    expect(store.getState().currentQuestion()?.id).toBe('q2');
  });

  it('returns score helper based on session answers', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
      store.getState().answerQuestion(0);
      store.getState().nextQuestion();
      store.getState().answerQuestion(0);
    });

    expect(store.getState().score()).toEqual({ correct: 1, total: 2 });
  });

  it('calculates category accuracy from progress stats', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().recordResult(4, 5, '株式投資の基本');
    });

    expect(store.getState().categoryAccuracy('株式投資の基本')).toBe(80);
    expect(store.getState().categoryAccuracy('リスク管理')).toBe(0);
  });

  it('retrieves wrong questions for review mode', () => {
    const store = create(createQuizStore);
    act(() => {
      // Add sample questions to the store's questions state
      sampleQuestions.forEach((q) => {
        store.getState().addAIGeneratedQuestion(q);
      });

      // Start a quiz and answer incorrectly
      store.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: sampleQuestions,
      });
      store.getState().answerQuestion(0); // correct for q1
      store.getState().nextQuestion();
      store.getState().answerQuestion(0); // incorrect for q2
      store.getState().finishQuiz();
    });

    const wrongQuestions = store.getState().getWrongQuestions();
    expect(wrongQuestions).toBeDefined();
    expect(wrongQuestions.length).toBeGreaterThan(0);
    expect(wrongQuestions.some((q) => q.id === 'q2')).toBe(true);
  });

  it('returns empty array when no wrong questions exist', () => {
    const store = create(createQuizStore);
    act(() => {
      store.getState().loadQuestions();
    });

    const wrongQuestions = store.getState().getWrongQuestions();
    expect(wrongQuestions).toEqual([]);
  });

  it('filters out questions that no longer exist in question bank', () => {
    const store = create(createQuizStore);
    act(() => {
      // Manually set a wrong question ID that doesn't exist
      store.getState().addWrongQuestion('non-existent-id');
      store.getState().loadQuestions();
    });

    const wrongQuestions = store.getState().getWrongQuestions();
    expect(wrongQuestions.every((q) => q.id !== 'non-existent-id')).toBe(true);
  });
});
