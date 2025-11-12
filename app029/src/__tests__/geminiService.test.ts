import {
  generateQuestions,
  enhanceExplanation,
  analyzeWeakness,
} from '@/lib/geminiService';
import type { Question, Difficulty, UserProgress } from '@/lib/types';

// Mock the Gemini API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('geminiService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('generateQuestions', () => {
    it('generates questions from Gemini API', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      id: 'ai-1',
                      category: '株式投資の基本',
                      difficulty: 'beginner',
                      question: 'AIが生成した問題',
                      choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
                      correctAnswer: 0,
                      explanation: '解説',
                    },
                  ]),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const questions = await generateQuestions({
        category: '株式投資の基本',
        difficulty: 'beginner',
        count: 1,
      });

      expect(questions).toHaveLength(1);
      expect(questions[0].question).toBe('AIが生成した問題');
      expect(questions[0].choices).toHaveLength(4);
    });

    it('throws error when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('GEMINI_API_KEY is not configured');
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe('enhanceExplanation', () => {
    it('enhances explanation using Gemini API', async () => {
      const question: Question = {
        id: 'q1',
        category: '株式投資の基本',
        difficulty: 'beginner',
        question: 'テスト問題',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '基本的な解説',
      };

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '詳細な解説がここに入ります。初心者向けに補足情報を追加しました。',
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const enhanced = await enhanceExplanation(question);

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBeGreaterThan(question.explanation.length);
    });
  });

  describe('analyzeWeakness', () => {
    it('analyzes user weakness and provides advice', async () => {
      const progress: UserProgress = {
        totalQuizzes: 5,
        totalCorrect: 30,
        totalQuestions: 50,
        categoryStats: {
          '株式投資の基本': { correct: 15, total: 20 },
          'リスク管理': { correct: 5, total: 15 },
          '債券投資の基本': { correct: 10, total: 15 },
        },
        studyDays: 7,
        lastStudyDate: '2025-01-01',
        wrongQuestions: ['q1', 'q2', 'q3'],
      };

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    weakestCategory: 'リスク管理',
                    analysis: 'リスク管理の正答率が低いです',
                    advice: 'リスク分散の基本を学習することをお勧めします',
                    recommendedTopics: ['分散投資', 'リスク許容度'],
                  }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const analysis = await analyzeWeakness(progress);

      expect(analysis).toBeDefined();
      expect(analysis.weakestCategory).toBe('リスク管理');
      expect(analysis.advice).toBeDefined();
      expect(analysis.recommendedTopics).toBeInstanceOf(Array);
    });
  });
});
