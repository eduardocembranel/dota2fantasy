import {
  getBannerDeltaPercent,
  getBannerQualityDeltaPercent,
  getBannerTraitDeltaPercent,
} from './bannerScore';
import { applyOperation } from './operations/appliers';
import type {
  ApplyOperationInput,
  Banner,
  BannerDeltaFn,
  BannerOperationSummary,
  OperationContext,
  OperationOutcome,
  OperationSimulationResult,
  Role,
  Stage,
} from './types';

const NUM_SIMULATIONS = 15000;
const ROLES: Role[] = ['core', 'mid', 'support'];

export function calculateOperationOutcome(
  context: OperationContext
): OperationSimulationResult {
  const simulationResults = Object.fromEntries(
    ROLES.map((role) => [role, simulateBanner(context.banners[role], context)])
  ) as Record<Role, BannerOperationSummary>;

  return { numSimulations: NUM_SIMULATIONS, simulationResults };
}

function simulateBanner(
  banner: Banner,
  context: OperationContext
): BannerOperationSummary {
  const input: ApplyOperationInput = {
    operation: context.operation,
    banner,
    stage: context.stage,
  };

  const simulation = runSimulations(input);
  if (simulation.status === 'skipped') {
    return { status: 'skipped', reason: simulation.reason };
  }

  return {
    status: 'simulated',
    ...summarizeBanner(banner, simulation.banners, context),
  };
}

function getBannerScoreOptions(context: OperationContext) {
  return context.ignoreFractalBonus ? { fractalOwnBonusAlwaysZero: true } : undefined;
}

function summarizeBanner(
  originalBanner: Banner,
  simulatedBanners: Banner[],
  context: OperationContext
): Pick<
  Extract<BannerOperationSummary, { status: 'simulated' }>,
  'qualityOutcome' | 'traitOutcome' | 'emblemTotalOutcome'
> {
  const scoreOptions = getBannerScoreOptions(context);
  const stage = context.stage;

  return {
    qualityOutcome: summarizeSimulationOutcomes(
      originalBanner,
      simulatedBanners,
      stage,
      getBannerQualityDeltaPercent
    ),
    emblemTotalOutcome: summarizeSimulationOutcomes(
      originalBanner,
      simulatedBanners,
      stage,
      (original, simulated, simulationStage) =>
        getBannerDeltaPercent(original, simulated, simulationStage, scoreOptions)
    ),
    traitOutcome: summarizeSimulationOutcomes(
      originalBanner,
      simulatedBanners,
      stage,
      (original, simulated, simulationStage) =>
        getBannerTraitDeltaPercent(original, simulated, simulationStage, scoreOptions)
    ),
  };
}

function summarizeSimulationOutcomes(
  originalBanner: Banner,
  simulatedBanners: Banner[],
  stage: Stage,
  getDelta: BannerDeltaFn
): OperationOutcome {
  let improveCount = 0;
  let worsenCount = 0;
  let neutralCount = 0;
  let improveSum = 0;
  let worsenSum = 0;
  let deltaSum = 0;

  for (const simulatedBanner of simulatedBanners) {
    const delta = getDelta(originalBanner, simulatedBanner, stage);

    deltaSum += delta;

    if (delta > 0) {
      improveCount += 1;
      improveSum += delta;
    } else if (delta < 0) {
      worsenCount += 1;
      worsenSum += delta;
    } else {
      neutralCount += 1;
    }
  }

  const total = simulatedBanners.length;
  const improveChance = improveCount / total;
  const worsenChance = worsenCount / total;
  const neutralChance = neutralCount / total;
  const avgImprove = improveCount > 0 ? improveSum / improveCount : 0;
  const avgWorsen = worsenCount > 0 ? worsenSum / worsenCount : 0;
  const expectedOutcome = deltaSum / total;

  return {
    improveChance,
    worsenChance,
    neutralChance,
    avgImprove,
    avgWorsen,
    expectedOutcome,
  };
}

type RunSimulationsResult =
  | { status: 'skipped'; reason: string }
  | { status: 'simulated'; banners: Banner[] };

function runSimulations(input: ApplyOperationInput): RunSimulationsResult {
  const banners: Banner[] = [];

  for (let i = 0; i < NUM_SIMULATIONS; i += 1) {
    const result = applyOperation(input);
    if (result.status === 'skipped') {
      return { status: 'skipped', reason: result.reason };
    }
    banners.push(result.banner);
  }

  return { status: 'simulated', banners };
}
