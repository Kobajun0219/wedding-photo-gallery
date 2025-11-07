# Wedding Photo Gallery

結婚式の写真をS3からランダムに取得してカルーセル形式で表示し、LINE経由で投稿されたコメントを表示するReactアプリケーションです。

## 機能

- AWS S3からランダムに写真を取得（1分ごとに自動更新）
- パネル式のマソンリーレイアウトで写真を表示
- 美しいカルーセル形式でスライド表示
- LINE経由で投稿されたコメントを表示（30秒ごとに自動更新）
- レスポンシブデザイン対応
- 薄めの黄色系のテーマ

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

#### フロントエンド用（プロジェクトルート）
`.env`ファイルを作成し、以下の設定を追加（オプション - APIサーバーのURLを変更する場合のみ）：

```env
VITE_API_BASE_URL=http://localhost:3002
```

#### バックエンド用（server/.env）
`server`ディレクトリに`.env`ファイルを作成し、AWS認証情報を設定してください：

```env
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-bucket-name
PORT=3002
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**重要**:
- バックエンドサーバー用の`.env`ファイルは`server`ディレクトリに作成してください
- AWS認証情報には、S3とDynamoDBの両方へのアクセス権限が必要です
- 本番環境では`FRONTEND_URL`にフロントエンドのURLを設定してください

### 3. 開発サーバーの起動

#### 方法1: サーバーとフロントエンドを同時に起動（推奨）

```bash
npm run dev:all
```

#### 方法2: 別々に起動

ターミナル1（バックエンドサーバー）:
```bash
npm run dev:server
```

ターミナル2（フロントエンド）:
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

## AWS設定

### S3の設定

このアプリケーションを使用するには、以下の権限が必要です：

- `s3:ListBucket` - バケット内のオブジェクトをリストアップ
- `s3:GetObject` - オブジェクトを取得

### DynamoDBの設定

コメント機能を使用するには、DynamoDBテーブルが必要です：

- **テーブル名**: `weddingComment`
- **パーティションキー**: `messageId` (String)
- **その他の属性**:
  - `userId` (String): LINEユーザーID
  - `displayName` (String): 表示名
  - `text` (String): コメント内容
  - `timestamp` (Number): UNIXタイムスタンプ

### IAMポリシーの例

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
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

このアプリケーションは、セキュリティを向上させるため、バックエンドAPIサーバー経由でAWSサービスにアクセスします：

- **フロントエンド**: React + Vite（ポート3000）
- **バックエンドAPI**: Express.js（ポート3002）
- **ストレージ**: AWS S3（写真）
- **データベース**: AWS DynamoDB（コメント）

この構成により、AWS認証情報をクライアント側に露出することなく、安全にS3から写真を取得し、DynamoDBからコメントを取得できます。

### データフロー

1. **写真の取得**: フロントエンド → バックエンドAPI → S3 → 署名付きURLを生成 → フロントエンド
2. **コメントの取得**: フロントエンド → バックエンドAPI → DynamoDB → フロントエンド（30秒ごとに自動更新）
3. **コメントの投稿**: LINE → DynamoDB（フロントエンドからは直接投稿不可）

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックデプロイ

#### 推奨: Vercel（フロントエンド）+ Railway（バックエンド）

1. **バックエンドをRailwayにデプロイ**
   - Railwayで`server`ディレクトリをデプロイ
   - 環境変数を設定

2. **フロントエンドをVercelにデプロイ**
   - Vercelでプロジェクトルートをデプロイ
   - 環境変数`VITE_API_BASE_URL`にRailwayのURLを設定

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## 技術スタック

- **フロントエンド**: React 18, Vite, Swiper.js
- **バックエンド**: Express.js, AWS SDK v3
- **ストレージ**: AWS S3（写真）
- **データベース**: AWS DynamoDB（コメント）

## ライセンス

MIT
