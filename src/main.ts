import './styles.css';
import {
  appState,
  getActiveStage,
  getAppState,
  getDashboardState,
  initApp,
  logAppState,
  parseQuality,
  parseTrait,
  parseAttribute,
  parseRole,
  readBanner,
  readEmblem,
  refreshAppState,
} from './app';
import {
  calculateExpectedOutcome,
  calculateOperationProbability,
  resolveOperationRules,
} from './probability';

initApp();

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
  calculateExpectedOutcome,
  calculateOperationProbability,
  resolveOperationRules,
};
