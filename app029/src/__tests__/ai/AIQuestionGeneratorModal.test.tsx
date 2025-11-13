/**
 * AIQuestionGeneratorModal.test.tsx
 * AI問題生成モーダルコンポーネントのテスト（Phase 13-3）
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIQuestionGeneratorModal from '@/app/components/ai/AIQuestionGeneratorModal';
import { generateQuestions } from '@/lib/geminiService';
import { Question } from '@/lib/types';

// モック設定
jest.mock('@/lib/geminiService');

const mockGenerateQuestions = generateQuestions as jest.MockedFunction<typeof generateQuestions>;

describe('AIQuestionGeneratorModal', () => {
  const mockOnClose = jest.fn();
  const mockOnGenerated = jest.fn();

  const mockGeneratedQuestions: Question[] = [
    {
      id: 'ai-q1',
      category: '株式投資の基本',
      difficulty: 'beginner',
      question: 'AI生成問題1',
      choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
      correctAnswer: 0,
      explanation: 'AI生成解説1',
      aiGenerated: true,
    },
    {
      id: 'ai-q2',
      category: '株式投資の基本',
      difficulty: 'beginner',
      question: 'AI生成問題2',
      choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
      correctAnswer: 1,
      explanation: 'AI生成解説2',
      aiGenerated: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    expect(screen.getByText(/AI問題を生成/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成する/i })).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(
      <AIQuestionGeneratorModal
        isOpen={false}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    expect(screen.queryByText(/AI問題を生成/i)).not.toBeInTheDocument();
  });

  it('allows selecting category, difficulty, and count', async () => {
    const user = userEvent.setup();

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    // カテゴリー選択
    const categorySelect = screen.getByLabelText(/カテゴリー/i);
    await user.selectOptions(categorySelect, '債券投資の基本');
    expect(categorySelect).toHaveValue('債券投資の基本');

    // 難易度選択
    const intermediateRadio = screen.getByLabelText(/中級/i);
    await user.click(intermediateRadio);
    expect(intermediateRadio).toBeChecked();

    // 問題数選択
    const count10Radio = screen.getByLabelText(/10問/i);
    await user.click(count10Radio);
    expect(count10Radio).toBeChecked();
  });

  it('calls generateQuestions with correct parameters', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions.mockResolvedValue(mockGeneratedQuestions);

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    // パラメータ選択
    const categorySelect = screen.getByLabelText(/カテゴリー/i);
    await user.selectOptions(categorySelect, '株式投資の基本');

    const intermediateRadio = screen.getByLabelText(/中級/i);
    await user.click(intermediateRadio);

    const count5Radio = screen.getByLabelText(/5問/i);
    await user.click(count5Radio);

    // 生成ボタンをクリック
    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockGenerateQuestions).toHaveBeenCalledWith({
        category: '株式投資の基本',
        difficulty: 'intermediate',
        count: 5,
      });
    });
  });

  it('calls onGenerated callback with generated questions', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions.mockResolvedValue(mockGeneratedQuestions);

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith(
        mockGeneratedQuestions,
        '株式投資の基本'
      );
    });
  });

  it('displays progress during generation', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockGeneratedQuestions), 100))
    );

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    // ローディング中の表示確認
    expect(screen.getByText(/問題を生成中/i)).toBeInTheDocument();

    // 完了後の表示確認
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalled();
    });
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions.mockRejectedValue(new Error('API error'));

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/問題の生成に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('closes modal on close button click', async () => {
    const user = userEvent.setup();

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    // ヘッダーの閉じるボタンをクリック
    const closeButton = screen.getByRole('button', { name: /閉じる/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal on cancel button click', async () => {
    const user = userEvent.setup();

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    // フッターのキャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables generate button during generation', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockGeneratedQuestions), 100))
    );

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    // 生成中はボタンがdisabled
    expect(generateButton).toBeDisabled();

    // 完了後は再度enabled
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalled();
    });
  });

  it('retries on retry button click after error', async () => {
    const user = userEvent.setup();
    mockGenerateQuestions
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce(mockGeneratedQuestions);

    render(
      <AIQuestionGeneratorModal
        isOpen={true}
        onClose={mockOnClose}
        onGenerated={mockOnGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /生成する/i });
    await user.click(generateButton);

    // エラー表示を待つ
    await waitFor(() => {
      expect(screen.getByText(/問題の生成に失敗しました/i)).toBeInTheDocument();
    });

    // リトライボタンをクリック
    const retryButton = screen.getByRole('button', { name: /再試行/i });
    await user.click(retryButton);

    // 成功
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith(
        mockGeneratedQuestions,
        '株式投資の基本'
      );
    });
  });
});
