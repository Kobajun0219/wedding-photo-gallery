import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiHome, HiPhotograph, HiCloudUpload } from 'react-icons/hi'
import './Footer.css'

function Footer({ onUploadClick }) {
  const location = useLocation()
  const isGallery = location.pathname === '/'
  const isPhotoList = location.pathname === '/list'

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <nav className="footer-nav">
          <Link
            to="/"
            className={`nav-link ${isGallery ? 'active' : ''}`}
            title="配信"
          >
            <HiHome className="nav-icon" />
            <span className="nav-text">配信</span>
          </Link>
          <Link
            to="/list"
            className={`nav-link ${isPhotoList ? 'active' : ''}`}
            title="写真一覧"
          >
            <HiPhotograph className="nav-icon" />
            <span className="nav-text">写真一覧</span>
          </Link>
          <button
            className="upload-button-footer"
            onClick={onUploadClick}
            title="写真を投稿"
          >
            <HiCloudUpload className="nav-icon" />
            <span className="nav-text">写真投稿</span>
          </button>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
