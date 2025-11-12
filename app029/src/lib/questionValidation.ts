import type { Question, Difficulty } from '@/lib/types';

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

/**
 * 問題データの妥当性を検証する
 * @param question - 検証対象の問題データ
 * @throws {Error} バリデーションエラー
 */
export function validateQuestion(question: Question): void {
  // ID検証
  if (!question.id || question.id.trim() === '') {
    throw new Error('Question ID is required');
  }

  // カテゴリー検証
  if (!question.category || question.category.trim() === '') {
    throw new Error('Question category is required');
  }

  // 問題文検証
  if (!question.question || question.question.trim() === '') {
    throw new Error('Question text is required');
  }

  // 選択肢数検証
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    throw new Error('Question must have exactly 4 choices');
  }

  // 選択肢内容検証
  if (question.choices.some((choice) => !choice || choice.trim() === '')) {
    throw new Error('All choices must be non-empty');
  }

  // 正解インデックス検証
  if (
    !Number.isInteger(question.correctAnswer) ||
    question.correctAnswer < 0 ||
    question.correctAnswer > 3
  ) {
    throw new Error('Correct answer index must be between 0 and 3');
  }

  // 解説検証
  if (!question.explanation || question.explanation.trim() === '') {
    throw new Error('Explanation is required');
  }

  // 難易度検証
  if (!VALID_DIFFICULTIES.includes(question.difficulty)) {
    throw new Error('Difficulty must be beginner, intermediate, or advanced');
  }
}

/**
 * 問題バンク全体の妥当性を検証する
 * @param questions - 検証対象の問題配列
 * @throws {Error} バリデーションエラー
 */
export function validateQuestionBank(questions: Question[]): void {
  // 空配列チェック
  if (questions.length === 0) {
    throw new Error('Question bank cannot be empty');
  }

  // 個別の問題検証
  for (const question of questions) {
    validateQuestion(question);
  }

  // ID重複チェック
  const idSet = new Set<string>();
  for (const question of questions) {
    if (idSet.has(question.id)) {
      throw new Error(`Duplicate question ID found: ${question.id}`);
    }
    idSet.add(question.id);
  }
}
