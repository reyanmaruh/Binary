import type { AppState, Item } from './types';

export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export const BITS = [128, 64, 32, 16, 8, 4, 2, 1];

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function levelFor(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export function xpForLevel(lv: number): number {
  return (Math.max(1, lv) - 1) * 100;
}

export function xpProgress(xp: number) {
  const lv = levelFor(xp);
  const lo = xpForLevel(lv);
  const hi = xpForLevel(lv + 1);
  const into = Math.max(0, xp - lo);
  const need = Math.max(1, hi - lo);
  return { lv, into, need, ratio: clamp(into / need, 0, 1) };
}

export function toBin(n: number): string {
  return (n & 255).toString(2).padStart(8, '0');
}

export function binToDec(bits: string): number {
  let v = 0;
  for (const ch of bits) v = v * 2 + (ch === '1' ? 1 : 0);
  return v;
}

export function fmtCpm(v: number | null | undefined): string {
  if (v == null) return '—';
  return (Math.round(v * 10) / 10).toFixed(1);
}

export function pct(v: number, digits = 1): string {
  return (Math.round(v * 1000) / 10).toFixed(digits) + '%';
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function itemKey(item: Item): string {
  return String(item.prompt || item.bits || item.shown || item.value || item.type);
}

export function lessonStateDefault() {
  return {
    stars: 0,
    bestCpm: null as number | null,
    completed: false,
    practicePassed: false,
    practiceBest: null as number | null,
    attempts: 0,
    paidClear: false,
  };
}

export function isUnlocked(state: AppState, lessons: { id: string }[], index: number): boolean {
  if (index <= 0) return true;
  const prev = state.lessons[lessons[index - 1].id];
  return !!prev && prev.completed && prev.practicePassed;
}

export function daysPractised(state: AppState): number {
  return new Set(state.history.map((h) => h.day)).size;
}
