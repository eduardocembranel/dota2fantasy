import {
  getOperationLabel,
  getRoleLabel,
  getSimCopy,
  getSkipReasonText,
} from './i18n';
import type {
  BannerOperationSummary,
  Operation,
  OperationCategory,
  OperationOutcome,
  OperationSimulationResult,
  Role,
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

function interpolate(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
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
  return summary.emblemTotalOutcome;
}

function getPrimaryMetricKey(category: OperationCategory): 'quality' | 'trait' | 'bannerTotal' {
  if (category === 'quality') {
    return 'quality';
  }
  if (category === 'trait') {
    return 'trait';
  }
  return 'bannerTotal';
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
    const total = summary.emblemTotalOutcome.expectedOutcome;

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

function renderProbabilityBar(outcome: OperationOutcome, chancesLabel: string): string {
  const sim = getSimCopy();

  return `
    <section class="sim-chances">
      <p class="sim-chances__label">${chancesLabel}</p>
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

function renderOutcomeDetails(label: string, outcome: OperationOutcome): string {
  const sim = getSimCopy();

  return `
    <div class="sim-detail-block">
      <h4 class="sim-detail-label">${label}</h4>
      <dl class="sim-detail-grid">
        <div><dt>${sim.expectedChange}</dt><dd>${formatSignedPercent(outcome.expectedOutcome)}</dd></div>
        <div><dt>${sim.improveChance}</dt><dd>${formatChance(outcome.improveChance)}</dd></div>
        <div><dt>${sim.worsenChance}</dt><dd>${formatChance(outcome.worsenChance)}</dd></div>
        <div><dt>${sim.neutralChance}</dt><dd>${formatChance(outcome.neutralChance)}</dd></div>
        <div><dt>${sim.avgOnImprove}</dt><dd>${formatSignedPercent(outcome.avgImprove)}</dd></div>
        <div><dt>${sim.avgOnWorsen}</dt><dd>${formatSignedPercent(outcome.avgWorsen)}</dd></div>
      </dl>
    </div>
  `;
}

function getDetailBlocks(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>,
  category: OperationCategory
): string[] {
  const sim = getSimCopy();
  const totalBlock = renderOutcomeDetails(sim.totalBanner, summary.emblemTotalOutcome);

  if (category === 'quality') {
    return [renderOutcomeDetails(sim.trait, summary.traitOutcome), totalBlock];
  }

  return [totalBlock];
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
  const primaryMetricKey = getPrimaryMetricKey(category);
  const primaryMetricLabel = sim[primaryMetricKey];
  const detailsId = `sim-details-${role}`;
  const categoryClass = `sim-card--${category}`;
  const detailBlocks = getDetailBlocks(summary, category);

  return `
    <article class="sim-card ${categoryClass}${isBest ? ' sim-card--best' : ''}">
      <header class="sim-card__header">
        <h3 class="sim-card__role">${roleLabel}</h3>
        ${isBest ? `<span class="sim-card__badge">${sim.bestPick}</span>` : ''}
      </header>

      <section class="sim-primary">
        <p class="sim-primary__label">${interpolate(sim.expectedBonusChange, { metric: primaryMetricLabel })}</p>
        <p class="sim-primary__value ${outcomeClass(primary.expectedOutcome)}">${formatSignedPercent(primary.expectedOutcome)}</p>
        <div class="sim-avg-pair">
          <div class="sim-avg sim-avg--improve">
            <span class="sim-avg__label">${sim.avgOnImprove}</span>
            <span class="sim-avg__value">${formatSignedPercent(primary.avgImprove)}</span>
          </div>
          <div class="sim-avg sim-avg--worsen">
            <span class="sim-avg__label">${sim.avgOnWorsen}</span>
            <span class="sim-avg__value">${formatSignedPercent(primary.avgWorsen)}</span>
          </div>
        </div>
      </section>

      ${renderProbabilityBar(
        primary,
        interpolate(sim.outcomeChances, { metric: primaryMetricLabel })
      )}

      ${
        category !== 'stats'
          ? `
      <div class="sim-secondary">
        <span class="sim-secondary__label">${sim.totalBannerChange}</span>
        <span class="sim-secondary__value ${outcomeClass(summary.emblemTotalOutcome.expectedOutcome)}">${formatSignedPercent(summary.emblemTotalOutcome.expectedOutcome)}</span>
      </div>`
          : ''
      }

      <button class="sim-details-toggle" type="button" aria-expanded="false" aria-controls="${detailsId}" data-label-more="${sim.moreBreakdown}" data-label-hide="${sim.hideBreakdown}">${sim.moreBreakdown}</button>
      <div class="sim-details" id="${detailsId}" hidden>
        ${detailBlocks.join('')}
      </div>
    </article>
  `;
}

export function renderSimulationResults(
  container: HTMLElement,
  operation: Operation,
  category: OperationCategory,
  result: OperationSimulationResult,
  ignoreFractalBonus: boolean
): void {
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
