import { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { getStoredMember } from '../api/authSession'
import {
  fetchFeedPost,
  toggleFeedBookmark,
  toggleFeedLike,
} from '../api/feedApi'
import './FeedPostDetailPage.css'

function formatCreatedAt(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 여행 피드 게시글 한 건을 읽는 상세 화면입니다. */
export default function FeedPostDetailPage() {
  const postId = window.location.pathname.split('/').filter(Boolean).at(-1)
  const member = getStoredMember()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const imageSliderRef = useRef(null)
  const imageDragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })

  useEffect(() => {
    let isActive = true

    async function loadPost() {
      try {
        const data = await fetchFeedPost(postId)

        if (isActive) {
          setPost(data)
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || '여행 기록을 불러오지 못했습니다.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      isActive = false
    }
  }, [postId])

  const requireLogin = () => {
    if (member) return true

    window.alert('로그인 후 이용할 수 있습니다.')
    window.location.assign('/login')
    return false
  }

  const handleLike = async () => {
    if (!post || !requireLogin()) return

    try {
      const result = await toggleFeedLike(post.id)

      setPost((current) => ({
        ...current,
        liked: result.active,
        likeCount: Math.max(0, current.likeCount + (result.active ? 1 : -1)),
      }))
    } catch (error) {
      window.alert(error.message)
    }
  }

  const handleBookmark = async () => {
    if (!post || !requireLogin()) return

    try {
      const result = await toggleFeedBookmark(post.id)

      setPost((current) => ({
        ...current,
        bookmarked: result.active,
      }))
    } catch (error) {
      window.alert(error.message)
    }
  }

  const sharePost = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'WayLog 여행 기록',
        url: window.location.href,
      })
      return
    }

    await navigator.clipboard?.writeText(window.location.href)
    window.alert('게시글 주소를 복사했습니다.')
  }

  /**
   * 이미지 영역을 누른 지점과 현재 스크롤 위치를 기억합니다.
   * pointer 이벤트를 사용해 마우스 드래그와 모바일 터치를 함께 처리합니다.
   */
  const startImageDrag = (event) => {
    const slider = imageSliderRef.current

    if (!slider || images.length < 2) return

    imageDragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: slider.scrollLeft,
    }

    slider.setPointerCapture?.(event.pointerId)
  }

  const moveImageDrag = (event) => {
    const slider = imageSliderRef.current
    const drag = imageDragRef.current

    if (!slider || !drag.active) return

    // 마우스를 왼쪽으로 끌면 다음 이미지 방향으로 이동합니다.
    slider.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX)
  }

  const endImageDrag = (event) => {
    const slider = imageSliderRef.current

    imageDragRef.current.active = false
    slider?.releasePointerCapture?.(event.pointerId)
  }

  const author = post?.author || {}
  const nickname = author.nickname || '여행자'
  const handle = author.feedHandle || `waylog_${author.id || 'traveler'}`
  const images = Array.isArray(post?.images) ? post.images : []
  // FeedPostResponse의 실제 응답 필드명은 location입니다.
  const location = post?.location || post?.address

  return (
    <div className="feed-detail-page">
      <Header forceLight activePage="feed" />

      <main className="feed-detail-page__main">
        <a className="feed-detail-page__back" href="/feed">
          ← 여행 피드로 돌아가기
        </a>

        {isLoading && (
          <p className="feed-detail-page__status">
            여행 기록을 불러오는 중입니다.
          </p>
        )}

        {!isLoading && errorMessage && (
          <div className="feed-detail-page__status feed-detail-page__status--error">
            <p>{errorMessage}</p>
            <a href="/feed">피드 목록으로 돌아가기</a>
          </div>
        )}

        {!isLoading && !errorMessage && post && (
          <article className="feed-detail-card">
            <header className="feed-detail-card__author">
              <span className="feed-detail-card__avatar" aria-hidden="true">
                {nickname.slice(0, 1)}
              </span>

              <div>
                <strong>{nickname}</strong>
                <span>@{handle} · {formatCreatedAt(post.createdAt)}</span>
              </div>

              <button type="button" onClick={sharePost}>공유</button>
            </header>

            <section className="feed-detail-card__content">
              <p>{post.content}</p>

              {post.tags?.length > 0 && (
                <div className="feed-detail-card__tags">
                  {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              )}
            </section>

            {images.length > 0 && (
              <section className="feed-detail-card__gallery">
                <div
                  className={`feed-detail-card__images is-count-${images.length}`}
                  ref={imageSliderRef}
                  aria-label="여행 사진 슬라이더"
                  onPointerDown={startImageDrag}
                  onPointerMove={moveImageDrag}
                  onPointerUp={endImageDrag}
                  onPointerCancel={endImageDrag}
                >
                {images.map((image, index) => (
                  <img
                    src={image}
                    alt={`${nickname}님의 여행 사진 ${index + 1}`}
                    key={`${image}-${index}`}
                  />
                ))}
                </div>

                {images.length > 1 && (
                  <span className="feed-detail-card__image-count">
                    사진 {images.length}장 · 좌우로 밀어보기
                  </span>
                )}
              </section>
            )}

            {location && (
              <section className="feed-detail-card__location">
                <PlacePinIcon size={20} />

                <div>
                  <strong>{post.location || '여행 장소'}</strong>
                  {post.address && <span>{post.address}</span>}
                </div>
              </section>
            )}

            <footer className="feed-detail-card__actions">
              <button
                className={post.liked ? 'is-liked' : ''}
                type="button"
                onClick={handleLike}
              >
                <span>{post.liked ? '❤' : '♡'}</span>
                좋아요 {post.likeCount || 0}
              </button>

              <button
                className={post.bookmarked ? 'is-saved' : ''}
                type="button"
                onClick={handleBookmark}
              >
                <span>{post.bookmarked ? '★' : '☆'}</span>
                {post.bookmarked ? '저장됨' : '저장'}
              </button>
            </footer>
          </article>
        )}
      </main>

      <Footer />
    </div>
  )
}
