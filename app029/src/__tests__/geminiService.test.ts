import {
  generateQuestions,
  enhanceExplanation,
  analyzeWeakness,
  getApiKey,
} from '@/lib/geminiService';
import type { Question, UserProgress } from '@/lib/types';
import { saveApiKey, clearApiKey } from '@/lib/apiKeyManager';

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
                      question: 'AIが生成した投資に関するテスト問題',
                      choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
                      correctAnswer: 0,
                      explanation: 'この問題の解説テキストです',
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
      expect(questions[0].question).toBe('AIが生成した投資に関するテスト問題');
      expect(questions[0].choices).toHaveLength(4);
    });

    it('throws error when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      clearApiKey(); // ローカルストレージもクリア

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Gemini API key is not configured');
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

    it('handles rate limit errors with retry', async () => {
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
                      question: 'リトライ後に成功した投資問題',
                      choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
                      correctAnswer: 0,
                      explanation: 'この問題の解説テキスト',
                    },
                  ]),
                },
              ],
            },
          },
        ],
      };

      // First call returns 429, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const questions = await generateQuestions({
        category: '株式投資の基本',
        difficulty: 'beginner',
        count: 1,
      });

      expect(questions).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it(
      'throws error after max retries',
      async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit exceeded',
        });

        await expect(
          generateQuestions({
            category: '株式投資の基本',
            difficulty: 'beginner',
            count: 1,
          })
        ).rejects.toThrow('Max retries reached');

        // Verify that it tried multiple times (initial + 3 retries = 4 attempts)
        expect(mockFetch).toHaveBeenCalledTimes(4);
      },
      10000
    ); // 10 second timeout for retry logic

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Network error');
    });

    it('handles invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'これは無効なJSON',
                  },
                ],
              },
            },
          ],
        }),
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow();
    });

    it('detects duplicate choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
                        question: 'テスト問題',
                        choices: ['選択肢A', '選択肢A', '選択肢B', '選択肢C'], // 重複
                        correctAnswer: 0,
                        explanation: '解説テキスト',
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        }),
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Duplicate choices detected');
    });

    it('detects too short choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
                        question: 'テスト問題',
                        choices: ['A', '長い選択肢B', '長い選択肢C', '長い選択肢D'], // 短すぎる
                        correctAnswer: 0,
                        explanation: '解説テキスト',
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        }),
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Choice 0 is too short');
    });

    it('detects too short question text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
                        question: '短い', // 短すぎる
                        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
                        correctAnswer: 0,
                        explanation: '解説テキスト',
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        }),
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Question text is too short');
    });

    it('detects too short explanation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
                        question: 'これは十分に長いテスト問題です',
                        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
                        correctAnswer: 0,
                        explanation: '短い', // 短すぎる
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        }),
      });

      await expect(
        generateQuestions({
          category: '株式投資の基本',
          difficulty: 'beginner',
          count: 1,
        })
      ).rejects.toThrow('Explanation is too short');
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

  describe('getApiKey', () => {
    beforeEach(() => {
      // テスト前にlocalStorageをクリア
      clearApiKey();
      delete process.env.GEMINI_API_KEY;
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    });

    it('should prioritize localStorage over environment variables', () => {
      const localKey = 'local-storage-key';
      const envKey = 'env-var-key';

      saveApiKey(localKey);
      process.env.GEMINI_API_KEY = envKey;

      const key = getApiKey();
      expect(key).toBe(localKey);
    });

    it('should fallback to GEMINI_API_KEY if localStorage is empty', () => {
      const envKey = 'gemini-api-key-from-env';
      process.env.GEMINI_API_KEY = envKey;

      const key = getApiKey();
      expect(key).toBe(envKey);
    });

    it('should fallback to NEXT_PUBLIC_GEMINI_API_KEY if GEMINI_API_KEY is not set', () => {
      const envKey = 'next-public-gemini-key';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = envKey;

      const key = getApiKey();
      expect(key).toBe(envKey);
    });

    it('should throw error if no API key is configured', () => {
      expect(() => getApiKey()).toThrow(
        'Gemini API key is not configured. Please set it in Settings or use GEMINI_API_KEY environment variable.'
      );
    });

    it('should use localStorage key even if env vars are set', () => {
      const localKey = 'priority-local-key';

      saveApiKey(localKey);
      process.env.GEMINI_API_KEY = 'env-key-1';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'env-key-2';

      const key = getApiKey();
      expect(key).toBe(localKey);
    });
  });
});
