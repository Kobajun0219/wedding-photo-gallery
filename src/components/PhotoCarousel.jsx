import React, { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import './PhotoCarousel.css'

function PhotoCarousel({ photos, photosPerSlide = 8 }) {
  if (!photos || photos.length === 0) {
    return null
  }

  // 1ページ8枚の写真をグループ化
  const photoGroups = useMemo(() => {
    if (!photos || photos.length === 0) return []

    // ランダムなサイズパターンを生成（1x1, 2x1, 1x2, 2x2など）
    const getRandomSize = () => {
      const sizes = [
        { spanRow: 1, spanCol: 1 }, // 通常サイズ
        { spanRow: 1, spanCol: 2 }, // 横長
        { spanRow: 2, spanCol: 1 }, // 縦長
        { spanRow: 2, spanCol: 2 }, // 大きい
      ]
      return sizes[Math.floor(Math.random() * sizes.length)]
    }

    // 写真を8枚ずつグループ化し、各写真にランダムなサイズを割り当て
    const groups = []
    for (let i = 0; i < photos.length; i += photosPerSlide) {
      const group = photos.slice(i, i + photosPerSlide).map((photo, index) => ({
        ...photo,
        size: getRandomSize(),
        id: `${i}-${index}`,
      }))
      groups.push(group)
    }
    return groups
  }, [photos, photosPerSlide])

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
                      gridRow: `span ${photo.size.spanRow}`,
                      gridColumn: `span ${photo.size.spanCol}`,
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
