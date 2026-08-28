import { getAccessToken } from './authSession'

/**
 * 서버에 로그아웃을 요청합니다.
 *
 * refresh token은 HttpOnly 쿠키에 있으므로 credentials 옵션으로 쿠키를
 * 함께 전송합니다. access token을 사용하는 백엔드 구성도 고려하여
 * 저장된 토큰이 있으면 Authorization 헤더도 같이 전달합니다.
 */
export async function logout() {
  const accessToken = getAccessToken()
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  })

  if (!response.ok) {
    throw new Error(`로그아웃 요청 실패: HTTP ${response.status}`)
  }
}
