import type { Banner, BannerScoreOptions, Quality, Stage, Trait } from './types';
import type { StatWeights } from './statsRanking/types';

const GROUP_STAGE_EMBLEM_COUNT = 3;
const MAIN_STAGE_EMBLEM_COUNT = 5;

const EMBLEM_BASE_PERCENT = 100;

const QUALITY_BONUS: Record<Quality, number> = {
  1: 10,
  2: 30,
  3: 60,
  4: 100,
  5: 150,
};

export function getQualityBonusPercent(quality: Quality): number {
  return QUALITY_BONUS[quality];
}

function getActiveEmblemCount(stage: Stage): number {
  return stage === 'groupStage' ? GROUP_STAGE_EMBLEM_COUNT : MAIN_STAGE_EMBLEM_COUNT;
}

export { getActiveEmblemCount };

function isActiveEmblem(emblemIndex: number, stage: Stage): boolean {
  return emblemIndex < getActiveEmblemCount(stage);
}

function getActiveEmblems(banner: Banner, stage: Stage) {
  return banner.emblems.slice(0, getActiveEmblemCount(stage));
}

function allActiveQualitiesDiffer(banner: Banner, stage: Stage): boolean {
  const qualities = getActiveEmblems(banner, stage).map((emblem) => emblem.quality);
  return new Set(qualities).size === qualities.length;
}

function countActiveTrait(banner: Banner, stage: Stage, trait: Trait): number {
  return getActiveEmblems(banner, stage).filter((emblem) => emblem.trait === trait).length;
}

function getAdjacentActiveIndices(emblemIndex: number, stage: Stage): number[] {
  if (!isActiveEmblem(emblemIndex, stage)) {
    return [];
  }

  const adjacentIndices: number[] = [];
  if (emblemIndex > 0) {
    adjacentIndices.push(emblemIndex - 1);
  }
  if (emblemIndex < getActiveEmblemCount(stage) - 1) {
    adjacentIndices.push(emblemIndex + 1);
  }

  return adjacentIndices;
}

function getOwnTraitBonus(
  banner: Banner,
  emblemIndex: number,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  const emblem = banner.emblems[emblemIndex];
  if (!emblem || !isActiveEmblem(emblemIndex, stage)) {
    return 0;
  }

  switch (emblem.trait) {
    case 'fractal':
      if (options?.fractalOwnBonusAlwaysZero) {
        return 0;
      }
      return allActiveQualitiesDiffer(banner, stage) ? 60 : 0;
    case 'friendly':
      return countActiveTrait(banner, stage, 'friendly') >= 3 ? 50 : 0;
    case 'unique':
      return countActiveTrait(banner, stage, 'unique') === 1 ? 30 : 0;
    case 'benevolent':
      return 0;
    case 'vampiric':
      return 50;
    default:
      return 0;
  }
}

function getAdjacentTraitBonus(banner: Banner, emblemIndex: number, stage: Stage): number {
  if (!isActiveEmblem(emblemIndex, stage)) {
    return 0;
  }

  let bonus = 0;

  for (const neighborIndex of getAdjacentActiveIndices(emblemIndex, stage)) {
    const neighbor = banner.emblems[neighborIndex];
    if (!neighbor) {
      continue;
    }

    if (neighbor.trait === 'benevolent') {
      bonus += 20;
    }

    if (neighbor.trait === 'vampiric') {
      bonus -= 10;
    }
  }

  return bonus;
}

export function getTraitBonusPercent(
  banner: Banner,
  emblemIndex: number,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  if (!banner.emblems[emblemIndex] || !isActiveEmblem(emblemIndex, stage)) {
    return 0;
  }

  return (
    getOwnTraitBonus(banner, emblemIndex, stage, options) +
    getAdjacentTraitBonus(banner, emblemIndex, stage)
  );
}

export function getEmblemTotalPercent(
  banner: Banner,
  emblemIndex: number,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  const emblem = banner.emblems[emblemIndex];
  if (!emblem) {
    return 0;
  }

  return (
    EMBLEM_BASE_PERCENT +
    getQualityBonusPercent(emblem.quality) +
    getTraitBonusPercent(banner, emblemIndex, stage, options)
  );
}

export function formatBonusPercent(value: number): string {
  if (value === 0) {
    return '0%';
  }

  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
}

