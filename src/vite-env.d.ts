/// <reference types="vite/client" />

import type { DotaFantasyAPI } from './types';

declare global {
  interface Window {
    dotaFantasy: DotaFantasyAPI;
  }
}

export {};
