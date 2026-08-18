import type { Attribute, Role } from '../types';

export type WeightMetric = 'avg' | 'p50' | 'p60' | 'p70' | 'p80' | 'p90';

export interface ComputeStatWeightsOptions {
  leagueIds: string[];
  weightMetric: WeightMetric;
  minDuration?: number;
}

export type StatColor = 'red' | 'green' | 'blue';

/** role → emblem color → stat → weight */
export type StatWeights = Record<
  Role,
  Partial<Record<StatColor, Partial<Record<Attribute, number>>>>
>;
