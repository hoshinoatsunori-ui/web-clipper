"use client";

import { useState } from "react";

export default function BookmarkletPage() {
  const [copied, setCopied] = useState(false);

  // 本番URLはVercelデプロイ後に確定するので、相対パスとして動的に生成
  const getBookmarkletCode = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title);var i=encodeURIComponent((document.querySelector('meta[property="og:image"]')||{content:''}).content);window.open('${origin}/clip?url='+u+'&title='+t+'&thumb='+i,'_blank')})();`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getBookmarkletCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // iOS Safariではclipboard APIが制限される場合がある
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">
        ブックマークレット設定
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        iPhoneのSafariに登録する手順
      </p>

      {/* ステップ1 */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          <h2 className="font-semibold text-gray-800">
            このページをブックマーク登録
          </h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Safariの共有ボタン（□↑）→「ブックマークを追加」→
          名前は何でもOK（後で変更します）
        </p>
      </div>

      {/* ステップ2 */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </span>
          <h2 className="font-semibold text-gray-800">
            ブックマークレットのコードをコピー
          </h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-3 overflow-x-auto">
          <code className="text-xs text-gray-600 break-all">
            {getBookmarkletCode()}
          </code>
        </div>
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold text-sm
            active:scale-95 transition-all"
        >
          {copied ? "✅ コピーしました" : "📋 コードをコピー"}
        </button>
      </div>

      {/* ステップ3 */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </span>
          <h2 className="font-semibold text-gray-800">
            ブックマークのURLを書き換え
          </h2>
        </div>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. Safariのブックマーク一覧を開く（本のアイコン）</li>
          <li>2. 「編集」をタップ</li>
          <li>3. 追加したブックマークを選択</li>
          <li>4. URLの欄を全て消してコピーしたコードを貼り付け</li>
          <li>
            5. 名前を <strong>「Notionに保存」</strong> などに変更
          </li>
          <li>6. 「完了」をタップ</li>
        </ol>
      </div>

      {/* 使い方 */}
      <div className="bg-indigo-50 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-800 mb-2">🎉 設定完了後の使い方</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          保存したいページを開いた状態で、ブックマーク一覧から
          「Notionに保存」をタップするだけ！
          <br />
          <br />
          AIが要約・分類を自動生成してNotionに保存します。
        </p>
      </div>
    </div>
  );
}
