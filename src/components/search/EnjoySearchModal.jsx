import { useEffect, useState } from 'react'
import './TravelSearchModal.css'
import './EnjoySearchModal.css'

// 추후 TourAPI areaCode2 응답을 '전체' 뒤에 추가해 시 · 도 목록을 구성합니다.
const regions = ['전체']

const enjoyTypes = [
  { id: 'festival', icon: '🎉', title: '축제 · 행사' },
  { id: 'leports', icon: '🚴', title: '레포츠' },
  { id: 'food', icon: '🍽️', title: '음식점' },
  { id: 'shopping', icon: '🛍️', title: '쇼핑' },
  { id: 'stay', icon: '🛏️', title: '숙박' },
]

export default function EnjoySearchModal({ isOpen, onClose }) {
  const query = new URLSearchParams(window.location.search)
  const [region, setRegion] = useState(() => query.get('region') || '')
  const [district, setDistrict] = useState(() => query.get('district') || '')
  const [enjoyType, setEnjoyType] = useState(() => query.get('type') || '')
  const [detail, setDetail] = useState(() => query.get('detail') || '')

  useEffect(() => {
    if (!isOpen) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

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
    setRegion('')
    setDistrict('')
    setEnjoyType('')
    setDetail('')
  }

  const searchWithSelections = () => {
    const params = new URLSearchParams({ region, district, type: enjoyType, detail })
    window.location.href = `/enjoy/search?${params.toString()}`
  }

  return (
    <div className="travel-search-modal enjoy-search-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="travel-search-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="enjoy-search-title">
        <button className="travel-search-modal__close" type="button" onClick={onClose} aria-label="여행 즐길거리 검색 닫기">×</button>
        <header>
          <h2 id="enjoy-search-title">여행 즐길거리 찾기</h2>
          <p>지역과 유형을 선택하면 원하는 여행정보를 찾아드려요.</p>
        </header>

        <div className="travel-search-modal__section">
          <h3>1. 어디에서 즐길까요?</h3>
          <div className="travel-search-modal__region-box">
            <strong>시 · 도 선택</strong>
            <p>먼저 여행할 지역을 선택해 주세요.</p>
            <div className="enjoy-search-modal__region-options">
              {regions.map(item => <button key={item} className={region === item ? 'is-selected' : ''} type="button" onClick={() => { setRegion(item); setDistrict('') }}>{item}</button>)}
            </div>
          </div>
          <div className="travel-search-modal__region-box">
            <strong>시 · 군 · 구 선택</strong>
            <p>{region ? `${region}의 세부 지역을 선택해 주세요.` : '먼저 시 · 도를 선택해 주세요.'}</p>
            <button className={district === '전체' ? 'is-selected' : ''} type="button" disabled={!region} onClick={() => setDistrict('전체')}>전체</button>
          </div>
        </div>

        <div className="travel-search-modal__section">
          <h3>2. 무엇을 찾고 있나요?</h3>
          <div className="enjoy-search-modal__type-grid">
            {enjoyTypes.map(item => (
              <button key={item.id} className={enjoyType === item.title ? 'is-selected' : ''} type="button" onClick={() => { setEnjoyType(item.title); setDetail('') }}>
                <span aria-hidden="true">{item.icon}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <div className="travel-search-modal__detail-title"><h3>3. {enjoyType ? `어떤 ${enjoyType} 항목을 찾고 있나요?` : '어떤 세부 항목을 찾고 있나요?'}</h3><span>선택한 유형에 따라 항목이 달라져요.</span></div>
          <button className={`travel-search-modal__detail-button ${detail === '전체' ? 'is-selected' : ''}`} type="button" disabled={!enjoyType} onClick={() => setDetail('전체')}>전체</button>
        </div>

        <div className="travel-search-modal__summary">
          <h3>선택한 조건</h3>
          <div>{region && district && <span>지역 <strong>{region} {district}</strong></span>}{enjoyType && <span>즐길거리 유형 <strong>{enjoyType}</strong></span>}{detail && <span>상세 항목 <strong>{detail}</strong></span>}</div>
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
