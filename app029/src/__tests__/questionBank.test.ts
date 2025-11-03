import { Question } from '@/lib/types';

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
});
