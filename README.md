# RAG Studio Frontend

RAG API バックエンドと連携する、Google NotebookLM にインスパイアされたモダンなチャット UI。

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI (Radix UI)
- **Icons**: Lucide React

## 前提条件

- Node.js 18 以上 (ローカル開発時)
- Docker / Docker Compose (コンテナ起動時)
- RAG API バックエンド (`http://localhost:8000`) が起動していること

## セットアップ

### Docker で起動 (推奨)

```bash
# ビルド & 起動
docker compose up --build

# バックグラウンドで起動
docker compose up --build -d

# 停止
docker compose down
```

### ローカルで起動

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド & 起動
npm run build
npm run start
```

起動後、http://localhost:3000 でアクセスできます。

## 環境変数

| 変数名 | デフォルト値 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | RAG API バックエンドの URL |

Docker の場合は `docker-compose.yml` の `args` で設定:

```yaml
services:
  frontend:
    build:
      args:
        NEXT_PUBLIC_API_URL: http://your-api-host:8000
```

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx            # メインレイアウト (ResizablePanel で左右分割)
│   ├── layout.tsx          # ルートレイアウト
│   └── globals.css         # グローバルスタイル (ダークテーマ)
├── components/
│   ├── chat/
│   │   └── chat-panel.tsx  # チャット履歴・入力フォーム・SSE ストリーミング表示
│   ├── sidebar/
│   │   ├── source-sidebar.tsx  # ソース管理サイドバー (ファイルアップロード・フィルタ)
│   │   └── source-card.tsx     # ソースファイルカード
│   └── ui/                 # Shadcn UI コンポーネント
├── hooks/
│   └── use-chat.ts         # チャット状態管理フック
└── lib/
    ├── api.ts              # API クライアント (SSE 対応)
    └── utils.ts            # ユーティリティ
```

## API 連携

| エンドポイント | メソッド | 用途 |
|---|---|---|
| `/health` | GET | ヘルスチェック |
| `/v1/query` | POST | 質問応答 (SSE ストリーミング) |
| `/v1/upload` | POST | ファイルアップロード (multipart/form-data) |
| `/v1/index` | POST | インデックス再実行 |

対応ファイル形式: `.txt`, `.pdf`, `.csv`, `.md`
