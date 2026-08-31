import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import TravelSearchModal from '../components/search/TravelSearchModal'
import { fetchTourJson } from '../api/tourApi'
import attractionFallback from '../assets/destinations/type-attraction-v2.png'
import cultureFallback from '../assets/destinations/type-culture.jpg'
import courseFallback from '../assets/destinations/type-course.jpg'
import './DestinationSearchResultsPage.css'

const PAGE_SIZE = 9
const PAGES_PER_GROUP = 5

const typeConfig = {
  12: { label: '관광지', fallbackImage: attractionFallback },
  14: { label: '문화시설', fallbackImage: cultureFallback },
  25: { label: '여행코스', fallbackImage: courseFallback },
}

export default function DestinationSearchResultsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchModalVersion, setSearchModalVersion] = useState(0)
  const [useUrlDefaults, setUseUrlDefaults] = useState(true)
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // 모달에서 검색 결과 URL에 담아 보낸 선택값을 읽습니다.
  const searchConditions = useMemo(() => {
    const query = new URLSearchParams(window.location.search)
    return {
      regionCode: query.get('lDongRegnCd') || '',
      regionName: query.get('regionName') || '',
      districtCode: query.get('lDongSignguCd') || '',
      districtName: query.get('districtName') || '',
      contentTypeId: query.get('contentTypeId') || '12',
      travelType: query.get('type') || '',
      classificationCode1: query.get('lclsSystm1') || '',
      classificationCode2: query.get('lclsSystm2') || '',
      classificationName: query.get('classificationName') || '',
    }
  }, [])

  const config = typeConfig[searchConditions.contentTypeId] ?? typeConfig[12]
  const typeName = searchConditions.travelType || config.label
  const locationName = [searchConditions.regionName, searchConditions.districtName]
    .filter(Boolean)
    .join(' ') || '전체 지역'

  useEffect(() => {
    let isActive = true

    async function loadSearchResults() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        // 값이 있는 조건만 백엔드 검색 API로 전달합니다.
        const params = new URLSearchParams({
          page: String(currentPage),
          size: String(PAGE_SIZE),
          contentTypeId: searchConditions.contentTypeId,
          arrange: 'Q',
        })

        if (searchConditions.regionCode) params.set('lDongRegnCd', searchConditions.regionCode)
        if (searchConditions.districtCode) params.set('lDongSignguCd', searchConditions.districtCode)
        if (searchConditions.classificationCode1) params.set('lclsSystm1', searchConditions.classificationCode1)
        if (searchConditions.classificationCode2) params.set('lclsSystm2', searchConditions.classificationCode2)

        const data = await fetchTourJson(`/api/v1/search?${params.toString()}`)
        if (!isActive) return

        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotalCount(Number(data?.totalCount) || 0)
      } catch (error) {
        if (!isActive) return
        console.error('여행지 검색 결과 조회에 실패했습니다.', error)
        setItems([])
        setTotalCount(0)
        setErrorMessage('검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadSearchResults()
    return () => { isActive = false }
  }, [currentPage, searchConditions])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const groupStart = Math.floor((currentPage - 1) / PAGES_PER_GROUP) * PAGES_PER_GROUP + 1
  const groupEnd = Math.min(groupStart + PAGES_PER_GROUP - 1, totalPages)
  const visiblePages = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, index) => groupStart + index,
  )

  const selectedConditions = [
    `지역 ${locationName}`,
    `유형 ${typeName}`,
    searchConditions.classificationName && `상세 ${searchConditions.classificationName}`,
  ].filter(Boolean)

  function movePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openSearchModal(keepCurrentConditions) {
    // key를 변경해 모달을 새로 생성합니다.
    // 조건 변경은 URL 값을 유지하고, 다시 검색은 모든 값을 비웁니다.
    setUseUrlDefaults(keepCurrentConditions)
    setSearchModalVersion((version) => version + 1)
    setIsSearchOpen(true)
  }

  return (
    <div className="search-results-page">
      <Header forceLight activePage="destinations" />
      <main className="search-results-main">
        <section className="search-results-banner">
          <div className="search-results-banner__summary">
            <strong>선택한 조건으로 여행지를 찾았어요</strong>
            <p>{selectedConditions.map((condition) => <span key={condition}>{condition}</span>)}</p>
          </div>
          <div className="search-results-banner__actions">
            <button type="button" onClick={() => openSearchModal(true)}>조건 변경</button>
            <button type="button" onClick={() => openSearchModal(false)}>다시 검색</button>
          </div>
        </section>

        <h1>{locationName} {typeName} 검색 결과</h1>
        <p>선택한 조건에 맞는 한국관광공사 TourAPI 관광정보입니다.</p>

        {isLoading && <p className="search-results-status">검색 결과를 불러오는 중입니다.</p>}
        {!isLoading && errorMessage && <p className="search-results-status search-results-status--error">{errorMessage}</p>}
        {!isLoading && !errorMessage && <div className="search-results-count">총 <b>{totalCount}</b>건</div>}
        {!isLoading && !errorMessage && items.length === 0 && <p className="search-results-status">선택한 조건에 맞는 여행정보가 없습니다.</p>}

        {!isLoading && !errorMessage && items.length > 0 && (
          <div className="search-results-grid">
            {items.map((item) => {
              const itemTypeId = String(item.contentTypeId || searchConditions.contentTypeId)
              const itemConfig = typeConfig[itemTypeId] ?? config
              const image = item.image || item.thumbnail || itemConfig.fallbackImage

              return (
                <a href={`/destinations/detail/${item.contentId}?contentTypeId=${itemTypeId}`} key={item.contentId}>
                  <img
                    src={image}
                    alt={item.title || '여행지 이미지'}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = itemConfig.fallbackImage
                    }}
                  />
                  <div>
                    {/*
                     * 상세 항목을 선택한 검색이면 카드 배지에 해당 이름을 표시합니다.
                     * 상세 항목이 없는 경우에만 관광지·문화시설·여행코스 유형을 사용합니다.
                     */}
                    <span>{searchConditions.classificationName || itemConfig.label}</span>
                    <h2>{item.title || '여행지 이름 없음'}</h2>
                    <small><PlacePinIcon />{item.address || '주소 정보 없음'}</small>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {!isLoading && !errorMessage && totalPages > 1 && (
          <nav className="catalog-pagination" aria-label="검색 결과 페이지">
            <button type="button" disabled={groupStart === 1} onClick={() => movePage(groupStart - 1)} aria-label="이전 페이지 묶음">‹</button>
            {visiblePages.map((page) => (
              <button type="button" className={currentPage === page ? 'is-active' : ''} onClick={() => movePage(page)} key={page} aria-current={currentPage === page ? 'page' : undefined}>{page}</button>
            ))}
            <button type="button" disabled={groupEnd === totalPages} onClick={() => movePage(groupEnd + 1)} aria-label="다음 페이지 묶음">›</button>
          </nav>
        )}

        <p className="search-results-notice">ⓘ 운영시간, 휴무일 등 일부 정보는 제공되지 않을 수 있습니다.</p>
      </main>
      <Footer />
      <TravelSearchModal
        key={searchModalVersion}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        useUrlDefaults={useUrlDefaults}
      />
    </div>
  )
}
