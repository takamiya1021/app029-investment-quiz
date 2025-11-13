/**
 * AI Features Phase 13 E2E Tests
 * Phase 13のAI機能UI統合のE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 13: AI Features UI Integration', () => {
  // APIキーが必要なテストはスキップ（実際のAPIキーがない環境用）
  const hasApiKey = process.env.GEMINI_API_KEY !== undefined;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Phase 13-1: Weakness Analysis (弱点診断)', () => {
    test('弱点診断ボタンがAPIキー未設定時は表示されない', async ({ page }) => {
      // APIキーをクリア（設定ページで）
      await page.goto('/settings');

      // クリアボタンがあればクリック
      const clearButton = page.locator('button:has-text("クリア")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      await page.goto('/');

      // 弱点診断ボタンが表示されない
      const weaknessButton = page.locator('button:has-text("弱点診断")');
      await expect(weaknessButton).not.toBeVisible();
    });

    test.skip(
      !hasApiKey,
      'APIキーが設定されている場合、弱点診断ボタンが表示される',
      async ({ page }) => {
        // APIキーを設定
        await page.goto('/settings');
        await page.fill('input[type="password"]', process.env.GEMINI_API_KEY || '');
        await page.click('button:has-text("保存")');
        await page.goto('/');

        // 弱点診断ボタンが表示される
        const weaknessButton = page.locator('button:has-text("弱点診断")');
        await expect(weaknessButton).toBeVisible();

        // クリックしてモーダルが開く
        await weaknessButton.click();
        await expect(page.locator('text=弱点診断')).toBeVisible();
      }
    );
  });

  test.describe('Phase 13-2: Enhanced Explanation (解説強化)', () => {
    test('クイズ完了後、解説強化ボタンがAPIキー未設定時は表示されない', async ({ page }) => {
      // APIキーをクリア
      await page.goto('/settings');
      const clearButton = page.locator('button:has-text("クリア")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      // クイズを開始して完了
      await page.goto('/quiz');
      await page.click('button:has-text("ランダム10問")');

      // 10問回答
      for (let i = 0; i < 10; i++) {
        // 最初の選択肢をクリック
        await page.click('button[aria-label*="選択肢"]');

        // 最後の問題以外は「次の問題へ」、最後は「結果を見る」
        if (i < 9) {
          await page.click('button:has-text("次の問題へ")');
        } else {
          await page.click('button:has-text("結果を見る")');
        }
      }

      // 結果画面で「もっと詳しく」ボタンが表示されない
      const detailButton = page.locator('button:has-text("もっと詳しく")');
      await expect(detailButton).not.toBeVisible();
    });

    test.skip(
      !hasApiKey,
      'APIキー設定時、クイズ完了後に解説強化ボタンが表示される',
      async ({ page }) => {
        // APIキーを設定
        await page.goto('/settings');
        await page.fill('input[type="password"]', process.env.GEMINI_API_KEY || '');
        await page.click('button:has-text("保存")');

        // クイズを開始して完了
        await page.goto('/quiz');
        await page.click('button:has-text("ランダム10問")');

        // 10問回答
        for (let i = 0; i < 10; i++) {
          await page.click('button[aria-label*="選択肢"]');
          if (i < 9) {
            await page.click('button:has-text("次の問題へ")');
          } else {
            await page.click('button:has-text("結果を見る")');
          }
        }

        // 結果画面で「もっと詳しく」ボタンが表示される
        const detailButton = page.locator('button:has-text("もっと詳しく")').first();
        await expect(detailButton).toBeVisible();
      }
    );
  });

  test.describe('Phase 13-3: AI Question Generator (AI問題生成)', () => {
    test('AI問題生成ボタンがAPIキー未設定時はdisabled状態', async ({ page }) => {
      // APIキーをクリア
      await page.goto('/settings');
      const clearButton = page.locator('button:has-text("クリア")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      await page.goto('/quiz');

      // AI問題生成ボタンがdisabled状態
      const aiButton = page.locator('button:has-text("AI問題を生成")');
      await expect(aiButton).toBeVisible();
      await expect(aiButton).toBeDisabled();
    });

    test.skip(
      !hasApiKey,
      'APIキー設定時、AI問題生成ボタンが有効で問題生成できる',
      async ({ page }) => {
        // APIキーを設定
        await page.goto('/settings');
        await page.fill('input[type="password"]', process.env.GEMINI_API_KEY || '');
        await page.click('button:has-text("保存")');

        await page.goto('/quiz');

        // AI問題生成ボタンが有効
        const aiButton = page.locator('button:has-text("AI問題を生成")');
        await expect(aiButton).toBeVisible();
        await expect(aiButton).not.toBeDisabled();

        // ボタンをクリック
        await aiButton.click();

        // モーダルが開く
        await expect(page.locator('text=AI問題を生成')).toBeVisible();
        await expect(page.locator('label:has-text("カテゴリー")')).toBeVisible();

        // パラメータを選択
        await page.selectOption('select', '株式投資の基本');

        // 初級を選択
        await page.click('input[type="radio"][value="beginner"]');

        // 3問を選択
        await page.click('label:has-text("3問")');

        // 生成ボタンをクリック
        await page.click('button:has-text("生成する")');

        // 問題が生成され、クイズが開始される（タイムアウトを長めに設定）
        await expect(page.locator('text=第1問')).toBeVisible({ timeout: 30000 });
      }
    );
  });

  test.describe('Integration Tests (統合テスト)', () => {
    test('APIキー未設定時の全体動作確認', async ({ page }) => {
      // APIキーをクリア
      await page.goto('/settings');
      const clearButton = page.locator('button:has-text("クリア")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      // ホーム画面で弱点診断ボタンが表示されない
      await page.goto('/');
      await expect(page.locator('button:has-text("弱点診断")')).not.toBeVisible();

      // クイズ画面でAI問題生成ボタンがdisabled
      await page.goto('/quiz');
      await expect(page.locator('button:has-text("AI問題を生成")')).toBeDisabled();

      // クイズ完了後、解説強化ボタンが表示されない
      await page.click('button:has-text("ランダム10問")');
      for (let i = 0; i < 10; i++) {
        await page.click('button[aria-label*="選択肢"]');
        if (i < 9) {
          await page.click('button:has-text("次の問題へ")');
        } else {
          await page.click('button:has-text("結果を見る")');
        }
      }
      await expect(page.locator('button:has-text("もっと詳しく")')).not.toBeVisible();
    });

    test('既存機能がAI機能追加後も正常動作', async ({ page }) => {
      // 通常のクイズフローが正常動作することを確認
      await page.goto('/quiz');

      // ランダム10問が起動できる
      await page.click('button:has-text("ランダム10問")');
      await expect(page.locator('text=第1問')).toBeVisible();

      // 問題に回答できる
      await page.click('button[aria-label*="選択肢"]');
      await page.click('button:has-text("次の問題へ")');
      await expect(page.locator('text=第2問')).toBeVisible();

      // ホームへ戻れる
      await page.goto('/');
      await expect(page.locator('h1:has-text("投資クイズ")')).toBeVisible();
    });
  });
});
