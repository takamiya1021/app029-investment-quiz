import { validateQuestion, validateQuestionBank } from '@/lib/questionValidation';
import type { Question } from '@/lib/types';

describe('questionValidation', () => {
  const validQuestion: Question = {
    id: 'test-001',
    category: '株式投資の基本',
    difficulty: 'beginner',
    question: 'テスト問題',
    choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
    correctAnswer: 0,
    explanation: 'テスト解説',
  };

  describe('validateQuestion', () => {
    it('正常な問題データを検証できる', () => {
      expect(() => validateQuestion(validQuestion)).not.toThrow();
    });

    it('IDが欠けている場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, id: '' };
      expect(() => validateQuestion(invalidQuestion)).toThrow('Question ID is required');
    });

    it('カテゴリーが欠けている場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, category: '' };
      expect(() => validateQuestion(invalidQuestion)).toThrow('Question category is required');
    });

    it('問題文が欠けている場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, question: '' };
      expect(() => validateQuestion(invalidQuestion)).toThrow('Question text is required');
    });

    it('選択肢が4つでない場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, choices: ['選択肢1', '選択肢2'] };
      expect(() => validateQuestion(invalidQuestion)).toThrow(
        'Question must have exactly 4 choices'
      );
    });

    it('選択肢に空文字列がある場合はエラーを投げる', () => {
      const invalidQuestion = {
        ...validQuestion,
        choices: ['選択肢1', '', '選択肢3', '選択肢4'],
      };
      expect(() => validateQuestion(invalidQuestion)).toThrow('All choices must be non-empty');
    });

    it('正解インデックスが範囲外の場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, correctAnswer: 4 };
      expect(() => validateQuestion(invalidQuestion)).toThrow(
        'Correct answer index must be between 0 and 3'
      );
    });

    it('正解インデックスが負の数の場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, correctAnswer: -1 };
      expect(() => validateQuestion(invalidQuestion)).toThrow(
        'Correct answer index must be between 0 and 3'
      );
    });

    it('解説が欠けている場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, explanation: '' };
      expect(() => validateQuestion(invalidQuestion)).toThrow('Explanation is required');
    });

    it('難易度が不正な場合はエラーを投げる', () => {
      const invalidQuestion = { ...validQuestion, difficulty: 'invalid' as never };
      expect(() => validateQuestion(invalidQuestion)).toThrow(
        'Difficulty must be beginner, intermediate, or advanced'
      );
    });
  });

  describe('validateQuestionBank', () => {
    it('正常な問題配列を検証できる', () => {
      const questions = [validQuestion, { ...validQuestion, id: 'test-002' }];
      expect(() => validateQuestionBank(questions)).not.toThrow();
    });

    it('空の配列の場合はエラーを投げる', () => {
      expect(() => validateQuestionBank([])).toThrow('Question bank cannot be empty');
    });

    it('重複したIDがある場合はエラーを投げる', () => {
      const questions = [validQuestion, validQuestion];
      expect(() => validateQuestionBank(questions)).toThrow('Duplicate question ID found: test-001');
    });

    it('不正な問題が含まれる場合はエラーを投げる', () => {
      const questions = [validQuestion, { ...validQuestion, id: 'test-002', question: '' }];
      expect(() => validateQuestionBank(questions)).toThrow('Question text is required');
    });
  });
});
