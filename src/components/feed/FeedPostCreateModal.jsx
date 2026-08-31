import { useEffect, useRef, useState } from 'react'
import './FeedPostCreateModal.css'

export default function FeedPostCreateModal({ author, onClose, onSubmit }) {
  const fileInputRef = useRef(null)
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const closeWithEscape = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeWithEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', closeWithEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const selectImage = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일만 선택할 수 있습니다.')
      return
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrorMessage('')
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').replace(/\s+/g, '')
    if (!tag || tags.includes(tag)) {
      setTagInput('')
      return
    }
    if (tags.length >= 5) {
      setErrorMessage('해시태그는 최대 5개까지 추가할 수 있습니다.')
      return
    }
    setTags(current => [...current, tag])
    setTagInput('')
    setErrorMessage('')
  }

  const submitForm = async event => {
    event.preventDefault()
    if (!content.trim()) {
      setErrorMessage('여행 이야기를 입력해 주세요.')
      return
    }
    if (imageFile) {
      setErrorMessage('사진 업로드 기능은 준비 중입니다. 사진을 삭제한 뒤 먼저 텍스트 기록을 등록해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await onSubmit({
        content: content.trim(),
        location: location.trim() || '장소 미등록',
        tags,
      })
    } catch (error) {
      setErrorMessage(error.message || '여행 기록을 등록하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="feed-create-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <form className="feed-create-modal" onSubmit={submitForm}>
        <header className="feed-create-modal__header">
          <div><span>NEW TRAVEL LOG</span><h2>새 여행 기록</h2><p>필요한 정보만 간단히 입력하고, 원할 때 여행코스로 확장하세요.</p></div>
          <button type="button" aria-label="작성 취소" onClick={onClose}>×</button>
        </header>

        <div className="feed-create-modal__body">
          <section className="feed-create-step">
            <header><b>1</b><div><h3>어떤 여행이었나요?</h3><p>사진과 이야기를 먼저 남겨 주세요.</p></div><em>필수</em></header>
            <label className="feed-create-content">
              <span className="feed-create-avatar" style={{ background: author.color }}>{author.initial}</span>
              <textarea value={content} onChange={event => setContent(event.target.value)} maxLength="1000" rows="5" placeholder="기억하고 싶은 풍경, 함께한 사람, 여행 중 느낀 점을 자유롭게 적어보세요." autoFocus />
              <small>{content.length}/1000</small>
            </label>

            <input ref={fileInputRef} className="feed-create-file" type="file" accept="image/*" onChange={selectImage} />
            {imagePreview ? (
              <div className="feed-create-image"><img src={imagePreview} alt="선택한 여행 사진 미리보기" /><button type="button" onClick={removeImage}>사진 삭제</button></div>
            ) : (
              <button className="feed-create-image-button" type="button" onClick={() => fileInputRef.current?.click()}><span>＋</span><strong>여행 사진 추가</strong><small>대표 사진 한 장을 선택해 주세요.</small></button>
            )}
          </section>

          <section className="feed-create-step">
            <header><b>2</b><div><h3>어디에서 남긴 기록인가요?</h3><p>게시물에 표시할 대표 위치와 태그를 입력하세요.</p></div><em>선택</em></header>
            <label className="feed-create-field"><span>대표 위치</span><input value={location} onChange={event => setLocation(event.target.value)} placeholder="예: 서울특별시 종로구" /></label>
            <div className="feed-create-tag-field">
              <label><span>해시태그</span><div><input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTag() } }} placeholder="태그 입력 후 Enter" /><button type="button" onClick={addTag}>추가</button></div></label>
              {tags.length > 0 && <div className="feed-create-tags">{tags.map(tag => <button type="button" onClick={() => setTags(current => current.filter(item => item !== tag))} key={tag}>#{tag} ×</button>)}</div>}
            </div>
          </section>

          <section className="feed-create-step feed-create-course">
            <label className="feed-create-course__toggle">
              <div><strong>여행코스 공유는 준비 중입니다</strong><span>게시글 등록 기능을 먼저 제공하며, 장소 순서 연결은 추후 지원합니다.</span></div>
              <input type="checkbox" checked={false} disabled />
              <i aria-hidden="true" />
            </label>
          </section>

          {errorMessage && <p className="feed-create-error" role="alert">{errorMessage}</p>}
        </div>

        <footer className="feed-create-modal__footer"><p><strong>일반 게시물</strong>로 등록됩니다.</p><div><button type="button" disabled={isSubmitting} onClick={onClose}>취소</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? '등록 중...' : '게시하기'}</button></div></footer>
      </form>
    </div>
  )
}
