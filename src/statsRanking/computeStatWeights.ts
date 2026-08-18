import {
  BLUE_ATTRIBUTES,
  GREEN_ATTRIBUTES,
  RED_ATTRIBUTES,
} from '../i18n';
import { getMatchesByLeagues } from '../matchMetrics/loadMatchMetrics';
import type {
  MatchMetrics,
  MatchSide,
  PlayerMatchStats,
  PlayerPositionKey,
} from '../matchMetrics/types';
import type { Attribute, Role } from '../types';
import type { ComputeStatWeightsOptions, StatColor, StatWeights } from './types';
import { applyFantasyScore } from './fantasyMultipliers';

let statWeights: StatWeights | null = null;

const MATCH_SIDES: MatchSide[] = ['radiant', 'dire'];
const ROLES: Role[] = ['core', 'mid', 'support'];

const ROLE_PLAYER_POSITIONS: Record<Role, PlayerPositionKey[]> = {
  core: ['1', '3'],
  mid: ['2'],
  support: ['4', '5'],
};

const ROLE_COLORS: Record<Role, StatColor[]> = {
  core: ['red', 'green'],
  mid: ['red', 'green', 'blue'],
  support: ['green', 'blue'],
};

const COLOR_ATTRIBUTES: Record<StatColor, Attribute[]> = {
  red: RED_ATTRIBUTES,
  green: GREEN_ATTRIBUTES,
  blue: BLUE_ATTRIBUTES,
};

const ATTRIBUTE_TO_FIELD: Partial<Record<Attribute, keyof PlayerMatchStats>> = {
  creepScore: 'creep_score',
  gpm: 'gold_per_min',
  deaths: 'deaths',
  kills: 'kills',
  towers: 'towers_killed',
  madstonesCollected: 'madstones_collected',
  teamfight: 'teamfight_participation',
  stuns: 'stuns',
  tormentorKills: 'tormentor_participation',
  roshanKills: 'roshan_kills',
  firstBlood: 'firstblood_claimed',
  courierKills: 'courier_kills',
  wardsPlaced: 'observers_placed',
  campsStacked: 'camps_stacked',
  lotusesGained: 'lotuses_grabbed',
  watchersTaken: 'watchers_taken',
  runesGrabbed: 'rune_pickups',
  smokesUsed: 'smokes_used',
};

type Samples = Record<
  Role,
  Partial<Record<StatColor, Partial<Record<Attribute, number[]>>>>
>;

function createEmptySamples(): Samples {
  return { core: {}, mid: {}, support: {} };
}

function recordSample(
  samples: Samples,
  role: Role,
  color: StatColor,
  attribute: Attribute,
  value: number,
): void {
  if (!samples[role][color]) {
    samples[role][color] = {};
  }

  const colorSamples = samples[role][color]!;
  if (!colorSamples[attribute]) {
    colorSamples[attribute] = [];
  }

  colorSamples[attribute]!.push(value);
}

function getNumericStatValue(player: PlayerMatchStats, field: keyof PlayerMatchStats): number | null {
  const value = player[field];

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return null;
}

function averageFantasyScoresForPositions(
  match: MatchMetrics,
  side: MatchSide,
  positions: PlayerPositionKey[],
  attribute: Attribute,
  field: keyof PlayerMatchStats,
): number | null {
  const fantasyScores: number[] = [];

  for (const position of positions) {
    const player = match.player_stats[side][position];
    if (!player) {
      continue;
    }

    const value = getNumericStatValue(player, field);
    if (value === null) {
      continue;
    }

    fantasyScores.push(applyFantasyScore(attribute, value));
  }

  if (fantasyScores.length === 0) {
    return null;
  }

  return fantasyScores.reduce((sum, score) => sum + score, 0) / fantasyScores.length;
}

function collectSamples(matches: MatchMetrics[]): Samples {
  const samples = createEmptySamples();

  for (const match of matches) {
    for (const side of MATCH_SIDES) {
      for (const role of ROLES) {
        for (const color of ROLE_COLORS[role]) {
          for (const attribute of COLOR_ATTRIBUTES[color]) {
            const field = ATTRIBUTE_TO_FIELD[attribute];
            if (!field) {
              continue;
            }

            if (role === 'mid') {
              const player = match.player_stats[side]['2'];
              if (!player) {
                continue;
              }

              const value = getNumericStatValue(player, field);
              if (value === null) {
                continue;
              }

              recordSample(samples, role, color, attribute, value);
              continue;
            }

            const matchSideScore = averageFantasyScoresForPositions(
              match,
              side,
              ROLE_PLAYER_POSITIONS[role],
              attribute,
              field,
            );
            if (matchSideScore === null) {
              continue;
            }

            recordSample(samples, role, color, attribute, matchSideScore);
          }
        }
      }
    }
  }

  return samples;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function samplesToWeights(
  samples: Samples,
  reducer: (values: number[]) => number,
): StatWeights {
  const weights: StatWeights = { core: {}, mid: {}, support: {} };

  for (const role of ROLES) {
    for (const color of ROLE_COLORS[role]) {
      for (const attribute of COLOR_ATTRIBUTES[color]) {
        const bucket = samples[role][color]?.[attribute];
        if (!bucket || bucket.length === 0) {
          continue;
        }

        if (!weights[role][color]) {
          weights[role][color] = {};
        }

        const aggregated = reducer(bucket);
        weights[role][color]![attribute] =
          role === 'mid'
            ? applyFantasyScore(attribute, aggregated)
            : aggregated;
      }
    }
  }

  return weights;
}

export function getStatWeights(): StatWeights {
  return statWeights ?? { core: {}, mid: {}, support: {} };
}

export function isStatWeightsLoaded(): boolean {
  return statWeights !== null;
}

function computeStatWeightsAvg(matches: MatchMetrics[]): StatWeights {
  const samples = collectSamples(matches);
  return samplesToWeights(samples, (values) => {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  });
}

function computeStatWeightsPercentile(matches: MatchMetrics[], p: number): StatWeights {
  const samples = collectSamples(matches);
  return samplesToWeights(samples, (values) => percentile(values, p));
}

export function computeStatWeights(options: ComputeStatWeightsOptions): StatWeights {
  console.log("computeStatWeights", options);
  let matches = getMatchesByLeagues(options.leagueIds);

  if (options.minDuration && options.minDuration > 0) {
    matches = matches.filter((match) => match.duration > options.minDuration!);
  }

  if (options.weightMetric === 'avg') {
    statWeights = computeStatWeightsAvg(matches);
  } else {
    statWeights = computeStatWeightsPercentile(matches, Number(options.weightMetric.slice(1)) / 100);
  }

  return statWeights;
}
