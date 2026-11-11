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
  // Most specific descriptions first: several of these mention "chart" or
  // "bulb" but need their own staging rather than the generic widget.
  if (/toggling between/.test(h)) return <ToggleBulb reduced={reduced} />;
  if (/cycling through all four/.test(h)) return <ComboBulbs reduced={reduced} />;
  if (/side-by-side: decimal|incrementing together/.test(h)) return <CountTogether reduced={reduced} />;
  if (/3-bit counter/.test(h)) return <Counter3 reduced={reduced} />;
  if (/0011 \+ 1|chain carry/.test(h)) return <CarryDemo reduced={reduced} />;
  if (/two bulbs on|values added above/.test(h)) return <TwoBits reduced={reduced} />;
  if (/each place flashing|running remainder/.test(h)) return <GreedyChart reduced={reduced} />;
  if (/two-sided comparison/.test(h)) return <Compare reduced={reduced} />;
  if (/slides off screen/.test(h)) return <SlideOffChart reduced={reduced} />;
  if (/empty screen with a single 8-bit|single 8-bit input/.test(h)) return <BlindRow reduced={reduced} />;
  if (/chart anchored at top|timer appearing/.test(h)) return <ChartTimer reduced={reduced} />;
  if (/faint chart overlay|arrow moving left to right/.test(h)) return <SweepChart reduced={reduced} />;
  if (/each bulb flashed/.test(h)) return <Chart reduced={reduced} />;
  if (/eight light bulbs|8 bulbs above/.test(h)) return <Bulbs eight reduced={reduced} />;
  if (/bulb|light/.test(h)) return <Bulbs eight={false} reduced={reduced} />;
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

function useCycle(length: number, ms: number, reduced: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) {
      setI(length - 1);
      return;
    }
    setI(0);
    const id = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms, reduced]);
  return i;
}

function MiniBulb({ lit, value, reduced }: { lit: boolean; value: string; reduced: boolean }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.spring(s, { toValue: lit ? 1.1 : 1, useNativeDriver: true, friction: 6, tension: 180 }).start();
  }, [lit, reduced, s]);
  return (
    <View style={styles.bulbCol}>
      <Animated.View style={[styles.globeBig, lit ? styles.globeLit : null, { transform: [{ scale: s }] }]} />
      <Text style={[styles.bulbLabel, lit ? { color: C.greenDark } : null]}>{value}</Text>
    </View>
  );
}

/** One bulb switching between off/0 and on/1. */
function ToggleBulb({ reduced }: { reduced: boolean }) {
  const i = useCycle(2, 1300, reduced);
  const on = reduced || i === 1;
  return (
    <View style={styles.centerCol}>
      <MiniBulb lit={on} value={on ? '1' : '0'} reduced={reduced} />
      <Text style={styles.stateText}>{on ? 'ON · 1' : 'OFF · 0'}</Text>
      <Text style={styles.caption}>a bit is just a switch</Text>
    </View>
  );
}

/** Two bulbs walking through 00, 01, 10, 11. */
function ComboBulbs({ reduced }: { reduced: boolean }) {
  const combos = ['00', '01', '10', '11'];
  const i = useCycle(combos.length, 1000, reduced);
  const bits = combos[i].split('');
  return (
    <View style={styles.centerCol}>
      <View style={styles.comboRow}>
        {bits.map((b, idx) => (
          <MiniBulb key={idx} lit={b === '1'} value={idx === 0 ? '2' : '1'} reduced={reduced} />
        ))}
      </View>
      <Text style={styles.stateText}>{combos[i]}</Text>
      <Text style={styles.caption}>two switches → four states</Text>
    </View>
  );
}

/** Decimal and binary counting up together. */
function CountTogether({ reduced }: { reduced: boolean }) {
  const i = useCycle(9, 750, reduced);
  const n = i;
  return (
    <View style={styles.centerCol}>
      <View style={styles.compareRow}>
        <View style={styles.countBox}>
          <Text style={styles.countBig}>{n}</Text>
          <Text style={styles.countLabel}>decimal</Text>
        </View>
        <Text style={styles.compareArrow}>→</Text>
        <View style={styles.countBox}>
          <Text style={[styles.countBig, { color: C.blueDark, fontFamily: MONO }]}>{n.toString(2)}</Text>
          <Text style={styles.countLabel}>binary</Text>
        </View>
      </View>
      <Text style={styles.caption}>same count, two languages</Text>
    </View>
  );
}

