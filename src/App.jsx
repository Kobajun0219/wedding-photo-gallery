import React, { useState, useEffect, useRef } from 'react'
import PhotoCarousel from './components/PhotoCarousel'
import CommentSection from './components/CommentSection'
import S3Service from './services/S3Service'
import './App.css'

function App() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // 写真を取得する関数
  const loadRandomPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      const randomPhotos = await S3Service.getRandomPhotos(40) // 40枚の写真をランダムに取得（1ページ8枚 × 5ページ）
      setPhotos(randomPhotos)
    } catch (err) {
      console.error('写真の読み込みエラー:', err)
      console.error('エラー詳細:', err.originalError || err)

      // より詳細なエラーメッセージを表示
      const errorMessage = err.message || '写真の読み込みに失敗しました。設定を確認してください。'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込みと定期的な更新
  useEffect(() => {
    // 初回読み込み
    loadRandomPhotos()

    // 1分ごとに自動更新
    intervalRef.current = setInterval(() => {
      loadRandomPhotos()
    }, 60000) // 1分 = 60000ミリ秒

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>Wedding Photo Gallery</h1>
        </header>

        {error && (
          <div className="error-message">
            <h3>エラーが発生しました</h3>
            <p>{error}</p>
            <div className="error-hint">
              <p><strong>確認事項:</strong></p>
              <ol>
                <li>.envファイルがプロジェクトルートに存在するか確認</li>
                <li>VITE_AWS_REGION が正しいリージョン名か確認（例: ap-northeast-1, us-east-1）</li>
                <li>VITE_AWS_ACCESS_KEY_ID が正しいアクセスキーIDか確認</li>
                <li>VITE_AWS_SECRET_ACCESS_KEY が正しいシークレットキーか確認</li>
                <li>VITE_S3_BUCKET_NAME が正しいバケット名か確認</li>
                <li>IAMユーザーにS3への読み取り権限（s3:ListBucket, s3:GetObject）があるか確認</li>
                <li>開発サーバーを再起動したか確認（.envファイルを変更した場合は再起動が必要）</li>
              </ol>
              <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                <strong>ヒント:</strong> ブラウザの開発者ツール（F12）のコンソールタブでより詳細なエラー情報を確認できます。
              </p>
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="photo-area">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>写真を読み込み中...</p>
              </div>
            ) : (
              photos.length > 0 ? (
                <PhotoCarousel photos={photos} photosPerSlide={8} />
              ) : (
                <div className="no-photos">
                  <p>写真が見つかりませんでした</p>
                </div>
              )
            )}
          </div>
          <div className="comment-area">
            <CommentSection />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
