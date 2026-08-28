import { useEffect, useState } from 'react'
import { fetchTourJson } from '../../api/tourApi'
import './TravelSearchModal.css'
import './EnjoySearchModal.css'

const enjoyTypes = [
  { id: 'festivals', icon: '🎉', title: '축제 · 행사', description: '지역 축제와 특별한 행사', contentTypeId: 15 },
  { id: 'leports', icon: '🚴', title: '레포츠', description: '체험과 야외 액티비티', contentTypeId: 28 },
  { id: 'food', icon: '🍽️', title: '음식점', description: '지역의 맛과 음식 이야기', contentTypeId: 39 },
  { id: 'shopping', icon: '🛍️', title: '쇼핑', description: '시장과 지역 특산품', contentTypeId: 38 },
  { id: 'stay', icon: '🛏️', title: '숙박', description: '호텔과 편안한 숙소', contentTypeId: 32 },
]

export default function EnjoySearchModal({ isOpen, onClose, useUrlDefaults = true }) {
  const query = new URLSearchParams(window.location.search)
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [classifications, setClassifications] = useState([])
  const [regionCode, setRegionCode] = useState(() => useUrlDefaults ? query.get('lDongRegnCd') || '' : '')
  const [regionName, setRegionName] = useState(() => useUrlDefaults ? query.get('regionName') || query.get('region') || '' : '')
  const [districtCode, setDistrictCode] = useState(() => useUrlDefaults ? query.get('lDongSignguCd') || '' : '')
  const [districtName, setDistrictName] = useState(() => useUrlDefaults ? query.get('districtName') || query.get('district') || '' : '')
  const [enjoyType, setEnjoyType] = useState(() => useUrlDefaults ? query.get('type') || '' : '')
  const [classificationCode, setClassificationCode] = useState(() => useUrlDefaults ? query.get('lclsSystm2') || '' : '')
  const [classificationName, setClassificationName] = useState(() => useUrlDefaults ? query.get('classificationName') || query.get('detail') || '' : '')
  const [isRegionLoading, setIsRegionLoading] = useState(false)
  const [isDistrictLoading, setIsDistrictLoading] = useState(false)
  const [isClassificationLoading, setIsClassificationLoading] = useState(false)
  const [regionError, setRegionError] = useState('')
  const [classificationError, setClassificationError] = useState('')

  const selectedType = enjoyTypes.find((item) => item.title === enjoyType)

  // 모달이 열리면 백엔드의 로컬 시·도 데이터를 조회합니다.
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
        console.error('즐길거리 검색 지역 조회에 실패했습니다.', error)
        setRegions([])
        setRegionError('지역 목록을 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsRegionLoading(false)
      }
    }

    loadRegions()
    return () => { isActive = false }
  }, [isOpen])

  // 선택한 시·도에 해당하는 로컬 시군구 데이터를 조회합니다.
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
        console.error('즐길거리 검색 시군구 조회에 실패했습니다.', error)
        setDistricts([])
        setRegionError('시군구 목록을 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsDistrictLoading(false)
      }
    }

    loadDistricts()
    return () => { isActive = false }
  }, [isOpen, regionCode])

  // 즐길거리 유형에 맞는 상세 분류를 조회합니다.
  useEffect(() => {
    if (!isOpen || !selectedType) return undefined
    let isActive = true

    async function loadClassifications() {
      try {
        setIsClassificationLoading(true)
        setClassificationError('')
        const params = new URLSearchParams({ contentTypeId: String(selectedType.contentTypeId) })
        const data = await fetchTourJson(`/api/v1/classifications?${params.toString()}`)
        if (isActive) setClassifications(Array.isArray(data) ? data : (data.items ?? []))
      } catch (error) {
        if (!isActive) return
        console.error('즐길거리 상세 분류 조회에 실패했습니다.', error)
        setClassifications([])
        setClassificationError('상세 분류를 불러오지 못했습니다.')
      } finally {
        if (isActive) setIsClassificationLoading(false)
      }
    }

    loadClassifications()
    return () => { isActive = false }
  }, [isOpen, selectedType])

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
    const code = String(item.lDongRegnCd)
    if (regionCode === code) {
      setRegionCode('')
      setRegionName('')
      setDistrictCode('')
      setDistrictName('')
      setDistricts([])
      setIsDistrictLoading(false)
      setRegionError('')
      return
    }
    setRegionCode(code)
    setRegionName(item.name ?? item.lDongRegnNm ?? '')
    setDistrictCode('')
    setDistrictName('')
    setDistricts([])
    setRegionError('')
  }

  function selectDistrict(item) {
    const code = String(item.lDongSignguCd)
    if (districtCode === code) {
      setDistrictCode('')
      setDistrictName('')
      return
    }
    setDistrictCode(code)
    setDistrictName(item.name ?? item.lDongSignguNm ?? '')
  }

  function selectEnjoyType(type) {
    if (enjoyType === type.title) {
      setEnjoyType('')
      setClassificationCode('')
      setClassificationName('')
      setClassifications([])
      setIsClassificationLoading(false)
      setClassificationError('')
      return
    }
    setEnjoyType(type.title)
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
    setEnjoyType('')
    setClassificationCode('')
    setClassificationName('')
    setClassifications([])
    setRegionError('')
    setClassificationError('')
  }

  function searchWithSelections() {
    if (!selectedType) return
    const params = new URLSearchParams({
      type: selectedType.title,
      category: selectedType.id,
      contentTypeId: String(selectedType.contentTypeId),
    })

    if (regionCode) {
      params.set('lDongRegnCd', regionCode)
      params.set('regionName', regionName)
      params.set('region', regionName)
    }
    if (regionCode && districtCode) {
      params.set('lDongSignguCd', districtCode)
      params.set('districtName', districtName)
      params.set('district', districtName)
    }
    if (classificationCode) {
      const selected = classifications.find((item) => item.lclsSystm2Cd === classificationCode)
      if (selected) {
        params.set('lclsSystm1', selected.lclsSystm1Cd)
        params.set('lclsSystm2', selected.lclsSystm2Cd)
        params.set('classificationName', selected.lclsSystm2Nm)
        params.set('detail', selected.lclsSystm2Nm)
      }
    }
    window.location.href = `/enjoy/search?${params.toString()}`
  }

  return (
    <div className="travel-search-modal enjoy-search-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="travel-search-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="enjoy-search-title">
        <button className="travel-search-modal__close" type="button" onClick={onClose} aria-label="여행 즐길거리 검색 닫기">×</button>
        <header><h2 id="enjoy-search-title">여행 즐길거리 찾기</h2><p>세 가지 조건을 선택하면 원하는 여행정보를 찾아드려요.</p></header>

        <div className="travel-search-modal__section">
          <h3>1. 어디에서 즐길까요?</h3>
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
          <h3>2. 무엇을 즐기고 싶나요?</h3>
          <div className="enjoy-search-modal__type-grid">
            {enjoyTypes.map((item) => (
              <button key={item.id} className={enjoyType === item.title ? 'is-selected' : ''} type="button" onClick={() => selectEnjoyType(item)}>
                <span aria-hidden="true">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="travel-search-modal__section">
          <div className="travel-search-modal__detail-title"><h3>3. {enjoyType ? `어떤 ${enjoyType} 항목을 찾고 있나요?` : '어떤 세부 항목을 찾고 있나요?'}</h3><span>선택한 유형에 따라 항목이 달라져요.</span></div>
          <div className="travel-search-modal__detail-options">
            <button className={`travel-search-modal__detail-button ${classificationCode === '' ? 'is-selected' : ''}`} type="button" disabled={!enjoyType} onClick={() => { setClassificationCode(''); setClassificationName('') }}>전체</button>
            {isClassificationLoading && <p>상세 분류를 불러오는 중입니다.</p>}
            {!isClassificationLoading && classifications.map((item) => <button className={`travel-search-modal__detail-button ${classificationCode === item.lclsSystm2Cd ? 'is-selected' : ''}`} type="button" key={item.lclsSystm2Cd} onClick={() => { setClassificationCode(item.lclsSystm2Cd); setClassificationName(item.lclsSystm2Nm) }}>{item.lclsSystm2Nm}</button>)}
            {classificationError && <p role="alert">{classificationError}</p>}
          </div>
        </div>

        <div className="travel-search-modal__summary">
          <h3>선택한 조건</h3>
          <div><span>지역 <strong>{[regionName, districtName].filter(Boolean).join(' ') || '전체 지역'}</strong></span>{enjoyType && <span>즐길거리 유형 <strong>{enjoyType}</strong></span>}{enjoyType && <span>상세 항목 <strong>{classificationName || '전체'}</strong></span>}</div>
        </div>

        <footer className="travel-search-modal__actions">
          <button type="button" onClick={resetSelections}>선택 초기화</button><p>조건에 맞는 여행정보를 확인해 보세요.</p><button type="button" disabled={!enjoyType} onClick={searchWithSelections}>선택한 조건으로 검색</button>
        </footer>
      </section>
    </div>
  )
}
