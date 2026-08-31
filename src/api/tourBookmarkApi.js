import { getAccessToken } from './authSession'

const TOUR_BOOKMARK_API_URL = '/api/v1/tour-bookmarks'

function createHeaders({ json = false } = {}) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('로그인 후 이용할 수 있습니다.')
  }

  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${accessToken}`,
  }
}

async function parseResponse(response) {
  if (response.ok) return response.json()

  let message = '북마크 요청을 처리하지 못했습니다.'
  try {
    const body = await response.json()
    message = body.message || body.error || message
  } catch {
    // JSON 형식이 아닌 오류 응답에서는 기본 메시지를 사용합니다.
  }
  throw new Error(message)
}

/** TourAPI 콘텐츠를 저장하거나, 이미 저장되어 있으면 해제합니다. */
export async function toggleTourBookmark(item) {
  const response = await fetch(`${TOUR_BOOKMARK_API_URL}/toggle`, {
    method: 'POST',
    headers: createHeaders({ json: true }),
    body: JSON.stringify({
      contentId: String(item.contentId),
      contentTypeId: Number(item.contentTypeId),
      title: item.title || '이름 정보 없음',
      imageUrl: item.imageUrl || item.image || item.thumbnail || null,
      address: item.address || null,
      categoryName: item.categoryName || null,
    }),
  })

  return parseResponse(response)
}

/** 내 여행지 또는 여행 즐기기 북마크 목록을 조회합니다. */
export async function fetchTourBookmarks(group, { page = 1, size = 20 } = {}) {
  const query = new URLSearchParams({
    group,
    page: String(page),
    size: String(size),
  })
  const response = await fetch(`${TOUR_BOOKMARK_API_URL}?${query}`, {
    headers: createHeaders(),
  })

  return parseResponse(response)
}

/** 로그인 상태인 경우에만 카드의 기존 저장 여부를 조회합니다. */
export function canUseTourBookmark() {
  return Boolean(getAccessToken())
}