/** Three bulbs counting with a beat. */
function Counter3({ reduced }: { reduced: boolean }) {
  const i = useCycle(8, 700, reduced);
  const bits = i.toString(2).padStart(3, '0').split('');
  return (
    <View style={styles.centerCol}>
      <View style={styles.comboRow}>
        {bits.map((b, idx) => (
          <MiniBulb key={idx} lit={b === '1'} value={String(4 >> idx)} reduced={reduced} />
        ))}
      </View>
      <Text style={styles.stateText}>
        {bits.join('')} · {i}
      </Text>
      <Text style={styles.caption}>each beat flips the next bulb</Text>
    </View>
  );
}

/** 0011 + 1 flipping to 0100 with the carry called out. */
function CarryDemo({ reduced }: { reduced: boolean }) {
  const phase = useCycle(3, 1100, reduced);
  const bits = reduced || phase > 0 ? '0100' : '0011';
  return (
    <View style={styles.centerCol}>
      <View style={styles.comboRow}>
        {bits.split('').map((b, i) => (
          <MiniBulb key={i} lit={b === '1'} value={String(8 >> i)} reduced={reduced} />
        ))}
      </View>
      <Text style={styles.stateText}>{reduced || phase > 0 ? '0100' : '0011 + 1'}</Text>
      <Text style={styles.caption}>
        {reduced ? '0011 + 1 = 0100' : phase === 0 ? 'add one to the rightmost bit…' : phase === 1 ? 'carry ripples left' : '0100 = 4'}
      </Text>
    </View>
  );
}

/** Two lit places added above their bulbs. */
function TwoBits({ reduced }: { reduced: boolean }) {
  return (
    <View style={styles.centerCol}>
      <Text style={styles.sumLine}>
        <Text style={styles.sumStrong}>4</Text> + <Text style={styles.sumStrong}>2</Text> = <Text style={styles.sumStrong}>6</Text>
      </Text>
      <View style={styles.comboRow}>
        <MiniBulb lit value="4" reduced={reduced} />
        <MiniBulb lit value="2" reduced={reduced} />
      </View>
      <Text style={styles.caption}>add the values of the bulbs that are on</Text>
    </View>
  );
}

/** Greedy walk over 100: green when a place fits, red when it doesn't. */
function GreedyChart({ reduced }: { reduced: boolean }) {
  const places = [128, 64, 32, 16, 8, 4, 2, 1];
  const rows = useMemo(() => {
    let rem = 100;
    return places.map((place) => {
      const fit = place <= rem;
      if (fit) rem -= place;
      return { place, fit, rem };
    });
  }, []);
  const step = useCycle(places.length + 1, 700, reduced);
  const shown = reduced ? places.length : step;
  const rem = shown === 0 ? 100 : rows[Math.min(shown, places.length) - 1].rem;
  return (
    <View style={styles.centerCol}>
      <View style={styles.greedyRow}>
        {rows.map((row, i) => {
          const seen = i < shown;
          return (
            <View key={row.place} style={styles.greedyCell}>
              <View style={[styles.greedyBit, seen ? (row.fit ? styles.greedyFit : styles.greedyMiss) : null]}>
                <Text style={[styles.greedyText, seen ? { color: C.paper } : null]}>{seen ? (row.fit ? '1' : '0') : '·'}</Text>
              </View>
              <Text style={styles.greedyPlace}>{row.place}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.remainderText}>{shown >= places.length ? '01100100 = 100' : `remainder ${rem}`}</Text>
      <Text style={styles.caption}>green fits · red is skipped</Text>
    </View>
  );
}

/** 100 written in decimal and in eight bits. */
function Compare({ reduced }: { reduced: boolean }) {
  const bits = '01100100';
  return (
    <View style={styles.centerCol}>
      <View style={styles.countBox}>
        <Text style={styles.countBig}>100</Text>
        <Text style={styles.countLabel}>decimal</Text>
      </View>
      <Text style={styles.compareArrow}>↓</Text>
      <View style={styles.bitsRow}>
        {bits.split('').map((b, i) => (
          <View key={i} style={[styles.compareBit, b === '1' ? styles.compareBitOn : null]}>
            <Text style={[styles.compareBitText, b === '1' ? { color: C.paper } : null]}>{b}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.caption}>100 → 01100100 · same value, two languages</Text>
    </View>
  );
}

function useLoop(duration: number, reduced: boolean, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, reduced, v]);
  return v;
}

/** The chart sliding away, leaving only the eight numbers behind. */
function SlideOffChart({ reduced }: { reduced: boolean }) {
  const v = useLoop(1900, reduced, 600);
  return (
    <View style={styles.centerCol}>
      <View style={styles.slideWindow}>
        <Animated.View
          style={{
            width: '100%',
            opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.2, 0] }),
            transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -160] }) }],
          }}
        >
          <Chart reduced />
        </Animated.View>
      </View>
      <View style={styles.faintPlaces}>
        {[128, 64, 32, 16, 8, 4, 2, 1].map((n) => (
          <Text key={n} style={styles.faintPlace}>
            {n}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>the numbers stay in your head</Text>
    </View>
  );
}

/** Eight empty boxes and a ticking clock: blind conversion. */
function BlindRow({ reduced }: { reduced: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  return (
    <View style={styles.centerCol}>
      <View style={styles.blindRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.blindCell} />
        ))}
      </View>
      <Animated.Text
        style={[
          styles.timerText,
          { opacity: reduced ? 0.8 : v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] }) },
        ]}
      >
        60s
      </Animated.Text>
      <Text style={styles.caption}>no chart, no hints — trust the place values</Text>
    </View>
  );
}

