import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { getStoredMember } from '../api/authSession'
import { fetchMyFeedProfile, updateFeedHandle } from '../api/feedApi'
import './FeedProfilePage.css'

function normalizePosts(posts = []) {
  return posts.map(post => ({
    ...post,
    image: post.images?.[0] || null,
    tags: post.tags || [],
  }))
}

export default function FeedProfilePage() {
  const member = getStoredMember()
  const memberId = member?.memberId
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [handleInput, setHandleInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function loadProfile() {
      if (!member) {
        window.location.replace('/login')
        return
      }

      try {
        const response = await fetchMyFeedProfile()
        if (!active) return
        setProfile(response)
        setPosts(normalizePosts(response.posts))
        setHandleInput(response.feedHandle || '')
      } catch (error) {
        if (active) setErrorMessage(error.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadProfile()
    return () => { active = false }
  /*
   * getStoredMember()는 렌더링마다 새 객체를 반환할 수 있습니다.
   * 객체 자체를 의존성으로 사용하면 입력할 때마다 프로필 조회가 반복되어
   * 사용자가 입력 중인 피드 아이디를 서버의 기존 값으로 덮어쓰게 됩니다.
   */
  }, [memberId])

  const saveHandle = async () => {
    const feedHandle = handleInput.trim().replace(/^@+/, '')
    if (!feedHandle) return

    setIsSaving(true)
    try {
      const updatedProfile = await updateFeedHandle(feedHandle)
      setProfile(current => ({ ...current, ...updatedProfile }))
      setHandleInput(updatedProfile.feedHandle || feedHandle)
      setIsEditing(false)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="feed-profile-page"><Header forceLight activePage="feed" /><main className="feed-profile-loading">SNS 프로필을 불러오는 중입니다.</main></div>

  const nickname = profile?.nickname || member?.nickname || '여행자'
  const feedHandle = profile?.feedHandle || ''

  return (
    <div className="feed-profile-page">
      <Header forceLight activePage="feed" />
      <main className="feed-profile-main">
        <a className="feed-profile-back" href="/feed">← 여행 피드로 돌아가기</a>
        {errorMessage ? (
          <section className="feed-profile-error"><strong>프로필을 불러오지 못했습니다.</strong><p>{errorMessage}</p><button type="button" onClick={() => window.location.reload()}>다시 시도</button></section>
        ) : (
          <>
            <section className="feed-profile-hero">
              <div className="feed-profile-avatar">{nickname.slice(0, 1)}</div>
              <div className="feed-profile-hero__content">
                <span>WAYLOG TRAVELER</span>
                <h1>{nickname}님의 여행 기록</h1>
                {isEditing ? (
                  <div className="feed-profile-handle-edit"><b>@</b><input value={handleInput} onChange={event => setHandleInput(event.target.value.replace(/^@+/, ''))} maxLength="20" placeholder="여행 피드 아이디" /><button type="button" disabled={isSaving} onClick={saveHandle}>{isSaving ? '저장 중' : '저장'}</button><button type="button" disabled={isSaving} onClick={() => { setHandleInput(feedHandle); setIsEditing(false) }}>취소</button></div>
                ) : (
                  <div className="feed-profile-handle"><strong>@{feedHandle || '아이디 미설정'}</strong><button type="button" onClick={() => setIsEditing(true)}>피드 아이디 수정</button></div>
                )}
                <p>내가 남긴 여행의 순간을 모아보고, 다음 여행을 위한 영감으로 다시 꺼내보세요.</p>
              </div>
              <dl><div><dt>여행 기록</dt><dd>{profile?.postCount ?? posts.length}</dd></div><div><dt>받은 좋아요</dt><dd>{profile?.receivedLikeCount ?? 0}</dd></div></dl>
            </section>

            <section className="feed-profile-records"><header><div><span>MY TRAVEL LOG</span><h2>내가 남긴 여행 기록</h2></div><a href="/feed">새 기록 작성</a></header>{posts.length === 0 ? <p className="feed-profile-empty">아직 등록한 여행 기록이 없습니다.</p> : <div className="feed-profile-grid">{posts.map(post => <article key={post.id}>{post.image ? <img src={post.image} alt="" /> : <div className="feed-profile-card-placeholder">WAYLOG</div>}<div><h3>{post.content}</h3><p>{post.location || '장소 미등록'}</p>{post.tags.length > 0 && <small>{post.tags.map(tag => `#${tag}`).join(' ')}</small>}</div></article>)}</div>}</section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
