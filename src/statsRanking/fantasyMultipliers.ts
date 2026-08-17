import type { Attribute } from '../types';

/** Linear multiplier: fantasy score = stat value × multiplier */
export const FANTASY_MULTIPLIERS: Partial<Record<Attribute, number>> = {
  kills: 107,
  creepScore: 3,
  gpm: 2,
  madstonesCollected: 13,
  towers: 352,
  teamfight: 2124,
  stuns: 10,
  firstBlood: 1934,
  tormentorKills: 1934,
  roshanKills: 1172,
  courierKills: 703,
  wardsPlaced: 117,
  campsStacked: 234,
  lotusesGained: 176,
  watchersTaken: 147,
  runesGrabbed: 141,
  smokesUsed: 293,
};

const DEATHS_BASE = 1950;
const DEATHS_PENALTY_PER_DEATH = 195;

/**
 * Applies the fantasy score formula for a stat average.
 * Most stats: value × multiplier. Deaths: max(0, 1950 − deaths × 195).
 * Stats without a defined multiplier keep the raw average.
 */
export function applyFantasyScore(attribute: Attribute, value: number): number {
  if (attribute === 'deaths') {
    return Math.max(0, DEATHS_BASE - value * DEATHS_PENALTY_PER_DEATH);
  }

  const multiplier = FANTASY_MULTIPLIERS[attribute];
  if (multiplier === undefined) {
    return value;
  }

  return value * multiplier;
}
