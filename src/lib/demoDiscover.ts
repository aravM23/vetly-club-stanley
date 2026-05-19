/**
 * Self-contained demo dataset + in-browser API.
 *
 * Used when the FastAPI backend isn't reachable (e.g. on a Vercel deploy
 * without VITE_DISCOVER_API_BASE pointing at a hosted backend). All shapes
 * match the live API exactly, so the page has zero awareness of which mode
 * it's in.
 *
 * State persists to localStorage so approvals + rejections survive reloads.
 */
import type {
  DiscoverCandidate,
  DiscoverRun,
  DiscoverSettings,
} from './discoverApi'

const STORAGE_KEY = 'stan:demo:discover:v1'

type StoreShape = {
  candidates: DiscoverCandidate[]
  runs: DiscoverRun[]
  settings: DiscoverSettings
}

// ─── Seed data ──────────────────────────────────────────────────────────────
// Hand-tuned Creators that exercise the full Club Stanley rubric:
//   • Strong fits with green flags (talking-head, NORAM/UK, 3+/wk, real comments)
//   • Mid fits with mixed flags
//   • Mehr-Rajput-style outliers (sub-10k followers but tapped-in)
//   • Red-flag profiles (Philippines TZ, growth-reel dominant, ad-heavy, vague bio)

const SEED_CANDIDATES: DiscoverCandidate[] = [
  {
    id: 1,
    handle: 'thereelsstrategist',
    display_name: 'Maya Chen',
    biography:
      'I help service-based founders write hooks that actually stop the scroll. London → NYC. 6 years in social. Free hook bank ⬇️',
    follower_count: 47_300,
    engagement_rate: 0.054,
    avg_views: 38_200,
    last_post_at: hoursAgo(14),
    posts_per_week: 4.2,
    like_to_comment_ratio: 32,
    ad_density: 0.05,
    country_guess: 'United Kingdom',
    timezone_bucket: 'UK',
    talking_head_signal: 88,
    bio_quality_signal: 82,
    comment_quality_signal: 78,
    is_outlier_flagged: false,
    green_flags: [
      'Posts 4.2x/week (above target)',
      'Talking-head with clear POV on hooks',
      'UK-based — strong cohort timezone',
      'Real conversation in comments ("I tried this and got 12K views")',
    ],
    red_flags: [],
    discovered_via: 'hashtag',
    discovery_seed: 'reelsstrategy',
    score_fit: 92,
    score_engagement: 78,
    score_audience: 84,
    score_recency: 88,
    score_overall: 86,
    score_reasoning:
      'A textbook Club Stanley fit — sharp hook-strategist POV, UK-based, posts above cadence target, and her comment section is full of "I tried this" replies. Promote on this run.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 2,
    handle: 'growwith.maya',
    display_name: 'Maya Okafor',
    biography:
      'Teaching ambitious women how to monetize Instagram without burning out. As featured in Forbes 30U30. NYC ✈️ Lagos. Newsletter in bio.',
    follower_count: 68_900,
    engagement_rate: 0.041,
    avg_views: 51_400,
    last_post_at: hoursAgo(28),
    posts_per_week: 3.5,
    like_to_comment_ratio: 41,
    ad_density: 0.12,
    country_guess: 'United States',
    timezone_bucket: 'NORAM',
    talking_head_signal: 76,
    bio_quality_signal: 90,
    comment_quality_signal: 72,
    is_outlier_flagged: false,
    green_flags: [
      'NORAM-based with strong audience',
      'Posts 3.5x/week (on target)',
      'Crisp bio with proof points (Forbes 30U30) + clear CTA',
      'Mix of talking-head and tutorials',
    ],
    red_flags: ['Slight uptick in sponsored posts (12% ad density)'],
    discovered_via: 'llm_brainstorm',
    discovery_seed: 'gpt-4o-mini',
    score_fit: 84,
    score_engagement: 74,
    score_audience: 86,
    score_recency: 82,
    score_overall: 81,
    score_reasoning:
      'Strong NORAM voice on monetization — bio has proof points, cadence is on-target, and she replies to comments thoughtfully. Watch the ad density; if it climbs above 20% we should reconsider.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 3,
    handle: 'hookwriter.daily',
    display_name: 'Jules Patel',
    biography: 'one hook a day. that\'s it. that\'s the bio.',
    follower_count: 23_400,
    engagement_rate: 0.078,
    avg_views: 19_200,
    last_post_at: hoursAgo(6),
    posts_per_week: 7.1,
    like_to_comment_ratio: 18,
    ad_density: 0.0,
    country_guess: 'Canada',
    timezone_bucket: 'NORAM',
    talking_head_signal: 64,
    bio_quality_signal: 58,
    comment_quality_signal: 86,
    is_outlier_flagged: false,
    green_flags: [
      'Posts daily — strongest cadence in the batch',
      'Healthy like:comment ratio (18) — real conversation',
      '7.8% ER is well above benchmark',
      'Zero sponcon — uncluttered feed',
    ],
    red_flags: [
      'Bio is too clever — light on proof points',
      'Mix is mostly text-overlay reels, fewer talking-head',
    ],
    discovered_via: 'hashtag',
    discovery_seed: 'hookwriter',
    score_fit: 78,
    score_engagement: 88,
    score_audience: 70,
    score_recency: 95,
    score_overall: 80,
    score_reasoning:
      'Posts daily with the best engagement in the batch — the audience is genuinely tapped-in. Bio is the only weak spot; if we onboard, push them on a sharper positioning statement during orientation.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 4,
    handle: 'socialswithmehr',
    display_name: 'Mehr Rajput',
    biography:
      'I teach UGC the way I wish someone taught me. Free templates → link. Currently helping 200+ Creators land their first brand deal.',
    follower_count: 6_800,
    engagement_rate: 0.118,
    avg_views: 8_400,
    last_post_at: hoursAgo(20),
    posts_per_week: 3.8,
    like_to_comment_ratio: 9,
    ad_density: 0.03,
    country_guess: 'United Kingdom',
    timezone_bucket: 'UK',
    talking_head_signal: 92,
    bio_quality_signal: 88,
    comment_quality_signal: 94,
    is_outlier_flagged: true,
    green_flags: [
      'Outlier — 11.8% ER on 6.8K followers',
      'Comments full of "I tried this" responses',
      'Bio has clear niche + quantified proof ("200+ Creators")',
      'UK-based, posts 3.8x/week',
    ],
    red_flags: ['Under 10K follower floor — flag for review'],
    discovered_via: 'similar_account',
    discovery_seed: 'thereelsstrategist',
    score_fit: 95,
    score_engagement: 92,
    score_audience: 62,
    score_recency: 86,
    score_overall: 86,
    score_reasoning:
      'Classic Mehr-Rajput outlier — sub-10K but a genuinely tapped-in audience teaching the exact niche we want. Highest fit score in the batch. Approve despite the follower floor.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 5,
    handle: 'personalbrand.playbook',
    display_name: 'Sofia Lindqvist',
    biography:
      'Personal brand strategist for founders | Featured: HBR, Fast Company | Stockholm | Building Beacons community for women in tech',
    follower_count: 51_700,
    engagement_rate: 0.038,
    avg_views: 28_900,
    last_post_at: hoursAgo(38),
    posts_per_week: 2.8,
    like_to_comment_ratio: 52,
    ad_density: 0.08,
    country_guess: 'Sweden',
    timezone_bucket: 'EMEA',
    talking_head_signal: 70,
    bio_quality_signal: 86,
    comment_quality_signal: 64,
    is_outlier_flagged: false,
    green_flags: [
      'EMEA-based (Stockholm) — adjacent to UK cohort window',
      'Strong bio with HBR / Fast Company credentials',
      'Talking-head dominates the feed',
    ],
    red_flags: [
      'Cadence slipped to 2.8x/week last 30 days',
      'Like:comment ratio creeping up (52) — engagement softening',
    ],
    discovered_via: 'brand_mention',
    discovery_seed: 'beacons',
    score_fit: 82,
    score_engagement: 64,
    score_audience: 78,
    score_recency: 62,
    score_overall: 73,
    score_reasoning:
      'Strong positioning and EMEA presence — would be a yes if the cadence holds. Last 30 days dropped to 2.8x/week. Consider flagging on the next run if she doesn\'t bounce back.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 6,
    handle: 'creator.economy.coach',
    display_name: 'Tomás García',
    biography:
      'Helping creators turn 1 idea → 10 income streams. CEO @creatorflywheel. Mexico City. DMs open for collabs.',
    follower_count: 89_400,
    engagement_rate: 0.029,
    avg_views: 41_200,
    last_post_at: hoursAgo(52),
    posts_per_week: 2.1,
    like_to_comment_ratio: 78,
    ad_density: 0.31,
    country_guess: 'Mexico',
    timezone_bucket: 'NORAM',
    talking_head_signal: 58,
    bio_quality_signal: 70,
    comment_quality_signal: 48,
    is_outlier_flagged: false,
    green_flags: ['Solid follower base in target band', 'NORAM-adjacent TZ'],
    red_flags: [
      'Ad density at 31% — feed reads as over-branded',
      'Like:comment ratio 78 — weak conversation signal',
      'Cadence dropped to 2.1x/week',
    ],
    discovered_via: 'hashtag',
    discovery_seed: 'creatoreconomy',
    score_fit: 68,
    score_engagement: 50,
    score_audience: 70,
    score_recency: 48,
    score_overall: 60,
    score_reasoning:
      'Niche fit is there but the feed is ad-heavy and cadence has softened. Pass for this cohort — revisit in 3 months if the mix rebalances.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 7,
    handle: 'ugc.with.lola',
    display_name: 'Lola Reyes',
    biography:
      'UGC Creator coach | I help nano-creators land their first paid brand deal | 🇵🇭 → 🇬🇧 | Course launching soon',
    follower_count: 14_200,
    engagement_rate: 0.063,
    avg_views: 11_800,
    last_post_at: hoursAgo(8),
    posts_per_week: 4.5,
    like_to_comment_ratio: 22,
    ad_density: 0.06,
    country_guess: 'Philippines',
    timezone_bucket: 'PHILIPPINES',
    talking_head_signal: 84,
    bio_quality_signal: 80,
    comment_quality_signal: 76,
    is_outlier_flagged: false,
    green_flags: [
      'High-cadence (4.5x/week)',
      'Talking-head with clear UGC-coach POV',
      '6.3% ER — strong audience',
      'Bio is sharp with quantified niche',
    ],
    red_flags: ['Philippines TZ — historically low cohort turnout per the guide'],
    discovered_via: 'hashtag',
    discovery_seed: 'ugccoach',
    score_fit: 88,
    score_engagement: 78,
    score_audience: 56,
    score_recency: 92,
    score_overall: 76,
    score_reasoning:
      'Content quality is excellent, but Philippines TZ overlaps poorly with our cohort sessions. Per the sourcing guide, "soft flag" — if other signals are strong (they are) we can still consider, just be aware of the timezone tradeoff.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 8,
    handle: 'monetize.ur.content',
    display_name: 'Drew Kim',
    biography: 'creator | strategist | DM for collabs',
    follower_count: 31_500,
    engagement_rate: 0.019,
    avg_views: 14_700,
    last_post_at: hoursAgo(94),
    posts_per_week: 1.2,
    like_to_comment_ratio: 142,
    ad_density: 0.22,
    country_guess: null,
    timezone_bucket: 'UNKNOWN',
    talking_head_signal: 35,
    bio_quality_signal: 28,
    comment_quality_signal: 32,
    is_outlier_flagged: false,
    green_flags: [],
    red_flags: [
      'Vague bio ("creator | strategist | DM for collabs")',
      'Cadence ~1.2x/week — below target',
      'Like:comment ratio 142 — likely pod or hype-only comments',
      'No post in 4 days',
      'Growth-reel dominant',
    ],
    discovered_via: 'llm_brainstorm',
    discovery_seed: 'gpt-4o-mini',
    score_fit: 42,
    score_engagement: 30,
    score_audience: 50,
    score_recency: 28,
    score_overall: 39,
    score_reasoning:
      'Every soft red flag from the guide fires: vague bio, low cadence, growth-reel dominant, suspiciously high like:comment ratio. Reject.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 9,
    handle: 'captions.that.convert',
    display_name: 'Priya Mehta',
    biography:
      'Captions that move people from scroll → click → buy. Senior copy @ ex-Later. Teaching the framework I use with my clients.',
    follower_count: 38_100,
    engagement_rate: 0.046,
    avg_views: 24_300,
    last_post_at: hoursAgo(17),
    posts_per_week: 3.4,
    like_to_comment_ratio: 28,
    ad_density: 0.04,
    country_guess: 'United States',
    timezone_bucket: 'NORAM',
    talking_head_signal: 72,
    bio_quality_signal: 84,
    comment_quality_signal: 82,
    is_outlier_flagged: false,
    green_flags: [
      'NORAM-based, posts 3.4x/week',
      'Bio has proof (Later) + clear who-she-helps + CTA',
      'Engaged comment section with real questions',
    ],
    red_flags: ['Some short growth reels in the mix'],
    discovered_via: 'brand_mention',
    discovery_seed: 'later.com',
    score_fit: 84,
    score_engagement: 76,
    score_audience: 80,
    score_recency: 84,
    score_overall: 80,
    score_reasoning:
      'Right niche, right cadence, right geo. Tagged on @later.com which is a strong relationship signal. Approve.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 10,
    handle: 'ig.growth.guy',
    display_name: 'Jacob Reilly',
    biography: 'IG growth tips daily 📈 link in bio for FREE templates',
    follower_count: 102_800,
    engagement_rate: 0.012,
    avg_views: 18_500,
    last_post_at: hoursAgo(11),
    posts_per_week: 6.0,
    like_to_comment_ratio: 215,
    ad_density: 0.18,
    country_guess: 'United States',
    timezone_bucket: 'NORAM',
    talking_head_signal: 22,
    bio_quality_signal: 36,
    comment_quality_signal: 24,
    is_outlier_flagged: false,
    green_flags: ['Posts 6x/week', 'NORAM-based'],
    red_flags: [
      'Above 100K follower ceiling — too established for emerging-Creator program',
      'Like:comment ratio 215 — almost certainly a comment pod',
      'Feed is 90% growth reels (b-roll + text overlay)',
      'Vague bio',
    ],
    discovered_via: 'hashtag',
    discovery_seed: 'instagramgrowth',
    score_fit: 50,
    score_engagement: 28,
    score_audience: 38,
    score_recency: 80,
    score_overall: 46,
    score_reasoning:
      'Above the follower ceiling for an emerging-Creator program, and the engagement profile screams comment pod. Reject — this is exactly the profile the rubric tells us to avoid.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 11,
    handle: 'soheila.scales',
    display_name: 'Soheila Nazari',
    biography:
      'Scaling solo creators → 6-figure educators. Workshop facilitator @ Skool. Toronto. Lurker → mentor for 5 years.',
    follower_count: 19_800,
    engagement_rate: 0.057,
    avg_views: 13_900,
    last_post_at: hoursAgo(22),
    posts_per_week: 3.1,
    like_to_comment_ratio: 24,
    ad_density: 0.07,
    country_guess: 'Canada',
    timezone_bucket: 'NORAM',
    talking_head_signal: 80,
    bio_quality_signal: 78,
    comment_quality_signal: 74,
    is_outlier_flagged: false,
    green_flags: [
      'Posts 3.1x/week on target',
      'Toronto / NORAM — strong cohort fit',
      'Talking-head with workshop-facilitator credentials',
      '5.7% ER above benchmark',
    ],
    red_flags: [],
    discovered_via: 'brand_mention',
    discovery_seed: 'skool',
    score_fit: 86,
    score_engagement: 78,
    score_audience: 74,
    score_recency: 82,
    score_overall: 81,
    score_reasoning:
      'Quietly strong fit — every signal is at-or-above target without standout outliers. Approve.',
    status: 'pending',
    first_seen_at: now(),
  },
  {
    id: 12,
    handle: 'thecontentstrategist',
    display_name: 'Yuki Tanaka',
    biography: 'Content strategist for B2B founders. Berlin. ex-Kajabi.',
    follower_count: 22_400,
    engagement_rate: 0.044,
    avg_views: 12_100,
    last_post_at: hoursAgo(35),
    posts_per_week: 2.9,
    like_to_comment_ratio: 38,
    ad_density: 0.05,
    country_guess: 'Germany',
    timezone_bucket: 'EMEA',
    talking_head_signal: 74,
    bio_quality_signal: 76,
    comment_quality_signal: 70,
    is_outlier_flagged: false,
    green_flags: [
      'EMEA-based (Berlin) — close to UK cohort window',
      'Solid bio with ex-Kajabi proof',
      'Healthy talking-head mix',
    ],
    red_flags: ['Cadence just under target (2.9x/week)'],
    discovered_via: 'llm_brainstorm',
    discovery_seed: 'gpt-4o-mini',
    score_fit: 80,
    score_engagement: 70,
    score_audience: 74,
    score_recency: 68,
    score_overall: 74,
    score_reasoning:
      'Strong shape, just a touch below cadence target. B2B angle is slightly off-center but adjacent. Borderline — flag for second look.',
    status: 'pending',
    first_seen_at: now(),
  },
]

