import { pickRandomQuestions } from '@/lib/questionBank';
import { Difficulty, Question } from '@/lib/types';

const DEFAULT_QUIZ_COUNT = 10;

export interface GenerateQuizOptions {
  category?: string;
  difficulty?: Difficulty;
  count?: number;
}

export interface QuizScore {
  total: number;
  correct: number;
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

const ensureMatchingLength = (answers: (number | null)[], questions: Question[]): void => {
  if (answers.length !== questions.length) {
    throw new Error('Answers length must match questions length');
  }
};

export const generateQuiz = ({
  category,
  difficulty,
  count = DEFAULT_QUIZ_COUNT,
}: GenerateQuizOptions = {}): Question[] =>
  pickRandomQuestions({
    category,
    difficulty,
    count,
  });

export const checkAnswer = (question: Question, answerIndex: number | null): boolean => {
  if (answerIndex === null) {
    return false;
  }
  return question.correctAnswer === answerIndex;
};

export const calculateScore = (
  answers: (number | null)[],
  questions: Question[]
): QuizScore => {
  ensureMatchingLength(answers, questions);

  let correct = 0;
  const categoryStats: QuizScore['categoryBreakdown'] = {};

  answers.forEach((answer, index) => {
    const question = questions[index];
    const isCorrect = checkAnswer(question, answer);

    if (!categoryStats[question.category]) {
      categoryStats[question.category] = {
        correct: 0,
        total: 0,
        accuracy: 0,
      };
    }

    const stats = categoryStats[question.category];
    stats.total += 1;
    if (isCorrect) {
      stats.correct += 1;
      correct += 1;
    }
  });

  Object.values(categoryStats).forEach((stats) => {
    stats.accuracy = stats.total === 0 ? 0 : (stats.correct / stats.total) * 100;
  });

  const total = questions.length;
  const accuracy = total === 0 ? 0 : (correct / total) * 100;

  return {
    total,
    correct,
    accuracy,
    categoryBreakdown: categoryStats,
  };
};

export const __testing = {
  DEFAULT_QUIZ_COUNT,
};
