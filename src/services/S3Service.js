// APIサーバー経由でS3から写真を取得するサービス
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

class S3Service {
  /**
   * S3バケットからランダムに写真を取得（API経由）
   * @param {number} count - 取得する写真の数
   * @returns {Promise<Array>} 写真のURL配列
   */
  async getRandomPhotos(count = 10) {
    try {
      console.log('APIサーバーから写真を取得中...', `${API_BASE_URL}/api/photos/random?count=${count}`)

      const response = await fetch(`${API_BASE_URL}/api/photos/random?count=${count}`)

      // Content-Typeを確認して、HTMLが返ってきていないかチェック
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('サーバーからJSON以外のレスポンスが返りました:', text.substring(0, 200))
        throw new Error(`サーバーが正しく起動していない可能性があります。APIサーバー（${API_BASE_URL}）が起動しているか確認してください。`)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const photoUrls = await response.json()
      console.log('取得した写真数:', photoUrls.length)
      return photoUrls
    } catch (error) {
      console.error('写真の取得に失敗しました:', error)

      // エラーメッセージを詳細化
      let errorMessage = '写真の取得に失敗しました。'

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'APIサーバーに接続できません。サーバーが起動しているか確認してください。\n\n解決方法:\n1. ターミナルで `npm run dev:server` を実行してサーバーを起動\n2. または `npm run dev:all` でサーバーとフロントエンドを同時に起動\n3. サーバーが起動している場合、`http://localhost:3002/api/health` にアクセスして確認'
      } else if (error.message.includes('サーバーが正しく起動していない')) {
        errorMessage = error.message
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = `APIサーバーから予期しないレスポンスが返りました。サーバーが正しく起動しているか確認してください。\n\n確認方法:\n1. ターミナルでサーバーのログを確認\n2. ブラウザで http://localhost:3002/api/health にアクセスして、{"status":"ok"} が返るか確認\n3. server/.env ファイルが正しく設定されているか確認`
      } else if (error.message) {
        errorMessage = error.message
      } else {
        errorMessage = `エラー: ${error.message || JSON.stringify(error)}`
      }

      const detailedError = new Error(errorMessage)
      detailedError.originalError = error
      throw detailedError
    }
  }

}

export default new S3Service()
