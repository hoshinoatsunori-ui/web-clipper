# Web Clipper — 技術解説ドキュメント

## 概要

iPhoneのSafariで閲覧中のWebページをワンタップでNotionデータベースに保存するWebアプリケーション。ブックマークレットを起点に、AIによる自動要約・分類を行い、サムネイル付きでNotionに保存する。

---

## アーキテクチャ全体図

```
[iPhone Safari]
    │
    │ ブックマークレット起動（URL・タイトル・OGP画像URLを取得）
    ▼
[Vercel — Next.js App]
    │
    ├── /clip         保存フォーム画面（クライアント）
    │       │
    │       │ POST /api/save
    │       ▼
    └── /api/save     保存APIエンドポイント（サーバー）
            │
            ├── fetch(対象URL)          ページ本文取得
            ├── cheerio                 HTMLパース・テキスト抽出
            ├── Claude API (Haiku)      要約・カテゴリ生成
            └── Notion API              データベースへ保存
```

---

## 技術スタック

| 役割 | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.x |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 3.x |
| HTMLパース | cheerio | 1.x |
| AI API | Anthropic Claude Haiku | claude-haiku-4-5 |
| データベース | Notion API | @notionhq/client 2.x |
| ホスティング | Vercel | Serverless Functions |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx            # ルートレイアウト（メタデータ・viewport設定）
│   ├── globals.css           # Tailwind CSSのベーススタイル
│   ├── page.tsx              # トップページ（使い方・ブックマークレット登録UI）
│   ├── clip/
│   │   ├── page.tsx          # クリップ保存フォーム画面（Suspenseラッパー）
│   │   └── ClipForm.tsx      # 保存フォーム本体（クライアントコンポーネント）
│   ├── bookmarklet/
│   │   └── page.tsx          # ブックマークレット設定ガイド画面
│   └── api/
│       └── save/
│           └── route.ts      # 保存APIエンドポイント（POST）
└── lib/
    ├── claude.ts             # Claude API クライアント（要約・分類）
    └── notion.ts             # Notion API クライアント（DB保存）
```

---

## 各モジュールの詳細

### ブックマークレット

Safari のブックマークとして登録する JavaScript コード。保存したいページを開いた状態で実行すると、現在のページ情報を収集して `/clip` 画面を新しいタブで開く。

```javascript
javascript:(function(){
  var u = encodeURIComponent(location.href);        // ページURL
  var t = encodeURIComponent(document.title);       // ページタイトル
  var i = encodeURIComponent(
    (document.querySelector('meta[property="og:image"]') || {}).content || ''
  );                                                 // OGP画像URL
  window.open('{APP_URL}/clip?url='+u+'&title='+t+'&thumb='+i+'#t={TOKEN}', '_blank');
})();
```

`#t={TOKEN}` は `CLIP_TOKEN` を設定した場合のみ付く。`/bookmarklet` 画面でユーザーが入力したトークンを、ブラウザ内でコードに埋め込む（サーバーには送信しない）。

**収集する情報:**
- `url`: `location.href` — 現在のページのURL
- `title`: `document.title` — ページタイトル
- `thumb`: `og:image` メタタグ — OGP画像URL（なければ空）
- `#t`: アクセストークン（URLフラグメント。HTTPリクエストに含まれないためサーバーログに残らない）

---

### `/clip` — 保存フォーム画面 (`src/app/clip/page.tsx`, `src/app/clip/ClipForm.tsx`)

`page.tsx` は `<Suspense>` で `ClipForm` を包むだけ。`ClipForm` はクライアントコンポーネント (`"use client"`) で、ブックマークレットから渡されたクエリパラメータを `useSearchParams()` で受け取り、保存フォームを表示する。

トークンはサーバーから渡さない。マウント時に `window.location.hash` から `t` を読み取り、`history.replaceState` でフラグメントをURLから消す。

**状態管理:**

```typescript
type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; title: string; summary: string; category: string }
  | { status: "error"; message: string };
```

**処理フロー:**

