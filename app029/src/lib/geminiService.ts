import type { Question, Difficulty, UserProgress, WeaknessAnalysis } from './types';
import { validateQuestion } from './questionValidation';
import { loadApiKey } from './apiKeyManager';

// Gemini 2.5 Flash モデル（2025年11月時点の最新モデル）
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GenerateQuestionsOptions {
  category: string;
  difficulty: Difficulty;
  count: number;
}

/**
 * APIキーを取得（優先順位: ローカルストレージ → 環境変数）
 * @returns APIキー
 * @throws エラー - APIキーが設定されていない場合
 */
export const getApiKey = (): string => {
  // 1. ローカルストレージから取得を試みる
  const localKey = typeof window !== 'undefined' ? loadApiKey() : null;
  if (localKey) {
    return localKey;
  }

  // 2. 環境変数から取得
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please set it in Settings or use GEMINI_API_KEY environment variable.'
    );
  }
  return apiKey;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiApi = async (
  prompt: string,
  maxRetries: number = 3,
  retryCount: number = 0
): Promise<string> => {
  const apiKey = getApiKey();
  const url = GEMINI_API_ENDPOINT;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      // エラーレスポンスの詳細を取得
      const errorBody = await response.text();
      console.error('Gemini API Error Details:', errorBody);

      // レート制限エラーの場合はリトライ
      if (response.status === 429 && retryCount < maxRetries) {
        const backoffMs = Math.pow(2, retryCount) * 1000; // 指数バックオフ: 1s, 2s, 4s
        await sleep(backoffMs);
        return callGeminiApi(prompt, maxRetries, retryCount + 1);
      }

      // 最大リトライ回数に達した場合
      if (retryCount >= maxRetries) {
        throw new Error('Max retries reached');
      }

      // 詳細なエラーメッセージを含める
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    // ネットワークエラーの場合
    if (error instanceof Error && error.message !== 'Max retries reached') {
      throw error;
    }
    throw error;
  }
};

