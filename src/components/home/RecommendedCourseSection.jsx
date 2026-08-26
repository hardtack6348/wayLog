import { useEffect, useState } from 'react'
import fallbackImage from '../../assets/figma/course-jeju.png'
import route from '../../assets/figma/course-route.svg'
import './HomeSections.css'

/**
 * 메인 페이지의 추천 여행코스 영역입니다.
 *
 * 주요 역할:
 * 1. 컴포넌트가 처음 렌더링될 때 GET /api/home을 호출합니다.
 * 2. 응답의 recommendedCourses 배열을 상태에 저장합니다.
 * 3. API 요청 진행 중에는 로딩 메시지를 표시합니다.
 * 4. 요청 실패 시 오류 메시지를 표시합니다.
 * 5. 정상적으로 받은 여행코스를 카드 형태로 렌더링합니다.
 */


export default function RecommendedCourseSection() {
  /**
   * 백엔드에서 받은 추천 여행코스 목록입니다.
   *
   * 초기값을 빈 배열로 지정하면 API 응답을 받기 전에도
   * courses.length 또는 courses.map()을 안전하게 사용할 수 있습니다.
   */
  const [ courses, setCourses ] = useState([])

  /**
   * API 요청 진행 상태입니다.
   *
   * true:
   * 추천 여행코스를 불러오는 중입니다.
   *
   * false:
   * API 요청이 성공 또는 실패로 종료된 상태입니다.
   */
  const [ isLoading, setIsLoading ] = useState(true)

  /**
   * API 요청이 실패했을 때 사용자에게 표시할 메시지입니다.
   *
   * 빈 문자열이면 오류가 없는 상태로 간주합니다.
   */
  const [ errorMessage, setErrorMessage ] = useState('')

  /**
   * 컴포넌트가 화면에 처음 나타날 때 한 번 실행됩니다.
   *
   * 의존성 배열이 빈 배열([])이므로 렌더링될 때마다 실행되지 않고
   * 컴포넌트 최초 마운트 시점에만 API를 호출합니다.
   */

  useEffect(() => {
    /**
     * 백엔드에서 메인 페이지 데이터를 조회합니다.
     *
     * /api/home 응답에는 다음 데이터가 함께 포함됩니다.
     *
     * - recommendedDestinations
     * - recommendedCourses
     * - enjoyItems
     * - festivals
     *
     * 이 컴포넌트에서는 recommendedCourses만 사용합니다.
     */
    async function fetchCourses() {
      try {
        // 새로운 요청을 시작하므로 로딩 상태를 활성화합니다.
        setIsLoading(true)

        // 이전 요청에서 발생한 오류 메시지가 있다면 초기화합니다.
        setErrorMessage('')

        /**
         * Vite 개발 서버의 Proxy 설정을 이용해 백엔드 API를 호출합니다.
         *
         * 프론트 요청:
         * GET /api/home
         *
         * Vite Proxy가 전달하는 실제 백엔드 주소:
         * http://localhost:8080/api/home
         *
         * 상대 경로를 사용하면 개발 환경에서 별도의 CORS 설정 없이
         * 백엔드에 요청할 수 있습니다.
         */
        const response = await fetch('/api/home')

        /**
         * fetch는 HTTP 400, 404, 500, 502 등의 응답을 받아도
         * 자동으로 catch 블록으로 이동하지 않습니다.
         *
         * 따라서 response.ok를 직접 검사해야 합니다.
         *
         * response.ok는 HTTP 상태가 200~299일 때 true입니다.
         */
        if (!response.ok) {
          throw new Error(`추천 코스 조회 실패: HTTP ${response.status}`,)
        }

        /**
         * 백엔드가 반환한 JSON 문자열을 JavaScript 객체로 변환합니다.
         */
        const data = await response.json()

        /**
         * HomeTourResponse의 recommendedCourses 배열을 상태에 저장합니다.
         *
         * 백엔드 응답 예:
         *
         * {
         *   "recommendedCourses": [
         *     {
         *       "contentId": "12345",
         *       "contentTypeId": "25",
         *       "image": "https://...",
         *       "title": "서울 역사 여행코스",
         *       "region": "서울특별시",
         *       "duration": "약 5시간",
         *       "description": "역사 명소를 둘러보는 코스",
         *       "stops": ["경복궁", "광화문", "인사동"]
         *     }
         *   ]
         * }
         *
         * recommendedCourses가 null 또는 undefined라면
         * 빈 배열을 상태에 저장해 렌더링 오류를 방지합니다.
         */
        setCourses(data.recommendedCourses ?? [])
      } catch (error) {
        /**
         * 다음과 같은 문제가 발생하면 이 블록이 실행됩니다.
         *
         * - 백엔드 서버가 실행되지 않음
         * - HTTP 400/500/502 응답
         * - 네트워크 연결 실패
         * - JSON 변환 실패
         */
        console.error('추천 여행코스 조회 중 오류가 발생했습니다.', error,)

        // 사용자 화면에는 내부 오류 대신 이해하기 쉬원 메시지를 표시합니다.
        setErrorMessage('추천 여행코스를 불러오지 못했습니다.',)
      } finally {
        /**
         * 요청 성공 여부와 관계없이 로딩 상태를 종료합니다.
         *
         * finally는 try 또는 catch가 끝난 후 항상 실행됩니다.
         */
        setIsLoading(false)
      }
    }

    // 위에서 선언한 비동기 API 호출 함수를 실행합니다.
    fetchCourses()
  }, [])

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
      <a href="/destinations/courses">코스 더보기 <span>→</span></a>
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
              /**
               * stops가 null 또는 undefined인 상황을 대비합니다.
               *
               * Array.isArray()를 사용하면 stops가 실제 배열일 때만
               * 해당 값을 사용하고, 아니면 빈 배열을 사용합니다.
               */
              const stops = Array.isArray(course.stops)
                ? course.stops
                : []

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
                        {course.duration || '일정 정보 없음'}
                      </span>
                    </div>

                    {/* areaBasedList2에서 받은 여행코스 제목입니다. */}
                    <h3>
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

                    {/*
                     * detailInfo2에서 받은 경유지가 하나 이상 있을 때만
                     * 카드 하단의 경로 영역을 표시합니다.
                     *
                     * 경유지가 없을 때 빈 경로 이미지와 빈 공간이
                     * 표시되지 않도록 조건부 렌더링합니다.
                     */}
                    {stops.length > 0 && (
                      <div className="course-route">
                        {/*
                         * 경유지들을 연결하는 장식용 경로 이미지입니다.
                         *
                         * 의미를 전달하는 콘텐츠 이미지가 아니므로
                         * alt를 빈 문자열로 지정합니다.
                         */}
                        <img src={route} alt="" />

                        {/*
                         * 각 경유지 이름을 코스 순서대로 출력합니다.
                         *
                         * 백엔드에서는 detailInfo2의 subnum을 기준으로
                         * 정렬한 뒤 subname만 stops 배열로 전달합니다.
                         */}
                        {stops.map((stop, index) => (
                          <small
                            /**
                             * 같은 이름의 경유지가 존재할 수 있으므로
                             * contentId와 index를 조합해 key를 생성합니다.
                             */
                            key={`${course.contentId}-${index}`}
                          >
                            {stop}
                          </small>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
    </section>
  )
}