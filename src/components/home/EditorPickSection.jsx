import { useEffect, useState } from 'react'
import jejuImage from '../../assets/editor-pick-jeju.png'
import jeonjuImage from '../../assets/editor-pick-jeonju.png'
import gangneungImage from '../../assets/editor-pick-gangneung.png'
import './EditorPickSection.css'

// 에디터 추천 콘텐츠 원본 배열입니다. 슬라이더는 이 배열을 한 칸씩 순환합니다.
const editorPicks = [
  {
    id: 1,
    image: jejuImage,
    title: '봄바람 따라 걷는 제주의 노란 산책길',
    location: '제주',
    theme: '봄 여행',
  },
  {
    id: 2,
    image: jeonjuImage,
    title: '천천히 걸어야 발견하는 전주의 풍경',
    location: '전주',
    theme: '골목 여행',
  },
  {
    id: 3,
    image: gangneungImage,
    title: '커피 한 잔과 함께 즐기는 동해의 오후',
    location: '강릉',
    theme: '바다 여행',
  },
  {
    id: 4,
    image: jejuImage,
    title: '유채꽃 향기 따라 떠나는 제주 동쪽 여행',
    location: '제주',
    theme: '자연 여행',
  },
  {
    id: 5,
    image: gangneungImage,
    title: '파도 소리와 함께 머무는 강릉의 하루',
    location: '강릉',
    theme: '힐링 여행',
  },
  {
    id: 6,
    image: jeonjuImage,
    title: '한옥 사이로 마주한 전주의 따뜻한 밤',
    location: '전주',
    theme: '문화 여행',
  },
]

function EditorPickSection() {
  const [visibleCount, setVisibleCount] = useState(3)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // 화면 너비에 따라 한 번에 보이는 카드 수를 1/2/3개로 조절합니다.
    const updateVisibleCount = () => {
      if (window.innerWidth <= 700) {
        setVisibleCount(1)
      } else if (window.innerWidth <= 1200) {
        setVisibleCount(2)
      } else {
        setVisibleCount(3)
      }
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)

    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  // resize 직후 기존 인덱스가 범위를 벗어나지 않도록 safeIndex로 보정합니다.
  const maxIndex = editorPicks.length - visibleCount
  const safeIndex = Math.min(currentIndex, maxIndex)
  const translatePercent = (safeIndex * 100) / visibleCount
  const translateGap = (safeIndex * 20) / visibleCount

  const movePrevious = () => {
    // 첫 카드에서 이전을 누르면 마지막 표시 구간으로 순환합니다.
    setCurrentIndex((index) => {
      const safeCurrentIndex = Math.min(index, maxIndex)
      return safeCurrentIndex === 0 ? maxIndex : safeCurrentIndex - 1
    })
  }

  const moveNext = () => {
    // 마지막 표시 구간에서 다음을 누르면 첫 카드로 순환합니다.
    setCurrentIndex((index) => {
      const safeCurrentIndex = Math.min(index, maxIndex)
      return safeCurrentIndex === maxIndex ? 0 : safeCurrentIndex + 1
    })
  }

  return (
    <section className="editor-pick-section" aria-labelledby="editor-pick-title">
      <div className="editor-pick-section__header">
        <h2 id="editor-pick-title">WayLog 에디터 추천</h2>
        <a href="#editor-picks">
          에디터 콘텐츠 전체 보기
          <span className="editor-pick-section__arrow" aria-hidden="true" />
        </a>
      </div>

      <div className="editor-pick-slider">
        <div className="editor-pick-viewport">
          <div
            className="editor-pick-track"
            style={{
              '--visible-count': visibleCount,
              transform: `translateX(calc(-${translatePercent}% - ${translateGap}px))`,
            }}
          >
            {editorPicks.map((pick) => (
              <article className="editor-pick-card" key={pick.id}>
                <a className="editor-pick-card__image-link" href={`#editor-pick-${pick.id}`}>
                  <img src={pick.image} alt={`${pick.title} 여행지`} />
                </a>

                <div className="editor-pick-card__content">
                  <span className="editor-pick-card__badge">EDITOR PICK</span>
                  <h3>{pick.title}</h3>
                  <p>{pick.location}<span aria-hidden="true"> · </span>{pick.theme}</p>
                  <a className="editor-pick-card__read-more" href={`#editor-pick-${pick.id}`}>
                    이야기 읽기 <span aria-hidden="true">›</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button
          className="editor-pick-control editor-pick-control--previous"
          type="button"
          onClick={movePrevious}
          aria-label="이전 콘텐츠"
        >
          <span className="editor-pick-control-icon editor-pick-control-icon--previous" aria-hidden="true" />
        </button>
        <button
          className="editor-pick-control editor-pick-control--next"
          type="button"
          onClick={moveNext}
          aria-label="다음 콘텐츠"
        >
          <span className="editor-pick-control-icon editor-pick-control-icon--next" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

export default EditorPickSection
