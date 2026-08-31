import { useEffect, useState } from 'react'
import { travelTypes } from '../../data/travelTypes'
import { fetchTourJson } from '../../api/tourApi'
import './TravelSearchModal.css'

const contentTypeByTravelType = { 관광지: 12, 문화시설: 14, 여행코스: 25 }

export default function TravelSearchModal({ isOpen, onClose, useUrlDefaults = true }) {
  const query = new URLSearchParams(window.location.search)
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [classifications, setClassifications] = useState([])
  // 조건 변경은 URL의 기존 값을 사용하고, 다시 검색은 빈 값으로 시작합니다.
  const [regionCode, setRegionCode] = useState(() => useUrlDefaults ? query.get('lDongRegnCd') || '' : '')
  const [regionName, setRegionName] = useState(() => useUrlDefaults ? query.get('regionName') || '' : '')
  const [districtCode, setDistrictCode] = useState(() => useUrlDefaults ? query.get('lDongSignguCd') || '' : '')
  const [districtName, setDistrictName] = useState(() => useUrlDefaults ? query.get('districtName') || '' : '')
  const [travelType, setTravelType] = useState(() => useUrlDefaults ? query.get('type') || '' : '')
  const [classificationCode, setClassificationCode] = useState(() => useUrlDefaults ? query.get('lclsSystm2') || '' : '')
  const [classificationName, setClassificationName] = useState(() => useUrlDefaults ? query.get('classificationName') || '' : '')
  const [isRegionLoading, setIsRegionLoading] = useState(false)
  const [isDistrictLoading, setIsDistrictLoading] = useState(false)
  const [isClassificationLoading, setIsClassificationLoading] = useState(false)
  const [regionError, setRegionError] = useState('')
  const [classificationError, setClassificationError] = useState('')

  /** 모달이 열릴 때 백엔드 로컬 광역지역 목록을 불러옵니다. */
  useEffect(() => {
    if (!isOpen) return undefined
    let isActive = true

    async function loadRegions() {
      try {
        setIsRegionLoading(true)
        setRegionError('')
        const data = await fetchTourJson('/api/v1/regions')
        if (isActive) setRegions(Array.isArray(data) ? data : (data.items ?? []))
      } catch (error) {
        if (!isActive) return
        console.error('지역 목록 조회에 실패했습니다.', error)
        setRegions([])
        setRegionError('지역 목록을 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsRegionLoading(false)
      }
    }

    loadRegions()
    return () => { isActive = false }
  }, [isOpen])

  /** 선택한 시·도의 로컬 시군구 목록을 불러옵니다. */
  useEffect(() => {
    if (!isOpen || !regionCode) return undefined
    let isActive = true

    async function loadDistricts() {
      try {
        setIsDistrictLoading(true)
        setRegionError('')
        const params = new URLSearchParams({ lDongRegnCd: regionCode })
        const data = await fetchTourJson(`/api/v1/regions/districts?${params.toString()}`)
        if (isActive) setDistricts(Array.isArray(data) ? data : (data.items ?? []))
      } catch (error) {
        if (!isActive) return
        console.error('시군구 목록 조회에 실패했습니다.', error)
        setDistricts([])
        setRegionError('시군구 목록을 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsDistrictLoading(false)
      }
    }

    loadDistricts()
    return () => { isActive = false }
  }, [isOpen, regionCode])

  /** 여행 유형이 바뀌면 해당 유형의 로컬 중분류를 불러옵니다. */
  useEffect(() => {
    if (!isOpen || !travelType) return undefined
    const contentTypeId = contentTypeByTravelType[travelType]
    if (!contentTypeId) return undefined
    let isActive = true

    async function loadClassifications() {
      try {
        setIsClassificationLoading(true)
        setClassificationError('')
        const params = new URLSearchParams({ contentTypeId: String(contentTypeId) })
        const data = await fetchTourJson(`/api/v1/classifications?${params.toString()}`)
        if (isActive) setClassifications(Array.isArray(data) ? data : (data.items ?? []))
      } catch (error) {
        if (!isActive) return
        console.error('분류체계 조회에 실패했습니다.', error)
        setClassifications([])
        setClassificationError('상세 분류를 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsClassificationLoading(false)
      }
    }

    loadClassifications()
    return () => { isActive = false }
  }, [isOpen, travelType])

  /** 모달 배경의 스크롤을 잠그고 Escape 키로 닫습니다. */
  useEffect(() => {
    if (!isOpen) return undefined
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
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

  function selectRegion(item) {
    const selectedRegionCode = String(item.lDongRegnCd)

    // 이미 선택된 시·도를 다시 누르면 지역 선택을 해제합니다.
    // 지역 관련 상태를 함께 비워야 버튼 표시, 안내 문구, 시군구 목록이
    // 모두 최초 상태로 돌아갑니다.
    if (regionCode === selectedRegionCode) {
      setRegionCode('')
      setRegionName('')
      setDistrictCode('')
      setDistrictName('')
      setDistricts([])
      setIsDistrictLoading(false)
      setRegionError('')
      return
    }

    setRegionCode(selectedRegionCode)
    setRegionName(item.name ?? item.lDongRegnNm ?? '')
    setDistrictCode('')
    setDistrictName('')
    setDistricts([])
    setRegionError('')
  }

  function selectDistrict(item) {
    setDistrictCode(String(item.lDongSignguCd))
    setDistrictName(item.name ?? item.lDongSignguNm ?? '')
  }

  function selectTravelType(type) {
    // 이미 선택된 여행 유형을 다시 누르면 선택을 해제합니다.
    // 여행 유형과 이에 종속된 상세 분류 상태를 함께 초기화해야
    // 버튼 표시와 3단계 안내 문구가 모두 최초 상태로 돌아갑니다.
    if (travelType === type) {
      setTravelType('')
      setClassificationCode('')
      setClassificationName('')
      setClassifications([])
      setIsClassificationLoading(false)
      setClassificationError('')
      return
    }

    setTravelType(type)
    setClassificationCode('')
    setClassificationName('')
    setClassifications([])
    setClassificationError('')
  }

  function resetSelections() {
    setRegionCode('')
    setRegionName('')
    setDistrictCode('')
    setDistrictName('')
    setDistricts([])
    setTravelType('')
    setClassificationCode('')
    setClassificationName('')
    setClassifications([])
    setRegionError('')
    setClassificationError('')
  }

  function searchWithSelections() {
    const params = new URLSearchParams()
    const contentTypeId = contentTypeByTravelType[travelType]
    if (regionCode) {
      params.set('lDongRegnCd', regionCode)
      params.set('regionName', regionName)
    }
    if (regionCode && districtCode) {
      params.set('lDongSignguCd', districtCode)
      params.set('districtName', districtName)
    }
    if (travelType && contentTypeId) {
      params.set('type', travelType)
      params.set('contentTypeId', String(contentTypeId))
    }
    if (classificationCode) {
      const selected = classifications.find((item) => item.lclsSystm2Cd === classificationCode)
      if (selected) {
        params.set('lclsSystm1', selected.lclsSystm1Cd)
        params.set('lclsSystm2', selected.lclsSystm2Cd)
        params.set('classificationName', selected.lclsSystm2Nm)
      }
    }
    window.location.href = `/destinations/search?${params.toString()}`
  }

  const travelTypeObject = { 관광지: '관광지를', 문화시설: '문화시설을', 여행코스: '여행코스를' }[travelType]

  return (
    <div className="travel-search-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="travel-search-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="travel-search-title">
        <button className="travel-search-modal__close" type="button" onClick={onClose} aria-label="여행지 검색 닫기">×</button>
        <header><h2 id="travel-search-title">여행지 찾기</h2><p>세 가지 조건을 선택하면 원하는 여행지를 찾아드려요.</p></header>

        <div className="travel-search-modal__section">
          <h3>1. 어디로 떠나시나요?</h3>
          <div className="travel-search-modal__region-box">
            <strong>시 · 도 선택</strong><p>먼저 여행할 지역을 선택해 주세요.</p>
            {isRegionLoading && <p>지역을 불러오는 중입니다.</p>}
            {!isRegionLoading && regions.map((item) => {
              const code = String(item.lDongRegnCd)
              return <button key={code} className={regionCode === code ? 'is-selected' : ''} type="button" onClick={() => selectRegion(item)}>{item.name ?? item.lDongRegnNm ?? '지역명 없음'}</button>
            })}
          </div>

          <div className="travel-search-modal__region-box">
            <strong>시 · 군 · 구 선택</strong><p>{regionCode ? `${regionName}의 세부 지역을 선택해 주세요.` : '먼저 시 · 도를 선택해 주세요.'}</p>
            {isDistrictLoading && <p>시군구를 불러오는 중입니다.</p>}
            {!isDistrictLoading && districts.map((item) => {
              const code = String(item.lDongSignguCd)
              return <button key={`${item.lDongRegnCd}-${code}`} className={districtCode === code ? 'is-selected' : ''} type="button" onClick={() => selectDistrict(item)}>{item.name ?? item.lDongSignguNm ?? '지역명 없음'}</button>
            })}
            {regionError && <p role="alert">{regionError}</p>}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <h3>2. 어떤 여행지를 찾고 있나요?</h3>
          <div className="travel-search-modal__type-grid">
            {travelTypes.filter((item) => item.id !== 'course').map((item) => <button key={item.id} className={travelType === item.title ? 'is-selected' : ''} type="button" onClick={() => selectTravelType(item.title)}><span className="travel-search-modal__type-icon" aria-hidden="true">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <div className="travel-search-modal__detail-title"><h3>3. {travelTypeObject ? `어떤 ${travelTypeObject} 찾고 있나요?` : '어떤 세부 항목을 찾고 있나요?'}</h3><span>선택한 유형에 따라 항목이 달라져요.</span></div>
          <div className="travel-search-modal__detail-options">
            <button className={`travel-search-modal__detail-button ${classificationCode === '' ? 'is-selected' : ''}`} type="button" disabled={!travelType} onClick={() => { setClassificationCode(''); setClassificationName('') }}>전체</button>
            {isClassificationLoading && <p>상세 분류를 불러오는 중입니다.</p>}
            {!isClassificationLoading && classifications.map((item) => <button className={`travel-search-modal__detail-button ${classificationCode === item.lclsSystm2Cd ? 'is-selected' : ''}`} type="button" key={item.lclsSystm2Cd} onClick={() => { setClassificationCode(item.lclsSystm2Cd); setClassificationName(item.lclsSystm2Nm) }}>{item.lclsSystm2Nm}</button>)}
            {classificationError && <p role="alert">{classificationError}</p>}
          </div>
        </div>

        <div className="travel-search-modal__summary">
          <h3>선택한 조건</h3>
          <div><span>지역 <strong>{[regionName, districtName].filter(Boolean).join(' ') || '전체 지역'}</strong></span>{travelType && <span>여행 유형 <strong>{travelType}</strong></span>}{travelType && <span>상세 항목 <strong>{classificationName || '전체'}</strong></span>}</div>
        </div>

        <footer className="travel-search-modal__actions">
          <button type="button" onClick={resetSelections}>선택 초기화</button><p>조건에 맞는 여행 정보를 확인해 보세요.</p><button type="button" disabled={!travelType} onClick={searchWithSelections}>선택한 조건으로 검색</button>
        </footer>
      </section>
    </div>
  )
}
