import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import HeroSection from './components/home/HeroSection'
import RecommendedDestinationSection from './components/home/RecommendedDestinationSection'
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
import DestinationCatalogPage from './pages/DestinationCatalogPage'
import RegionDestinationPage from './pages/RegionDestinationPage'
import DestinationSearchResultsPage from './pages/DestinationSearchResultsPage'
import TravelDetailPage from './pages/TravelDetailPage'
import EnjoyCategoryPage from './pages/EnjoyCategoryPage'
import EnjoyDetailPage from './pages/EnjoyDetailPage'
import EnjoySearchResultsPage from './pages/EnjoySearchResultsPage'
import TravelFeedPage from './pages/TravelFeedPage'
import FeedProfilePage from './pages/FeedProfilePage'
import BookmarkPage from './pages/BookmarkPage'
import NoticeListPage from './pages/NoticeListPage'
import NoticeDetailPage from './pages/NoticeDetailPage'
import NoticeWritePage from './pages/NoticeWritePage'
import FeedPostDetailPage from './pages/FeedPostDetailPage'
import { getAccessToken } from './api/authSession'

/**
 * 홈 API 요청 Promise를 저장합니다.
 *
 * 개발 환경에서 React StrictMode가 useEffect를 두 번 검사하더라도
 * 동일한 /api/home 요청을 재사용해 중복 호출을 방지합니다.
 */
let homeDataPromise = null;

/** 개발 보류 중인 여행코스 URL로 직접 접근하면 여행지 메인으로 이동합니다. */
function CoursePageRedirect() {
  useEffect(() => {
    window.location.replace('/destinations')
  }, [])
  return null
}

/**
 * 피드는 로그인한 회원만 이용할 수 있는 영역입니다.
 * 렌더링 중에 바로 이동시키지 않고 effect에서 처리해 안내 문구가 중복되지 않게 합니다.
 */
function FeedLoginRequired() {
  useEffect(() => {
    window.alert('여행 피드는 로그인 후 이용할 수 있습니다.')
    window.location.replace('/login')
  }, [])

  return null
}

/**
 * 백엔드의 메인 화면 데이터를 한 번만 조회합니다.
 *
 * 요청이 이미 진행 중이거나 완료됐다면 기존 Promise를 반환합니다.
 */
function fetchHomeDataOnce() {
  if (!homeDataPromise) {
    homeDataPromise = fetch('/api/v1/home')
    .then((response) => {
      /*
       * fetch는 HTTP 400 또는 500 응답을 자동으로
       * 예외 처리하지 않으므로 직접 확인합니다.
      */
     if (!response.ok) {
      throw new Error(`메인 데이터 조회 실패: HTTP ${response.status}`)
     }

     return response.json()
    })
    .catch((error) => {
      /*
         * 요청이 실패했다면 Promise 캐시를 초기화합니다.
         *
         * 이렇게 해야 다음 화면 진입이나 재시도 시
         * API를 다시 호출할 수 있습니다.
      */
      homeDataPromise = null
      throw error
    })
  }
  return homeDataPromise
}

/**
 * WayLog 메인 페이지입니다.
 *
 * /api/home을 한 번 호출한 뒤 응답 데이터를
 * 각 홈 화면 섹션에 props로 전달합니다.
 */

