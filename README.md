# OCR PWA Web Application

## 概要

デジタル時計・ストップウォッチなどのデジタル数値をスマートフォンで読み取り、OCR技術を使って数値を認識・保存するPWA（Progressive Web App）です。カメラ撮影画像をFastAPI OCRサービスで解析し、数値データを抽出・保存します。

> **Note**: こちらはフロントエンド側のリポジトリです。  
> バックエンド側（OCR API）のリポジトリは [tomo484/object-detection-demo](https://github.com/tomo484/object-detection-demo) になります。

## システム構成

### アーキテクチャ図

```
┌─────────────────────────────────────────┐
│ Container Apps Environment (共有)        │
│                                         │
│  ┌─────────────────┐  ┌───────────────┐ │
│  │ Web Container   │  │ OCR Container │ │
│  │ (Next.js)       │→ │ (FastAPI)     │ │
│  └─────────────────┘  └───────────────┘ │
└─────────────────────────────────────────┘
         ↓                       ↓
    ┌─────────┐              ┌─────────┐
    │Web側専用│              │OCR側専用│
    ├─────────┤              ├─────────┤
    │PostgreSQL│              │Computer │
    │Blob      │              │Vision   │
    │Storage   │              │API      │
    └─────────┘              └─────────┘
              ↓              ↑
         ┌─────────────────────┐
         │Container Registry   │
         │(共有)              │
         └─────────────────────┘
```

### 技術スタック

#### Web Application側
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: Prisma + PostgreSQL
- **スタイリング**: TailwindCSS
- **PWA**: next-pwa
- **パッケージマネージャー**: pnpm

#### インフラ構成
- **Azure Container Apps**: アプリケーションホスティング
- **Azure Container Registry**: Dockerイメージ管理
- **Azure Blob Storage**: 画像ストレージ
- **Azure Computer Vision API**: OCR処理サービス（FastAPI経由）

## ローカル開発

### 環境構築

#### 1. 依存関係のインストール

```bash
pnpm install
```

#### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の内容を設定してください：

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ocr_pwa_dev?schema=public"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..."
AZURE_STORAGE_CONTAINER="ocr-images-dev"

# ML API
ML_API_URL="https://ocr-containerapp.whitesea-2c008bf9.japaneast.azurecontainerapps.io/api/ocr/analyze"
ML_API_TIMEOUT=30000

# App Settings
NODE_ENV="development"
```

#### 3. PostgreSQL データベースの起動

```bash
docker compose up -d
```

#### 4. Prisma クライアントの生成

```bash
pnpm db:generate
```

#### 5. データベースの初期化

```bash
pnpm db:push
```

### サーバー起動

```bash
# 開発サーバーを起動
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### ビルドとテスト

```bash
# プロダクションビルド
pnpm build

# ビルドしたアプリケーションを起動
pnpm start

# ESLintによるコードチェック
pnpm lint
```

## API仕様

### 内部APIエンドポイント

#### POST /api/v1/ocr
画像のOCR解析を実行します。

**リクエスト:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "uuid": "user-device-uuid"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "readingId": "1730000000000-abc123def",
    "uuid": "user-device-uuid",
    "imageUrl": "https://storage.blob.core.windows.net/...",
    "type": "digital",
    "value": "10:03",
    "confidence": 0.95,
    "processingTime": 15.2,
    "preprocessingAttempts": 2,
    "totalLinesDetected": 5,
    "numericCandidates": 3,
    "createdAt": "2025-10-31T12:34:56.789Z"
  }
}
```

#### GET /api/v1/readings
読み取り履歴を取得します。

**クエリパラメータ:**
- `limit`: 取得件数（デフォルト: 10、最大: 50）
- `uuid`: ユーザーUUID（オプション）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "readings": [...],
    "total": 42
  }
}
```

#### GET /api/v1/readings/[reading_id]
特定の読み取り結果の詳細を取得します。

#### GET /api/health
ヘルスチェックエンドポイントです。

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-31T12:34:56.789Z",
    "database": "connected"
  }
}
```

## デプロイ

### Azureリソース

以下のAzureリソースが必要です：

- **Azure Container Apps**: Next.jsアプリケーションのホスティング
- **Azure Container Registry**: Dockerイメージの管理
- **Azure Database for PostgreSQL**: データベース
- **Azure Blob Storage**: 画像ストレージ
- **Container Apps Environment**: 実行環境（OCR側と共有）

### デプロイ手順

#### 1. Dockerイメージのビルド

```bash
docker build -t ocr-web:latest -f Dockerfile.dev .
```

#### 2. Container Registryにプッシュ

```bash
az acr login --name yourregistry
docker tag ocr-web:latest yourregistry.azurecr.io/ocr-web:latest
docker push yourregistry.azurecr.io/ocr-web:latest
```

#### 3. Container Appsにデプロイ

```bash
az containerapp create \
  --name ocr-web \
  --resource-group your-rg \
  --environment your-env \
  --image yourregistry.azurecr.io/ocr-web:latest \
  --env-vars \
    DATABASE_URL="postgresql://..." \
    AZURE_STORAGE_CONNECTION_STRING="..." \
    ML_API_URL="https://ocr-api.example.com/api/ocr/analyze"
```

## プロジェクト構造

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # APIルート
│   │   │   ├── health/        # ヘルスチェック
│   │   │   └── v1/
│   │   │       ├── ocr/       # OCRエンドポイント
│   │   │       └── readings/  # 履歴エンドポイント
│   │   ├── history/           # 履歴ページ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # トップページ
│   │   └── globals.css        # グローバルスタイル
│   └── lib/                   # ユーティリティ
│       ├── api-utils.ts       # API共通処理
│       ├── blob-client.ts     # Azure Blob Storage
│       ├── ml-client.ts       # ML API クライアント
│       ├── prisma.ts          # Prisma クライアント
│       └── dto.ts             # 型定義
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── public/                    # 静的ファイル
│   ├── manifest.json          # PWAマニフェスト
│   └── sw.js                  # Service Worker
├── types/                     # TypeScript型定義
├── Dockerfile.dev             # Docker設定
├── docker-compose.yml         # ローカル開発用
├── next.config.ts             # Next.js設定
├── tsconfig.json              # TypeScript設定
├── package.json               # 依存関係
└── README.md                  # このファイル
```

## 機能

### PWA機能
- **オフライン対応**: Service Workerによるキャッシング
- **カメラアクセス**: スマートフォンカメラでの撮影
- **インストール可能**: ホーム画面に追加可能

### OCR処理
- **前処理エンジン**: 画像の品質向上による認識精度の改善
- **数値抽出**: 時刻、温度、計算結果などの数値データの抽出
- **正規化**: OCR結果の文字補正と正規化

### データ管理
- **履歴保存**: 読み取り結果のデータベース保存
- **画像保存**: Azure Blob Storageへの画像アップロード
- **履歴閲覧**: 過去の読み取り結果の確認

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
