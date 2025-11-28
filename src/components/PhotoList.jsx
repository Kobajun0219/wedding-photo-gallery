import React, { useState, useEffect, useRef, useCallback } from 'react'
import S3Service from '../services/S3Service'
import PhotoModal from './PhotoModal'
import './PhotoList.css'

function PhotoList() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const photosPerPage = 100
  const observerTarget = useRef(null)

  // 写真一覧を取得（追加読み込み対応）
  const loadPhotos = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const result = await S3Service.getPhotoList(page, photosPerPage)

      if (append) {
        // 既存の写真に追加
        setPhotos(prev => [...prev, ...result.photos])
      } else {
        // 新しい写真リストに置き換え
        setPhotos(result.photos)
      }

      setTotalPages(result.totalPages)
      setTotal(result.total)
      setCurrentPage(result.page)
      setHasMore(result.page < result.totalPages)
    } catch (err) {
      console.error('写真一覧の読み込みエラー:', err)
      setError(err.message || '写真一覧の読み込みに失敗しました')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadPhotos(1, false)
  }, [])

  // 無限スクロール用のObserver
  const handleObserver = useCallback((entries) => {
    const [target] = entries
    if (target.isIntersecting && hasMore && !loadingMore && !loading) {
      const nextPage = currentPage + 1
      loadPhotos(nextPage, true)
    }
  }, [hasMore, loadingMore, loading, currentPage])

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [handleObserver])

  return (
    <div className="photo-list-container">
      <div className="photo-list-header">
        <h1>Photo Gallery</h1>
      </div>

      {error && (
        <div className="photo-list-error">
          <p>{error}</p>
        </div>
      )}

      {loading && photos.length === 0 ? (
        <div className="photo-list-loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="photo-list-empty">
          <p>写真が見つかりませんでした</p>
        </div>
      ) : (
        <>
          <div className="photo-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.key || `${photo.url}-${index}`}
                className="photo-item"
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <img
                  src={photo.url}
                  alt={`写真 ${index + 1}`}
                  className="photo-image"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* 写真モーダル */}
          {selectedPhotoIndex !== null && (
            <PhotoModal
              photos={photos}
              currentIndex={selectedPhotoIndex}
              onClose={() => setSelectedPhotoIndex(null)}
              onPrevious={() => {
                if (selectedPhotoIndex > 0) {
                  setSelectedPhotoIndex(selectedPhotoIndex - 1)
                }
              }}
              onNext={() => {
                if (selectedPhotoIndex < photos.length - 1) {
                  setSelectedPhotoIndex(selectedPhotoIndex + 1)
                } else if (hasMore) {
                  // 最後の写真を表示中で、まだ読み込める写真がある場合
                  const nextPage = currentPage + 1
                  loadPhotos(nextPage, true).then(() => {
                    setSelectedPhotoIndex(photos.length)
                  })
                }
              }}
            />
          )}

          {/* 無限スクロール用の監視要素 */}
          {hasMore && (
            <div ref={observerTarget} className="scroll-observer">
              {loadingMore && (
                <div className="loading-more">
                  <div className="spinner-small"></div>
                  <p>読み込み中...</p>
                </div>
              )}
            </div>
          )}

          {/* すべて読み込み完了 */}
          {!hasMore && photos.length > 0 && (
            <div className="load-complete">
              <p>すべての写真を表示しました</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PhotoList
