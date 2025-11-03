import { Question } from '@/lib/types';
import {
  getAllQuestions,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
  pickRandomQuestions,
} from '@/lib/questionBank';

describe('question bank data', () => {
  it('provides at least 50 curated questions across categories', async () => {
    const { default: questions } = await import('@/data/questions.json');

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThanOrEqual(50);

    const categories = new Set(questions.map((item: Question) => item.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it('ensures each question conforms to the Question interface', async () => {
    const { default: questions } = await import('@/data/questions.json');

    questions.forEach((item: Question) => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(['beginner', 'intermediate', 'advanced']).toContain(item.difficulty);
      expect(typeof item.question).toBe('string');
      expect(Array.isArray(item.choices)).toBe(true);
      expect(item.choices).toHaveLength(4);
      item.choices.forEach((choice) => expect(typeof choice).toBe('string'));
      expect(Number.isInteger(item.correctAnswer)).toBe(true);
      expect(item.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(item.correctAnswer).toBeLessThan(4);
      expect(typeof item.explanation).toBe('string');
    });
  });

  describe('question bank module', () => {
    it('returns a defensive copy of all questions', () => {
      const all = getAllQuestions();
      expect(all.length).toBeGreaterThanOrEqual(50);

      all[0].question = 'mutated?';
      const fresh = getAllQuestions();
      expect(fresh[0].question).not.toBe('mutated?');
    });

    it('filters questions by category', () => {
      const category = '株式投資の基本';
      const result = getQuestionsByCategory(category);

      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.every((q) => q.category === category)).toBe(true);
    });

    it('filters questions by difficulty', () => {
      const result = getQuestionsByDifficulty('beginner');
      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(result.every((q) => q.difficulty === 'beginner')).toBe(true);
    });

    it('picks random questions for a category without duplicates', () => {
      const category = '株式投資の基本';
      const count = 5;
      const sample = pickRandomQuestions({ category, count });

      expect(sample).toHaveLength(count);
      expect(sample.every((q) => q.category === category)).toBe(true);
      expect(new Set(sample.map((q) => q.id)).size).toBe(count);
    });

    it('picks random questions constrained by difficulty', () => {
      const count = 4;
      const sample = pickRandomQuestions({ difficulty: 'advanced', count });

      expect(sample).toHaveLength(count);
      expect(sample.every((q) => q.difficulty === 'advanced')).toBe(true);
    });

    it('throws when requested count exceeds available pool', () => {
      expect(() =>
        pickRandomQuestions({ category: '債券投資の基本', difficulty: 'advanced', count: 5 })
      ).toThrow('Not enough questions');
    });
  });
});
