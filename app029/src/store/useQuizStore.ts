import { create, StateCreator } from 'zustand';
import {
  Difficulty,
  Question,
  QuizSession,
  UserProgress,
  CategoryStat,
} from '@/lib/types';
import { getAllQuestions } from '@/lib/questionBank';
import { loadProgress, saveProgress } from '@/lib/storage';

export type QuizStatus = 'idle' | 'in-progress' | 'completed';

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  categoryBreakdown: Record<
    string,
    {
      correct: number;
      total: number;
      accuracy: number;
    }
  >;
}

export interface StartQuizPayload {
  category: string;
  difficulty: Difficulty;
  questions: Question[];
}

export interface QuizStoreState {
  status: QuizStatus;
  currentSession: QuizSession | null;
  lastResult: QuizResult | null;
  progress: UserProgress;
  questions: Question[];
  startQuiz: (payload: StartQuizPayload) => void;
  answerQuestion: (answer: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  recordResult: (correct: number, total: number, category: string) => void;
  addWrongQuestion: (questionId: string) => void;
  loadQuestions: () => void;
  addAIGeneratedQuestion: (question: Question) => void;
  currentQuestion: () => Question | null;
  score: () => { correct: number; total: number };
  categoryAccuracy: (category: string) => number;
  getWrongQuestions: () => Question[];
  reset: () => void;
}

const cryptoRandomUUID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? () => crypto.randomUUID()
    : () => `session-${Math.random().toString(36).slice(2, 10)}`;

const todayISODate = (): string => new Date().toISOString().split('T')[0];

const createInitialProgress = (): UserProgress =>
  loadProgress() ?? {
    totalQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    categoryStats: {},
    studyDays: 0,
    lastStudyDate: '',
    wrongQuestions: [],
  };

const cloneCategoryStats = (stats: Record<string, CategoryStat>): Record<string, CategoryStat> =>
  Object.entries(stats).reduce<Record<string, CategoryStat>>((acc, [key, value]) => {
    acc[key] = { ...value };
    return acc;
  }, {});

const cloneProgress = (progress: UserProgress): UserProgress => ({
  ...progress,
  categoryStats: cloneCategoryStats(progress.categoryStats),
  wrongQuestions: [...progress.wrongQuestions],
});

const computeResult = (session: QuizSession): QuizResult => {
  const { questions, answers } = session;
  const totalQuestions = questions.length;
  let correctAnswers = 0;

  const categoryBreakdown: QuizResult['categoryBreakdown'] = {};

  questions.forEach((question, index) => {
    const answered = answers[index];
    const isCorrect = answered === question.correctAnswer;

    if (!categoryBreakdown[question.category]) {
      categoryBreakdown[question.category] = {
        correct: 0,
        total: 0,
        accuracy: 0,
      };
    }

    const categoryStat = categoryBreakdown[question.category];
    categoryStat.total += 1;
    if (isCorrect) {
      categoryStat.correct += 1;
      correctAnswers += 1;
    }
  });

  Object.values(categoryBreakdown).forEach((stat) => {
    stat.accuracy = stat.total === 0 ? 0 : (stat.correct / stat.total) * 100;
  });

  const accuracy = totalQuestions === 0 ? 0 : (correctAnswers / totalQuestions) * 100;

  return {
    totalQuestions,
    correctAnswers,
    accuracy,
    categoryBreakdown,
  };
};

const mergeWrongQuestions = (current: string[], nextIds: string[]): string[] => {
  const merged = new Set(current);
  nextIds.forEach((id) => merged.add(id));
  return Array.from(merged);
};

const applySessionResultToProgress = (
  progress: UserProgress,
  session: QuizSession,
  result: QuizResult
): UserProgress => {
  const updated = cloneProgress(progress);
  updated.totalQuizzes += 1;
  updated.totalCorrect += result.correctAnswers;
  updated.totalQuestions += result.totalQuestions;

  Object.entries(result.categoryBreakdown).forEach(([category, stats]) => {
    const current = updated.categoryStats[category] ?? { correct: 0, total: 0 };
    updated.categoryStats[category] = {
      correct: current.correct + stats.correct,
      total: current.total + stats.total,
    };
  });

  const wrongIds = session.questions.reduce<string[]>((acc, question, index) => {
    if (session.answers[index] !== question.correctAnswer) {
      acc.push(question.id);
    }
    return acc;
  }, []);

  updated.wrongQuestions = mergeWrongQuestions(updated.wrongQuestions, wrongIds);

  const today = todayISODate();
  if (updated.lastStudyDate !== today) {
    updated.studyDays += 1;
    updated.lastStudyDate = today;
  }

  saveProgress(updated);
  return updated;
};

const recordCategoryProgress = (
  progress: UserProgress,
  correct: number,
  total: number,
  category: string
): UserProgress => {
  const updated = cloneProgress(progress);
  updated.totalQuizzes += 1;
  updated.totalCorrect += correct;
  updated.totalQuestions += total;

  const current = updated.categoryStats[category] ?? { correct: 0, total: 0 };
  updated.categoryStats[category] = {
    correct: current.correct + correct,
    total: current.total + total,
  };

  const today = todayISODate();
  if (updated.lastStudyDate !== today) {
    updated.studyDays += 1;
    updated.lastStudyDate = today;
  }

  saveProgress(updated);
  return updated;
};

export const createQuizStore: StateCreator<QuizStoreState> = (set, get) => ({
  status: 'idle',
  currentSession: null,
  lastResult: null,
  progress: createInitialProgress(),
  questions: [],

  startQuiz: ({ category, difficulty, questions }) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      set({
        status: 'idle',
        currentSession: null,
        lastResult: null,
      });
      return;
    }

    const session: QuizSession = {
      id: cryptoRandomUUID(),
      category,
      difficulty,
      questions,
      currentIndex: 0,
      answers: questions.map(() => null),
      startedAt: new Date(),
    };

    set({
      status: 'in-progress',
      currentSession: session,
      lastResult: null,
    });
  },