export function formatTotalPercent(value: number): string {
  return `${value}%`;
}

export function getBannerTotalPercent(
  banner: Banner,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  let total = 0;

  for (let emblemIndex = 0; emblemIndex < getActiveEmblemCount(stage); emblemIndex += 1) {
    total += getEmblemTotalPercent(banner, emblemIndex, stage, options);
  }

  return total;
}

export function getBannerDeltaTotalPercent(
  original: Banner,
  simulated: Banner,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  const originalTotal = getBannerTotalPercent(original, stage, options);
  const simulatedTotal = getBannerTotalPercent(simulated, stage, options);
  return simulatedTotal - originalTotal;
}

function getBannerQualityTotalPercent(banner: Banner, stage: Stage): number {
  let total = 0;

  for (let emblemIndex = 0; emblemIndex < getActiveEmblemCount(stage); emblemIndex += 1) {
    total += getQualityBonusPercent(banner.emblems[emblemIndex].quality);
  }

  return total;
}

export function getBannerQualityDeltaPercent(
  original: Banner,
  simulated: Banner,
  stage: Stage
): number {
  const originalTotal = getBannerQualityTotalPercent(original, stage);
  const simulatedTotal = getBannerQualityTotalPercent(simulated, stage);
  return simulatedTotal - originalTotal;
}

function getBannerTraitTotalPercent(
  banner: Banner,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  let total = 0;

  for (let emblemIndex = 0; emblemIndex < getActiveEmblemCount(stage); emblemIndex += 1) {
    total += getTraitBonusPercent(banner, emblemIndex, stage, options);
  }

  return total;
}

export function getBannerTraitDeltaPercent(
  original: Banner,
  simulated: Banner,
  stage: Stage,
  options?: BannerScoreOptions
): number {
  const originalTotal = getBannerTraitTotalPercent(original, stage, options);
  const simulatedTotal = getBannerTraitTotalPercent(simulated, stage, options);
  return simulatedTotal - originalTotal;
}

function getEmblemStatWeight(
  banner: Banner,
  emblemIndex: number,
  stage: Stage,
  statWeights: StatWeights
): number {
  const emblem = banner.emblems[emblemIndex];
  if (!emblem || !isActiveEmblem(emblemIndex, stage)) {
    return 0;
  }

  const color = emblem.color;
  if (color !== 'red' && color !== 'green' && color !== 'blue') {
    return 0;
  }

  return statWeights[banner.role]?.[color]?.[emblem.attribute] ?? 0;
}

export function getEmblemOverallScore(
  banner: Banner,
  emblemIndex: number,
  stage: Stage,
  statWeights: StatWeights,
  options?: BannerScoreOptions
): number {
  const emblemPercent = getEmblemTotalPercent(banner, emblemIndex, stage, options);
  const statWeight = getEmblemStatWeight(banner, emblemIndex, stage, statWeights);
  return (emblemPercent / 100) * statWeight;
}

export function getBannerStatWeight(
  banner: Banner,
  stage: Stage,
  statWeights: StatWeights
): number {
  let total = 0;

  for (let emblemIndex = 0; emblemIndex < getActiveEmblemCount(stage); emblemIndex += 1) {
    total += getEmblemStatWeight(banner, emblemIndex, stage, statWeights);
  }
  
  return total;
}

export function getBannerStatWeightDelta(
  original: Banner,
  simulated: Banner,
  stage: Stage,
  statWeights: StatWeights
): number {
  return (
    getBannerStatWeight(simulated, stage, statWeights) -
    getBannerStatWeight(original, stage, statWeights)
  );
}

export function getBannerOverallScore(
  banner: Banner,
  stage: Stage,
  statWeights: StatWeights,
  options?: BannerScoreOptions
): number {
  let total = 0;

  for (let emblemIndex = 0; emblemIndex < getActiveEmblemCount(stage); emblemIndex += 1) {
    total += getEmblemOverallScore(banner, emblemIndex, stage, statWeights, options);
  }

  return total;
}

export function getBannerOverallScoreDelta(
  original: Banner,
  simulated: Banner,
  stage: Stage,
  statWeights: StatWeights,
  options?: BannerScoreOptions
): number {
  return (
    getBannerOverallScore(simulated, stage, statWeights, options) -
    getBannerOverallScore(original, stage, statWeights, options)
  );
}
