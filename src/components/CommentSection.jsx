import React, { useState, useEffect, useRef } from 'react'
import CommentService from '../services/CommentService'
import './CommentSection.css'

function CommentSection() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  // コメントを投稿
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!commentText.trim()) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await CommentService.postComment(commentText)
      setCommentText('')
      // コメント一覧を再取得
      await loadComments()
    } catch (err) {
      console.error('コメントの投稿エラー:', err)
      setError(err.message || 'コメントの投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h2>Comments</h2>
      </div>

      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-input-wrapper">
          <div className="comment-input-container">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="なんでもどうぞ..."
              className="comment-input"
              rows={1}
              maxLength={140}
              disabled={submitting}
            />
            <span className="comment-length">
              {commentText.length}/140
            </span>
          </div>
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="comment-submit-button"
          >
            {submitting ? '投稿中...' : '投稿'}
          </button>
        </div>
      </form>

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
          comments.map((comment, index) => (
            <div key={comment.id} className={`comment-item ${index % 2 === 1 ? 'right' : ''}`}>
              {comment.displayName && (
                <span className="comment-name">{comment.displayName}</span>
              )}
              <div className="comment-bubble-wrapper">
                <div className="comment-bubble">
                  <p className="comment-message">{comment.comment}</p>
                </div>
                <div className="comment-time">
                  {new Date(comment.timestamp).toLocaleString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentSection
