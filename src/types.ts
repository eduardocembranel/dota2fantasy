export type EmblemColor = 'red' | 'green' | 'blue' | 'unknown';

export type SkipReason =
  | 'noEligibleEmblems'
  | 'lessThanTwoEligibleEmblems'
  | { type: 'noColorEmblemsToReroll'; color: Exclude<EmblemColor, 'unknown'> };

export type Stage = 'groupStage' | 'mainStage';

export type OperationCategory = 'stats' | 'quality' | 'trait';

export type RerollStatForGreenEmblemsOperation = 'rerollStatForGreenEmblems';
export type RerollStatForFirstGreenEmblemOperation = 'rerollStatForFirstGreenEmblem';
export type RerollStatForLastGreenEmblemOperation = 'rerollStatForLastGreenEmblem';
export type RerollStatForRandomGreenEmblemOperation = 'rerollStatForRandomGreenEmblem';
export type RerollStatForRedEmblemsOperation = 'rerollStatForRedEmblems';
export type RerollStatForBlueEmblemsOperation = 'rerollStatForBlueEmblems';

export type StatsOperation =
  | RerollStatForGreenEmblemsOperation
  | RerollStatForFirstGreenEmblemOperation
  | RerollStatForLastGreenEmblemOperation
  | RerollStatForRandomGreenEmblemOperation
  | RerollStatForRedEmblemsOperation
  | RerollStatForBlueEmblemsOperation;

export type RandomlyIncreaseOneQualityOperation = 'randomlyIncreaseOneQuality';
export type RandomlyIncreaseTwoQualitiesAndReduceOneOperation =
  'randomlyIncreaseTwoQualitiesAndReduceOne';
export type RerollQualityForGreenEmblemsOperation = 'rerollQualityForGreenEmblems';
export type RerollQualityForRedEmblemsOperation = 'rerollQualityForRedEmblems';
export type RerollQualityForFirstRedEmblemOperation = 'rerollQualityForFirstRedEmblem';
export type RerollQualityForLastRedEmblemOperation = 'rerollQualityForLastRedEmblem';
export type RerollQualityForRandomRedEmblemOperation = 'rerollQualityForRandomRedEmblem';
export type RerollQualityForBlueEmblemsOperation = 'rerollQualityForBlueEmblems';

export type QualityOperation =
  | RandomlyIncreaseOneQualityOperation
  | RandomlyIncreaseTwoQualitiesAndReduceOneOperation
  | RerollQualityForGreenEmblemsOperation
  | RerollQualityForRedEmblemsOperation
  | RerollQualityForFirstRedEmblemOperation
  | RerollQualityForLastRedEmblemOperation
  | RerollQualityForRandomRedEmblemOperation
  | RerollQualityForBlueEmblemsOperation;

export type RerollTraitForGreenEmblemsOperation = 'rerollTraitForGreenEmblems';
export type RerollTraitForRedEmblemsOperation = 'rerollTraitForRedEmblems';
export type RerollTraitForBlueEmblemsOperation = 'rerollTraitForBlueEmblems';
export type RerollTraitForFirstBlueEmblemOperation = 'rerollTraitForFirstBlueEmblem';
export type RerollTraitForLastBlueEmblemOperation = 'rerollTraitForLastBlueEmblem';
export type RerollTraitForRandomBlueEmblemOperation = 'rerollTraitForRandomBlueEmblem';

export type TraitOperation =
  | RerollTraitForGreenEmblemsOperation
  | RerollTraitForRedEmblemsOperation
  | RerollTraitForBlueEmblemsOperation
  | RerollTraitForFirstBlueEmblemOperation
  | RerollTraitForLastBlueEmblemOperation
  | RerollTraitForRandomBlueEmblemOperation;

export type Operation = StatsOperation | QualityOperation | TraitOperation;

