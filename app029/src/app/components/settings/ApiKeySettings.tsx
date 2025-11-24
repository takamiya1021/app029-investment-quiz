'use client';

import React, { useState, useEffect } from 'react';
import { saveApiKey, clearApiKey, hasApiKey, maskApiKey, loadApiKey } from '@/lib/apiKeyManager';

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [keyExists, setKeyExists] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setKeyExists(hasApiKey());
  }, []);

  const handleSave = () => {
    setMessage('');
    setError('');

    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    try {
      saveApiKey(apiKey);
      setKeyExists(true);
      setApiKey('');
      setMessage('APIキーを保存しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const handleClear = () => {
    setMessage('');
    setError('');

    clearApiKey();
    setKeyExists(false);
    setApiKey('');
    setMessage('APIキーを削除しました');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Gemini API 設定</h2>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            使用モデル: <span className="font-mono text-sm text-blue-600">gemini-2.5-flash</span>
          </p>
          <p className="text-sm text-gray-600 mb-2">
            ステータス:{' '}
            <span className={keyExists ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {keyExists ? '設定済み' : '未設定'}
            </span>
          </p>
          {keyExists && (
            <p className="text-sm text-gray-500">
              現在のキー: {maskApiKey(loadApiKey() || '')}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="APIキーを入力してください"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={apiKey.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>

          {keyExists && (
            <button
              onClick={handleClear}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              クリア
            </button>
          )}
        </div>

        {message && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">{message}</div>
        )}

        {error && <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">{error}</div>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 使い方</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Gemini APIキーは <a href="https://makersuite.google.com/app/apikey" className="underline" target="_blank" rel="noopener noreferrer">Google AI Studio</a> で取得できます</li>
          <li>• APIキーはブラウザのローカルストレージに保存されます</li>
          <li>• APIキーを設定すると、AI機能（問題生成、解説強化、弱点診断）が利用できます</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ セキュリティ注意事項</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• APIキーは個人利用のみとし、他人と共有しないでください</li>
          <li>• 共有端末では使用後に必ずクリアしてください</li>
          <li>• ローカルストレージに平文で保存されます</li>
        </ul>
      </div>
    </div>
  );
}
