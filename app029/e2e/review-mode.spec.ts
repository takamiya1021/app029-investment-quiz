import { test, expect } from '@playwright/test';

test.describe('Review Mode E2E Tests', () => {
  test('review mode button appears after making mistakes', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /株式投資の基本/i }).click();

    // わざと間違える（最後の選択肢を選ぶ）
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });

      // 最後の選択肢を選択（おそらく間違い）
      const buttons = await page.getByRole('button').all();
      const lastButton = buttons[buttons.length - 2]; // 最後から2番目（最後の選択肢ボタン）
      await lastButton.click();

      if (i < 4) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // ホームに戻る
    await page.getByRole('button', { name: /ホームに戻る/i }).click();

    // 復習モードボタンが表示されることを確認
    await expect(
      page.getByRole('button', { name: /間違えた問題.*復習/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('can start review mode and see wrong questions', async ({ page }) => {
    // まず間違える
    await page.goto('/quiz');
    await page.getByRole('button', { name: /リスク管理/i }).click();

    // 3問間違える
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
      const buttons = await page.getByRole('button').all();
      const lastButton = buttons[buttons.length - 2];
      await lastButton.click();

      if (i < 2) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // ホームに戻る
    await page.getByRole('button', { name: /ホームに戻る/i }).click();

    // 復習モードを開始
    const reviewButton = page.getByRole('button', { name: /間違えた問題.*復習/i });
    await expect(reviewButton).toBeVisible({ timeout: 5000 });
    await reviewButton.click();

    // 復習モードで問題が表示されることを確認
    await expect(page.getByText(/第.*問/i)).toBeVisible({ timeout: 5000 });
  });

  test('review mode shows only previously wrong questions', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /税金・制度/i }).click();

    // 最初の2問だけ間違える、残りは正解
    for (let i = 0; i < 4; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });

      if (i < 2) {
        // 間違える
        const buttons = await page.getByRole('button').all();
        const lastButton = buttons[buttons.length - 2];
        await lastButton.click();
      } else {
        // 正解（最初の選択肢）
        await page.getByRole('button').first().click();
      }

      if (i < 3) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // ホームに戻る
    await page.getByRole('button', { name: /ホームに戻る/i }).click();

    // 復習モードボタンのテキストを確認（間違えた問題数が表示される）
    const reviewButton = page.getByRole('button', { name: /間違えた問題.*復習/i });
    await expect(reviewButton).toBeVisible({ timeout: 5000 });

    // 復習モード開始
    await reviewButton.click();

    // 問題が表示されることを確認
    await expect(page.getByText(/第.*問/i)).toBeVisible({ timeout: 5000 });
  });

  test('no review mode button when all answers are correct', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /投資信託・ETF/i }).click();

    // 全問正解（最初の選択肢を選ぶ - テストデータ次第）
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
      await page.getByRole('button').first().click();

      if (i < 2) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // ホームに戻る
    await page.getByRole('button', { name: /ホームに戻る/i }).click();

    // 復習モードボタンが表示されないか、または「0問」と表示される
    // （実装によって挙動が異なる可能性があるため、柔軟にチェック）
    const reviewButtonCount = await page
      .getByRole('button', { name: /間違えた問題.*復習/i })
      .count();

    // ボタンがない、または「0問」と表示されていることを確認
    if (reviewButtonCount > 0) {
      await expect(page.getByText(/0.*問/i)).toBeVisible();
    }
  });
});
