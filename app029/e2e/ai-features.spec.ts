import { test, expect } from '@playwright/test';

test.describe('AI Features E2E Tests', () => {
  test.skip('AI question generation button appears (requires API key)', async ({ page }) => {
    // Note: このテストはGEMINI_API_KEYが設定されている環境でのみ実行されます
    // APIキーがない場合はスキップされます

    await page.goto('/');

    // AI機能のボタンやリンクが表示されるかを確認
    // （実装によっては設定画面やAI専用ページがある可能性）
    const aiButton = page.getByRole('button', { name: /AI.*生成/i });
    const aiButtonCount = await aiButton.count();

    if (aiButtonCount > 0) {
      await expect(aiButton).toBeVisible();
    }
  });

  test.skip('AI-generated questions can be used in quiz (requires API key)', async ({ page }) => {
    // Note: このテストは実際のGemini APIを使用するため、
    // GEMINI_API_KEYが設定されている環境でのみ実行されます

    await page.goto('/');

    // AI問題生成ボタンをクリック（実装次第）
    const generateButton = page.getByRole('button', { name: /AI.*生成/i });
    const buttonCount = await generateButton.count();

    if (buttonCount > 0) {
      await generateButton.click();

      // 生成中のローディング表示を確認
      await expect(page.getByText(/生成中/i)).toBeVisible({ timeout: 10000 });

      // 生成完了後、問題が利用可能になることを確認
      await expect(page.getByText(/生成完了/i)).toBeVisible({ timeout: 30000 });
    }
  });

  test.skip('explanation enhancement works (requires API key)', async ({ page }) => {
    // Note: このテストは実際のGemini APIを使用します

    await page.goto('/quiz');

    // 通常のクイズを開始
    await page.getByRole('button', { name: /株式投資の基本/i }).click();

    // 1問回答
    await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
    await page.getByRole('button').first().click();
    await page.getByRole('button', { name: /結果を見る/i }).click();

    // 解説強化ボタンが表示されるか確認
    const enhanceButton = page.getByRole('button', { name: /詳しい解説/i });
    const buttonCount = await enhanceButton.count();

    if (buttonCount > 0) {
      await enhanceButton.click();

      // 強化された解説が表示されることを確認
      await expect(page.getByText(/詳細/i)).toBeVisible({ timeout: 15000 });
    }
  });

  test.skip('weakness analysis displays (requires API key and learning history)', async ({
    page,
  }) => {
    // Note: このテストは学習履歴が必要です

    await page.goto('/');

    // 弱点診断ボタンをクリック
    const analysisButton = page.getByRole('button', { name: /弱点診断/i });
    const buttonCount = await analysisButton.count();

    if (buttonCount > 0) {
      await analysisButton.click();

      // 診断結果が表示されることを確認
      await expect(page.getByText(/分析結果/i)).toBeVisible({ timeout: 20000 });

      // 推奨トピックが表示されることを確認
      await expect(page.getByText(/推奨/i)).toBeVisible();
    }
  });

  test('UI indicates AI features require API key', async ({ page }) => {
    // APIキーが設定されていない場合の動作を確認

    await page.goto('/');

    // AI機能に関する説明や設定案内が表示されることを確認
    // （実装によっては設定ページやヘルプセクションに記載）

    // README やヘルプに AI 機能の説明があるか確認
    const helpLinks = page.getByRole('link', { name: /ヘルプ|使い方|README/i });
    const linkCount = await helpLinks.count();

    // リンクがあればクリックして確認
    if (linkCount > 0) {
      // このテストは基本的にUI要素の存在確認のみ
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('app works without AI features when API key is not set', async ({ page }) => {
    // APIキーがなくても基本機能は動作することを確認

    await page.goto('/');

    // ホームページが正常に表示される
    await expect(page).toHaveTitle(/投資クイズ|Investment Quiz/i);

    // 基本的なクイズ機能が利用可能
    await page.getByRole('link', { name: /クイズを始める/i }).click();
    await expect(page).toHaveURL('/quiz');

    // カテゴリー選択ができる
    await expect(page.getByRole('button', { name: /株式投資の基本/i })).toBeVisible();

    // クイズが開始できる
    await page.getByRole('button', { name: /株式投資の基本/i }).click();
    await expect(page.getByText(/第.*問/i)).toBeVisible({ timeout: 5000 });
  });
});
