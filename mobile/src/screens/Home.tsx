import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Byte } from '../components/Byte';
import { HUD } from '../components/HUD';
import { InfoModal, LessonSheet } from '../components/Modals';
import { Text } from '../components/Text';
import { Btn, Card } from '../components/UI';
import { FadeIn, Press3D, useFloat } from '../motion';
import { CONFIG, LESSONS, SECTIONS, UNIT_TITLES } from '../data/curriculum';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import type { AppState, Lesson } from '../types';
import { isUnlocked, pct } from '../utils';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CARD_MAX = 268;
const ROW_GAP = 58;

/** sin-wave horizontal drift used by the web build's path nodes. */
const drift = (i: number) => Math.round(Math.sin(i * 1.15) * 30);

export function HomeScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const booted = useRef(false);
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const reduced = state.settings.reducedMotion;

  const resume = useMemo(() => {
    let index = LESSONS.findIndex((l, i) => isUnlocked(state, LESSONS, i) && !state.lessons[l.id]?.completed);
    if (index === -1) {
      index = LESSONS.findIndex((l) => state.lessons[l.id]?.completed && !state.lessons[l.id]?.practicePassed);
    }
    if (index === -1) index = LESSONS.length - 1;
    return { index, lesson: LESSONS[index], st: state.lessons[LESSONS[index].id] };
  }, [state]);

  const allDone = LESSONS.every((l) => state.lessons[l.id]?.completed);
  const needsPractice = !!resume.st?.completed && !resume.st?.practicePassed;
  const greetingName = state.profile.name.trim();
  const fabFloat = useFloat(!reduced);

  const open = (index: number) => {
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
      const y = estimateNodeY(resume.index, state);
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 96), animated: !reduced });
    }, 620);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheetLesson = sheetIndex != null ? LESSONS[sheetIndex] : null;
  const sheetState = sheetLesson ? state.lessons[sheetLesson.id] : undefined;
  const locked = lockedIndex != null ? LESSONS[lockedIndex] : null;
  const prev = lockedIndex != null && lockedIndex > 0 ? LESSONS[lockedIndex - 1] : null;
  const prevState = prev ? state.lessons[prev.id] : undefined;

  const lockedBody = !prev
    ? 'Finish the lessons before this one to open it.'
    : !prevState?.completed
      ? `Finish Lesson ${prev.id} first. Then pass its practice session at ${pct(CONFIG.practiceGate, 0)} accuracy to open Lesson ${locked?.id}.`
      : `Lesson ${prev.id} is complete, but its practice session is not passed. Score ${pct(
          CONFIG.practiceGate,
          0,
        )} accuracy in practice to open Lesson ${locked?.id}.`;

  const openPrev = () => {
    if (!prev) return;
    setLockedIndex(null);
    if (prevState?.completed) nav.go('player', { lessonId: prev.id, mode: 'practice' });
    else setSheetIndex(lockedIndex! - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HUD onStats={() => nav.tab('stats')} />

        <View style={styles.body}>
          <FadeIn enabled={!reduced} from={8}>
            <Card style={styles.hero}>
              <Byte size={84} reduced={reduced} mood={needsPractice ? 'worried' : 'idle'} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle}>
                  {greetingName ? `Hi, ${greetingName}!` : state.xp === 0 ? 'Ready to think in 1s and 0s?' : 'Welcome back!'}
                </Text>
                <Text style={styles.heroSub}>
                  {allDone
                    ? 'Every lesson is complete. Chase a crown on the speed runs.'
                    : needsPractice
                      ? `Practice to unlock what comes next: ${resume.lesson.title} — ${resume.lesson.subtitle}`
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

          <LessonPath state={state} onOpen={open} onPractice={(lesson) => nav.go('player', { lessonId: lesson.id, mode: 'practice' })} reduced={reduced} />
          <View style={{ height: 56 }} />
        </View>
      </ScrollView>

      <Animated.View style={[styles.fabWrap, reduced ? undefined : fabFloat]}>
        <Press3D
          onPress={() => (allDone ? nav.tab('practice') : setSheetIndex(resume.index))}
          bg={C.green}
          shadowColor={C.greenDark}
          radius={30}
          depth={5}
          style={{ width: 60 }}
          contentStyle={styles.fab}
          accessibilityLabel={allDone ? 'Open the practice hub' : `Continue lesson ${resume.lesson.id}`}
        >
          <Ionicons name="play" size={24} color={C.paper} />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{allDone ? '★' : resume.lesson.id}</Text>
          </View>
        </Press3D>
      </Animated.View>

      <LessonSheet
        lesson={sheetLesson}
        visible={sheetIndex != null}
        onClose={() => setSheetIndex(null)}
        stars={sheetState?.stars || 0}
        bestCpm={sheetState?.bestCpm ?? null}
        bestAccuracy={sheetState?.bestAccuracy ?? null}
        practicePassed={!!sheetState?.practicePassed}
        crown={!!sheetState?.crown}
        completed={!!sheetState?.completed}
        onStart={() => {
          if (!sheetLesson) return;
          setSheetIndex(null);
          setTimeout(() => nav.go('player', { lessonId: sheetLesson.id, mode: 'lesson' }), 80);
        }}
        onPractice={() => {
          if (!sheetLesson) return;
          setSheetIndex(null);
          setTimeout(() => nav.go('player', { lessonId: sheetLesson.id, mode: 'practice' }), 80);
        }}
        onGhost={() => {
          if (!sheetLesson) return;
          setSheetIndex(null);
          setTimeout(() => nav.go('player', { lessonId: sheetLesson.id, mode: 'ghost' }), 80);
        }}
      />

      <InfoModal
        visible={lockedIndex != null}
        title={locked ? `Lesson ${locked.id} is locked` : ''}
        body={lockedBody}
        primaryLabel={prev ? (prevState?.completed ? `Practice ${prev.id}` : `Open ${prev.id}`) : 'OK'}
        onPrimary={openPrev}
        onClose={() => setLockedIndex(null)}
      />
    </View>
  );
}

