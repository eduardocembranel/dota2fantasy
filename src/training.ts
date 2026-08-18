import {
  ALL_TRAITS,
  BLUE_ATTRIBUTES,
  GREEN_ATTRIBUTES,
  RED_ATTRIBUTES,
  getAttributeLabel,
  getLanguage,
  getOperationLabel,
  getQualityLabel,
  getRoleLabel,
  getTraitLabel,
  getTranslations,
} from './i18n';
import { registerTrainingRerender } from './applyI18n';
import {
  formatBonusPercent,
  formatTotalPercent,
  getBannerOverallScore,
  getEmblemOverallScore,
  getEmblemTotalPercent,
  getQualityBonusPercent,
  getTraitBonusPercent,
} from './bannerScore';
import { applyOperation } from './operations/appliers';
import { getStatWeights } from './statsRanking/computeStatWeights';
import {
  OPERATION_LABELS,
  type Attribute,
  type Banner,
  type Emblem,
  type EmblemColor,
  type Operation,
  type Quality,
  type Role,
  type Stage,
  type Trait,
} from './types';

type KnownColor = Exclude<EmblemColor, 'unknown'>;

const ROLES: Role[] = ['core', 'mid', 'support'];

const ROLE_EMBLEM_COLORS: Record<Role, KnownColor[]> = {
  core: ['red', 'green', 'red', 'green', 'red'],
  mid: ['red', 'blue', 'green', 'red', 'green'],
  support: ['blue', 'green', 'blue', 'green', 'blue'],
};

const ALL_OPERATIONS = Object.keys(OPERATION_LABELS) as Operation[];

const STAGE_MAX_REROLLS: Record<Stage, number> = {
  groupStage: 40,
  mainStage: 30,
};

interface TrainingState {
  stage: Stage;
  banners: Record<Role, Banner>;
  selectedRole: Role;
  remaining: number;
  operations: Operation[];
}

let state: TrainingState | null = null;

let dashboardEl: HTMLElement | null = null;
let operationsEl: HTMLElement | null = null;
let counterValueEl: HTMLElement | null = null;
let emptyEl: HTMLElement | null = null;
let stageButtons: HTMLButtonElement[] = [];

function attributesForColor(color: KnownColor): Attribute[] {
  if (color === 'red') {
    return RED_ATTRIBUTES;
  }
  if (color === 'green') {
    return GREEN_ATTRIBUTES;
  }
  return BLUE_ATTRIBUTES;
}

function createDefaultBanner(role: Role): Banner {
  const emblems = ROLE_EMBLEM_COLORS[role].map(
    (color, index): Emblem => ({
      index,
      color,
      attribute: attributesForColor(color)[0],
      quality: 3,
      trait: 'fractal',
    }),
  );

  return { role, emblems };
}

