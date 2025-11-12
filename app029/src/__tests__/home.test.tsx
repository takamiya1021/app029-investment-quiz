import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';
import { useQuizStore } from '@/store/useQuizStore';

const sampleProgress = {
  totalQuizzes: 4,
  totalCorrect: 30,
  totalQuestions: 40,
  categoryStats: {
    '株式投資の基本': { correct: 12, total: 15 },
    'リスク管理': { correct: 10, total: 12 },
    '税金・制度': { correct: 8, total: 13 },
  },
  studyDays: 6,
  lastStudyDate: '2025-11-08',
  wrongQuestions: ['q10', 'q11'],
};

describe('Home page', () => {
  beforeEach(() => {
    useQuizStore.setState((state) => ({
      ...state,
      progress: { ...sampleProgress },
    }));
  });

  it('renders the hero heading and CTA', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /投資クイズで基礎力を磨こう/i })).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'クイズを始める' });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/quiz');
  });

  it('displays progress metrics from the store', () => {
    render(<HomePage />);
    expect(screen.getByText('累計正答率')).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText('学習日数')).toBeInTheDocument();
    expect(screen.getByText('6日')).toBeInTheDocument();
    expect(screen.getByText('株式投資の基本')).toBeInTheDocument();
    expect(screen.getByText('リスク管理')).toBeInTheDocument();
  });
});
