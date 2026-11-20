import { useEffect, useState } from 'react'
import logo from '../assets/figma/logo.png'
import background from '../assets/auth/login-background.png'
import mailIcon from '../assets/auth/mail.svg'
import lockIcon from '../assets/auth/lock.svg'
import eyeIcon from '../assets/auth/eye.svg'
import './ForgotPasswordPage.css'

/**
 * 비밀번호 찾기 페이지 /forgot-password
 * 1) 가입 이메일 확인 → 2) 이메일 인증 → 3) 새 비밀번호 저장 순서로 진행합니다.
 *
 * 백엔드 API
 * - GET  /api/v1/users/check-email?email=...          가입 여부 확인 { available }
 * - POST /api/v1/auth/password-reset-requests         인증번호 발송 { email }
 * - POST /api/v1/auth/email-verification/confirm      인증번호 확인 { email, authCode }
 * - PUT  /api/v1/auth/password                        비밀번호 변경 { email, password }
 *
 * 인증 상태는 서버 세션에 저장되므로 모든 요청에 credentials: 'include'를 붙입니다.
 * 서버는 비밀번호 재설정 용도로 인증을 마친 이메일만 비밀번호를 바꿔 줍니다.
 *
 * 보안을 위해 실제 서비스에서는 가입 여부를 노출하지 않고 동일한 안내를 반환하는 방식도
 * 고려할 수 있습니다. 현재 화면은 기획 요구에 따라 미가입 이메일 오류를 구분합니다.
 */
const CODE_VALID_SECONDS = 180

// JSON 응답 본문을 읽습니다. 본문이 없거나 JSON이 아니면 빈 객체를 반환합니다.
const readJson = response => response.json().catch(() => ({}))

const requestResetCode = targetEmail =>
  fetch('/api/v1/auth/password-reset-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: targetEmail }),
  })

