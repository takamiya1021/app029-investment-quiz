import {
  isAppSettings,
  isQuestion,
  isQuizSession,
  isUserProgress,
} from '@/lib/types';

const validQuestion = {
  id: 'q001',
  category: '株式投資の基本',
  difficulty: 'beginner',
  question: '株式を購入する主な理由は？',
  choices: ['配当と値上がり益', '利息', '家賃', '給料'],
  correctAnswer: 0,
  explanation: '配当と値上がり益が主な収益源です。',
};

describe('domain type guards', () => {
  it('accepts a valid Question structure', () => {
    expect(isQuestion(validQuestion)).toBe(true);
  });

  it('rejects Question with invalid correctAnswer', () => {
    const invalid = { ...validQuestion, correctAnswer: 10 };
    expect(isQuestion(invalid)).toBe(false);
  });

  it('accepts a valid QuizSession structure', () => {
    const session = {
      id: 'session-1',
      category: '株式投資の基本',
      difficulty: 'beginner',
      questions: [validQuestion],
      currentIndex: 0,
      answers: [null],
      startedAt: new Date(),
    };
    expect(isQuizSession(session)).toBe(true);
  });

  it('rejects QuizSession with mismatched answers length', () => {
    const session = {
      id: 'session-1',
      category: '株式投資の基本',
      difficulty: 'beginner',
      questions: [validQuestion],
      currentIndex: 0,
      answers: [null, 1],
      startedAt: new Date(),
    };
    expect(isQuizSession(session)).toBe(false);
  });

  it('accepts a valid UserProgress structure', () => {
    const progress = {
      totalQuizzes: 1,
      totalCorrect: 8,
      totalQuestions: 10,
      categoryStats: {
        '株式投資の基本': { correct: 8, total: 10 },
      },
      studyDays: 3,
      lastStudyDate: '2025-01-01',
      wrongQuestions: ['q002'],
    };
    expect(isUserProgress(progress)).toBe(true);
  });

  it('rejects UserProgress when totals are inconsistent', () => {
    const progress = {
      totalQuizzes: 1,
      totalCorrect: 12,
      totalQuestions: 10,
      categoryStats: {},
      studyDays: 1,
      lastStudyDate: '2025-01-01',
      wrongQuestions: [],
    };
    expect(isUserProgress(progress)).toBe(false);
  });

  it('accepts valid AppSettings structure', () => {
    const settings = {
      geminiApiKey: 'dummy',
      showExplanationImmediately: true,
      shuffleChoices: false,
    };
    expect(isAppSettings(settings)).toBe(true);
  });

  it('rejects AppSettings with invalid flag types', () => {
    const settings = {
      showExplanationImmediately: 'yes',
      shuffleChoices: false,
    };
    expect(isAppSettings(settings)).toBe(false);
  });
});
