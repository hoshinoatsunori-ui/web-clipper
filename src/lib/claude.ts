import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CATEGORIES = [
  "テクノロジー",
  "ニュース",
  "ビジネス",
  "エンタメ",
  "グルメ・レシピ",
  "旅行",
  "ショッピング",
  "学習・教育",
  "ヘルス",
  "デザイン",
  "その他",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface AnalysisResult {
  summary: string;
  category: Category;
}

export async function analyzeContent(
  title: string,
  url: string,
  bodyText: string
): Promise<AnalysisResult> {
  const trimmedText = bodyText.slice(0, 8000);

  const prompt = `以下のWebページを分析してください。

タイトル: ${title}
URL: ${url}
本文:
${trimmedText}

次の2つを日本語で返答してください：

1. 要約（100〜150文字程度）: ページの主な内容を簡潔にまとめる
2. 分類: 以下のカテゴリから最も適切なものを1つ選ぶ
   ${CATEGORIES.join(" / ")}

以下のJSON形式で返答してください（他のテキストは不要）:
{"summary": "要約テキスト", "category": "カテゴリ名"}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // JSONを抽出
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const result = JSON.parse(jsonMatch[0]) as {
    summary: string;
    category: string;
  };

  // カテゴリのバリデーション
  const validCategory = CATEGORIES.includes(result.category as Category)
    ? (result.category as Category)
    : "その他";

  return {
    summary: result.summary,
    category: validCategory,
  };
}
