# S3バケットのCORS設定方法

ブラウザからS3に直接アクセスする場合、CORS（Cross-Origin Resource Sharing）設定が必要です。

## AWSマネジメントコンソールでの設定手順

1. **S3コンソールにアクセス**
   - https://console.aws.amazon.com/s3/ にアクセス
   - 対象のバケットを選択

2. **権限タブを開く**
   - バケットの詳細ページで「権限」タブをクリック

3. **CORS設定を追加**
   - 「クロスオリジンリソース共有 (CORS)」セクションまでスクロール
   - 「編集」ボタンをクリック

4. **CORS設定JSONを入力**
   以下のJSONをコピーして貼り付け：

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**注意**: 本番環境では `"AllowedOrigins"` の `"*"` を削除し、実際のドメイン名を指定してください。

5. **保存**
   - 「変更を保存」をクリック

## 設定の説明

- `AllowedOrigins`: アクセスを許可するオリジン（ドメイン）
  - 開発環境: `http://localhost:3000`, `http://localhost:5173` など
  - 本番環境: 実際のドメイン名（例: `https://yourdomain.com`）
- `AllowedMethods`: 許可するHTTPメソッド（GETとHEADのみで十分）
- `AllowedHeaders`: 許可するHTTPヘッダー
- `MaxAgeSeconds`: プリフライトリクエストのキャッシュ時間

## トラブルシューティング

設定後もエラーが発生する場合：
1. ブラウザのキャッシュをクリア
2. 開発サーバーを再起動
3. ブラウザの開発者ツール（F12）のネットワークタブでエラーを確認
