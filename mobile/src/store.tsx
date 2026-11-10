import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CONFIG, LESSONS } from './data/curriculum';
import type { AppState, LessonState, SessionInput, SessionResult } from './types';
import { dayKey, lessonStateDefault, levelFor } from './utils';

const STORE_KEY = 'binaryTrainer.mobile.v1';

export function defaultState(): AppState {
  return {
    xp: 0,
    gems: 0,
    hearts: CONFIG.heartsMax,
    heartsRefilledAt: Date.now(),
    lessons: {},
    srs: {},
    settings: { haptics: true, reducedMotion: false },
    stats: { conversions: 0, correct: 0, attempts: 0, sessions: 0 },
    history: [],
    profile: { name: '', age: null, onboarded: false },
    daily: { day: dayKey(), xp: 0, gems: 0, pb: {} },
    bossBest: null,
    flashBest: null,
  };
}

function mergeState(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    ...base,
    ...r,
    lessons: r.lessons || {},
    srs: r.srs || {},
    settings: { ...base.settings, ...(r.settings || {}) },
    stats: { ...base.stats, ...(r.stats || {}) },
    profile: { ...base.profile, ...(r.profile || {}) },
    daily: { ...base.daily, ...(r.daily || {}), pb: { ...(r.daily?.pb || {}) } },
    history: Array.isArray(r.history) ? r.history : [],
  };
}

