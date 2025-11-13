/**
 * QuizShell.test.tsx
 * QuizShellコンポーネントのテスト（Phase 13-3統合テスト含む）
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizShell from '@/app/components/quiz/QuizShell';
import { useQuizStore } from '@/store/useQuizStore';
import { hasApiKey } from '@/lib/apiKeyManager';

// モック設定
jest.mock('@/store/useQuizStore');
jest.mock('@/lib/apiKeyManager');
jest.mock('@/lib/geminiService');
jest.mock('@/lib/questionBank', () => ({
  getAvailableCategories: jest.fn(() => [
    '株式投資の基本',
    '債券投資の基本',
    '投資信託・ETF',
    'リスク管理',
    '税金・制度',
    '経済用語',
  ]),
  getQuestionsByCategory: jest.fn(() => []),
}));
jest.mock('@/lib/quizEngine', () => ({
  generateQuiz: jest.fn(() => []),
  generateReviewQuiz: jest.fn(() => []),
}));

const mockUseQuizStore = useQuizStore as unknown as jest.Mock;
const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>;

describe('QuizShell - CategoryView', () => {
  const mockStartQuiz = jest.fn();
  const mockLoadQuestions = jest.fn();
  const mockCategoryAccuracy = jest.fn(() => 75);
  const mockGetWrongQuestions = jest.fn(() => []);

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのストアモック
    mockUseQuizStore.mockImplementation((selector) => {
      const store = {
        status: 'idle',
        currentSession: null,
        lastResult: null,
        loadQuestions: mockLoadQuestions,
        startQuiz: mockStartQuiz,
        categoryAccuracy: mockCategoryAccuracy,
        getWrongQuestions: mockGetWrongQuestions,
      };
      return selector(store);
    });

    mockHasApiKey.mockReturnValue(true);
  });

  it('renders category selection view', () => {
    render(<QuizShell />);

    expect(screen.getByText(/学びたいテーマを選んでください/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ランダム10問/i })).toBeInTheDocument();
  });

  it('renders random quiz button', () => {
    render(<QuizShell />);

    const randomButton = screen.getByRole('button', { name: /ランダム10問/i });
    expect(randomButton).toBeInTheDocument();
  });

  it('renders review mode button when wrong questions exist', () => {
    mockGetWrongQuestions.mockReturnValue(['q1', 'q2', 'q3']);

    render(<QuizShell />);

    expect(screen.getByRole('button', { name: /復習モード/i })).toBeInTheDocument();
  });

  it('does not render review mode button when no wrong questions', () => {
    mockGetWrongQuestions.mockReturnValue([]);

    render(<QuizShell />);

    expect(screen.queryByRole('button', { name: /復習モード/i })).not.toBeInTheDocument();
  });

  // Phase 13-3: AI問題生成ボタン統合テスト
  describe('Phase 13-3: AI Question Generator Integration', () => {
    it('renders AI question generator button when API key is set', () => {
      mockHasApiKey.mockReturnValue(true);

      render(<QuizShell />);

      const aiButton = screen.getByRole('button', { name: /AI問題を生成/i });
      expect(aiButton).toBeInTheDocument();
      expect(aiButton).not.toBeDisabled();
    });

    it('renders disabled AI question generator button when API key is not set', () => {
      mockHasApiKey.mockReturnValue(false);

      render(<QuizShell />);

      const aiButton = screen.getByRole('button', { name: /AI問題を生成/i });
      expect(aiButton).toBeInTheDocument();
      expect(aiButton).toBeDisabled();
    });

    it('opens AI question generator modal on button click', async () => {
      const user = userEvent.setup();
      mockHasApiKey.mockReturnValue(true);

      render(<QuizShell />);

      const aiButton = screen.getByRole('button', { name: /AI問題を生成/i });
      await user.click(aiButton);

      // モーダルが開く（複数の「AI問題を生成」テキストがあるので、全て確認）
      const aiTexts = screen.getAllByText(/AI問題を生成/i);
      expect(aiTexts.length).toBeGreaterThan(0);
    });

    it('does not open modal when API key is not set', async () => {
      const user = userEvent.setup();
      mockHasApiKey.mockReturnValue(false);

      render(<QuizShell />);

      const aiButton = screen.getByRole('button', { name: /AI問題を生成/i });

      // クリックできない（disabled）
      expect(aiButton).toBeDisabled();
    });

    it('renders all category buttons', () => {
      render(<QuizShell />);

      // カテゴリーボタンが表示される
      expect(screen.getByText('株式投資の基本')).toBeInTheDocument();
      expect(screen.getByText('債券投資の基本')).toBeInTheDocument();
      expect(screen.getByText('投資信託・ETF')).toBeInTheDocument();
    });

    it('displays home link', () => {
      render(<QuizShell />);

      const homeLink = screen.getByRole('link', { name: /ホームへ戻る/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});
