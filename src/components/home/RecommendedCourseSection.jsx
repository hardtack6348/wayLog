import fallbackImage from '../../assets/figma/course-jeju.png'
import './HomeSections.css'

/**
 * 상위 HomePage가 조회한 추천 여행코스를 props로 받아 표시합니다.
 */

export default function RecommendedCourseSection({
  courses = [],
  isLoading,
  errorMessage,
}) {
  return (
  <section id="courses" className="home-section course-section">
    {/* 추천 여행코스 영역의 제목과 안내 문구입니다. */}
    <div className="section-heading">
      <div>
        <h2>추천 여행 코스</h2>
        <p>여행의 시작부터 끝까지, 알찬 코스를 한눈에 확인해 보세요.</p>
      </div>
      {/*
         * 전체 여행코스 페이지로 이동하는 링크입니다.
         * href에 실제 프론트 라우팅 경로를 사용합니다.
      */}
      <span className="section-heading__disabled-link" aria-label="여행코스 페이지 준비 중">페이지 준비 중</span>
    </div>

    {/*
       * API 요청이 진행 중인 경우입니다.
       *
       * isLoading이 true일 때만 로딩 메시지를 표시합니다.
    */}
    {isLoading && (<p className="home-section__status">추천 여행코스를 불러오는 중입니다.</p>)}

    {/*
       * API 요청이 종료됐고 오류 메시지가 존재하는 경우입니다.
       *
       * 로딩 메시지와 오류 메시지가 동시에 표시되지 않도록
       * !isLoading 조건을 함께 검사합니다.
    */}
    {!isLoading && errorMessage && (
      <p className="home-section__status home-section__status--error">
          {errorMessage}
        </p>
    )}

    {/*
       * API 요청은 성공했지만 추천 코스가 0건인 경우입니다.
       *
       * 다음 조건을 모두 만족할 때 표시됩니다.
       * 1. 로딩이 종료됨
       * 2. 오류가 없음
       * 3. courses 배열이 비어 있음
    */}
    {!isLoading && !errorMessage && courses.length === 0 && (
      <p className="home-section__status">
            현재 표시할 추천 여행코스가 없습니다.
          </p>
    )}

    {/*
       * 추천 여행코스 데이터가 정상적으로 존재하는 경우입니다.
       *
       * courses 배열을 map으로 순회하면서
       * 각 여행코스를 카드 하나로 변환합니다.
     */}
     {!isLoading &&
        !errorMessage &&
        courses.length > 0 && (
          <div className="course-grid">
            {courses.map((course) => {
              return (
                <article
                  className="course-card"

                  /**
                   * React가 각 카드를 구분하기 위한 고유 key입니다.
                   *
                   * TourAPI의 contentId는 각 콘텐츠를 식별하는 값이므로
                   * 배열 index보다 key로 사용하기 적합합니다.
                   */
                  key={course.contentId}
                >
                  {/*
                   * TourAPI가 대표 이미지를 제공하면 course.image를 사용합니다.
                   *
                   * 대표 이미지가 null 또는 빈 문자열이면
                   * 로컬 fallbackImage를 대신 표시합니다.
                   */}
                  <img
                    className="course-card__image"
                    src={course.image || fallbackImage}
                    alt={course.title || '추천 여행코스'}
                  />

                  <div className="course-card__body">
                    {/* 지역과 총 소요시간을 태그 형태로 표시합니다. */}
                    <div className="course-tags">
                      <span>
                        {/*
                         * 지역정보가 없으면 전국으로 표시합니다.
                         */}
                        {course.region || '전국'}
                      </span>

                      <span>
                        {/*
                         * detailIntro2의 taketime 값입니다.
                         *
                         * TourAPI에 소요시간이 없으면
                         * 기본 안내 문구를 표시합니다.
                         */}
                        {course.duration || '상세 일정 확인'}
                      </span>
                    </div>

                    {/* areaBasedList2에서 받은 여행코스 제목입니다. */}
                    <h3 title={course.title || '여행코스 제목 없음'}>
                      {course.title || '여행코스 제목 없음'}
                    </h3>

                    <p>
                      {/*
                       * detailIntro2의 theme 또는 schedule을 바탕으로
                       * 백엔드에서 생성한 설명입니다.
                       *
                       * 설명이 없다면 기본 문구를 표시합니다.
                       */}
                      {course.description ||
                        '국내 주요 관광지를 둘러보는 여행코스입니다.'}
                    </p>

                  </div>
                </article>
              )
            })}
          </div>
        )}
    </section>
  )
}
