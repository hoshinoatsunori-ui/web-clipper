import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export interface ClipData {
  title: string;
  url: string;
  summary: string;
  category: string;
  thumbnail: string;
  notes?: string;
}

export async function saveToNotion(data: ClipData): Promise<string> {
  const properties: Record<string, unknown> = {
    タイトル: {
      title: [
        {
          text: {
            content: data.title.slice(0, 2000),
          },
        },
      ],
    },
    URL: {
      url: data.url,
    },
    要約: {
      rich_text: [
        {
          text: {
            content: data.summary.slice(0, 2000),
          },
        },
      ],
    },
    分類: {
      select: {
        name: data.category,
      },
    },
    閲覧日: {
      date: {
        start: new Date().toISOString().split("T")[0],
      },
    },
  };

  if (data.notes) {
    properties["メモ"] = {
      rich_text: [
        {
          text: {
            content: data.notes.slice(0, 2000),
          },
        },
      ],
    };
  }

  const pageBody: Parameters<typeof notion.pages.create>[0] = {
    parent: {
      database_id: DATABASE_ID,
    },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  };

  // サムネイルがあればカバー画像として設定
  if (data.thumbnail) {
    pageBody.cover = {
      type: "external",
      external: { url: data.thumbnail },
    };
  }

  const response = await notion.pages.create(pageBody);
  return response.id;
}
