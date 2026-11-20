/**
 * 백엔드 API 공통 클라이언트
 *
 * - Access Token은 메모리(이 모듈의 변수)에만 저장합니다. localStorage는 XSS로 읽힐 수 있어 쓰지 않습니다.
 * - 모든 요청에 Authorization: Bearer <Access Token>을 붙이고, Refresh Token 쿠키를 위해 credentials: 'include'를 붙입니다.
 * - 401(토큰 없음·잘못됨·만료)을 받으면 /api/v1/auth/refresh로 새 Access Token을 받아 원래 요청을 한 번 다시 보냅니다.
 * - 403(권한 없음)은 재발급해도 소용없으므로 그대로 오류로 돌려줍니다.
 *
 * 페이지를 새로고침하면 메모리의 Access Token은 사라지지만, 다음 요청에서 401을 받으면
 * Refresh Token 쿠키로 자동 재발급되므로 다시 로그인할 필요는 없습니다.
 *
 * 사용 예
 *   import { api } from '../api/client'
 *   const posts = await api.get('/api/v1/feed/posts')
 *   await api.post('/api/v1/feed/posts/1/likes')
 *   await api.post('/api/v1/feed/posts', formData)   // FormData는 Content-Type을 브라우저가 정합니다.
 */

const MEMBER_KEY = 'waylogMember'
const AUTH_PATH_PREFIX = '/api/v1/auth/'

let accessToken = null
let refreshPromise = null
let handleAuthExpired = () => {
  window.location.href = '/login'
}

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const setAccessToken = token => {
  accessToken = token || null
}

export const getMember = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(MEMBER_KEY))
  } catch {
    return null
  }
}

export const saveMember = member => {
  try {
    window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(member))
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 화면 표시만 생략합니다.
  }
}

export const clearAuth = () => {
  accessToken = null
  try {
    window.sessionStorage.removeItem(MEMBER_KEY)
  } catch {
    // 위와 같은 이유로 무시합니다.
  }
}

/** 재발급까지 실패했을 때(로그인이 필요할 때) 할 일을 바꿉니다. 기본값은 /login으로 이동입니다. */
export const setAuthExpiredHandler = handler => {
  handleAuthExpired = handler
}

/**
 * Refresh Token 쿠키로 새 Access Token을 받습니다.
 * 여러 요청이 동시에 401을 받아도 재발급 요청은 한 번만 보내고, 나머지는 그 결과를 기다립니다.
 */
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${AUTH_PATH_PREFIX}refresh`, { method: 'POST', credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null
        const data = await response.json().catch(() => ({}))
        setAccessToken(data.accessToken)
        return data.accessToken ?? null
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

const buildRequest = (options, body) => {
  const headers = new Headers(options.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let finalBody = body
  const isRawBody = body instanceof FormData || body instanceof Blob || typeof body === 'string'
  if (body !== undefined && body !== null && !isRawBody) {
    headers.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(body)
  }

  return { ...options, headers, body: finalBody, credentials: 'include' }
}

/**
 * fetch와 같은 Response를 돌려줍니다. 401이면 토큰을 재발급받아 한 번 다시 보냅니다.
 * 로그인·재발급 같은 /api/v1/auth/ 요청은 401이어도 재발급을 시도하지 않습니다.
 */
export async function apiFetch(path, { body, ...options } = {}) {
  let response = await fetch(path, buildRequest(options, body))

  if (response.status === 401 && !path.startsWith(AUTH_PATH_PREFIX)) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      response = await fetch(path, buildRequest(options, body))
    }
    if (response.status === 401) {
      clearAuth()
      handleAuthExpired()
    }
  }

  return response
}

/** 응답 JSON을 돌려주고, 실패하면 서버의 message를 담은 ApiError를 던집니다. */
async function request(path, options) {
  const response = await apiFetch(path, options)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.message || '요청을 처리하지 못했습니다.', data)
  }
  return data
}

export const api = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
}

/** 서버에서 Refresh Token 쿠키를 지우고, 화면의 로그인 상태도 비웁니다. */
export async function logout() {
  try {
    await fetch(`${AUTH_PATH_PREFIX}logout`, { method: 'POST', credentials: 'include' })
  } finally {
    clearAuth()
  }
}
