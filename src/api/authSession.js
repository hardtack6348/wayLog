const MEMBER_KEY = 'waylogMember'
const ACCESS_TOKEN_KEY = 'waylogAccessToken'

/** 로그인 유지 설정에 따라 한 저장소에만 인증 정보를 보관합니다. */
export function saveAuthSession({ member, accessToken, rememberLogin }) {
  clearAuthSession()
  const storage = rememberLogin ? window.localStorage : window.sessionStorage
  storage.setItem(MEMBER_KEY, JSON.stringify(member))
  if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.dispatchEvent(new Event('waylog-auth-changed'))
}

/** 새로고침 뒤에도 헤더가 현재 로그인 회원을 복원하도록 합니다. */
export function getStoredMember() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const value = storage.getItem(MEMBER_KEY)
      if (value) return JSON.parse(value)
    } catch {
      // 손상된 저장값은 로그인 정보로 사용하지 않습니다.
    }
  }
  return null
}

/** 현재 브라우저 저장소에 보관된 access token을 반환합니다. */
export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    ?? window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function clearAuthSession() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    storage.removeItem(MEMBER_KEY)
    storage.removeItem(ACCESS_TOKEN_KEY)
    // 이전 구현에서 사용한 키도 함께 제거합니다.
    storage.removeItem('member')
  }
  window.dispatchEvent(new Event('waylog-auth-changed'))
}
