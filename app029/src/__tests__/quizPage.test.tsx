import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizPage from '@/app/quiz/page';
import { useQuizStore } from '@/store/useQuizStore';
import { generateQuiz } from '@/lib/quizEngine';

const manualQuestion = {
  id: 'manual-1',
  category: '株式投資の基本',
  difficulty: 'beginner' as const,
  question: 'テスト用の問題ですか？',
  choices: ['はい', 'いいえ', 'たぶん', 'わからない'],
  correctAnswer: 0,
  explanation: 'テスト用に用意した解説です。',
};

describe('Quiz page', () => {
  beforeEach(() => {
    useQuizStore.setState((state) => ({
      ...state,
      status: 'idle',
      currentSession: null,
    }));
  });

  it('renders category selector buttons and starts a quiz', async () => {
    render(<QuizPage />);
    const button = screen.getByRole('button', { name: /株式投資の基本/i });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);

    const state = useQuizStore.getState();
    expect(state.status).toBe('in-progress');
    expect(state.currentSession).not.toBeNull();
    expect(screen.getByText(/第1問/)).toBeInTheDocument();
  });

  it('allows answering a question and moving to next', async () => {
    act(() => {
      const quiz = generateQuiz({ category: '株式投資の基本', count: 2 });
      useQuizStore.getState().startQuiz({
        category: '株式投資の基本',
        difficulty: 'beginner',
        questions: quiz,
      });
    });

    render(<QuizPage />);
    const choices = screen.getAllByRole('button', { name: /選択肢/i, hidden: true });
    await userEvent.click(choices[0]);
    const next = screen.getByRole('button', { name: '次の問題へ' });
    await userEvent.click(next);

    expect(screen.getByText(/第2問/)).toBeInTheDocument();
  });

  it('shows explanations after finishing the quiz', async () => {
    act(() => {
      useQuizStore.getState().startQuiz({
        category: manualQuestion.category,
        difficulty: manualQuestion.difficulty,
        questions: [manualQuestion],
      });
    });

    render(<QuizPage />);
    await userEvent.click(screen.getByRole('button', { name: '選択肢 1' }));
    const finishButton = screen.getByRole('button', { name: '結果を見る' });
    await userEvent.click(finishButton);

    expect(screen.getByText('お疲れさまでした！')).toBeInTheDocument();
    expect(screen.getByText(manualQuestion.question)).toBeInTheDocument();
    expect(screen.getByText(manualQuestion.explanation)).toBeInTheDocument();
  });
});
