# Git リポジトリのセットアップ手順

## 現在の状態

✅ Git リポジトリは初期化済み
✅ すべてのファイルがコミット済み

## GitHub にアップロードする手順

### 1. GitHub でリポジトリを作成

1. https://github.com にアクセスしてログイン
2. 右上の「+」ボタン → 「New repository」をクリック
3. リポジトリ名を入力（例: `wedding-photo-gallery`）
4. 「Public」または「Private」を選択
5. **「Initialize this repository with a README」はチェックしない**（既に README があるため）
6. 「Create repository」をクリック

### 2. リモートリポジトリを追加

GitHub でリポジトリを作成すると、URL が表示されます。以下のコマンドを実行してください：

```bash
git remote add origin https://github.com/your-username/wedding-photo-gallery.git
```

または、SSH を使用する場合：

```bash
git remote add origin git@github.com:your-username/wedding-photo-gallery.git
```

### 3. ブランチ名を確認・変更（必要に応じて）

```bash
# 現在のブランチ名を確認
git branch

# ブランチ名が「main」でない場合、変更
git branch -M main
```

### 4. プッシュ

```bash
git push -u origin main
```

初回プッシュ時は、GitHub の認証情報を入力する必要があります。

## 認証方法

### Personal Access Token（推奨）

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token (classic)」をクリック
3. スコープで「repo」にチェック
4. トークンを生成してコピー
5. プッシュ時にパスワードの代わりにトークンを入力

### SSH 認証

SSH 鍵を設定している場合は、SSH URL を使用できます。

## 今後の更新方法

コードを変更した後：

```bash
# 変更を確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "変更内容の説明"

# プッシュ
git push
```

## 注意事項

- `.env`ファイルや`server/.env`ファイルは`.gitignore`に含まれているため、コミットされません
- `node_modules`も`.gitignore`に含まれているため、コミットされません
- 本番環境の認証情報は絶対にコミットしないでください
