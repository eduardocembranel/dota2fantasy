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

let rerunSimulation: RerunSimulation | null = null;

export function registerSimulationRerender(callback: RerunSimulation): void {
  rerunSimulation = callback;
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

function updateStaticText(language: Language): void {
  const copy = getTranslations(language);

  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.title = getPageTitle(language);

  const tagline = document.querySelector('.site-title__tagline');
  if (tagline) {
    tagline.textContent = copy.siteTagline;
  }

  const stageNav = document.querySelector('.stage-selector');
  if (stageNav) {
    stageNav.setAttribute('aria-label', copy.stageNavLabel);
  }

  document.querySelectorAll<HTMLButtonElement>('.stage-btn').forEach((button) => {
    const stage = button.getAttribute('data-stage');
    button.textContent = stage === 'mainStage' ? copy.stageMain : copy.stageGroup;
  });

  const panelTitle = document.querySelector('.panel-title');
  if (panelTitle) {
    panelTitle.textContent = copy.panelTitle;
  }

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
