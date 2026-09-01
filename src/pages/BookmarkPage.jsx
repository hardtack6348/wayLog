import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import attractionFallback from '../assets/destinations/type-attraction-v2.png'
import enjoyFallback from '../assets/enjoy/category-festival.png'
import { canUseTourBookmark, fetchTourBookmarks, toggleTourBookmark } from '../api/tourBookmarkApi'
import './BookmarkPage.css'

const enjoySlugByContentType = {
  15: 'festivals',
  28: 'leports',
  32: 'stay',
  38: 'shopping',
  39: 'food',
}

function getBookmarkLink(item) {
  if (item.categoryGroup === 'DESTINATION') {
    return `/destinations/detail/${item.contentId}?contentTypeId=${item.contentTypeId}`
  }
  return `/enjoy/${enjoySlugByContentType[item.contentTypeId] ?? 'festivals'}/${item.contentId}`
}

export default function BookmarkPage() {
  const [activeTab, setActiveTab] = useState('destinations')
  const [destinationItems, setDestinationItems] = useState([])
  const [enjoyItems, setEnjoyItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isDestination = activeTab === 'destinations'
  const items = isDestination ? destinationItems : enjoyItems

  useEffect(() => {
    if (!canUseTourBookmark()) return undefined

    let isActive = true

    async function loadBookmarks() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        /*
         * 탭 개수는 페이지를 처음 열 때부터 정확해야 합니다.
         * 따라서 활성 탭만 조회하지 않고 여행지·여행 즐기기 목록을 함께 요청합니다.
         * 이 API는 WayLog DB 조회이므로 TourAPI 호출량에는 영향을 주지 않습니다.
         */
        const [destinationData, enjoyData] = await Promise.all([
          fetchTourBookmarks('DESTINATION'),
          fetchTourBookmarks('ENJOY'),
        ])

        if (!isActive) return

        setDestinationItems(
          Array.isArray(destinationData.content) ? destinationData.content : [],
        )

        setEnjoyItems(
          Array.isArray(enjoyData.content) ? enjoyData.content : [],
        )
      } catch (error) {
        if (isActive) setErrorMessage(error.message || '북마크를 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadBookmarks()
    return () => { isActive = false }
  }, [])

  const removeBookmark = async (item) => {
    try {
      const result = await toggleTourBookmark(item)
      if (result.active) return
      if (isDestination) setDestinationItems(current => current.filter(currentItem => currentItem.bookmarkId !== item.bookmarkId))
      else setEnjoyItems(current => current.filter(currentItem => currentItem.bookmarkId !== item.bookmarkId))
    } catch (error) {
      window.alert(error.message || '북마크를 해제하지 못했습니다.')
    }
  }

  return (
    <div className="bookmark-page">
      <Header forceLight />
      <main className="bookmark-main">
        <header className="bookmark-heading">
          <span>MY WAYLOG</span>
          <h1>북마크</h1>
          <p>다시 찾아보고 싶은 여행 정보와 마음에 든 여행 기록을 모아보세요.</p>
        </header>

        <div className="bookmark-tabs" role="tablist" aria-label="북마크 구분">
          <button className={isDestination ? 'is-active' : ''} type="button" role="tab" aria-selected={isDestination} onClick={() => setActiveTab('destinations')}>여행지 <b>{destinationItems.length}</b></button>
          <button className={activeTab === 'enjoy' ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === 'enjoy'} onClick={() => setActiveTab('enjoy')}>여행 즐기기 <b>{enjoyItems.length}</b></button>
          <span className="bookmark-tabs__disabled" aria-label="여행 피드 북마크 준비 중">여행 피드<small>준비 중</small></span>
        </div>

        <section className="bookmark-content">
          <header><div><span>{isDestination ? 'DESTINATION SAVES' : 'ENJOY SAVES'}</span><h2>{isDestination ? '저장한 여행지' : '저장한 여행 즐기기'}</h2></div><p>{items.length}개 저장됨</p></header>
          {!canUseTourBookmark() ? <div className="bookmark-empty"><strong>로그인 후 북마크를 확인할 수 있습니다.</strong><p>저장한 여행지와 여행 즐기기 정보를 모아볼 수 있어요.</p><a href="/login">로그인하기</a></div> : isLoading ? <p className="bookmark-status">북마크를 불러오는 중입니다.</p> : errorMessage ? <p className="bookmark-status bookmark-status--error">{errorMessage}</p> : items.length === 0 ? <div className="bookmark-empty"><strong>저장한 항목이 없습니다.</strong><p>{isDestination ? '여행지 카드의 북마크를 눌러 보세요.' : '여행 즐기기 카드의 북마크를 눌러 보세요.'}</p><a href={isDestination ? '/destinations' : '/enjoy'}>{isDestination ? '여행지 둘러보기' : '여행 즐기기 둘러보기'}</a></div> : <div className="bookmark-travel-grid">{items.map(item => <article key={item.bookmarkId}><a href={getBookmarkLink(item)}><img src={item.imageUrl || (isDestination ? attractionFallback : enjoyFallback)} alt="" /><div><span>{item.categoryName || (isDestination ? '여행지' : '여행 즐기기')}</span><h3>{item.title}</h3><p><PlacePinIcon />{item.address || '주소 정보 없음'}</p></div></a><button type="button" onClick={() => removeBookmark(item)} aria-label={`${item.title} 북마크 해제`}>★<small>저장됨</small></button></article>)}</div>}
        </section>
      </main>
      <Footer />
    </div>
  )
}
