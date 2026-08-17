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

type AvgAccumulator = { sum: number; count: number };

type AvgAccumulators = Record<
  Role,
  Partial<Record<StatColor, Partial<Record<Attribute, AvgAccumulator>>>>
>;

function createEmptyAccumulators(): AvgAccumulators {
  return { core: {}, mid: {}, support: {} };
}

function recordSample(
  acc: AvgAccumulators,
  role: Role,
  color: StatColor,
  attribute: Attribute,
  value: number,
): void {
  if (!acc[role][color]) {
    acc[role][color] = {};
  }

  const colorAcc = acc[role][color]!;
  if (!colorAcc[attribute]) {
    colorAcc[attribute] = { sum: 0, count: 0 };
  }

  colorAcc[attribute]!.sum += value;
  colorAcc[attribute]!.count += 1;
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

function accumulatorsToWeights(acc: AvgAccumulators): StatWeights {
  const weights: StatWeights = { core: {}, mid: {}, support: {} };

  for (const role of ROLES) {
    for (const color of ROLE_COLORS[role]) {
      for (const attribute of COLOR_ATTRIBUTES[color]) {
        const bucket = acc[role][color]?.[attribute];
        if (!bucket || bucket.count === 0) {
          continue;
        }

        if (!weights[role][color]) {
          weights[role][color] = {};
        }

        const avg = bucket.sum / bucket.count;
        weights[role][color]![attribute] =
          role === 'mid'
            ? applyFantasyScore(attribute, avg)
            : avg;
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
  const acc = createEmptyAccumulators();

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

              recordSample(acc, role, color, attribute, value);
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

            recordSample(acc, role, color, attribute, matchSideScore);
          }
        }
      }
    }
  }

  return accumulatorsToWeights(acc);
}

export function computeStatWeights(options: ComputeStatWeightsOptions): StatWeights {
  console.log("computeStatWeights", options);
  const matches = getMatchesByLeagues(options.leagueIds);

  if (options.weightMetric === 'avg') {
    statWeights = computeStatWeightsAvg(matches);
  } else {
    // top3 — placeholder until computeStatWeightsTop3 exists
    void matches;
    statWeights = {
      core: {
        red: { kills: 800 },
        green: { teamfight: 400 },
      },
      mid: {
        red: { gpm: 700 },
        green: { stuns: 500 },
        blue: { wardsPlaced: 300 },
      },
      support: {
        green: { courierKills: 200 },
        blue: { smokesUsed: 600 },
      },
    };
  }

  return statWeights;
}
