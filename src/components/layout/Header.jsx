import { useEffect, useState } from 'react'
import logo from '../../assets/figma/logo.png'
import './Header.css'

/**
 * 모든 일반 콘텐츠 페이지에서 공유하는 상단 헤더입니다.
 * forceLight: Hero 이미지가 없는 페이지에서도 흰 배경 헤더를 강제로 사용합니다.
 * activePage: 현재 메뉴에 활성화 밑줄을 표시하기 위한 페이지 식별자입니다.
 */
function Header({ forceLight = false, activePage = '' }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // 40px 이상 스크롤하면 배경과 글자색이 읽기 쉬운 고정형 헤더 스타일로 전환됩니다.
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        <a className="site-header__login" href="/login">로그인</a>
        <a className="site-header__signup" href="/signup">회원가입</a>
      </div>
    </header>
  )
}

export default Header
