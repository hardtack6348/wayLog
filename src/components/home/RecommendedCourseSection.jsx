import daejeon from '../../assets/figma/course-daejeon.png'
import busan from '../../assets/figma/course-busan.png'
import jeju from '../../assets/figma/course-jeju.png'
import route from '../../assets/figma/course-route.svg'
import './HomeSections.css'

// 각 코스의 stops 배열은 카드 하단의 순서형 이동 경로와 일대일로 대응합니다.
const courses = [
  { image: daejeon, title: '대전 인기 빵집 코스', region: '대전', duration: '당일치기', description: '대전의 상징 성심당부터 구움 과자 맛집까지 즐기는 빵집 투어', stops: ['성심당 본점', '정동문화사', '몽심', '하레하레'] },
  { image: busan, title: '부산 바다 & 야경 코스', region: '부산', duration: '1박 2일', description: '낮에는 푸른 바다, 밤에는 화려한 야경을 만나는 부산 여행', stops: ['해운대 해수욕장', '동백섬', '민락더마켓', '광안리 해수욕장'] },
  { image: jeju, title: '제주 숲과 오름 코스', region: '제주', duration: '1박 2일', description: '제주의 숲과 오름을 천천히 걸으며 자연을 만나는 힐링 여행', stops: ['비자림', '아부오름', '사려니숲길', '새별오름'] },
]

export default function RecommendedCourseSection() {
  // 코스별 지역·기간·경유지를 동일한 카드 구조로 반복 출력합니다.
  return <section id="courses" className="home-section course-section">
    <div className="section-heading"><div><h2>추천 여행 코스</h2><p>여행의 시작부터 끝까지, 알찬 코스를 한눈에 확인해 보세요.</p></div><a href="#courses">코스 더보기 <span>→</span></a></div>
    <div className="course-grid">{courses.map(course => <article className="course-card" key={course.title}>
      <img className="course-card__image" src={course.image} alt="" /><div className="course-card__body"><div className="course-tags"><span>{course.region}</span><span>{course.duration}</span></div><h3>{course.title}</h3><p>{course.description}</p><div className="course-route"><img src={route} alt="" />{course.stops.map(stop => <small key={stop}>{stop}</small>)}</div></div>
    </article>)}</div>
  </section>
}
