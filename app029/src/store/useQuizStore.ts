import { create, StateCreator } from 'zustand';
import { Difficulty, Question, QuizSession } from '@/lib/types';

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
  wrongQuestions: string[];
  startQuiz: (payload: StartQuizPayload) => void;
  answerQuestion: (answer: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  recordResult: () => QuizResult | null;
  addWrongQuestion: (questionId: string) => void;
  reset: () => void;
}

const cryptoRandomUUID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? () => crypto.randomUUID()
    : () => `session-${Math.random().toString(36).slice(2, 10)}`;

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

export const createQuizStore: StateCreator<QuizStoreState> = (set, get) => ({
  status: 'idle',
  currentSession: null,
  lastResult: null,
  wrongQuestions: [],

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
    const session = get().currentSession;
    if (!session) {
      return;
    }

    const completedAt = new Date();
    const updatedSession: QuizSession = {
      ...session,
      completedAt,
    };

    const result = computeResult(updatedSession);

    set({
      status: 'completed',
      currentSession: updatedSession,
      lastResult: result,
    });
  },

  recordResult: () => {
    const session = get().currentSession;
    if (!session) {
      return null;
    }

    const result = computeResult(session);
    set({ lastResult: result });
    return result;
  },

  addWrongQuestion: (questionId) => {
    set((state) => {
      if (state.wrongQuestions.includes(questionId)) {
        return state;
      }
      return {
        wrongQuestions: [...state.wrongQuestions, questionId],
      };
    });
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