const SEED_SETTINGS: DiscoverSettings = {
  icp_description:
    "Club Stanley target Creators: EMERGING social-media coaches on Instagram (people who teach content strategy, IG growth, UGC, creator-economy tactics, monetization, hooks/storytelling, etc.). Sweet spot 10k-100k followers; sub-10k OK only as an outlier when the audience is unusually tapped-in. Prefer talking-head / voiceover content with a clear POV over generic 'growth reels' (b-roll + text overlay). Want consistent posting (3x+/week), real comment conversation (questions, 'I tried this', Creator replies), and a bio that clearly states niche + who they help + proof points. Geo preference: NORAM and UK-adjacent EMEA. Avoid ad-saturated profiles.",
  hashtag_seeds: [
    'socialmediacoach',
    'instagramgrowth',
    'contentstrategy',
    'ugccreator',
    'ugccoach',
    'creatoreconomy',
    'creatorcoach',
    'reelsstrategy',
    'shortformcontent',
    'contentcreatortips',
    'monetizeyourcontent',
    'personalbrandcoach',
  ],
  brand_account_seeds: [
    'stansolo',
    'beacons',
    'later.com',
    'linktree',
    'kajabi',
    'skool',
    'metricool',
    'buffer',
  ],
  competitor_handle_seeds: [],
  follower_min: 10_000,
  follower_max: 100_000,
  min_engagement_rate: 0.02,
  allow_sub_floor_outliers: true,
  preferred_geo_tags: ['NORAM', 'UK', 'EMEA'],
  deprioritized_geo_tags: ['PHILIPPINES'],
  candidates_per_source: 20,
  digest_size: 15,
}

