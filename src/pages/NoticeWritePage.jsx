import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { getAccessToken, getStoredMember } from '../api/authSession'
import './NoticePages.css'

function isAdmin(member) {
  const normalizedRole = String(member?.role || '')
    .replace(/^ROLE_/i, '')
    .trim()
    .toUpperCase()

  return normalizedRole === 'ADMIN'
}

/** 관리자만 새 공지사항을 등록할 수 있는 작성 화면입니다. */
export default function NoticeWritePage() {
  const member = getStoredMember()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitNotice = async (event) => {
    event.preventDefault()

    if (!title.trim() || !content.trim()) {
      setErrorMessage('제목과 내용을 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/v1/admin/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          // 현재 백엔드 요청 DTO가 author를 받으므로 로그인 회원 닉네임을 전달합니다.
          author: member?.nickname || 'WayLog 관리자',
        }),
      })

      if (!response.ok) {
        let message = `공지 등록 실패: HTTP ${response.status}`

        try {
          const errorBody = await response.json()
          message = errorBody.message || errorBody.error || message
        } catch {
          // JSON 오류 응답이 아니면 기본 메시지를 사용합니다.
        }

        throw new Error(message)
      }

      const createdNotice = await response.json()
      window.location.assign(`/notices/${createdNotice.id}`)
    } catch (error) {
      setErrorMessage(error.message || '공지사항을 등록하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="notice-page">
      <Header forceLight />

      <main className="notice-page__main">
        <a className="notice-page__back" href="/notices">
          ← 공지사항 목록
        </a>

        {!isAdmin(member) ? (
          <section className="notice-page__status notice-page__status--error">
            <p>공지사항 작성 권한이 없습니다.</p>
            <a href="/notices">목록으로 돌아가기</a>
          </section>
        ) : (
          <form className="notice-write" onSubmit={submitNotice}>
            <header>
              <span>ADMIN NOTICE</span>
              <h1>공지사항 작성</h1>
              <p>등록된 공지는 모든 사용자에게 공지사항 목록으로 표시됩니다.</p>
            </header>

            <label>
              <span>제목</span>
              <input
                value={title}
                maxLength="150"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="공지사항 제목을 입력하세요."
              />
            </label>

            <label>
              <span>내용</span>
              <textarea
                value={content}
                maxLength="5000"
                onChange={(event) => setContent(event.target.value)}
                placeholder="공지사항 내용을 입력하세요."
                rows="14"
              />
            </label>

            {errorMessage && <p className="notice-write__error">{errorMessage}</p>}

            <footer>
              <a href="/notices">취소</a>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '등록 중...' : '공지 등록'}
              </button>
            </footer>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
