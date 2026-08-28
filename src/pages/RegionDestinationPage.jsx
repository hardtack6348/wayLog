import { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { fetchTourJson } from '../api/tourApi'
import attractionFallback from '../assets/destinations/type-attraction.jpg'
import cultureFallback from '../assets/destinations/type-culture.jpg'
import courseFallback from '../assets/destinations/type-course.jpg'
import './DestinationCatalogPage.css'
import './RegionDestinationPage.css'

/**
 * 지역 페이지에서 선택할 수 있는 TourAPI 콘텐츠 유형입니다.
 */
const contentTypeFilters = [
  { label: '관광지', contentTypeId: 12, fallbackImage: attractionFallback },
  { label: '문화시설', contentTypeId: 14, fallbackImage: cultureFallback },
  { label: '여행코스', contentTypeId: 25, fallbackImage: courseFallback },
]

/**
 * 화면의 정렬 이름을 TourAPI arrange 코드로 변환합니다.
 */
const arrangeMap = {
  기본: 'Q',
  이름순: 'A',
  '최근 수정순': 'C',
}

/**
 * 메인 화면의 권역별 조회 설정입니다.
 *
 * 단일 광역지역은 lDongRegnCd를 바로 전달하고,
 * 여러 광역지역을 묶은 카드는 regionGroup을 전달합니다.
 */
const regionConfigs = {
  seoul: { name: '서울', lDongRegnCd: 11 },
  'gyeonggi-incheon': { name: '경기·인천', regionGroup: 'gyeonggi-incheon' },
  gangwon: { name: '강원', lDongRegnCd: 51 },
  chungcheong: { name: '충청', regionGroup: 'chungcheong' },
  jeolla: { name: '전라도', regionGroup: 'jeolla' },
  gyeongsang: { name: '경상도', regionGroup: 'gyeongsang' },
  busan: { name: '부산', lDongRegnCd: 26 },
  jeju: { name: '제주', lDongRegnCd: 50 },
}

const PAGE_SIZE = 9
const PAGES_PER_GROUP = 5

/**
 * 선택한 지역의 관광지·문화시설·여행코스를 보여주는 페이지입니다.
 */
export default function RegionDestinationPage({ regionKey }) {

  /*
   * 상태의 초깃값을 정하기 전에 현재 지역이 유효한지 먼저 확인.
   */
  
  const regionConfig = regionConfigs[regionKey]
  const isValidRegion = Boolean(regionConfig)
  const regionName = regionConfig?.name ?? '선택 지역'


  const gridRef = useRef(null)
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedContentTypeId, setSelectedContentTypeId] = useState(12)
  const [districts, setDistricts] = useState([])
  const [selectedDistrictValue, setSelectedDistrictValue] = useState('')
  const [isDistrictLoading, setIsDistrictLoading] = useState(false)
  const [sortOrder, setSortOrder] = useState('기본')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(isValidRegion)
  const [errorMessage, setErrorMessage] = useState(isValidRegion? '' : '올바르지 않은 지역 코드입니다.')

  const selectedFilter = contentTypeFilters.find(
    (filter) => filter.contentTypeId === selectedContentTypeId,
  ) ?? contentTypeFilters[0]

  const selectedDistrict = districts.find(
    (district) => district.value === selectedDistrictValue,
  )

  /**
   * 선택한 권역의 시군구 목록을 백엔드에서 조회합니다.
   *
   * 백엔드는 TourAPI ldongCode2 결과를 다음 형태로 반환합니다.
   * [{ lDongRegnCd, lDongSignguCd, name, regionName }]
   */
  useEffect(() => {
    if (!isValidRegion) return undefined

    const controller = new AbortController()

    async function fetchDistricts() {
      try {
        setIsDistrictLoading(true)
        setSelectedDistrictValue('')

        const params = new URLSearchParams()

        if (regionConfig.lDongRegnCd) {
          params.set('lDongRegnCd', String(regionConfig.lDongRegnCd))
        } else {
          params.set('regionGroup', regionConfig.regionGroup)
        }

        const data = await fetchTourJson(
          `/api/v1/regions/districts?${params.toString()}`,
        )
        const districtItems = Array.isArray(data) ? data : (data.items ?? [])

        setDistricts(
          districtItems.map((district) => ({
            ...district,
            value: `${district.lDongRegnCd}:${district.lDongSignguCd}`,
            label: district.lDongRegnNm
            ? `${district.lDongRegnNm} ${district.lDongSignguNm}`
            : district.lDongSignguNm,
          })),
        )
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('시군구 목록 조회 중 오류가 발생했습니다.', error)
        setDistricts([])
      } finally {
        if (!controller.signal.aborted) setIsDistrictLoading(false)
      }
    }

    fetchDistricts()
    return () => controller.abort()
  }, [isValidRegion, regionConfig])

  /**
   * 지역, 유형, 정렬 또는 페이지가 바뀔 때 목록을 다시 조회합니다.
   */
  useEffect(() => {
    /*
     * 잘못된 지역의 화면 상태는 useState 초깃값에서
     * 이미 설정했으므로 여기서는 요청만 중단한다.
     */
    if (!isValidRegion) {
      return undefined
    }

    const controller = new AbortController()

    async function fetchRegionTours() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const params = new URLSearchParams({
          page: String(currentPage),
          size: String(PAGE_SIZE),
          contentTypeId: String(selectedContentTypeId),
          arrange: arrangeMap[sortOrder] ?? 'Q',
        })

        /*
         * 단일 지역은 기존 lDongRegnCd를 사용합니다.
         * 묶음 권역은 백엔드가 실제 코드 목록으로 변환할
         * regionGroup 값을 사용합니다.
         */
        if (selectedDistrict) {
          /*
           * 마포구·광진구처럼 특정 시군구가 선택되면
           * 해당 항목의 광역 코드와 시군구 코드를 함께 전달합니다.
           */
          params.set('lDongRegnCd', String(selectedDistrict.lDongRegnCd))
          params.set('lDongSignguCd', String(selectedDistrict.lDongSignguCd))
        } else if (regionConfig.lDongRegnCd) {
          params.set('lDongRegnCd', String(regionConfig.lDongRegnCd))
        } else {
          params.set('regionGroup', regionConfig.regionGroup)
        }

        const data = await fetchTourJson(
          `/api/v1/search?${params.toString()}`,
        )
        setItems(data.items ?? [])
        setTotalCount(data.totalCount ?? 0)
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('지역별 여행지 조회 중 오류가 발생했습니다.', error)
        setItems([])
        setTotalCount(0)
        setErrorMessage('지역별 여행지를 불러오지 못했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchRegionTours()
    return () => controller.abort()
  }, [
    currentPage,
    isValidRegion,
    regionConfig,
    selectedContentTypeId,
    selectedDistrict,
    sortOrder,
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPageGroup = Math.floor((currentPage - 1) / PAGES_PER_GROUP)
  const startPage = currentPageGroup * PAGES_PER_GROUP + 1
  const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages)
  const visiblePageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  )

  /**
   * 페이지 번호를 안전한 범위로 보정하고 카드 위치로 이동합니다.
   */
  const goToPage = (page) => {
    const nextPage = Math.min(totalPages, Math.max(1, page))
    if (nextPage === currentPage) return

    setCurrentPage(nextPage)
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(0, (gridRef.current?.offsetTop ?? 0) - 110),
        behavior: 'smooth',
      })
    })
  }

  return (
    <div className="catalog-page region-destination-page">
      <Header forceLight activePage="destinations" />

      <main className="catalog-main">
        <p className="catalog-breadcrumb">
          <a href="/">홈</a><span>›</span>
          <a href="/destinations">여행지</a><span>›</span>
          {regionName}
        </p>

        <div className="catalog-title">
          <div>
            <h1>{regionName} 여행지</h1>
            <p>{regionName}의 관광지, 문화시설과 여행코스를 둘러보세요.</p>
          </div>
        </div>

        <div
          className="region-content-filters"
          role="group"
          aria-label="여행지 유형 필터"
        >
          {contentTypeFilters.map((filter) => (
            <button
              type="button"
              className={
                selectedContentTypeId === filter.contentTypeId ? 'is-active' : ''
              }
              aria-pressed={selectedContentTypeId === filter.contentTypeId}
              onClick={() => {
                setSelectedContentTypeId(filter.contentTypeId)
                setCurrentPage(1)
              }}
              key={filter.contentTypeId}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="catalog-toolbar">
          <div>
            <label className="catalog-select">
              <span>상세 지역</span>
              <select
                aria-label="시군구 선택"
                value={selectedDistrictValue}
                disabled={isDistrictLoading}
                onChange={(event) => {
                  setSelectedDistrictValue(event.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">
                  {isDistrictLoading ? '지역 불러오는 중' : `${regionName} 전체`}
                </option>

                {districts.map((district) => (
                  <option value={district.value} key={district.value}>
                    {district.label}
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

          <strong>총 <b>{totalCount}</b>건</strong>
        </div>

        {isLoading && (
          <p className="region-catalog-status">여행지 정보를 불러오는 중입니다.</p>
        )}

        {!isLoading && errorMessage && (
          <p className="region-catalog-status region-catalog-status--error">
            {errorMessage}
          </p>
        )}

        {!isLoading && !errorMessage && items.length === 0 && (
          <p className="region-catalog-status">현재 표시할 여행지가 없습니다.</p>
        )}

        {!isLoading && !errorMessage && items.length > 0 && (
          <div ref={gridRef} className="catalog-grid">
            {items.map((item) => {
              const cardImage =
                item.image || item.thumbnail || selectedFilter.fallbackImage
              const itemRegion = item.address?.trim().split(/\s+/)[0] || regionName

              return (
                <article className="catalog-card" key={item.contentId}>
                  <a
                    className="catalog-card__link"
                    href={
                      `/destinations/detail/${item.contentId}` +
                      `?contentTypeId=${item.contentTypeId}`
                    }
                  >
                    <img
                      src={cardImage}
                      alt={item.title || `${selectedFilter.label} 이미지`}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = selectedFilter.fallbackImage
                      }}
                    />

                    <span className="catalog-card__image-tag">
                      {selectedFilter.label}
                    </span>

                    <div>
                      <div className="catalog-card__heading">
                        <h2 title={item.title || '여행지 이름 없음'}>
                          {item.title || '여행지 이름 없음'}
                        </h2>
                        <small>{itemRegion}</small>
                      </div>

                      <p>{regionName}의 주요 관광정보를 확인해 보세요.</p>

                      <small
                        className="catalog-address"
                        title={item.address || '주소 정보 없음'}
                      >
                        <PlacePinIcon />
                        <span>{item.address || '주소 정보 없음'}</span>
                      </small>
                    </div>
                  </a>
                </article>
              )
            })}
          </div>
        )}

        {!isLoading && !errorMessage && totalCount > 0 && (
          <nav className="catalog-pagination" aria-label="페이지 이동">
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              ‹
            </button>

            {visiblePageNumbers.map((page) => (
              <button
                type="button"
                className={currentPage === page ? 'is-active' : ''}
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => goToPage(page)}
                key={page}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              aria-label="다음 페이지"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              ›
            </button>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  )
}
