import { initI18n, registerSimulationRerender } from './applyI18n';
import { renderSimulationResults } from './renderResults';
import {
  formatBonusPercent,
  formatTotalPercent,
  getEmblemTotalPercent,
  getQualityBonusPercent,
  getTraitBonusPercent,
} from './bannerScore';
import {
  BLUE_ATTRIBUTES,
  GREEN_ATTRIBUTES,
  RED_ATTRIBUTES,
} from './i18n';
import { calculateOperationOutcome } from './probability';
import type {
  AppState,
  Attribute,
  Banner,
  EmblemColor,
  Operation,
  OperationCategory,
  Quality,
  Role,
  Stage,
  Trait,
} from './types';

export const appState: AppState = {
  stage: 'groupStage',
  banners: {} as Record<Role, Banner>,
};

function getSelectValue(emblemEl: HTMLElement, selector: string): string {
  const select = emblemEl.querySelector<HTMLSelectElement>(selector);
  if (!select) {
    throw new Error(`Missing select "${selector}" inside emblem element`);
  }
  return select.value;
}

export function readEmblem(emblemEl: HTMLElement) {
  return {
    attribute: parseAttribute(getSelectValue(emblemEl, '.emblem-select')),
    quality: parseQuality(getSelectValue(emblemEl, '.quality-select')),
    trait: parseTrait(getSelectValue(emblemEl, '.trait-select')),
    color: getEmblemColor(emblemEl),
  };
}

export function parseQuality(qualityValue: string): Quality {
  const tier = Number(qualityValue);
  if (tier >= 1 && tier <= 5) {
    return tier as Quality;
  }

  const roman = qualityValue.replace(/^(Tier|Nível)\s+/i, '').trim();
  const map: Record<string, Quality> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  return map[roman] ?? 1;
}

const TRAIT_LABEL_TO_TYPE: Record<string, Trait> = {
  Fractal: 'fractal',
  Friendly: 'friendly',
  Benevolent: 'benevolent',
  Vampiric: 'vampiric',
  Unique: 'unique',
};

const TRAIT_VALUES: Trait[] = ['fractal', 'friendly', 'benevolent', 'vampiric', 'unique'];

export function parseTrait(traitValue: string): Trait {
  if ((TRAIT_VALUES as string[]).includes(traitValue)) {
    return traitValue as Trait;
  }
  return TRAIT_LABEL_TO_TYPE[traitValue] ?? 'fractal';
}

const ATTRIBUTE_LABEL_TO_TYPE: Record<string, Attribute> = {
  'Creep Score': 'creepScore',
  GPM: 'gpm',
  Deaths: 'deaths',
  Kills: 'kills',
  Towers: 'towers',
  'Madstones Collected': 'madstonesCollected',
  Teamfight: 'teamfight',
  Stuns: 'stuns',
  'Tormentor Kills': 'tormentorKills',
  'Roshan Kills': 'roshanKills',
  'First Blood': 'firstBlood',
  'Courier Kills': 'courierKills',
  'Wards Placed': 'wardsPlaced',
  'Camps Stacked': 'campsStacked',
  'Lotuses Gained': 'lotusesGained',
  'Watchers Taken': 'watchersTaken',
  'Runes Grabbed': 'runesGrabbed',
  'Smokes Used': 'smokesUsed',
};

const ALL_ATTRIBUTE_VALUES: Attribute[] = [
  ...RED_ATTRIBUTES,
  ...GREEN_ATTRIBUTES,
  ...BLUE_ATTRIBUTES,
];

export function parseAttribute(attributeValue: string): Attribute {
  if ((ALL_ATTRIBUTE_VALUES as string[]).includes(attributeValue)) {
    return attributeValue as Attribute;
  }
  return ATTRIBUTE_LABEL_TO_TYPE[attributeValue] ?? 'towers';
}

export function parseRole(roleLabel: string): Role {
  const normalized = roleLabel.trim().toLowerCase();
  if (normalized === 'core' || normalized === 'mid' || normalized === 'support') {
    return normalized;
  }
  return 'core';
}

