import React, { useEffect, useRef, useState } from 'react'
import './PhotoModal.css'

function PhotoModal({ photos, currentIndex, onClose, onPrevious, onNext }) {
  const currentPhoto = photos[currentIndex]
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const imageContainerRef = useRef(null)

  // スワイプの最小距離（ピクセル）
  const minSwipeDistance = 50

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    // モーダルが開いている時は背景のスクロールを無効化
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  // 左右の矢印キーで前後の写真に移動
  useEffect(() => {
    const handleArrowKeys = (e) => {
      if (e.key === 'ArrowLeft') {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }
    document.addEventListener('keydown', handleArrowKeys)
    return () => {
      document.removeEventListener('keydown', handleArrowKeys)
    }
  }, [onPrevious, onNext])

  // タッチ開始
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  // タッチ移動
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  // タッチ終了（スワイプ判定）
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      onNext() // 左にスワイプ = 次の写真
    } else if (isRightSwipe) {
      onPrevious() // 右にスワイプ = 前の写真
    }
  }

  // マウスドラッグ対応
  const [mouseStart, setMouseStart] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = (e) => {
    setIsDragging(true)
    setMouseStart(e.clientX)
  }

  const onMouseMove = (e) => {
    if (!isDragging) return
    // ドラッグ中の処理は必要に応じて追加
  }

  const onMouseUp = (e) => {
    if (!isDragging || !mouseStart) {
      setIsDragging(false)
      return
    }

    const distance = mouseStart - e.clientX
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      onNext() // 左にドラッグ = 次の写真
    } else if (isRightSwipe) {
      onPrevious() // 右にドラッグ = 前の写真
    }

    setIsDragging(false)
    setMouseStart(null)
  }

  if (!currentPhoto) {
    return null
  }

  return (
    <div
      className="photo-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="photo-modal-close"
          onClick={onClose}
          title="閉じる (ESC)"
        >
          ×
        </button>

        {currentIndex > 0 && (
          <button
            className="photo-modal-nav photo-modal-prev"
            onClick={onPrevious}
            title="前の写真 (←)"
          >
            ‹
          </button>
        )}

        <div
          className="photo-modal-image-container"
          ref={imageContainerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <img
            src={currentPhoto.url}
            alt={`写真 ${currentIndex + 1}`}
            className="photo-modal-image"
            draggable={false}
          />
        </div>

        {currentIndex < photos.length - 1 && (
          <button
            className="photo-modal-nav photo-modal-next"
            onClick={onNext}
            title="次の写真 (→)"
          >
            ›
          </button>
        )}

        <div className="photo-modal-info">
          <span className="photo-modal-counter">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PhotoModal
