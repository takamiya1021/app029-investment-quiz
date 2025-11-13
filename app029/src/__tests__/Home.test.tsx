/**
 * Home.test.tsx
 * ホームコンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import Home from '@/app/components/Home';
import { useQuizStore } from '@/store/useQuizStore';
import { hasApiKey } from '@/lib/apiKeyManager';

// モック設定
jest.mock('@/store/useQuizStore');
jest.mock('@/lib/apiKeyManager');

const mockUseQuizStore = useQuizStore as unknown as jest.Mock;
const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>;

describe('Home', () => {
  const mockProgress = {
    totalQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    studyDays: 0,
    lastStudyDate: '',
    wrongQuestions: [],
    categoryStats: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuizStore.mockImplementation((selector) => {
      const store = {
        progress: mockProgress,
      };
      return selector(store);
    });
  });

  it('renders home page', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<Home />);

    expect(screen.getByText(/投資クイズで基礎力を磨こう/i)).toBeInTheDocument();
    expect(screen.getByText(/クイズを始める/i)).toBeInTheDocument();
  });

  it('renders weakness analysis button when API key is set', () => {
    mockHasApiKey.mockReturnValue(true);

    render(<Home />);

    expect(screen.getByRole('button', { name: /弱点診断/i })).toBeInTheDocument();
  });

  it('does not render weakness analysis button when API key is not set', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<Home />);

    expect(screen.queryByRole('button', { name: /弱点診断/i })).not.toBeInTheDocument();
  });
});