export const OPERATION_CATEGORY: Record<Operation, OperationCategory> = {
  rerollStatForGreenEmblems: 'stats',
  rerollStatForFirstGreenEmblem: 'stats',
  rerollStatForLastGreenEmblem: 'stats',
  rerollStatForRandomGreenEmblem: 'stats',
  rerollStatForRedEmblems: 'stats',
  rerollStatForBlueEmblems: 'stats',
  randomlyIncreaseOneQuality: 'quality',
  randomlyIncreaseTwoQualitiesAndReduceOne: 'quality',
  rerollQualityForGreenEmblems: 'quality',
  rerollQualityForRedEmblems: 'quality',
  rerollQualityForFirstRedEmblem: 'quality',
  rerollQualityForLastRedEmblem: 'quality',
  rerollQualityForRandomRedEmblem: 'quality',
  rerollQualityForBlueEmblems: 'quality',
  rerollTraitForGreenEmblems: 'trait',
  rerollTraitForRedEmblems: 'trait',
  rerollTraitForBlueEmblems: 'trait',
  rerollTraitForFirstBlueEmblem: 'trait',
  rerollTraitForLastBlueEmblem: 'trait',
  rerollTraitForRandomBlueEmblem: 'trait',
};

export const OPERATION_LABELS: Record<Operation, string> = {
  rerollStatForGreenEmblems: 'Reroll Stat for Green Emblems',
  rerollStatForFirstGreenEmblem: 'Reroll Stat for the first Green Emblem',
  rerollStatForLastGreenEmblem: 'Reroll Stat for the last Green Emblem',
  rerollStatForRandomGreenEmblem: 'Reroll Stat for one random Green Emblem',
  rerollStatForRedEmblems: 'Reroll Stat for Red Emblems',
  rerollStatForBlueEmblems: 'Reroll Stat for Blue Emblems',
  randomlyIncreaseOneQuality: 'Randomly increase one Quality',
  randomlyIncreaseTwoQualitiesAndReduceOne:
    'Randomly increase two Qualities and reduce one',
  rerollQualityForGreenEmblems: 'Reroll Quality for Green Emblems',
  rerollQualityForRedEmblems: 'Reroll Quality for Red Emblems',
  rerollQualityForFirstRedEmblem: 'Reroll Quality for the first Red Emblem',
  rerollQualityForLastRedEmblem: 'Reroll Quality for the last Red Emblem',
  rerollQualityForRandomRedEmblem: 'Reroll Quality for one random Red Emblem',
  rerollQualityForBlueEmblems: 'Reroll Quality for Blue Emblems',
  rerollTraitForGreenEmblems: 'Reroll Trait for Green Emblems',
  rerollTraitForRedEmblems: 'Reroll Trait for Red Emblems',
  rerollTraitForBlueEmblems: 'Reroll Trait for Blue Emblems',
  rerollTraitForFirstBlueEmblem: 'Reroll Trait for the first Blue Emblem',
  rerollTraitForLastBlueEmblem: 'Reroll Trait for the last Blue Emblem',
  rerollTraitForRandomBlueEmblem: 'Reroll Trait for one random Blue Emblem',
};

export type CoreRole = 'core';
export type MidRole = 'mid';
export type SupportRole = 'support';

export type Role = CoreRole | MidRole | SupportRole;

export type TierI = 1;
export type TierII = 2;
export type TierIII = 3;
export type TierIV = 4;
export type TierV = 5;

export type Quality = TierI | TierII | TierIII | TierIV | TierV;

export type FractalTrait = 'fractal';
export type FriendlyTrait = 'friendly';
export type BenevolentTrait = 'benevolent';
export type VampiricTrait = 'vampiric';
export type UniqueTrait = 'unique';

export type Trait =
  | FractalTrait
  | FriendlyTrait
  | BenevolentTrait
  | VampiricTrait
  | UniqueTrait;

export type CreepScoreAttribute = 'creepScore';
export type GpmAttribute = 'gpm';
export type DeathsAttribute = 'deaths';
export type KillsAttribute = 'kills';
export type TowersAttribute = 'towers';
export type MadstonesCollectedAttribute = 'madstonesCollected';

