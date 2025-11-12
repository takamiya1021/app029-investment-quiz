import {
  generateQuiz,
  checkAnswer,
  calculateScore,
} from '@/lib/quizEngine';

describe('quizEngine', () => {
  it('creates a quiz with the requested count and filters', () => {
    const quiz = generateQuiz({
      category: '株式投資の基本',
      difficulty: 'beginner',
      count: 3,
    });

    expect(quiz).toHaveLength(3);
    expect(quiz.every((q) => q.category === '株式投資の基本')).toBe(true);
    expect(quiz.every((q) => q.difficulty === 'beginner')).toBe(true);
  });

  it('throws an error when requested questions exceed availability', () => {
    expect(() =>
      generateQuiz({
        category: '税金・制度',
        difficulty: 'advanced',
        count: 10,
      })
    ).toThrow('Not enough questions');
  });

  it('validates answers correctly', () => {
    const [question] = generateQuiz({ count: 1 });
    expect(checkAnswer(question, question.correctAnswer)).toBe(true);
    expect(checkAnswer(question, (question.correctAnswer + 1) % 4)).toBe(false);
  });

  it('calculates score and accuracy stats', () => {
    const questions = generateQuiz({ count: 5 });
    const answers: (number | null)[] = questions.map((question, index) =>
      index % 2 === 0 ? question.correctAnswer : (question.correctAnswer + 1) % 4
    );

    const result = calculateScore(answers, questions);

    expect(result.total).toBe(5);
    expect(result.correct).toBe(3);
    expect(result.accuracy).toBeCloseTo(60);
    Object.entries(result.categoryBreakdown).forEach(([category, stats]) => {
      const categoryQuestions = questions.filter((q) => q.category === category);
      expect(stats.total).toBe(categoryQuestions.length);
    });
  });
});
