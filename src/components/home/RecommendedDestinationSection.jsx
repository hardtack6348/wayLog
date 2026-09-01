import fallbackImage from '../../assets/figma/destination-jeju.png'
import PlacePinIcon from '../icons/PlacePinIcon'
import './HomeSections.css'

/**
 * 상위 HomePage가 조회한 추천 여행지를 props로 받아 표시합니다.
 */

export default function RecommendedDestinationSection({
  destinations = [],
  isLoading,
  errorMessage,
}) {

  
  // 위치 아이콘, 주소, 설명을 포함한 3개의 대표 여행지 카드를 렌더링합니다.
  return <section id="destinations" className="home-section">
    <div className="section-heading">
      <div>
        <h2>추천 여행지</h2>
        <p>국내의 다양한 관광지와 문화 시설을 만나보세요.</p>
      </div>
      
      <a href="/destinations/attractions">여행지 더보기 <span>→</span></a>
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
          <a href={`/destinations/detail/${item.contentId}?contentTypeId=${item.contentTypeId || 12}`}>
            <img src={item.image || item.thumbnail || fallbackImage} alt={item.title} />
            <div className="destination-card__body">
              <h3>{item.title}</h3>
              <p className="card-location"><PlacePinIcon />{item.address || '주소 정보 없음'}</p>
            </div>
          </a>
        </article>
      ))}
      </div>
    )}
  </section>
}