  answerQuestion: (answer) => {
    set((state) => {
      const { currentSession, status } = state;
      if (!currentSession || status !== 'in-progress') {
        return state;
      }

      if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
        return state;
      }

      const answers = [...currentSession.answers];
      answers[currentSession.currentIndex] = answer;

      return {
        currentSession: {
          ...currentSession,
          answers,
        },
      };
    });
  },

  nextQuestion: () => {
    set((state) => {
      const { currentSession } = state;
      if (!currentSession) {
        return state;
      }

      const nextIndex = Math.min(
        currentSession.currentIndex + 1,
        currentSession.questions.length - 1
      );

      if (nextIndex === currentSession.currentIndex) {
        return state;
      }

      return {
        currentSession: {
          ...currentSession,
          currentIndex: nextIndex,
        },
      };
    });
  },

  finishQuiz: () => {
    set((state) => {
      const { currentSession } = state;
      if (!currentSession) {
        return state;
      }

      const completedAt = new Date();
      const updatedSession: QuizSession = {
        ...currentSession,
        completedAt,
      };

      const result = computeResult(updatedSession);
      const updatedProgress = applySessionResultToProgress(
        state.progress,
        updatedSession,
        result
      );

      return {
        status: 'completed',
        currentSession: updatedSession,
        lastResult: result,
        progress: updatedProgress,
      };
    });
  },

  recordResult: (correct, total, category) => {
    set((state) => ({
      progress: recordCategoryProgress(state.progress, correct, total, category),
    }));
  },

  addWrongQuestion: (questionId) => {
    set((state) => {
      const progress = state.progress;
      if (progress.wrongQuestions.includes(questionId)) {
        return state;
      }

      const updated = cloneProgress(progress);
      updated.wrongQuestions.push(questionId);
      saveProgress(updated);
      return { progress: updated };
    });
  },

  loadQuestions: () => {
    const loaded = getAllQuestions();

    // Load AI generated questions from storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('investment-quiz-ai-questions');
      if (stored) {
        try {
          const aiQuestions = JSON.parse(stored);
          if (Array.isArray(aiQuestions)) {
            // Merge avoiding duplicates
            const existingIds = new Set(loaded.map(q => q.id));
            aiQuestions.forEach(q => {
              if (!existingIds.has(q.id)) {
                loaded.push(q);
              }
            });
          }
        } catch (e) {
          console.error('Failed to load AI questions', e);
        }
      }
    }

    set({ questions: loaded });
  },

  addAIGeneratedQuestion: (question) => {
    set((state) => {
      const filtered = state.questions.filter((q) => q.id !== question.id);
      const newQuestions = [...filtered, question];

      // Save to local storage
      if (typeof window !== 'undefined') {
        const aiQuestions = newQuestions.filter(q => q.id.startsWith('ai-'));
        localStorage.setItem('investment-quiz-ai-questions', JSON.stringify(aiQuestions));
      }

      return {
        questions: newQuestions,
      };
    });
  },

  currentQuestion: () => {
    const session = get().currentSession;
    if (!session) {
      return null;
    }
    return session.questions[session.currentIndex] ?? null;
  },

  score: (): { correct: number; total: number } => {
    const session = get().currentSession;
    if (!session) {
      return { correct: 0, total: 0 };
    }

    const correct = session.answers.reduce<number>((count, answer, index) => {
      if (answer === session.questions[index].correctAnswer) {
        return count + 1;
      }
      return count;
    }, 0);

    return { correct, total: session.questions.length };
  },

  categoryAccuracy: (category) => {
    const stats = get().progress.categoryStats[category];
    if (!stats || stats.total === 0) {
      return 0;
    }
    return Math.round((stats.correct / stats.total) * 100);
  },

  getWrongQuestions: () => {
    const { progress, questions } = get();
    const wrongIds = progress.wrongQuestions;

    if (wrongIds.length === 0) {
      return [];
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const result: Question[] = [];

    for (const id of wrongIds) {
      const question = questionMap.get(id);
      if (question) {
        result.push(question);
      }
    }

    return result;
  },

  reset: () => {
    set({
      status: 'idle',
      currentSession: null,
      lastResult: null,
    });
  },
});

export const useQuizStore = create<QuizStoreState>(createQuizStore);