// Additional "fresh batch" Creators surfaced each time the user clicks Run.
// Cycled deterministically so repeated runs don't feel random.
const ADDITIONAL_BATCHES: DiscoverCandidate[][] = [
  [
    {
      id: 101,
      handle: 'reels.lab.uk',
      display_name: 'Aisha Bello',
      biography: 'Building London\'s biggest reels community. Monthly live teardowns. 🇬🇧',
      follower_count: 41_200,
      engagement_rate: 0.049,
      avg_views: 32_800,
      last_post_at: hoursAgo(9),
      posts_per_week: 3.7,
      like_to_comment_ratio: 26,
      ad_density: 0.04,
      country_guess: 'United Kingdom',
      timezone_bucket: 'UK',
      talking_head_signal: 82,
      bio_quality_signal: 80,
      comment_quality_signal: 78,
      is_outlier_flagged: false,
      green_flags: ['UK-based community lead', 'Monthly live teardowns — high stickiness', '3.7x/week posting'],
      red_flags: [],
      discovered_via: 'hashtag',
      discovery_seed: 'reelsstrategy',
      score_fit: 88,
      score_engagement: 78,
      score_audience: 82,
      score_recency: 86,
      score_overall: 83,
      score_reasoning: 'UK community lead in our exact niche — would slot into Cohort 2 instantly.',
      status: 'pending',
      first_seen_at: now(),
    },
    {
      id: 102,
      handle: 'studio.matcha',
      display_name: 'Hana Ito',
      biography: 'Wellness-adjacent lifestyle | matcha, mornings, monetization | LA',
      follower_count: 76_400,
      engagement_rate: 0.022,
      avg_views: 19_400,
      last_post_at: hoursAgo(40),
      posts_per_week: 2.2,
      like_to_comment_ratio: 96,
      ad_density: 0.26,
      country_guess: 'United States',
      timezone_bucket: 'NORAM',
      talking_head_signal: 50,
      bio_quality_signal: 58,
      comment_quality_signal: 50,
      is_outlier_flagged: false,
      green_flags: ['NORAM-based', 'Decent follower size'],
      red_flags: ['Lifestyle-first, monetization secondary — wrong niche center of gravity', 'Ad-heavy at 26%'],
      discovered_via: 'brand_mention',
      discovery_seed: 'later.com',
      score_fit: 52,
      score_engagement: 48,
      score_audience: 70,
      score_recency: 50,
      score_overall: 55,
      score_reasoning: 'Adjacent niche only — wellness-first with a monetization sprinkle. Not the focus we want.',
      status: 'pending',
      first_seen_at: now(),
    },
  ],
  [
    {
      id: 201,
      handle: 'buildyourbrand.with.sam',
      display_name: 'Sam Williamson',
      biography: 'Personal brand coach for service-based founders | UK | Was your strategy consultant in another life',
      follower_count: 28_300,
      engagement_rate: 0.061,
      avg_views: 16_700,
      last_post_at: hoursAgo(13),
      posts_per_week: 3.9,
      like_to_comment_ratio: 22,
      ad_density: 0.03,
      country_guess: 'United Kingdom',
      timezone_bucket: 'UK',
      talking_head_signal: 86,
      bio_quality_signal: 84,
      comment_quality_signal: 80,
      is_outlier_flagged: false,
      green_flags: ['UK-based personal brand coach', '3.9x/week posting', '6.1% ER — engaged audience', 'Bio nails niche + proof'],
      red_flags: [],
      discovered_via: 'similar_account',
      discovery_seed: 'thereelsstrategist',
      score_fit: 90,
      score_engagement: 80,
      score_audience: 76,
      score_recency: 86,
      score_overall: 83,
      score_reasoning: 'Surfaced via the similar-accounts walk from @thereelsstrategist — strong second-degree fit.',
      status: 'pending',
      first_seen_at: now(),
    },
  ],
]

