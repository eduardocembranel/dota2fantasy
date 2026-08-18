import type {
  InitMatchMetricsOptions,
  InitMatchMetricsResult,
  MatchMetrics,
  MatchMetricsIndex,
} from './types';

const METRICS_BASE = `${import.meta.env.BASE_URL}match-metrics`;
const DEFAULT_CONCURRENCY = 8;

let cachedIndex: MatchMetricsIndex | null = null;
let allMatches: MatchMetrics[] | null = null;
let initPromise: Promise<InitMatchMetricsResult> | null = null;

export function getLeagueBundleUrl(leagueId: string): string {
  return `${METRICS_BASE}/bundles/${leagueId}.json`;
}

/** Raw per-match file (source data; not used by the loader). */
export function getMatchMetricsUrl(leagueId: string, matchId: string): string {
  return `${METRICS_BASE}/${leagueId}/${matchId}.json`;
}

export async function fetchMatchMetricsIndex(): Promise<MatchMetricsIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const response = await fetch(`${METRICS_BASE}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load match-metrics index (${response.status})`);
  }

  cachedIndex = (await response.json()) as MatchMetricsIndex;
  return cachedIndex;
}

async function fetchLeagueBundle(leagueId: string): Promise<MatchMetrics[]> {
  const response = await fetch(getLeagueBundleUrl(leagueId));
  if (!response.ok) {
    throw new Error(`Failed to load league bundle ${leagueId} (${response.status})`);
  }

  return (await response.json()) as MatchMetrics[];
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

/**
 * Fetches league bundles listed in index.json and keeps all matches in memory.
 * Safe to call multiple times — subsequent calls return the same cached result.
 */
export async function initMatchMetrics(
  options: InitMatchMetricsOptions = {},
): Promise<InitMatchMetricsResult> {
  if (allMatches) {
    return { matches: allMatches, failed: [] };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const { concurrency = DEFAULT_CONCURRENCY } = options;
    const index = await fetchMatchMetricsIndex();
    const leagueIds = Object.keys(index.leagues);

    const matches: MatchMetrics[] = [];
    const failed: InitMatchMetricsResult['failed'] = [];

    await runWithConcurrency(leagueIds, concurrency, async (leagueId) => {
      try {
        const leagueMatches = await fetchLeagueBundle(leagueId);
        matches.push(...leagueMatches);
      } catch (error) {
        failed.push({
          leagueId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    allMatches = matches;
    return { matches, failed };
  })();

  return initPromise;
}

export function isMatchMetricsLoaded(): boolean {
  return allMatches !== null;
}

export function getAllMatches(): MatchMetrics[] {
  return allMatches ?? [];
}

/** Loaded matches for the given leagues — no network requests. */
export function getMatchesByLeagues(leagueIds: string[]): MatchMetrics[] {
  if (leagueIds.length === 0) {
    return getAllMatches();
  }

  const selected = new Set(leagueIds);
  return getAllMatches().filter((match) => selected.has(String(match.league_id)));
}

export function getAvailableLeagues(): Array<{ leagueId: string; matchCount: number; leagueName?: string }> {
  const counts = new Map<string, number>();

  for (const match of getAllMatches()) {
    const leagueId = String(match.league_id);
    counts.set(leagueId, (counts.get(leagueId) ?? 0) + 1);
  }

  const indexLeagues = cachedIndex?.leagues ?? {};

  return Array.from(counts.entries())
    .map(([leagueId, matchCount]) => ({
      leagueId,
      matchCount,
      leagueName: indexLeagues[leagueId]?.leagueName,
    }))
    .sort((a, b) => Number(a.leagueId) - Number(b.leagueId));
}

export function clearMatchMetricsCache(): void {
  cachedIndex = null;
  allMatches = null;
  initPromise = null;
}
