import React, { useState, useEffect, useRef } from 'react'
import CommentService from '../services/CommentService'
import './CommentSection.css'

function CommentSection() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // コメント一覧を取得
  const loadComments = async () => {
    try {
      setError(null)
      const fetchedComments = await CommentService.getComments()
      setComments(fetchedComments)
    } catch (err) {
      console.error('コメントの読み込みエラー:', err)
      setError('コメントの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込みと定期的な更新
  useEffect(() => {
    // 初回読み込み
    loadComments()

    // 30秒ごとに自動更新
    intervalRef.current = setInterval(() => {
      loadComments()
    }, 30000) // 30秒 = 30000ミリ秒

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // handleSubmitはLINE経由で投稿するため不要

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h2>Comments</h2>
      </div>

      {/* LINE経由でコメントを投稿するため、フォームは非表示 */}

      {error && (
        <div className="comment-error" style={{ padding: '10px', color: '#c33', fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="comments-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            読み込み中...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            まだコメントがありません
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.messageId} className="comment-item">
              {comment.displayName && (
                <div className="comment-header-info">
                  <span className="comment-name">{comment.displayName}</span>
                </div>
              )}
              <p className="comment-message">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentSection
