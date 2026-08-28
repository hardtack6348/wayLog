import { useEffect, useRef, useState } from 'react'
import logo from '../../assets/figma/logo.png'
import './Header.css'
import { clearAuthSession, getStoredMember } from '../../api/authSession'
import { logout } from '../../api/authApi'

/**
 * 모든 일반 콘텐츠 페이지에서 공유하는 상단 헤더입니다.
 * forceLight: Hero 이미지가 없는 페이지에서도 흰 배경 헤더를 강제로 사용합니다.
 * activePage: 현재 메뉴에 활성화 밑줄을 표시하기 위한 페이지 식별자입니다.
 */
function Header({ forceLight = false, activePage = '', member = null }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sessionMember, setSessionMember] = useState(getStoredMember)
  const memberMenuRef = useRef(null)
  const currentMember = member ?? sessionMember

  useEffect(() => {
    // 40px 이상 스크롤하면 배경과 글자색이 읽기 쉬운 고정형 헤더 스타일로 전환됩니다.
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isMemberMenuOpen) return undefined

    const closeMemberMenu = event => {
      if (event.key === 'Escape' || (event.type === 'mousedown' && !memberMenuRef.current?.contains(event.target))) {
        setIsMemberMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMemberMenu)
    window.addEventListener('keydown', closeMemberMenu)
    return () => {
      document.removeEventListener('mousedown', closeMemberMenu)
      window.removeEventListener('keydown', closeMemberMenu)
    }
  }, [isMemberMenuOpen])

  useEffect(() => {
    const syncMember = () => setSessionMember(getStoredMember())
    window.addEventListener('storage', syncMember)
    window.addEventListener('waylog-auth-changed', syncMember)
    return () => {
      window.removeEventListener('storage', syncMember)
      window.removeEventListener('waylog-auth-changed', syncMember)
    }
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      // 서버의 refresh token 쿠키를 만료시킵니다.
      await logout()
    } catch (error) {
      // 서버가 일시적으로 응답하지 않아도 브라우저의 인증 정보는 제거해
      // 사용자가 현재 화면에서 로그아웃할 수 있도록 처리합니다.
      console.warn('서버 로그아웃 요청에 실패해 로컬 로그인 정보만 삭제합니다.', error)
    } finally {
      clearAuthSession()
      setSessionMember(null)
      setIsMemberMenuOpen(false)
      setIsLoggingOut(false)

      // 뒤로 가기로 인증 화면 상태가 복원되지 않도록 현재 기록을 교체합니다.
      window.location.replace('/')
    }
  }

  return (
    <header className={`site-header${isScrolled || forceLight ? ' site-header--scrolled' : ''}`}>
      <a className="site-header__logo" href="/" aria-label="WayLog 홈">
        <img src={logo} alt="WayLog" />
      </a>

      <nav className="site-header__nav" aria-label="주요 메뉴">
        {/* 실제 하위 페이지가 구현된 메뉴는 경로로, 미구현 SNS는 임시 앵커로 연결합니다. */}
        <ul className="site-header__nav-list">
          <li>
            <a className={activePage === 'destinations' ? 'is-active' : ''} href="/destinations">여행지</a>
          </li>
          <li>
            <a className={activePage === 'enjoy' ? 'is-active' : ''} href="/enjoy">여행 즐기기</a>
          </li>
          <li>
            <a href="/#feed">여행 피드</a>
          </li>
        </ul>
      </nav>

      <div className="site-header__actions">
        {currentMember ? (
          <div className="site-header__member" ref={memberMenuRef}>
            <button className="site-header__member-button" type="button" aria-haspopup="menu" aria-expanded={isMemberMenuOpen} onClick={() => setIsMemberMenuOpen(isOpen => !isOpen)}>
              <span>{currentMember.nickname || '사용자'}</span>
              <span className={`site-header__member-chevron${isMemberMenuOpen ? ' is-open' : ''}`} aria-hidden="true">∨</span>
            </button>
            {isMemberMenuOpen && (
              <div className="site-header__member-menu" role="menu">
                <a href="/mypage" role="menuitem">마이 페이지</a>
                <a href="/bookmarks" role="menuitem">북마크</a>
                <button type="button" role="menuitem" disabled={isLoggingOut} onClick={handleLogout}>
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <a className="site-header__login" href="/login">로그인</a>
            <a className="site-header__signup" href="/signup">회원가입</a>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