/** A pinned chart with the clock fading in over it. */
function ChartTimer({ reduced }: { reduced: boolean }) {
  const v = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(0.45);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.55, duration: 1100, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.25, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  return (
    <View style={styles.centerCol}>
      <Chart reduced={reduced} />
      <Animated.Text style={[styles.timerFaint, { opacity: v }]}>60s</Animated.Text>
      <Text style={styles.caption}>the chart stays, the clock starts</Text>
    </View>
  );
}

/** An arrow sweeping left to right under a faint chart. */
function SweepChart({ reduced }: { reduced: boolean }) {
  const v = useLoop(2400, reduced);
  return (
    <View style={styles.centerCol}>
      <View style={styles.sweepWrap}>
        <View style={{ opacity: 0.4 }}>
          <Chart reduced />
        </View>
        <Animated.Text
          style={[
            styles.sweepArrow,
            { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 210] }) }] },
          ]}
        >
          →
        </Animated.Text>
      </View>
      <Text style={styles.caption}>work left → right, one place at a time</Text>
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

/** Shared tiny uppercase caption used by the new widgets. */
const TinyLabel = { fontSize: 9, fontWeight: '700' as const, letterSpacing: 0.8, color: C.ash, textTransform: 'uppercase' as const };

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

  centerCol: { alignItems: 'center', gap: 10, width: '100%' },
  globeBig: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.swan,
    borderWidth: 2,
    borderColor: '#d7d7d7',
  },
  comboRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-end', justifyContent: 'center' },
  stateText: { fontFamily: MONO, fontSize: 17, fontWeight: '700', color: C.graphite, letterSpacing: 1 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  countBox: { minWidth: 78, alignItems: 'center', gap: 2 },
  countBig: { fontSize: 30, fontWeight: '700', color: C.greenDark, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  countLabel: { ...TinyLabel },
  compareArrow: { fontSize: 20, fontWeight: '700', color: C.mute },
  bitsRow: { flexDirection: 'row', gap: 3 },
  compareBit: {
    width: 21,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareBitOn: { backgroundColor: C.blue, borderColor: C.blueDark },
  compareBitText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: C.mute },
  sumLine: { fontSize: 16, fontWeight: '600', color: C.ash },
  sumStrong: { fontSize: 22, fontWeight: '700', color: C.greenDark },
  greedyRow: { flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  greedyCell: { flex: 1, minWidth: 0, maxWidth: 40, alignItems: 'center', gap: 4 },
  greedyBit: {
    width: '100%',
    height: 32,
    borderRadius: R.sm,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greedyFit: { backgroundColor: C.green, borderColor: C.greenDark },
  greedyMiss: { backgroundColor: C.red, borderColor: C.redDark },
  greedyText: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: C.mute },
  greedyPlace: { fontSize: 9, fontWeight: '700', color: C.ash },
  remainderText: { fontSize: 13, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
  slideWindow: { width: '100%', height: 60, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  faintPlaces: { flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%' },
  faintPlace: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: C.mute },
  blindRow: { flexDirection: 'row', gap: 4, width: '100%', justifyContent: 'center' },
  blindCell: {
    flex: 1,
    maxWidth: 34,
    height: 36,
    borderRadius: R.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.lineStrong,
    backgroundColor: C.paper,
  },
  timerText: { fontSize: 25, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
  timerFaint: { fontSize: 20, fontWeight: '700', color: C.ash, fontVariant: ['tabular-nums'] },
  sweepWrap: { width: '100%', maxWidth: 300, alignItems: 'center', justifyContent: 'center' },
  sweepArrow: { position: 'absolute', fontSize: 18, fontWeight: '700', color: C.greenDark },
});
