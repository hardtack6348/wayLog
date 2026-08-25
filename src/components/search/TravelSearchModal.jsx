import { useEffect, useState } from 'react'
import { travelTypes } from '../../data/travelTypes'
import './TravelSearchModal.css'

export default function TravelSearchModal({ isOpen, onClose }) {
  const query = new URLSearchParams(window.location.search)
  // 네 가지 선택값은 하단 요약과 검색 요청 쿼리에 동시에 사용됩니다.
  const [region, setRegion] = useState(() => query.get('region') || '')
  const [district, setDistrict] = useState(() => query.get('district') || '')
  const [travelType, setTravelType] = useState(() => query.get('type') || '')
  const [detail, setDetail] = useState(() => query.get('detail') || '')

  useEffect(() => {
    // 모달이 열린 동안 배경 스크롤을 막고 Escape 키로 닫을 수 있게 합니다.
    if (!isOpen) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    // 브라우저에 따라 실제 스크롤 컨테이너가 body 또는 html이므로 둘 다 잠급니다.
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const resetSelections = () => {
    // 현재 구현 범위에서는 지역과 상세 조건이 '전체'만 지원됩니다.
    setRegion('')
    setDistrict('')
    setTravelType('')
    setDetail('')
  }

  const searchWithSelections = () => {
    /*
     * 백엔드 연결 예시:
     * GET /api/v1/travel/search?region=서울&district=종로구&type=관광지&detail=전체
     * 프론트에서는 아래 URLSearchParams 값을 API 모듈에 전달하고,
     * 응답으로 받은 TourAPI 가공 목록을 검색 결과 페이지 state에 저장합니다.
     */
    const params = new URLSearchParams({ region, district, type: travelType, detail })
    window.location.href = `/destinations/search?${params.toString()}`
  }

  const travelTypeObject = {
    관광지: '관광지를',
    문화시설: '문화시설을',
    여행코스: '여행코스를',
  }[travelType]

  return (
    <div className="travel-search-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="travel-search-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="travel-search-title">
        <button className="travel-search-modal__close" type="button" onClick={onClose} aria-label="여행지 검색 닫기">×</button>
        <header>
          <h2 id="travel-search-title">여행지 찾기</h2>
          <p>세 가지 조건을 선택하면 원하는 여행지를 찾아드려요.</p>
        </header>

        <div className="travel-search-modal__section">
          <h3>1. 어디로 떠나시나요?</h3>
          <div className="travel-search-modal__region-box">
            <strong>시 · 도 선택</strong>
            <p>먼저 여행할 지역을 선택해 주세요.</p>
            <button className={region === '전체' ? 'is-selected' : ''} type="button" onClick={() => { setRegion('전체'); setDistrict('') }}>전체</button>
          </div>
          <div className="travel-search-modal__region-box">
            <strong>시 · 군 · 구 선택</strong>
            <p>(선택한 시, 도)의 세부 지역을 선택해 주세요.</p>
            <button className={district === '전체' ? 'is-selected' : ''} type="button" disabled={!region} onClick={() => setDistrict('전체')}>전체</button>
          </div>
        </div>

        <div className="travel-search-modal__section">
          <h3>2. 어떤 여행지를 찾고 있나요?</h3>
          <div className="travel-search-modal__type-grid">
            {travelTypes.map(item => (
              <button key={item.id} className={travelType === item.title ? 'is-selected' : ''} type="button" onClick={() => { setTravelType(item.title); setDetail('') }}>
                <span className="travel-search-modal__type-icon" aria-hidden="true">{item.icon}</span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <div className="travel-search-modal__detail-title"><h3>3. {travelTypeObject ? `어떤 ${travelTypeObject} 찾고 있나요?` : '어떤 세부 항목을 찾고 있나요?'}</h3><span>선택한 유형에 따라 항목이 달라져요.</span></div>
          <button className={`travel-search-modal__detail-button ${detail === '전체' ? 'is-selected' : ''}`} type="button" disabled={!travelType} onClick={() => setDetail('전체')}>전체</button>
        </div>

        <div className="travel-search-modal__summary">
          <h3>선택한 조건</h3>
          <div>{region && district && <span>지역 <strong>{region} {district}</strong></span>}{travelType && <span>여행 유형 <strong>{travelType}</strong></span>}{detail && <span>상세 항목 <strong>{detail}</strong></span>}</div>
        </div>

        <footer className="travel-search-modal__actions">
          <button type="button" onClick={resetSelections}>선택 초기화</button>
          <p>조건에 맞는 여행 정보를 확인해 보세요.</p>
          <button type="button" onClick={searchWithSelections}>선택한 조건으로 검색</button>
        </footer>
      </section>
    </div>
  )
}
