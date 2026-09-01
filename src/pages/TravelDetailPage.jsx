import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PlacePinIcon from '../components/icons/PlacePinIcon'
import { fetchTourJson } from '../api/tourApi'
import { canUseTourBookmark, fetchTourBookmarks, toggleTourBookmark } from '../api/tourBookmarkApi'
import fallbackImage from '../assets/figma/destination-jeju.png'
import './TravelDetailPage.css'

const typeByEnjoyPath = { festivals: 15, leports: 28, stay: 32, shopping: 38, food: 39 }
const groupByType = (type) => [12, 14].includes(Number(type)) ? 'DESTINATION' : 'ENJOY'

/** 관광지와 여행 즐기기에서 공통으로 사용하는 TourAPI 상세 화면입니다. */
export default function TravelDetailPage() {
  const contentId = window.location.pathname.split('/').filter(Boolean).at(-1)
  const query = new URLSearchParams(window.location.search)
  const pathParts = window.location.pathname.split('/').filter(Boolean)
  const enjoyCategory = pathParts[0] === 'enjoy' ? pathParts[1] : null
  const contentTypeId = Number(query.get('contentTypeId')) || typeByEnjoyPath[enjoyCategory]
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [bookmarkPending, setBookmarkPending] = useState(false)

  const isEnjoy = groupByType(contentTypeId) === 'ENJOY'
  const listPath = isEnjoy ? `/enjoy/${enjoyCategory || 'festivals'}` : '/destinations/attractions'

  useEffect(() => {
    let isActive = true
    async function loadDetail() {
      if (!contentId || !contentTypeId) {
        setErrorMessage('상세 정보를 확인할 수 없는 주소입니다.')
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        setErrorMessage('')
        const data = await fetchTourJson(`/api/v1/tour/contents/${encodeURIComponent(contentId)}?contentTypeId=${contentTypeId}`)
        if (isActive) setDetail(data)
      } catch (error) {
        console.error('TourAPI 상세 정보 조회 실패', error)
        if (isActive) setErrorMessage('상세 관광정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    loadDetail()
    return () => { isActive = false }
  }, [contentId, contentTypeId])

  useEffect(() => {
    let isActive = true
    if (!canUseTourBookmark() || !contentId) return undefined
    fetchTourBookmarks(groupByType(contentTypeId), { size: 100 })
      .then((data) => {
        if (isActive) setSaved((data.content ?? []).some((item) => String(item.contentId) === String(contentId)))
      })
      .catch(() => {}) // 북마크 조회 실패는 상세 정보 표시를 막지 않습니다.
    return () => { isActive = false }
  }, [contentId, contentTypeId])

  const detailInfos = useMemo(() => detail?.detailInfos ?? [], [detail])
  const mapUrl = detail?.latitude != null && detail?.longitude != null
    ? `https://map.kakao.com/link/map/${encodeURIComponent(detail.title)},${detail.latitude},${detail.longitude}`
    : null

  const goBack = () => window.history.length > 1 ? window.history.back() : window.location.assign(listPath)
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: detail?.title, url: window.location.href })
      else await navigator.clipboard?.writeText(window.location.href)
    } catch { /* 공유 창을 닫은 경우에는 메시지를 표시하지 않습니다. */ }
  }
  const handleBookmark = async () => {
    if (!canUseTourBookmark()) return window.alert('로그인 후 북마크를 이용할 수 있습니다.')
    if (!detail || bookmarkPending) return
    try {
      setBookmarkPending(true)
      const result = await toggleTourBookmark({ contentId: detail.contentId, contentTypeId: detail.contentTypeId, title: detail.title, image: detail.image, address: detail.address, categoryName: detail.contentTypeName })
      setSaved(Boolean(result.active))
    } catch (error) {
      window.alert(error.message || '북마크를 처리하지 못했습니다.')
    } finally {
      setBookmarkPending(false)
    }
  }

  return <div className="travel-detail-page">
    <Header forceLight activePage={isEnjoy ? 'enjoy' : 'destinations'} />
    <main className="travel-detail-main">
      <button className="detail-back" type="button" onClick={goBack}><span aria-hidden="true">←</span> 이전 페이지</button>
      {isLoading && <p className="detail-status">상세 관광정보를 불러오는 중입니다.</p>}
      {!isLoading && errorMessage && <div className="detail-status detail-status--error"><p>{errorMessage}</p><a href={listPath}>목록으로 돌아가기</a></div>}
      {!isLoading && !errorMessage && detail && <>
        <nav className="detail-crumb" aria-label="현재 위치"><a href="/">홈</a><i>›</i><a href={isEnjoy ? '/enjoy' : '/destinations'}>{isEnjoy ? '여행 즐기기' : '여행지'}</a><i>›</i><strong>{detail.title}</strong></nav>
        <header className="detail-hero"><div><span className="detail-tag">{detail.contentTypeName}</span><h1>{detail.title}</h1><p><PlacePinIcon size={19} />{detail.address || '주소 정보 없음'}</p></div><div className="detail-actions"><button type="button" onClick={share}>공유</button><button type="button" className={saved ? 'active' : ''} aria-pressed={saved} disabled={bookmarkPending} onClick={handleBookmark}>{saved ? '저장됨' : '저장'}</button></div></header>
        <section className="detail-gallery detail-gallery--single" aria-label={`${detail.title} 대표 사진`}><img src={detail.image || fallbackImage} alt={detail.title} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage }} /></section>
        {detail.overview && <section className="detail-content detail-content--single"><article><small>ABOUT THE PLACE</small><h2>{detail.title} 소개</h2><p className="detail-lead">{detail.overview}</p></article></section>}
        {detailInfos.length > 0 && <section className="detail-content detail-content--single"><article><div className="detail-guide"><h3>이용 안내</h3><dl>{detailInfos.map((info) => <div key={info.label}><dt>{info.label}</dt><dd>{info.value}</dd></div>)}</dl></div></article></section>}
        <section className="detail-map"><div><span><PlacePinIcon size={28} /></span><p>{mapUrl ? '좌표 정보가 등록되어 있습니다.' : '좌표 정보가 없습니다.'}</p></div><aside><span className="detail-tag">{detail.contentTypeName}</span><h3>{detail.title}</h3><p><PlacePinIcon />{detail.address || '주소 정보 없음'}</p>{mapUrl && <a className="detail-map__link" href={mapUrl} target="_blank" rel="noreferrer">카카오맵에서 위치 보기</a>}</aside></section>
        <p className="detail-source"><b>TourAPI</b> 이 관광정보는 한국관광공사 TourAPI를 통해 제공됩니다.</p>
      </>}
    </main>
    <Footer />
  </div>
}
