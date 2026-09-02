import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import FeedPostCreateModal from '../components/feed/FeedPostCreateModal'
import { getStoredMember } from '../api/authSession'
import {
  createFeedPost,
  fetchFeedPosts,
  fetchMyFeedProfile,
  toggleFeedBookmark,
  toggleFeedLike,
} from '../api/feedApi'
import './TravelFeedPage.css'

const avatarColors = ['#4f83e8', '#269c88', '#e97868', '#8b6fd8', '#de8b3e']

function formatCreatedAt(value) {
  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) return ''

  const seconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
  if (seconds < 60) return '방금'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
  return createdAt.toLocaleDateString('ko-KR')
}

/** 백엔드 응답을 기존 피드 카드가 사용하는 화면 모델로 변환합니다. */
function normalizePost(post) {
  const nickname = post.author?.nickname || '여행자'
  const authorId = Number(post.author?.id || 0)
  // 백엔드가 전달한 피드 핸들을 우선 사용합니다.
  // 기존 임시 값(@waylog_{회원번호})은 피드 프로필을 수정한 뒤에도 바뀌지 않는 원인이었습니다.
  const rawHandle = String(post.author?.feedHandle || post.author?.handle || '').replace(/^@+/, '')
  return {
    ...post,
    author: {
      ...post.author,
      nickname,
      handle: rawHandle ? `@${rawHandle}` : `@waylog_${post.author?.id || 'traveler'}`,
      initial: nickname.slice(0, 1),
      color: avatarColors[Math.abs(authorId) % avatarColors.length],
    },
    createdAt: formatCreatedAt(post.createdAt),
    image: post.images?.[0] || null,
    location: post.location || post.locationName || post.address || '장소 미등록',
    tags: post.tags || [],
    liked: Boolean(post.liked),
    bookmarked: Boolean(post.bookmarked),
  }
}

function Avatar({ author, large = false }) {
  return <span className={`feed-avatar${large ? ' feed-avatar--large' : ''}`} style={{ background: author.color }} aria-hidden="true">{author.initial}</span>
}

function CoursePreview({ course, onOpen }) {
  return (
    <section className="feed-course-preview" aria-label={`${course.title} 여행코스`}>
      <div className="feed-course-preview__heading">
        <div><span>WAYLOG COURSE</span><h3>{course.title}</h3><p>{course.summary} · {course.duration}</p></div>
        <button type="button" onClick={onOpen}>여행코스로 보기</button>
      </div>
      <ol className="feed-course-route">
        {course.places.map(place => <li key={place.tourContentId}><b>{place.sequence}</b><span>{place.title}</span></li>)}
      </ol>
    </section>
  )
}

