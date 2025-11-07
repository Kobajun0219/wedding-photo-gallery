# デプロイ手順

このアプリケーションは、フロントエンドとバックエンドを別々にデプロイする必要があります。

## 推奨デプロイ方法

### 方法 1: Vercel（フロントエンド）+ Railway（バックエンド）【推奨】

#### バックエンド（Railway）のデプロイ

1. **Railway アカウントを作成**

   - https://railway.app/ にアクセス
   - GitHub アカウントでサインイン

2. **プロジェクトを作成**

   - "New Project" → "Deploy from GitHub repo"
   - このリポジトリを選択

3. **サーバーのみをデプロイ**

   - Railway の設定で、ルートディレクトリを `server` に変更
   - または、`server`ディレクトリのみをデプロイ

4. **環境変数を設定**

   - Railway のダッシュボードで環境変数を設定：
     ```
     AWS_REGION=ap-northeast-1
     AWS_ACCESS_KEY_ID=your-access-key-id
     AWS_SECRET_ACCESS_KEY=your-secret-access-key
     S3_BUCKET_NAME=your-bucket-name
     PORT=3002
     FRONTEND_URL=https://your-frontend-domain.vercel.app
     ```

   **注意**: AWS 認証情報には、S3 と DynamoDB の両方へのアクセス権限が必要です。

5. **デプロイ**
   - Railway が自動的にデプロイを開始
   - デプロイが完了したら、API の URL（例: `https://your-app.railway.app`）をメモ

#### フロントエンド（Vercel）のデプロイ

1. **Vercel アカウントを作成**

   - https://vercel.com/ にアクセス
   - GitHub アカウントでサインイン

2. **プロジェクトを作成**

   - "New Project" → このリポジトリを選択

3. **ビルド設定**

   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **環境変数を設定**

   ```
   VITE_API_BASE_URL=https://your-app.railway.app
   ```

5. **デプロイ**
   - Vercel が自動的にデプロイを開始
   - デプロイが完了したら、フロントエンドの URL が表示されます

---

### 方法 2: Netlify（フロントエンド）+ Render（バックエンド）

#### バックエンド（Render）のデプロイ

1. **Render アカウントを作成**

   - https://render.com/ にアクセス
   - GitHub アカウントでサインイン

2. **新しい Web サービスを作成**

   - "New" → "Web Service"
   - このリポジトリを選択

3. **設定**

   - Name: `wedding-photo-api`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - Root Directory: `server`

4. **環境変数を設定**

   ```
   AWS_REGION=ap-northeast-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   S3_BUCKET_NAME=your-bucket-name
   PORT=3002
   FRONTEND_URL=https://your-frontend-domain.netlify.app
   ```

   **注意**: AWS 認証情報には、S3 と DynamoDB の両方へのアクセス権限が必要です。

5. **デプロイ**
   - Render が自動的にデプロイを開始
   - デプロイが完了したら、API の URL をメモ

#### フロントエンド（Netlify）のデプロイ

1. **Netlify アカウントを作成**

   - https://www.netlify.com/ にアクセス
   - GitHub アカウントでサインイン

2. **プロジェクトを作成**

   - "Add new site" → "Import an existing project"
   - このリポジトリを選択

3. **ビルド設定**

   - Build command: `npm run build`
   - Publish directory: `dist`

4. **環境変数を設定**

   ```
   VITE_API_BASE_URL=https://your-app.onrender.com
   ```

5. **デプロイ**
   - Netlify が自動的にデプロイを開始

---

### 方法 3: AWS（Amplify + EC2/Elastic Beanstalk）

#### バックエンド（EC2 または Elastic Beanstalk）

1. **EC2 インスタンスを作成**（または Elastic Beanstalk を使用）

2. **サーバーをデプロイ**

   ```bash
   # EC2にSSH接続
   git clone your-repository
   cd weddingPhoto/server
   npm install
   # PM2などでプロセス管理
   pm2 start index.js --name wedding-api
   ```

3. **環境変数を設定**
   - EC2 の環境変数または`.env`ファイルに設定

#### フロントエンド（Amplify）

1. **AWS Amplify コンソールを開く**

   - AWS Amplify → "New app" → "Host web app"

2. **リポジトリを接続**

   - GitHub/Bitbucket/GitLab からリポジトリを選択

3. **ビルド設定**

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - "**/*"
     cache:
       paths:
         - node_modules/**/*
   ```

4. **環境変数を設定**
   ```
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

---

## デプロイ前の確認事項

### 1. CORS 設定の確認

バックエンドの`server/index.js`では、環境変数`FRONTEND_URL`を使用して CORS を設定しています。
本番環境では、バックエンドの環境変数に以下を追加してください：

