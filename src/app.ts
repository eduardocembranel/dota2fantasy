import { calculateOperationProbability } from './probability';
import type {
  AppState,
  Attribute,
  Banner,
  EmblemColor,
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

export function parseQuality(qualityLabel: string): Quality {
  const roman = qualityLabel.replace(/^Tier\s+/i, '').trim();
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

export function parseTrait(traitLabel: string): Trait {
  return TRAIT_LABEL_TO_TYPE[traitLabel] ?? 'fractal';
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

export function parseAttribute(attributeLabel: string): Attribute {
  return ATTRIBUTE_LABEL_TO_TYPE[attributeLabel] ?? 'towers';
}

export function parseRole(roleLabel: string): Role {
  const normalized = roleLabel.trim().toLowerCase();
  if (normalized === 'core' || normalized === 'mid' || normalized === 'support') {
    return normalized;
  }
  return 'core';
}

export function getEmblemColor(emblemEl: HTMLElement): EmblemColor {
  if (emblemEl.classList.contains('emblem--red')) return 'red';
  if (emblemEl.classList.contains('emblem--green')) return 'green';
  if (emblemEl.classList.contains('emblem--blue')) return 'blue';
  return 'unknown';
}

export function readBanner(columnEl: HTMLElement): Banner {
  const roleTitle = columnEl.querySelector('.role-title');
  const role = parseRole(roleTitle?.textContent ?? 'core');
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

function emitEmblemUpdated() {
  const state = refreshAppState();
  console.log('[emblem:updated]', state);
}

function parseOperationCategory(value: string | null): OperationCategory {
  if (value === 'stats' || value === 'quality' || value === 'trait') {
    return value;
  }
  return 'stats';
}

function emitOperationSelected(operation: string, category: OperationCategory) {
  const state = refreshAppState();
  const context = {
    operation,
    category,
    stage: state.stage,
    banners: state.banners,
  };
  const probability = calculateOperationProbability(context);
  const detail = { ...context, probability };

  console.log('[operation:selected]', detail);
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
      const operation = button.textContent?.trim() ?? '';

      emitOperationSelected(operation, category);
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
      refreshAppState();
    });
  });
}

export function initApp() {
  refreshAppState();
  initEmblemListeners();
  initOperationListeners();
  initOperationsTabs();
  initStageSelector();
  logAppState();
}
