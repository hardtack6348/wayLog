import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { getStoredMember } from '../api/authSession'
import './NoticePages.css'

const NOTICE_API_URL = '/api/v1/notices'

/** DB role이 admin, ADMIN, ROLE_ADMIN 어느 형식이든 관리자 여부를 판별합니다. */
function isAdmin(member) {
  const normalizedRole = String(member?.role || '')
    .replace(/^ROLE_/i, '')
    .trim()
    .toUpperCase()

  return normalizedRole === 'ADMIN'
}

function formatNoticeDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10).replaceAll('-', '.')
  }

  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replaceAll('. ', '.')
    .replace(/\.$/, '')
}

/** 서비스 공지의 전체 목록을 페이지 단위로 보여줍니다. */
export default function NoticeListPage() {
  const member = getStoredMember()
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const canWriteNotice = isAdmin(member)

  useEffect(() => {
    let isActive = true

    async function loadNotices() {
      try {
        const response = await fetch(`${NOTICE_API_URL}?page=0&size=20`)

        if (!response.ok) {
          throw new Error(`공지사항 조회 실패: HTTP ${response.status}`)
        }

        const data = await response.json()

        if (isActive) {
          setNotices(Array.isArray(data.content) ? data.content : [])
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || '공지사항을 불러오지 못했습니다.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadNotices()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className="notice-page">
      <Header forceLight />

      <main className="notice-page__main">
        <header className="notice-page__heading">
          <div>
            <span>WAYLOG NOTICE</span>
            <h1>공지사항</h1>
            <p>WayLog의 새로운 소식과 서비스 운영 안내를 확인하세요.</p>
          </div>

          {/* 관리자 권한은 화면에서도 구분하되, 실제 권한 검증은 백엔드가 담당합니다. */}
          {canWriteNotice && (
            <a className="notice-page__write" href="/admin/notices/new">
              공지 작성
            </a>
          )}
        </header>

        <section className="notice-list" aria-label="공지사항 목록">
          {isLoading && (
            <p className="notice-page__status">공지사항을 불러오는 중입니다.</p>
          )}

          {!isLoading && errorMessage && (
            <div className="notice-page__status notice-page__status--error">
              <p>{errorMessage}</p>
              <button type="button" onClick={() => window.location.reload()}>
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && notices.length === 0 && (
            <p className="notice-page__status">등록된 공지사항이 없습니다.</p>
          )}

          {!isLoading && !errorMessage && notices.map((notice) => (
            <a
              className="notice-list__item"
              href={`/notices/${notice.id}`}
              key={notice.id}
            >
              <span className="notice-list__badge">공지</span>
              <strong>{notice.title}</strong>
              <time dateTime={notice.createdAt}>
                {formatNoticeDate(notice.createdAt)}
              </time>
              <i aria-hidden="true">›</i>
            </a>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}
