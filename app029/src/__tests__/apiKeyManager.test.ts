import { saveApiKey, loadApiKey, clearApiKey, hasApiKey, maskApiKey } from '@/lib/apiKeyManager';

describe('apiKeyManager', () => {
  beforeEach(() => {
    // テスト前にlocalStorageをクリア
    localStorage.clear();
  });

  describe('saveApiKey', () => {
    it('should save API key to localStorage', () => {
      const testKey = 'test-api-key-12345';
      saveApiKey(testKey);

      const stored = localStorage.getItem('gemini_api_key');
      expect(stored).toBe(testKey);
    });

    it('should throw error if key is empty', () => {
      expect(() => saveApiKey('')).toThrow('API key cannot be empty');
    });

    it('should throw error if key is only whitespace', () => {
      expect(() => saveApiKey('   ')).toThrow('API key cannot be empty');
    });
  });

  describe('loadApiKey', () => {
    it('should load API key from localStorage', () => {
      const testKey = 'test-api-key-67890';
      localStorage.setItem('gemini_api_key', testKey);

      const loaded = loadApiKey();
      expect(loaded).toBe(testKey);
    });

    it('should return null if no key is stored', () => {
      const loaded = loadApiKey();
      expect(loaded).toBeNull();
    });

    it('should return null if stored key is empty string', () => {
      localStorage.setItem('gemini_api_key', '');

      const loaded = loadApiKey();
      expect(loaded).toBeNull();
    });
  });

  describe('clearApiKey', () => {
    it('should remove API key from localStorage', () => {
      localStorage.setItem('gemini_api_key', 'test-key');

      clearApiKey();

      const stored = localStorage.getItem('gemini_api_key');
      expect(stored).toBeNull();
    });

    it('should not throw error if no key exists', () => {
      expect(() => clearApiKey()).not.toThrow();
    });
  });

  describe('hasApiKey', () => {
    it('should return true if API key exists', () => {
      localStorage.setItem('gemini_api_key', 'test-key');

      expect(hasApiKey()).toBe(true);
    });

    it('should return false if no API key exists', () => {
      expect(hasApiKey()).toBe(false);
    });

    it('should return false if API key is empty string', () => {
      localStorage.setItem('gemini_api_key', '');

      expect(hasApiKey()).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key showing first 4 and last 4 characters', () => {
      const key = 'sk-1234567890abcdefghij';
      const masked = maskApiKey(key);

      expect(masked).toBe('sk-1***...***ghij');
    });

    it('should return full key if shorter than 8 characters', () => {
      const key = 'short';
      const masked = maskApiKey(key);

      expect(masked).toBe('***ort');
    });

    it('should handle empty string', () => {
      const masked = maskApiKey('');

      expect(masked).toBe('');
    });

    it('should preserve prefix for standard API keys', () => {
      const key = 'AIzaSyDabcdefghijklmnop';
      const masked = maskApiKey(key);

      expect(masked).toContain('AIza');
      expect(masked).toContain('***');
      expect(masked).toContain('nop');
    });
  });
});
