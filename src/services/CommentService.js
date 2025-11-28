// APIサーバー経由でコメントを取得・投稿するサービス
import AuthService from './AuthService'

// 環境変数から取得、プロトコルがない場合は自動で追加
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

// プロトコルがない場合はhttps://を追加（本番環境用）
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  API_BASE_URL = `https://${API_BASE_URL}`
}

class CommentService {
  /**
   * コメント一覧を取得
   * @returns {Promise<Array>} コメント配列
   */
  async getComments() {
    try {
      const apiUrl = `${API_BASE_URL}/api/comments`
      console.log('コメントを取得中...', apiUrl)
      console.log('現在のAPI_BASE_URL:', API_BASE_URL)

      const response = await fetch(apiUrl, {
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

      const comments = await response.json()
      return comments
    } catch (error) {
      console.error('コメントの取得に失敗しました:', error)
      console.error('エラー詳細:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        API_BASE_URL: API_BASE_URL
      })

      // より詳細なエラーメッセージを提供
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        if (isProduction) {
          const detailedError = new Error(`コメントの取得に失敗しました。\n\nAPI URL: ${API_BASE_URL}\n\n本番環境での確認事項:\n1. 環境変数 \`VITE_API_BASE_URL\` が設定されているか\n2. API URLに \`https://\` が含まれているか\n3. バックエンドのCORS設定を確認`)
          detailedError.originalError = error
          throw detailedError
        }
      }

      throw error
    }
  }

  /**
   * コメントを投稿
   * @param {string} comment - コメント内容
   * @returns {Promise<Object>} 投稿されたコメント
   */
  async postComment(comment) {
    try {
      if (!comment || !comment.trim()) {
        throw new Error('コメントが空です')
      }

      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({ comment: comment.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const result = await response.json()
      return result.comment
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error)
      throw error
    }
  }
}

export default new CommentService()
