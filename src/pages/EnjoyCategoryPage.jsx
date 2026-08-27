import { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { enjoyCategories, enjoyConfigs } from '../data/enjoyMocks'
import { fetchTourJson } from '../api/tourApi'
import './EnjoyCategoryPage.css'
import './EnjoyCategoryPageOverrides.css'

/** 화면 카테고리와 TourAPI 콘텐츠 유형을 연결합니다. */
const contentTypeByCategory = {
  festivals: 15,
  leports: 28,
  food: 39,
  shopping: 38,
  stay: 32,
}

/** 화면의 정렬 옵션을 TourAPI arrange 값으로 변환합니다. */
const arrangeBySort = {
  기본: 'Q',
  이름순: 'A',
  '최근 수정순': 'C',
}

/** 축제 전용 API가 사용하는 행사 기간 필터입니다. */
const festivalFilters = [
  { label: '전체', value: 'ALL' },
  { label: '진행중', value: 'ONGOING' },
  { label: '이번 주 시작', value: 'STARTS_THIS_WEEK' },
  { label: '곧 시작', value: 'UPCOMING' },
]

/**
 * 지역 API가 아직 구현되지 않았거나 일시적으로 실패했을 때만 사용하는 목록입니다.
 * 정상 상황에서는 GET /api/v1/regions의 TourAPI 법정동 코드가 우선 적용됩니다.
 */
const fallbackRegions = [
  { label: '전체 지역', value: '' },
  { label: '서울', value: '11' },
  { label: '부산', value: '26' },
  { label: '대구', value: '27' },
  { label: '인천', value: '28' },
  { label: '전남·광주', value: '12' },
  { label: '대전', value: '30' },
  { label: '울산', value: '31' },
  { label: '세종', value: '36110' },
  { label: '경기', value: '41' },
  { label: '충북', value: '43' },
  { label: '충남', value: '44' },
  { label: '전북', value: '52' },
  { label: '경북', value: '47' },
  { label: '경남', value: '48' },
  { label: '제주', value: '50' },
  { label: '강원', value: '51' },
]

const PAGE_SIZE = 9
const PAGES_PER_GROUP = 5

export default function EnjoyCategoryPage({ category }) {
  const gridRef = useRef(null)
  const config = enjoyConfigs[category] || enjoyConfigs.festivals
  const contentTypeId = contentTypeByCategory[category] ?? 15

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [regions, setRegions] = useState(fallbackRegions)
  const [regionCode, setRegionCode] = useState('')
  const [sort, setSort] = useState('기본')
  const [festivalStatus, setFestivalStatus] = useState('ALL')
  const [saved, setSaved] = useState(() => new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * 백엔드가 TourAPI ldongCode2를 가공해 제공하는 광역지역 목록을 조회합니다.
   * 응답은 배열 또는 { items: [...] } 형태를 모두 허용합니다.
   *
   * 예상 항목 형식:
   * { lDongRegnCd: "11", name: "서울" }
   *
   * 백엔드가 아직 미구현(404)이거나 통신에 실패하면 fallbackRegions를 유지합니다.
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
          console.info(
            '지역 API가 준비되지 않아 임시 지역 목록을 사용합니다.',
          )
        }
      }
    }

    fetchRegions()
    return () => controller.abort()
  }, [])

  /**
   * 카테고리·지역·정렬·페이지가 바뀔 때 서버에서 목록을 다시 조회합니다.
   * 목업 데이터를 복제하지 않으므로 items와 totalCount 모두 실제 API 값입니다.
   */
  useEffect(() => {
    const controller = new AbortController()

    async function fetchEnjoyItems() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const params = new URLSearchParams({
          page: String(currentPage),
          size: String(PAGE_SIZE),
          contentTypeId: String(contentTypeId),
          arrange: arrangeBySort[sort] ?? 'Q',
        })

        if (regionCode) params.set('lDongRegnCd', regionCode)

        /*
         * 축제의 기간 필터가 선택되면 시작일·종료일을 판별하는
         * 축제 전용 API를 사용합니다. 전체는 현재 구현된 공용 목록 API를
         * 사용하므로 백엔드 전용 API 구현 전에도 목록을 볼 수 있습니다.
         */
        const requestUrl =
          category === 'festivals' && festivalStatus !== 'ALL'
            ? `/api/v1/festivals?${new URLSearchParams({
                page: String(currentPage),
                size: String(PAGE_SIZE),
                status: festivalStatus,
                ...(regionCode ? { lDongRegnCd: regionCode } : {}),
                arrange: arrangeBySort[sort] ?? 'Q',
              }).toString()}`
            : `/api/v1/search?${params.toString()}`

        const data = await fetchTourJson(requestUrl)
        setItems(Array.isArray(data.items) ? data.items : [])
        setTotalCount(Number(data.totalCount) || 0)
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error(`${config.title} 목록 조회 중 오류가 발생했습니다.`, error)
        setItems([])
        setTotalCount(0)
        setErrorMessage(`${config.title} 정보를 불러오지 못했습니다.`)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchEnjoyItems()
    return () => controller.abort()
  }, [category, config.title, contentTypeId, currentPage, festivalStatus, regionCode, sort])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGES_PER_GROUP) * PAGES_PER_GROUP + 1
  const visiblePages = Array.from(
    { length: Math.min(PAGES_PER_GROUP, totalPages - pageGroupStart + 1) },
    (_, index) => pageGroupStart + index,
  )

  function movePage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="enjoy-catalog-page">
      <Header forceLight activePage="enjoy" />
      <main className="enjoy-catalog-main">
        <nav className="enjoy-catalog-crumb">
          <a href="/">홈</a><i>›</i>
          <a href="/enjoy">여행 즐기기</a><i>›</i>
          <strong>{config.title}</strong>
        </nav>

        <header className="enjoy-catalog-hero">
          <div><h1>{config.title}</h1><p>{config.description}</p></div>
          <img src={config.cover} alt="" />
        </header>

        <nav className="enjoy-catalog-tabs" aria-label="여행 즐기기 카테고리">
          {enjoyCategories.map((entry) => (
            <a className={entry.slug === category ? 'active' : ''} href={`/enjoy/${entry.slug}`} key={entry.slug}>
              {entry.title}
            </a>
          ))}
        </nav>

        <div className="enjoy-catalog-toolbar">
          <div>
            <label>
              <span>지역</span>
              <select value={regionCode} onChange={(event) => { setRegionCode(event.target.value); setCurrentPage(1) }}>
                {regions.map((region) => (
                  <option value={region.value} key={region.value || 'all'}>{region.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>정렬</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1) }}>
                <option>기본</option>
                <option>이름순</option>
                <option>최근 수정순</option>
              </select>
            </label>

            {category === 'festivals' && (
              <label>
                <span>기간</span>
                <select
                  aria-label="축제 기간 필터"
                  value={festivalStatus}
                  onChange={(event) => {
                    setFestivalStatus(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {festivalFilters.map((filter) => (
                    <option value={filter.value} key={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <strong>총 <b>{totalCount.toLocaleString()}</b>건</strong>
        </div>

        <div ref={gridRef} className="enjoy-catalog-result">
          {isLoading && <p className="enjoy-catalog-status">정보를 불러오는 중입니다.</p>}
          {!isLoading && errorMessage && <p className="enjoy-catalog-status enjoy-catalog-status--error">{errorMessage}</p>}
          {!isLoading && !errorMessage && items.length === 0 && <p className="enjoy-catalog-status">조건에 맞는 정보가 없습니다.</p>}

          {!isLoading && !errorMessage && items.length > 0 && (
            <section className="enjoy-catalog-grid">
              {items.map((item) => {
                const itemKey = String(item.contentId)
                const active = saved.has(itemKey)
                const cardImage = item.image || item.thumbnail || config.cover

                return (
                  <article key={itemKey}>
                    <a href={`/destinations/detail/${item.contentId}?contentTypeId=${contentTypeId}`}>
                      <img
                        src={cardImage}
                        alt={item.title || `${config.title} 이미지`}
                        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = config.cover }}
                      />
                      <span className="enjoy-catalog-badge">{config.title}</span>
                      <div>
                        <small>TourAPI</small>
                        <h2>{item.title || '이름 정보 없음'}</h2>
                        <p>{config.description}</p>
                        <address title={item.address || '주소 정보 없음'}>
                          <PlacePinIcon />
                          <span>{item.address || '주소 정보 없음'}</span>
                        </address>
                      </div>
                    </a>
                    <button
                      className={active ? 'active' : ''}
                      aria-label={`${item.title || config.title} 북마크`}
                      aria-pressed={active}
                      onClick={() => setSaved((current) => {
                        const next = new Set(current)
                        next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey)
                        return next
                      })}
                    >
                      <svg viewBox="0 0 24 24"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" /></svg>
                    </button>
                  </article>
                )
              })}
            </section>
          )}
        </div>

        {!isLoading && !errorMessage && totalPages > 1 && (
          <nav className="enjoy-catalog-pagination" aria-label="페이지 이동">
            <button disabled={pageGroupStart === 1} onClick={() => movePage(pageGroupStart - 1)} aria-label="이전 페이지 그룹">‹</button>
            {visiblePages.map((page) => (
              <button className={page === currentPage ? 'active' : ''} aria-current={page === currentPage ? 'page' : undefined} onClick={() => movePage(page)} key={page}>{page}</button>
            ))}
            <button disabled={pageGroupStart + PAGES_PER_GROUP > totalPages} onClick={() => movePage(pageGroupStart + PAGES_PER_GROUP)} aria-label="다음 페이지 그룹">›</button>
          </nav>
        )}
      </main>
      <Footer />
    </div>
  )
}
