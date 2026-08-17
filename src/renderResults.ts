import {
  getOperationLabel,
  getRoleLabel,
  getSimCopy,
  getSkipReasonText,
} from './i18n';
import {
  OPERATION_CATEGORY,
  type BannerOperationSummary,
  type Operation,
  type OperationCategory,
  type OperationOutcome,
  type OperationSimulationResult,
  type Role,
} from './types';

const ROLES: Role[] = ['core', 'mid', 'support'];

function formatSignedPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0) {
    return `+${rounded}%`;
  }
  if (rounded < 0) {
    return `${rounded}%`;
  }
  return '0%';
}

function formatChance(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSignedNumber(value: number): string {
  const rounded = Math.round(value);
  if (rounded > 0) {
    return `+${rounded}`;
  }
  if (rounded < 0) {
    return String(rounded);
  }
  return '0';
}

function formatOutcomeValue(value: number, category: OperationCategory): string {
  if (category === 'stats') {
    return formatSignedNumber(value);
  }

  return formatSignedPercent(value);
}

type OutcomeValueFormat = 'percent' | 'number';

function formatOutcomeValueByFormat(value: number, format: OutcomeValueFormat): string {
  if (format === 'number') {
    return formatSignedNumber(value);
  }

  return formatSignedPercent(value);
}

function formatDeltaWithBaselinePercent(delta: number, baseline: number): string {
  const value = formatSignedNumber(delta);
  if (baseline === 0) {
    return value;
  }

  const percent = (delta / baseline) * 100;
  return `${value} (${formatSignedPercent(percent)})`;
}

function formatStatWeightPrimaryValue(delta: number, statWeightTotal: number): string {
  return formatDeltaWithBaselinePercent(delta, statWeightTotal);
}

function formatPrimaryOutcomeValue(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>,
  outcome: OperationOutcome,
  category: OperationCategory
): string {
  if (category === 'stats') {
    return formatStatWeightPrimaryValue(outcome.expectedOutcome, summary.statWeightTotal);
  }

  return formatOutcomeValue(outcome.expectedOutcome, category);
}

function getPrimaryOutcome(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>,
  category: OperationCategory
): OperationOutcome {
  if (category === 'quality') {
    return summary.qualityOutcome;
  }
  if (category === 'trait') {
    return summary.traitOutcome;
  }
  if (category === 'stats') {
    return summary.statWeightOutcome;
  }
  return summary.totalPercentOutcome;
}

function getPrimaryChangeLabel(
  category: OperationCategory,
  sim: ReturnType<typeof getSimCopy>
): string {
  if (category === 'stats') {
    return sim.statWeightChangeLabel;
  }
  if (category === 'quality') {
    return sim.qualityBonusChangeLabel;
  }
  if (category === 'trait') {
    return sim.traitsBonusChangeLabel;
  }
  return sim.statWeightChangeLabel;
}

function renderMetricLabel(label: string, tooltip: string, hintAria: string): string {
  if (!tooltip) {
    return `<span class="sim-metric-label__text">${label}</span>`;
  }

  return `
    <div class="sim-metric-label">
      <span class="sim-metric-label__text">${label}</span>
      <span
        class="sim-metric-label__hint"
        tabindex="0"
        role="button"
        aria-label="${hintAria}"
        onmousedown="event.preventDefault()"
      >
        ?
        <span class="sim-metric-label__tooltip">${tooltip}</span>
      </span>
    </div>
  `;
}

function findBestRole(
  results: Record<Role, BannerOperationSummary>,
  category: OperationCategory
): Role | null {
  let bestRole: Role | null = null;
  let bestValue = -Infinity;
  let bestTotal = -Infinity;

  for (const role of ROLES) {
    const summary = results[role];
    if (summary.status === 'skipped') {
      continue;
    }

    const primary = getPrimaryOutcome(summary, category);
    const total = summary.totalPercentOutcome.expectedOutcome;

    if (primary.expectedOutcome > bestValue || (primary.expectedOutcome === bestValue && total > bestTotal)) {
      bestValue = primary.expectedOutcome;
      bestTotal = total;
      bestRole = role;
    }
  }

  return bestRole;
}

function outcomeClass(value: number): string {
  if (value > 0) {
    return 'sim-value--positive';
  }
  if (value < 0) {
    return 'sim-value--negative';
  }
  return 'sim-value--neutral';
}

function renderProbabilityBar(outcome: OperationOutcome): string {
  const sim = getSimCopy();

  return `
    <section class="sim-chances" aria-label="${sim.outcomeChancesAria}">
      <div class="sim-prob-bar" aria-hidden="true">
        <span class="sim-prob-bar__segment sim-prob-bar__segment--improve" style="width: ${outcome.improveChance * 100}%"></span>
        <span class="sim-prob-bar__segment sim-prob-bar__segment--neutral" style="width: ${outcome.neutralChance * 100}%"></span>
        <span class="sim-prob-bar__segment sim-prob-bar__segment--worsen" style="width: ${outcome.worsenChance * 100}%"></span>
      </div>
      <p class="sim-prob-legend">
        <span>${sim.improve} ${formatChance(outcome.improveChance)}</span>
        <span>${sim.neutral} ${formatChance(outcome.neutralChance)}</span>
        <span>${sim.worsen} ${formatChance(outcome.worsenChance)}</span>
      </p>
    </section>
  `;
}

function renderOutcomeDetails(
  label: string,
  outcome: OperationOutcome,
  valueFormat: OutcomeValueFormat,
  expectedChangeBaseline?: number
): string {
  const sim = getSimCopy();
  const formatValue = (value: number) => formatOutcomeValueByFormat(value, valueFormat);
  const formatExpectedChange =
    expectedChangeBaseline !== undefined && valueFormat === 'number'
      ? (value: number) => formatDeltaWithBaselinePercent(value, expectedChangeBaseline)
      : formatValue;

  return `
    <div class="sim-detail-block">
      <h4 class="sim-detail-label">${label}</h4>
      <dl class="sim-detail-grid">
        <div><dt>${sim.expectedChange}</dt><dd>${formatExpectedChange(outcome.expectedOutcome)}</dd></div>
        <div><dt>${sim.neutralChance}</dt><dd>${formatChance(outcome.neutralChance)}</dd></div>
        <div><dt>${sim.avgOnWorsen}</dt><dd>${formatValue(outcome.avgWorsen)}</dd></div>
        <div><dt>${sim.worsenChance}</dt><dd>${formatChance(outcome.worsenChance)}</dd></div>
        <div><dt>${sim.avgOnImprove}</dt><dd>${formatValue(outcome.avgImprove)}</dd></div>
        <div><dt>${sim.improveChance}</dt><dd>${formatChance(outcome.improveChance)}</dd></div>
      </dl>
    </div>
  `;
}

function renderOverallScoreSection(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>
): string {
  const sim = getSimCopy();
  const outcome = summary.overallScoreOutcome;
  const value = formatDeltaWithBaselinePercent(outcome.expectedOutcome, summary.overallScoreTotal);

  return `
    <section class="sim-overall-score">
      <div class="sim-overall-score__label">${renderMetricLabel(
        sim.bannerScoreChangeLabel,
        sim.overallScoreTooltip,
        sim.metricHintAria
      )}</div>
      <p class="sim-overall-score__value ${outcomeClass(outcome.expectedOutcome)}">${value}</p>
      ${renderProbabilityBar(outcome)}
    </section>
  `;
}

function traitOutcomeChanged(traitOutcome: OperationOutcome): boolean {
  return traitOutcome.neutralChance < 1;
}

function getDetailBlocks(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>,
  category: OperationCategory
): string[] {
  if (category !== 'quality' || !traitOutcomeChanged(summary.traitOutcome)) {
    return [];
  }

  const sim = getSimCopy();
  return [
    renderOutcomeDetails(sim.traits, summary.traitOutcome, 'percent'),
    renderOutcomeDetails(sim.bannerPercent, summary.totalPercentOutcome, 'percent'),
  ];
}

function renderCard(
  role: Role,
  summary: BannerOperationSummary,
  category: OperationCategory,
  isBest: boolean
): string {
  const sim = getSimCopy();
  const roleLabel = getRoleLabel(role);

  if (summary.status === 'skipped') {
    return `
      <article class="sim-card sim-card--skipped">
        <header class="sim-card__header">
          <h3 class="sim-card__role">${roleLabel}</h3>
        </header>
        <p class="sim-card__skipped">${getSkipReasonText(summary.reason)}</p>
      </article>
    `;
  }

  const primary = getPrimaryOutcome(summary, category);
  const detailsId = `sim-details-${role}`;
  const categoryClass = `sim-card--${category}`;
  const detailBlocks = getDetailBlocks(summary, category);
  const hasDetailBlocks = detailBlocks.length > 0;
  const primaryLabel = getPrimaryChangeLabel(category, sim);

  return `
    <article class="sim-card ${categoryClass}${isBest ? ' sim-card--best' : ''}">
      <header class="sim-card__header">
        <h3 class="sim-card__role">${roleLabel}</h3>
        ${isBest ? `<span class="sim-card__badge">${sim.bestPick}</span>` : ''}
      </header>

      <section class="sim-primary">
        <p class="sim-primary__label">${primaryLabel}</p>
        <p class="sim-primary__value ${outcomeClass(primary.expectedOutcome)}">${formatPrimaryOutcomeValue(summary, primary, category)}</p>
        <div class="sim-avg-pair">
          <div class="sim-avg sim-avg--improve">
            <span class="sim-avg__label">${sim.avgOnImprove}</span>
            <span class="sim-avg__value">${formatOutcomeValue(primary.avgImprove, category)}</span>
          </div>
          <div class="sim-avg sim-avg--worsen">
            <span class="sim-avg__label">${sim.avgOnWorsen}</span>
            <span class="sim-avg__value">${formatOutcomeValue(primary.avgWorsen, category)}</span>
          </div>
        </div>
        ${renderProbabilityBar(primary)}
      </section>

      ${renderOverallScoreSection(summary)}

      ${
        hasDetailBlocks
          ? `
      <button class="sim-details-toggle" type="button" aria-expanded="false" aria-controls="${detailsId}" data-label-more="${sim.moreBreakdown}" data-label-hide="${sim.hideBreakdown}">${sim.moreBreakdown}</button>
      <div class="sim-details" id="${detailsId}" hidden>
        ${detailBlocks.join('')}
      </div>`
          : ''
      }
    </article>
  `;
}

export function renderSimulationResults(
  container: HTMLElement,
  operation: Operation,
  result: OperationSimulationResult,
  ignoreFractalBonus: boolean
): void {
  const category = OPERATION_CATEGORY[operation];
  const sim = getSimCopy();
  const bestRole = findBestRole(result.simulationResults, category);

  container.innerHTML = `
    <section class="sim-results">
      <header class="sim-results__header">
        <div class="sim-results__intro">
          <p class="sim-results__eyebrow">${sim.resultsEyebrow}</p>
          <h2 class="sim-results__operation">${getOperationLabel(operation)}</h2>
          ${
            ignoreFractalBonus
              ? `<p class="sim-results__notice">${sim.fractalNotice}</p>`
              : ''
          }
        </div>
        <p class="sim-results__meta">${result.numSimulations.toLocaleString()} ${sim.simulations}</p>
      </header>
      <div class="sim-results__grid">
        ${ROLES.map((role) =>
          renderCard(role, result.simulationResults[role], category, role === bestRole)
        ).join('')}
      </div>
    </section>
  `;

  container.querySelectorAll<HTMLButtonElement>('.sim-details-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const panelId = button.getAttribute('aria-controls');
      const panel = panelId ? container.querySelector<HTMLElement>(`#${panelId}`) : null;
      if (!panel) {
        return;
      }

      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      button.setAttribute('aria-expanded', String(!isOpen));
      const moreLabel = button.getAttribute('data-label-more') ?? sim.moreBreakdown;
      const hideLabel = button.getAttribute('data-label-hide') ?? sim.hideBreakdown;
      button.textContent = isOpen ? moreLabel : hideLabel;
    });
  });
}
