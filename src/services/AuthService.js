// APIサーバー経由で認証を行うサービス
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

class AuthService {
  /**
   * ログイン（パスワード認証）
   * @param {string} password - パスワード
   * @returns {Promise<Object>} トークン情報
   */
  async login(password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました' }))
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`)
      }

      const result = await response.json()

      // トークンをローカルストレージに保存
      if (result.token) {
        localStorage.setItem('authToken', result.token)
      }

      return result
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    }
  }

  /**
   * トークンを取得
   * @returns {string|null} トークン
   */
  getToken() {
    return localStorage.getItem('authToken')
  }

  /**
   * トークンを削除（ログアウト）
   */
  logout() {
    localStorage.removeItem('authToken')
  }

  /**
   * トークンの有効性を検証
   * @returns {Promise<boolean>} 有効な場合true
   */
  async verifyToken() {
    const token = this.getToken()
    if (!token) {
      return false
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('トークン検証エラー:', error)
      return false
    }
  }

  /**
   * 認証済みリクエスト用のヘッダーを取得
   * @returns {Object} 認証ヘッダー
   */
  getAuthHeaders() {
    const token = this.getToken()
    if (!token) {
      return {}
    }
    return {
      'Authorization': `Bearer ${token}`,
    }
  }
}

export default new AuthService()
