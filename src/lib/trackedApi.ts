/**
 * Tracked-creators API client.
 *
 * Creators flow: Discover → Approve → promote_candidate() →
 * TrackedCreator row in the FastAPI Postgres DB. This client reads/mutates
 * that table so the user can SEE the destination of every approval.
 */

const ENV_API_BASE = import.meta.env.VITE_DISCOVER_API_BASE as string | undefined
const API_BASE = (ENV_API_BASE ?? '/api').replace(/\/$/, '')

export const TRACKED_USER_ID = 1

export type TrackedCreator = {
  id: number
  instagram_handle: string
  display_name: string | null
  follower_count: number | null
  avg_views: number | null
  avg_likes: number | null
  avg_comments: number | null
  last_scraped_at: string | null
  is_active: boolean
  created_at: string
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/users/${TRACKED_USER_ID}/creators${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch (e) {
    throw new Error(
      `Network error reaching ${url} — is the FastAPI backend running? (${e instanceof Error ? e.message : String(e)})`
    )
  }
  if (!res.ok) {
    let detailMsg = `${res.status} ${res.statusText} · ${url}`
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (body?.detail) {
        if (typeof body.detail === 'string') detailMsg = `${res.status}: ${body.detail}`
        else if (Array.isArray(body.detail))
          detailMsg = `${res.status}: ${body.detail
            .map((d) =>
              d && typeof d === 'object'
                ? `${(d as { loc?: unknown[] }).loc?.join?.('.') ?? ''}: ${(d as { msg?: string }).msg ?? JSON.stringify(d)}`
                : String(d)
            )
            .join(' · ')}`
        else detailMsg = `${res.status}: ${JSON.stringify(body.detail)}`
      }
    } catch {
      /* ignore */
    }
    throw new Error(detailMsg)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export const trackedApi = {
  list: () => call<TrackedCreator[]>('/'),
  untrack: (creatorId: number) =>
    call<{ status: string }>(`/${creatorId}`, { method: 'DELETE' }),
}
