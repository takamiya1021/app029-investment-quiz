import { AppSettings, UserProgress } from '@/lib/types';

const createProgress = (): UserProgress => ({
  totalQuizzes: 3,
  totalCorrect: 21,
  totalQuestions: 30,
  categoryStats: {
    '株式投資の基本': { correct: 8, total: 10 },
    'リスク管理': { correct: 6, total: 8 },
    '投資信託・ETF': { correct: 7, total: 12 },
  },
  studyDays: 5,
  lastStudyDate: '2025-02-10',
  wrongQuestions: ['q11', 'q25'],
});

const createSettings = (): AppSettings => ({
  geminiApiKey: 'test-key',
  showExplanationImmediately: true,
  shuffleChoices: false,
});

describe('storage helpers', () => {
  const globalWithStorage = globalThis as typeof globalThis & {
    localStorage?: Storage;
  };
  const originalLocalStorage = globalWithStorage.localStorage;

  afterEach(() => {
    globalWithStorage.localStorage = originalLocalStorage;
    originalLocalStorage?.clear();
    jest.resetModules();
  });

  it('returns null when storage is unavailable', async () => {
    globalWithStorage.localStorage = undefined;
    const storage = await import('@/lib/storage');

    expect(storage.loadProgress()).toBeNull();
    expect(storage.loadSettings()).toBeNull();

    storage.saveProgress(createProgress());
    storage.saveSettings(createSettings());
  });

  it('persists and restores progress data', async () => {
    const storage = await import('@/lib/storage');
    const progress = createProgress();

    storage.saveProgress(progress);
    const restored = storage.loadProgress();

    expect(restored).toEqual(progress);
  });

  it('returns null and clears malformed progress JSON', async () => {
    const storage = await import('@/lib/storage');
    const key = storage.__testing.storageKeys.progress;
    localStorage.setItem(key, '{ invalid json');

    expect(storage.loadProgress()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('returns null when stored progress shape is invalid', async () => {
    const storage = await import('@/lib/storage');
    const key = storage.__testing.storageKeys.progress;
    localStorage.setItem(
      key,
      JSON.stringify({
        totalQuizzes: 'not-a-number',
      })
    );

    expect(storage.loadProgress()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('persists and restores app settings', async () => {
    const storage = await import('@/lib/storage');
    const settings = createSettings();

    storage.saveSettings(settings);
    expect(storage.loadSettings()).toEqual(settings);
  });

  it('returns null for invalid settings payloads', async () => {
    const storage = await import('@/lib/storage');
    const key = storage.__testing.storageKeys.settings;
    localStorage.setItem(
      key,
      JSON.stringify({
        showExplanationImmediately: 'yes please',
      })
    );

    expect(storage.loadSettings()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
});
