export interface PlayerMatchStats {
  player_slot: number;
  account_id: number;
  name: string;
  last_hits: number;
  denies: number;
  creep_score: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  madstones_acquired: number;
  madstones_collected: number;
  towers_killed: number;
  observers_placed: number;
  camps_stacked: number;
  rune_pickups: number;
  watchers_taken: number;
  smokes_used: number;
  lotuses_grabbed: number;
  courier_kills: number;
  roshan_kills: number;
  tormentor_participation: number;
  stuns: number;
  teamfight_participation: number;
  firstblood_claimed: boolean;
}

export type MatchSide = 'radiant' | 'dire';
export type PlayerPositionKey = '1' | '2' | '3' | '4' | '5';

export interface MatchMetrics {
  match_id: number;
  duration: number;
  league_id: number;
  player_stats: Record<MatchSide, Record<PlayerPositionKey, PlayerMatchStats>>;
}

export interface LeagueIndexEntry {
  matchCount: number;
  leagueName?: string;
}

export interface MatchMetricsIndex {
  version: 2;
  generatedAt: string;
  totalMatches: number;
  leagues: Record<string, LeagueIndexEntry>;
}

export interface InitMatchMetricsOptions {
  concurrency?: number;
}

export interface InitMatchMetricsResult {
  matches: MatchMetrics[];
  failed: Array<{ leagueId: string; error: string }>;
}
