import { useState } from 'react'
import festival from '../../assets/figma/enjoy-festival.png'
import leports from '../../assets/figma/enjoy-leports.png'
import food from '../../assets/figma/enjoy-food.png'
import shopping from '../../assets/figma/enjoy-shopping.png'
import stay from '../../assets/figma/enjoy-stay.png'
import PlacePinIcon from '../icons/PlacePinIcon'
import './HomeSections.css'

// 현재는 디자인 확인용 데이터이며, 이후 TourAPI 콘텐츠 유형별 결과로 교체합니다.
const enjoyItems = [
  { category: '축제·행사', image: festival, title: '부산 불꽃축제', location: '부산광역시' },
  { category: '레포츠', image: leports, title: '설악산 국립공원 트레킹', location: '강원특별자치도' },
  { category: '음식점', image: food, title: '통영 충무김밥', location: '경상남도 통영시' },
  { category: '쇼핑', image: shopping, title: '명동 쇼핑거리', location: '서울특별시' },
  { category: '숙박', image: stay, title: '제주 감성 숙소', location: '제주특별자치도' },
]

const filters = ['전체', '축제·행사', '레포츠', '음식점', '쇼핑', '숙박']

export default function ThemeDestinationSection() {
  // activeFilter는 선택된 카테고리를 보관하고 화면에 표시할 카드 목록을 계산합니다.
  const [activeFilter, setActiveFilter] = useState('전체')
  const filteredItems = activeFilter === '전체'
    ? enjoyItems
    : enjoyItems.filter(item => item.category === activeFilter)

  return <section id="enjoy" className="home-section enjoy-section">
    <div className="section-heading"><div><h2>여행을 더 즐겁게</h2><p>축제부터 레포츠, 음식점, 쇼핑, 숙박까지 여행의 즐거움을 더해보세요.</p></div></div>

    <div className="enjoy-filters" role="group" aria-label="여행 즐길거리 필터">
      {/* aria-pressed를 함께 갱신해 키보드·스크린리더에서도 선택 상태를 알 수 있게 합니다. */}
      {filters.map(filter => (
        <button
          className={activeFilter === filter ? 'is-active' : ''}
          type="button"
          aria-pressed={activeFilter === filter}
          onClick={() => setActiveFilter(filter)}
          key={filter}
        >
          {filter}
        </button>
      ))}
    </div>

    <div className={`enjoy-grid${activeFilter !== '전체' ? ' enjoy-grid--filtered' : ''}`}>
      {filteredItems.map((item) => (
      <article className="enjoy-card" key={item.title}>
        <a href={`/destinations/detail/${item.title}`}>
          <img src={item.image} alt={item.title} />
          <div>
            <h3>{item.title}</h3>
            <p className="location-with-pin">
              <PlacePinIcon />
              {item.location}
            </p>
          </div>
        </a>
      </article>
      ))}
    </div>
  </section>
}
