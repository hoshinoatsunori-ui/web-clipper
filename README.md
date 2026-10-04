# Web Clipper — iPhone Safari → Notion

iPhoneのSafariで見つけたページをワンタップでNotionに保存するWebアプリ。

## 機能

- **ブックマークレット**: Safariのブックマークから1タップで起動
- **AI要約**: Claude Haiku（`claude-haiku-4-5`）がページ内容を100〜150文字程度で要約
- **自動分類**: テクノロジー / ニュース / ビジネス / エンタメ / グルメ など11カテゴリ
- **サムネイル**: OGP画像を取得し、サムネイルプロパティとNotionのカバー画像に設定
- **閲覧日**: 保存時の日付を自動記録（端末のタイムゾーン基準）
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
| サムネイル | ファイル&メディア |

> プロパティ名は上の表と完全に一致させてください。特に「サムネイル」が無いと、OGP画像のあるページで保存がエラーになります。

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
CLIP_TOKEN=xxx
```

`CLIP_TOKEN` は任意ですが、設定を強く推奨します（後述の「セキュリティ」参照）。長いランダム文字列を自分で決めてください。

```bash
openssl rand -hex 32
```

### 4. ブックマークレットをiPhoneに登録

1. デプロイ後、`https://your-app.vercel.app/bookmarklet` をiPhoneのSafariで開く
2. `CLIP_TOKEN` を設定した場合は、画面の入力欄に同じ値を入力する
3. ページの指示に従ってブックマークレットを登録

## セキュリティ

`CLIP_TOKEN` を設定すると、保存API（`/api/save`）は `Authorization: Bearer <token>` が一致するリクエストだけを受け付けます。未設定の場合は認証なしで動作し、デプロイ先のURLを知っている人は誰でもあなたのNotionへの書き込みとClaude APIの利用ができてしまいます。

トークンはサーバーから配信せず、各自のブックマークレットにだけ埋め込みます。

- `/bookmarklet` 画面で入力したトークンは、その端末の中でブックマークレットのコードに組み込まれるだけで、サーバーには送信されません
- ブックマークレットはトークンをURLフラグメント（`#t=...`）で `/clip` に渡します。フラグメントはHTTPリクエストに含まれないため、サーバーのアクセスログには残りません
- `/clip` 画面は読み取ったあとフラグメントをURLから消します

運用上の注意:

- ブックマークレットのコードにはトークンが含まれるので、他人に共有しない
- トークンが漏れたら `CLIP_TOKEN` を変更して再デプロイし、ブックマークレットを作り直す
- デプロイ先のURLもなるべく公開しない

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

## 既知の制限

- **ログインが必要なページ**: 本文を取得できないため、タイトルとURLだけで要約します
- **OGP画像が無いページ**: サムネイル・カバー画像なしで保存します
- **長いページ**: Claudeに渡す本文は先頭8,000文字まで
- **文字数**: タイトル・要約・メモはNotion APIの上限に合わせて2,000文字で切り詰めます
- **要約の失敗**: Claude APIの呼び出しやJSONの解析に失敗した場合、要約は空・分類は「その他」でNotionに保存します
