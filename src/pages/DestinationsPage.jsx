import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import TravelSearchModal from '../components/search/TravelSearchModal'
import { travelTypes } from '../data/travelTypes'
import { fetchTourJson } from '../api/tourApi'
import hero from '../assets/destinations/hero-illustration.png'
import seoul from '../assets/destinations/region-seoul.png'
import gyeonggi from '../assets/destinations/region-gyeonggi.png'
import gangwon from '../assets/destinations/region-gangwon.png'
import chungcheong from '../assets/destinations/region-chungcheong.png'
import jeolla from '../assets/destinations/region-jeolla.png'
import gyeongsang from '../assets/destinations/region-gyeongsang.png'
import busan from '../assets/destinations/region-busan.png'
import jeju from '../assets/destinations/region-jeju.png'
import attraction from '../assets/destinations/type-attraction-v2.png'
import cultureType from '../assets/destinations/type-culture.jpg'
import courseType from '../assets/destinations/type-course.jpg'
import nature from '../assets/destinations/theme-nature.jpg'
import history from '../assets/destinations/theme-history.jpg'
import experience from '../assets/destinations/theme-experience.jpg'
import healing from '../assets/destinations/theme-healing.jpg'
import museum from '../assets/destinations/culture-museum.jpg'
import art from '../assets/destinations/culture-art.jpg'
import exhibition from '../assets/destinations/culture-exhibition.jpg'
import './DestinationsPage.css'

// 공통 여행 유형에 이 페이지에서만 사용하는 대표 이미지를 연결합니다.
const travelTypeImages = { attraction, culture: cultureType, course: courseType }
const travelTypeLinks = { attraction: '/destinations/attractions', culture: '/destinations/culture', course: '/destinations/courses' }

// 권역 키는 지역별 목록 페이지와 백엔드의 regionGroup 조건에 사용합니다.
const regions = [
  { image: seoul, title: '서울', regionKey: 'seoul' },
  { image: gyeonggi, title: '경기·인천', regionKey: 'gyeonggi-incheon' },
  { image: gangwon, title: '강원', regionKey: 'gangwon' },
  { image: chungcheong, title: '충청', regionKey: 'chungcheong' },
  { image: jeolla, title: '전라도', regionKey: 'jeolla' },
  { image: gyeongsang, title: '경상도', regionKey: 'gyeongsang' },
  { image: busan, title: '부산', regionKey: 'busan' },
  { image: jeju, title: '제주', regionKey: 'jeju' },
]

/**
 * TourAPI가 대표 이미지를 제공하지 않을 때 사용할 이미지입니다.
 * API 결과의 순서에 맞춰 순환해서 사용합니다.
 */
const themeFallbackImages = [nature, history, experience, healing]

/**
 * TourAPI 문화시설에 대표 이미지가 없을 때 사용할 이미지입니다.
 */
const cultureFallbackImages = [museum, art, exhibition]

/**
 * TourAPI contentTypeId를 화면에 표시할 이름으로 변환합니다.
 */
const contentTypeLabels = {
  12: '관광지',
  14: '문화시설',
  15: '축제·행사',
  25: '여행코스',
  28: '레포츠',
  32: '숙박',
  38: '쇼핑',
  39: '음식점',
}

function SectionHeading({ title, description, link }) {
  // link 값이 있는 섹션에만 실제 목록 페이지로 이동하는 링크를 노출합니다.
  return <div className="destination-heading"><div><h2>{title}</h2><p>{description}</p></div>{link && <a href={link}>더보기 <span>→</span></a>}</div>
}