1. URLパラメータからページ情報、フラグメントからトークンを取得
2. サムネイル・タイトル・URLをプレビュー表示
3. ユーザーが任意でメモを入力
4. 「保存する」タップ → `/api/save` にPOSTリクエスト（`Authorization: Bearer <token>`、閲覧日として端末ローカルの日付 `toLocaleDateString("sv")` = `YYYY-MM-DD` を付与）
5. 成功時: AI生成の要約・カテゴリを表示
6. 失敗時: エラーメッセージを表示

**Suspense境界:**
`useSearchParams()` はサスペンスが必要なため、`<Suspense>` でラップしている。

---

### `/api/save` — 保存APIエンドポイント (`src/app/api/save/route.ts`)

Next.js Route Handler (サーバーサイド)。Vercel Serverless Functionとして動作する。

**タイムアウト設定:**
```typescript
export const maxDuration = 60; // 秒
```
Claude APIとページフェッチの合計時間を考慮して60秒に設定。

**処理フロー:**

```
POST /api/save
  Header: Authorization: Bearer <token>（CLIP_TOKEN設定時は必須）
  Body: { url, title?, thumbnail?, notes?, date? }

0. 認証
   └── CLIP_TOKEN が設定されていて、ヘッダーが一致しない → 401エラー
       （比較は crypto.timingSafeEqual で定数時間）

1. バリデーション
   └── urlが存在しない → 400エラー

2. ページコンテンツ取得（失敗してもスキップ）
   ├── fetch(url, { timeout: 10000ms })
   ├── cheerio でHTMLパース
   ├── og:title / <title> からタイトル補完
   ├── og:image / twitter:image からサムネイル補完
   └── script・style・nav・footer・header・aside を除去して本文抽出

3. Claude API で分析（失敗してもスキップ）
   ├── analyzeContent(title, url, bodyText)
   └── 失敗時は summary: ""、category: "その他" で続行

4. Notion API で保存
   └── saveToNotion(data)

5. レスポンス返却
   └── { success, pageId, title, summary, category, thumbnail }
```

**フォールバック設計:**
ページのフェッチが失敗（タイムアウト・CORS・認証等）しても処理を続行する。その場合、ブックマークレットから受け取ったタイトルとURLのみで Claude に要約を依頼する。

Claude API の呼び出しやJSONの解析に失敗した場合も、要約は空・分類は「その他」としてNotionへの保存を続行する。

---

### `lib/claude.ts` — Claude API クライアント

**使用モデル:** `claude-haiku-4-5`
高速・低コストのモデルを選択。要約・分類タスクに十分な性能を持つ。

**プロンプト設計:**

```
タイトル・URL・本文（最大8,000文字）を入力として渡し、
以下のJSON形式のみで返答させる:

{"summary": "要約テキスト", "category": "カテゴリ名"}
```

JSON以外のテキストを出力させないようにプロンプトで指示し、レスポンスから正規表現でJSONを抽出することで堅牢性を確保。

**カテゴリ一覧（11種）:**

```typescript
const CATEGORIES = [
  "テクノロジー", "ニュース", "ビジネス", "エンタメ",
  "グルメ・レシピ", "旅行", "ショッピング", "学習・教育",
  "ヘルス", "デザイン", "その他"
]
```

Claude が上記以外のカテゴリを返した場合は「その他」にフォールバック。

---

### `lib/notion.ts` — Notion API クライアント

**Notionデータベーススキーマ:**

| プロパティ名 | Notionタイプ | 説明 |
|---|---|---|
| タイトル | title | ページタイトル（必須） |
| URL | url | 元ページのURL |
| 要約 | rich_text | AI生成の要約文 |
| 分類 | select | AI生成のカテゴリ |
| 閲覧日 | date | 保存時の日付（クライアントから受け取った端末ローカルの日付。無ければサーバーのUTC日付） |
| メモ | rich_text | ユーザー入力のメモ（任意） |
| サムネイル | files | OGP画像（ファイルとメディアタイプ） |

