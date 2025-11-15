# xintone セットアップガイド

## 概要

xintone は、kintone を中心に Supabase、Cloudflare Workers、htmx、Hono を組み合わせた柔軟な拡張システムです。

### 主な機能

- **ユーザー向け機能**
  - アプリ一覧表示（アクセス権限に基づく）
  - レコードの参照・編集・削除
  - 権限に応じた操作制限

- **管理者向け機能**
  - アプリの作成・編集・削除
  - ユーザーへのアクセス権限付与
  - ユーザーロール管理（一般ユーザー/管理者）

## 必要な準備

### 1. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でアカウント作成・ログイン
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下を取得:
   - `SUPABASE_URL`: プロジェクトURL（例: https://xxxxx.supabase.co）
   - `SUPABASE_ANON_KEY`: 匿名キー

4. SQL Editor で `database/schema.sql` を実行してテーブルを作成

### 2. kintone アプリの準備

1. kintone にログインし、アプリを作成または選択
2. アプリ設定から API トークンを生成
3. 以下の情報をメモ:
   - `KINTONE_DOMAIN`: your-domain.cybozu.com
   - `KINTONE_APP_ID`: アプリID（デフォルト用、後から管理画面で複数登録可能）
   - `KINTONE_API_TOKEN`: 生成した API トークン（ユーザーごとに設定）

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

### 3. フロントエンドの設定

`public/common.js` の以下の部分を実際の値に変更:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

実際の値に置き換え:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 4. データベースの初期化

Supabase の SQL Editor で `database/schema.sql` の内容を実行してください。

これにより以下のテーブルが作成されます:
- `profiles`: ユーザープロファイル（ロール管理）
- `kintone_apps`: kintone アプリ設定
- `user_app_access`: ユーザーのアプリアクセス権限

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8787` にアクセス

## 初期設定

### 1. 最初のユーザー登録

1. ブラウザでアプリにアクセス
2. 「新規登録」をクリック
3. メールアドレスとパスワードを入力
4. Supabase から送信される確認メールのリンクをクリック

### 2. 管理者権限の付与

最初のユーザーに管理者権限を付与します（Supabase の SQL Editor で実行）:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 3. アプリの登録（管理者画面）

1. 管理者アカウントでログイン
2. 「管理者画面」をクリック
3. 「アプリ管理」タブで「➕ アプリ追加」をクリック
4. 以下の情報を入力:
   - アプリ名
   - 説明
   - kintone ドメイン
   - kintone アプリID
   - アイコン（絵文字）

### 4. ユーザーへのアクセス権限付与

1. 管理者画面の「アプリ管理」で「👥 権限管理」をクリック
2. ユーザーを選択して「アクセス許可」をクリック
3. 権限を設定:
   - 参照: レコードの閲覧
   - 編集: レコードの作成・更新
   - 削除: レコードの削除
4. kintone API トークンを入力

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

## 画面構成

### ユーザー向け画面

1. **ログイン画面** (`/` または `/index.html`)
   - メールアドレス・パスワードでログイン
   - 新規ユーザー登録

2. **アプリ一覧** (`/apps.html`)
   - アクセス権限のあるアプリが表示される
   - アプリをクリックするとレコード一覧へ遷移

3. **レコード一覧** (`/records.html`)
   - 選択したアプリのレコードを表示
   - 権限に応じて参照・編集・削除が可能

### 管理者向け画面

1. **管理者画面** (`/admin.html`)
   - **アプリ管理タブ**
     - アプリの追加・編集・削除
     - ユーザーへのアクセス権限管理
   - **ユーザー管理タブ**
     - ユーザー一覧表示
     - ユーザーロールの変更（一般ユーザー ⇔ 管理者）

## API エンドポイント

すべてのAPIリクエストには以下のヘッダーが必要:

- `Authorization: Bearer <supabase-jwt-token>`
- `X-Kintone-API-Token: <kintone-api-token>`

### レコード操作

**レコード一覧取得**
```
GET /api/records?app_id=xxx
Query Parameters:
  - app_id: kintone アプリ ID（オプション）
  - query: kintone クエリ文字列（オプション）
  - fields: カンマ区切りのフィールド名（オプション）
```

**単一レコード取得**
```
GET /api/records/:id?app_id=xxx
```

**レコード作成**
```
POST /api/records?app_id=xxx
Body: {
  "record": {
    "FieldCode": { "value": "値" }
  }
}
```

**レコード更新**
```
PUT /api/records/:id?app_id=xxx
Body: {
  "record": {
    "FieldCode": { "value": "新しい値" }
  },
  "revision": 1
}
```

**レコード削除**
```
DELETE /api/records?app_id=xxx
Body: {
  "ids": ["1", "2", "3"]
}
```

## アーキテクチャ

```
┌─────────────────┐
│   ブラウザ      │
│ (htmx + HTML)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌───────────────────────────┐
│  Cloudflare Workers       │
│  (Hono API)              │
├───────────────────────────┤
│  認証ミドルウェア          │
│  (Supabase JWT 検証)     │
└────────┬─────────┬────────┘
         │         │
         ▼         ▼
┌───────────┐  ┌──────────────┐
│ Supabase  │  │   kintone    │
│ (Auth/DB) │  │     API      │
└───────────┘  └──────────────┘

Supabase テーブル:
- profiles (ユーザー・ロール)
- kintone_apps (アプリ設定)
- user_app_access (アクセス権限)
```

## セキュリティ

1. **認証**: Supabase の JWT トークンベース認証
2. **認可**: RLS（Row Level Security）によるデータアクセス制御
3. **API トークン**: ユーザーごとに kintone API トークンを管理
4. **HTTPS**: すべての通信は HTTPS で暗号化

### 推奨事項

- API トークンは Supabase のテーブルに暗号化して保存することを推奨
- 本番環境では適切な CORS 設定を行う
- 定期的にアクセスログを確認

## トラブルシューティング

### CORS エラー

Cloudflare Workers の設定で CORS が有効になっているか確認してください。

### 認証エラー

- Supabase の URL と API キーが正しいか確認
- JWT トークンの有効期限を確認
- ブラウザのコンソールでエラーメッセージを確認

### kintone API エラー

- API トークンが正しいか確認
- アプリ ID が正しいか確認
- API トークンに必要な権限（閲覧・追加・編集・削除）が付与されているか確認

### データベースエラー

- Supabase の SQL Editor で `database/schema.sql` が正しく実行されたか確認
- RLS ポリシーが正しく設定されているか確認

## ライセンス

MIT
