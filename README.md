# Wedding Photo Gallery

結婚式の写真を S3 からランダムに取得してカルーセル形式で表示し、LINE 経由で投稿されたコメントを表示する React アプリケーションです。

## 機能

- AWS S3 からランダムに写真を取得（1 分ごとに自動更新）
- **サイト内で写真を S3 にアップロード**
- パネル式のマソンリーレイアウトで写真を表示
- 美しいカルーセル形式でスライド表示
- LINE 経由で投稿されたコメントを表示（30 秒ごとに自動更新）
- レスポンシブデザイン対応
- 薄めの黄色系のテーマ

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

#### フロントエンド用（プロジェクトルート）

`.env`ファイルを作成し、以下の設定を追加（オプション - API サーバーの URL を変更する場合のみ）：

```env
VITE_API_BASE_URL=http://localhost:3002
```

#### バックエンド用（server/.env）

`server`ディレクトリに`.env`ファイルを作成し、AWS 認証情報を設定してください：

```env
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-bucket-name
PORT=3002
FRONTEND_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=your-very-long-random-secret-key-here
```

**重要**:

- バックエンドサーバー用の`.env`ファイルは`server`ディレクトリに作成してください
- AWS 認証情報には、S3 と DynamoDB の両方へのアクセス権限が必要です
- 本番環境では`FRONTEND_URL`にフロントエンドの URL を設定してください
- **`JWT_SECRET`**: JWT トークンの署名に使用される秘密鍵です。本番環境では必ず設定してください。ランダムで推測困難な長い文字列（32 文字以上推奨）を設定してください。開発環境では未設定でも動作しますが、デフォルト値が使用されます。

### 3. 開発サーバーの起動

#### 方法 1: サーバーとフロントエンドを同時に起動（推奨）

```bash
npm run dev:all
```

#### 方法 2: 別々に起動

ターミナル 1（バックエンドサーバー）:

```bash
npm run dev:server
```

ターミナル 2（フロントエンド）:

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてアプリケーションを確認できます。

## ビルド

本番環境用のビルド：

```bash
npm run build
```

ビルドファイルは `dist` ディレクトリに生成されます。

## AWS 設定

### S3 の設定

このアプリケーションを使用するには、以下の権限が必要です：

- `s3:ListBucket` - バケット内のオブジェクトをリストアップ
- `s3:GetObject` - オブジェクトを取得
- `s3:PutObject` - オブジェクトをアップロード（写真アップロード機能用）

### DynamoDB の設定

コメント機能を使用するには、DynamoDB テーブルが必要です：

- **テーブル名**: `weddingComment`
- **パーティションキー**: `messageId` (String)
- **その他の属性**:
  - `userId` (String): LINE ユーザー ID
  - `displayName` (String): 表示名
  - `text` (String): コメント内容
  - `timestamp` (Number): UNIX タイムスタンプ

### IAM ポリシーの例

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:*:table/weddingComment"
    }
  ]
}
```

## アーキテクチャ

このアプリケーションは、セキュリティを向上させるため、バックエンド API サーバー経由で AWS サービスにアクセスします：

- **フロントエンド**: React + Vite（ポート 3000）
- **バックエンド API**: Express.js（ポート 3002）
- **ストレージ**: AWS S3（写真）
- **データベース**: AWS DynamoDB（コメント）

この構成により、AWS 認証情報をクライアント側に露出することなく、安全に S3 から写真を取得し、DynamoDB からコメントを取得できます。

### データフロー

1. **写真の取得**: フロントエンド → バックエンド API → S3 → 署名付き URL を生成 → フロントエンド
2. **写真のアップロード**: フロントエンド → バックエンド API → S3（`uploads/`フォルダに保存）
3. **コメントの取得**: フロントエンド → バックエンド API → DynamoDB → フロントエンド（30 秒ごとに自動更新）
4. **コメントの投稿**: LINE → DynamoDB（フロントエンドからは直接投稿不可）

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックデプロイ

#### 推奨: Vercel（フロントエンド）+ Railway（バックエンド）

1. **バックエンドを Railway にデプロイ**

   - Railway で`server`ディレクトリをデプロイ
   - 環境変数を設定

2. **フロントエンドを Vercel にデプロイ**
   - Vercel でプロジェクトルートをデプロイ
   - 環境変数`VITE_API_BASE_URL`に Railway の URL を設定

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## 技術スタック

- **フロントエンド**: React 18, Vite, Swiper.js
- **バックエンド**: Express.js, AWS SDK v3
- **ストレージ**: AWS S3（写真）
- **データベース**: AWS DynamoDB（コメント）

## ライセンス

MIT