function HomePage({ mainRef }) {
  /**
   * 백엔드가 반환한 메인 화면 전체 데이터입니다.
   *
   * 초기값에서도 모든 필드를 빈 배열로 지정해
   * 하위 컴포넌트가 안전하게 렌더링되도록 합니다.
   */

  const [homeData, setHomeData] = useState({
    recommendedDestinations: [],
    enjoyItems: [],
    festivals: [],
  })

  /**
   * 홈 API 요청 진행 상태입니다.
   */
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 홈 API 요청 실패 시 하위 컴포넌트에 전달할 메시지입니다.
   */
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    /*
     * 컴포넌트가 이미 제거된 후 비동기 요청이 완료될 수 있으므로
     * 상태 변경 가능 여부를 표시합니다.
     */

    let isActive = true

    async function loadHomeData() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        /*
         * 중복 호출 방지 함수로 홈 데이터를 조회합니다.
         */

        const data = await fetchHomeDataOnce()

        if (!isActive) {
          return 
        }

        /*
         * 백엔드 필드가 누락되더라도 각 목록에 빈 배열을 적용합니다.
         */
        setHomeData({
          recommendedDestinations:
          data.recommendedDestinations ?? [],
          enjoyItems: data.enjoyItems ?? [],
          festivals: data.festivals ?? [],
        })
      } catch (error) {
        /*
         * 컴포넌트가 이미 제거된 경우에만
         * 이후 상태 변경을 중단합니다.
         */
        if (!isActive) {
          return
        }

        console.error('메인 화면 데이터 조회 중 오류가 발생했습니다.', error)
        setErrorMessage('메인 화면 데이터를 불러오지 못했습니다.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadHomeData()

     /*
     * 컴포넌트가 화면에서 제거되면 이후 상태 변경을 막습니다.
     */

    return () => {
      isActive = false
    }
  }, [])

  return (
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
         * 추천 여행지는 homeData의 recommendedDestinations를
         * 전달받아 렌더링합니다.
         */}

          <RecommendedDestinationSection destinations={
            homeData.recommendedDestinations
          } 
          isLoading={isLoading}
          errorMessage={errorMessage}
          />

          {/*
         * 여행을 더 즐겁게 영역은 enjoyItems를 전달받습니다.
         */}

          <ThemeDestinationSection 
            enjoyItems={homeData.enjoyItems}
            isLoading={isLoading}
            errorMessage={errorMessage}
          /> 

          <TravelRecordBanner /> {/* 새로운 여행 기록 작성을 유도하는 CTA 배너 */}
          
          <WeeklyNewsSection 
          festivals={homeData.festivals}
          isLoading={isLoading}
          errorMessage={errorMessage}
          /> {/* 지역 축제와 여행 팁 등의 최신 여행 소식 */}

          <NoticeSection /> {/* 서비스 점검, 운영 안내, 정책 변경 등의 공지사항 */}
        </main>

        <Footer /> {/* 회사 정보와 서비스 메뉴가 표시되는 페이지 하단 영역 */}
      </div>
  )
}

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

  if (window.location.pathname === '/notices') {
    return <NoticeListPage />
  }

  if (window.location.pathname === '/admin/notices/new') {
    return <NoticeWritePage />
  }

  if (window.location.pathname.startsWith('/notices/')) {
    return <NoticeDetailPage />
  }

  if (window.location.pathname === '/feed/profile') {
    return <FeedProfilePage />
  }

  if (window.location.pathname.startsWith('/feed/posts/')) {
    return <FeedPostDetailPage />
  }

  if (window.location.pathname === '/feed') {
    return getAccessToken() ? <TravelFeedPage /> : <FeedLoginRequired />
  }

  if (window.location.pathname === '/bookmarks') {
    return <BookmarkPage />
  }

  if (window.location.pathname === '/enjoy') {
    return <TravelEnjoyPage />
  }

  if (window.location.pathname === '/enjoy/search') {
    return <EnjoySearchResultsPage />
  }

  if (window.location.pathname.startsWith('/enjoy/')) {
    const [, , category, id] = window.location.pathname.split('/')
    // 여행 즐기기 상세도 관광지와 동일한 TourAPI 통합 상세 화면을 사용합니다.
    return id ? <TravelDetailPage /> : <EnjoyCategoryPage category={category} />
  }

  if (window.location.pathname === '/destinations/search') {
    if (new URLSearchParams(window.location.search).get('contentTypeId') === '25') {
      return <CoursePageRedirect />
    }
    return <DestinationSearchResultsPage />
  }

  if (window.location.pathname.startsWith('/destinations/detail/')) {
    if (new URLSearchParams(window.location.search).get('contentTypeId') === '25') {
      return <CoursePageRedirect />
    }
    return <TravelDetailPage />
  }

  /*
   * 지역별 여행지 페이지입니다.
   * URL의 마지막 권역 키를 지역 페이지로 전달합니다.
   */
  if (window.location.pathname.startsWith('/destinations/regions/')) {
    const regionKey = window.location.pathname.split('/').filter(Boolean).at(-1)
    return <RegionDestinationPage regionKey={regionKey} />
  }

  if (window.location.pathname === '/destinations/attractions') {
    return <DestinationCatalogPage kind="attraction" />
  }

  if (window.location.pathname === '/destinations/culture') {
    return <DestinationCatalogPage kind="culture" />
  }

  if (window.location.pathname === '/destinations/courses') {
    return <CoursePageRedirect />
  }

  if (window.location.pathname === '/destinations') {
    return <DestinationsPage />
  }

  return <HomePage mainRef={mainRef} />
}

export default App
