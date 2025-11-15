# GitHub Workflows

このディレクトリには、プロジェクトのGitHub Actionsワークフローファイルが含まれます。

## Supabase Schema Deployment

Supabaseデータベーススキーマを自動デプロイするワークフローです。

### セットアップ手順

1. このディレクトリに `supabase-schema.yml` ファイルを作成
2. 以下の内容をコピー＆ペースト
3. GitHubリポジトリにプッシュ

### ファイル内容: `supabase-schema.yml`

```yaml
name: Deploy Supabase Schema

on:
  # schema.sqlが変更されたときに自動実行
  push:
    branches:
      - main
    paths:
      - 'database/schema.sql'

  # 手動実行も可能
  workflow_dispatch:

jobs:
  deploy-schema:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Execute schema.sql
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          if [ -z "$DATABASE_URL" ]; then
            echo "Error: SUPABASE_DB_URL secret is not set"
            exit 1
          fi

          echo "Executing database/schema.sql..."
          psql "${DATABASE_URL}" -f database/schema.sql

          echo "Schema deployment completed successfully!"
```

### 必要なシークレット

GitHub リポジトリの Settings → Secrets and variables → Actions で以下を設定:

- `SUPABASE_DB_URL`: データベース接続URL
  - 形式: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
  - Supabase プロジェクトの Settings → Database → Connection string → URI から取得

### 使い方

- **自動実行**: `database/schema.sql` を変更してmainブランチにプッシュ
- **手動実行**: GitHub Actions タブから「Deploy Supabase Schema」ワークフローを実行

詳細は [SETUP.md](../../SETUP.md) を参照してください。
