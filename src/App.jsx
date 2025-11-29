import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import PhotoCarousel from './components/PhotoCarousel'
import CommentSection from './components/CommentSection'
import PhotoUpload from './components/PhotoUpload'
import PhotoList from './components/PhotoList'
import Footer from './components/Footer'
import PasswordProtection from './components/PasswordProtection'
import S3Service from './services/S3Service'
import AuthService from './services/AuthService'
import './App.css'

// メインのギャラリーページ
function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false) // 動画表示の切り替え
  const intervalRef = useRef(null)

  // YouTube動画のID（環境変数から取得、デフォルト値あり）
  const youtubeVideoId = import.meta.env.VITE_YOUTUBE_VIDEO_ID || 'glGhaLKBJTo'


  // 写真を取得する関数
  const loadRandomPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      const randomPhotos = await S3Service.getRandomPhotos(25) // 25枚の写真をランダムに取得（1ページ5枚 × 5ページ）
      setPhotos(randomPhotos)
    } catch (err) {
      console.error('写真の読み込みエラー:', err)
      console.error('エラー詳細:', err.originalError || err)

      // 認証エラーの場合はログアウト
      if (err.message && (err.message.includes('認証') || err.message.includes('401') || err.message.includes('403'))) {
        AuthService.logout()
        window.location.reload()
        return
      }

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
    <div className="app-container">

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
            {showVideo ? (
              // YouTube動画表示
              <div className="youtube-video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="youtube-iframe"
                ></iframe>
              </div>
            ) : loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>写真を読み込み中...</p>
              </div>
            ) : (
              photos.length > 0 ? (
                <PhotoCarousel photos={photos} photosPerSlide={5} />
              ) : (
                <div className="no-photos">
                  <p>写真が見つかりませんでした</p>
                </div>
              )
            )}

            {/* 切り替えボタン（常に表示） */}
            <button
              className="view-toggle-button"
              onClick={() => setShowVideo(!showVideo)}
              title={showVideo ? '写真を表示' : '動画を表示'}
              type="button"
            >
              {showVideo ? '📷' : '▶️'}
            </button>
          </div>
          <div className="comment-area">
            <CommentSection />
          </div>
        </div>
    </div>
  )
}

// レイアウトコンポーネント（ナビゲーション付き）
function Layout({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const isPhotoListPage = location.pathname === '/list'

  // 認証状態を確認
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await AuthService.verifyToken()
      if (isValid) {
        setIsAuthenticated(true)
      } else {
        AuthService.logout()
      }
    }
    checkAuth()
  }, [])

  // 写真一覧ページの場合はbodyとhtmlにクラスを追加してスクロールを有効化
  useEffect(() => {
    if (isPhotoListPage) {
      document.body.classList.add('photo-list-page')
      document.documentElement.classList.add('photo-list-page')
    } else {
      document.body.classList.remove('photo-list-page')
      document.documentElement.classList.remove('photo-list-page')
    }
    return () => {
      document.body.classList.remove('photo-list-page')
      document.documentElement.classList.remove('photo-list-page')
    }
  }, [isPhotoListPage])

  // パスワード認証成功時のコールバック
  const handlePasswordCorrect = () => {
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <PasswordProtection onPasswordCorrect={handlePasswordCorrect} />
      </div>
    )
  }

  // アップロード成功時のコールバック（全ページ共通）
  const handleUploadSuccess = () => {
    // ページをリロードして最新の写真を表示
    window.location.reload()
  }

  return (
    <div className={`app ${isPhotoListPage ? 'photo-list-page' : ''}`}>
      <div className="app-content-wrapper">
        {children}
      </div>
      <Footer onUploadClick={() => setIsUploadModalOpen(true)} />
      {/* アップロードモーダル（全ページ共通） */}
      <PhotoUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}

// メインのAppコンポーネント
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/list" element={<PhotoList />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
