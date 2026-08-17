import type { Attribute, Role } from '../types';

export type WeightMetric = 'avg' | 'top3';

export interface ComputeStatWeightsOptions {
  leagueIds: string[];
  weightMetric: WeightMetric;
}

export type StatColor = 'red' | 'green' | 'blue';

/** role → emblem color → stat → weight */
export type StatWeights = Record<
  Role,
  Partial<Record<StatColor, Partial<Record<Attribute, number>>>>
>;
