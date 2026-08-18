import {
  ALL_TRAITS,
  getAttributeLabel,
  getAttributesForEmblemColor,
  getOperationLabel,
  getPageTitle,
  getQualityLabel,
  getRoleLabel,
  getTraitLabel,
  getTranslations,
  initLanguage,
  setLanguage,
  type Language,
} from './i18n';
import type { Attribute, Quality, Role } from './types';

type RerunSimulation = () => void;
type RerunSimulationOptions = () => void;

let rerunSimulation: RerunSimulation | null = null;
let rerunSimulationOptions: RerunSimulationOptions | null = null;
let rerunTraining: (() => void) | null = null;

export function registerSimulationRerender(callback: RerunSimulation): void {
  rerunSimulation = callback;
}

export function registerSimulationOptionsRerender(callback: RerunSimulationOptions): void {
  rerunSimulationOptions = callback;
}

export function registerTrainingRerender(callback: () => void): void {
  rerunTraining = callback;
}

function syncQualitySelect(select: HTMLSelectElement): void {
  const selectedIndex = Math.max(0, select.selectedIndex);

  select.replaceChildren(
    ...([1, 2, 3, 4, 5] as Quality[]).map((quality) => {
      const option = document.createElement('option');
      option.value = String(quality);
      option.textContent = getQualityLabel(quality);
      return option;
    })
  );

  select.selectedIndex = Math.min(selectedIndex, select.options.length - 1);
}

function syncTraitSelect(select: HTMLSelectElement): void {
  const currentTrait = ALL_TRAITS[Math.max(0, select.selectedIndex)] ?? ALL_TRAITS[0];

  select.replaceChildren(
    ...ALL_TRAITS.map((trait) => {
      const option = document.createElement('option');
      option.value = trait;
      option.textContent = getTraitLabel(trait);
      return option;
    })
  );

  select.value = currentTrait;
}

function syncAttributeSelect(select: HTMLSelectElement): void {
  const emblemEl = select.closest('.emblem');
  if (!(emblemEl instanceof HTMLElement)) {
    return;
  }

  const attributes = getAttributesForEmblemColor(emblemEl);
  const currentAttribute = attributes[Math.max(0, select.selectedIndex)] ?? attributes[0];

  select.replaceChildren(
    ...attributes.map((attribute) => {
      const option = document.createElement('option');
      option.value = attribute;
      option.textContent = getAttributeLabel(attribute);
      return option;
    })
  );

  select.value = attributes.includes(currentAttribute as Attribute)
    ? currentAttribute
    : attributes[0];
}

function syncEmblemSelects(): void {
  document.querySelectorAll<HTMLSelectElement>('.quality-select').forEach(syncQualitySelect);
  document.querySelectorAll<HTMLSelectElement>('.trait-select').forEach(syncTraitSelect);
  document.querySelectorAll<HTMLSelectElement>('.emblem-select').forEach(syncAttributeSelect);
}

function applyStatRankPreviewLabels(language: Language): void {
  const copy = getTranslations(language);

  document.querySelectorAll<HTMLElement>('.stat-rank-role-column__title').forEach((title) => {
    const role = title.dataset.role as Role | undefined;
    if (role) {
      title.textContent = getRoleLabel(role, language);
    }
  });

  document.querySelectorAll<HTMLElement>('.stat-rank-color-group__header').forEach((header) => {
    const color = header.dataset.statColor;
    if (color === 'red') {
      header.textContent = copy.statRankGroupRed;
    } else if (color === 'green') {
      header.textContent = copy.statRankGroupGreen;
    } else if (color === 'blue') {
      header.textContent = copy.statRankGroupBlue;
    }
  });

  document.querySelectorAll<HTMLElement>('.stat-rank-list__stat[data-attribute]').forEach((stat) => {
    const attribute = stat.getAttribute('data-attribute') as Attribute | null;
    if (attribute) {
      stat.textContent = getAttributeLabel(attribute, language);
    }
  });
}

export function refreshStatRankPreviewLabels(language: Language): void {
  applyStatRankPreviewLabels(language);
}

