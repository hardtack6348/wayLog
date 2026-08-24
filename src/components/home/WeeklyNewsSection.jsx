import busan from '../../assets/figma/news-busan.png'
import jeju from '../../assets/figma/news-jeju.png'
import seoul from '../../assets/figma/news-seoul.png'
import PlacePinIcon from '../icons/PlacePinIcon'
import './HomeSections.css'

// TourAPI 또는 관리자 행사 API가 준비되면 이 정적 배열을 응답 데이터로 교체합니다.
const news = [
  { image: busan, title: '부산 바다축제', date: '2025.05.10(토) ~ 2025.05.18(일)', location: '부산광역시 해운대구 해운대해수욕장' },
  { image: jeju, title: '제주 해녀축제', date: '2025.05.15(목) ~ 2025.05.18(일)', location: '제주특별자치도 제주시 구좌읍' },
  { image: seoul, title: '서울 문화행사', date: '2025.05.20(화) ~ 2025.05.24(토)', location: '서울특별시 종로구 경복궁' },
]

export default function WeeklyNewsSection() {
  // 행사 카드는 제목을 key로 사용하며 날짜와 위치를 함께 노출합니다.
  return <section className="home-section news-section"><div className="section-heading"><div><h2>이번 주 여행 소식</h2><p>현재 진행 중이거나 곧 시작하는 축제와 행사입니다.</p></div><a href="#news">행사 전체 보기 <span>→</span></a></div>
    <div className="news-grid">{news.map(item => <article className="news-card" key={item.title}><img src={item.image} alt="" /><div><span className="news-card__badge">행사</span><h3>{item.title}</h3><p>◷ {item.date}</p><p className="location-with-pin"><PlacePinIcon />{item.location}</p></div></article>)}</div>
  </section>
}