function pickRandomOperations(count: number): Operation[] {
  const pool = [...ALL_OPERATIONS];
  const chosen: Operation[] = [];

  while (chosen.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
}

function initState(): TrainingState {
  const stage: Stage = 'groupStage';
  return {
    stage,
    banners: Object.fromEntries(ROLES.map((role) => [role, createDefaultBanner(role)])) as Record<
      Role,
      Banner
    >,
    selectedRole: 'core',
    remaining: STAGE_MAX_REROLLS[stage],
    operations: pickRandomOperations(3),
  };
}

function createEmblem(role: Role, index: number, color: KnownColor): HTMLElement {
  const emblem = document.createElement('article');
  emblem.className = `emblem emblem--${color}`;

  const attributes = attributesForColor(color);

  const header = document.createElement('div');
  header.className = 'emblem-header';

  const attrWrap = document.createElement('span');
  attrWrap.className = 'select-wrap';
  const attrSelect = document.createElement('select');
  attrSelect.className = 'emblem-select';
  attrSelect.setAttribute('aria-label', 'Emblem stat');
  attrSelect.replaceChildren(
    ...attributes.map((attribute) => {
      const option = document.createElement('option');
      option.value = attribute;
      option.textContent = getAttributeLabel(attribute);
      return option;
    }),
  );
  attrWrap.append(attrSelect);

  const total = document.createElement('span');
  total.className = 'emblem-total';
  total.textContent = '100%';

  header.append(attrWrap, total);

  const qualityRow = document.createElement('div');
  qualityRow.className = 'emblem-row';
  const qualityWrap = document.createElement('span');
  qualityWrap.className = 'select-wrap';
  const qualitySelect = document.createElement('select');
  qualitySelect.className = 'quality-select';
  qualitySelect.setAttribute('aria-label', 'Quality');
  qualitySelect.replaceChildren(
    ...([1, 2, 3, 4, 5] as Quality[]).map((quality) => {
      const option = document.createElement('option');
      option.value = String(quality);
      option.textContent = getQualityLabel(quality);
      return option;
    }),
  );
  qualityWrap.append(qualitySelect);
  const qualityValue = document.createElement('span');
  qualityValue.className = 'value';
  qualityValue.textContent = '+60%';
  qualityRow.append(qualityWrap, qualityValue);

  const traitRow = document.createElement('div');
  traitRow.className = 'emblem-row';
  const traitWrap = document.createElement('span');
  traitWrap.className = 'select-wrap';
  const traitSelect = document.createElement('select');
  traitSelect.className = 'trait-select';
  traitSelect.setAttribute('aria-label', 'Trait');
  traitSelect.replaceChildren(
    ...ALL_TRAITS.map((trait) => {
      const option = document.createElement('option');
      option.value = trait;
      option.textContent = getTraitLabel(trait);
      return option;
    }),
  );
  traitWrap.append(traitSelect);
  const traitValue = document.createElement('span');
  traitValue.className = 'value';
  traitValue.textContent = '+60%';
  traitRow.append(traitWrap, traitValue);

  const score = document.createElement('span');
  score.className = 'emblem-expected-score';
  traitRow.append(score);

  emblem.append(header, qualityRow, traitRow);

  attrSelect.addEventListener('change', () => {
    const current = state!.banners[role].emblems[index];
    state!.banners[role].emblems[index] = {
      ...current,
      attribute: attrSelect.value as Attribute,
    };
    renderBanner(role);
  });

  qualitySelect.addEventListener('change', () => {
    const current = state!.banners[role].emblems[index];
    state!.banners[role].emblems[index] = {
      ...current,
      quality: Number(qualitySelect.value) as Quality,
    };
    renderBanner(role);
  });

  traitSelect.addEventListener('change', () => {
    const current = state!.banners[role].emblems[index];
    state!.banners[role].emblems[index] = {
      ...current,
      trait: traitSelect.value as Trait,
    };
    renderBanner(role);
  });

  return emblem;
}

function buildRoleColumn(role: Role): HTMLElement {
  const column = document.createElement('section');
  column.className = 'column training-column';
  column.dataset.role = role;
  column.setAttribute('role', 'button');
  column.setAttribute('aria-pressed', 'false');
  column.tabIndex = 0;

  const select = () => {
    if (!state) {
      return;
    }
    state.selectedRole = role;
    renderSelection();
  };

  column.addEventListener('click', select);
  column.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select();
    }
  });

  const title = document.createElement('h2');
  title.className = 'role-title';
  title.dataset.role = role;
  title.textContent = getRoleLabel(role);

  const banner = document.createElement('div');
  banner.className = 'column-banner';

  ROLE_EMBLEM_COLORS[role].forEach((color, index) => {
    banner.append(createEmblem(role, index, color));
  });

  const expected = document.createElement('p');
  expected.className = 'banner-expected-score';
  const expectedLabel = document.createElement('span');
  expectedLabel.className = 'banner-expected-score__label';
  expectedLabel.textContent = getTranslations(getLanguage()).expectedScoreLabel;
  const expectedValue = document.createElement('span');
  expectedValue.className = 'banner-expected-score__value';
  expected.append(expectedLabel, document.createTextNode(' '), expectedValue);

  column.append(title, banner, expected);
  return column;
}

function buildTrainingUi(): void {
  const root = document.getElementById('tab-training');
  if (!root) {
    return;
  }

  const copy = getTranslations(getLanguage());
  root.replaceChildren();

  const header = document.createElement('header');
  header.className = 'training-header';

  const nav = document.createElement('nav');
  nav.className = 'stage-selector';
  nav.setAttribute('aria-label', copy.stageNavLabel);

  stageButtons = (['groupStage', 'mainStage'] as Stage[]).map((stage) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-btn';
    button.dataset.stage = stage;
    button.textContent = stage === 'mainStage' ? copy.stageMain : copy.stageGroup;
    button.addEventListener('click', () => onStageChange(stage));
    nav.append(button);
    return button;
  });

  header.append(nav);

  dashboardEl = document.createElement('main');
  dashboardEl.className = 'dashboard training-dashboard';

  for (const role of ROLES) {
    dashboardEl.append(buildRoleColumn(role));
  }

  const controls = document.createElement('section');
  controls.className = 'training-controls';

  const counter = document.createElement('div');
  counter.className = 'training-counter';
  const counterLabel = document.createElement('span');
  counterLabel.className = 'training-counter__label';
  counterLabel.textContent = copy.trainingRemainingLabel;
  counterValueEl = document.createElement('span');
  counterValueEl.className = 'training-counter__value';
  counter.append(counterLabel, counterValueEl);

  operationsEl = document.createElement('div');
  operationsEl.className = 'training-operations';

  const actions = document.createElement('div');
  actions.className = 'training-actions';

  const skipButton = document.createElement('button');
  skipButton.type = 'button';
  skipButton.className = 'training-action-btn training-skip';
  skipButton.textContent = copy.trainingSkip;
  skipButton.addEventListener('click', onSkip);

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'training-action-btn training-action-btn--primary training-reset';
  resetButton.textContent = copy.trainingReset;
  resetButton.addEventListener('click', onReset);

  actions.append(skipButton, resetButton);

  emptyEl = document.createElement('p');
  emptyEl.className = 'training-empty';
  emptyEl.textContent = copy.trainingEmpty;
  emptyEl.hidden = true;

  controls.append(counter, operationsEl, actions, emptyEl);

  root.append(header, dashboardEl, controls);
}

