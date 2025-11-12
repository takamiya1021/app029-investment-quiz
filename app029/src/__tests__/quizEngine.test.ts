import {
  generateQuiz,
  checkAnswer,
  calculateScore,
  generateReviewQuiz,
  shuffleChoices,
} from '@/lib/quizEngine';
import { Question } from '@/lib/types';

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

  it('generates review quiz from wrong questions', () => {
    const wrongQuestions: Question[] = [
      {
        id: 'q1',
        category: '株式投資の基本',
        difficulty: 'beginner',
        question: 'Test question 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Test explanation',
      },
      {
        id: 'q2',
        category: 'リスク管理',
        difficulty: 'intermediate',
        question: 'Test question 2',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'Test explanation',
      },
      {
        id: 'q3',
        category: '債券投資の基本',
        difficulty: 'beginner',
        question: 'Test question 3',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 2,
        explanation: 'Test explanation',
      },
    ];

    const reviewQuiz = generateReviewQuiz(wrongQuestions, 3);
    expect(reviewQuiz).toHaveLength(3);
    expect(reviewQuiz.every((q) => wrongQuestions.some((wq) => wq.id === q.id))).toBe(true);
  });

  it('generates review quiz with limited count', () => {
    const wrongQuestions: Question[] = [
      {
        id: 'q1',
        category: '株式投資の基本',
        difficulty: 'beginner',
        question: 'Test question 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Test explanation',
      },
      {
        id: 'q2',
        category: 'リスク管理',
        difficulty: 'intermediate',
        question: 'Test question 2',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'Test explanation',
      },
    ];

    const reviewQuiz = generateReviewQuiz(wrongQuestions, 5);
    expect(reviewQuiz.length).toBeLessThanOrEqual(2);
    expect(reviewQuiz.every((q) => wrongQuestions.some((wq) => wq.id === q.id))).toBe(true);
  });

  it('returns empty array when no wrong questions', () => {
    const reviewQuiz = generateReviewQuiz([], 10);
    expect(reviewQuiz).toEqual([]);
  });

  it('shuffles choices and tracks correct answer index', () => {
    const originalQuestion: Question = {
      id: 'q1',
      category: '株式投資の基本',
      difficulty: 'beginner',
      question: 'Test question',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      explanation: 'Test explanation',
    };

    const shuffled = shuffleChoices(originalQuestion);

    // Choices should still have 4 items
    expect(shuffled.choices).toHaveLength(4);

    // All original choices should be present
    expect(shuffled.choices).toContain('A');
    expect(shuffled.choices).toContain('B');
    expect(shuffled.choices).toContain('C');
    expect(shuffled.choices).toContain('D');

    // Correct answer should point to the same choice text
    expect(shuffled.choices[shuffled.correctAnswer]).toBe(
      originalQuestion.choices[originalQuestion.correctAnswer]
    );
    expect(shuffled.choices[shuffled.correctAnswer]).toBe('C');
  });

  it('shuffles choices differently on multiple calls', () => {
    const originalQuestion: Question = {
      id: 'q1',
      category: '株式投資の基本',
      difficulty: 'beginner',
      question: 'Test question',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Test explanation',
    };

    // Run shuffle multiple times and check if at least one produces different order
    const results = Array.from({ length: 10 }, () => shuffleChoices(originalQuestion));
    const hasDifferentOrder = results.some(
      (r) => JSON.stringify(r.choices) !== JSON.stringify(originalQuestion.choices)
    );

    expect(hasDifferentOrder).toBe(true);
  });
});