function CourseModal({ course, onClose }) {
  useEffect(() => {
    const closeWithEscape = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeWithEscape)
    return () => window.removeEventListener('keydown', closeWithEscape)
  }, [onClose])

  return (
    <div className="feed-course-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <header>
          <div><span>여행자가 만든 코스</span><h2 id="course-modal-title">{course.title}</h2><p>{course.summary} · {course.duration}</p></div>
          <button type="button" aria-label="닫기" onClick={onClose}>×</button>
        </header>
        {/* 카카오 지도 SDK 연결 전에도 코스 순서와 연결성을 설명할 수 있는 발표용 영역입니다. */}
        <div className="feed-course-map" aria-label="카카오 지도 연결 예정 영역">
          <div className="feed-course-map__badge">KAKAO MAP</div>
          <div className="feed-course-map__line" />
          {course.places.map((place, index) => (
            <span className="feed-course-map__marker" style={{ left: `${18 + index * 32}%`, top: `${34 + (index % 2) * 22}%` }} key={place.tourContentId}>{place.sequence}</span>
          ))}
          <p>카카오 지도 API 연결 시 저장된 위도·경도로 번호 마커와 이동 순서를 표시합니다.</p>
        </div>
        <ol className="feed-course-places">
          {course.places.map(place => (
            <li key={place.tourContentId}><b>{place.sequence}</b><div><strong>{place.title}</strong><span>{place.address}</span></div><small>TourAPI #{place.tourContentId}</small></li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default function TravelFeedPage() {
  const member = getStoredMember()
  const memberId = member?.memberId
  const [myFeedHandle, setMyFeedHandle] = useState('')
  const currentAuthor = {
    nickname: member?.nickname || '여행자',
    handle: myFeedHandle ? `@${myFeedHandle}` : '',
    initial: (member?.nickname || '여').slice(0, 1),
    color: '#3b82f6',
  }
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    let active = true

    async function loadPosts() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await fetchFeedPosts({ page: 1, size: 10 })
        if (active) setPosts((response.posts || []).map(normalizePost))
      } catch (error) {
        if (active) setErrorMessage(error.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadPosts()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadMyFeedHandle() {
      if (!memberId) {
        setMyFeedHandle('')
        return
      }

      try {
        // 피드 메인 진입 때 최신 프로필을 다시 읽어 /feed/profile의 변경값을 반영합니다.
        const profile = await fetchMyFeedProfile({ page: 1, size: 1 })
        if (active) setMyFeedHandle(String(profile.feedHandle || '').replace(/^@+/, ''))
      } catch {
        // 프로필 영역의 보조 정보이므로 피드 목록 조회를 실패 처리하지 않습니다.
        if (active) setMyFeedHandle('')
      }
    }

    loadMyFeedHandle()
    return () => { active = false }
  }, [memberId])

  const requireLogin = () => {
    if (member) return true
    window.alert('로그인 후 이용할 수 있습니다.')
    window.location.assign('/login')
    return false
  }

  const openCreateModal = () => {
    if (requireLogin()) setShowCreateModal(true)
  }

  const publishPost = async postInput => {
    const createdPost = await createFeedPost({
      content: postInput.content,
      locationName: postInput.location,
      address: postInput.location,
      latitude: null,
      longitude: null,
      tourContentId: null,
      tourContentTypeId: null,
      visibility: 'PUBLIC',
      tags: postInput.tags,
      // 로컬 File 객체는 JSON으로 전송할 수 없으므로 업로드 API 구현 전에는 저장하지 않습니다.
      images: postInput.images,
    })

    setPosts(current => [normalizePost(createdPost), ...current])
    setShowCreateModal(false)
  }

  const handleLike = async postId => {
    if (!requireLogin()) return
    try {
      const { active } = await toggleFeedLike(postId)
      setPosts(current => current.map(post => post.id === postId
        ? { ...post, liked: active, likeCount: Math.max(0, post.likeCount + (active ? 1 : -1)) }
        : post))
    } catch (error) {
      window.alert(error.message)
    }
  }

  const handleBookmark = async postId => {
    if (!requireLogin()) return
    try {
      const { active } = await toggleFeedBookmark(postId)
      setPosts(current => current.map(post => post.id === postId
        ? { ...post, bookmarked: active }
        : post))
    } catch (error) {
      window.alert(error.message)
    }
  }

  return (
    <div className="travel-feed-page">
      <Header forceLight activePage="feed" />
      <main className="travel-feed-layout">
        <section className="travel-feed-main">
          <header className="feed-page-heading">
            <div><span>WAYLOG SOCIAL</span><h1>여행 피드</h1><p>여행자의 기록을 보고, 마음에 드는 동선을 나만의 여행코스로 발견해 보세요.</p></div>
            <a href={member ? '/feed/profile' : '/login'}>{member ? '내 기록 보기' : '로그인'}</a>
          </header>

          <section className="feed-composer">
            <Avatar author={currentAuthor} />
            <div>
              <button className="feed-composer__prompt" type="button" onClick={openCreateModal}>{member ? '이번 여행에서 만난 순간을 기록해 보세요.' : '로그인하고 여행 이야기를 남겨보세요.'}</button>
              <footer><div><span>▧ 사진</span><span>⌖ 위치</span><span># 태그</span><span>⌁ 여행코스</span></div><button type="button" onClick={openCreateModal}>기록 작성</button></footer>
            </div>
          </section>

          <div className="feed-timeline">
            {isLoading && <p className="feed-timeline__status">여행 기록을 불러오는 중입니다.</p>}
            {!isLoading && errorMessage && <div className="feed-timeline__status feed-timeline__status--error"><p>{errorMessage}</p><button type="button" onClick={() => window.location.reload()}>다시 시도</button></div>}
            {!isLoading && !errorMessage && posts.length === 0 && <div className="feed-timeline__status"><strong>아직 등록된 여행 기록이 없습니다.</strong><p>첫 번째 여행 이야기를 남겨보세요.</p></div>}
            {posts.map(post => {
              // 기존 게시글 응답에 feedHandle이 없더라도, 로그인한 본인의 글은
              // 방금 조회한 최신 프로필 핸들로 표시합니다.
              const isMyPost = memberId && Number(post.author?.id) === Number(memberId)
              const postHandle = isMyPost && myFeedHandle ? `@${myFeedHandle}` : post.author.handle
              return (
                <article className="feed-post" key={post.id}>
                  <header><Avatar author={post.author} /><div><strong>{post.author.nickname}</strong><span>{postHandle} · {post.createdAt}</span></div>{post.course && <em>코스가 있는 기록</em>}</header>
                  <div className="feed-post__content"><p>{post.content}</p>{post.tags.length > 0 && <div className="feed-post__tags">{post.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>}</div>
                  {post.image && <figure className="feed-post__media"><img src={post.image} alt={`${post.author.nickname}님의 여행 기록`} /><figcaption><PlacePinIcon />{post.location}</figcaption></figure>}
                  {post.course && <CoursePreview course={post.course} onOpen={() => setSelectedCourse(post.course)} />}
                  <footer className="feed-post__actions">
                    <button className={post.liked ? 'is-liked' : ''} type="button" onClick={() => handleLike(post.id)}><span>{post.liked ? '❤' : '♡'}</span>{post.likeCount}</button>
                    <button className={post.bookmarked ? 'is-saved' : ''} type="button" onClick={() => handleBookmark(post.id)}><span>{post.bookmarked ? '🌟' : '⭐'}</span>{post.bookmarked ? '저장됨' : '저장'}</button>
                    <a className="feed-post__detail-link" href={`/feed/posts/${post.id}`}>기록 자세히 보기 →</a>
                  </footer>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="travel-feed-aside">
          <section className="feed-profile-card"><div className="feed-profile-card__cover" /><Avatar author={currentAuthor} large /><h2>{member?.nickname || '여행자님'}</h2>{member && myFeedHandle && <strong className="feed-profile-card__handle">@{myFeedHandle}</strong>}<p>{member ? '나만의 여행을 기록하고 코스로 공유해 보세요.' : '로그인하면 여행 기록을 남기고 저장할 수 있어요.'}</p><a href={member ? '/feed/profile' : '/login'}>{member ? '내 SNS 프로필' : '로그인하기'}</a></section>
          <section className="feed-guide-card"><span>WAYLOG FEED</span><h2>여행의 순간을<br />기록하고 나눠 보세요</h2><ol><li><b>1</b>다른 여행자의 새로운 기록 둘러보기</li><li><b>2</b>사진과 장소를 담아 여행 기록 작성하기</li><li><b>3</b>마음에 드는 기록에 좋아요·저장하기</li></ol></section>
          <section className="feed-notice-card"><strong>여행 기록 작성 팁</strong><p>장소와 해시태그를 함께 남기면 다른 여행자가 원하는 여행 정보를 더 쉽게 발견할 수 있어요.</p></section>
        </aside>
      </main>
      {showCreateModal && <FeedPostCreateModal author={currentAuthor} onClose={() => setShowCreateModal(false)} onSubmit={publishPost} />}
      {selectedCourse && <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
      <Footer />
    </div>
  )
}