**カバー画像の設定:**
サムネイルURLがある場合、Notionページのカバー画像（ページ上部に大きく表示される画像）にも設定する。これによりギャラリービューで画像カードとして表示される。

```typescript
pageBody.cover = {
  type: "external",
  external: { url: data.thumbnail },
};
```

**文字数制限:**
Notion API の `rich_text` は1ブロックあたり2,000文字が上限のため、`.slice(0, 2000)` でトリミング。

---

## データフロー詳細

```
ブックマークレット実行
    │
    │ window.open("/clip?url=URL&title=TITLE&thumb=THUMB")
    ▼
/clip ページ読み込み
    │
    │ useSearchParams() でパラメータ取得
    │ プレビュー表示（サムネイル・タイトル・URL）
    ▼
ユーザーが「保存する」をタップ
    │
    │ fetch("POST /api/save", { url, title, thumbnail, notes, date })
    │   Header: Authorization: Bearer <token>
    ▼
/api/save 処理開始
    │
    ├─1─ fetch(対象URL) ──────────────────────────────────────────┐
    │      └── cheerio でパース                                    │ 並列ではなく
    │           ├── タイトル抽出（og:title > <title>）             │ 順次処理
    │           ├── OGP画像URL抽出（og:image > twitter:image）    │
    │           └── 本文テキスト抽出（不要タグ除去後）             │
    │                                                              │
    ├─2─ Claude API 呼び出し ────────────────────────────────────┘
    │      └── プロンプト送信（タイトル + URL + 本文8,000文字）
    │           └── JSON レスポンス受信・パース
    │                ├── summary: 要約文
    │                └── category: カテゴリ名
    │
    ├─3─ Notion API 呼び出し
    │      └── pages.create()
    │           ├── properties: タイトル・URL・要約・分類・閲覧日・サムネイル・メモ
    │           └── cover: サムネイル画像（外部URL）
    │
    └─4─ レスポンス返却 → /clip 画面に結果表示
```

---

## 環境変数

| 変数名 | 説明 | 例 |
|---|---|---|
| `NOTION_API_KEY` | Notionインテグレーションのシークレット | `secret_xxx...` |
| `NOTION_DATABASE_ID` | 保存先データベースのID（32文字） | `abc123...` |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | `sk-ant-api03-xxx...` |
| `CLIP_TOKEN` | 保存APIのアクセストークン（任意・推奨） | `openssl rand -hex 32` で生成した値 |

いずれもサーバーサイドのみで参照し、クライアントのバンドルには含めない（`NEXT_PUBLIC_` プレフィックスの変数は使っていない）。

---

## セキュリティ考慮事項

- **APIキーはサーバーサイドのみ**: `NOTION_API_KEY` と `ANTHROPIC_API_KEY` は `NEXT_PUBLIC_` プレフィックスがないためブラウザに露出しない
- **トークン認証**: `CLIP_TOKEN` 設定時、`/api/save` は Bearer トークンが一致しないリクエストを401で拒否する。トークンはHTMLやバンドルで配信せず、ユーザーのブックマークレットにのみ保持する
- **User-Agent**: ページフェッチ時は `Mozilla/5.0 (compatible; WebClipper/1.0; +https://github.com)` を名乗る（ブラウザの偽装はしていない）
- **タイムアウト設定**: 外部フェッチに10秒、Serverless Function全体に60秒のタイムアウトを設定
- **入力トリミング**: Notion APIの文字数制限（2,000文字）に合わせてデータをトリミング

---

## 制限事項

| 項目 | 内容 |
|---|---|
| サムネイル取得不可のサイト | OGP画像を設定していないページはサムネイルなし |
| 認証が必要なページ | ログインが必要なページは本文を取得できない（URLとタイトルのみで要約） |
| Notion rich_text上限 | 要約・メモは2,000文字まで |
| Claude入力上限 | 本文は8,000文字でトリミング |
| Vercelのプラン制限 | Functionの実行時間・帯域などはVercelのプランに依存する（最新の値はVercelの料金ページを参照） |
