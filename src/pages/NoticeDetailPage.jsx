import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import './NoticePages.css'

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

/** 공지사항 한 건의 제목, 작성일, 본문을 표시합니다. */
export default function NoticeDetailPage() {
  const noticeId = window.location.pathname.split('/').filter(Boolean).at(-1)
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadNotice() {
      try {
        const response = await fetch(`/api/v1/notices/${noticeId}`)

        if (!response.ok) {
          throw new Error(`공지사항 조회 실패: HTTP ${response.status}`)
        }

        const data = await response.json()

        if (isActive) {
          setNotice(data)
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

    loadNotice()

    return () => {
      isActive = false
    }
  }, [noticeId])

  return (
    <div className="notice-page">
      <Header forceLight />

      <main className="notice-page__main">
        <a className="notice-page__back" href="/notices">
          ← 공지사항 목록
        </a>

        {isLoading && (
          <p className="notice-page__status">공지사항을 불러오는 중입니다.</p>
        )}

        {!isLoading && errorMessage && (
          <div className="notice-page__status notice-page__status--error">
            <p>{errorMessage}</p>
            <a href="/notices">목록으로 돌아가기</a>
          </div>
        )}

        {!isLoading && !errorMessage && notice && (
          <article className="notice-detail">
            <header>
              <span>공지</span>
              <h1>{notice.title}</h1>
              <time dateTime={notice.createdAt}>
                {formatNoticeDate(notice.createdAt)}
              </time>
            </header>

            {/* 줄바꿈을 보존해 관리자 작성 본문이 읽기 좋게 표시됩니다. */}
            <div className="notice-detail__content">
              {notice.content || '등록된 공지 내용이 없습니다.'}
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  )
}
