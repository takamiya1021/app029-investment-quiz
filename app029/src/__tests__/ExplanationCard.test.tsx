/**
 * ExplanationCard.test.tsx
 * 解説カードコンポーネントのテスト（Phase 13-2統合テスト含む）
 */

import { render, screen } from '@testing-library/react';
import ExplanationCard from '@/app/components/quiz/ExplanationCard';
import { Question } from '@/lib/types';
import { hasApiKey } from '@/lib/apiKeyManager';

// モック設定
jest.mock('@/lib/apiKeyManager');
jest.mock('@/lib/geminiService');

const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>;

describe('ExplanationCard', () => {
  const mockQuestion: Question = {
    id: 'q1',
    category: '株式投資の基本',
    difficulty: 'beginner',
    question: '株式投資のリスクとは何ですか？',
    choices: ['価格変動リスク', '流動性リスク', '信用リスク', 'すべて'],
    correctAnswer: 3,
    explanation: '株式投資には価格変動リスク、流動性リスク、信用リスクがあります。',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasApiKey.mockReturnValue(true);
  });

  it('renders question card with correct answer', () => {
    render(<ExplanationCard question={mockQuestion} userAnswer={3} index={0} />);

    expect(screen.getByText('第1問')).toBeInTheDocument();
    expect(screen.getByText('正解')).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
    expect(screen.getByText(/あなたの回答:/)).toBeInTheDocument();
    // ユーザーの回答と正解が両方表示される
    expect(screen.getAllByText(/すべて/)).toHaveLength(2);
  });

  it('renders question card with incorrect answer', () => {
    render(<ExplanationCard question={mockQuestion} userAnswer={0} index={1} />);

    expect(screen.getByText('第2問')).toBeInTheDocument();
    expect(screen.getByText('不正解')).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
  });

  it('renders question card with null answer', () => {
    render(<ExplanationCard question={mockQuestion} userAnswer={null} index={2} />);

    expect(screen.getByText('第3問')).toBeInTheDocument();
    expect(screen.getByText(/未回答/)).toBeInTheDocument();
  });

  it('displays explanation text', () => {
    render(<ExplanationCard question={mockQuestion} userAnswer={3} index={0} />);

    expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
  });

  it('displays user answer and correct answer', () => {
    render(<ExplanationCard question={mockQuestion} userAnswer={0} index={0} />);

    // ユーザーの回答（不正解）
    const userAnswerText = screen.getByText(/あなたの回答:/);
    expect(userAnswerText).toBeInTheDocument();

    // 正解
    const correctAnswerText = screen.getByText(/正解:/);
    expect(correctAnswerText).toBeInTheDocument();
  });

  // Phase 13-2: 解説強化ビュー統合テスト
  describe('Phase 13-2: Enhanced Explanation View Integration', () => {
    it('renders enhanced explanation view when API key is set', () => {
      mockHasApiKey.mockReturnValue(true);

      render(<ExplanationCard question={mockQuestion} userAnswer={3} index={0} />);

      // 「もっと詳しく」ボタンが表示される
      expect(screen.getByRole('button', { name: /もっと詳しく/i })).toBeInTheDocument();
    });

    it('does not render enhanced explanation view when API key is not set', () => {
      mockHasApiKey.mockReturnValue(false);

      render(<ExplanationCard question={mockQuestion} userAnswer={3} index={0} />);

      // 「もっと詳しく」ボタンが表示されない
      expect(screen.queryByRole('button', { name: /もっと詳しく/i })).not.toBeInTheDocument();
    });

    it('renders all card elements even when enhanced view is hidden', () => {
      mockHasApiKey.mockReturnValue(false);

      render(<ExplanationCard question={mockQuestion} userAnswer={3} index={0} />);

      // 既存のカード要素は表示される
      expect(screen.getByText('第1問')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
    });
  });
});