export const generateQuestions = async ({
  category,
  difficulty,
  count,
}: GenerateQuestionsOptions): Promise<Question[]> => {
  const difficultyLabel: Record<Difficulty, string> = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級',
  };

  const prompt = `あなたは投資教育の専門家です。以下の条件で投資クイズの問題を${count}問生成してください。

条件:
- カテゴリー: ${category}
- 難易度: ${difficultyLabel[difficulty]}
- 形式: 4択問題
- 各問題には解説を含めること
- 問題は教育目的であり、投資助言ではないことを前提とする

JSONフォーマットで出力してください:
[
  {
    "id": "ai-generated-unique-id",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "question": "問題文",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctAnswer": 0,
    "explanation": "解説文"
  }
]

重要な注意事項:
- 必ず有効なJSON形式（RFC8259準拠）で出力してください
- プロパティ名は必ず二重引用符（"）で囲んでください
- 末尾のカンマ（trailing commas）は使用しないでください
- 文字列内の改行はエスケープ（\\n）するか、使用しないでください
- 二重引用符を含む場合は必ずエスケープ（\\"）してください
- JSON以外の説明文や会話文は一切含めないでください`;

  const responseText = await callGeminiApi(prompt);

  // Extract JSON from response
  let jsonText = responseText.trim();

  // マークダウンのコードブロック削除
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  // 配列の開始と終了を探して抽出（余計なテキストが含まれている場合の対策）
  const startIndex = jsonText.indexOf('[');
  const endIndex = jsonText.lastIndexOf(']');

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    jsonText = jsonText.substring(startIndex, endIndex + 1);
  }

  // JSONパース（エラーハンドリング強化）
  let questions: Question[];
  try {
    questions = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Failed to parse JSON response from Gemini API');
    console.error('Parse error:', parseError);
    console.error('Response text (first 500 chars):', jsonText.substring(0, 500));
    console.error('Response text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
    throw new Error(
      `Failed to parse Gemini API response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
    );
  }

  // Validate and enhance generated questions
  questions.forEach((q, index) => {
    // デフォルト値の設定
    if (!q.id) {
      q.id = `ai-${category}-${difficulty}-${Date.now()}-${index}`;
    }
    if (!q.category) {
      q.category = category;
    }
    if (!q.difficulty) {
      q.difficulty = difficulty;
    }

    // 基本バリデーション
    validateQuestion(q);

    // 品質チェック: 選択肢の重複チェック
    const uniqueChoices = new Set(q.choices.map((c) => c.trim().toLowerCase()));
    if (uniqueChoices.size !== q.choices.length) {
      throw new Error(`Question ID ${q.id}: Duplicate choices detected`);
    }

    // 品質チェック: 選択肢の長さチェック（あまりに短い or 長い選択肢は不自然）
    q.choices.forEach((choice, idx) => {
      if (choice.length < 2) {
        throw new Error(`Question ID ${q.id}: Choice ${idx} is too short`);
      }
      if (choice.length > 200) {
        throw new Error(`Question ID ${q.id}: Choice ${idx} is too long`);
      }
    });

    // 品質チェック: 問題文の長さチェック
    if (q.question.length < 10) {
      throw new Error(`Question ID ${q.id}: Question text is too short`);
    }
    if (q.question.length > 500) {
      throw new Error(`Question ID ${q.id}: Question text is too long`);
    }

    // 品質チェック: 解説の長さチェック
    if (q.explanation.length < 10) {
      throw new Error(`Question ID ${q.id}: Explanation is too short`);
    }
  });

  return questions;
};

export const enhanceExplanation = async (question: Question): Promise<string> => {
  const prompt = `以下の投資クイズの解説を、初心者にもわかりやすく詳細に書き換えてください。
専門用語には補足説明を加え、具体例を用いて説明してください。

問題: ${question.question}
正解: ${question.choices[question.correctAnswer]}
現在の解説: ${question.explanation}

より詳しく、わかりやすい解説を作成してください。マークダウン形式で構いません。`;

  const enhancedText = await callGeminiApi(prompt);
  return enhancedText.trim();
};

export const analyzeWeakness = async (progress: UserProgress): Promise<WeaknessAnalysis> => {
  const categoryStats = Object.entries(progress.categoryStats)
    .map(([category, stats]) => ({
      category,
      accuracy: stats.total === 0 ? 0 : (stats.correct / stats.total) * 100,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const statsText = categoryStats
    .map((s) => `${s.category}: ${s.correct}/${s.total}問正解 (${Math.round(s.accuracy)}%)`)
    .join('\n');

  const prompt = `あなたは投資教育の専門家です。以下のユーザーの学習データを分析し、弱点と学習アドバイスを提供してください。

学習統計:
- 総クイズ受験回数: ${progress.totalQuizzes}回
- 総正答数: ${progress.totalCorrect}/${progress.totalQuestions}問
- 累計正答率: ${Math.round((progress.totalCorrect / progress.totalQuestions) * 100)}%
- 学習日数: ${progress.studyDays}日
- 間違えた問題数: ${progress.wrongQuestions.length}問

カテゴリー別成績:
${statsText}

以下のJSON形式で分析結果を返してください:
{
  "weakestCategory": "最も正答率が低いカテゴリー名",
  "analysis": "弱点の詳細分析（2-3文）",
  "advice": "具体的な学習アドバイス（3-4文）",
  "recommendedTopics": ["学習すべきトピック1", "トピック2", "トピック3"]
}

重要な注意事項:
- JSONのみを返してください。説明文やマークダウンのコードブロックは不要です
- 文字列内の改行は使わず、1行で記述してください
- 二重引用符を含む場合は必ずエスケープ（\\"）してください
- すべての文字列を完全に閉じてください
- 有効なJSON形式を厳守してください`;

  const responseText = await callGeminiApi(prompt);

  // Extract JSON from response
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const analysis: WeaknessAnalysis = JSON.parse(jsonText);
    return analysis;
  } catch (parseError) {
    console.error('Failed to parse JSON response from Gemini API in analyzeWeakness');
    console.error('Parse error:', parseError);
    console.error('Response text:', jsonText);
    throw new Error(
      `Failed to parse Gemini API response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
    );
  }
};