function renderBanner(role: Role): void {
  if (!state || !dashboardEl) {
    return;
  }

  const column = dashboardEl.querySelector<HTMLElement>(`.training-column[data-role="${role}"]`);
  if (!column) {
    return;
  }

  const banner = state.banners[role];
  const stage = state.stage;
  const statWeights = getStatWeights();

  const emblemEls = Array.from(column.querySelectorAll<HTMLElement>('.emblem'));
  emblemEls.forEach((emblemEl, index) => {
    const emblem = banner.emblems[index];
    if (!emblem) {
      return;
    }

    const attributeSelect = emblemEl.querySelector<HTMLSelectElement>('.emblem-select');
    const qualitySelect = emblemEl.querySelector<HTMLSelectElement>('.quality-select');
    const traitSelect = emblemEl.querySelector<HTMLSelectElement>('.trait-select');

    if (attributeSelect) {
      attributeSelect.value = emblem.attribute;
    }
    if (qualitySelect) {
      qualitySelect.value = String(emblem.quality);
    }
    if (traitSelect) {
      traitSelect.value = emblem.trait;
    }

    const qualityBonusEl = emblemEl.querySelector('.emblem-row:has(.quality-select) .value');
    const traitBonusEl = emblemEl.querySelector('.emblem-row:has(.trait-select) .value');
    const totalEl = emblemEl.querySelector('.emblem-total');
    const scoreEl = emblemEl.querySelector('.emblem-expected-score');

    if (qualityBonusEl) {
      qualityBonusEl.textContent = formatBonusPercent(getQualityBonusPercent(emblem.quality));
    }
    if (traitBonusEl) {
      traitBonusEl.textContent = formatBonusPercent(getTraitBonusPercent(banner, index, stage));
    }
    if (totalEl) {
      totalEl.textContent = formatTotalPercent(getEmblemTotalPercent(banner, index, stage));
    }
    if (scoreEl) {
      scoreEl.textContent = String(
        Math.round(getEmblemOverallScore(banner, index, stage, statWeights) * 2),
      );
    }
  });

  const expectedValueEl = column.querySelector<HTMLElement>('.banner-expected-score__value');
  if (expectedValueEl) {
    expectedValueEl.textContent = String(
      Math.round(getBannerOverallScore(banner, stage, statWeights) * 2),
    );
  }
}

function renderStageButtons(): void {
  if (!state) {
    return;
  }

  const currentStage = state.stage;

  if (dashboardEl) {
    dashboardEl.setAttribute('data-active-stage', currentStage);
  }

  stageButtons.forEach((button) => {
    const isActive = button.dataset.stage === currentStage;
    button.classList.toggle('active', isActive);
  });
}

function renderSelection(): void {
  if (!state || !dashboardEl) {
    return;
  }

  const selectedRole = state.selectedRole;

  dashboardEl.querySelectorAll<HTMLElement>('.training-column').forEach((column) => {
    const isSelected = column.dataset.role === selectedRole;
    column.classList.toggle('training-column--selected', isSelected);
    column.setAttribute('aria-pressed', String(isSelected));
  });
}

type HighlightKind = 'attribute' | 'quality' | 'trait';

interface OperationHighlight {
  kind: HighlightKind;
  color: KnownColor | 'all';
}

function getOperationHighlight(operation: Operation): OperationHighlight {
  if (
    operation === 'randomlyIncreaseOneQuality' ||
    operation === 'randomlyIncreaseTwoQualitiesAndReduceOne'
  ) {
    return { kind: 'quality', color: 'all' };
  }

  const kind: HighlightKind = operation.includes('Stat')
    ? 'attribute'
    : operation.includes('Quality')
      ? 'quality'
      : 'trait';

  const color: KnownColor = operation.includes('Green')
    ? 'green'
    : operation.includes('Red')
      ? 'red'
      : 'blue';

  return { kind, color };
}