export type RedAttribute =
  | CreepScoreAttribute
  | GpmAttribute
  | DeathsAttribute
  | KillsAttribute
  | TowersAttribute
  | MadstonesCollectedAttribute;

export type TeamfightAttribute = 'teamfight';
export type StunsAttribute = 'stuns';
export type TormentorKillsAttribute = 'tormentorKills';
export type RoshanKillsAttribute = 'roshanKills';
export type FirstBloodAttribute = 'firstBlood';
export type CourierKillsAttribute = 'courierKills';

export type GreenAttribute =
  | TeamfightAttribute
  | StunsAttribute
  | TormentorKillsAttribute
  | RoshanKillsAttribute
  | FirstBloodAttribute
  | CourierKillsAttribute;

export type WardsPlacedAttribute = 'wardsPlaced';
export type CampsStackedAttribute = 'campsStacked';
export type LotusesGainedAttribute = 'lotusesGained';
export type WatchersTakenAttribute = 'watchersTaken';
export type RunesGrabbedAttribute = 'runesGrabbed';
export type SmokesUsedAttribute = 'smokesUsed';

export type BlueAttribute =
  | WardsPlacedAttribute
  | CampsStackedAttribute
  | LotusesGainedAttribute
  | WatchersTakenAttribute
  | RunesGrabbedAttribute
  | SmokesUsedAttribute;

export type Attribute = RedAttribute | GreenAttribute | BlueAttribute;

export interface Emblem {
  index: number;
  attribute: Attribute;
  quality: Quality;
  trait: Trait;
  color: EmblemColor;
}

export interface Banner {
  role: Role;
  emblems: Emblem[];
}

export interface AppState {
  stage: Stage;
  banners: Record<Role, Banner>;
}

export interface OperationContext {
  operation: Operation;
  category: OperationCategory;
  stage: Stage;
  banners: Record<Role, Banner>;
  ignoreFractalBonus: boolean;
}

export interface OperationOutcome {
  improveChance: number;
  worsenChance: number;
  neutralChance: number;
  avgImprove: number;
  avgWorsen: number;
  expectedOutcome: number;
}

export type BannerOperationSummary =
  | {
      status: 'simulated';
      qualityOutcome: OperationOutcome;
      traitOutcome: OperationOutcome;
      emblemTotalOutcome: OperationOutcome;
    }
  | {
      status: 'skipped';
      reason: SkipReason;
    };

export interface OperationSimulationResult {
  numSimulations: number;
  simulationResults: Record<Role, BannerOperationSummary>;
}

export type BannerDeltaFn = (
  original: Banner,
  simulated: Banner,
  stage: Stage,
  options?: BannerScoreOptions
) => number;

export interface BannerScoreOptions {
  fractalOwnBonusAlwaysZero?: boolean;
}

export interface ApplyOperationInput {
  operation: Operation;
  banner: Banner;
  stage: Stage;
}

export type ApplyOperationResult =
  | { status: 'applied'; banner: Banner }
  | { status: 'skipped'; reason: SkipReason };

export type OperationApplier = (input: ApplyOperationInput) => ApplyOperationResult;

export interface DotaFantasyAPI {
  appState: AppState;
  readEmblem: (emblemEl: HTMLElement) => Omit<Emblem, 'index'>;
  readBanner: (columnEl: HTMLElement) => Banner;
  getDashboardState: () => Record<Role, Banner>;
  getAppState: () => AppState;
  getActiveStage: () => Stage;
  refreshAppState: () => AppState;
  logAppState: () => AppState;
  parseQuality: (qualityLabel: string) => Quality;
  parseTrait: (traitLabel: string) => Trait;
  parseAttribute: (attributeLabel: string) => Attribute;
  parseRole: (roleLabel: string) => Role;
  parseOperation: (operationId: string) => Operation;
  calculateOperationOutcome: (context: OperationContext) => OperationSimulationResult;
}
