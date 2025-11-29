import React, { useState, useRef, useEffect } from 'react'
import S3Service from '../services/S3Service'
import './PhotoUpload.css'

function PhotoUpload({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const fileInputRef = useRef(null)

  // ファイル選択時の処理
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // 最大10ファイルまで
    if (files.length > 10) {
      setError('一度に選択できるファイルは10個までです')
      return
    }

    // ファイルサイズとタイプの検証
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    const validFiles = []
    const invalidFiles = []

    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (サイズが大きすぎます)`)
      } else if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (画像ファイルではありません)`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      setError(`以下のファイルはアップロードできません:\n${invalidFiles.join('\n')}`)
    }

    if (validFiles.length === 0) {
      setError('有効なファイルが選択されていません')
      return
    }

    setSelectedFiles(validFiles)
    setError(null)
    setSuccess(false)

    // プレビュー画像を生成
    const newPreviews = []
    validFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews[index] = {
          url: reader.result,
          name: file.name,
          size: file.size,
        }
        if (newPreviews.length === validFiles.length) {
          setPreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // アップロード処理
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('ファイルを選択してください')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)
    setUploadProgress(`0/${selectedFiles.length}件のアップロード中...`)

    try {
      const result = await S3Service.uploadPhotos(selectedFiles)

      const successCount = result.photos.length
      const errorCount = result.errors ? result.errors.length : 0

      if (successCount > 0) {
        setSuccess(true)
        setUploadProgress(`${successCount}件の写真のアップロードが完了しました${errorCount > 0 ? `（${errorCount}件失敗）` : ''}`)
      }

      if (errorCount > 0) {
        const errorMessages = result.errors.map(e => `${e.fileName}: ${e.error}`).join('\n')
        setError(`一部のファイルのアップロードに失敗しました:\n${errorMessages}`)
      }

      setSelectedFiles([])
      setPreviews([])

      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 親コンポーネントに通知
      if (onUploadSuccess && successCount > 0) {
        // 最初のアップロードされた写真を通知（写真リストを更新するため）
        onUploadSuccess(result.photos[0])
      }

      // 成功時は3秒後にモーダルを閉じる
      if (successCount > 0 && errorCount === 0) {
        setTimeout(() => {
          setSuccess(false)
          setUploadProgress(null)
          if (onClose) {
            onClose()
          }
        }, 3000)
      } else {
        // エラーがある場合は5秒後に成功メッセージを非表示
        setTimeout(() => {
          setSuccess(false)
          setUploadProgress(null)
        }, 5000)
      }
    } catch (err) {
      console.error('アップロードエラー:', err)
      setError(err.message || '写真のアップロードに失敗しました')
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  // ファイル選択をリセット
  const handleReset = () => {
    setSelectedFiles([])
    setPreviews([])
    setError(null)
    setSuccess(false)
    setUploadProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 個別のファイルを削除
  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
  }

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !uploading) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // モーダルが開いている時は背景のスクロールを無効化
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, uploading, onClose])

  // モーダルが閉じられた時に状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([])
      setPreviews([])
      setError(null)
      setSuccess(false)
      setUploadProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="photo-upload-modal-overlay" onClick={(e) => {
      // 背景クリックでモーダルを閉じる（アップロード中は閉じない）
      if (e.target === e.currentTarget && !uploading) {
        onClose()
      }
    }}>
      <div className="photo-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-upload-modal-header">
          <h2>写真を投稿</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            disabled={uploading}
            title="閉じる"
          >
            ×
          </button>
        </div>
        <div className="photo-upload">
          <div className="photo-upload-content">
        {/* ファイル選択 */}
        <div className="file-select-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
            onChange={handleFileSelect}
            className="file-input"
            id="photo-upload-input"
            disabled={uploading}
            multiple
          />
          <label htmlFor="photo-upload-input" className="file-input-label">
            {selectedFiles.length > 0 ? `写真を選択（${selectedFiles.length}件選択中）` : '写真を選択'}
          </label>
          {selectedFiles.length > 0 && (
            <span className="file-count">最大10件まで選択可能</span>
          )}
        </div>

        {/* プレビュー */}
        {previews.length > 0 && (
          <div className="preview-area">
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <button
                    className="remove-file-button"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                    title="削除"
                  >
                    ×
                  </button>
                  <div className="preview-image-container">
                    <img src={preview.url} alt={`プレビュー ${index + 1}`} className="preview-image" />
                  </div>
                  <div className="file-info">
                    <p className="file-name" title={preview.name}>{preview.name}</p>
                    <p className="file-size">
                      {(preview.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="upload-error">
            <p>{error}</p>
          </div>
        )}

        {/* 進捗メッセージ */}
        {uploadProgress && (
          <div className="upload-progress">
            <p>{uploadProgress}</p>
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="upload-success">
            <p>✅ {uploadProgress || '写真のアップロードが完了しました！'}</p>
          </div>
        )}

        {/* アクションボタン */}
        {selectedFiles.length > 0 && (
          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? 'アップロード中...' : `${selectedFiles.length}件をアップロード`}
            </button>
            <button
              onClick={handleReset}
              disabled={uploading}
              className="reset-button"
            >
              キャンセル
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoUpload
