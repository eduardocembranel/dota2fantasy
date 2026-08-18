import type {
  Attribute,
  EmblemColor,
  Operation,
  Quality,
  Role,
  SkipReason,
  Trait,
} from './types';

export type Language = 'en' | 'pt';

const STORAGE_KEY = 'dota2fantasy-lang';

let currentLanguage: Language = 'en';

const RED_ATTRIBUTES: Attribute[] = [
  'creepScore',
  'gpm',
  'deaths',
  'kills',
  'towers',
  'madstonesCollected',
];

const GREEN_ATTRIBUTES: Attribute[] = [
  'teamfight',
  'stuns',
  'tormentorKills',
  'roshanKills',
  'firstBlood',
  'courierKills',
];

const BLUE_ATTRIBUTES: Attribute[] = [
  'wardsPlaced',
  'campsStacked',
  'lotusesGained',
  'watchersTaken',
  'runesGrabbed',
  'smokesUsed',
];

const ALL_TRAITS: Trait[] = ['fractal', 'friendly', 'benevolent', 'vampiric', 'unique'];

const ROMAN_TIERS: Record<Quality, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

type TranslationTree = {
  pageTitle: string;
  siteTagline: string;
  expectedScoreLabel: string;
  stageGroup: string;
  stageMain: string;
  stageNavLabel: string;
  panelTitle: string;
  simulationSettingsTitle: string;
  simulationSettingsDesc: string;
  simulationSettingsSummaryIncluded: string;
  simulationSettingsSummaryIgnored: string;
  tabSimGeneral: string;
  tabStatWeights: string;
  statWeightSettingsDesc: string;
  leaguesLabel: string;
  leaguesLoading: string;
  leaguesEmpty: string;
  leagueMultiselectAll: string;
  leagueMultiselectCount: string;
  weightMetricLabel: string;
  weightMetricAvg: string;
  weightMetricTop3: string;
  statRankPreviewTitle: string;
  statWeightsHint: string;
  statRankFootnote: string;
  statRankGroupRed: string;
  statRankGroupGreen: string;
  statRankGroupBlue: string;
  statRankRoleTabsAria: string;
  tableRankHeader: string;
  statWeightSummaryAllLeagues: string;
  weightMetricSummaryAvg: string;
  weightMetricSummaryTop3: string;
  tableStatHeader: string;
  fractalToggle: string;
  fractalHintAria: string;
  fractalTooltip: string;
  tabStats: string;
  tabQualities: string;
  tabTraits: string;
  ariaEmblemStat: string;
  ariaQuality: string;
  ariaTrait: string;
  langSwitcherAria: string;
  langEn: string;
  langPt: string;
  roles: Record<Role, string>;
  attributes: Record<Attribute, string>;
  traits: Record<Trait, string>;
  tierPrefix: string;
  operations: Record<Operation, string>;
  skipReasons: {
    noEligibleEmblems: string;
    lessThanTwoEligibleEmblems: string;
    noColorEmblemsToReroll: string;
  };
  colors: Record<Exclude<EmblemColor, 'unknown'>, string>;
  sim: {
    resultsEyebrow: string;
    fractalNotice: string;
    simulations: string;
    bestPick: string;
    statWeightChangeLabel: string;
    bannerScoreChangeLabel: string;
    qualityBonusChangeLabel: string;
    traitsBonusChangeLabel: string;
    metricHintAria: string;
    avgOnImprove: string;
    avgOnWorsen: string;
    outcomeChancesAria: string;
    moreBreakdown: string;
    hideBreakdown: string;
    improve: string;
    neutral: string;
    worsen: string;
    quality: string;
    traits: string;
    bannerTotal: string;
    statWeight: string;
    bannerPercent: string;
    overallScore: string;
    overallScoreTooltip: string;
    expectedChange: string;
    improveChance: string;
    worsenChance: string;
    neutralChance: string;
  };
};

const TRANSLATIONS: Record<Language, TranslationTree> = {
  en: {
    pageTitle: 'Dota 2 Fantasy Calculator',
    siteTagline: 'Fantasy Calculator',
    expectedScoreLabel: 'Expected Score:',
    stageGroup: 'Group Stage',
    stageMain: 'Main Stage',
    stageNavLabel: 'Tournament stage',
    panelTitle: 'Probability Calculator',
    simulationSettingsTitle: 'Simulation settings',
    simulationSettingsDesc:
      'Options that affect how operation probabilities are simulated on your banners.',
    simulationSettingsSummaryIncluded: 'Fractal included',
    simulationSettingsSummaryIgnored: 'Fractal ignored',
    tabSimGeneral: 'General',
    tabStatWeights: 'Stat weights',
    statWeightSettingsDesc:
      'Choose which pro matches to analyze. These filters define how strong each stat is per role, which affects stat reroll probabilities when you run an operation below.',
    leaguesLabel: 'Tournaments',
    leaguesLoading: 'Loading tournaments...',
    leaguesEmpty: 'No tournaments available',
    leagueMultiselectAll: 'All tournaments ({count})',
    leagueMultiselectCount: '{count} tournaments',
    weightMetricLabel: 'Weight metric',
    weightMetricAvg: 'Average',
    weightMetricTop3: 'Top 3 scores',
    statRankPreviewTitle: 'Ranking preview',
    statWeightsHint: 'Rank per role (1 = strongest stat for that role)',
    statRankFootnote: 'Based on {count} matches',
    statRankGroupRed: 'Red',
    statRankGroupGreen: 'Green',
    statRankGroupBlue: 'Blue',
    statRankRoleTabsAria: 'Role',
    tableRankHeader: 'Rank',
    statWeightSummaryAllLeagues: 'All tournaments',
    weightMetricSummaryAvg: 'Average',
    weightMetricSummaryTop3: 'Top 3 scores',
    tableStatHeader: 'Stat',
    fractalToggle: 'Ignore fractal bonus in simulation',
    fractalHintAria: 'Why ignore fractal bonus?',
    fractalTooltip:
      'In most cases, ignoring fractal bonus gives more realistic simulation results. The +60% requires all active qualities to be different — as qualities improve over time, that condition usually breaks and the bonus disappears, making fractal-driven gains or losses often misleading.',
    tabStats: 'Stats',
    tabQualities: 'Qualities',
    tabTraits: 'Traits',
    ariaEmblemStat: 'Emblem stat',
    ariaQuality: 'Quality',
    ariaTrait: 'Trait',
    langSwitcherAria: 'Language',
    langEn: 'English',
    langPt: 'Portuguese',
    roles: { core: 'Core', mid: 'Mid', support: 'Support' },
    attributes: {
      creepScore: 'Creep Score',
      gpm: 'GPM',
      deaths: 'Deaths',
      kills: 'Kills',
      towers: 'Towers',
      madstonesCollected: 'Madstones Collected',
      teamfight: 'Teamfight',
      stuns: 'Stuns',
      tormentorKills: 'Tormentor Kills',
      roshanKills: 'Roshan Kills',
      firstBlood: 'First Blood',
      courierKills: 'Courier Kills',
      wardsPlaced: 'Wards Placed',
      campsStacked: 'Camps Stacked',
      lotusesGained: 'Lotuses Gained',
      watchersTaken: 'Watchers Taken',
      runesGrabbed: 'Runes Grabbed',
      smokesUsed: 'Smokes Used',
    },
    traits: {
      fractal: 'Fractal',
      friendly: 'Friendly',
      benevolent: 'Benevolent',
      vampiric: 'Vampiric',
      unique: 'Unique',
    },
    tierPrefix: 'Tier',
    operations: {
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
    },
    skipReasons: {
      noEligibleEmblems: 'There are no emblems eligible to be increased',
      lessThanTwoEligibleEmblems: 'There are less than 2 emblems eligible to be increased',
      noColorEmblemsToReroll: 'No {color} emblems to reroll',
    },
    colors: { red: 'red', green: 'green', blue: 'blue' },
    sim: {
      resultsEyebrow: 'Simulation Results',
      fractalNotice: 'Fractal own bonus treated as 0% in these results',
      simulations: 'simulations',
      bestPick: 'Best pick',
      statWeightChangeLabel: 'Expected Stat weight change',
      bannerScoreChangeLabel: 'Banner score change',
      qualityBonusChangeLabel: 'Expected quality bonus change',
      traitsBonusChangeLabel: 'Expected traits bonus change',
      metricHintAria: 'More about this metric',
      avgOnImprove: 'Avg on improve',
      avgOnWorsen: 'Avg on worsen',
      outcomeChancesAria: 'Outcome distribution',
      moreBreakdown: 'More breakdown',
      hideBreakdown: 'Hide breakdown',
      improve: 'Improve',
      neutral: 'Neutral',
      worsen: 'Worsen',
      quality: 'Quality',
      traits: 'Traits',
      bannerTotal: 'Banner total',
      statWeight: 'Stat weight',
      bannerPercent: 'Banner Percentage',
      overallScore: 'Overall Banner Score',
      overallScoreTooltip:
        'Expected overall banner score change based on emblem bonus percentages and stat weights. For simplicity, this uses the bonus from a single match only — in practice, the score change should be doubled, since the banner sums the score from the two best matches in the series.',
      expectedChange: 'Expected change',
      improveChance: 'Improve chance',
      worsenChance: 'Worsen chance',
      neutralChance: 'Neutral chance',
    },
  },
  pt: {
    pageTitle: 'Calculadora Dota dos Sonhos',
    siteTagline: 'Calculadora Dota dos Sonhos',
    expectedScoreLabel: 'Pontuação esperada:',
    stageGroup: 'Fase de Grupos',
    stageMain: 'Fase Principal',
    stageNavLabel: 'Fase do torneio',
    panelTitle: 'Calculadora de Probabilidade',
    simulationSettingsTitle: 'Configurações de simulação',
    simulationSettingsDesc:
      'Opções que afetam como as probabilidades das operações são simuladas nos seus estandartes.',
    simulationSettingsSummaryIncluded: 'Fractal incluído',
    simulationSettingsSummaryIgnored: 'Fractal ignorado',
    tabSimGeneral: 'Geral',
    tabStatWeights: 'Peso dos atributos',
    statWeightSettingsDesc:
      'Escolha quais partidas profissionais analisar. Esses filtros definem o quão forte cada atributo é por role, o que afeta as probabilidades de reroll ao executar uma operação abaixo.',
    leaguesLabel: 'Torneios',
    leaguesLoading: 'Carregando torneios...',
    leaguesEmpty: 'Nenhum torneio disponível',
    leagueMultiselectAll: 'Todos os torneios ({count})',
    leagueMultiselectCount: '{count} torneios',
    weightMetricLabel: 'Métrica de peso',
    weightMetricAvg: 'Média',
    weightMetricTop3: 'Top 3 scores',
    statRankPreviewTitle: 'Prévia do ranking',
    statWeightsHint: 'Rank por role (1 = atributo mais forte para a role)',
    statRankFootnote: 'Baseado em {count} partidas',
    statRankGroupRed: 'Vermelho',
    statRankGroupGreen: 'Verde',
    statRankGroupBlue: 'Azul',
    statRankRoleTabsAria: 'Role',
    tableRankHeader: 'Rank',
    statWeightSummaryAllLeagues: 'Todos os torneios',
    weightMetricSummaryAvg: 'Média',
    weightMetricSummaryTop3: 'Top 3 scores',
    tableStatHeader: 'Atributo',
    fractalToggle: 'Ignorar bônus fractal na simulação',
    fractalHintAria: 'Por que ignorar o bônus fractal?',
    fractalTooltip:
      'Na maioria dos casos, ignorar o bônus fractal gera resultados mais realistas. Os +60% exigem que todas as qualidades ativas sejam diferentes — conforme as qualidades melhoram, essa condição costuma quebrar e o bônus some, tornando ganhos ou perdas ligados ao fractal frequentemente enganosos.',
    tabStats: 'Atributos',
    tabQualities: 'Qualidades',
    tabTraits: 'Traços',
    ariaEmblemStat: 'Atributo do emblema',
    ariaQuality: 'Qualidade',
    ariaTrait: 'Traço',
    langSwitcherAria: 'Idioma',
    langEn: 'Inglês',
    langPt: 'Português',
    roles: { core: 'Principal', mid: 'Meio', support: 'Suporte' },
    attributes: {
      creepScore: 'Criaturas',
      gpm: 'OPM',
      deaths: 'Mortes',
      kills: 'Vítimas',
      towers: 'Torres Destruídas',
      madstonesCollected: 'Lascas Coletadas',
      teamfight: 'Bat. Equipes',
      stuns: 'Atordoamentos',
      tormentorKills: 'Tormentas Destruídas',
      roshanKills: 'Roshans Mortos',
      firstBlood: 'Primeira Vítima',
      courierKills: 'Entregadores Mortos',
      wardsPlaced: 'Sentinelas Posicionadas',
      campsStacked: 'Acampamentos Acumulados',
      lotusesGained: 'Lótus Obtidos',
      watchersTaken: 'Vigias Ativados',
      runesGrabbed: 'Runas Obtidas',
      smokesUsed: 'Fumaças Usadas',
    },
    traits: {
      fractal: 'Fractal',
      friendly: 'Amigável',
      benevolent: 'Benevolente',
      vampiric: 'Vampírico',
      unique: 'Único',
    },
    tierPrefix: 'Nível',
    operations: {
      rerollStatForGreenEmblems: 'Renovar atributo dos emblemas verdes',
      rerollStatForFirstGreenEmblem: 'Renovar atributo do primeiro emblema verde',
      rerollStatForLastGreenEmblem: 'Renovar atributo do último emblema verde',
      rerollStatForRandomGreenEmblem: 'Renovar atributo de um emblema verde aleatório',
      rerollStatForRedEmblems: 'Renovar atributo dos emblemas vermelhos',
      rerollStatForBlueEmblems: 'Renovar atributo dos emblemas azuis',
      randomlyIncreaseOneQuality: 'Aumentar aleatoriamente uma qualidade',
      randomlyIncreaseTwoQualitiesAndReduceOne:
        'Aumentar duas qualidades aleatoriamente e reduzir uma',
      rerollQualityForGreenEmblems: 'Renovar qualidade dos emblemas verdes',
      rerollQualityForRedEmblems: 'Renovar qualidade dos emblemas vermelhos',
      rerollQualityForFirstRedEmblem: 'Renovar qualidade do primeiro emblema vermelho',
      rerollQualityForLastRedEmblem: 'Renovar qualidade do último emblema vermelho',
      rerollQualityForRandomRedEmblem: 'Renovar qualidade de um emblema vermelho aleatório',
      rerollQualityForBlueEmblems: 'Renovar qualidade dos emblemas azuis',
      rerollTraitForGreenEmblems: 'Renovar traço dos emblemas verdes',
      rerollTraitForRedEmblems: 'Renovar traço dos emblemas vermelhos',
      rerollTraitForBlueEmblems: 'Renovar traço dos emblemas azuis',
      rerollTraitForFirstBlueEmblem: 'Renovar traço do primeiro emblema azul',
      rerollTraitForLastBlueEmblem: 'Renovar traço do último emblema azul',
      rerollTraitForRandomBlueEmblem: 'Renovar traço de um emblema azul aleatório',
    },
    skipReasons: {
      noEligibleEmblems: 'Não há emblemas elegíveis para aumentar',
      lessThanTwoEligibleEmblems: 'Há menos de 2 emblemas elegíveis para aumentar',
      noColorEmblemsToReroll: 'Nenhum emblema {color} para renovar',
    },
    colors: { red: 'vermelho', green: 'verde', blue: 'azul' },
    sim: {
      resultsEyebrow: 'Resultados da Simulação',
      fractalNotice: 'Bônus do fractal tratado como 0% nestes resultados',
      simulations: 'simulações',
      bestPick: 'Melhor escolha',
      statWeightChangeLabel: 'Mudança esperada no peso dos atributos',
      bannerScoreChangeLabel: 'Mudança na pontuação',
      qualityBonusChangeLabel: 'Mudança esperada no bônus de qualidade',
      traitsBonusChangeLabel: 'Mudança esperada no bônus de traços',
      metricHintAria: 'Mais sobre esta métrica',
      avgOnImprove: 'Média ao melhorar',
      avgOnWorsen: 'Média ao piorar',
      outcomeChancesAria: 'Distribuição de resultados',
      moreBreakdown: 'Mais detalhes',
      hideBreakdown: 'Ocultar detalhes',
      improve: 'Melhora',
      neutral: 'Neutro',
      worsen: 'Piora',
      quality: 'Qualidade',
      traits: 'Traços',
      bannerTotal: 'Total do estandarte',
      statWeight: 'Peso dos atributos',
      bannerPercent: 'Percentual do estandarte',
      overallScore: 'Pontuação geral do estandarte',
      overallScoreTooltip:
        'Mudança esperada na pontuação geral do estandarte, baseada nos percentuais de bônus dos emblemas e nos pesos dos atributos. Para simplificar, considera apenas o bônus de uma partida — na prática, essa mudança de pontuação deve ser dobrada, pois o estandarte soma a pontuação das duas melhores partidas da série.',
      expectedChange: 'Mudança esperada',
      improveChance: 'Chance de melhorar',
      worsenChance: 'Chance de piorar',
      neutralChance: 'Chance neutra',
    },
  },
};

function interpolate(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

export function getStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'pt' ? 'pt' : 'en';
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
  localStorage.setItem(STORAGE_KEY, language);
}

export function initLanguage(): Language {
  currentLanguage = getStoredLanguage();
  return currentLanguage;
}

export function getOperationLabel(operation: Operation, language = currentLanguage): string {
  return TRANSLATIONS[language].operations[operation];
}

export function getRoleLabel(role: Role, language = currentLanguage): string {
  return TRANSLATIONS[language].roles[role];
}

export function getAttributeLabel(attribute: Attribute, language = currentLanguage): string {
  return TRANSLATIONS[language].attributes[attribute];
}

export function getTraitLabel(trait: Trait, language = currentLanguage): string {
  return TRANSLATIONS[language].traits[trait];
}

export function getQualityLabel(quality: Quality, language = currentLanguage): string {
  const { tierPrefix } = TRANSLATIONS[language];
  return `${tierPrefix} ${ROMAN_TIERS[quality]}`;
}

export function getSkipReasonText(reason: SkipReason, language = currentLanguage): string {
  const copy = TRANSLATIONS[language].skipReasons;
  if (reason === 'noEligibleEmblems') {
    return copy.noEligibleEmblems;
  }
  if (reason === 'lessThanTwoEligibleEmblems') {
    return copy.lessThanTwoEligibleEmblems;
  }
  const colorLabel = TRANSLATIONS[language].colors[reason.color];
  return interpolate(copy.noColorEmblemsToReroll, { color: colorLabel });
}

export function getSimCopy(language = currentLanguage): TranslationTree['sim'] {
  return TRANSLATIONS[language].sim;
}

export function getPageTitle(language = currentLanguage): string {
  return TRANSLATIONS[language].pageTitle;
}

export function getAttributesForEmblemColor(
  emblemEl: HTMLElement
): Attribute[] {
  if (emblemEl.classList.contains('emblem--red')) {
    return RED_ATTRIBUTES;
  }
  if (emblemEl.classList.contains('emblem--green')) {
    return GREEN_ATTRIBUTES;
  }
  if (emblemEl.classList.contains('emblem--blue')) {
    return BLUE_ATTRIBUTES;
  }
  return RED_ATTRIBUTES;
}

export { ALL_TRAITS, RED_ATTRIBUTES, GREEN_ATTRIBUTES, BLUE_ATTRIBUTES };

export function getTranslations(language = currentLanguage): TranslationTree {
  return TRANSLATIONS[language];
}