// ─── State management ──────────────────────────────────────────────────────

function loadState(): StoreShape {
  if (typeof window === 'undefined') return freshState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const s = freshState()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as StoreShape
  } catch {
    return freshState()
  }
}

function saveState(state: StoreShape) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota errors */
  }
}

function freshState(): StoreShape {
  return {
    candidates: SEED_CANDIDATES.map((c) => ({ ...c })),
    // Seed ~2 weeks of historical runs so the Sourcing metrics page has a
    // believable activity chart, funnel, and trend deltas on first load.
    // Newest first (the API contract is reverse-chronological).
    runs: HISTORICAL_RUNS.map((r) => ({ ...r })),
    settings: { ...SEED_SETTINGS },
  }
}

/**
 * 14 days of plausible run history. Counts taper toward older runs (smaller
 * source set initially) and grow as the system was tuned. Funnel ratios stay
 * realistic: ~70% dedupe survival, ~75% hydrate survival, ~65% score survival.
 */
const HISTORICAL_RUNS: DiscoverRun[] = [
  // Most recent — matches the seeded candidates
  mkRun(13, 0, 6, { raw: 47, dedup: 32, hydrated: 24, scored: 12 }),
  mkRun(12, 1, 4, { raw: 41, dedup: 28, hydrated: 21, scored: 11 }),
  mkRun(11, 2, 9, { raw: 44, dedup: 30, hydrated: 22, scored: 13 }),
  mkRun(10, 3, 3, { raw: 38, dedup: 26, hydrated: 19, scored: 10 }),
  mkRun(9, 4, 18, { raw: 52, dedup: 35, hydrated: 26, scored: 15 }),
  mkRun(8, 5, 11, { raw: 36, dedup: 24, hydrated: 18, scored: 9 }),
  mkRun(7, 6, 7, { raw: 39, dedup: 27, hydrated: 20, scored: 10 }),
  mkRun(6, 7, 22, { raw: 33, dedup: 22, hydrated: 16, scored: 8 }),
  mkRun(5, 9, 14, { raw: 31, dedup: 21, hydrated: 15, scored: 7 }),
  mkRun(4, 10, 5, { raw: 28, dedup: 19, hydrated: 14, scored: 7 }),
  mkRun(3, 11, 20, { raw: 26, dedup: 18, hydrated: 13, scored: 6 }),
  mkRun(2, 13, 3, { raw: 22, dedup: 15, hydrated: 11, scored: 5 }),
  mkRun(1, 13, 19, { raw: 19, dedup: 13, hydrated: 9, scored: 4 }),
]

function mkRun(
  id: number,
  daysBack: number,
  hourOfDay: number,
  counts: { raw: number; dedup: number; hydrated: number; scored: number }
): DiscoverRun {
  const started = new Date()
  started.setDate(started.getDate() - daysBack)
  started.setHours(hourOfDay, 12, 0, 0)
  const completed = new Date(started.getTime() + 62_000)
  return {
    id,
    status: 'completed',
    sources_used: ['hashtag', 'brand_mention', 'similar_account', 'llm_brainstorm'],
    raw_count: counts.raw,
    deduped_count: counts.dedup,
    hydrated_count: counts.hydrated,
    scored_count: counts.scored,
    started_at: started.toISOString(),
    completed_at: completed.toISOString(),
    error_message: null,
  }
}

// ─── Public API (mirrors discoverApi exactly) ──────────────────────────────

export const localDiscoverApi = {
  async run(): Promise<DiscoverRun> {
    // Simulate the LLM scoring latency so the spinner feels real.
    await sleep(1400)
    const state = loadState()
    const batchIndex = state.runs.length % ADDITIONAL_BATCHES.length
    const fresh = ADDITIONAL_BATCHES[batchIndex].map((c) => ({
      ...c,
      // Bump the id so subsequent runs don't collide.
      id: c.id + state.runs.length * 1000,
      first_seen_at: now(),
    }))
    const existingHandles = new Set(state.candidates.map((c) => c.handle))
    const newOnes = fresh.filter((c) => !existingHandles.has(c.handle))
    const run: DiscoverRun = {
      id: state.runs.length + 1,
      status: 'completed',
      sources_used: ['hashtag', 'brand_mention', 'similar_account', 'llm_brainstorm'],
      raw_count: 18 + Math.floor(Math.random() * 8),
      deduped_count: 12 + newOnes.length,
      hydrated_count: 8 + newOnes.length,
      scored_count: newOnes.length,
      started_at: secondsAgo(2),
      completed_at: now(),
      error_message: null,
    }
    state.candidates = [...newOnes, ...state.candidates]
    state.runs = [run, ...state.runs].slice(0, 20)
    saveState(state)
    return run
  },

  async listRuns(limit: number): Promise<DiscoverRun[]> {
    return loadState().runs.slice(0, limit)
  },

  async listCandidates(opts: {
    status?: 'pending' | 'approved' | 'rejected' | 'all'
    minScore?: number
    limit?: number
  }): Promise<DiscoverCandidate[]> {
    const status = opts.status ?? 'pending'
    const min = opts.minScore ?? 0
    const limit = opts.limit ?? 100
    const state = loadState()
    const filtered = state.candidates.filter((c) => {
      if (status !== 'all' && c.status !== status) return false
      if ((c.score_overall ?? 0) < min) return false
      return true
    })
    filtered.sort(
      (a, b) => (b.score_overall ?? 0) - (a.score_overall ?? 0)
    )
    return filtered.slice(0, limit).map((c) => ({ ...c }))
  },

  async approve(candidateId: number): Promise<DiscoverCandidate> {
    return mutate(candidateId, 'approved')
  },

  async reject(candidateId: number): Promise<DiscoverCandidate> {
    return mutate(candidateId, 'rejected')
  },

  async getSettings(): Promise<DiscoverSettings> {
    return { ...loadState().settings }
  },

  async updateSettings(
    patch: Partial<DiscoverSettings>
  ): Promise<DiscoverSettings> {
    const state = loadState()
    state.settings = { ...state.settings, ...patch }
    saveState(state)
    return { ...state.settings }
  },
}

function mutate(
  candidateId: number,
  status: 'approved' | 'rejected'
): DiscoverCandidate {
  const state = loadState()
  const idx = state.candidates.findIndex((c) => c.id === candidateId)
  if (idx === -1) throw new Error(`Candidate ${candidateId} not found`)
  state.candidates[idx] = { ...state.candidates[idx], status }
  saveState(state)
  return { ...state.candidates[idx] }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}
function secondsAgo(s: number): string {
  return new Date(Date.now() - s * 1000).toISOString()
}
function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}
