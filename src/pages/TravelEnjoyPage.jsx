import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { fetchTourJson } from '../api/tourApi'
import festival from '../assets/enjoy/category-festival.png'
import leports from '../assets/enjoy/category-leports.png'
import food from '../assets/enjoy/category-food.png'
import shopping from '../assets/enjoy/category-shopping.png'
import stay from '../assets/enjoy/category-stay.png'
import record from '../assets/enjoy/record.png'
import './TravelEnjoyPage.css'

// TourAPI 콘텐츠 유형을 사용자가 이해하기 쉬운 즐길거리 분류로 표현한 데이터입니다.
const categories = [
  { slug:'festivals', image: festival, icon: '🎉', title: '축제 · 행사', text: '지금 열리는 다양한 지역 행사' },
  { slug:'leports', image: leports, icon: '🚴', title: '레포츠', text: '몸으로 즐기는 체험과 액티비티' },
  { slug:'food', image: food, icon: '🍽️', title: '음식점', text: '여행지에서 만나는 지역의 맛' },
  { slug:'shopping', image: shopping, icon: '🛍️', title: '쇼핑', text: '전통시장과 지역 특산품' },
  { slug:'stay', image: stay, icon: '🛏️', title: '숙박', text: '편안하게 머물 수 있는 공간' },
]

function SectionHeading({ title, description, link = '전체 보기', href = '#more' }) {
  // 페이지 내 모든 상세 링크 문구를 '더보기 →' 형태로 통일합니다.
  return <div className="enjoy-heading"><div><h2>{title}</h2><p>{description}</p></div>{link && <a href={href}>더보기 <span>→</span></a>}</div>
}

function InfoCards({ items, badge, contentTypeId, fallbackImage, columns = 4 }) {
  if (items.length === 0) {
    return <p className="enjoy-api-status">현재 표시할 {badge} 정보가 없습니다.</p>
  }

  return <div className={`enjoy-info-grid${columns === 3 ? ' enjoy-info-grid--three' : ''}`}>{items.map((item) => <a href={`/destinations/detail/${item.contentId}?contentTypeId=${contentTypeId}`} key={item.contentId}><article className="enjoy-info-card"><img src={item.image || item.thumbnail || fallbackImage} alt={item.title || `${badge} 이미지`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage }} /><div><span className="enjoy-info-card__badge">{badge}</span><h3>{item.title || `${badge} 이름 없음`}</h3><p className="enjoy-info-card__location" title={item.address || '주소 정보 없음'}><PlacePinIcon /><span>{item.address || '주소 정보 없음'}</span></p><p>자세한 관광정보를 확인해 보세요.</p></div></article></a>)}</div>
}

