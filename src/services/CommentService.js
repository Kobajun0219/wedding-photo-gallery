// APIサーバー経由でコメントを取得・投稿するサービス
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

class CommentService {
  /**
   * コメント一覧を取得
   * @returns {Promise<Array>} コメント配列
   */
  async getComments() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const comments = await response.json()
      return comments
    } catch (error) {
      console.error('コメントの取得に失敗しました:', error)
      throw error
    }
  }

  /**
   * コメントを投稿
   * @param {string} message - コメントメッセージ
   * @returns {Promise<Object>} 投稿されたコメント
   */
  async postComment(message) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const comment = await response.json()
      return comment
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error)
      throw error
    }
  }
}

export default new CommentService()