```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

これにより、本番環境のフロントエンド URL が自動的に CORS に追加されます。

### 2. 環境変数の確認

- **バックエンド**:
  - AWS 認証情報（S3 と DynamoDB の両方へのアクセス権限が必要）
  - S3 バケット名が正しく設定されているか
  - `FRONTEND_URL`が本番環境のフロントエンド URL に設定されているか
- **フロントエンド**: API のベース URL が正しく設定されているか

### 3. AWS DynamoDB テーブルの準備

- **テーブル名**: `weddingComment`
- **パーティションキー**: `messageId` (String)
- **その他の属性**:
  - `userId` (String): LINE ユーザー ID
  - `displayName` (String): 表示名
  - `text` (String): コメント内容
  - `timestamp` (Number): UNIX タイムスタンプ

DynamoDB テーブルが作成されていることを確認してください。

### 4. ビルドの確認

ローカルでビルドが成功するか確認：

```bash
# フロントエンド
npm run build

# バックエンド（テスト）
cd server
npm install
node index.js
```

### 5. DynamoDB の動作確認

- DynamoDB テーブル`weddingComment`が存在することを確認
- AWS 認証情報に DynamoDB への読み取り権限があることを確認
- `/api/comments`エンドポイントが正常に動作することを確認

---

## トラブルシューティング

### バックエンドに接続できない

- フロントエンドの環境変数`VITE_API_BASE_URL`が正しいか確認
- バックエンドの CORS 設定にフロントエンドの URL が含まれているか確認
- バックエンドのログを確認

### 環境変数が読み込まれない

- 各プラットフォームの環境変数設定画面で確認
- 環境変数の名前が正しいか確認（大文字・小文字を区別）
- デプロイを再実行

### ビルドエラー

- ローカルでビルドが成功するか確認
- プラットフォームのビルドログを確認
- Node.js のバージョンが適切か確認

### コメントが取得できない

- **DynamoDB テーブル**: `weddingComment`テーブルが存在するか確認
- **AWS 認証情報**: DynamoDB への読み取り権限があるか確認
- **リージョン**: `AWS_REGION`が正しく設定されているか確認（デフォルト: `ap-northeast-1`）
- **ログ**: バックエンドのログを確認して、エラーが発生していないか確認
- **CORS**: フロントエンドから API にアクセスできるか確認

---

## 費用目安

### 無料プラン

- **Vercel**: 無料（個人使用）
- **Railway**: 無料クレジット $5/月
- **Render**: 無料プランあり（スリープする可能性あり）
- **Netlify**: 無料プランあり

### 有料プラン

- **Vercel Pro**: $20/月
- **Railway**: 使用量に応じた従量課金
- **Render**: $7/月から
- **AWS**: 使用量に応じた従量課金

---

## コメント機能について

### データの保存方法

現在、コメントは**AWS DynamoDB**に保存されます。

- **テーブル名**: `weddingComment`
- **パーティションキー**: `messageId` (String)
- **投稿方法**: LINE 経由で投稿（フロントエンドからの直接投稿は不可）
- **取得方法**: フロントエンドが 30 秒ごとに自動取得

### DynamoDB テーブルの設定

1. **テーブルの作成**

   AWS DynamoDB コンソールで以下の設定でテーブルを作成：

   - テーブル名: `weddingComment`
   - パーティションキー: `messageId` (String)
   - キャパシティモード: オンデマンド（推奨）またはプロビジョンド

2. **IAM 権限の設定**

   AWS 認証情報に以下の権限が必要：

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
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

3. **コスト**

   - オンデマンドモード: 100 万読み取りリクエストあたり約 0.25 USD
   - 30 秒ごとの更新: 月額約 0.06 円（小規模利用の場合）
   - AWS 無料利用枠（12 ヶ月間）: 2.5 億読み取りリクエスト/月まで無料

### フロントエンドの動作

- ページ読み込み時にコメントを取得
- 30 秒ごとに自動でコメントを再取得
- LINE 経由で投稿された新しいコメントは、30 秒以内に自動で表示されます

---

## セキュリティのベストプラクティス

1. **環境変数の管理**

   - 本番環境の認証情報は、プラットフォームの環境変数機能を使用
   - `.env`ファイルを Git にコミットしない

2. **HTTPS の使用**

   - すべての通信は HTTPS を使用
   - プラットフォームの証明書を利用

3. **CORS の設定**

   - 必要最小限のオリジンのみを許可
   - ワイルドカード（`*`）は使用しない
   - `FRONTEND_URL`環境変数で本番環境の URL を設定

4. **アクセス制御**

   - AWS IAM で最小権限の原則を適用
   - 定期的にアクセスキーをローテーション

5. **コメント機能のセキュリティ**
   - コメントは LINE 経由で投稿されるため、LINE 側で認証・検証が行われます
   - DynamoDB への直接アクセスはバックエンド API 経由のみ
   - 必要に応じてレート制限を追加
   - 不適切なコンテンツのフィルタリングは LINE 側で実装
