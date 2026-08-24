import { useLayoutEffect, useRef } from 'react'
import './App.css'
import HeroSection from './components/home/HeroSection'
import RecommendedDestinationSection from './components/home/RecommendedDestinationSection'
import RecommendedCourseSection from './components/home/RecommendedCourseSection'
import ThemeDestinationSection from './components/home/ThemeDestinationSection'
import TravelRecordBanner from './components/home/TravelRecordBanner'
import WeeklyNewsSection from './components/home/WeeklyNewsSection'
import NoticeSection from './components/home/NoticeSection'
import Footer from './components/layout/Footer'
import TravelEnjoyPage from './pages/TravelEnjoyPage'
import DestinationsPage from './pages/DestinationsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

function App() {
  // 메인 콘텐츠가 Hero 위로 올라오는 스크롤 효과를 직접 제어하기 위한 DOM 참조입니다.
  const mainRef = useRef(null)

  useLayoutEffect(() => {
    let animationFrameId = 0

    const updateMainPosition = () => {
      cancelAnimationFrame(animationFrameId)

      animationFrameId = requestAnimationFrame(() => {
        const mainElement = mainRef.current

        if (!mainElement) return

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const scrollingElement = document.scrollingElement ?? document.documentElement
        const scrollTop = scrollingElement.scrollTop

        /*
         * 마우스 휠을 약 두 번 내린 시점부터 main의 상단 곡선이
         * 화면 아래에 보이기 시작하도록 등장 기준을 앞당깁니다.
         * 이후 180px의 짧은 스크롤 구간 동안 원래 위치까지 올라옵니다.
         */
        const mainDocumentTop = mainElement.offsetTop
        const revealStart = Math.max(0, mainDocumentTop - window.innerHeight - 120)
        const revealDistance = 180
        const scrollProgress = Math.min(Math.max((scrollTop - revealStart) / revealDistance, 0), 1)
        const offset = prefersReducedMotion ? 0 : 180 * (1 - scrollProgress)

        mainElement.style.setProperty('--main-scroll-offset', `${offset}px`)
      })
    }

    updateMainPosition()
    window.addEventListener('scroll', updateMainPosition, { passive: true })
    window.addEventListener('resize', updateMainPosition, { passive: true })
    document.addEventListener('scroll', updateMainPosition, { passive: true, capture: true })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', updateMainPosition)
      window.removeEventListener('resize', updateMainPosition)
      document.removeEventListener('scroll', updateMainPosition, true)
    }
  }, [])

  /*
   * 현재 프로젝트는 React Router 도입 전이므로 pathname으로 페이지를 분기합니다.
   * 페이지 수가 늘어나면 react-router-dom의 Routes/Route 구조로 교체하는 것을 권장합니다.
   */
  if (window.location.pathname === '/login') {
    return <LoginPage />
  }

  if (window.location.pathname === '/signup') {
    return <SignupPage />
  }

  if (window.location.pathname === '/forgot-password') {
    return <ForgotPasswordPage />
  }

  if (window.location.pathname === '/enjoy') {
    return <TravelEnjoyPage />
  }

  if (window.location.pathname === '/destinations') {
    return <DestinationsPage />
  }

  return (
    <>
      <div className="App">
        <HeroSection />
        {/*
          메인 비주얼 영역

          HeroSection 내부에는 다음 요소가 들어갑니다.
          - 로고와 내비게이션
          - 로그인 및 회원가입 버튼
          - 메인 소개 문구
          - 여행지와 날짜 검색창 (클릭 시 여행검색 모달 창이 뜸)
          - 빠른 검색 필터
          - 여행 기록하기 버튼
        */}

        <main className="main-content" ref={mainRef}>
          {/*
            페이지의 주요 콘텐츠 영역
          */}

          <RecommendedDestinationSection /> {/* 국내 관광지와 문화 시설 추천 */}

          <RecommendedCourseSection /> {/* 사용자에게 추천하는 국내 여행 코스 */}

          <ThemeDestinationSection /> {/* 힐링, 바다, 감성 숙소 등 테마별 여행지 */}

          <TravelRecordBanner /> {/* 새로운 여행 기록 작성을 유도하는 CTA 배너 */}
          
          <WeeklyNewsSection /> {/* 지역 축제와 여행 팁 등의 최신 여행 소식 */}

          <NoticeSection /> {/* 서비스 점검, 운영 안내, 정책 변경 등의 공지사항 */}
        </main>

        <Footer /> {/* 회사 정보와 서비스 메뉴가 표시되는 페이지 하단 영역 */}
      </div>
    </>
  )
}

export default App
