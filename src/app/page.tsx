import Link from "next/link";

export default function Home() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";

  const bookmarkletCode = `javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title);var i=encodeURIComponent((document.querySelector('meta[property="og:image"]')||{}).content||'');window.open('${appUrl}/clip?url='+u+'&title='+t+'&thumb='+i,'_blank')})();`;

  return (
    <main className="max-w-lg mx-auto p-4 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Web Clipper</h1>
        <p className="text-gray-500 text-sm mt-1">
          SafariからNotionへ、AIで自動整理
        </p>
      </div>

      {/* 機能紹介 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { icon: "📸", label: "サムネイル自動取得" },
          { icon: "🤖", label: "AI要約生成" },
          { icon: "🏷️", label: "カテゴリ自動分類" },
          { icon: "📅", label: "閲覧日を記録" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* ブックマークレット取得 */}
      <div className="bg-indigo-50 rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-1">
          📌 ブックマークレットを設定
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          以下のリンクをSafariのブックマークとして保存してください
        </p>
        <Link
          href={bookmarkletCode}
          className="block w-full py-3 px-4 bg-indigo-500 text-white text-center rounded-xl font-semibold text-sm"
        >
          📎 このリンクをブックマーク登録
        </Link>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          ヒント: このリンクを長押し → 「ブックマークを追加」→
          名前を「Notionに保存」などに変更
        </p>
      </div>

      {/* 使い方 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">使い方</h2>
        <ol className="space-y-3">
          {[
            "Safariで保存したいページを開く",
            "アドレスバー左のブックマークアイコンをタップ",
            '「Notionに保存」のブックマークを選択',
            "メモを追加して「保存する」をタップ",
            "Notionに自動保存完了！",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-gray-600 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
