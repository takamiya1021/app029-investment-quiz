/**
 * APIキー管理ユーティリティ
 * ローカルストレージを使用してGemini APIキーを管理
 */

const STORAGE_KEY = 'gemini_api_key';

/**
 * APIキーをローカルストレージに保存
 * @param key - 保存するAPIキー
 * @throws エラー - キーが空の場合
 */
export function saveApiKey(key: string): void {
  if (!key || key.trim() === '') {
    throw new Error('API key cannot be empty');
  }

  localStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * ローカルストレージからAPIキーを読み込み
 * @returns APIキー、または存在しない場合はnull
 */
export function loadApiKey(): string | null {
  const key = localStorage.getItem(STORAGE_KEY);

  if (!key || key.trim() === '') {
    return null;
  }

  return key;
}

/**
 * ローカルストレージからAPIキーを削除
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * APIキーが保存されているか確認
 * @returns APIキーが存在する場合true
 */
export function hasApiKey(): boolean {
  const key = loadApiKey();
  return key !== null;
}

/**
 * APIキーをマスク表示用に変換
 * @param key - マスクするAPIキー
 * @returns マスク済みのキー（例: "sk-***...***ghij"）
 */
export function maskApiKey(key: string): string {
  if (!key || key.length === 0) {
    return '';
  }

  if (key.length < 8) {
    // 短いキーの場合は最後の3文字のみ表示
    return '***' + key.slice(-3);
  }

  // 標準的なAPIキーの場合
  // 先頭4文字 + *** + 末尾4文字
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);

  return `${prefix}***...***${suffix}`;
}