function getEmblemColorFromClass(emblemEl: HTMLElement): KnownColor | null {
  if (emblemEl.classList.contains('emblem--red')) {
    return 'red';
  }
  if (emblemEl.classList.contains('emblem--green')) {
    return 'green';
  }
  if (emblemEl.classList.contains('emblem--blue')) {
    return 'blue';
  }
  return null;
}

function applyHighlight(operation: Operation): void {
  if (!dashboardEl) {
    return;
  }

  clearHighlight();

  const target = getOperationHighlight(operation);

  dashboardEl.querySelectorAll<HTMLElement>('.emblem').forEach((emblemEl) => {
    const emblemColor = getEmblemColorFromClass(emblemEl);
    if (!emblemColor || (target.color !== 'all' && emblemColor !== target.color)) {
      return;
    }

    const row =
      target.kind === 'attribute'
        ? emblemEl.querySelector<HTMLElement>('.emblem-header')
        : target.kind === 'quality'
          ? emblemEl.querySelector<HTMLElement>('.emblem-row:has(.quality-select)')
          : emblemEl.querySelector<HTMLElement>('.emblem-row:has(.trait-select)');

    if (row) {
      row.classList.add('training-highlight');
    }
  });
}

function clearHighlight(): void {
  document.querySelectorAll<HTMLElement>('.training-highlight').forEach((el) => {
    el.classList.remove('training-highlight');
  });
}

function renderControls(): void {
  if (!state) {
    return;
  }

  if (counterValueEl) {
    counterValueEl.textContent = String(state.remaining);
  }

  if (!operationsEl || !emptyEl) {
    return;
  }

  clearHighlight();
  operationsEl.replaceChildren();

  if (state.remaining <= 0) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;

  state.operations.forEach((operation) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'training-operation-btn';
    button.dataset.operation = operation;
    button.textContent = getOperationLabel(operation);
    button.addEventListener('click', () => onApply(operation));
    button.addEventListener('mouseenter', () => applyHighlight(operation));
    button.addEventListener('mouseleave', clearHighlight);
    operationsEl!.append(button);
  });
}

function renderAll(): void {
  if (!state) {
    return;
  }

  renderStageButtons();
  renderSelection();
  ROLES.forEach(renderBanner);
  renderControls();
}

function onStageChange(stage: Stage): void {
  if (!state) {
    return;
  }

  state.stage = stage;
  state.remaining = STAGE_MAX_REROLLS[stage];
  state.operations = pickRandomOperations(3);
  renderAll();
}

function onApply(operation: Operation): void {
  if (!state || state.remaining <= 0) {
    return;
  }

  const result = applyOperation({
    operation,
    banner: state.banners[state.selectedRole],
    stage: state.stage,
  });

  if (result.status === 'applied') {
    state.banners[state.selectedRole] = result.banner;
  }

  state.remaining -= 1;
  state.operations = state.remaining > 0 ? pickRandomOperations(3) : [];
  renderAll();
}

function onSkip(): void {
  if (!state || state.remaining <= 0) {
    return;
  }

  state.remaining -= 1;
  state.operations = state.remaining > 0 ? pickRandomOperations(3) : [];
  renderAll();
}

function onReset(): void {
  if (!state) {
    return;
  }

  state.remaining = STAGE_MAX_REROLLS[state.stage];
  state.operations = pickRandomOperations(3);
  renderAll();
}

function refreshTrainingLabels(): void {
  const root = document.getElementById('tab-training');
  if (!root) {
    return;
  }

  const copy = getTranslations(getLanguage());

  const counterLabel = root.querySelector<HTMLElement>('.training-counter__label');
  if (counterLabel) {
    counterLabel.textContent = copy.trainingRemainingLabel;
  }

  const skipButton = root.querySelector<HTMLElement>('.training-skip');
  if (skipButton) {
    skipButton.textContent = copy.trainingSkip;
  }

  const resetButton = root.querySelector<HTMLElement>('.training-reset');
  if (resetButton) {
    resetButton.textContent = copy.trainingReset;
  }

  const empty = root.querySelector<HTMLElement>('.training-empty');
  if (empty) {
    empty.textContent = copy.trainingEmpty;
  }

  root.querySelectorAll<HTMLButtonElement>('.training-operation-btn').forEach((button) => {
    const operation = button.dataset.operation as Operation | undefined;
    if (operation) {
      button.textContent = getOperationLabel(operation);
    }
  });
}

export function initTraining(): void {
  const root = document.getElementById('tab-training');
  if (!root) {
    return;
  }

  state = initState();
  buildTrainingUi();
  renderAll();
  registerTrainingRerender(refreshTrainingLabels);
}

export function refreshTrainingView(): void {
  if (!state) {
    return;
  }
  renderAll();
}