/** Rough scroll offset to the resume node, used once on boot. */
function estimateNodeY(target: number, state: AppState) {
  let y = 96 + 74; // HUD + hero
  for (let i = 0; i <= target; i++) {
    const lesson = LESSONS[i];
    if (i === 0 || LESSONS[i - 1].section !== lesson.section) y += 118;
    if (i === 0 || LESSONS[i - 1].unit !== lesson.unit) y += 38;
    if (i > 0) y += 78;
    if (isUnlocked(state, LESSONS, i)) y += 52;
    y += ROW_GAP;
  }
  return y;
}

function LessonPath({
  state,
  onOpen,
  onPractice,
  reduced,
}: {
  state: AppState;
  onOpen: (index: number) => void;
  onPractice: (lesson: Lesson) => void;
  reduced: boolean;
}) {
  const sections: { section: number; units: { unit: number; rows: { lesson: Lesson; index: number }[] }[] }[] = [];
  let lastSection = -1;
  LESSONS.forEach((lesson, index) => {
    if (lesson.section !== lastSection) {
      lastSection = lesson.section;
      sections.push({ section: lesson.section, units: [] });
    }
    const current = sections[sections.length - 1];
    let unit = current.units.find((u) => u.unit === lesson.unit);
    if (!unit) {
      unit = { unit: lesson.unit, rows: [] };
      current.units.push(unit);
    }
    unit.rows.push({ lesson, index });
  });

  return (
    <>
      {sections.map((section) => {
        const meta = SECTIONS[section.section];
        return (
          <View key={section.section} style={styles.sectionBlock}>
            <FadeIn delay={50} from={14} enabled={!reduced}>
              <View style={styles.banner}>
                <Text style={styles.eyebrow}>Section {section.section}</Text>
                <Text style={styles.bannerTitle}>{meta?.title}</Text>
                <Text style={styles.bannerBlurb}>{meta?.blurb}</Text>
              </View>
            </FadeIn>
            {section.units.map((unit) => (
              <View key={unit.unit}>
                <View style={styles.unitRow}>
                  <View style={styles.unitDot} />
                  <Text style={styles.unitTitle}>{UNIT_TITLES[unit.unit] || `Unit ${unit.unit}`}</Text>
                </View>
                <UnitPath rows={unit.rows} state={state} onOpen={onOpen} onPractice={onPractice} reduced={reduced} />
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

type Geom = { y: number; h: number };

function UnitPath({
  rows,
  state,
  onOpen,
  onPractice,
  reduced,
}: {
  rows: { lesson: Lesson; index: number }[];
  state: AppState;
  onOpen: (index: number) => void;
  onPractice: (lesson: Lesson) => void;
  reduced: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [geoms, setGeoms] = useState<Record<string, Geom>>({});
  const [pillYs, setPillYs] = useState<Record<string, number>>({});
  const dash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      dash.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(dash, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [dash, reduced]);

  const points = rows.map(({ lesson, index }) => {
    const g = geoms[lesson.id];
    const pillY = pillYs[lesson.id];
    if (!g || !width) return null;
    const cardH = pillY != null ? pillY - 12 : g.h;
    return {
      x: width / 2 + drift(index),
      y: g.y + cardH / 2,
    };
  });
  const ready = points.every(Boolean);

  let d = '';
  if (ready) {
    const pts = points as { x: number; y: number }[];
    d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mid = (a.y + b.y) / 2;
      d += ` C${a.x.toFixed(1)} ${mid.toFixed(1)} ${b.x.toFixed(1)} ${mid.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
  }

  return (
    <View
      style={styles.path}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        setHeight(e.nativeEvent.layout.height);
      }}
    >
      {ready && rows.length > 1 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={width} height={height}>
            <AnimatedPath
              d={d}
              fill="none"
              stroke={C.swan}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={[12, 12]}
              strokeDashoffset={
                (reduced
                  ? 0
                  : dash.interpolate({ inputRange: [0, 1], outputRange: [0, -24] })) as unknown as number
              }
            />
          </Svg>
        </View>
      ) : null}

      {rows.map(({ lesson, index }) => {
        const st = state.lessons[lesson.id];
        const unlocked = isUnlocked(state, LESSONS, index);
        const completed = !!st?.completed;
        const practiced = !!st?.practicePassed;
        const current = unlocked && !completed;
        const crown = !!st?.crown && completed;
        const offset = drift(index);
        return (
          <NodeWrap
            key={lesson.id}
            delay={Math.min(index * 40, 360)}
            offset={offset}
            reduced={reduced}
            onGeom={(g) => setGeoms((prev) => (sameGeom(prev[lesson.id], g) ? prev : { ...prev, [lesson.id]: g }))}
          >
            {current ? <StartCallout reduced={reduced} /> : null}
            <Press3D
              onPress={() => onOpen(index)}
              bg={unlocked ? C.paper : C.polar}
              shadowColor={crown ? C.goldDark : completed || current ? C.greenDark : C.swan}
              radius={R.lg}
              depth={4}
              style={{ width: '88%', maxWidth: CARD_MAX }}
              contentStyle={[styles.node, completed || current ? styles.nodeLive : null, crown ? styles.nodeCrown : null, !unlocked ? styles.nodeLocked : null]}
              accessibilityLabel={`Lesson ${lesson.id}, ${lesson.title}${completed ? ', completed' : unlocked ? ', start' : ', locked'}`}
            >
              <View
                style={[
                  styles.nodeIcon,
                  completed ? styles.nodeIconDone : null,
                  current ? styles.nodeIconActive : null,
                  crown ? styles.nodeIconCrown : null,
                ]}
              >
                {crown ? (
                  <MaterialCommunityIcons name="crown" size={22} color={C.paper} />
                ) : (
                  <Ionicons
                    name={completed ? 'checkmark' : current ? 'play' : 'lock-closed'}
                    size={completed || current ? 24 : 20}
                    color={completed ? C.greenDark : current ? C.paper : C.ash}
                  />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.nodeTitle, !unlocked ? { color: C.ash } : null]}>Lesson {lesson.id}</Text>
                <Text style={[styles.nodeSub, !unlocked ? { color: '#b3b3b3' } : null]} numberOfLines={1}>
                  {lesson.title}
                </Text>
                {completed ? (
                  <View style={styles.stars}>
                    {[0, 1, 2].map((s) => (
                      <Ionicons key={s} name="star" size={16} color={s < (st?.stars || 0) ? C.gold : C.swan} />
                    ))}
                  </View>
                ) : null}
              </View>
            </Press3D>

            {unlocked ? (
              <View
                onLayout={(e) => {
                  const pillY = e.nativeEvent.layout.y;
                  setPillYs((prev) =>
                    prev[lesson.id] != null && Math.abs(prev[lesson.id] - pillY) < 0.5 ? prev : { ...prev, [lesson.id]: pillY },
                  );
                }}
              >
                <PracticePill
                  done={practiced}
                  due={completed || current}
                  onPress={() => onPractice(lesson)}
                  lessonId={lesson.id}
                />
              </View>
            ) : null}
          </NodeWrap>
        );
      })}
    </View>
  );
}

function sameGeom(a: Geom | undefined, b: Geom) {
  if (!a) return false;
  return Math.abs(a.y - b.y) < 0.5 && Math.abs(a.h - b.h) < 0.5;
}

function NodeWrap({
  children,
  onGeom,
  delay,
  offset,
  reduced,
}: {
  children: React.ReactNode;
  onGeom: (g: Geom) => void;
  delay: number;
  offset: number;
  reduced: boolean;
}) {
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const id = setTimeout(() => {
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }).start();
    }, delay);
    return () => clearTimeout(id);
  }, [delay, reduced, v]);

  return (
    <Animated.View
      style={[
        styles.nodeWrap,
        {
          opacity: v,
          transform: [
            { translateX: offset },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
      ]}
      onLayout={(e) => onGeom({ y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })}
    >
      {children}
    </Animated.View>
  );
}

function StartCallout({ reduced }: { reduced: boolean }) {
  const float = useFloat(!reduced, 6, 1000);
  return (
    <View pointerEvents="none" style={styles.calloutWrap}>
      <Animated.View style={[styles.callout, reduced ? undefined : float]}>
        <Text style={styles.calloutText}>Start</Text>
        <View style={styles.calloutTail} />
      </Animated.View>
    </View>
  );
}

function PracticePill({
  done,
  due,
  onPress,
  lessonId,
}: {
  done: boolean;
  due: boolean;
  onPress: () => void;
  lessonId: string;
}) {
  const tone = done
    ? { bg: C.eelLight, shelf: C.lime, fg: C.greenDark, border: C.lime }
    : due
      ? { bg: C.bluePale, shelf: '#bfe4fb', fg: C.blueDark, border: '#bfe4fb' }
      : { bg: C.paper, shelf: C.swan, fg: C.ash, border: C.swan };
  return (
    <Press3D
      onPress={onPress}
      bg={tone.bg}
      shadowColor={tone.shelf}
      radius={R.pill}
      depth={3}
      style={{ marginTop: 12 }}
      contentStyle={[styles.practicePill, { borderColor: tone.border }]}
      accessibilityLabel={done ? `Practice passed for lesson ${lessonId}` : `Practice lesson ${lessonId}`}
    >
      <Ionicons name={done ? 'checkmark' : 'locate'} size={13} color={tone.fg} />
      <Text style={[styles.practicePillText, { color: tone.fg }]}>{done ? 'Practice done' : 'Practice needed'}</Text>
    </Press3D>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, marginTop: 20 },
  heroTitle: { ...T.h2, fontSize: 21, lineHeight: 26, letterSpacing: -0.6 },
  heroSub: { ...T.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionBlock: { position: 'relative' },
  banner: {
    marginTop: 24,
    marginBottom: 10,
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
  path: { position: 'relative', width: '100%', paddingTop: 44, paddingBottom: 16 },
  nodeWrap: { width: '100%', alignItems: 'center', marginBottom: ROW_GAP, zIndex: 1 },
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
  nodeCrown: { borderColor: C.gold },
  nodeLocked: { backgroundColor: C.polar },
  nodeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.swan, alignItems: 'center', justifyContent: 'center' },
  nodeIconDone: { backgroundColor: C.eelLight },
  nodeIconActive: { backgroundColor: C.green, borderBottomWidth: 2, borderBottomColor: C.greenDark },
  nodeIconCrown: { backgroundColor: C.gold, borderBottomWidth: 2, borderBottomColor: C.goldDark },
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
    borderBottomWidth: 0,
    borderRadius: R.pill,
  },
  practicePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  calloutWrap: { position: 'absolute', top: -46, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  callout: {
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.greenDark,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: C.greenDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  calloutText: { color: C.paper, fontSize: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  calloutTail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: C.green,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.greenDark,
    transform: [{ rotate: '45deg' }],
  },
  fabWrap: { position: 'absolute', right: 20, bottom: 96 },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  fabBadge: {
    position: 'absolute',
    right: -6,
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
