import { OPERATION_LABELS } from './types';
import type {
  BannerOperationSummary,
  Operation,
  OperationCategory,
  OperationOutcome,
  OperationSimulationResult,
  Role,
} from './types';

const ROLES: Role[] = ['core', 'mid', 'support'];

const ROLE_LABELS: Record<Role, string> = {
  core: 'Core',
  mid: 'Mid',
  support: 'Support',
};

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

function getPrimaryLabel(category: OperationCategory): string {
  if (category === 'quality') {
    return 'Quality';
  }
  if (category === 'trait') {
    return 'Trait';
  }
  return 'Banner total';
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
  return `
    <section class="sim-chances">
      <p class="sim-chances__label">${chancesLabel}</p>
      <div class="sim-prob-bar" aria-hidden="true">
        <span class="sim-prob-bar__segment sim-prob-bar__segment--improve" style="width: ${outcome.improveChance * 100}%"></span>
        <span class="sim-prob-bar__segment sim-prob-bar__segment--neutral" style="width: ${outcome.neutralChance * 100}%"></span>
        <span class="sim-prob-bar__segment sim-prob-bar__segment--worsen" style="width: ${outcome.worsenChance * 100}%"></span>
      </div>
      <p class="sim-prob-legend">
        <span>Improve ${formatChance(outcome.improveChance)}</span>
        <span>Neutral ${formatChance(outcome.neutralChance)}</span>
        <span>Worsen ${formatChance(outcome.worsenChance)}</span>
      </p>
    </section>
  `;
}

function renderOutcomeDetails(label: string, outcome: OperationOutcome): string {
  return `
    <div class="sim-detail-block">
      <h4 class="sim-detail-label">${label}</h4>
      <dl class="sim-detail-grid">
        <div><dt>Expected change</dt><dd>${formatSignedPercent(outcome.expectedOutcome)}</dd></div>
        <div><dt>Improve chance</dt><dd>${formatChance(outcome.improveChance)}</dd></div>
        <div><dt>Worsen chance</dt><dd>${formatChance(outcome.worsenChance)}</dd></div>
        <div><dt>Neutral chance</dt><dd>${formatChance(outcome.neutralChance)}</dd></div>
        <div><dt>Avg on improve</dt><dd>${formatSignedPercent(outcome.avgImprove)}</dd></div>
        <div><dt>Avg on worsen</dt><dd>${formatSignedPercent(outcome.avgWorsen)}</dd></div>
      </dl>
    </div>
  `;
}

function getDetailBlocks(
  summary: Extract<BannerOperationSummary, { status: 'simulated' }>,
  category: OperationCategory
): string[] {
  const totalBlock = renderOutcomeDetails('Total banner', summary.emblemTotalOutcome);

  if (category === 'quality') {
    return [renderOutcomeDetails('Trait', summary.traitOutcome), totalBlock];
  }

  return [totalBlock];
}

function renderCard(
  role: Role,
  summary: BannerOperationSummary,
  category: OperationCategory,
  isBest: boolean
): string {
  const roleLabel = ROLE_LABELS[role];

  if (summary.status === 'skipped') {
    return `
      <article class="sim-card sim-card--skipped">
        <header class="sim-card__header">
          <h3 class="sim-card__role">${roleLabel}</h3>
        </header>
        <p class="sim-card__skipped">${summary.reason}</p>
      </article>
    `;
  }

  const primary = getPrimaryOutcome(summary, category);
  const primaryLabel = getPrimaryLabel(category);
  const detailsId = `sim-details-${role}`;
  const categoryClass = `sim-card--${category}`;
  const detailBlocks = getDetailBlocks(summary, category);

  return `
    <article class="sim-card ${categoryClass}${isBest ? ' sim-card--best' : ''}">
      <header class="sim-card__header">
        <h3 class="sim-card__role">${roleLabel}</h3>
        ${isBest ? '<span class="sim-card__badge">Best pick</span>' : ''}
      </header>

      <section class="sim-primary">
        <p class="sim-primary__label">Expected ${primaryLabel.toLowerCase()} bonus change</p>
        <p class="sim-primary__value ${outcomeClass(primary.expectedOutcome)}">${formatSignedPercent(primary.expectedOutcome)}</p>
        <div class="sim-avg-pair">
          <div class="sim-avg sim-avg--improve">
            <span class="sim-avg__label">Avg on improve</span>
            <span class="sim-avg__value">${formatSignedPercent(primary.avgImprove)}</span>
          </div>
          <div class="sim-avg sim-avg--worsen">
            <span class="sim-avg__label">Avg on worsen</span>
            <span class="sim-avg__value">${formatSignedPercent(primary.avgWorsen)}</span>
          </div>
        </div>
      </section>

      ${renderProbabilityBar(primary, `${primaryLabel} outcome chances`)}

      ${
        category !== 'stats'
          ? `
      <div class="sim-secondary">
        <span class="sim-secondary__label">Total banner change</span>
        <span class="sim-secondary__value ${outcomeClass(summary.emblemTotalOutcome.expectedOutcome)}">${formatSignedPercent(summary.emblemTotalOutcome.expectedOutcome)}</span>
      </div>`
          : ''
      }

      <button class="sim-details-toggle" type="button" aria-expanded="false" aria-controls="${detailsId}">More breakdown</button>
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
  const bestRole = findBestRole(result.simulationResults, category);

  container.innerHTML = `
    <section class="sim-results">
      <header class="sim-results__header">
        <div class="sim-results__intro">
          <p class="sim-results__eyebrow">Simulation Results</p>
          <h2 class="sim-results__operation">${OPERATION_LABELS[operation]}</h2>
          ${
            ignoreFractalBonus
              ? '<p class="sim-results__notice">Fractal own bonus treated as 0% in these results</p>'
              : ''
          }
        </div>
        <p class="sim-results__meta">${result.numSimulations.toLocaleString()} simulations</p>
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
      button.textContent = isOpen ? 'More breakdown' : 'Hide breakdown';
    });
  });
}
