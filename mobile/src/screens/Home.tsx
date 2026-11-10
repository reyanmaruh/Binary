import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { Byte } from '../components/Byte';
import { HUD } from '../components/HUD';
import { InfoModal, LessonSheet } from '../components/Modals';
import { Text } from '../components/Text';
import { Btn, Card } from '../components/UI';
import { FadeIn, Press3D, PulseRing, useFloat, usePop } from '../motion';
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
  const reduced = state.settings.reducedMotion;

  const resume = useMemo(() => {
    let index = LESSONS.findIndex((l, i) => isUnlocked(state, LESSONS, i) && !state.lessons[l.id]?.completed);
    if (index === -1) index = LESSONS.findIndex((l) => state.lessons[l.id]?.completed && !state.lessons[l.id]?.practicePassed);
    if (index === -1) index = LESSONS.length - 1;
    return { index, lesson: LESSONS[index], st: state.lessons[LESSONS[index].id] };
  }, [state]);

  const allDone = LESSONS.every((l) => state.lessons[l.id]?.completed);
  const needsPractice = !!resume.st && resume.st.completed && !resume.st.practicePassed;
  const greetingName = state.profile.name.trim();
  const fabFloat = useFloat(!reduced);

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
    }, 650);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: React.ReactNode[] = [];
  let lastSection = -1;
  let lastUnit = -1;
  let nodeIndex = 0;
  LESSONS.forEach((lesson, i) => {
    if (lesson.section !== lastSection) {
      lastSection = lesson.section;
      const section = SECTIONS[lesson.section];
      lastUnit = -1;
      rows.push(
        <FadeIn key={`section-${lesson.section}`} delay={60} from={14} enabled={!reduced} style={styles.bannerWrap}>
          <View style={styles.banner}>
            <Text style={styles.eyebrow}>Section {lesson.section}</Text>
            <Text style={styles.bannerTitle}>{section?.title}</Text>
            <Text style={styles.bannerBlurb}>{section?.blurb}</Text>
          </View>
        </FadeIn>,
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
    nodeIndex += 1;
    rows.push(
      <View
        key={lesson.id}
        onLayout={(e) => {
          nodeYs.current[lesson.id] = e.nativeEvent.layout.y;
        }}
      >
        {i > 0 ? <Connector /> : null}
        <FadeIn delay={Math.min(nodeIndex, 8) * 45} from={10} enabled={!reduced}>
          <PathNode
            lesson={lesson}
            completed={!!st?.completed}
            active={!st?.completed && unlocked}
            unlocked={unlocked}
            stars={st?.stars || 0}
            practicePassed={!!st?.practicePassed}
            onPress={() => open(lesson, i)}
            onPractice={() => nav.go('player', { lessonId: lesson.id, mode: 'practice' })}
          />
        </FadeIn>
      </View>,
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HUD onStats={() => nav.tab('stats')} />

        <View style={styles.heroWrap}>
          <FadeIn enabled={!reduced} from={8}>
            <Card style={styles.hero}>
              <Byte size={84} reduced={reduced} mood={needsPractice ? 'worried' : 'idle'} />
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
                  style={{ marginTop: 16, alignSelf: 'flex-start' }}
                  onPress={() =>
                    allDone
                      ? nav.tab('practice')
                      : needsPractice
                        ? nav.go('player', { lessonId: resume.lesson.id, mode: 'practice' })
                        : setSheetIndex(resume.index)
                  }
                />
              </View>
            </Card>
          </FadeIn>

          {rows}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {!allDone ? (
        <Animated.View style={[styles.fabWrap, reduced ? undefined : fabFloat]}>
          <Press3D
            onPress={() => setSheetIndex(resume.index)}
            bg={C.green}
            shadowColor={C.greenDark}
            radius={30}
            depth={5}
            style={{ width: 60 }}
            contentStyle={styles.fab}
            accessibilityLabel={`Continue lesson ${resume.lesson.id}`}
          >
            <Ionicons name="play" size={24} color={C.paper} />
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{resume.lesson.id}</Text>
            </View>
          </Press3D>
        </Animated.View>
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

function Connector() {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  return (
    <View style={styles.connectorWrap} pointerEvents="none">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.connectorDot} />
      ))}
      <Animated.View
        style={[
          styles.connectorSpark,
          {
            opacity: drift.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }) }],
          },
        ]}
      />
    </View>
  );
}

