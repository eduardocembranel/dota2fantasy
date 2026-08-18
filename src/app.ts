import { initI18n, registerSimulationOptionsRerender, registerSimulationRerender, refreshStatRankPreviewLabels } from './applyI18n';
import { getLanguage, getTranslations } from './i18n';
import { computeStatWeights, getStatWeights } from './statsRanking/computeStatWeights';
import { getMatchesByLeagues, getAvailableLeagues, isMatchMetricsLoaded } from './matchMetrics/loadMatchMetrics';
import type { WeightMetric } from './statsRanking/types';
import { renderSimulationResults } from './renderResults';
import {
  formatBonusPercent,
  formatTotalPercent,
  getBannerOverallScore,
  getEmblemOverallScore,
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
import {
  OPERATION_CATEGORY,
  type AppState,
  type Attribute,
  type Banner,
  type EmblemColor,
  type Operation,
  type OperationCategory,
  type Quality,
  type Role,
  type Stage,
  type Trait,
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
  const scoreEl = emblemEl.querySelector('.emblem-expected-score');

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

  if (scoreEl) {
    const statWeights = getStatWeights();
    scoreEl.textContent = String(Math.round(getEmblemOverallScore(banner, emblemIndex, stage, statWeights) * 2));
  }
}

function syncBannerEmblemDisplays(columnEl: HTMLElement): void {
  columnEl.querySelectorAll<HTMLElement>('.emblem').forEach(updateEmblemDisplay);
  updateBannerExpectedScore(columnEl);
}

function updateBannerExpectedScore(columnEl: HTMLElement): void {
  const banner = readBanner(columnEl);
  const stage = getActiveStage();
  const statWeights = getStatWeights();
  const expectedScore = Math.round(getBannerOverallScore(banner, stage, statWeights) * 2);

  const labelEl = columnEl.querySelector('.banner-expected-score__label');
  if (labelEl) {
    labelEl.textContent = getTranslations(getLanguage()).expectedScoreLabel;
  }

  const valueEl = columnEl.querySelector('.banner-expected-score__value');
  if (valueEl) {
    valueEl.textContent = String(expectedScore);
  }
}

function syncAllBannerExpectedScores(): void {
  document.querySelectorAll<HTMLElement>('.column').forEach(updateBannerExpectedScore);
}

function syncAllEmblemDisplays(): void {
  document.querySelectorAll<HTMLElement>('.emblem').forEach(updateEmblemDisplay);
  syncAllBannerExpectedScores();
}

function injectEmblemExpectedScores(): void {
  document.querySelectorAll<HTMLElement>('.emblem').forEach((emblemEl) => {
    if (emblemEl.querySelector('.emblem-expected-score')) {
      return;
    }

    const traitRow = emblemEl.querySelector<HTMLElement>('.emblem-row:has(.trait-select)');
    const scoreEl = document.createElement('span');
    scoreEl.className = 'emblem-expected-score';

    if (traitRow) {
      traitRow.append(scoreEl);
    } else {
      emblemEl.append(scoreEl);
    }
  });
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
    renderSimulationResults(resultsContainer, operation, outcome, ignoreFractalBonus);
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
      const operation = parseOperation(button.getAttribute('data-operation') ?? '');
      const category = OPERATION_CATEGORY[operation];

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

  input.addEventListener('change', () => {
    updateSimulationPanelSummary();
    rerunLastSimulation();
  });
}

const ROLES: Role[] = ['core', 'mid', 'support'];

const ROLE_EMBLEM_COLORS: Record<Role, Array<Exclude<EmblemColor, 'unknown'>>> = {
  core: ['red', 'green'],
  mid: ['red', 'green', 'blue'],
  support: ['green', 'blue'],
};

const COLOR_ATTRIBUTES: Record<Exclude<EmblemColor, 'unknown'>, Attribute[]> = {
  red: RED_ATTRIBUTES,
  green: GREEN_ATTRIBUTES,
  blue: BLUE_ATTRIBUTES,
};

function getStatRankGroupLabel(color: Exclude<EmblemColor, 'unknown'>): string {
  const copy = getTranslations(getLanguage());
  if (color === 'red') {
    return copy.statRankGroupRed;
  }
  if (color === 'green') {
    return copy.statRankGroupGreen;
  }
  return copy.statRankGroupBlue;
}

function getStatRankSortValue(rankEl: HTMLElement): number {
  const text = rankEl.textContent?.trim() ?? '';
  if (text === '—' || text === '') {
    return Number.NEGATIVE_INFINITY;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function sortStatRankListsDescending(): void {
  document.querySelectorAll<HTMLUListElement>('.stat-rank-list').forEach((list) => {
    const items = Array.from(list.querySelectorAll<HTMLLIElement>('.stat-rank-list__item'));
    items.sort((a, b) => {
      const aRank = a.querySelector<HTMLElement>('.stat-rank-list__rank');
      const bRank = b.querySelector<HTMLElement>('.stat-rank-list__rank');
      const aValue = aRank ? getStatRankSortValue(aRank) : Number.NEGATIVE_INFINITY;
      const bValue = bRank ? getStatRankSortValue(bRank) : Number.NEGATIVE_INFINITY;
      return bValue - aValue;
    });

    items.forEach((item) => list.append(item));
  });
}

function buildStatRankPreviewTables(): void {
  const container = document.getElementById('stat-rank-preview-root');
  if (!container) {
    return;
  }

  container.replaceChildren();

  const columns = document.createElement('div');
  columns.className = 'stat-rank-columns';

  for (const role of ROLES) {
    const column = document.createElement('section');
    column.className = 'stat-rank-role-column';
    column.dataset.role = role;

    const title = document.createElement('h5');
    title.className = 'stat-rank-role-column__title';
    title.dataset.role = role;

    const body = document.createElement('div');
    body.className = 'stat-rank-role-column__body';

    for (const color of ROLE_EMBLEM_COLORS[role]) {
      const group = document.createElement('div');
      group.className = `stat-rank-color-group stat-rank-color-group--${color}`;
      group.dataset.role = role;
      group.dataset.statColor = color;

      const header = document.createElement('div');
      header.className = 'stat-rank-color-group__header';
      header.dataset.statColor = color;
      header.textContent = getStatRankGroupLabel(color);

      const list = document.createElement('ul');
      list.className = 'stat-rank-list';

      for (const attribute of COLOR_ATTRIBUTES[color]) {
        const item = document.createElement('li');
        item.className = 'stat-rank-list__item';

        const stat = document.createElement('span');
        stat.className = 'stat-rank-list__stat';
        stat.dataset.attribute = attribute;

        const rank = document.createElement('span');
        rank.className = 'stat-rank-list__rank';
        rank.textContent = '1';

        item.append(stat, rank);
        list.append(item);
      }

      group.append(header, list);
      body.append(group);
    }

    column.append(title, body);
    columns.append(column);
  }

  container.append(columns);
}

function getSelectedLeagueCheckboxes(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('#league-multiselect-menu .filter-dropdown__checkbox'),
  );
}

function getSelectedLeagueIds(): string[] {
  return getSelectedLeagueCheckboxes()
    .filter((input) => input.checked)
    .map((input) => input.dataset.leagueId ?? '')
    .filter((id) => id.length > 0);
}

function getWeightMetric(): WeightMetric {
  const selected = document.querySelector<HTMLButtonElement>(
    '#weight-metric-menu .filter-dropdown__choice--selected',
  );
  return selected?.getAttribute('data-value') === 'top3' ? 'top3' : 'avg';
}

function closeAllFilterDropdowns(): void {
  document.querySelectorAll<HTMLElement>('.filter-dropdown').forEach((dropdown) => {
    dropdown.classList.remove('filter-dropdown--open');
    const trigger = dropdown.querySelector<HTMLButtonElement>('.filter-dropdown__trigger');
    const menu = dropdown.querySelector<HTMLElement>('.filter-dropdown__menu');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
    if (menu) {
      menu.hidden = true;
    }
  });
}

function updateWeightMetricValueLabel(): void {
  const valueEl = document.getElementById('weight-metric-value');
  const selected = document.querySelector<HTMLButtonElement>(
    '#weight-metric-menu .filter-dropdown__choice--selected',
  );
  if (valueEl && selected) {
    valueEl.textContent = selected.textContent?.trim() ?? valueEl.textContent;
  }
}

function getSelectedLeagueCount(): number {
  return getSelectedLeagueCheckboxes().filter((input) => input.checked).length;
}

function getTotalLeagueCount(): number {
  return getSelectedLeagueCheckboxes().length;
}

function updateSimulationPanelsUi(): void {
  updateSimulationPanelSummary();
  updateLeagueMultiselectLabel();
  updateWeightMetricValueLabel();
  updateStatRankPreview();
}

function updateStatRankPreview(): void {
  const footnote = document.getElementById('stat-rank-footnote');
  const copy = getTranslations(getLanguage());

  if (!isMatchMetricsLoaded()) {
    document.querySelectorAll<HTMLElement>('.stat-rank-list__rank').forEach((rankEl) => {
      rankEl.textContent = '—';
    });

    if (footnote) {
      footnote.textContent = copy.statRankFootnote.replace('{count}', '0');
    }
    return;
  }

  const weights = computeStatWeights({
    leagueIds: getSelectedLeagueIds(),
    weightMetric: getWeightMetric(),
  });

  syncAllEmblemDisplays();

  document.querySelectorAll<HTMLElement>('.stat-rank-color-group').forEach((group) => {
    const role = group.dataset.role as Role | undefined;
    const color = group.dataset.statColor;
    if (!role || !color) {
      return;
    }

    group.querySelectorAll<HTMLLIElement>('.stat-rank-list__item').forEach((item) => {
      const attribute = item.querySelector<HTMLElement>('.stat-rank-list__stat')?.getAttribute('data-attribute') as Attribute | null;
      const rankEl = item.querySelector<HTMLElement>('.stat-rank-list__rank');
      if (!attribute || !rankEl) {
        return;
      }

      const colorKey = color as 'red' | 'green' | 'blue';
      const weight = weights[role]?.[colorKey]?.[attribute];
      rankEl.textContent = weight !== undefined ? String(Math.round(weight)) : '—';
    });
  });

  sortStatRankListsDescending();

  if (footnote) {
    const matchCount = getMatchesByLeagues(getSelectedLeagueIds()).length;
    footnote.textContent = copy.statRankFootnote.replace('{count}', String(matchCount));
  }
}

function updateLeagueMultiselectLabel(): void {
  const valueEl = document.getElementById('league-multiselect-value');
  const trigger = document.getElementById('league-multiselect-trigger');
  if (!valueEl) {
    return;
  }

  const copy = getTranslations(getLanguage());
  const checkboxes = getSelectedLeagueCheckboxes();

  if (checkboxes.length === 0) {
    valueEl.textContent =
      trigger instanceof HTMLButtonElement && trigger.disabled
        ? copy.leaguesLoading
        : copy.leaguesEmpty;
    return;
  }

  const selectedCount = getSelectedLeagueCount();
  const totalCount = getTotalLeagueCount();

  if (selectedCount === totalCount) {
    valueEl.textContent = copy.leagueMultiselectAll.replace('{count}', String(totalCount));
  } else {
    valueEl.textContent = copy.leagueMultiselectCount.replace('{count}', String(selectedCount));
  }
}

export function populateLeagueFilterFromMatchMetrics(): void {
  const menu = document.getElementById('league-multiselect-menu');
  const trigger = document.getElementById('league-multiselect-trigger');
  if (!menu || !trigger) {
    return;
  }

  const leagues = getAvailableLeagues();

  if (leagues.length === 0) {
    menu.replaceChildren();
    if (trigger instanceof HTMLButtonElement) {
      trigger.disabled = true;
    }
    updateSimulationPanelsUi();
    return;
  }

  if (trigger instanceof HTMLButtonElement) {
    trigger.disabled = false;
  }
  menu.replaceChildren(
    ...leagues.map(({ leagueId, matchCount, leagueName }) => {
      const label = document.createElement('label');
      label.className = 'filter-dropdown__option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'filter-dropdown__checkbox';
      input.dataset.leagueId = leagueId;
      input.dataset.matchCount = String(matchCount);
      input.checked = true;

      const text = document.createElement('span');
      text.textContent = leagueName || leagueId;

      label.append(input, text);
      return label;
    }),
  );

  updateSimulationPanelsUi();
}

function updateSimulationPanelSummary(): void {
  const summary = document.getElementById('simulation-settings-summary');
  if (!summary) {
    return;
  }

  const copy = getTranslations(getLanguage());
  const fractalInput = document.getElementById('ignore-fractal-bonus');
  const ignored = fractalInput instanceof HTMLInputElement && fractalInput.checked;
  const fractalPart = ignored
    ? copy.simulationSettingsSummaryIgnored
    : copy.simulationSettingsSummaryIncluded;

  const trigger = document.getElementById('league-multiselect-trigger');
  const checkboxes = getSelectedLeagueCheckboxes();
  const metric = getWeightMetric();
  const metricPart =
    metric === 'top3' ? copy.weightMetricSummaryTop3 : copy.weightMetricSummaryAvg;

  if (checkboxes.length === 0) {
    const leaguePart =
      trigger instanceof HTMLButtonElement && trigger.disabled
        ? copy.leaguesLoading
        : copy.leaguesEmpty;
    summary.textContent = `${fractalPart} · ${leaguePart} · ${metricPart}`;
    return;
  }

  const selectedCount = getSelectedLeagueCount();
  const totalCount = getTotalLeagueCount();

  const leaguePart =
    selectedCount === totalCount
      ? copy.statWeightSummaryAllLeagues
      : copy.leagueMultiselectCount.replace('{count}', String(selectedCount));

  summary.textContent = `${fractalPart} · ${leaguePart} · ${metricPart}`;
}

function initSimulationSettingsTabs(): void {
  const panel = document.getElementById('simulation-settings-body');
  if (!panel) {
    return;
  }

  const tabs = panel.querySelectorAll<HTMLButtonElement>('.sim-tab-btn');
  const contents = panel.querySelectorAll<HTMLElement>('.sim-tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-sim-tab');

      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
      });

      contents.forEach((content) => {
        const isActive = content.getAttribute('data-sim-content') === target;
        content.classList.toggle('active', isActive);
        content.hidden = !isActive;
      });
    });
  });
}

