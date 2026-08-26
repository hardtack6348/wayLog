import { useEffect, useState } from 'react'
import fallbackImage from '../../assets/figma/destination-jeju.png'
import PlacePinIcon from '../icons/PlacePinIcon'
import './HomeSections.css'

/**
 * 메인 화면의 추천 여행지 영역입니다.
 *
 * 백엔드의 GET /api/home을 호출하고,
 * recommendedDestinations를 카드로 표시합니다.
 */

export default function RecommendedDestinationSection() {

  // 실제 TourAPI에서 조회한 추천 여행지입니다.
  const [destinations, setDestinations] = useState([])

  // API 요청 진행 상태입니다.
  const [isLoading, setIsLoading] = useState(true)

  // API 요청 실패 시 표시할 메시지입니다.
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    /**
     * 백엔드에서 메인 화면 데이터를 조회합니다.
     */
    async function fetchHomeData() {
      try {
        setIsLoading(true)
        setErrorMessage('')
       
        /*
         * Vite Proxy가 /api 요청을 localhost:8080으로 전달하므로
         * 백엔드 전체 주소를 작성하지 않고 상대 경로를 사용합니다.
         */
        const response = await fetch('/api/home')

        /*
         * fetch는 HTTP 400, 500 응답을 자동으로 예외 처리하지 않으므로
         * response.ok를 직접 검사합니다.
         */
        if (!response.ok) {
          throw new Error(`추천 여행지 조회 실패: HTTP ${response.status}`)
        }

        const data = await response.json()

        /*
         * recommendedDestinations가 없더라도 렌더링 오류가
         * 발생하지 않도록 빈 배열을 기본값으로 사용합니다.
         */
        setDestinations(data.recommendedDestinations ?? [])
      } catch (error) {
        console.error('추천 여행지 조회 중 오류가 발생했습니다.', error)
        setErrorMessage('추천 여행지를 불러오지 못했습니다.',)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHomeData()
  }, [])
  // 위치 아이콘, 주소, 설명을 포함한 3개의 대표 여행지 카드를 렌더링합니다.
  return <section id="destinations" className="home-section">
    <div className="section-heading">
      <div>
        <h2>추천 여행지</h2>
        <p>국내의 다양한 관광지와 문화 시설을 만나보세요.</p>
      </div>
      
      <a href="#destinations">여행지 더보기 <span>→</span></a>
    </div>

    {isLoading && (
      <p className="home-section__status">추천 여행지를 불러오는 중입니다.</p>
    )}

    {!isLoading && errorMessage && (
      <p className="home-section__status home-section__status--error">{errorMessage}</p>
    )}

    {!isLoading && !errorMessage && destinations.length === 0 && (
      <p className="home-section__status">현재 표시할 추천 여행지가 없습니다.</p>
    )}

    {!isLoading && !errorMessage && destinations.length > 0 && (
    <div className="destination-grid">
      {destinations.map((item) => (
        <article className="destination-card" key={item.contentId}>
          <img src={item.image || item.thumbnail || fallbackImage} alt={item.title} />
          <div className="destination-card__body">
            <h3>{item.title}</h3>
            <p className="card-location"><PlacePinIcon />{item.address || '주소 정보 없음'}</p>
          </div>
        </article>
      ))}
      </div>
    )}
  </section>
}
