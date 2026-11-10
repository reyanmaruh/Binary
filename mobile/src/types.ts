export type Mode = 'lesson' | 'practice' | 'boss' | 'flash' | 'weak';

export type ItemType = 'TAP' | 'NUM' | 'MCQ' | 'MATCH' | 'ORDER' | 'SPOT' | 'BLANK' | 'BOSS';

export interface Item {
  type: ItemType;
  direction?: 'dec2bin' | 'bin2dec';
  value?: number;
  bits?: string;
  prompt?: string;
  options?: string[];
  answer?: string | number;
  pairs?: [string, string][];
  items?: string[];
  correctOrder?: string[];
  shown?: string;
  wrongBitIndex?: number;
  known?: string;
  showChart?: boolean;
  showHints?: boolean;
  autoSubmit?: boolean;
  durationSec?: number;
  pool?: string;
  max?: number;
  [key: string]: unknown;
}

export interface Theory {
  heading: string;
  body: string;
  visual?: string;
  takeaway: string;
}

export interface Lesson {
  id: string;
  section: number;
  unit: number;
  title: string;
  subtitle: string;
  newConcept?: string;
  scaffold: { chart?: boolean; hints?: boolean; timer?: boolean };
  xp: number;
  passCriteria: { accuracy: number; cpm: number | null };
  theory: Theory[];
  items: Item[];
}

export interface LessonState {
  stars: number;
  bestCpm: number | null;
  completed: boolean;
  practicePassed: boolean;
  practiceBest: number | null;
  attempts: number;
  paidClear: boolean;
}

export interface DailyState {
  day: string;
  xp: number;
  gems: number;
  pb: Record<string, string>;
}

export interface Profile {
  name: string;
  age: number | null;
  onboarded: boolean;
}

export interface HistoryEntry {
  day: string;
  cpm?: number | null;
  mode?: Mode;
}

export interface AppState {
  xp: number;
  gems: number;
  hearts: number;
  heartsRefilledAt: number;
  lessons: Record<string, LessonState>;
  srs: Record<string, { errorCount: number }>;
  settings: { haptics: boolean; reducedMotion: boolean };
  stats: { conversions: number; correct: number; attempts: number; sessions: number };
  history: HistoryEntry[];
  profile: Profile;
  daily: DailyState;
  bossBest: number | null;
  flashBest: number | null;
}

export interface SessionInput {
  mode: Mode;
  lessonId?: string;
  attempts: number;
  correct: number;
  convCorrect: number;
  convMs: number;
  combo: number;
  answerXp: number;
  failed?: boolean;
}

export interface SessionResult {
  mode: Mode;
  lessonId?: string;
  lessonTitle: string;
  passed: boolean;
  failed: boolean;
  accuracy: number;
  cpm: number | null;
  stars: number;
  xpEarned: number;
  gemsEarned: number;
  cappedXp: number;
  levelUp: boolean;
  firstClear: boolean;
  nextLessonId: string | null;
  bossCorrect: number;
  bestCombo: number;
}
