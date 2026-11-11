import { Ionicons } from '@expo/vector-icons';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setSoundEnabled } from './src/audio';
import type { Nav, Route, TabName } from './src/navigation';
import { OnboardingScreen } from './src/screens/Onboarding';
import { HomeScreen } from './src/screens/Home';
import { PlayerScreen } from './src/screens/Player';
import { ResultsScreen } from './src/screens/Results';
import { PracticeScreen } from './src/screens/Practice';
import { StatsScreen } from './src/screens/Stats';
import { SettingsScreen } from './src/screens/Settings';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';
import type { Mode, SessionResult } from './src/types';
import { Text } from './src/components/Text';

const TABS: {
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  outline: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'home', label: 'Learn', icon: 'home', outline: 'home-outline' },
  { name: 'practice', label: 'Practice', icon: 'refresh-circle', outline: 'refresh-circle-outline' },
  { name: 'stats', label: 'Stats', icon: 'stats-chart', outline: 'stats-chart-outline' },
  { name: 'settings', label: 'Settings', icon: 'options', outline: 'options-outline' },
];

/** The web's `screenIn`: fade plus a 6px rise every time the route changes. */
function Scene({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [routeKey, v]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function TabBar({ current, nav }: { current: Route; nav: Nav }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const active = current.name === t.name;
        return (
          <TabButton key={t.name} active={active} onPress={() => nav.tab(t.name)} icon={t.icon} outline={t.outline} label={t.label} />
        );
      })}
    </View>
  );
}

function TabButton({
  active,
  onPress,
  icon,
  outline,
  label,
}: {
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  outline: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const scale = useRef(new Animated.Value(active ? 1.06 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: active ? 1.06 : 1, useNativeDriver: true, friction: 6, tension: 180 }).start();
  }, [active, scale]);
  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {({ pressed }) => (
        <Animated.View style={{ alignItems: 'center', gap: 4, transform: [{ scale: pressed ? 0.96 : scale }] }}>
          <Ionicons name={active ? icon : outline} size={26} color={active ? C.blue : C.mute} />
          <Text style={[styles.tabLabel, active ? { color: C.blue } : null]}>{label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function Root() {
  const { state, ready } = useStore();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  useEffect(() => {
    setSoundEnabled(state.settings.sound);
  }, [state.settings.sound]);

  const nav: Nav = {
    go: (name, params) => setStack((s) => [...s, { name, params }]),
    replace: (name, params) => setStack((s) => [...s.slice(0, -1), { name, params }]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: (name) => setStack([{ name }]),
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.green} size="large" />
      </View>
    );
  }

  if (!state.profile.onboarded) {
    return <OnboardingScreen />;
  }

  const current = stack[stack.length - 1];
  const showTabs = ['home', 'practice', 'stats', 'settings'].includes(current.name);

  let screen: React.ReactNode = null;
  switch (current.name) {
    case 'home':
      screen = <HomeScreen nav={nav} />;
      break;
    case 'practice':
      screen = <PracticeScreen nav={nav} />;
      break;
    case 'stats':
      screen = <StatsScreen nav={nav} />;
      break;
    case 'settings':
      screen = <SettingsScreen nav={nav} />;
      break;
    case 'player': {
      const params = (current.params || { mode: 'lesson' }) as { lessonId?: string; mode: Mode };
      screen = <PlayerScreen params={params} nav={nav} />;
      break;
    }
    case 'results':
      screen = <ResultsScreen result={current.params as SessionResult} nav={nav} />;
      break;
    default:
      screen = <HomeScreen nav={nav} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1 }}>
        <Scene routeKey={`${current.name}-${stack.length}`}>{screen}</Scene>
      </View>
      {showTabs ? <TabBar current={current} nav={nav} /> : null}
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.root} edges={['top']}>
          {loaded ? <Root /> : <View style={styles.loading} />}
        </SafeAreaView>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper },
  tabbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: C.paper,
    borderTopWidth: 2,
    borderTopColor: C.swan,
    shadowColor: C.graphite,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 12 },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.mute },
});
