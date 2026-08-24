import { useEffect, useState } from 'react'
import PlacePinIcon from '../icons/PlacePinIcon'
import './TravelSearchModal.css'

// 백엔드 연결 시 id를 TourAPI contentTypeId(관광지/문화시설/여행코스)로 교체할 수 있습니다.
const travelTypes = [
  { id: 'attraction', icon: <PlacePinIcon size={38} />, title: '관광지', description: '자연 · 역사 · 체험 관광지' },
  { id: 'culture', icon: '▦', title: '문화시설', description: '박물관 · 미술관 · 전시관' },
  { id: 'course', icon: '↝', title: '여행코스', description: '순서대로 둘러보는 여행 코스' },
]

export default function TravelSearchModal({ isOpen, onClose }) {
  // 네 가지 선택값은 하단 요약과 검색 요청 쿼리에 동시에 사용됩니다.
  const [region, setRegion] = useState('전체')
  const [district, setDistrict] = useState('전체')
  const [travelType, setTravelType] = useState('관광지')
  const [detail, setDetail] = useState('전체')

  useEffect(() => {
    // 모달이 열린 동안 배경 스크롤을 막고 Escape 키로 닫을 수 있게 합니다.
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const resetSelections = () => {
    // 현재 구현 범위에서는 지역과 상세 조건이 '전체'만 지원됩니다.
    setRegion('전체')
    setDistrict('전체')
    setTravelType('관광지')
    setDetail('전체')
  }

  const searchWithSelections = () => {
    /*
     * 백엔드 연결 예시:
     * GET /api/v1/travel/search?region=전체&district=전체&type=관광지&detail=전체
     * 프론트에서는 아래 URLSearchParams 값을 API 모듈에 전달하고,
     * 응답으로 받은 TourAPI 가공 목록을 검색 결과 페이지 state에 저장합니다.
     */
    const params = new URLSearchParams({ region, district, type: travelType, detail })
    window.location.href = `/destinations?${params.toString()}`
  }

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
            <button className={region === '전체' ? 'is-selected' : ''} type="button" onClick={() => setRegion('전체')}>전체</button>
          </div>
          <div className="travel-search-modal__region-box">
            <strong>시 · 군 · 구 선택</strong>
            <p>(선택한 시, 도)의 세부 지역을 선택해 주세요.</p>
            <button className={district === '전체' ? 'is-selected' : ''} type="button" onClick={() => setDistrict('전체')}>전체</button>
          </div>
        </div>

        <div className="travel-search-modal__section">
          <h3>2. 어떤 여행지를 찾고 있나요?</h3>
          <div className="travel-search-modal__type-grid">
            {travelTypes.map(item => (
              <button key={item.id} className={travelType === item.title ? 'is-selected' : ''} type="button" onClick={() => { setTravelType(item.title); setDetail('전체') }}>
                <span className="travel-search-modal__type-icon">{item.icon}</span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <div className="travel-search-modal__detail-title"><h3>3. 어떤 {travelType}을 찾고 있나요?</h3><span>선택한 유형에 따라 항목이 달라져요.</span></div>
          <button className={`travel-search-modal__detail-button ${detail === '전체' ? 'is-selected' : ''}`} type="button" onClick={() => setDetail('전체')}>전체</button>
        </div>

        <div className="travel-search-modal__summary">
          <h3>선택한 조건</h3>
          <div><span>지역 <strong>{region}</strong></span><span>세부 지역 <strong>{district}</strong></span><span>여행 유형 <strong>{travelType}</strong></span><span>상세 항목 <strong>{detail}</strong></span></div>
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
