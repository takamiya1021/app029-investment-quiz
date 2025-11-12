import { test, expect } from '@playwright/test';

test.describe('Results and Statistics E2E Tests', () => {
  test('displays quiz results correctly', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択
    await page.getByRole('button', { name: /株式投資の基本/i }).click();

    // 10問全て回答（テストなので全て最初の選択肢を選択）
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
      await page.getByRole('button').first().click();

      if (i < 9) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // 結果画面の表示を確認
    await expect(page.getByText(/正答率/i)).toBeVisible();
    await expect(page.getByText(/10問中.*問正解/i)).toBeVisible();

    // カテゴリー名が表示されることを確認
    await expect(page.getByText(/株式投資の基本/i)).toBeVisible();

    // 再チャレンジボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /もう一度挑戦/i })).toBeVisible();

    // ホームに戻るボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /ホームに戻る/i })).toBeVisible();
  });

  test('displays explanation cards for each question', async ({ page }) => {
    await page.goto('/quiz');

    // カテゴリー選択して完了まで進める
    await page.getByRole('button', { name: /債券投資の基本/i }).click();

    // 簡略化のため3問だけ回答（実際は設定次第）
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
      await page.getByRole('button').first().click();

      if (i < 2) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // 解説カードが表示されることを確認
    // （実装によって詳細は異なるが、解説が含まれていることを確認）
    const explanationCards = page.locator('text=/解説/i');
    await expect(explanationCards.first()).toBeVisible();
  });

  test('home page displays learning statistics', async ({ page }) => {
    await page.goto('/');

    // 学習統計が表示されることを確認
    // 累計正答率
    await expect(page.getByText(/累計正答率/i).or(page.getByText(/全体正答率/i))).toBeVisible();

    // 受験回数
    await expect(
      page.getByText(/受験.*セット/i).or(page.getByText(/挑戦.*回/i))
    ).toBeVisible();

    // 学習日数
    await expect(page.getByText(/学習日数/i).or(page.getByText(/.*日/i))).toBeVisible();

    // カテゴリー別統計が表示されることを確認
    await expect(page.getByText(/カテゴリー別/i)).toBeVisible();
  });

  test('statistics update after completing a quiz', async ({ page }) => {
    // ホームページで初期統計を確認
    await page.goto('/');
    const initialStatsText = await page.textContent('body');

    // クイズを1セット完了
    await page.getByRole('link', { name: /クイズを始める/i }).click();
    await page.getByRole('button', { name: /経済用語/i }).click();

    // 5問だけ回答（時間短縮のため）
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('text=/第.*問/i', { timeout: 3000 });
      await page.getByRole('button').first().click();

      if (i < 4) {
        await page.getByRole('button', { name: /次の問題へ/i }).click();
      } else {
        await page.getByRole('button', { name: /結果を見る/i }).click();
      }
    }

    // ホームに戻る
    await page.getByRole('button', { name: /ホームに戻る/i }).click();

    // 統計が更新されていることを確認（受験回数が増えている等）
    const updatedStatsText = await page.textContent('body');
    expect(updatedStatsText).not.toBe(initialStatsText);
  });

  test('category-wise statistics display correctly', async ({ page }) => {
    await page.goto('/');

    // カテゴリー別正答率が表示されることを確認
    await expect(
      page.getByText(/株式投資の基本/i).or(page.getByText(/債券投資の基本/i))
    ).toBeVisible();

    // パーセンテージ表示があることを確認
    await expect(page.locator('text=/%/i').or(page.locator('text=/正答率/i'))).toBeVisible();
  });
});
