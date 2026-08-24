import jeju from '../../assets/figma/destination-jeju.png'
import jeonju from '../../assets/figma/destination-jeonju.png'
import gangneung from '../../assets/figma/destination-gangneung.png'
import PlacePinIcon from '../icons/PlacePinIcon'
import './HomeSections.css'

// 메인 미리보기용 추천 여행지입니다. 추후 관리자 추천 API 응답으로 대체할 수 있습니다.
const destinations = [
  { image: jeju, title: '제주 비자림', location: '제주특별자치도 제주시', description: '천년의 시간이 만든 비자나무 숲길을 걸으며 자연의 숨결을 느낄 수 있는 힐링 명소입니다.' },
  { image: jeonju, title: '전주 한옥마을', location: '전북특별자치도 전주시', description: '전통 한옥과 골목길, 다양한 문화가 어우러진 한국 대표 전통 마을입니다.' },
  { image: gangneung, title: '강릉 경포해변', location: '강원특별자치도 강릉시', description: '맑은 바다와 넓은 백사장이 펼쳐진 강원도 대표 해변입니다.' },
]

export default function RecommendedDestinationSection() {
  // 위치 아이콘, 주소, 설명을 포함한 3개의 대표 여행지 카드를 렌더링합니다.
  return <section id="destinations" className="home-section">
    <div className="section-heading"><div><h2>추천 여행지</h2><p>국내의 다양한 관광지와 문화 시설을 만나보세요.</p></div><a href="#destinations">여행지 더보기 <span>→</span></a></div>
    <div className="destination-grid">{destinations.map(item => <article className="destination-card" key={item.title}>
      <img src={item.image} alt={item.title} /><div className="destination-card__body"><h3>{item.title}</h3><p className="card-location"><PlacePinIcon />{item.location}</p><p>{item.description}</p></div>
    </article>)}</div>
  </section>
}