export default function DestinationsPage() {
  // Hero의 검색 버튼으로 공용 여행 검색 모달을 열고 닫습니다.
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  /**
   * 주제별로 둘러보기 영역에 표시할 TourAPI 관광지 목록입니다.
   */
  const [themeItems, setThemeItems] = useState([])
  const [isThemeLoading, setIsThemeLoading] = useState(true)
  const [themeErrorMessage, setThemeErrorMessage] = useState('')

  /**
   * 문화와 역사를 만나는 곳에 표시할 TourAPI 문화시설 목록입니다.
   */
  const [cultureItems, setCultureItems] = useState([])
  const [isCultureLoading, setIsCultureLoading] = useState(true)
  const [cultureErrorMessage, setCultureErrorMessage] = useState('')

  /*
   * '주제별로 둘러보기'와 '새롭게 만나는 여행지'가 동일한
   * contentTypeId=12, arrange=Q 조건을 사용하므로 한 번 조회한 결과를 공유합니다.
   */
  const newPlaceItems = themeItems
  const isNewPlaceLoading = isThemeLoading
  const newPlaceErrorMessage = themeErrorMessage

  /**
   * 현재 백엔드에서 지원하는 contentTypeId=12 관광지 중
   * 대표 이미지가 있는 최신 데이터 4건을 조회합니다.
   *
   * 세부 주제 분류(cat1/cat2/cat3)는 아직 백엔드가 지원하지 않으므로
   * 현재 단계에서는 실제 관광지 목록까지만 연결합니다.
   */
  useEffect(() => {
    const controller = new AbortController()

    async function fetchThemeItems() {
      try {
        setIsThemeLoading(true)
        setThemeErrorMessage('')

        const params = new URLSearchParams({
          page: '1',
          size: '4',
          contentTypeId: '12',
          arrange: 'Q',
        })

        const data = await fetchTourJson(
          `/api/v1/search?${params.toString()}`,
        )
        setThemeItems(data.items ?? [])
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('주제별 관광지 조회 중 오류가 발생했습니다.', error)
        setThemeItems([])
        setThemeErrorMessage('주제별 관광지를 불러오지 못했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsThemeLoading(false)
      }
    }

    fetchThemeItems()
    return () => controller.abort()
  }, [])

  /**
   * TourAPI contentTypeId=14 문화시설 중 대표 데이터 3건을 조회합니다.
   *
   * 백엔드가 /api/v1/search 계약에 맞춰 응답하면
   * React 코드를 추가로 수정하지 않고 실제 데이터가 표시됩니다.
   */
  useEffect(() => {
    const controller = new AbortController()

    async function fetchCultureItems() {
      try {
        setIsCultureLoading(true)
        setCultureErrorMessage('')

        const params = new URLSearchParams({
          page: '1',
          size: '3',
          contentTypeId: '14',
          arrange: 'Q',
        })

        const data = await fetchTourJson(
          `/api/v1/search?${params.toString()}`,
        )
        setCultureItems(data.items ?? [])
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('문화시설 조회 중 오류가 발생했습니다.', error)
        setCultureItems([])
        setCultureErrorMessage('문화시설 정보를 불러오지 못했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsCultureLoading(false)
      }
    }

    fetchCultureItems()
    return () => controller.abort()
  }, [])

  return <div className="destinations-page">
    <Header forceLight activePage="destinations" />
    <section className="destination-hero"><div className="destination-hero__inner"><div><p className="destination-hero__eyebrow">WAYLOG DESTINATION</p><h1>어디로 떠나볼까요?</h1><p>지역과 취향에 맞는 국내 여행지를 발견해 보세요.</p><button type="button" onClick={() => setIsSearchOpen(true)}>여행지 검색하기</button><small>지역 · 여행 유형 · 여행 조건을 선택해 검색할 수 있어요.</small></div><img src={hero} alt="국내 여행지 사진 일러스트" /></div></section>

    <main className="destination-main">
      <section><SectionHeading title="어떤 여행지를 찾고 있나요?" description="관광지와 문화시설을 원하는 방식으로 둘러보세요." /><div className="destination-type-grid">{travelTypes.map(item => item.id === 'course' ? <div className="destination-type-grid__disabled" aria-disabled="true" key={item.id}><article><img src={travelTypeImages[item.id]} alt="" /><span aria-hidden="true">{item.icon}</span><div><b>개발 준비 중</b><h3>{item.title}</h3><p>{item.description}</p></div></article></div> : <a href={travelTypeLinks[item.id]} key={item.id}><article><img src={travelTypeImages[item.id]} alt="" /><span aria-hidden="true">{item.icon}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></article></a>)}</div></section>

      <section><SectionHeading title="지역별로 둘러보기" description="가고 싶은 지역을 선택해 여행지를 확인해 보세요." /><div className="region-grid">{regions.map(item => <a href={`/destinations/regions/${item.regionKey}`} key={item.regionKey}><article><img src={item.image} alt={`${item.title} 여행 풍경`} /><h3>{item.title}</h3></article></a>)}</div></section>

      <section>
        <SectionHeading
          title="주제별로 둘러보기"
          description="TourAPI 관광정보를 기준으로 다양한 여행지를 만나보세요."
          link="/destinations/attractions"
        />

        {isThemeLoading && (
          <p className="destination-api-status">
            관광지 정보를 불러오는 중입니다.
          </p>
        )}

        {!isThemeLoading && themeErrorMessage && (
          <p className="destination-api-status destination-api-status--error">
            {themeErrorMessage}
          </p>
        )}

        {!isThemeLoading && !themeErrorMessage && themeItems.length === 0 && (
          <p className="destination-api-status">
            현재 표시할 관광지가 없습니다.
          </p>
        )}

        {!isThemeLoading && !themeErrorMessage && themeItems.length > 0 && (
          <div className="destination-info-grid destination-info-grid--four">
            {themeItems.map((item, index) => {
              const fallbackImage =
                themeFallbackImages[index % themeFallbackImages.length]
              const cardImage = item.image || item.thumbnail || fallbackImage

              return (
                <a
                  className="destination-info-card__link"
                  href={
                    `/destinations/detail/${item.contentId}` +
                    `?contentTypeId=${item.contentTypeId}`
                  }
                  key={item.contentId}
                >
                  <article className="destination-info-card">
                    <img
                      src={cardImage}
                      alt={item.title || '관광지 이미지'}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = fallbackImage
                      }}
                    />

                    <div>
                      <span>관광지</span>
                      <h3 title={item.title || '관광지 이름 없음'}>
                        {item.title || '관광지 이름 없음'}
                      </h3>

                      <p
                        className="destination-card-location"
                        title={item.address || '주소 정보 없음'}
                      >
                        <PlacePinIcon />
                        <small>{item.address || '주소 정보 없음'}</small>
                      </p>

                    </div>
                  </article>
                </a>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="문화와 역사를 만나는 곳"
          description="박물관, 미술관, 전시관에서 다양한 이야기를 만나보세요."
          link="/destinations/culture"
        />

        {isCultureLoading && (
          <p className="destination-api-status">
            문화시설 정보를 불러오는 중입니다.
          </p>
        )}

        {!isCultureLoading && cultureErrorMessage && (
          <p className="destination-api-status destination-api-status--error">
            {cultureErrorMessage}
          </p>
        )}

        {!isCultureLoading &&
          !cultureErrorMessage &&
          cultureItems.length === 0 && (
            <p className="destination-api-status">
              현재 표시할 문화시설이 없습니다.
            </p>
          )}

        {!isCultureLoading &&
          !cultureErrorMessage &&
          cultureItems.length > 0 && (
            <div className="destination-info-grid destination-info-grid--three">
              {cultureItems.map((item, index) => {
                const fallbackImage =
                  cultureFallbackImages[index % cultureFallbackImages.length]
                const cardImage = item.image || item.thumbnail || fallbackImage

                return (
                  <a
                    className="destination-info-card__link"
                    href={
                      `/destinations/detail/${item.contentId}` +
                      `?contentTypeId=${item.contentTypeId}`
                    }
                    key={item.contentId}
                  >
                    <article className="destination-info-card">
                      <img
                        src={cardImage}
                        alt={item.title || '문화시설 이미지'}
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = fallbackImage
                        }}
                      />

                      <div>
                        <span>문화시설</span>

                        <h3 title={item.title || '문화시설 이름 없음'}>
                          {item.title || '문화시설 이름 없음'}
                        </h3>

                        <p
                          className="destination-card-location"
                          title={item.address || '주소 정보 없음'}
                        >
                          <PlacePinIcon />
                          <small>{item.address || '주소 정보 없음'}</small>
                        </p>

                      </div>
                    </article>
                  </a>
                )
              })}
            </div>
          )}
      </section>

      <section>
        {/* 요청에 따라 이 영역에는 더보기 링크를 표시하지 않습니다. */}
        <SectionHeading
          title="새롭게 만나는 여행지"
          description="최근 업데이트된 국내 여행지를 확인해 보세요."
        />

        {isNewPlaceLoading && (
          <p className="destination-api-status">
            최근 여행지를 불러오는 중입니다.
          </p>
        )}

        {!isNewPlaceLoading && newPlaceErrorMessage && (
          <p className="destination-api-status destination-api-status--error">
            {newPlaceErrorMessage}
          </p>
        )}

        {!isNewPlaceLoading &&
          !newPlaceErrorMessage &&
          newPlaceItems.length === 0 && (
            <p className="destination-api-status">
              현재 표시할 새로운 여행지가 없습니다.
            </p>
          )}

        {!isNewPlaceLoading &&
          !newPlaceErrorMessage &&
          newPlaceItems.length > 0 && (
            <div className="destination-new-grid">
              {newPlaceItems.map((item) => {
                const cardImage = item.image || item.thumbnail || attraction
                const typeLabel =
                  contentTypeLabels[item.contentTypeId] || '관광정보'

                return (
                  <a
                    className="destination-new-card__link"
                    href={
                      `/destinations/detail/${item.contentId}` +
                      `?contentTypeId=${item.contentTypeId}`
                    }
                    key={item.contentId}
                  >
                    <article>
                      <img
                        src={cardImage}
                        alt={item.title || '관광정보 이미지'}
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = attraction
                        }}
                      />

                      <div>
                        <span>{typeLabel}</span>

                        <h3 title={item.title || '관광정보 이름 없음'}>
                          {item.title || '관광정보 이름 없음'}
                        </h3>

                        <p
                          className="location-with-pin"
                          title={item.address || '주소 정보 없음'}
                        >
                          <PlacePinIcon />
                          <small>{item.address || '주소 정보 없음'}</small>
                        </p>
                      </div>
                    </article>
                  </a>
                )
              })}
            </div>
          )}
      </section>
    </main>
    <Footer />
    <TravelSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
  </div>
}
