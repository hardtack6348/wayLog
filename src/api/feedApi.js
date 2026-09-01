import { getAccessToken } from './authSession'

const FEED_API_URL = '/api/v1/feed/posts'

function createHeaders({ authenticated = false, json = false } = {}) {
  const headers = {}
  const accessToken = getAccessToken()

  if (json) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (authenticated && !accessToken) {
    throw new Error('로그인 후 이용할 수 있습니다.')
  }

  return headers
}

async function parseResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null
    return response.json()
  }

  let message = '여행 피드 요청을 처리하지 못했습니다.'
  try {
    const errorBody = await response.json()
    message = errorBody.message || errorBody.error || message
  } catch {
    // JSON 오류 본문이 아닌 경우 기본 메시지를 사용합니다.
  }

  throw new Error(message)
}

/** 공개 피드를 조회하며, 로그인 상태이면 개인별 좋아요·저장 여부도 함께 받습니다. */
export async function fetchFeedPosts({ page = 1, size = 10 } = {}) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await fetch(`${FEED_API_URL}?${query}`, {
    headers: createHeaders(),
  })
  return parseResponse(response)
}

/** 새 여행 기록을 등록합니다. */
// export async function createFeedPost(payload) {
//   const response = await fetch(FEED_API_URL, {
//     method: 'POST',
//     headers: createHeaders({ authenticated: true, json: true }),
//     body: JSON.stringify(payload),
//   })
//   return parseResponse(response)
// }

/**
 * 게시글 정보와 이미지 파일을 multipart/form-data로 전송합니다.
 */
export async function createFeedPost(payload) {
  const formData = new FormData()

  /*
   * JSON Blob을 사용해야 Spring의 @RequestPart("post")가
   * FeedCreateRequest로 정상 변환할 수 있습니다.
   */
  formData.append(
    'post',
    new Blob(
      [
        JSON.stringify({
          content: payload.content,
          locationName: payload.locationName,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          tourContentId: payload.tourContentId,
          tourContentTypeId: payload.tourContentTypeId,
          visibility: payload.visibility,
          tags: payload.tags,
        }),
      ],
      { type: 'application/json' },
    ),
  )

  payload.images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await fetch(FEED_API_URL, {
    method: 'POST',

    /*
     * FormData 요청에서는 Content-Type을 직접 작성하면 안 됩니다.
     * 브라우저가 multipart boundary를 포함해 자동 설정합니다.
     */
    headers: createHeaders({ authenticated: true }),

    body: formData,
  })

  return parseResponse(response)
}

/** 좋아요 상태를 토글합니다. */
export async function toggleFeedLike(postId) {
  const response = await fetch(`${FEED_API_URL}/${postId}/likes`, {
    method: 'POST',
    headers: createHeaders({ authenticated: true }),
  })
  return parseResponse(response)
}

/** 북마크 상태를 토글합니다. */
export async function toggleFeedBookmark(postId) {
  const response = await fetch(`${FEED_API_URL}/${postId}/bookmarks`, {
    method: 'POST',
    headers: createHeaders({ authenticated: true }),
  })
  return parseResponse(response)
}

/** 로그인 회원의 SNS 프로필과 본인이 작성한 피드를 조회합니다. */
export async function fetchMyFeedProfile({ page = 1, size = 12 } = {}) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await fetch(`/api/v1/feed/profile?${query}`, {
    headers: createHeaders({ authenticated: true }),
  })
  return parseResponse(response)
}

/** SNS에서만 사용하는 @아이디를 수정합니다. */
export async function updateFeedHandle(feedHandle) {
  const response = await fetch('/api/v1/feed/profile', {
    method: 'PATCH',
    headers: createHeaders({ authenticated: true, json: true }),
    body: JSON.stringify({ feedHandle }),
  })
  return parseResponse(response)
}
