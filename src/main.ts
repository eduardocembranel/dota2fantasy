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
  parseOperation,
  readBanner,
  readEmblem,
  refreshAppState,
} from './app';
import { calculateOperationOutcome } from './probability';

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
  parseOperation,
  calculateOperationOutcome,
};
