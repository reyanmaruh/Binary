import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Byte } from '../components/Byte';
import { HUD } from '../components/HUD';
import { InfoModal, LessonSheet } from '../components/Modals';
import { Btn, Card, Chip } from '../components/UI';
import { CONFIG, LESSONS, SECTIONS, UNIT_TITLES } from '../data/curriculum';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import type { Lesson } from '../types';
import { isUnlocked } from '../utils';

export function HomeScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const nodeYs = useRef<Record<string, number>>({});
  const booted = useRef(false);
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const resume = useMemo(() => {
    let index = LESSONS.findIndex((l, i) => isUnlocked(state, LESSONS, i) && !state.lessons[l.id]?.completed);
    if (index === -1) index = LESSONS.findIndex((l) => state.lessons[l.id]?.completed && !state.lessons[l.id]?.practicePassed);
    if (index === -1) index = LESSONS.length - 1;
    return { index, lesson: LESSONS[index], st: state.lessons[LESSONS[index].id] };
  }, [state]);

  const allDone = LESSONS.every((l) => state.lessons[l.id]?.completed);
  const needsPractice = !!resume.st && resume.st.completed && !resume.st.practicePassed;
  const greetingName = state.profile.name.trim();

  const open = (lesson: Lesson, index: number) => {
    if (!isUnlocked(state, LESSONS, index)) {
      setLockedIndex(index);
      return;
    }
    setSheetIndex(index);
  };

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const returning = state.xp > 0 || !!state.lessons[resume.lesson.id];
    if (!returning) return;
    const timer = setTimeout(() => {
      const y = nodeYs.current[resume.lesson.id];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: React.ReactNode[] = [];
  let lastSection = -1;
  let lastUnit = -1;
  LESSONS.forEach((lesson, i) => {
    if (lesson.section !== lastSection) {
      lastSection = lesson.section;
      const section = SECTIONS[lesson.section];
      lastUnit = -1;
      rows.push(
        <View key={`section-${lesson.section}`} style={styles.banner}>
          <Text style={styles.eyebrow}>Section {lesson.section}</Text>
          <Text style={styles.bannerTitle}>{section?.title}</Text>
          <Text style={styles.bannerBlurb}>{section?.blurb}</Text>
        </View>,
      );
    }
    if (lesson.unit !== lastUnit) {
      lastUnit = lesson.unit;
      rows.push(
        <View key={`unit-${lesson.unit}`} style={styles.unitRow}>
          <View style={styles.unitDot} />
          <Text style={styles.unitTitle}>{UNIT_TITLES[lesson.unit]}</Text>
        </View>,
      );
    }
    const st = state.lessons[lesson.id];
    const unlocked = isUnlocked(state, LESSONS, i);
    const completed = !!st?.completed;
    const active = !completed && unlocked;
    rows.push(
      <View key={lesson.id}>
        {i > 0 ? <View style={styles.connector} /> : null}
        <Pressable
          onPress={() => open(lesson, i)}
          onLayout={(e) => {
            nodeYs.current[lesson.id] = e.nativeEvent.layout.y;
          }}
          style={[
            styles.node,
            completed ? styles.nodeDone : null,
            active ? styles.nodeActive : null,
            !unlocked ? styles.nodeLocked : null,
          ]}
        >
          <View style={[styles.nodeIcon, completed ? styles.nodeIconDone : null, active ? styles.nodeIconActive : null]}>
            <Ionicons
              name={completed ? 'checkmark' : active ? 'play' : 'lock-closed'}
              size={20}
              color={completed ? C.greenDark : active ? C.paper : C.mute}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nodeTitle, !unlocked ? { color: C.ash } : null]}>Lesson {lesson.id}</Text>
            <Text style={styles.nodeSub} numberOfLines={1}>
              {lesson.title}
            </Text>
            {completed ? (
              <View style={styles.stars}>
                {[0, 1, 2].map((s) => (
                  <Ionicons key={s} name={s < (st?.stars || 0) ? 'star' : 'star-outline'} size={13} color={s < (st?.stars || 0) ? C.gold : C.swan} />
                ))}
              </View>
            ) : null}
          </View>
        </Pressable>
        {completed && !st?.practicePassed ? (
          <Pressable style={styles.practicePill} onPress={() => nav.go('player', { lessonId: lesson.id, mode: 'practice' })}>
            <Ionicons name="locate" size={13} color={C.blueDark} />
            <Text style={styles.practicePillText}>Practice needed</Text>
          </Pressable>
        ) : null}
      </View>,
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HUD onStats={() => nav.tab('stats')} />

        <Card style={styles.hero}>
          <Byte size={64} reduced={state.settings.reducedMotion} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {greetingName ? `Hi, ${greetingName}!` : state.xp === 0 ? 'Ready to think in 1s and 0s?' : 'Welcome back!'}
            </Text>
            <Text style={styles.heroSub}>
              {allDone
                ? 'Every lesson is complete. Chase a crown on the speed runs.'
                : needsPractice
                  ? `Practice to unlock what comes next: ${resume.lesson.title}`
                  : `Next up: ${resume.lesson.title} — ${resume.lesson.subtitle}`}
            </Text>
            <Btn
              label={allDone ? 'Practice hub' : needsPractice ? `Practice · ${resume.lesson.id}` : `Continue · ${resume.lesson.id}`}
              small
              style={{ marginTop: 12 }}
              onPress={() => (allDone ? nav.tab('practice') : needsPractice ? nav.go('player', { lessonId: resume.lesson.id, mode: 'practice' }) : setSheetIndex(resume.index))}
            />
          </View>
        </Card>

        {rows}
        <View style={{ height: 40 }} />
      </ScrollView>

      {!allDone ? (
        <Pressable style={styles.fab} onPress={() => setSheetIndex(resume.index)} accessibilityLabel={`Continue lesson ${resume.lesson.id}`}>
          <Ionicons name="play" size={24} color={C.paper} />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{resume.lesson.id}</Text>
          </View>
        </Pressable>
      ) : null}

      <LessonSheet
        lesson={sheetIndex != null ? LESSONS[sheetIndex] : null}
        visible={sheetIndex != null}
        onClose={() => setSheetIndex(null)}
        stars={sheetIndex != null ? state.lessons[LESSONS[sheetIndex].id]?.stars || 0 : 0}
        bestCpm={sheetIndex != null ? state.lessons[LESSONS[sheetIndex].id]?.bestCpm ?? null : null}
        practiceBest={sheetIndex != null ? state.lessons[LESSONS[sheetIndex].id]?.practiceBest ?? null : null}
        completed={sheetIndex != null ? !!state.lessons[LESSONS[sheetIndex].id]?.completed : false}
        onStart={() => {
          const lesson = sheetIndex != null ? LESSONS[sheetIndex] : null;
          if (!lesson) return;
          setSheetIndex(null);
          nav.go('player', { lessonId: lesson.id, mode: 'lesson' });
        }}
        onPractice={() => {
          const lesson = sheetIndex != null ? LESSONS[sheetIndex] : null;
          if (!lesson) return;
          setSheetIndex(null);
          nav.go('player', { lessonId: lesson.id, mode: 'practice' });
        }}
      />

      <InfoModal
        visible={lockedIndex != null}
        title={lockedIndex != null ? `Lesson ${LESSONS[lockedIndex].id} is locked` : ''}
        body={
          lockedIndex != null
            ? `Finish ${LESSONS[lockedIndex - 1]?.id} first. Then pass its practice session at ${Math.round(
                CONFIG.practiceGate * 100,
              )}% accuracy to open ${LESSONS[lockedIndex].id}.`
            : ''
        }
        primaryLabel={lockedIndex != null ? `Open ${LESSONS[lockedIndex - 1]?.id}` : 'Open'}
        onPrimary={() => {
          const prev = lockedIndex != null ? LESSONS[lockedIndex - 1] : null;
          setLockedIndex(null);
          if (prev) nav.go('player', { lessonId: prev.id, mode: 'practice' });
        }}
        onClose={() => setLockedIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6, padding: 18 },
  heroTitle: { ...T.h2, fontSize: 20 },
  heroSub: { ...T.body, fontSize: 14, marginTop: 4 },
  banner: {
    backgroundColor: C.green,
    borderRadius: R.lg,
    borderWidth: 2,
    borderColor: C.greenDark,
    padding: 18,
    marginTop: 22,
    marginBottom: 8,
  },
  eyebrow: { color: C.paper, fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  bannerTitle: { color: C.paper, fontSize: 21, fontWeight: '800', marginTop: 2 },
  bannerBlurb: { color: C.paper, fontSize: 13, opacity: 0.95, marginTop: 2 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 4 },
  unitDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.green },
  unitTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, color: C.ash, textTransform: 'uppercase' },
  connector: { alignSelf: 'center', height: 26, borderLeftWidth: 4, borderStyle: 'dashed', borderColor: C.swan, marginVertical: 4 },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    padding: 13,
    width: '92%',
    alignSelf: 'center',
  },
  nodeDone: { borderColor: C.green },
  nodeActive: { borderColor: C.green },
  nodeLocked: { backgroundColor: C.polar },
  nodeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.swan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIconDone: { backgroundColor: C.eelLight },
  nodeIconActive: { backgroundColor: C.green },
  nodeTitle: { fontSize: 16, fontWeight: '800', color: C.graphite },
  nodeSub: { fontSize: 13, color: C.ash, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 3, marginTop: 6 },
  practicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#bfe4fb',
    backgroundColor: C.bluePale,
    borderRadius: R.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  practicePillText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', color: C.blueDark },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: C.greenDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  fabBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: C.paper,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.greenDark,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  fabBadgeText: { fontSize: 10, fontWeight: '800', color: C.greenDark },
});
