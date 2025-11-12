import questions from '@/data/questions.json';
import { Difficulty, Question } from '@/lib/types';

const BASE_QUESTIONS: Question[] = (questions as Question[]).map((question) => ({
  ...question,
  choices: [...question.choices],
}));

const cloneQuestion = (question: Question): Question => ({
  ...question,
  choices: [...question.choices],
});

export const getAllQuestions = (): Question[] => BASE_QUESTIONS.map(cloneQuestion);

export const getQuestionsByCategory = (category: string): Question[] =>
  BASE_QUESTIONS.filter((question) => question.category === category).map(cloneQuestion);

export const getQuestionsByDifficulty = (difficulty: Difficulty): Question[] =>
  BASE_QUESTIONS.filter((question) => question.difficulty === difficulty).map(cloneQuestion);

interface PickRandomOptions {
  category?: string;
  difficulty?: Difficulty;
  count: number;
}

const shuffleInPlace = <T>(items: T[]): void => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = items[index];
    items[index] = items[randomIndex];
    items[randomIndex] = temp;
  }
};

export const pickRandomQuestions = ({ category, difficulty, count }: PickRandomOptions): Question[] => {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Question count must be a positive integer');
  }

  const filtered = BASE_QUESTIONS.filter((question) => {
    const categoryMatch = category ? question.category === category : true;
    const difficultyMatch = difficulty ? question.difficulty === difficulty : true;
    return categoryMatch && difficultyMatch;
  });

  if (filtered.length < count) {
    throw new Error('Not enough questions');
  }

  const pool = filtered.map(cloneQuestion);
  shuffleInPlace(pool);
  return pool.slice(0, count);
};

export const getAvailableCategories = (): string[] =>
  Array.from(new Set(BASE_QUESTIONS.map((question) => question.category))).sort();

export const getAvailableDifficulties = (): Difficulty[] =>
  Array.from(new Set(BASE_QUESTIONS.map((question) => question.difficulty))) as Difficulty[];

export const __testing = {
  BASE_QUESTIONS,
  shuffleInPlace,
};