export default function TravelEnjoyPage() {
  // 각 배열은 백엔드 TourAPI 응답을 카드 마크업에 연결해 보여 줍니다.
  const [weeklyNews, setWeeklyNews] = useState([])
  const [isFestivalLoading, setIsFestivalLoading] = useState(true)
  const [festivalErrorMessage, setFestivalErrorMessage] = useState('')
  const [enjoySections, setEnjoySections] = useState({ leports: [], food: [], shopping: [], stay: [] })
  const [isEnjoyLoading, setIsEnjoyLoading] = useState(true)
  const [enjoyErrorMessage, setEnjoyErrorMessage] = useState('')

  /**
   * /api/v1/home은 백엔드 내부에서 최대 14번 TourAPI를 호출하므로 사용하지 않습니다.
   * 이 화면에 필요한 다섯 콘텐츠 유형만 직접 조회해 외부 호출을 5번으로 제한합니다.
   */
  useEffect(() => {
    let isActive = true

    async function fetchEnjoyPageData() {
      try {
        setIsFestivalLoading(true)
        setIsEnjoyLoading(true)
        setFestivalErrorMessage('')
        setEnjoyErrorMessage('')

        const requests = [
          ['festivals', 15, 3],
          ['leports', 28, 4],
          ['food', 39, 4],
          ['shopping', 38, 3],
          ['stay', 32, 4],
        ]

        const responses = await Promise.all(
          requests.map(async ([key, contentTypeId, size]) => {
            const params = new URLSearchParams({
              page: '1',
              size: String(size),
              contentTypeId: String(contentTypeId),
              arrange: 'Q',
            })
            const data = await fetchTourJson(
              `/api/v1/search?${params.toString()}`,
            )
            return [key, data.items ?? []]
          }),
        )

        if (!isActive) return
        const sectionData = Object.fromEntries(responses)
        setWeeklyNews(sectionData.festivals)
        setEnjoySections({
          leports: sectionData.leports,
          food: sectionData.food,
          shopping: sectionData.shopping,
          stay: sectionData.stay,
        })
      } catch (error) {
        if (!isActive) return
        console.error('이번 주 여행 소식 조회 중 오류가 발생했습니다.', error)
        setWeeklyNews([])
        setEnjoySections({ leports: [], food: [], shopping: [], stay: [] })
        setFestivalErrorMessage('축제와 행사 정보를 불러오지 못했습니다.')
        setEnjoyErrorMessage('여행 즐길거리 정보를 불러오지 못했습니다.')
      } finally {
        if (isActive) {
          setIsFestivalLoading(false)
          setIsEnjoyLoading(false)
        }
      }
    }

    fetchEnjoyPageData()
    return () => { isActive = false }
  }, [])

  return <div className="travel-enjoy-page">
    <Header forceLight activePage="enjoy" />
    <section className="enjoy-hero">
      <div className="enjoy-hero__inner">
        <div className="enjoy-hero__copy">
          <p className="enjoy-hero__eyebrow">WAYLOG EXPERIENCE</p>
          <h1>여행을 더 즐겁게</h1>
          <p>축제부터 맛집, 숙소까지 여행에 필요한 정보를 둘러보세요.</p>
        </div>

        {/* 여행의 여러 순간을 사진 엽서처럼 겹쳐 표현한 Hero 콜라주입니다. */}
        <div className="enjoy-hero__collage" aria-label="축제, 레포츠, 음식, 쇼핑과 숙박 여행 이미지">
          <img className="enjoy-collage__photo enjoy-collage__photo--festival" src={festival} alt="야간 불꽃 축제" />
          <img className="enjoy-collage__photo enjoy-collage__photo--leports" src={leports} alt="바다에서 즐기는 레포츠" />
          <img className="enjoy-collage__photo enjoy-collage__photo--shopping" src={shopping} alt="여행지의 쇼핑 거리" />
          <img className="enjoy-collage__photo enjoy-collage__photo--stay" src={stay} alt="바다 전망 숙소" />
          <img className="enjoy-collage__photo enjoy-collage__photo--food" src={food} alt="여행지의 지역 음식" />
          <span className="enjoy-collage__icon enjoy-collage__icon--pin" aria-hidden="true">🏖</span>
          <span className="enjoy-collage__icon enjoy-collage__icon--camera" aria-hidden="true">🏟</span>
          <span className="enjoy-collage__icon enjoy-collage__icon--ticket" aria-hidden="true">❤</span>
          <span className="enjoy-collage__route" aria-hidden="true" />
        </div>
      </div>
    </section>

    <main className="enjoy-main">
      <section><SectionHeading title="무엇을 즐기고 싶나요?" description="여행 중 필요한 정보를 카테고리별로 빠르게 확인해 보세요." link="" /><div className="enjoy-category-grid">{categories.map(item => <a href={`/enjoy/${item.slug}`} key={item.title}><article><img src={item.image} alt="" /><div><h3>{item.title}</h3><p>{item.text}</p></div></article></a>)}</div></section>

      <section>
        <SectionHeading title="이번 주 여행 소식" description="현재 진행 중이거나 곧 시작하는 축제와 행사입니다." href="/enjoy/festivals" />
        {isFestivalLoading && <p className="enjoy-api-status">축제와 행사 정보를 불러오는 중입니다.</p>}
        {!isFestivalLoading && festivalErrorMessage && <p className="enjoy-api-status enjoy-api-status--error">{festivalErrorMessage}</p>}
        {!isFestivalLoading && !festivalErrorMessage && weeklyNews.length === 0 && <p className="enjoy-api-status">현재 표시할 축제와 행사가 없습니다.</p>}
        {!isFestivalLoading && !festivalErrorMessage && weeklyNews.length > 0 && (
          <div className="enjoy-news-grid">
            {weeklyNews.map((item) => (
              <a href={`/destinations/detail/${item.contentId}?contentTypeId=15`} key={item.contentId}>
                <article><img src={item.image || festival} alt={item.title || '축제 이미지'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = festival }} /><div><h3>{item.title || '축제명 정보 없음'}</h3><p>◷ {item.startDate && item.endDate ? `${item.startDate} ~ ${item.endDate}` : '행사 일정 확인'}</p><p className="location-with-pin"><PlacePinIcon />{item.address || '장소 정보 없음'}</p></div></article>
              </a>
            ))}
          </div>
        )}
        <p className="enjoy-disclaimer">행사 일정은 현지 사정에 따라 변경될 수 있습니다.</p>
      </section>

      <section className="enjoy-detail-section enjoy-detail-section--activity"><SectionHeading title="신나는 체험과 레포츠" description="몸으로 직접 즐기는 다양한 체험과 액티비티를 만나보세요." href="/enjoy/leports" />{isEnjoyLoading ? <p className="enjoy-api-status">레포츠 정보를 불러오는 중입니다.</p> : enjoyErrorMessage ? <p className="enjoy-api-status enjoy-api-status--error">{enjoyErrorMessage}</p> : <InfoCards items={enjoySections.leports} badge="레포츠" contentTypeId={28} fallbackImage={leports} />}</section>
      <section className="enjoy-detail-section enjoy-detail-section--food"><SectionHeading title="여행지에서 만나는 맛있는 순간" description="지역의 재료와 이야기가 담긴 특별한 맛을 경험해 보세요." href="/enjoy/food" />{isEnjoyLoading ? <p className="enjoy-api-status">음식점 정보를 불러오는 중입니다.</p> : enjoyErrorMessage ? <p className="enjoy-api-status enjoy-api-status--error">{enjoyErrorMessage}</p> : <InfoCards items={enjoySections.food} badge="음식점" contentTypeId={39} fallbackImage={food} />}</section>
      <section className="enjoy-detail-section"><SectionHeading title="여행지에서 즐기는 쇼핑" description="전통시장부터 지역 특산품까지 여행의 즐거움을 담아보세요." href="/enjoy/shopping" />{isEnjoyLoading ? <p className="enjoy-api-status">쇼핑 정보를 불러오는 중입니다.</p> : enjoyErrorMessage ? <p className="enjoy-api-status enjoy-api-status--error">{enjoyErrorMessage}</p> : <InfoCards items={enjoySections.shopping} badge="쇼핑" contentTypeId={38} fallbackImage={shopping} columns={3} />}</section>
      <section className="enjoy-detail-section enjoy-detail-section--stay"><SectionHeading title="여행의 하루를 마무리할 곳" description="지역별 숙박시설의 기본정보를 확인해 보세요." href="/enjoy/stay" />{isEnjoyLoading ? <p className="enjoy-api-status">숙박 정보를 불러오는 중입니다.</p> : enjoyErrorMessage ? <p className="enjoy-api-status enjoy-api-status--error">{enjoyErrorMessage}</p> : <InfoCards items={enjoySections.stay} badge="숙박" contentTypeId={32} fallbackImage={stay} />}<p className="enjoy-disclaimer">실시간 객실 가격과 예약 가능 여부는 제공하지 않습니다.</p></section>

      <section className="enjoy-record"><img src={record} alt="여행 기록 일러스트" /><h2>여행의 순간을 기록하고, 함께 나눠요</h2><button type="button">여행 기록하기</button></section>
    </main>
    <Footer />
  </div>
}
