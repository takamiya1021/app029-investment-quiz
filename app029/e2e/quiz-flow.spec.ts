import { test, expect } from '@playwright/test';

test.describe('Quiz Flow E2E Tests', () => {
  test('complete a full quiz from category selection to results', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');

    // 「クイズを始める」ボタンをクリック
    await page.getByRole('link', { name: /クイズを始める/i }).click();

    // クイズページに遷移したことを確認
    await expect(page).toHaveURL('/quiz');

    // カテゴリー選択画面が表示されることを確認
    await expect(page.getByText(/カテゴリーを選択/i)).toBeVisible();

    // 「株式投資の基本」カテゴリーを選択
    await page.getByRole('button', { name: /株式投資の基本/i }).click();

    // 問題が表示されるまで待機
    await page.waitForSelector('text=/第.*問/i', { timeout: 5000 });

    // 10問全て回答
    for (let i = 0; i < 10; i++) {
      // 問題番号が表示されていることを確認
      await expect(page.getByText(new RegExp(`第${i + 1}問`, 'i'))).toBeVisible();

      // 最初の選択肢を選択（テストなので常に最初を選択）
      const choices = page.getByRole('button', { name: /選択肢/i });
      const firstChoice = choices.first();
      await firstChoice.click();

      // 「次の問題へ」または「結果を見る」ボタンをクリック
      if (i < 9) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // 結果画面が表示されることを確認
    await expect(page.getByText(/正答率/i)).toBeVisible();
    await expect(page.getByText(/問中.*問正解/i)).toBeVisible();
  });

  test('answer questions and navigate correctly', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /ランダム10問/i }).click();

    // 第1問が表示されることを確認
    await expect(page.getByText(/第1問/i)).toBeVisible();

    // 進捗バーが表示されることを確認
    await expect(page.locator('text=/1.*\/.*10/i')).toBeVisible();

    // 選択肢が4つ表示されることを確認
    const choices = await page.getByRole('button', { name: /選択肢/i }).count();
    expect(choices).toBeGreaterThanOrEqual(4);

    // 1つ目の選択肢を選択
    await page.getByRole('button').first().click();

    // 「次の問題へ」ボタンが有効になることを確認
    await expect(page.getByRole('button', { name: /次の問題へ/i })).toBeEnabled();
  });

  test('quiz progress tracking works correctly', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /経済用語/i }).click();

    // 進捗が更新されることを確認
    await expect(page.locator('text=/第1問/i')).toBeVisible();

    // 回答して次へ
    await page.getByRole('button').first().click();
    await page.getByRole('button', { name: /次の問題へ/i }).click();

    // 進捗が第2問に更新されることを確認
    await expect(page.locator('text=/第2問/i')).toBeVisible();
  });
});
