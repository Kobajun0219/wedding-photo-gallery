import React, { useEffect } from 'react'
import './PhotoModal.css'

function PhotoModal({ photos, currentIndex, onClose, onPrevious, onNext }) {
  const currentPhoto = photos[currentIndex]

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

        <div className="photo-modal-image-container">
          <img
            src={currentPhoto.url}
            alt={`写真 ${currentIndex + 1}`}
            className="photo-modal-image"
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
