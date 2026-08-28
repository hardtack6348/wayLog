/**
 * 동일한 GET 요청 Promise를 잠시 공유합니다.
 * React StrictMode의 effect 재실행과 같은 화면 내부의 중복 요청이
 * 백엔드와 외부 TourAPI 호출량을 불필요하게 늘리지 않도록 합니다.
 */
const requestCache = new Map()
// 관광정보는 짧은 시간에 자주 바뀌지 않으므로 동일 URL을 30분간 재사용합니다.
// 새로고침 전 동일 화면 이동과 React StrictMode 중복 요청을 줄입니다.
const DEFAULT_TTL = 30 * 60 * 1000

export function fetchTourJson(url, ttl = DEFAULT_TTL) {
  const now = Date.now()
  const cached = requestCache.get(url)

  if (cached && cached.expiresAt > now) {
    return cached.promise
  }

  const promise = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        const error = new Error(`API 요청 실패: HTTP ${response.status}`)
        error.status = response.status
        throw error
      }

      return response.json()
    })
    .catch((error) => {
      // 실패 응답은 캐시하지 않아 호출 한도가 복구된 뒤 다시 요청할 수 있게 합니다.
      requestCache.delete(url)
      throw error
    })

  requestCache.set(url, {
    promise,
    expiresAt: now + ttl,
  })

  return promise
}
