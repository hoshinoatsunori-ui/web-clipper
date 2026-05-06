"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; title: string; summary: string; category: string }
  | { status: "error"; message: string };

function ClipForm() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const url = searchParams.get("url") || "";
  const title = searchParams.get("title") || "";
  const thumbnail = searchParams.get("thumb") || "";

  useEffect(() => {
    // ページタイトルを設定
    if (title) {
      document.title = `保存: ${title}`;
    }
  }, [title]);

  const handleSave = async () => {
    if (!url) return;

    setSaveState({ status: "saving" });

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, thumbnail, notes }),
      });

      const data = await response.json() as {
        success?: boolean;
        error?: string;
        title?: string;
        summary?: string;
        category?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "保存に失敗しました");
      }

      setSaveState({
        status: "success",
        title: data.title || title,
        summary: data.summary || "",
        category: data.category || "",
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "保存に失敗しました",
      });
    }
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center text-gray-500">
          <p className="text-lg">URLが指定されていません</p>
          <p className="text-sm mt-2">ブックマークレットから開いてください</p>
        </div>
      </div>
    );
  }

  if (saveState.status === "success") {
    return (
      <div className="max-w-lg mx-auto p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Notionに保存しました
          </h2>
          <p className="text-sm font-medium text-indigo-600 mb-3">
            {saveState.category}
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {saveState.summary}
          </p>
          <button
            onClick={() => window.close()}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      {/* ヘッダー */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-800">Notionに保存</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          AIが要約と分類を自動生成します
        </p>
      </div>

      {/* サムネイル */}
      {thumbnail && (
        <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 aspect-video relative">
          <Image
            src={thumbnail}
            alt="サムネイル"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* ページ情報 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <p className="font-medium text-gray-800 text-sm leading-snug mb-1 line-clamp-2">
          {title || "タイトルなし"}
        </p>
        <p className="text-xs text-gray-400 truncate">{url}</p>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          メモ（任意）
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="気になった点やメモを入力..."
          rows={3}
          className="w-full text-sm text-gray-700 placeholder-gray-300 outline-none resize-none"
        />
      </div>

      {/* エラー */}
      {saveState.status === "error" && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-600">{saveState.message}</p>
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saveState.status === "saving"}
        className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-semibold text-base
          disabled:opacity-60 active:scale-95 transition-all shadow-md shadow-indigo-200"
      >
        {saveState.status === "saving" ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            AI解析中...
          </span>
        ) : (
          "Notionに保存する"
        )}
      </button>

      <p className="text-center text-xs text-gray-300 mt-3">
        Claude AI で要約・分類を自動生成
      </p>
    </div>
  );
}

export default function ClipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">読み込み中...</div>
        </div>
      }
    >
      <ClipForm />
    </Suspense>
  );
}
