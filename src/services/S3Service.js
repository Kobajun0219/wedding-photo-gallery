// APIサーバー経由でS3から写真を取得するサービス
import AuthService from './AuthService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

class S3Service {
  /**
   * 写真一覧を取得（API経由、ページネーション対応）
   * @param {number} page - ページ番号（1から始まる）
   * @param {number} limit - 1ページあたりの写真数
   * @returns {Promise<Object>} 写真一覧とページネーション情報
   */
  async getPhotoList(page = 1, limit = 100) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/photos/list?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('写真一覧の取得に失敗しました:', error)
      throw error
    }
  }

  /**
   * S3バケットからランダムに写真を取得（API経由）
   * @param {number} count - 取得する写真の数
   * @returns {Promise<Array>} 写真のURL配列
   */
  async getRandomPhotos(count = 10) {
    try {
      console.log('APIサーバーから写真を取得中...', `${API_BASE_URL}/api/photos/random?count=${count}`)

      const response = await fetch(`${API_BASE_URL}/api/photos/random?count=${count}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
      })

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

  /**
   * 写真をS3にアップロード（API経由）
   * @param {File} file - アップロードするファイル
   * @param {Function} onProgress - 進捗コールバック関数（オプション）
   * @returns {Promise<Object>} アップロードされた写真の情報
   */
  async uploadPhoto(file, onProgress) {
    try {
      // ファイルサイズの検証（10MB制限）
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。')
      }

      // ファイルタイプの検証
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('画像ファイルのみアップロードできます（JPEG, PNG, GIF, WebP, BMP）')
      }

      // FormDataを作成
      const formData = new FormData()
      formData.append('photos', file)

      console.log('写真をアップロード中...', file.name)

      // アップロードリクエスト
      const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
        method: 'POST',
        headers: {
          ...AuthService.getAuthHeaders(),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const result = await response.json()
      console.log('写真のアップロードが完了しました:', result.photos[0].name)
      return result.photos[0]
    } catch (error) {
      console.error('写真のアップロードに失敗しました:', error)
      throw error
    }
  }

  /**
   * 複数の写真をS3にアップロード（API経由）
   * @param {File[]} files - アップロードするファイルの配列
   * @param {Function} onProgress - 進捗コールバック関数（オプション）
   * @returns {Promise<Object>} アップロードされた写真の情報
   */
  async uploadPhotos(files, onProgress) {
    try {
      if (!files || files.length === 0) {
        throw new Error('ファイルが選択されていません')
      }

      // 最大10ファイルまで
      if (files.length > 10) {
        throw new Error('一度にアップロードできるファイルは10個までです')
      }

      // 各ファイルの検証
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']

      for (const file of files) {
        if (file.size > maxSize) {
          throw new Error(`ファイル "${file.name}" のサイズが大きすぎます。10MB以下のファイルをアップロードしてください。`)
        }
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`ファイル "${file.name}" は画像ファイルではありません。画像ファイルのみアップロードできます（JPEG, PNG, GIF, WebP, BMP）`)
        }
      }

      // FormDataを作成
      const formData = new FormData()
      files.forEach(file => {
        formData.append('photos', file)
      })

      console.log(`${files.length}件の写真をアップロード中...`)

      // アップロードリクエスト
      const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
        method: 'POST',
        headers: {
          ...AuthService.getAuthHeaders(),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const result = await response.json()
      console.log(`${result.photos.length}件の写真のアップロードが完了しました`)

      if (result.errors && result.errors.length > 0) {
        console.warn('一部のファイルのアップロードに失敗しました:', result.errors)
      }

      return result
    } catch (error) {
      console.error('写真のアップロードに失敗しました:', error)
      throw error
    }
  }

}

export default new S3Service()
