import { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { fetchTourJson } from '../api/tourApi'

/*
 * TourAPI가 이미지를 제공하지 않을 때 사용할
 * 페이지 유형별 기본 이미지입니다.
 */
import attractionFallback from '../assets/destinations/type-attraction.jpg'
import cultureFallback from '../assets/destinations/type-culture.jpg'
import courseFallback from '../assets/destinations/type-course.jpg'

import './DestinationCatalogPage.css'

/**
 * 여행지 목록 페이지별 설정입니다.
 *
 * kind에 따라 화면 문구와 TourAPI contentTypeId, 기본 이미지(fallbackImage)가 결정됩니다.
 */
const configs = {
  attraction: {
    breadcrumb: '관광지',
    title: '테마별 관광지',
    description: '관심 있는 테마를 선택하고 원하는 관광지를 둘러보세요.',
    contentTypeId: 12, // 관광지 TourAPI contentTypeId
    fallbackImage: attractionFallback,
  },
  culture: {
    breadcrumb: '문화시설',
    title: '문화와 역사를 만나는 곳',
    description: '지역의 역사와 문화를 다양한 공간에서 만나보세요.',
    contentTypeId: 14, // 문화시설 TourAPI contentTypeId
    fallbackImage: cultureFallback,
  },
  course: {
    breadcrumb: '여행코스',
    title: '코스를 따라 떠나는 여행',
    description: '여러 장소를 순서대로 둘러보는 추천 코스를 확인해 보세요.',
    contentTypeId: 25, // 여행코스 TourAPI contentTypeId
    fallbackImage: courseFallback,
  }
}

const destinationCategories = [
  { kind: 'attraction', label: '관광지', href: '/destinations/attractions' },
  { kind: 'culture', label: '문화시설', href: '/destinations/culture' },
  { kind: 'course', label: '여행코스', href: '/destinations/courses' },
]

/**
 * GET /api/v1/regions가 아직 준비되지 않았을 때 사용하는 임시 지역 목록입니다.
 * 백엔드 지역 API가 정상 응답하면 이 목록은 자동으로 서버 데이터로 교체됩니다.
 */
const fallbackRegions = [
  { label: '전체 지역', value: '' },
  { label: '서울', value: '11' },
  { label: '전남·광주', value: '12' },
  { label: '부산', value: '26' },
  { label: '대구', value: '27' },
  { label: '인천', value: '28' },
  { label: '대전', value: '30' },
  { label: '울산', value: '31' },
  { label: '세종', value: '36110' },
  { label: '경기', value: '41' },
  { label: '충북', value: '43' },
  { label: '충남', value: '44' },
  { label: '경북', value: '47' },
  { label: '경남', value: '48' },
  { label: '제주', value: '50' },
  { label: '강원', value: '51' },
  { label: '전북', value: '52' },
]

export default function DestinationCatalogPage({ kind }) {
  
  const pageSize = 9
  const config = configs[kind] ?? configs.attraction
  const gridRef = useRef(null)

   /**
   * TourAPI에서 조회한 현재 페이지의 관광정보 목록
   */
  const [items, setItems] = useState([])

  /**
   * TourAPI 전체 결과 개수입니다.
   */
  const [totalCount, setTotalCount] = useState(0)

  /**
   * API 요청 진행 여부입니다.
   */
  const [isLoading, setIsLoading] = useState(true)

  /**
   * API 요청 실패 시 표시할 메시지입니다.
   */
  const [errorMessage, setErrorMessage] = useState('')

  const [bookmarkedCards, setBookmarkedCards] = useState(() => new Set())

  /** 백엔드에서 받은 최신 TourAPI 법정동 광역지역 목록입니다. */
  const [regions, setRegions] = useState(fallbackRegions)

  /** 선택한 지역의 lDongRegnCd입니다. 빈 문자열이면 전국 조회입니다. */
  const [regionCode, setRegionCode] = useState('')

  /** 선택한 시·도의 시군구 목록과 현재 선택값입니다. */
  const [districts, setDistricts] = useState([])
  const [districtCode, setDistrictCode] = useState('')
  const [isDistrictLoading, setIsDistrictLoading] = useState(false)

  const [sortOrder, setSortOrder] = useState('기본')

  const [currentPage, setCurrentPage] = useState(1)

  /**
    * 화면에서 선택한 정렬 이름을
    * TourAPI의 arrange 코드로 변환합니다.
    */
  const arrangeMap = {
    기본: 'Q',
    이름순: 'A',
    '최근 수정순': 'Q',
  }

  const arrange = arrangeMap[sortOrder] ?? 'Q'

  /**
   * 백엔드가 TourAPI ldongCode2를 가공한 광역지역 목록을 조회합니다.
   * 배열과 { items: [...] } 응답을 모두 지원하며, 호출 실패 시 임시 목록을 유지합니다.
   */
  useEffect(() => {
    const controller = new AbortController()

    async function fetchRegions() {
      try {
        const data = await fetchTourJson('/api/v1/regions')
        const regionItems = Array.isArray(data) ? data : (data.items ?? [])
        const normalizedRegions = regionItems
          .map((region) => ({
            value: String(region.lDongRegnCd ?? region.code ?? ''),
            label: region.name ?? region.regionName ?? region.label ?? '',
          }))
          .filter((region) => region.value && region.label)

        if (normalizedRegions.length > 0) {
          setRegions([
            { label: '전체 지역', value: '' },
            ...normalizedRegions,
          ])
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.info('지역 API가 준비되지 않아 임시 지역 목록을 사용합니다.')
        }
      }
    }

    fetchRegions()
    return () => controller.abort()
  }, [])


  useEffect(() => {
     /*
      * 전체 지역이면 조회할 시군구가 없습니다.
      * 상태 초기화는 지역 select의 onChange에서 처리합니다.
      */
    if (!regionCode) {
      return undefined
    }
    let isActive = true
    async function fetchDistricts() {
      try {
        setIsDistrictLoading(true)
        const params = new URLSearchParams({ lDongRegnCd: regionCode })
        const data = await fetchTourJson(
          `/api/v1/regions/districts?${params.toString()}`,
        )
        if (!isActive) {
          return
        }

        const districtItems = Array.isArray(data) ? data : (data.items ?? [])
        setDistricts(districtItems)
      } catch (error) {
        if (isActive) {
          console.error('시군구 목록 조회 중 오류가 발생했습니다.', error)
          setDistricts([])
        }
      } finally {
        if (isActive) {
          setIsDistrictLoading(false)
        }
      }
    }
    fetchDistricts()
    return () => { isActive = false }
  }, [regionCode])

  /**
    * 페이지 종류, 현재 페이지 또는 정렬 기준이 바뀌면
    * 백엔드 여행지 목록 API를 다시 호출합니다.
    */

  useEffect(() => {
    let isActive = true

    async function fetchTours() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        /*
        * URLSearchParams를 사용하면 쿼리 파라미터를
        * 안전하게 조합할 수 있습니다.
        */
       const params = new URLSearchParams({
        page: String(currentPage),
        size: String(pageSize),
        contentTypeId: String(config.contentTypeId),
        arrange: String(arrange),
       })

       // 전체 지역이 아닐 때만 법정동 광역지역 코드를 TourAPI 요청에 추가합니다.
       if (regionCode) {
         params.set('lDongRegnCd', regionCode)
       }
       if (districtCode) {
         params.set('lDongSignguCd', districtCode)
       }

       const data = await fetchTourJson(
         `/api/v1/search?${params.toString()}`,
       )

      /*
       * 컴포넌트가 화면에서 제거된 경우
       * 상태를 변경하지 않습니다.
       */
      if (!isActive) {
        return
      }
      /*
      * 백엔드 응답 필드가 null이거나 누락되어도
      * 화면이 오류 없이 렌더링되도록 기본값을 설정합니다.
      */
      setItems(data.items ?? [])
      setTotalCount(data.totalCount ?? 0)
    } catch (error) {
      if (!isActive) {
        return
      } 

      console.error('여행지 목록 조회 중 오류가 발생했습니다.', error)
      setItems([])
      setTotalCount(0)
      setErrorMessage('여행지 목록을 불러오지 못했습니다.')
    } finally {
      if (isActive) {
        setIsLoading(false)
      }
    }
  }

  fetchTours()

  return () => {
    isActive = false
  }
}, [
  config.contentTypeId,
  currentPage,
  pageSize,
  arrange,
  regionCode,
  districtCode])


  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    
  /**
 * 페이지네이션에서 한 번에 표시할 페이지 번호 개수입니다.
 *
 * 1~5, 6~10처럼 5개 단위로 페이지 번호를 나눕니다.
 */
  const pagePerGroup = 5

  /**
 * 현재 페이지가 포함된 페이지 그룹 번호입니다.
 *
 * 배열과 동일하게 0부터 시작합니다.
 *
 * 예:
 * 현재 페이지 1  → 0번째 그룹
 * 현재 페이지 5  → 0번째 그룹
 * 현재 페이지 6  → 1번째 그룹
 * 현재 페이지 10 → 1번째 그룹
 */
  const currentPageGroup = Math.floor((currentPage - 1) / pagePerGroup,)

  /**
 * 현재 페이지 그룹의 첫 번째 페이지 번호입니다.
 *
 * 예:
 * 0번째 그룹 → 1
 * 1번째 그룹 → 6
 * 2번째 그룹 → 11
 */
  const startPage = currentPageGroup * pagePerGroup + 1
  /**
 * 현재 페이지 그룹의 마지막 페이지 번호입니다.
 *
 * 마지막 그룹에서는 totalPages를 초과하지 않도록
 * Math.min()으로 제한합니다.
 *
 * 예:
 * 전체 페이지가 13이면 마지막 그룹은 11, 12, 13만 표시됩니다.
 */
  const endPage = Math.min(startPage + pagePerGroup - 1, totalPages)

  /**
 * 현재 화면에 표시할 페이지 번호 배열입니다.
 *
 * 예:
 * startPage=1, endPage=5
 * → [1, 2, 3, 4, 5]
 *
 * startPage=6, endPage=10
 * → [6, 7, 8, 9, 10]
 */