function initCollapsiblePanel(
  panelId: string,
  triggerId: string,
  bodyId: string,
): void {
  const panel = document.getElementById(panelId);
  const trigger = document.getElementById(triggerId);
  const body = document.getElementById(bodyId);

  if (!panel || !trigger || !body) {
    return;
  }

  trigger.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('sim-panel__wrap--open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
}

function initLeagueMultiselect(): void {
  const root = document.getElementById('league-multiselect');
  const trigger = document.getElementById('league-multiselect-trigger');
  const menu = document.getElementById('league-multiselect-menu');

  if (!root || !trigger || !menu) {
    return;
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (trigger instanceof HTMLButtonElement && trigger.disabled) {
      return;
    }

    const willOpen = !root.classList.contains('filter-dropdown--open');
    closeAllFilterDropdowns();
    if (willOpen) {
      root.classList.add('filter-dropdown--open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
    }
  });

  menu.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains('filter-dropdown__checkbox')) {
      return;
    }

    if (getSelectedLeagueCount() === 0) {
      target.checked = true;
      return;
    }

    updateSimulationPanelsUi();
  });
}

function initWeightMetricSelect(): void {
  const root = document.getElementById('weight-metric-select');
  const trigger = document.getElementById('weight-metric-trigger');
  const menu = document.getElementById('weight-metric-menu');
  const valueEl = document.getElementById('weight-metric-value');

  if (!root || !trigger || !menu || !valueEl) {
    return;
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !root.classList.contains('filter-dropdown--open');
    closeAllFilterDropdowns();
    if (willOpen) {
      root.classList.add('filter-dropdown--open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
    }
  });

  menu.querySelectorAll<HTMLButtonElement>('.filter-dropdown__choice').forEach((choice) => {
    choice.addEventListener('click', () => {
      menu.querySelectorAll<HTMLButtonElement>('.filter-dropdown__choice').forEach((option) => {
        option.classList.remove('filter-dropdown__choice--selected');
        option.setAttribute('aria-selected', 'false');
      });

      choice.classList.add('filter-dropdown__choice--selected');
      choice.setAttribute('aria-selected', 'true');
      valueEl.textContent = choice.textContent?.trim() ?? valueEl.textContent;

      root.classList.remove('filter-dropdown--open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      updateSimulationPanelsUi();
    });
  });
}

function initFilterDropdownDismiss(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Node;
    const clickedInsideDropdown = Array.from(document.querySelectorAll<HTMLElement>('.filter-dropdown')).some(
      (dropdown) => dropdown.contains(target),
    );

    if (!clickedInsideDropdown) {
      closeAllFilterDropdowns();
    }
  });
}

function initSimulationPanels(): void {
  initCollapsiblePanel('simulation-settings-panel', 'simulation-settings-trigger', 'simulation-settings-body');
  initSimulationSettingsTabs();
  initFilterDropdownDismiss();
  initLeagueMultiselect();
  initWeightMetricSelect();
  buildStatRankPreviewTables();
  refreshStatRankPreviewLabels(getLanguage());

  const leagueTrigger = document.getElementById('league-multiselect-trigger');
  if (leagueTrigger instanceof HTMLButtonElement) {
    leagueTrigger.disabled = true;
  }

  updateSimulationPanelsUi();
}

export function initApp() {
  initI18n();
  injectEmblemExpectedScores();
  syncAllEmblemDisplays();
  refreshAppState();
  initEmblemListeners();
  initOperationListeners();
  initOperationsTabs();
  initStageSelector();
  initSimulationPanels();
  initFractalToggle();
  registerSimulationRerender(rerunLastSimulation);
  registerSimulationOptionsRerender(updateSimulationPanelsUi);
  logAppState();
}
