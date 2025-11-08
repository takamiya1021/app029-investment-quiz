import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizPage from '@/app/quiz/page';
import { useQuizStore } from '@/store/useQuizStore';
import { generateQuiz } from '@/lib/quizEngine';

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
});