interface Store {
  state: AppState;
  ready: boolean;
  setProfile: (name: string, age: number | null) => void;
  completeOnboarding: () => void;
  finishSession: (input: SessionInput) => SessionResult;
  loseHeart: () => number;
  refillWithGems: () => boolean;
  refillHeartsFree: () => void;
  buyOneHeart: () => boolean;
  addMiss: (key: string) => void;
  toggleSetting: (key: 'haptics' | 'reducedMotion') => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        try {
          setState(mergeState(JSON.parse(raw)));
        } catch {
          // ignore corrupt payloads
        }
      })
      .finally(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {});
    }, 200);
    return () => clearTimeout(id);
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    const step = CONFIG.heartsRefillMinutes * 60000;
    const tick = () =>
      setState((s) => {
        if (s.hearts >= CONFIG.heartsMax) return s;
        const gained = Math.floor((Date.now() - s.heartsRefilledAt) / step);
        if (gained <= 0) return s;
        const hearts = Math.min(CONFIG.heartsMax, s.hearts + gained);
        return {
          ...s,
          hearts,
          heartsRefilledAt: hearts >= CONFIG.heartsMax ? Date.now() : s.heartsRefilledAt + gained * step,
        };
      });
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [ready]);

  const setProfile = useCallback((name: string, age: number | null) => {
    setState((s) => ({ ...s, profile: { name: name.trim().slice(0, 24), age, onboarded: true } }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({ ...s, profile: { ...s.profile, onboarded: true } }));
  }, []);

  const loseHeart = useCallback(() => {
    const next = Math.max(0, state.hearts - 1);
    setState((s) => ({
      ...s,
      hearts: Math.max(0, s.hearts - 1),
      heartsRefilledAt: s.hearts === CONFIG.heartsMax ? Date.now() : s.heartsRefilledAt,
    }));
    return next;
  }, [state.hearts]);

  const refillWithGems = useCallback(() => {
    if (state.hearts >= CONFIG.heartsMax || state.gems < 50) return false;
    setState((s) => ({ ...s, gems: s.gems - 50, hearts: CONFIG.heartsMax, heartsRefilledAt: Date.now() }));
    return true;
  }, [state.gems, state.hearts]);

  const refillHeartsFree = useCallback(() => {
    setState((s) => ({ ...s, hearts: CONFIG.heartsMax, heartsRefilledAt: Date.now() }));
  }, []);

  const buyOneHeart = useCallback(() => {
    if (state.hearts >= CONFIG.heartsMax || state.gems < 20) return false;
    setState((s) => ({
      ...s,
      gems: s.gems - 20,
      hearts: Math.min(CONFIG.heartsMax, s.hearts + 1),
      heartsRefilledAt: s.hearts === CONFIG.heartsMax ? Date.now() : s.heartsRefilledAt,
    }));
    return true;
  }, [state.gems, state.hearts]);

  const addMiss = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      srs: { ...s.srs, [key]: { errorCount: (s.srs[key]?.errorCount || 0) + 1 } },
    }));
  }, []);

  const toggleSetting = useCallback((key: 'haptics' | 'reducedMotion') => {
    setState((s) => ({ ...s, settings: { ...s.settings, [key]: !s.settings[key] } }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...defaultState(), profile: s.profile }));
  }, []);

  const finishSession = useCallback(
    (input: SessionInput): SessionResult => {
      const lesson = LESSONS.find((l) => l.id === input.lessonId) || null;
      const previous = input.lessonId ? state.lessons[input.lessonId] : undefined;
      const ls: LessonState = previous ? { ...previous } : lessonStateDefault();
      const accuracy = input.attempts > 0 ? input.correct / input.attempts : 0;
      let cpm = input.convMs > 0 ? Math.round((input.convCorrect / (input.convMs / 60000)) * 10) / 10 : null;
      // A run where most answers were wrong has no meaningful speed score.
      if (input.mode !== 'boss' && input.attempts > 0 && input.correct / input.attempts < 0.5) cpm = null;

      const isLessonRun = input.mode === 'lesson' || input.mode === 'ghost';
      const metAccuracy = lesson ? accuracy >= lesson.passCriteria.accuracy : accuracy >= CONFIG.practiceGate;
      const cpmGate = lesson?.passCriteria.cpm ?? null;
      const metCpm = !cpmGate || (cpm != null && cpm >= cpmGate);

      let passed = false;
      let gateNote: 'accuracy' | 'cpm' | '' = '';
      if (!input.failed) {
        if (isLessonRun && lesson) {
          passed = metAccuracy && metCpm;
          if (!passed) gateNote = !metAccuracy ? 'accuracy' : 'cpm';
        } else if (input.mode === 'practice') {
          passed = accuracy >= CONFIG.practiceGate;
          if (!passed) gateNote = 'accuracy';
        } else {
          passed = true;
        }
      }

      const firstClear = !!lesson && isLessonRun && passed && !ls.completed;
      const baseXp = lesson && isLessonRun ? (firstClear ? lesson.xp : Math.round(lesson.xp * CONFIG.replayXpFactor)) : 0;
      const rawXp = baseXp + Math.max(0, input.answerXp);

      const daily = { ...state.daily, pb: { ...state.daily.pb } };
      if (daily.day !== dayKey()) {
        daily.day = dayKey();
        daily.xp = 0;
        daily.gems = 0;
        daily.pb = {};
      }
      const xpRoom = Math.max(0, CONFIG.dailyXpCap - daily.xp);
      const xpEarned = Math.min(rawXp, xpRoom);
      daily.xp += xpEarned;

      let gemsWanted = firstClear ? CONFIG.firstClearGems : 0;
      const newBest = isLessonRun && passed && cpm != null && (ls.bestCpm == null || cpm > ls.bestCpm);
      if (newBest && lesson && daily.pb[lesson.id] !== daily.day) {
        gemsWanted += CONFIG.pbGems;
        daily.pb[lesson.id] = daily.day;
      }
      const gemsEarned = Math.min(gemsWanted, Math.max(0, CONFIG.dailyGemCap - daily.gems));
      daily.gems += gemsEarned;

      let stars = 0;
      let crown = false;
      if (passed && isLessonRun) {
        const gates = CONFIG.cpm.dec2bin;
        if (metAccuracy) stars = 1;
        if (cpm != null && cpm >= gates[1]) stars = 2;
        if (cpm != null && cpm >= gates[2]) stars = 3;
        crown = cpm != null && cpm >= gates[3];
      }

      const lessons = { ...state.lessons };
      if (lesson) {
        if (passed) {
          if (isLessonRun) {
            ls.completed = true;
            ls.crown = !!(ls.crown || crown);
            ls.bestAccuracy = Math.max(ls.bestAccuracy ?? 0, accuracy);
            ls.stars = Math.max(ls.stars, stars);
            if (cpm != null && (ls.bestCpm == null || cpm > ls.bestCpm)) ls.bestCpm = cpm;
          }
          if (input.mode === 'practice') {
            ls.practicePassed = true;
            ls.practiceBest = Math.max(ls.practiceBest || 0, accuracy);
          }
        }
        ls.attempts += 1;
        lessons[lesson.id] = ls;
      }

      const history = passed
        ? [...state.history, { day: dayKey(), cpm, mode: input.mode }].slice(-400)
        : state.history;

      const next: AppState = {
        ...state,
        xp: state.xp + xpEarned,
        gems: state.gems + gemsEarned,
        lessons,
        history,
        daily,
        stats: {
          conversions: state.stats.conversions + input.convCorrect,
          correct: state.stats.correct + input.correct,
          attempts: state.stats.attempts + input.attempts,
          sessions: state.stats.sessions + 1,
        },
        bossBest: input.mode === 'boss' && cpm != null ? Math.max(state.bossBest || 0, cpm) : state.bossBest,
        flashBest: input.mode === 'flash' && cpm != null ? Math.max(state.flashBest || 0, cpm) : state.flashBest,
      };
      setState(next);

      const idx = lesson ? LESSONS.findIndex((l) => l.id === lesson.id) : -1;
      return {
        mode: input.mode,
        lessonId: lesson?.id,
        lessonTitle: lesson?.title || '',
        passed,
        failed: !!input.failed,
        accuracy,
        cpm,
        stars,
        crown,
        gateNote,
        xpEarned,
        gemsEarned,
        cappedXp: rawXp - xpEarned,
        levelUp: levelFor(next.xp) > levelFor(state.xp),
        firstClear,
        nextLessonId: idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1].id : null,
        bossCorrect: input.correct,
        bestCombo: input.combo,
      };
    },
    [state],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      ready,
      setProfile,
      completeOnboarding,
      finishSession,
      loseHeart,
      refillWithGems,
      refillHeartsFree,
      buyOneHeart,
      addMiss,
      toggleSetting,
      reset,
    }),
    [state, ready, setProfile, completeOnboarding, finishSession, loseHeart, refillWithGems, refillHeartsFree, buyOneHeart, addMiss, toggleSetting, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
