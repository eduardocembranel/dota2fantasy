import './styles.css';
import {
  appState,
  getActiveStage,
  getAppState,
  getDashboardState,
  initApp,
  logAppState,
  populateLeagueFilterFromMatchMetrics,
  parseQuality,
  parseTrait,
  parseAttribute,
  parseRole,
  parseOperation,
  readBanner,
  readEmblem,
  refreshAppState,
} from './app';
import { calculateOperationOutcome } from './probability';
import { initMatchMetrics } from './matchMetrics/loadMatchMetrics';

initApp();

initMatchMetrics().then(({ matches, failed }) => {
  populateLeagueFilterFromMatchMetrics();
  console.log('[match-metrics] loaded', {
    matches: matches.length,
    failed: failed.length,
    sample: matches[0],
  });
  if (failed.length > 0) {
    console.warn('[match-metrics] failed to load', failed);
  }
});

window.dotaFantasy = {
  appState,
  readEmblem,
  readBanner,
  getDashboardState,
  getAppState,
  getActiveStage,
  refreshAppState,
  logAppState,
  parseQuality,
  parseTrait,
  parseAttribute,
  parseRole,
  parseOperation,
  calculateOperationOutcome,
};
