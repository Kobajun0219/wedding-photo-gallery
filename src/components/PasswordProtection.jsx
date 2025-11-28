import React, { useState, useEffect } from 'react'
import AuthService from '../services/AuthService'
import './PasswordProtection.css'

function PasswordProtection({ onPasswordCorrect }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  // トークンの有効性を確認
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await AuthService.verifyToken()
      if (isValid) {
        setIsAuthenticated(true)
        if (onPasswordCorrect) {
          onPasswordCorrect()
        }
      }
      setChecking(false)
    }
    checkAuth()
  }, [onPasswordCorrect])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const result = await AuthService.login(password)
      if (result.success) {
        setIsAuthenticated(true)
        if (onPasswordCorrect) {
          onPasswordCorrect()
        }
      }
    } catch (err) {
      setError(err.message || 'パスワードが正しくありません')
      setPassword('')
    }
  }

  // 認証状態を確認中
  if (checking) {
    return (
      <div className="password-protection-overlay">
        <div className="password-protection-modal">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>認証を確認中...</p>
          </div>
        </div>
      </div>
    )
  }

  // 既に認証済みの場合は何も表示しない
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="password-protection-overlay">
      <div className="password-protection-modal">
        <div className="password-protection-header">
          <h2>パスワードを入力</h2>
        </div>
        <form onSubmit={handleSubmit} className="password-form">
          <div className="password-input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="パスワードを入力してください"
              className="password-input"
              autoFocus
            />
          </div>
          {error && (
            <div className="password-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="password-submit-button"
            disabled={!password.trim()}
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}

export default PasswordProtection
