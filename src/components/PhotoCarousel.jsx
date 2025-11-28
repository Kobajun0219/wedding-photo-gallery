import React, { useMemo, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import './PhotoCarousel.css'

function PhotoCarousel({ photos, photosPerSlide = 5 }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!photos || photos.length === 0) {
    return null
  }

  // 5枚の写真を空白なく配置する固定パターン
  // デスクトップ用（3列グリッド）
  const desktopLayoutPatterns = [
    // パターン1: 上段3枚、下段2枚（左2列、右1列）
    [
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 1 }, // 上段左
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 2 }, // 上段中央
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 3 }, // 上段右
      { spanRow: 1, spanCol: 2, gridRow: 2, gridCol: 1 }, // 下段左（2列分）
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 3 }, // 下段右
    ],
    // パターン2: 上段2枚（左2列、右1列）、下段3枚
    [
      { spanRow: 1, spanCol: 2, gridRow: 1, gridCol: 1 }, // 上段左（2列分）
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 3 }, // 上段右
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 1 }, // 下段左
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 2 }, // 下段中央
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 3 }, // 下段右
    ],
    // パターン3: 上段2枚（左2列、右1列）、中段1枚（3列分）、下段2枚（左1列、右2列）
    [
      { spanRow: 1, spanCol: 2, gridRow: 1, gridCol: 1 }, // 上段左（2列分）
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 3 }, // 上段右
      { spanRow: 1, spanCol: 3, gridRow: 2, gridCol: 1 }, // 中段（3列分）
      { spanRow: 1, spanCol: 1, gridRow: 3, gridCol: 1 }, // 下段左
      { spanRow: 1, spanCol: 2, gridRow: 3, gridCol: 2 }, // 下段右（2列分）
    ],
  ]

  // スマホ用（2列グリッド）
  const mobileLayoutPatterns = [
    // パターン1: 上段2枚、中段2枚、下段1枚（2列分）
    [
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 1 }, // 上段左
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 2 }, // 上段右
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 1 }, // 中段左
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 2 }, // 中段右
      { spanRow: 1, spanCol: 2, gridRow: 3, gridCol: 1 }, // 下段（2列分）
    ],
    // パターン2: 上段1枚（2列分）、中段2枚、下段2枚
    [
      { spanRow: 1, spanCol: 2, gridRow: 1, gridCol: 1 }, // 上段（2列分）
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 1 }, // 中段左
      { spanRow: 1, spanCol: 1, gridRow: 2, gridCol: 2 }, // 中段右
      { spanRow: 1, spanCol: 1, gridRow: 3, gridCol: 1 }, // 下段左
      { spanRow: 1, spanCol: 1, gridRow: 3, gridCol: 2 }, // 下段右
    ],
    // パターン3: 上段2枚、中段1枚（2列分）、下段2枚
    [
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 1 }, // 上段左
      { spanRow: 1, spanCol: 1, gridRow: 1, gridCol: 2 }, // 上段右
      { spanRow: 1, spanCol: 2, gridRow: 2, gridCol: 1 }, // 中段（2列分）
      { spanRow: 1, spanCol: 1, gridRow: 3, gridCol: 1 }, // 下段左
      { spanRow: 1, spanCol: 1, gridRow: 3, gridCol: 2 }, // 下段右
    ],
  ]

  // 1ページ5枚の写真をグループ化
  const photoGroups = useMemo(() => {
    if (!photos || photos.length === 0) return []

    const layoutPatterns = isMobile ? mobileLayoutPatterns : desktopLayoutPatterns

    const groups = []
    for (let i = 0; i < photos.length; i += photosPerSlide) {
      const groupPhotos = photos.slice(i, i + photosPerSlide)

      // 5枚未満の場合は通常の1x1配置
      if (groupPhotos.length < 5) {
        const cols = isMobile ? 2 : 3
        const group = groupPhotos.map((photo, index) => ({
          ...photo,
          layout: {
            spanRow: 1,
            spanCol: 1,
            gridRow: Math.floor(index / cols) + 1,
            gridCol: (index % cols) + 1
          },
          id: `${i}-${index}`,
        }))
        groups.push(group)
        continue
      }

      // 5枚の場合は固定パターンからランダムに選択
      const pattern = layoutPatterns[Math.floor(Math.random() * layoutPatterns.length)]
      const group = groupPhotos.map((photo, index) => ({
        ...photo,
        layout: pattern[index],
        id: `${i}-${index}`,
      }))
      groups.push(group)
    }
    return groups
  }, [photos, photosPerSlide, isMobile])

  return (
    <div className="photo-carousel-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={true}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 8000, // 8秒ごとにスライド（ページが次々と変わる）
          disableOnInteraction: false,
        }}
        loop={photoGroups.length > 1}
        className="photo-swiper"
      >
        {photoGroups.map((group, groupIndex) => (
          <SwiperSlide key={`group-${groupIndex}`}>
            <div className="slide-content panel-layout">
              <div className="photo-masonry-grid">
                {group.map((photo) => (
                  <div
                    key={photo.id || photo.key}
                    className="photo-panel"
                    style={{
                      gridRow: `${photo.layout.gridRow} / span ${photo.layout.spanRow}`,
                      gridColumn: `${photo.layout.gridCol} / span ${photo.layout.spanCol}`,
                    }}
                  >
                    <div className="photo-panel-inner">
                      <img
                        src={photo.url}
                        alt={photo.name || `Photo ${photo.id}`}
                        className="panel-image"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          // 画像読み込みエラー時の処理
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default PhotoCarousel
