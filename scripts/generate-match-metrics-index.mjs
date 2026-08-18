import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const METRICS_DIR = join(ROOT, 'public', 'match-metrics');
const BUNDLES_DIR = join(METRICS_DIR, 'bundles');
const INDEX_PATH = join(METRICS_DIR, 'index.json');
const LEAGUE_NAMES_PATH = fileURLToPath(new URL('./league-names.json', import.meta.url));
const SKIP_DIRS = new Set(['bundles']);

async function loadLeagueNames() {
  const raw = await readFile(LEAGUE_NAMES_PATH, 'utf8');
  return JSON.parse(raw);
}

async function buildMatchMetrics() {
  await rm(BUNDLES_DIR, { recursive: true, force: true });
  await mkdir(BUNDLES_DIR, { recursive: true });

  const entries = await readdir(METRICS_DIR, { withFileTypes: true });
  const leagues = {};
  const leagueNames = await loadLeagueNames();

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const leagueId = entry.name;
    const leaguePath = join(METRICS_DIR, leagueId);
    const files = await readdir(leaguePath, { withFileTypes: true });

    const matches = [];

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.json')) {
        continue;
      }

      const raw = await readFile(join(leaguePath, file.name), 'utf8');
      matches.push(JSON.parse(raw));
    }

    if (matches.length === 0) {
      continue;
    }

    matches.sort((a, b) => a.match_id - b.match_id);

    const bundlePath = join(BUNDLES_DIR, `${leagueId}.json`);
    await writeFile(bundlePath, JSON.stringify(matches));

    leagues[leagueId] = { matchCount: matches.length, leagueName: leagueNames[leagueId] ?? leagueId };
  }

  const totalMatches = Object.values(leagues).reduce(
    (sum, league) => sum + league.matchCount,
    0,
  );

  const index = {
    version: 2,
    generatedAt: new Date().toISOString(),
    totalMatches,
    leagues,
  };

  await writeFile(INDEX_PATH, `${JSON.stringify(index)}\n`, 'utf8');

  console.log(
    `Generated match-metrics: ${totalMatches} matches across ${Object.keys(leagues).length} league bundles`,
  );
}

buildMatchMetrics().catch((error) => {
  console.error('Failed to generate match-metrics:', error);
  process.exit(1);
});