const formatTime = seconds => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const rest = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [pending, setPending] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // 인증번호 유효시간을 1초씩 줄입니다. 인증을 마쳤거나 시간이 끝나면 멈춥니다.
  useEffect(() => {
    if (verified || secondsLeft <= 0) return undefined
    const timer = setTimeout(() => setSecondsLeft(current => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, verified])

  const passwordRules = {
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    length: password.length >= 8 && password.length <= 20,
  }
  const passwordValid = Object.values(passwordRules).every(Boolean)
  const passwordMatches = password.length > 0 && password === passwordConfirm

  const passwordRuleState = valid => {
    if (valid) return 'is-valid'
    if (password.length > 0) return 'is-invalid'
    return ''
  }

  const checkRegisteredEmail = async event => {
    event.preventDefault()
    if (pending) return
    const normalizedEmail = email.trim().toLowerCase()
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

    if (!emailValid) {
      setEmailError('올바른 이메일 주소를 입력해 주세요.')
      return
    }

    setPending(true)
    try {
      // 1) 가입 여부 확인: available=true면 아직 가입하지 않은 이메일입니다.
      const checkResponse = await fetch(
        `/api/v1/users/check-email?email=${encodeURIComponent(normalizedEmail)}`,
        { credentials: 'include' }
      )
      if (!checkResponse.ok) {
        throw new Error('이메일 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
      const checkData = await readJson(checkResponse)
      if (checkData.available) {
        setEmailError('회원가입이 되지 않은 계정입니다.')
        return
      }

      // 2) 비밀번호 재설정용 인증번호 발송
      const sendResponse = await requestResetCode(normalizedEmail)
      if (!sendResponse.ok) {
        throw new Error('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }

      setEmail(normalizedEmail)
      setEmailError('')
      setVerificationCode('')
      setVerified(false)
      setSecondsLeft(CODE_VALID_SECONDS)
      setStep(2)
    } catch (error) {
      setEmailError(error.message)
    } finally {
      setPending(false)
    }
  }

  const resendCode = async () => {
    if (pending) return
    setPending(true)
    try {
      const response = await requestResetCode(email)
      if (!response.ok) {
        throw new Error('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
      setVerificationCode('')
      setVerified(false)
      setSecondsLeft(CODE_VALID_SECONDS)
      window.alert('인증번호를 다시 발송했습니다.')
    } catch (error) {
      window.alert(error.message)
    } finally {
      setPending(false)
    }
  }

  const verifyCode = async () => {
    if (pending) return
    if (!/^\d{6}$/.test(verificationCode)) {
      window.alert('인증번호 6자리를 입력해 주세요.')
      return
    }
    if (secondsLeft <= 0) {
      window.alert('인증번호가 만료되었습니다. 인증번호를 다시 발송해 주세요.')
      return
    }

    setPending(true)
    try {
      const response = await fetch('/api/v1/auth/email-verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, authCode: Number(verificationCode) }),
      })
      const data = await readJson(response)
      if (!response.ok) {
        // 서버가 틀림(남은 횟수 포함), 만료, 5회 초과 등의 안내를 message로 보냅니다.
        const remaining = data.remainingAttempts !== undefined ? ` (남은 횟수 ${data.remainingAttempts}회)` : ''
        throw new Error((data.message || '인증번호가 올바르지 않거나 만료되었습니다.') + remaining)
      }
      setVerified(true)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setPending(false)
    }
  }

  const moveToPasswordReset = event => {
    event.preventDefault()
    if (!verified) {
      window.alert('이메일 인증을 완료해 주세요.')
      return
    }
    setStep(3)
  }

  const completePasswordReset = async event => {
    event.preventDefault()
    if (pending) return
    if (!passwordValid) {
      window.alert('비밀번호 조건을 모두 충족해 주세요.')
      return
    }
    if (!passwordMatches) {
      window.alert('비밀번호가 일치하지 않습니다.')
      return
    }

    setPending(true)
    try {
      // 비밀번호 확인 값은 화면에서만 비교하고, 서버에는 새 비밀번호 하나만 보냅니다.
      const response = await fetch('/api/v1/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (response.status === 403) {
        // 인증 후 10분이 지났거나 인증 정보가 없으면 서버가 403을 반환합니다.
        setVerified(false)
        setVerificationCode('')
        setSecondsLeft(0)
        setStep(2)
        throw new Error('이메일 인증이 만료되었습니다. 인증번호를 다시 발송해 주세요.')
      }
      if (!response.ok) {
        const data = await readJson(response)
        throw new Error(data.message || '비밀번호 변경에 실패했습니다.')
      }
      window.alert('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.')
      window.location.href = '/login'
    } catch (error) {
      window.alert(error.message)
    } finally {
      setPending(false)
    }
  }

  const moveBack = () => {
    // 현재 단계에 따라 한 단계 이전 화면으로 돌아가며 필요한 인증 상태를 초기화합니다.
    if (step === 3) {
      setStep(2)
      return
    }
    setVerified(false)
    setVerificationCode('')
    setSecondsLeft(0)
    setStep(1)
  }

  return (
    <main className="forgot-page">
      <section className="forgot-page__visual" style={{ backgroundImage: `url(${background})` }}>
        <div className="forgot-page__overlay" />
        <a className="forgot-page__brand" href="/"><img src={logo} alt="" /><strong>WayLog</strong></a>
        <div className="forgot-page__visual-content">
          <h2>여행의 기억을 다시 이어가세요</h2>
          <p>본인 인증 후 새로운 비밀번호를 재설정할 수 있어요</p>
          <ol className="forgot-steps" aria-label="비밀번호 찾기 진행 단계">
            {['아이디 확인', '본인 인증', '비밀번호 재설정'].map((label, index) => {
              const number = index + 1
              const complete = step > number
              return <li key={label} className={step === number ? 'is-active' : complete ? 'is-complete' : ''}><span>{complete ? '✓' : number}</span><strong>{label}</strong></li>
            })}
          </ol>
        </div>
      </section>

      <section className="forgot-page__panel">
        <a className="forgot-page__login-link" href="/login">로그인으로 돌아가기 <span>→</span></a>
        <div className="forgot-page__content">
          <img className="forgot-page__logo" src={logo} alt="WayLog" />
          <h1>비밀번호 찾기</h1>
          <p className="forgot-page__description">{step === 3 ? '새로운 비밀번호를 설정해주세요.' : '등록된 이메일 주소로 본인 인증을 진행해주세요.'}</p>

          {step === 1 && (
            <form className="forgot-form" onSubmit={checkRegisteredEmail}>
              <h2>이메일 확인</h2>
              <label htmlFor="forgot-email">이메일</label>
              <div className={`forgot-field ${emailError ? 'is-error' : ''}`}><img src={mailIcon} alt="" /><input id="forgot-email" type="email" value={email} onChange={event => { setEmail(event.target.value); setEmailError('') }} placeholder="이메일 주소를 입력하세요..." autoComplete="email" /></div>
              <small className={emailError ? 'forgot-message--error' : ''}>{emailError || '회원가입 시 등록한 이메일 주소를 입력해주세요.'}</small>
              <button className="forgot-button" type="submit" disabled={pending}>{pending ? '확인 중...' : '다음'}</button>
              <div className="forgot-support"><span>이메일이 기억나지 않으시나요?</span><a href="#support">고객센터 문의</a></div>
              <a className="forgot-back-link" href="/login">로그인 화면으로 돌아가기</a>
            </form>
          )}

          {step > 1 && (
            <div className="forgot-account"><span className="forgot-account__icon" aria-hidden="true" /><span><small>확인된 이메일 계정</small><strong>{email}</strong></span><button type="button" onClick={() => { setStep(1); setVerified(false); setVerificationCode(''); setSecondsLeft(0) }}>변경</button></div>
          )}

          {step === 2 && (
            <form className="forgot-form forgot-form--verification" onSubmit={moveToPasswordReset}>
              <label htmlFor="forgot-code">인증번호</label>
              <div className="forgot-code-row"><div className="forgot-field"><input id="forgot-code" inputMode="numeric" maxLength="6" value={verificationCode} onChange={event => { setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setVerified(false) }} placeholder="인증번호 6자리" />{!verified && <span>{formatTime(secondsLeft)}</span>}</div><button type="button" onClick={verifyCode} disabled={pending || verified}>인증 확인</button></div>
              <div className="forgot-verification-meta"><button type="button" onClick={resendCode} disabled={pending}>인증번호 재발송</button>{verified && <strong>이메일 인증이 완료되었습니다.</strong>}</div>
              <button className="forgot-button" type="submit">다음</button>
              <button className="forgot-back-link" type="button" onClick={moveBack}>이전 단계로 돌아가기</button>
            </form>
          )}

          {step === 3 && (
            <form className="forgot-form forgot-form--password" onSubmit={completePasswordReset}>
              <h2>새 비밀번호 설정</h2>
              <label htmlFor="new-password">새 비밀번호</label>
              <div className="forgot-field"><img src={lockIcon} alt="" /><input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /><button className="forgot-eye" type="button" onClick={() => setShowPassword(value => !value)}><img src={eyeIcon} alt="" /></button></div>
              <div className="forgot-rules">
                {Object.entries({ letter: '영문', number: '숫자', special: '특수문자', length: '8~20자' }).map(([key, label]) => <span key={key} className={passwordRuleState(passwordRules[key])}><i>{password && !passwordRules[key] ? '×' : '✓'}</i>{label}</span>)}
              </div>
              {password && !passwordValid && <small className="forgot-message--error">비밀번호 조건을 모두 충족해 주세요.</small>}

              <label htmlFor="new-password-confirm">새 비밀번호 확인</label>
              <div className="forgot-field"><img src={lockIcon} alt="" /><input id="new-password-confirm" type={showPasswordConfirm ? 'text' : 'password'} value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} autoComplete="new-password" /><button className="forgot-eye" type="button" onClick={() => setShowPasswordConfirm(value => !value)}><img src={eyeIcon} alt="" /></button></div>
              {passwordConfirm && <small className={passwordMatches ? 'forgot-message--success' : 'forgot-message--error'}>{passwordMatches ? '✓ 비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}</small>}
              <button className="forgot-button" type="submit" disabled={pending}>비밀번호 변경 완료</button>
              <button className="forgot-back-link" type="button" onClick={moveBack}>이전 단계로 돌아가기</button>
            </form>
          )}
        </div>
        <footer className="forgot-page__footer"><a href="#terms">이용약관</a><a href="#privacy">개인정보처리방침</a><a href="#support">고객센터</a><span>ⓒ 2026 WayLog</span></footer>
      </section>
    </main>
  )
}