function PathNode({
  lesson,
  completed,
  active,
  unlocked,
  stars,
  practicePassed,
  onPress,
  onPractice,
}: {
  lesson: Lesson;
  completed: boolean;
  active: boolean;
  unlocked: boolean;
  stars: number;
  practicePassed: boolean;
  onPress: () => void;
  onPractice: () => void;
}) {
  const starPop = usePop(stars);
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Press3D
        onPress={onPress}
        bg={unlocked ? C.paper : C.polar}
        shadowColor={completed || active ? C.greenDark : C.swan}
        radius={R.lg}
        depth={4}
        style={{ width: '92%' }}
        contentStyle={[styles.node, completed || active ? styles.nodeLive : null, !unlocked ? styles.nodeLocked : null]}
        accessibilityLabel={`Lesson ${lesson.id}, ${lesson.title}${completed ? ', completed' : unlocked ? '' : ', locked'}`}
      >
        <View style={styles.iconWrap}>
          <PulseRing size={46} active={active} />
          <View
            style={[
              styles.nodeIcon,
              completed ? styles.nodeIconDone : null,
              active ? styles.nodeIconActive : null,
            ]}
          >
            <Ionicons
              name={completed ? 'checkmark' : active ? 'play' : 'lock-closed'}
              size={22}
              color={completed ? C.greenDark : active ? C.paper : C.ash}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nodeTitle, !unlocked ? { color: C.ash } : null]}>Lesson {lesson.id}</Text>
          <Text style={styles.nodeSub} numberOfLines={1}>
            {lesson.title}
          </Text>
          {completed ? (
            <Animated.View style={[styles.stars, starPop]}>
              {[0, 1, 2].map((s) => (
                <Ionicons key={s} name={s < stars ? 'star' : 'star-outline'} size={16} color={s < stars ? C.gold : C.swan} />
              ))}
            </Animated.View>
          ) : null}
        </View>
      </Press3D>
      {completed && !practicePassed ? (
        <Press3D
          onPress={onPractice}
          bg={C.bluePale}
          shadowColor="#bfe4fb"
          radius={R.pill}
          depth={3}
          style={{ marginTop: 12 }}
          contentStyle={styles.practicePill}
          accessibilityLabel={`Practice lesson ${lesson.id}`}
        >
          <Ionicons name="locate" size={13} color={C.blueDark} />
          <Text style={styles.practicePillText}>Practice needed</Text>
        </Press3D>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  heroWrap: { paddingHorizontal: 16, paddingTop: 20 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  heroTitle: { ...T.h2, fontSize: 21, lineHeight: 26, letterSpacing: -0.6 },
  heroSub: { ...T.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
  bannerWrap: { marginTop: 24, marginBottom: 10 },
  banner: {
    backgroundColor: C.green,
    borderRadius: R.lg,
    borderWidth: 2,
    borderColor: C.greenDark,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: C.greenDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  eyebrow: { color: C.paper, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.92 },
  bannerTitle: { color: C.paper, fontSize: 22, fontWeight: '700', letterSpacing: -0.6, marginTop: 2, lineHeight: 26 },
  bannerBlurb: { color: C.paper, fontSize: 13, fontWeight: '500', opacity: 0.94, marginTop: 2, lineHeight: 18 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 4, paddingHorizontal: 2 },
  unitDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.green },
  unitTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.ash, textTransform: 'uppercase' },
  connectorWrap: { alignSelf: 'center', height: 26, width: 8, alignItems: 'center', justifyContent: 'center', gap: 4, marginVertical: 4 },
  connectorDot: { width: 4, height: 3, borderRadius: 2, backgroundColor: C.swan },
  connectorSpark: { position: 'absolute', top: 0, width: 4, height: 8, borderRadius: 2, backgroundColor: C.green },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.lg,
  },
  nodeLive: { borderColor: C.green },
  nodeLocked: { backgroundColor: C.polar },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  nodeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.swan, alignItems: 'center', justifyContent: 'center' },
  nodeIconDone: { backgroundColor: C.eelLight },
  nodeIconActive: { backgroundColor: C.green, shadowColor: C.greenDark, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  nodeTitle: { fontSize: 16, fontWeight: '700', color: C.graphite, lineHeight: 20 },
  nodeSub: { fontSize: 13, fontWeight: '500', color: C.ash, marginTop: 2, lineHeight: 17 },
  stars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  practicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#bfe4fb',
    borderBottomWidth: 0,
    borderRadius: R.pill,
  },
  practicePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: C.blueDark },
  fabWrap: { position: 'absolute', right: 20, bottom: 96 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
  fabBadgeText: { fontSize: 10, fontWeight: '700', color: C.greenDark },
});
