import type {
  OperationContext,
  ProbabilityBreakdown,
  ProbabilityInputs,
} from './types';

export function calculateExpectedOutcome({
  improveChance,
  worsenChance,
  avgImprove,
  avgWorsen,
}: ProbabilityInputs): number {
  return improveChance * avgImprove - worsenChance * avgWorsen;
}

export function calculateOperationProbability(
  context: OperationContext
): ProbabilityBreakdown {
  const breakdown = resolveOperationRules(context);

  return {
    ...breakdown,
    expectedOutcome: calculateExpectedOutcome(breakdown),
  };
}

export function resolveOperationRules(_context: OperationContext): ProbabilityInputs {

  // TODO: implement per-operation rules based on game knowledge
  return {
    improveChance: 0,
    worsenChance: 0,
    avgImprove: 0,
    avgWorsen: 0,
  };
}
