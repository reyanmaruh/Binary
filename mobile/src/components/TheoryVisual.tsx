import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { C, MONO, R } from '../theme';
import { Text } from './Text';

/**
 * The reference's theory widgets. Each lesson's `visual` string picks a
 * renderer, and the renderer animates itself the way the web build does
 * (bulbs lighting in sequence, rows arriving, lanes filling).
 */
export function TheoryVisual({ hint = '', reduced = false }: { hint?: string; reduced?: boolean }) {
  const h = hint.toLowerCase();
  if (/bulb|light/.test(h)) return <Bulbs eight={/eight|8 /.test(h)} reduced={reduced} />;
  if (/table growing|doubling|arrows/.test(h)) return <GrowTable reduced={reduced} />;
  if (/table of all 16|grid/.test(h)) return <NibbleGrid reduced={reduced} />;
  if (/split|halves/.test(h)) return <Split />;
  if (/division|remainders/.test(h)) return <Division reduced={reduced} />;
  if (/race|compare/.test(h)) return <Race reduced={reduced} />;
  if (/stopwatch|timer|60 seconds/.test(h)) return <Stopwatch reduced={reduced} />;
  if (/checklist|certificate/.test(h)) return <Checklist reduced={reduced} />;
  if (/chart|128|place values/.test(h)) return <Chart reduced={reduced} />;
  return <BinChip bits="10110100" reduced={reduced} />;
}

function Enter({
  children,
  delay = 0,
  from = 8,
  reduced,
  pop = false,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  reduced: boolean;
  pop?: boolean;
}) {
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: pop ? 260 : 300,
      delay,
      easing: pop ? Easing.out(Easing.back(1.8)) : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, pop, reduced, v]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: pop
          ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }]
          : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Bulb({ label, lit, reduced }: { label: string; lit: boolean; reduced: boolean }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      s.setValue(1);
      return;
    }
    Animated.spring(s, { toValue: lit ? 1.08 : 1, useNativeDriver: true, friction: 6, tension: 180 }).start();
  }, [lit, reduced, s]);
  return (
    <View style={styles.bulbCol}>
      <Animated.View style={[styles.globe, lit ? styles.globeLit : null, { transform: [{ scale: s }] }]} />
      <Text style={[styles.bulbLabel, lit ? { color: C.greenDark } : null]}>{label}</Text>
    </View>
  );
}

function Bulbs({ eight, reduced }: { eight: boolean; reduced: boolean }) {
  const vals = useMemo(() => (eight ? [128, 64, 32, 16, 8, 4, 2, 1] : [1, 2, 4, 8, 16]), [eight]);
  const [lit, setLit] = useState<boolean[]>(() => vals.map(() => reduced));

  useEffect(() => {
    if (reduced) {
      setLit(vals.map(() => true));
      return;
    }
    setLit(vals.map(() => false));
    const timers: ReturnType<typeof setTimeout>[] = [];
    const setAt = (i: number, on: boolean) =>
      setLit((prev) => prev.map((v, j) => (j === i ? on : v)));
    vals.forEach((_, i) => {
      timers.push(setTimeout(() => setAt(i, true), 250 + i * 260));
      timers.push(setTimeout(() => setAt(i, false), 1100 + i * 260));
      timers.push(setTimeout(() => setAt(i, true), 1700 + i * 260));
    });
    return () => timers.forEach(clearTimeout);
  }, [vals, reduced]);

  return (
    <View style={styles.bulbs}>
      {vals.map((v, i) => (
        <Bulb key={v} label={String(v)} lit={!!lit[i]} reduced={reduced} />
      ))}
    </View>
  );
}

function GrowTable({ reduced }: { reduced: boolean }) {
  const rows = [
    ['bits', 'patterns'],
    ['1', '2'],
    ['2', '4'],
    ['3', '8'],
    ['4', '16'],
    ['5', '32'],
    ['6', '64'],
    ['7', '128'],
    ['8', '256'],
  ];
  return (
    <View style={styles.table}>
      {rows.map((row, i) => (
        <Enter key={row[0]} delay={i * 50} from={-8} reduced={reduced}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{row[0]}</Text>
            <Text style={[styles.tableCell, styles.tableValue]}>{row[1]}</Text>
          </View>
        </Enter>
      ))}
    </View>
  );
}

