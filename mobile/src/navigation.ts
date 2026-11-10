import type { SessionResult } from './types';

export type TabName = 'home' | 'practice' | 'stats' | 'settings';

export interface Route {
  name: TabName | 'player' | 'results';
  params?: unknown;
}

export interface Nav {
  go: (name: Route['name'], params?: unknown) => void;
  replace: (name: Route['name'], params?: unknown) => void;
  back: () => void;
  tab: (name: TabName) => void;
}

export type ResultsParams = SessionResult;
