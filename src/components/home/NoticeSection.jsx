import './HomeSections.css'
import { useState, useEffect } from 'react'

/**
 * LocalDateTime 형식의 공지 작성일을 YYYY.MM.DD로 표시합니다.
 */
function formatNoticeDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0,10).replaceAll('-', '.')
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replaceAll('. ', '.').replace(/\.$/, '')
}

/**
 * 홈 화면 최근 공지사항 영역입니다.
 *
 * GET /api/v1/notices?page=0&size=5 응답의 content를 사용합니다.
 */

export default function NoticeSection() {
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function fetchNotices() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const response = await fetch('/api/v1/notices?page=0&size=5')

        if (!response.ok) {
          throw new Error(`공지 조회 실패: HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!isActive) {
        return
    }

    setNotices(Array.isArray(data.content) ? data.content : [])
  } catch (error) {
    if (isActive) {
      console.error('공지사항 조회 중 오류가 발생했습니다.' + error)
      setErrorMessage('공지사항을 불러오지 못했습니다.')
    }
  } finally {
    if (isActive) {
      setIsLoading(false)
    }
  }
  }
  fetchNotices()

  return () => {
    isActive = false
  }
}, [])
  
  // 공지 유형은 CSS modifier 클래스에 사용되어 배지 색상을 구분합니다.
  return (
    <section className="home-section notice-section">
      <div className="section-heading">
        <div>
          <h2>공지사항</h2>
        </div>
        {/* 공지 목록 전용 페이지 구현 전까지 앵커 링크를 유지합니다. */}
        <a href="/notices">전체 보기 <span>→</span></a>
      </div>



      {isLoading && <p className="home-section__status">공지사항을 불러오는 중입니다...</p>}

      {!isLoading && errorMessage && (
        <p className="home-section__status home-section__status--error">{errorMessage}</p>
      )}

      {!isLoading && !errorMessage && notices.length === 0 && (
        <p className="home-section__status">공지사항이 없습니다.</p>
      )}

      {!isLoading && !errorMessage && notices.length > 0 && (
      <ul>
          {notices.map((notice) => (
            <li key={notice.id}>
              {/* 현재 백엔드에 공지 유형 필드가 없으므로 공지로 고정 표시합니다. */}
              <span className="notice-badge">공지</span>

              <a href={`/notices/${notice.id}`}>{notice.title}</a>

              <time dateTime={notice.createdAt}>
                {formatNoticeDate(notice.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