/**
 * 이전 페이지 그룹의 첫 번째 페이지로 이동합니다.
 *
 * 예:
 * 6~10 그룹 → 1페이지
 * 11~15 그룹 → 6페이지
 */
  const goToPreviousGroup = () => {
    goToPage(
      Math.max(
        1,
        startPage - pagePerGroup,
      ),
    )
  }

/**
 * 다음 페이지 그룹의 첫 번째 페이지로 이동합니다.
 *
 * 예:
 * 1~5 그룹 → 6페이지
 * 6~10 그룹 → 11페이지
 */
  const goToNextGroup = () => {
    goToPage(
      Math.min(
        totalPages,
        startPage + pagePerGroup,
      ),
    )
  }

  const visiblePageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)



  const goToPage = page => {
    const nextPage = Math.min(totalPages, Math.max(1, page))
    if (nextPage === currentPage) return
    setCurrentPage(nextPage)
    window.requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, gridRef.current?.offsetTop - 110), behavior: 'smooth' }))
  }

  const toggleBookmark = cardKey => {
    setBookmarkedCards(current => {
      const next = new Set(current)
      next.has(cardKey) ? next.delete(cardKey) : next.add(cardKey)
      return next
    })
  }

  return <div className="catalog-page">
    <Header forceLight activePage="destinations" />
    <main className="catalog-main">
      <p className="catalog-breadcrumb"><a href="/">홈</a><span>›</span><a href="/destinations">여행지</a><span>›</span>{config.breadcrumb}</p>
      <header className="catalog-hero">
        <div><h1>{config.title}</h1><p>{config.description}</p></div>
        <img src={config.fallbackImage} alt="" />
      </header>

      <nav className="catalog-category-tabs" aria-label="여행지 카테고리">
        {destinationCategories.map((category) => (
          <a
            className={category.kind === kind ? 'is-active' : ''}
            href={category.href}
            key={category.kind}
          >
            {category.label}
          </a>
        ))}
      </nav>
      
      <div className="catalog-toolbar">
        <div>
          <label className="catalog-select">
            <span>지역</span>

            <select
              aria-label="지역 선택"
              value={regionCode}
              onChange={(event) => {
                const nextRegionCode = event.target.value
                /*
                 * 시·도가 변경되면 이전 지역에서 선택했던
                 * 시군구 코드와 목록을 즉시 초기화합니다.
                 */
                setRegionCode(nextRegionCode)
                setDistrictCode('')
                setDistricts([])
                setCurrentPage(1)
              }}
            >
              {regions.map((region) => (
                <option value={region.value} key={region.value || 'all'}>
                  {region.label}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-select">
            <span>시·군·구</span>
            <select
              aria-label="시군구 선택"
              value={districtCode}
              disabled={!regionCode || isDistrictLoading}
              onChange={(event) => {
                setDistrictCode(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">
                {!regionCode
                  ? '시·도 먼저 선택'
                  : isDistrictLoading
                    ? '불러오는 중'
                    : '전체 시·군·구'}
              </option>
              {districts.map((district) => (
                <option
                  value={String(district.lDongSignguCd)}
                  key={`${district.lDongRegnCd}-${district.lDongSignguCd}`}
                >
                  {district.name}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-select">
            <span>정렬</span>

            <select
              aria-label="정렬 방식"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value)
                setCurrentPage(1)
              }}
           >
             <option>기본</option>
             <option>이름순</option>
             <option>최근 수정순</option>
           </select>
          </label>
       </div>

        {/*
         * Mock 배열의 길이가 아니라
        * TourAPI가 반환한 전체 결과 개수를 표시합니다.
         */}
        <strong>
         총 <b>{totalCount}</b>건
       </strong>
      </div>

      {/* TourAPI 목록을 조회 중인 경우 */}
      {isLoading && (
       <p className="catalog-status">
          여행지 정보를 불러오는 중입니다.
       </p>
      )}

      {/* 백엔드 또는 외부 TourAPI 요청이 실패한 경우 */}
      {!isLoading && errorMessage && (
       <p className="catalog-status catalog-status--error">
         {errorMessage}
       </p>
      )}

      {/* 요청은 성공했지만 조회 결과가 없는 경우 */}
      {!isLoading &&
       !errorMessage &&
       items.length === 0 && (
          <p className="catalog-status">
           현재 표시할 여행지가 없습니다.
         </p>
       )}


      {!isLoading && !errorMessage && items.length > 0 && (
        <div ref={gridRef} className={`catalog-grid${kind === 'course' ? ' catalog-grid--course' : ''}`}>
        {items.map((item) => {
          /*
         * TourAPI의 contentId는 각 콘텐츠의
         * 고유 식별자이므로 React key로 사용합니다.
         */
          const cardKey = item.contentId
          const isBookmarked = bookmarkedCards.has(cardKey)

          /*
         * 기본 이미지가 없으면 썸네일을 사용하고,
         * 두 이미지가 모두 없으면 페이지 유형별
         * 로컬 기본 이미지를 사용합니다.
         */
          const cardImage = item.image || item.thumbnail || config.fallbackImage
          
          /*
         * 전체 주소의 첫 번째 단어를
         * 카드의 지역 정보로 사용합니다.
         *
         * 예:
         * 서울특별시 종로구 → 서울특별시
         */
        const region = item.address
        ?.trim().split(/\s+/)[0] || '전국'

          return <article className="catalog-card" key={cardKey}>
            <a className="catalog-card__link" href={`/destinations/detail/${item.contentId}` + `?contentTypeId=${item.contentTypeId}`}>
              <img src={cardImage} alt={item.title || '여행지 이미지'} onError={(event) => {
                /*
                   * TourAPI 이미지 URL이 존재하지만
                   * 이미지 로딩에 실패한 경우입니다.
                   */
                  event.currentTarget.onerror = null
                  event.currentTarget.src = config.fallbackImage
              }} />
              <span className="catalog-card__image-tag">{config.breadcrumb}</span>
              <div>
                <div className="catalog-card__heading">
                  <h2 title={item.title || '여행지 이름 없음'}>{item.title || '여행지 이름 없음'}</h2>
                  <small>{region}</small>
                </div>

                {/*
                 * areaBasedList2 목록 응답에는 상세 설명이 없으므로
                 * 현재는 공통 안내 문구를 표시합니다.
                 *
                 * 상세 설명은 detailCommon2를 연결한 후
                 * 실제 overview 값으로 교체합니다.
                 */}
                 
                <p>자세한 관광정보를 확인해 보세요.</p>

                <small className="catalog-address" title={item.address || '주소 정보 없음'}>
                  <PlacePinIcon />
                  <span>{item.address || '주소 정보 없음'}</span>
                </small>
              </div>
            </a>
            {kind !== 'course' && (
              <button className={`catalog-card__bookmark${isBookmarked ? ' is-active' : ''}`} 
              type="button" 
              aria-label={`${item.title} 북마크 ${isBookmarked ? '해제' : '등록'}`} 
              aria-pressed={isBookmarked} onClick={() => toggleBookmark(cardKey)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" /></svg>
            </button>
          )}
          </article>
        })}
        </div>
      )}
      {!isLoading && !errorMessage && totalCount > 0 && (
        <nav className="catalog-pagination" aria-label="페이지 이동">
          <button type="button" aria-label="이전 페이지 그룹" 
          disabled={startPage === 1} 
          onClick={goToPreviousGroup}>
            ‹
          </button>
                  {/*
              * 현재 그룹에 해당하는 페이지 번호만 표시합니다.
              *
              * 예:
              * 1~5페이지 또는 6~10페이지
              */}
              {visiblePageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    currentPage === page
                      ? 'is-active'
                      : ''
                }
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
                <button type="button" aria-label="다음 페이지 그룹" 
                        disabled={endPage === totalPages} 
                        onClick={goToNextGroup}>
                          ›
                </button>
          </nav>
      )}
      
    </main>
    <Footer />
  </div>
}
