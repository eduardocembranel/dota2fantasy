export type EmblemColor = 'red' | 'green' | 'blue' | 'unknown';

export type Stage = 'groupStage' | 'mainStage';

export type OperationCategory = 'stats' | 'quality' | 'trait';

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
  operation: string;
  category: OperationCategory;
  stage: Stage;
  banners: Record<Role, Banner>;
}

export interface ProbabilityInputs {
  improveChance: number;
  worsenChance: number;
  avgImprove: number;
  avgWorsen: number;
}

export interface ProbabilityBreakdown extends ProbabilityInputs {
  expectedOutcome: number;
}

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
  calculateExpectedOutcome: (input: ProbabilityInputs) => number;
  calculateOperationProbability: (context: OperationContext) => ProbabilityBreakdown;
  resolveOperationRules: (context: OperationContext) => ProbabilityInputs;
}