const OPERATION_IDS = [
  'rerollStatForGreenEmblems',
  'rerollStatForFirstGreenEmblem',
  'rerollStatForLastGreenEmblem',
  'rerollStatForRandomGreenEmblem',
  'rerollStatForRedEmblems',
  'rerollStatForBlueEmblems',
  'randomlyIncreaseOneQuality',
  'randomlyIncreaseTwoQualitiesAndReduceOne',
  'rerollQualityForGreenEmblems',
  'rerollQualityForRedEmblems',
  'rerollQualityForFirstRedEmblem',
  'rerollQualityForLastRedEmblem',
  'rerollQualityForRandomRedEmblem',
  'rerollQualityForBlueEmblems',
  'rerollTraitForGreenEmblems',
  'rerollTraitForRedEmblems',
  'rerollTraitForBlueEmblems',
  'rerollTraitForFirstBlueEmblem',
  'rerollTraitForLastBlueEmblem',
  'rerollTraitForRandomBlueEmblem',
] as const satisfies readonly Operation[];

export function parseOperation(operationId: string): Operation {
  if ((OPERATION_IDS as readonly string[]).includes(operationId)) {
    return operationId as Operation;
  }
  return 'rerollStatForGreenEmblems';
}

export function getEmblemColor(emblemEl: HTMLElement): EmblemColor {
  if (emblemEl.classList.contains('emblem--red')) return 'red';
  if (emblemEl.classList.contains('emblem--green')) return 'green';
  if (emblemEl.classList.contains('emblem--blue')) return 'blue';
  return 'unknown';
}

export function readBanner(columnEl: HTMLElement): Banner {
  const roleTitle = columnEl.querySelector('.role-title');
  const roleFromData = roleTitle?.getAttribute('data-role');
  const role =
    roleFromData === 'core' || roleFromData === 'mid' || roleFromData === 'support'
      ? roleFromData
      : parseRole(roleTitle?.textContent ?? 'core');
  const emblems = [...columnEl.querySelectorAll<HTMLElement>('.emblem')].map(
    (emblemEl, index) => ({
      index,
      ...readEmblem(emblemEl),
    })
  );

  return { role, emblems };
}

export function getDashboardState(): Record<Role, Banner> {
  const banners = [...document.querySelectorAll<HTMLElement>('.column')].map(readBanner);
  return Object.fromEntries(banners.map((banner) => [banner.role, banner])) as Record<
    Role,
    Banner
  >;
}

export function getActiveStage(): Stage {
  const stage = document.body.getAttribute('data-active-stage');
  return stage === 'mainStage' ? 'mainStage' : 'groupStage';
}

export function refreshAppState(): AppState {
  appState.stage = getActiveStage();
  appState.banners = getDashboardState();
  return appState;
}

export function getAppState(): AppState {
  return refreshAppState();
}

function updateEmblemDisplay(emblemEl: HTMLElement): void {
  const columnEl = emblemEl.closest('.column');
  if (!(columnEl instanceof HTMLElement)) {
    return;
  }

  const banner = readBanner(columnEl);
  const emblemIndex = [...columnEl.querySelectorAll('.emblem')].indexOf(emblemEl);
  if (emblemIndex < 0) {
    return;
  }

  const stage = getActiveStage();
  const emblem = banner.emblems[emblemIndex];

  const qualityBonusEl = emblemEl.querySelector('.emblem-row:has(.quality-select) .value');
  const traitBonusEl = emblemEl.querySelector('.emblem-row:has(.trait-select) .value');
  const totalEl = emblemEl.querySelector('.emblem-total');

  if (qualityBonusEl) {
    qualityBonusEl.textContent = formatBonusPercent(getQualityBonusPercent(emblem.quality));
  }

  if (traitBonusEl) {
    traitBonusEl.textContent = formatBonusPercent(
      getTraitBonusPercent(banner, emblemIndex, stage)
    );
  }

  if (totalEl) {
    totalEl.textContent = formatTotalPercent(
      getEmblemTotalPercent(banner, emblemIndex, stage)
    );
  }
}

function syncBannerEmblemDisplays(columnEl: HTMLElement): void {
  columnEl.querySelectorAll<HTMLElement>('.emblem').forEach(updateEmblemDisplay);
}

