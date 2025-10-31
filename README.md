# OCR PWA Web Application

デジタル時計・ストップウォッチなどのデジタル数値をスマートフォンで読み取り、OCR技術を使って数値を認識・保存するPWA（Progressive Web App）です。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: Prisma + PostgreSQL
- **スタイリング**: TailwindCSS
- **PWA**: next-pwa
- **パッケージマネージャー**: pnpm

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の内容を設定してください：

```env
# Database (ローカル開発用)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ocr_pwa_dev?schema=public"

# Azure Blob Storage (開発用は空でOK)
AZURE_STORAGE_ACCOUNT_NAME=""
AZURE_STORAGE_ACCOUNT_KEY=""
AZURE_STORAGE_CONTAINER_NAME="ocr-images-dev"

# ML API (本番環境では外部OCR APIを使用)
ML_API_URL="https://ocr-containerapp.whitesea-2c008bf9.japaneast.azurecontainerapps.io/api/ocr/analyze"
ML_API_TIMEOUT=30000

# App Settings
NODE_ENV="development"
```

### 3. PostgreSQL データベースの起動

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Prisma クライアントの生成

```bash
pnpm db:generate
```

### 5. データベースの初期化

```bash
pnpm db:push
```

### 6. 開発サーバーの起動

```bash
pnpm dev
```

## 利用可能なスクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - プロダクションビルド
- `pnpm start` - プロダクションサーバーを起動
- `pnpm lint` - ESLintによるコードチェック
- `pnpm format` - Prettierによるコードフォーマット
- `pnpm db:generate` - Prismaクライアントの生成
- `pnpm db:push` - データベーススキーマの同期
- `pnpm db:migrate` - マイグレーションの実行
- `pnpm db:studio` - Prisma Studioの起動

## 開発フェーズ

現在のプロジェクトは以下のフェーズで進行中です：

- ✅ Phase 1: プロジェクト基盤構築（完了）
- 🚧 Phase 2: API エンドポイント実装（次のフェーズ）
- ⏳ Phase 3: Azure連携実装
- ⏳ Phase 4: PWA フロントエンド実装
- ⏳ Phase 5: Docker・インフラ設定
- ⏳ Phase 6: CI/CD パイプライン
- ⏳ Phase 7: テスト・デプロイ・運用準備

詳細なタスクリストは `docs/Todo.md` を参照してください。
