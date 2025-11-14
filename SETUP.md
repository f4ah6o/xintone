# xintone セットアップガイド

## 必要な準備

### 1. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でアカウント作成・ログイン
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下を取得:
   - `SUPABASE_URL`: プロジェクトURL
   - `SUPABASE_ANON_KEY`: 匿名キー

### 2. kintone アプリの準備

1. kintone にログインし、アプリを作成または選択
2. アプリ設定から API トークンを生成
3. 以下の情報をメモ:
   - `KINTONE_DOMAIN`: your-domain.cybozu.com
   - `KINTONE_APP_ID`: アプリID (数字)
   - `KINTONE_API_TOKEN`: 生成した API トークン

### 3. Cloudflare アカウント

1. [Cloudflare](https://cloudflare.com) でアカウント作成
2. Workers & Pages のセクションにアクセス

## インストール手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.dev.vars.example` をコピーして `.dev.vars` を作成:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` を編集して、実際の値を設定:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
KINTONE_DOMAIN=your-domain.cybozu.com
KINTONE_APP_ID=1
```

### 3. public/index.html の設定

`public/index.html` の以下の部分を実際の値に変更:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8787` にアクセス

## デプロイ

### 1. Cloudflare にログイン

```bash
npx wrangler login
```

### 2. 本番環境の環境変数を設定

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put KINTONE_DOMAIN
npx wrangler secret put KINTONE_APP_ID
```

### 3. デプロイ実行

```bash
npm run deploy
```

## 使い方

### 1. 認証

1. Supabase でユーザーを作成（サインアップ）
2. メールアドレスとパスワードでログイン

### 2. kintone レコードの操作

#### API 経由でのアクセス

すべてのAPIリクエストには以下のヘッダーが必要:

- `Authorization: Bearer <supabase-jwt-token>`
- `X-Kintone-API-Token: <kintone-api-token>`

#### エンドポイント

**レコード一覧取得**
```
GET /api/records
Query Parameters:
  - query: kintone クエリ文字列（オプション）
  - fields: カンマ区切りのフィールド名（オプション）
```

**単一レコード取得**
```
GET /api/records/:id
```

**レコード作成**
```
POST /api/records
Body: {
  "record": {
    "FieldCode": { "value": "値" }
  }
}
```

**レコード更新**
```
PUT /api/records/:id
Body: {
  "record": {
    "FieldCode": { "value": "新しい値" }
  },
  "revision": 1
}
```

**レコード削除**
```
DELETE /api/records
Body: {
  "ids": ["1", "2", "3"]
}
```

## アーキテクチャ

```
┌─────────────┐
│   ブラウザ   │
│   (htmx)    │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌──────────────────────┐
│ Cloudflare Workers   │
│      (Hono)         │
├──────────────────────┤
│  認証ミドルウェア      │
│   (Supabase)        │
└──────┬───────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐ ┌──────────────┐
│  Supabase   │ │   kintone    │
│ (Auth/DB)   │ │     API      │
└─────────────┘ └──────────────┘
```

## トラブルシューティング

### CORS エラー

Cloudflare Workers の設定で CORS が有効になっているか確認してください。

### 認証エラー

- Supabase の URL と API キーが正しいか確認
- JWT トークンの有効期限を確認

### kintone API エラー

- API トークンが正しいか確認
- アプリ ID が正しいか確認
- API トークンに必要な権限が付与されているか確認

## ライセンス

MIT
