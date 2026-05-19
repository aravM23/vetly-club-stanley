/**
 * Discovery API client.
 *
 * Three modes, picked automatically:
 *
 *   1. VITE_DISCOVER_API_BASE set to an absolute URL (e.g. on Vercel pointing
 *      at a deployed FastAPI backend) → calls that.
 *   2. Running locally with the default vite proxy → calls `/api`, which
 *      proxies to `http://localhost:8000`.
 *   3. Either of the above fails or VITE_DISCOVER_DEMO=1 → falls back to a
 *      self-contained local dataset (see lib/demoDiscover.ts) so the Vercel
 *      build works fully without any backend deployed.
 *
 * Response shape mirrors Vetly's `creators` table — same score axes
 * (fit/engagement/audience/recency/overall) — plus the Club-Stanley-specific
 * signal columns (posts_per_week, ad_density, timezone_bucket, green_flags,
 * red_flags, is_outlier_flagged).
 */
import { localDiscoverApi } from './demoDiscover'

const ENV_API_BASE = import.meta.env.VITE_DISCOVER_API_BASE as string | undefined
const FORCE_DEMO = import.meta.env.VITE_DISCOVER_DEMO === '1'
const API_BASE = (ENV_API_BASE ?? '/api').replace(/\/$/, '')

// In production this would come from the auth session; for the demo we hit
// user #1 directly so the page works without Supabase configured.
export const DISCOVER_USER_ID = 1

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'duplicate' | 'errored'

export type DiscoverCandidate = {
  id: number
  handle: string
  display_name: string | null
  biography: string | null
  follower_count: number | null
  engagement_rate: number | null
  avg_views: number | null
  last_post_at: string | null

  // Club Stanley signal columns
  posts_per_week: number | null
  like_to_comment_ratio: number | null
  ad_density: number | null
  country_guess: string | null
  timezone_bucket: string | null
  talking_head_signal: number | null
  bio_quality_signal: number | null
  comment_quality_signal: number | null
  is_outlier_flagged: boolean
  green_flags: string[] | null
  red_flags: string[] | null

  discovered_via: string
  discovery_seed: string | null

  score_fit: number | null
  score_engagement: number | null
  score_audience: number | null
  score_recency: number | null
  score_overall: number | null
  score_reasoning: string | null
  status: CandidateStatus
  first_seen_at: string
}

export type DiscoverRun = {
  id: number
  status: string
  sources_used: string[] | null
  raw_count: number
  deduped_count: number
  hydrated_count: number
  scored_count: number
  started_at: string
  completed_at: string | null
  error_message: string | null
}

export type DiscoverSettings = {
  icp_description: string
  hashtag_seeds: string[] | null
  brand_account_seeds: string[] | null
  competitor_handle_seeds: string[] | null
  follower_min: number
  follower_max: number
  min_engagement_rate: number
  allow_sub_floor_outliers: boolean
  preferred_geo_tags: string[] | null
  deprioritized_geo_tags: string[] | null
  candidates_per_source: number
  digest_size: number
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/users/${DISCOVER_USER_ID}/discover${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail ?? `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

/**
 * `runtimeMode` lets the page show a small "demo" indicator and skip the
 * health probe on subsequent calls once we know the backend is unreachable.
 */
type Mode = 'live' | 'demo'
let runtimeMode: Mode | null = null

async function probeBackend(): Promise<Mode> {
  if (FORCE_DEMO) return 'demo'
  if (runtimeMode) return runtimeMode
  try {
    const res = await fetch(`${API_BASE}/users/${DISCOVER_USER_ID}/discover/settings`, {
      headers: { 'Content-Type': 'application/json' },
    })
    runtimeMode = res.ok ? 'live' : 'demo'
  } catch {
    runtimeMode = 'demo'
  }
  return runtimeMode
}

export function getRuntimeMode(): Mode | null {
  return runtimeMode
}

/**
 * Wrap each real-API call with a demo fallback. If the backend is reachable
 * we use it; otherwise we fall through to localDiscoverApi (an in-browser
 * dataset persisted to localStorage). Either path returns the same shape, so
 * the React layer has zero awareness of which mode it's in.
 */
async function withFallback<T>(
  real: () => Promise<T>,
  fake: () => Promise<T> | T
): Promise<T> {
  const mode = await probeBackend()
  if (mode === 'live') {
    try {
      return await real()
    } catch (e) {
      runtimeMode = 'demo'
      // eslint-disable-next-line no-console
      console.warn('[discover] live API failed, falling back to demo:', e)
      return fake()
    }
  }
  return fake()
}

export const discoverApi = {
  run: (opts: { useScrapers?: boolean; perSourceLimit?: number | null; runSync?: boolean } = {}) =>
    withFallback(
      () =>
        call<DiscoverRun>('/run', {
          method: 'POST',
          body: JSON.stringify({
            use_scrapers: opts.useScrapers ?? true,
            per_source_limit: opts.perSourceLimit ?? null,
            run_sync: opts.runSync ?? true,
          }),
        }),
      () => localDiscoverApi.run()
    ),

  listRuns: (limit = 10) =>
    withFallback(
      () => call<DiscoverRun[]>(`/runs?limit=${limit}`),
      () => localDiscoverApi.listRuns(limit)
    ),

  listCandidates: (opts: { status?: 'pending' | 'approved' | 'rejected' | 'all'; minScore?: number; limit?: number } = {}) =>
    withFallback(
      () => {
        const params = new URLSearchParams({
          status: opts.status ?? 'pending',
          min_score: String(opts.minScore ?? 0),
          limit: String(opts.limit ?? 100),
        })
        return call<DiscoverCandidate[]>(`/candidates?${params}`)
      },
      () => localDiscoverApi.listCandidates(opts)
    ),

  approve: (candidateId: number) =>
    withFallback(
      () => call<DiscoverCandidate>(`/candidates/${candidateId}/approve`, { method: 'POST' }),
      () => localDiscoverApi.approve(candidateId)
    ),

  reject: (candidateId: number) =>
    withFallback(
      () => call<DiscoverCandidate>(`/candidates/${candidateId}/reject`, { method: 'POST' }),
      () => localDiscoverApi.reject(candidateId)
    ),

  getSettings: () =>
    withFallback(
      () => call<DiscoverSettings>('/settings'),
      () => localDiscoverApi.getSettings()
    ),

  updateSettings: (patch: Partial<DiscoverSettings>) =>
    withFallback(
      () => call<DiscoverSettings>('/settings', { method: 'PUT', body: JSON.stringify(patch) }),
      () => localDiscoverApi.updateSettings(patch)
    ),
}
