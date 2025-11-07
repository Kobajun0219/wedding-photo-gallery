# トラブルシューティングガイド

## 本番環境での接続エラー

### エラー: "サーバーが正しく起動していない可能性があります"

このエラーが発生する場合、以下の点を確認してください。

### 1. フロントエンドの環境変数設定（Vercel/Netlify）

**Vercelの場合:**
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 以下の環境変数を追加：
   ```
   VITE_API_BASE_URL=https://wedding-photo-gallery-production.up.railway.app
   ```
3. **重要**: `https://` を含めてください
4. デプロイを再実行

**Netlifyの場合:**
1. Netlifyダッシュボード → Site settings → Environment variables
2. 同様に環境変数を追加
3. デプロイを再実行

### 2. バックエンドのCORS設定（Railway/Render）

**Railwayの場合:**
1. Railwayダッシュボード → プロジェクト → Variables
2. 以下の環境変数を確認・追加：
   ```
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```
3. フロントエンドの実際のURLを設定してください
4. デプロイを再実行

### 3. API URLの確認

ブラウザで直接アクセスして確認：

```
https://wedding-photo-gallery-production.up.railway.app/api/health
```

正常な場合、以下のJSONが返ります：
```json
{"status":"ok"}
```

### 4. よくある問題

#### 問題1: プロトコル（https://）が含まれていない

**症状**: API URLが `wedding-photo-gallery-production.up.railway.app` のように表示される

**解決策**: 環境変数に `https://` を含める
```
VITE_API_BASE_URL=https://wedding-photo-gallery-production.up.railway.app
```

#### 問題2: CORSエラー

**症状**: ブラウザのコンソールにCORSエラーが表示される

**解決策**:
- バックエンドの `FRONTEND_URL` 環境変数にフロントエンドのURLを設定
- フロントエンドのURLが正確か確認（末尾のスラッシュなし）

#### 問題3: 環境変数が反映されない

**症状**: 環境変数を設定したが、まだエラーが発生する

**解決策**:
- デプロイを再実行（環境変数の変更後は再デプロイが必要）
- ビルドログで環境変数が読み込まれているか確認
- 環境変数の名前が正しいか確認（`VITE_` プレフィックスが必要）

### 5. デバッグ方法

#### ブラウザのコンソールで確認

1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブでエラーメッセージを確認
3. NetworkタブでAPIリクエストの状態を確認
   - リクエストURLが正しいか
   - ステータスコード（200, 404, 500など）
   - レスポンスの内容

#### サーバーログで確認

Railway/Renderのログを確認：
- APIリクエストが届いているか
- エラーメッセージがないか
- CORSエラーが発生していないか

### 6. チェックリスト

- [ ] フロントエンドの環境変数 `VITE_API_BASE_URL` が設定されている
- [ ] API URLに `https://` が含まれている
- [ ] バックエンドの環境変数 `FRONTEND_URL` が設定されている
- [ ] フロントエンドのURLが正確（末尾のスラッシュなし）
- [ ] デプロイが再実行されている
- [ ] `/api/health` エンドポイントが正常に動作している
- [ ] ブラウザのコンソールでエラーを確認