function syncAllEmblemDisplays(): void {
  document.querySelectorAll<HTMLElement>('.emblem').forEach(updateEmblemDisplay);
}

function emitEmblemUpdated(event: Event): void {
  const select = event.target;
  if (select instanceof HTMLSelectElement) {
    const columnEl = select.closest('.column');
    if (columnEl instanceof HTMLElement) {
      syncBannerEmblemDisplays(columnEl);
    }
  }

  const state = refreshAppState();
  console.log('[emblem:updated]', state);
}

function parseOperationCategory(value: string | null): OperationCategory {
  if (value === 'stats' || value === 'quality' || value === 'trait') {
    return value;
  }
  return 'stats';
}

function getIgnoreFractalBonus(): boolean {
  const input = document.getElementById('ignore-fractal-bonus');
  return input instanceof HTMLInputElement && input.checked;
}

let lastSelectedOperation: {
  operation: Operation;
  category: OperationCategory;
  button: HTMLButtonElement;
} | null = null;

function rerunLastSimulation(): void {
  if (!lastSelectedOperation) {
    return;
  }

  emitOperationSelected(
    lastSelectedOperation.operation,
    lastSelectedOperation.category,
    lastSelectedOperation.button
  );
}

function emitOperationSelected(
  operation: Operation,
  category: OperationCategory,
  button: HTMLButtonElement
) {
  lastSelectedOperation = { operation, category, button };
  const state = refreshAppState();
  const ignoreFractalBonus = getIgnoreFractalBonus();
  const context = {
    operation,
    category,
    stage: state.stage,
    banners: state.banners,
    ignoreFractalBonus,
  };
  const outcome = calculateOperationOutcome(context);

  document.querySelectorAll<HTMLButtonElement>('.op-btn--selected').forEach((selectedButton) => {
    selectedButton.classList.remove('op-btn--selected');
  });
  button.classList.add('op-btn--selected');

  const resultsContainer = document.getElementById('simulation-results');
  if (resultsContainer) {
    renderSimulationResults(resultsContainer, operation, category, outcome, ignoreFractalBonus);
  }
}

export function logAppState(): AppState {
  const state = refreshAppState();
  console.log('[appState]', state);
  return state;
}

function initEmblemListeners() {
  const selects = document.querySelectorAll<HTMLSelectElement>(
    '.emblem-select, .quality-select, .trait-select'
  );

  selects.forEach((select) => {
    select.addEventListener('change', emitEmblemUpdated);
  });
}

function initOperationListeners() {
  const operationButtons = document.querySelectorAll<HTMLButtonElement>('.op-btn');

  operationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const contentEl = button.closest('.op-content');
      const category = parseOperationCategory(contentEl?.getAttribute('data-content') ?? null);
      const operation = parseOperation(button.getAttribute('data-operation') ?? '');

      emitOperationSelected(operation, category, button);
    });
  });
}

function initOperationsTabs() {
  const panels = document.querySelectorAll<HTMLElement>('.operations-panel');

  panels.forEach((panel) => {
    const tabs = panel.querySelectorAll<HTMLButtonElement>('.op-tab-btn');
    const contents = panel.querySelectorAll<HTMLElement>('.op-content');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        contents.forEach((c) => c.classList.remove('active'));

        tab.classList.add('active');

        const target = tab.getAttribute('data-target');
        const targetContent = panel.querySelector<HTMLElement>(
          `.op-content[data-content="${target}"]`
        );
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  });
}

function initStageSelector() {
  const stageBtns = document.querySelectorAll<HTMLButtonElement>('.stage-btn');

  stageBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      stageBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const stage = btn.getAttribute('data-stage');
      if (stage) {
        document.body.setAttribute('data-active-stage', stage);
      }
      syncAllEmblemDisplays();
      refreshAppState();
    });
  });
}

function initFractalToggle() {
  const input = document.getElementById('ignore-fractal-bonus');
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  input.addEventListener('change', rerunLastSimulation);
}

export function initApp() {
  initI18n();
  syncAllEmblemDisplays();
  refreshAppState();
  initEmblemListeners();
  initOperationListeners();
  initOperationsTabs();
  initStageSelector();
  initFractalToggle();
  registerSimulationRerender(rerunLastSimulation);
  logAppState();
}