function NibbleGrid({ reduced }: { reduced: boolean }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 16 }).map((_, i) => (
        <View key={i} style={styles.gridCellWrap}>
          <Enter delay={i * 35} reduced={reduced} pop>
            <View style={styles.gridCell}>
              <Text style={styles.gridText}>{i.toString(2).padStart(4, '0')}</Text>
            </View>
          </Enter>
        </View>
      ))}
    </View>
  );
}

function Split() {
  return (
    <View style={styles.splitWrap}>
      <View style={styles.splitRow}>
        <Text style={[styles.splitChip, styles.splitHi]}>1011</Text>
        <Text style={[styles.splitChip, styles.splitLo]}>0100</Text>
      </View>
      <Text style={styles.caption}>high nibble × 16 + low nibble</Text>
    </View>
  );
}

function Division({ reduced }: { reduced: boolean }) {
  const rows = [
    ['13 ÷ 2', '6', '1'],
    ['6 ÷ 2', '3', '0'],
    ['3 ÷ 2', '1', '1'],
    ['1 ÷ 2', '0', '1'],
  ];
  return (
    <View style={styles.divWrap}>
      <View style={styles.divBox}>
        {rows.map(([sum, whole, rest], i) => (
          <Enter key={sum} delay={i * 60} from={6} reduced={reduced}>
            <Text style={styles.divRow}>
              {sum} = <Text style={styles.divStrong}>{whole}</Text> remainder{' '}
              <Text style={styles.divStrong}>{rest}</Text>
            </Text>
          </Enter>
        ))}
      </View>
      <Text style={styles.caption}>read bottom-up → 1101</Text>
    </View>
  );
}

