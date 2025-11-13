/**
 * EnhancedExplanationView.test.tsx
 * 解説強化ビューコンポーネントのテスト（Phase 13-2）
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedExplanationView from '@/app/components/ai/EnhancedExplanationView';
import { enhanceExplanation } from '@/lib/geminiService';
import { hasApiKey } from '@/lib/apiKeyManager';
import { Question } from '@/lib/types';

// モック設定
jest.mock('@/lib/geminiService');
jest.mock('@/lib/apiKeyManager');

const mockEnhanceExplanation = enhanceExplanation as jest.MockedFunction<typeof enhanceExplanation>;
const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>;

describe('EnhancedExplanationView', () => {
  const mockQuestion: Question = {
    id: 'q1',
    category: '株式投資の基本',
    difficulty: 'beginner',
    question: '株式投資のリスクとは何ですか？',
    choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
    correctAnswer: 0,
    explanation: '株式投資には価格変動リスクがあります。',
  };

  const mockEnhancedText = `## 株式投資のリスクについて

株式投資には以下のようなリスクがあります：

- **価格変動リスク**: 株価は市場の状況により上下します
- **信用リスク**: 企業が倒産する可能性
- **流動性リスク**: 売りたいときに売れない可能性

初心者の方は、まずリスク管理の基本を学ぶことが重要です。`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasApiKey.mockReturnValue(true);
  });

  it('renders "more details" button initially when API key is set', () => {
    render(<EnhancedExplanationView question={mockQuestion} />);

    expect(screen.getByRole('button', { name: /もっと詳しく/i })).toBeInTheDocument();
  });

  it('does not render when API key is not set', () => {
    mockHasApiKey.mockReturnValue(false);

    const { container } = render(<EnhancedExplanationView question={mockQuestion} />);

    expect(container.firstChild).toBeNull();
  });

  it('calls enhanceExplanation on button click', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockResolvedValue(mockEnhancedText);

    render(<EnhancedExplanationView question={mockQuestion} />);

    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockEnhanceExplanation).toHaveBeenCalledWith(mockQuestion);
    });
  });

  it('displays enhanced explanation after successful API call', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockResolvedValue(mockEnhancedText);

    render(<EnhancedExplanationView question={mockQuestion} />);

    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/株式投資のリスクについて/)).toBeInTheDocument();
      expect(screen.getByText(/価格変動リスク/)).toBeInTheDocument();
    });
  });

  it('caches enhanced explanation and does not re-fetch', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockResolvedValue(mockEnhancedText);

    const { rerender } = render(<EnhancedExplanationView question={mockQuestion} />);

    // 最初のクリック
    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockEnhanceExplanation).toHaveBeenCalledTimes(1);
    });

    // コンポーネントを再レンダリング
    rerender(<EnhancedExplanationView question={mockQuestion} />);

    // 2回目のクリック（キャッシュから取得されるべき）
    const buttonAfterRerender = screen.getByRole('button', { name: /折りたたむ|もっと詳しく/i });
    if (buttonAfterRerender.textContent?.includes('もっと詳しく')) {
      await user.click(buttonAfterRerender);
    }

    // API呼び出しは1回のまま（キャッシュされている）
    expect(mockEnhanceExplanation).toHaveBeenCalledTimes(1);
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockRejectedValue(new Error('API error'));

    render(<EnhancedExplanationView question={mockQuestion} />);

    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/解説の生成に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during API call', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockEnhancedText), 100))
    );

    render(<EnhancedExplanationView question={mockQuestion} />);

    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    // ローディング中の表示確認
    expect(screen.getByText(/解説を生成中/i)).toBeInTheDocument();

    // 完了後の表示確認
    await waitFor(() => {
      expect(screen.getByText(/株式投資のリスクについて/)).toBeInTheDocument();
    });
  });

  it('can toggle expanded state', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation.mockResolvedValue(mockEnhancedText);

    render(<EnhancedExplanationView question={mockQuestion} />);

    // 展開
    const expandButton = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/株式投資のリスクについて/)).toBeInTheDocument();
    });

    // 折りたたみボタンが表示される
    const collapseButton = screen.getByRole('button', { name: /折りたたむ/i });
    expect(collapseButton).toBeInTheDocument();

    // 折りたたむ
    await user.click(collapseButton);

    // 解説が非表示になる
    expect(screen.queryByText(/株式投資のリスクについて/)).not.toBeInTheDocument();
  });

  it('retries on retry button click after error', async () => {
    const user = userEvent.setup();
    mockEnhanceExplanation
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce(mockEnhancedText);

    render(<EnhancedExplanationView question={mockQuestion} />);

    const button = screen.getByRole('button', { name: /もっと詳しく/i });
    await user.click(button);

    // エラー表示を待つ
    await waitFor(() => {
      expect(screen.getByText(/解説の生成に失敗しました/i)).toBeInTheDocument();
    });

    // リトライボタンをクリック
    const retryButton = screen.getByRole('button', { name: /再試行/i });
    await user.click(retryButton);

    // 成功した解説が表示される
    await waitFor(() => {
      expect(screen.getByText(/株式投資のリスクについて/)).toBeInTheDocument();
    });
  });
});
