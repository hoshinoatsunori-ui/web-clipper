# Web Clipper — iPhone Safari → Notion

iPhoneのSafariで見つけたページをワンタップでNotionに保存するWebアプリ。

## 機能

- **ブックマークレット**: Safariのブックマークから1タップで起動
- **AI要約**: Claude (Haiku) がページ内容を100〜150文字で要約
- **自動分類**: テクノロジー / ニュース / ビジネス / エンタメ / グルメ など11カテゴリ
- **サムネイル**: OGP画像を自動取得してNotionカバー画像に設定
- **閲覧日**: 保存時の日付を自動記録
- **メモ**: 任意のコメントを添付可能

## セットアップ

### 1. Notionの準備

1. [Notion](https://notion.so) でデータベースを新規作成
2. 以下のプロパティを追加:

| プロパティ名 | タイプ |
|---|---|
| タイトル | タイトル（デフォルト） |
| URL | URL |
| 要約 | テキスト |
| 分類 | セレクト |
| 閲覧日 | 日付 |
| メモ | テキスト |

3. [Notion Integrations](https://www.notion.so/my-integrations) でインテグレーションを作成
4. データベースページで「接続」→ 作成したインテグレーションを追加
5. データベースのURLからDB IDをコピー（`notion.so/` 以降の32文字）

### 2. API キーの取得

- **Notion API Key**: インテグレーションページで取得 (`secret_...`)
- **Claude API Key**: [Anthropic Console](https://console.anthropic.com/) で取得 (`sk-ant-api03-...`)

### 3. Vercelにデプロイ

```bash
npm install
```

[Vercel](https://vercel.com) にリポジトリをインポートして、環境変数を設定:

```
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
ANTHROPIC_API_KEY=sk-ant-api03-xxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. ブックマークレットをiPhoneに登録

1. デプロイ後、`https://your-app.vercel.app/bookmarklet` をiPhoneのSafariで開く
2. ページの指示に従ってブックマークレットを登録

## 使い方

1. iPhoneのSafariで保存したいページを開く
2. ブックマーク一覧から「Notionに保存」をタップ
3. 必要に応じてメモを入力
4. 「Notionに保存する」をタップ
5. AIが要約・分類してNotionに自動保存！

## ローカル開発

```bash
cp .env.example .env.local
# .env.local に各APIキーを設定

npm install
npm run dev
```

`http://localhost:3000` で起動。