function Lane({ win, reduced, delay }: { win?: boolean; reduced: boolean; delay: number }) {
  const v = useRef(new Animated.Value(reduced ? 1 : 0.12)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 0.96,
          duration: win ? 1200 : 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(v, {
          toValue: 0.12,
          duration: win ? 1200 : 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, reduced, v, win]);
  return (
    <View style={styles.lane}>
      <Animated.View
        style={[
          styles.laneFill,
          win ? { backgroundColor: C.green } : null,
          { width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

function Race({ reduced }: { reduced: boolean }) {
  return (
    <View style={styles.race}>
      <Lane reduced={reduced} delay={0} />
      <Lane win reduced={reduced} delay={250} />
      <Text style={styles.caption}>division … greedy ✓</Text>
    </View>
  );
}

function Stopwatch({ reduced }: { reduced: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  return (
    <View style={styles.stopWrap}>
      <Animated.Text style={[styles.stopwatch, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }]}>
        60.0
      </Animated.Text>
      <Text style={styles.caption}>seconds on the clock</Text>
    </View>
  );
}

function Checklist({ reduced }: { reduced: boolean }) {
  return (
    <View style={styles.list}>
      {['Bits', 'Place values', 'Counting', 'Carries', 'Conversions'].map((label, i) => (
        <Enter key={label} delay={i * 90} from={6} reduced={reduced}>
          <View style={styles.listRow}>
            <Text style={styles.tick}>✓</Text>
            <Text style={styles.listText}>{label}</Text>
          </View>
        </Enter>
      ))}
    </View>
  );
}

function Chart({ reduced }: { reduced: boolean }) {
  const [lit, setLit] = useState<boolean[]>(() => Array(8).fill(reduced));
  useEffect(() => {
    if (reduced) {
      setLit(Array(8).fill(true));
      return;
    }
    setLit(Array(8).fill(false));
    const timers = Array.from({ length: 8 }).map((_, i) =>
      setTimeout(() => setLit((prev) => prev.map((v, j) => (j === i ? true : v))), 260 + i * 90),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  return (
    <View style={styles.chart}>
      {[128, 64, 32, 16, 8, 4, 2, 1].map((place, i) => (
        <View key={place} style={styles.chartCell}>
          <View style={[styles.chartBit, lit[i] ? styles.chartBitLit : null]}>
            <Text style={[styles.chartBitText, lit[i] ? { color: C.paper } : null]}>0</Text>
          </View>
          <Text style={styles.chartPlace}>{place}</Text>
        </View>
      ))}
    </View>
  );
}

function BinChip({ bits, reduced }: { bits: string; reduced: boolean }) {
  return (
    <View style={styles.binChip}>
      {bits.split('').map((bit, i) => (
        <Enter key={i} delay={i * 60} reduced={reduced} pop>
          <Text style={[styles.binBit, bit === '1' ? styles.binOne : null]}>{bit}</Text>
        </Enter>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bulbs: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' },
  bulbCol: { alignItems: 'center', gap: 6 },
  globe: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.swan,
    borderWidth: 2,
    borderColor: '#d7d7d7',
  },
  globeLit: {
    backgroundColor: C.green,
    borderColor: C.greenDark,
    shadowColor: C.green,
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  bulbLabel: { fontSize: 11, fontWeight: '700', color: C.ash },

  table: { width: '100%', maxWidth: 300, gap: 4 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: R.sm,
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
  },
  tableCell: { fontFamily: MONO, fontSize: 13, fontWeight: '600', color: C.ash },
  tableValue: { color: C.graphite, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', maxWidth: 280, justifyContent: 'center' },
  gridCellWrap: { width: '25%', padding: 3 },
  gridCell: {
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.sm,
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: C.graphite },

  splitWrap: { alignItems: 'center', gap: 8 },
  splitRow: { flexDirection: 'row', gap: 8 },
  splitChip: { fontFamily: MONO, fontWeight: '700', fontSize: 20, paddingVertical: 6, paddingHorizontal: 10, borderRadius: R.sm },
  splitHi: { backgroundColor: C.eelLight, color: C.greenDark },
  splitLo: { backgroundColor: C.bluePale, color: C.blueDark },
  caption: { fontSize: 12, fontWeight: '500', color: C.ash, textAlign: 'center' },

  divWrap: { alignItems: 'center', gap: 8, width: '100%' },
  divBox: {
    width: '100%',
    maxWidth: 330,
    gap: 4,
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  divRow: { fontFamily: MONO, fontSize: 13, color: C.ash },
  divStrong: { color: C.greenDark, fontWeight: '700' },

  race: { width: '100%', maxWidth: 320, gap: 8 },
  lane: { height: 14, borderRadius: R.sm, backgroundColor: C.swan, overflow: 'hidden' },
  laneFill: { height: 14, borderRadius: R.sm, backgroundColor: C.blue },

  stopWrap: { alignItems: 'center', gap: 6 },
  stopwatch: { fontSize: 34, fontWeight: '700', letterSpacing: 1, color: C.graphite, fontVariant: ['tabular-nums'] },

  list: { gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tick: { fontSize: 14, fontWeight: '700', color: C.greenDark },
  listText: { fontSize: 14, fontWeight: '700', color: C.ash },

  chart: { flexDirection: 'row', gap: 5, justifyContent: 'center', width: '100%' },
  chartCell: { flex: 1, minWidth: 0, maxWidth: 38, alignItems: 'center', gap: 4 },
  chartBit: {
    width: '100%',
    height: 34,
    borderRadius: R.sm,
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartBitLit: { backgroundColor: C.green, borderColor: C.greenDark },
  chartBitText: { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: C.ash },
  chartPlace: { fontSize: 9, fontWeight: '700', color: C.ash },

  binChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  binBit: { fontFamily: MONO, fontSize: 26, fontWeight: '700', letterSpacing: 3, color: C.mute },
  binOne: { color: C.graphite },
});
