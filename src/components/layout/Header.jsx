import { useEffect, useRef, useState } from 'react'
import logo from '../../assets/figma/logo.png'
import './Header.css'

/**
 * 모든 일반 콘텐츠 페이지에서 공유하는 상단 헤더입니다.
 * forceLight: Hero 이미지가 없는 페이지에서도 흰 배경 헤더를 강제로 사용합니다.
 * activePage: 현재 메뉴에 활성화 밑줄을 표시하기 위한 페이지 식별자입니다.
 */
function Header({ forceLight = false, activePage = '', member = null }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false)
  const [sessionMember, setSessionMember] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem('waylogMember'))
    } catch {
      return null
    }
  })
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

  const handleLogout = () => {
    // 백엔드 연결 시 로그아웃 API 호출 후 동일하게 회원 상태를 비웁니다.
    window.sessionStorage.removeItem('waylogMember')
    setSessionMember(null)
    setIsMemberMenuOpen(false)
    window.location.href = '/'
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
                <a href="/bookmarks" role="menuitem">북마크</a>
                <a href="/mypage" role="menuitem">마이 페이지</a>
                <button type="button" role="menuitem" onClick={handleLogout}>로그아웃</button>
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
