import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { analyzeContent } from "@/lib/claude";
import { saveToNotion } from "@/lib/notion";

export const maxDuration = 60; // Vercel serverless function timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      url: string;
      title?: string;
      thumbnail?: string;
      notes?: string;
    };
    const { url, title: initialTitle, thumbnail: initialThumbnail, notes } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // URLからコンテンツを取得
    let pageTitle = initialTitle || "";
    let thumbnail = initialThumbnail || "";
    let bodyText = "";

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; WebClipper/1.0; +https://github.com)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        // タイトルを取得
        if (!pageTitle) {
          pageTitle =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text() ||
            url;
        }

        // サムネイルを取得
        if (!thumbnail) {
          thumbnail =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            "";
        }

        // 本文テキストを抽出（スクリプト・スタイルを除去）
        $("script, style, nav, footer, header, aside").remove();
        bodyText = $("body").text().replace(/\s+/g, " ").trim();
      }
    } catch (fetchError) {
      console.warn("Failed to fetch page content:", fetchError);
      // フェッチ失敗でも続行（タイトルとURLだけで処理）
    }

    if (!pageTitle) {
      pageTitle = url;
    }

    // Claude でコンテンツを分析
    const analysis = await analyzeContent(pageTitle, url, bodyText);

    // Notion に保存
    const pageId = await saveToNotion({
      title: pageTitle,
      url,
      summary: analysis.summary,
      category: analysis.category,
      thumbnail,
      notes,
    });

    return NextResponse.json({
      success: true,
      pageId,
      title: pageTitle,
      summary: analysis.summary,
      category: analysis.category,
      thumbnail,
    });
  } catch (error) {
    console.error("Save error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