function updateStaticText(language: Language): void {
  const copy = getTranslations(language);

  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.title = getPageTitle(language);

  const tagline = document.querySelector('.site-title__tagline');
  if (tagline) {
    tagline.textContent = copy.siteTagline;
  }

  const tabCalculator = document.getElementById('tab-btn-calculator');
  if (tabCalculator) {
    tabCalculator.textContent = copy.tabCalculator;
  }

  const tabTraining = document.getElementById('tab-btn-training');
  if (tabTraining) {
    tabTraining.textContent = copy.tabTraining;
  }

  document.querySelectorAll<HTMLElement>('.banner-expected-score__label').forEach((label) => {
    label.textContent = copy.expectedScoreLabel;
  });

  const stageNav = document.querySelector('.stage-selector');
  if (stageNav) {
    stageNav.setAttribute('aria-label', copy.stageNavLabel);
  }

  document.querySelectorAll<HTMLButtonElement>('.stage-btn').forEach((button) => {
    const stage = button.getAttribute('data-stage');
    button.textContent = stage === 'mainStage' ? copy.stageMain : copy.stageGroup;
  });

  const panelTitle = document.querySelector('.operations-panel .panel-title');
  if (panelTitle) {
    panelTitle.textContent = copy.panelTitle;
  }

  const simulationSettingsTitle = document.getElementById('simulation-settings-title');
  if (simulationSettingsTitle) {
    simulationSettingsTitle.textContent = copy.simulationSettingsTitle;
  }

  const simulationSettingsDesc = document.getElementById('simulation-settings-desc');
  if (simulationSettingsDesc) {
    simulationSettingsDesc.textContent = copy.simulationSettingsDesc;
  }

  const simTabGeneral = document.getElementById('sim-tab-btn-general');
  if (simTabGeneral) {
    simTabGeneral.textContent = copy.tabSimGeneral;
  }

  const simTabStatWeights = document.getElementById('sim-tab-btn-stat-weights');
  if (simTabStatWeights) {
    simTabStatWeights.textContent = copy.tabStatWeights;
  }

  const statWeightDescription = document.getElementById('stat-weight-description');
  if (statWeightDescription) {
    statWeightDescription.textContent = copy.statWeightSettingsDesc;
  }

  const leaguesLabel = document.getElementById('sim-leagues-label');
  if (leaguesLabel) {
    leaguesLabel.textContent = copy.leaguesLabel;
  }

  const weightMetricLabel = document.getElementById('weight-metric-label');
  if (weightMetricLabel) {
    weightMetricLabel.textContent = copy.weightMetricLabel;
  }

  const weightMetricAvgLabel = document.getElementById('weight-metric-avg-label');
  if (weightMetricAvgLabel) {
    weightMetricAvgLabel.textContent = copy.weightMetricAvg;
  }
  const weightMetricP50Label = document.getElementById('weight-metric-p50-label');
  if (weightMetricP50Label) {
    weightMetricP50Label.textContent = copy.weightMetricP50;
  }

  const weightMetricP60Label = document.getElementById('weight-metric-p60-label');
  if (weightMetricP60Label) {
    weightMetricP60Label.textContent = copy.weightMetricP60;
  }

  const weightMetricP70Label = document.getElementById('weight-metric-p70-label');
  if (weightMetricP70Label) {
    weightMetricP70Label.textContent = copy.weightMetricP70;
  }

  const weightMetricP80Label = document.getElementById('weight-metric-p80-label');
  if (weightMetricP80Label) {
    weightMetricP80Label.textContent = copy.weightMetricP80;
  }

  const weightMetricP90Label = document.getElementById('weight-metric-p90-label');
  if (weightMetricP90Label) {
    weightMetricP90Label.textContent = copy.weightMetricP90;
  }

  const matchDurationLabel = document.getElementById('match-duration-label');
  if (matchDurationLabel) {
    matchDurationLabel.textContent = copy.matchDurationLabel;
  }

  const matchDurationAllLabel = document.getElementById('match-duration-all-label');
  if (matchDurationAllLabel) {
    matchDurationAllLabel.textContent = copy.matchDurationAll;
  }

  const matchDuration30Label = document.getElementById('match-duration-30-label');
  if (matchDuration30Label) {
    matchDuration30Label.textContent = copy.matchDuration30;
  }

  const matchDuration40Label = document.getElementById('match-duration-40-label');
  if (matchDuration40Label) {
    matchDuration40Label.textContent = copy.matchDuration40;
  }

  const matchDuration45Label = document.getElementById('match-duration-45-label');
  if (matchDuration45Label) {
    matchDuration45Label.textContent = copy.matchDuration45;
  }

  const matchDuration50Label = document.getElementById('match-duration-50-label');
  if (matchDuration50Label) {
    matchDuration50Label.textContent = copy.matchDuration50;
  }

  const matchDuration60Label = document.getElementById('match-duration-60-label');
  if (matchDuration60Label) {
    matchDuration60Label.textContent = copy.matchDuration60;
  }

  const matchDuration70Label = document.getElementById('match-duration-70-label');
  if (matchDuration70Label) {
    matchDuration70Label.textContent = copy.matchDuration70;
  }

  const statRankPreviewTitle = document.getElementById('stat-rank-preview-title');
  if (statRankPreviewTitle) {
    statRankPreviewTitle.textContent = copy.statRankPreviewTitle;
  }

  applyStatRankPreviewLabels(language);

  const fractalLabel = document.querySelector('.fractal-toggle__label');
  if (fractalLabel) {
    fractalLabel.textContent = copy.fractalToggle;
  }

  const fractalHint = document.querySelector('.fractal-toggle__hint');
  if (fractalHint) {
    fractalHint.setAttribute('aria-label', copy.fractalHintAria);
  }

  const fractalTooltip = document.querySelector('.fractal-toggle__tooltip');
  if (fractalTooltip) {
    fractalTooltip.textContent = copy.fractalTooltip;
  }

  document.querySelectorAll<HTMLButtonElement>('.op-tab-btn').forEach((button) => {
    const target = button.getAttribute('data-target');
    if (target === 'stats') {
      button.textContent = copy.tabStats;
    } else if (target === 'quality') {
      button.textContent = copy.tabQualities;
    } else if (target === 'trait') {
      button.textContent = copy.tabTraits;
    }
  });

  document.querySelectorAll<HTMLButtonElement>('.op-btn[data-operation]').forEach((button) => {
    const operation = button.getAttribute('data-operation');
    if (operation) {
      button.textContent = getOperationLabel(operation as never, language);
    }
  });

  document.querySelectorAll<HTMLElement>('.role-title').forEach((title) => {
    const role = title.getAttribute('data-role') as Role | null;
    if (role) {
      title.textContent = getRoleLabel(role, language);
    }
  });

  document.querySelectorAll<HTMLSelectElement>('.emblem-select').forEach((select) => {
    select.setAttribute('aria-label', copy.ariaEmblemStat);
  });
  document.querySelectorAll<HTMLSelectElement>('.quality-select').forEach((select) => {
    select.setAttribute('aria-label', copy.ariaQuality);
  });
  document.querySelectorAll<HTMLSelectElement>('.trait-select').forEach((select) => {
    select.setAttribute('aria-label', copy.ariaTrait);
  });

  const langSwitcher = document.querySelector('.lang-switcher');
  if (langSwitcher) {
    langSwitcher.setAttribute('aria-label', copy.langSwitcherAria);
  }

  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((button) => {
    const lang = button.getAttribute('data-lang');
    const isActive = lang === language;
    button.classList.toggle('lang-btn--active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('title', lang === 'pt' ? copy.langPt : copy.langEn);
    button.setAttribute('aria-label', lang === 'pt' ? copy.langPt : copy.langEn);
  });

  rerunSimulationOptions?.();
  rerunTraining?.();
}

export function applyLanguage(language: Language): void {
  setLanguage(language);
  syncEmblemSelects();
  updateStaticText(language);
  rerunSimulation?.();
}

export function initI18n(): Language {
  const language = initLanguage();

  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.getAttribute('data-lang');
      if (lang === 'en' || lang === 'pt') {
        applyLanguage(lang);
      }
    });
  });

  syncEmblemSelects();
  updateStaticText(language);
  return language;
}
