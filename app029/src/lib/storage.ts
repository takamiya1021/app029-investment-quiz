import {
  AppSettings,
  UserProgress,
  isAppSettings,
  isUserProgress,
} from '@/lib/types';

const STORAGE_KEYS = {
  progress: 'investment-quiz-progress',
  settings: 'investment-quiz-settings',
} as const;

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { localStorage?: unknown }).localStorage !== 'undefined'
  ) {
    const candidate = (globalThis as { localStorage?: unknown }).localStorage;
    if (candidate && typeof candidate === 'object') {
      return candidate as Storage;
    }
  }

  return null;
};

const safeParse = <T>(payload: string | null, validator: (value: unknown) => value is T): T | null => {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const loadProgress = (): UserProgress | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const key = STORAGE_KEYS.progress;
  const parsed = safeParse<UserProgress>(storage.getItem(key), isUserProgress);
  if (!parsed) {
    storage.removeItem(key);
    return null;
  }

  return parsed;
};

export const saveProgress = (progress: UserProgress): void => {
  const storage = getStorage();
  if (!storage || !isUserProgress(progress)) {
    return;
  }

  storage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
};

export const loadSettings = (): AppSettings | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const key = STORAGE_KEYS.settings;
  const parsed = safeParse<AppSettings>(storage.getItem(key), isAppSettings);
  if (!parsed) {
    storage.removeItem(key);
    return null;
  }

  return parsed;
};

export const saveSettings = (settings: AppSettings): void => {
  const storage = getStorage();
  if (!storage || !isAppSettings(settings)) {
    return;
  }

  storage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
};

export const clearStorage = (): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEYS.progress);
  storage.removeItem(STORAGE_KEYS.settings);
};

export const __testing = {
  getStorage,
  storageKeys: STORAGE_KEYS,
};
