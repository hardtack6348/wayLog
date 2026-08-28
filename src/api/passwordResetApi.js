async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error || `요청 실패: HTTP ${response.status}`)
    error.status = response.status
    throw error
  }
}

/** 입력한 이메일로 비밀번호 재설정 인증번호를 발송합니다. */
export function requestPasswordResetCode(email) {
  return request('/api/v1/auth/password-reset-requests', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/** 서버 세션에 저장된 인증번호와 사용자가 입력한 번호를 비교합니다. */
export function confirmPasswordResetCode(email, authCode) {
  return request('/api/v1/auth/email-verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, authCode }),
  })
}

/** 인증이 끝난 계정의 비밀번호를 변경합니다. */
export function changePassword(email, password) {
  return request('/api/v1/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ email, password }),
  })
}
