export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  category: string;
  difficulty: Difficulty;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  tags?: string[];
  aiGenerated?: boolean;
  createdAt?: Date;
}

export interface QuizSession {
  id: string;
  category: string;
  difficulty: Difficulty;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  startedAt: Date;
  completedAt?: Date;
}

export interface CategoryStat {
  correct: number;
  total: number;
}

export interface UserProgress {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  categoryStats: Record<string, CategoryStat>;
  studyDays: number;
  lastStudyDate: string;
  wrongQuestions: string[];
}

export interface AppSettings {
  geminiApiKey?: string;
  showExplanationImmediately: boolean;
  shuffleChoices: boolean;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidDifficulty = (value: unknown): value is Difficulty =>
  value === 'beginner' || value === 'intermediate' || value === 'advanced';

const isStringArray = (value: unknown, length?: number): value is string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'string') &&
  (length === undefined || value.length === length);

const isChoiceIndex = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;

export const isQuestion = (value: unknown): value is Question => {
  if (!isObject(value)) return false;

  const {
    id,
    category,
    difficulty,
    question,
    choices,
    correctAnswer,
    explanation,
    tags,
    aiGenerated,
    createdAt,
  } = value;

  if (
    typeof id !== 'string' ||
    typeof category !== 'string' ||
    !isValidDifficulty(difficulty) ||
    typeof question !== 'string' ||
    !isStringArray(choices, 4) ||
    !isChoiceIndex(correctAnswer) ||
    typeof explanation !== 'string'
  ) {
    return false;
  }

  if (tags && !isStringArray(tags)) return false;
  if (typeof aiGenerated !== 'undefined' && typeof aiGenerated !== 'boolean') return false;
  if (typeof createdAt !== 'undefined' && !(createdAt instanceof Date)) return false;

  return true;
};

export const isQuizSession = (value: unknown): value is QuizSession => {
  if (!isObject(value)) return false;

  const { id, category, difficulty, questions, currentIndex, answers, startedAt, completedAt } =
    value;

  if (
    typeof id !== 'string' ||
    typeof category !== 'string' ||
    !isValidDifficulty(difficulty) ||
    !Array.isArray(questions) ||
    typeof currentIndex !== 'number' ||
    !Array.isArray(answers) ||
    !(startedAt instanceof Date)
  ) {
    return false;
  }

  if (!questions.every(isQuestion)) return false;

  const validAnswers = answers.every(
    (answer) => answer === null || isChoiceIndex(answer)
  );
  if (!validAnswers) return false;

  if (answers.length !== questions.length) return false;
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex > questions.length) {
    return false;
  }

  if (typeof completedAt !== 'undefined' && !(completedAt instanceof Date)) return false;

  return true;
};

const isCategoryStat = (value: unknown): value is CategoryStat => {
  if (!isObject(value)) return false;
  const { correct, total } = value;
  return (
    typeof correct === 'number' &&
    Number.isInteger(correct) &&
    correct >= 0 &&
    typeof total === 'number' &&
    Number.isInteger(total) &&
    total >= 0 &&
    correct <= total
  );
};

export const isUserProgress = (value: unknown): value is UserProgress => {
  if (!isObject(value)) return false;

  const {
    totalQuizzes,
    totalCorrect,
    totalQuestions,
    categoryStats,
    studyDays,
    lastStudyDate,
    wrongQuestions,
  } = value;

  if (
    typeof totalQuizzes !== 'number' ||
    typeof totalCorrect !== 'number' ||
    typeof totalQuestions !== 'number' ||
    typeof studyDays !== 'number' ||
    typeof lastStudyDate !== 'string' ||
    !Array.isArray(wrongQuestions)
  ) {
    return false;
  }

  if (
    !Number.isInteger(totalQuizzes) ||
    totalQuizzes < 0 ||
    !Number.isInteger(totalCorrect) ||
    totalCorrect < 0 ||
    !Number.isInteger(totalQuestions) ||
    totalQuestions < 0 ||
    !Number.isInteger(studyDays) ||
    studyDays < 0
  ) {
    return false;
  }

  if (totalCorrect > totalQuestions) return false;
  if (!wrongQuestions.every((id) => typeof id === 'string')) return false;

  if (!isObject(categoryStats)) return false;
  if (!Object.values(categoryStats).every(isCategoryStat)) return false;

  const aggregated = Object.values(categoryStats).reduce(
    (acc, stat) => ({
      correct: acc.correct + stat.correct,
      total: acc.total + stat.total,
    }),
    { correct: 0, total: 0 }
  );

  if (aggregated.correct < totalCorrect || aggregated.total < totalQuestions) {
    return false;
  }

  return true;
};

export const isAppSettings = (value: unknown): value is AppSettings => {
  if (!isObject(value)) return false;
  const { geminiApiKey, showExplanationImmediately, shuffleChoices } = value;

  if (typeof showExplanationImmediately !== 'boolean' || typeof shuffleChoices !== 'boolean') {
    return false;
  }

  if (typeof geminiApiKey !== 'undefined' && typeof geminiApiKey !== 'string') {
    return false;
  }

  return true;
};
