/**
 * WeaknessAnalysisModal.test.tsx
 * 弱点診断モーダルコンポーネントのテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeaknessAnalysisModal from '@/app/components/ai/WeaknessAnalysisModal';
import { analyzeWeakness } from '@/lib/geminiService';
import { useQuizStore } from '@/store/useQuizStore';

// モック設定
jest.mock('@/lib/geminiService');
jest.mock('@/store/useQuizStore');

const mockAnalyzeWeakness = analyzeWeakness as jest.MockedFunction<typeof analyzeWeakness>;
const mockUseQuizStore = useQuizStore as unknown as jest.Mock;

describe('WeaknessAnalysisModal', () => {
  const mockOnClose = jest.fn();

  const mockProgress = {
    totalQuizzes: 5,
    totalQuestions: 50,
    totalCorrect: 35,
    studyDays: 3,
    lastStudyDate: '2025-01-13',
    wrongQuestions: ['q1', 'q2', 'q3'],
    categoryStats: {
      '株式投資の基本': { correct: 8, total: 10 },
      '債券投資の基本': { correct: 4, total: 8 },
      '投資信託・ETF': { correct: 9, total: 10 },
      'リスク管理': { correct: 7, total: 10 },
      '税金・制度': { correct: 4, total: 8 },
      '経済用語': { correct: 3, total: 4 },
    },
  };

  const mockAnalysisResult = {
    weakestCategory: '債券投資の基本',
    analysis: '債券投資の基本カテゴリーで正答率が50%と低めです。債券の利回り計算や価格変動の理解が不足しています。',
    advice: '債券の利回り計算を復習し、金利と債券価格の関係について理解を深めましょう。また、信用リスクについても学習することをお勧めします。',
    recommendedTopics: ['債券の利回り計算', '金利と債券価格の関係', '信用リスクの評価'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuizStore.mockReturnValue({ progress: mockProgress });
  });

  it('renders modal when isOpen is true', () => {
    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('弱点診断')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /診断する/i })).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<WeaknessAnalysisModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('弱点診断')).not.toBeInTheDocument();
  });

  it('calls analyzeWeakness on analyze button click', async () => {
    const user = userEvent.setup();
    mockAnalyzeWeakness.mockResolvedValue(mockAnalysisResult);

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    const analyzeButton = screen.getByRole('button', { name: /診断する/i });
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(mockAnalyzeWeakness).toHaveBeenCalledWith(mockProgress);
    });
  });

  it('displays analysis result after successful API call', async () => {
    const user = userEvent.setup();
    mockAnalyzeWeakness.mockResolvedValue(mockAnalysisResult);

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    const analyzeButton = screen.getByRole('button', { name: /診断する/i });
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('診断結果')).toBeInTheDocument();
      expect(screen.getByText(/債券投資の基本/)).toBeInTheDocument();
      expect(screen.getByText(/正答率が50%と低めです/)).toBeInTheDocument();
      expect(screen.getByText(/債券の利回り計算/)).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    mockAnalyzeWeakness.mockRejectedValue(new Error('API error'));

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    const analyzeButton = screen.getByRole('button', { name: /診断する/i });
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/診断に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during API call', async () => {
    const user = userEvent.setup();
    mockAnalyzeWeakness.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAnalysisResult), 100))
    );

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    const analyzeButton = screen.getByRole('button', { name: /診断する/i });
    await user.click(analyzeButton);

    // ローディング中の表示確認
    expect(screen.getByText(/診断中/i)).toBeInTheDocument();

    // 完了後の表示確認
    await waitFor(() => {
      expect(screen.getByText('診断結果')).toBeInTheDocument();
    });
  });

  it('closes modal on close button click', async () => {
    const user = userEvent.setup();

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /閉じる/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays insufficient data message when no quiz taken', () => {
    mockUseQuizStore.mockReturnValue({
      progress: {
        ...mockProgress,
        totalQuestions: 0,
        totalCorrect: 0,
      },
    });

    render(<WeaknessAnalysisModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/まずはクイズに挑戦/i)).toBeInTheDocument();
  });
});
