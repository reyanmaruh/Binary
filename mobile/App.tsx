import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

const TABS: { name: TabName; label: string; icon: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'Learn', icon: 'home', outline: 'home-outline' },
  { name: 'practice', label: 'Practice', icon: 'refresh-circle', outline: 'refresh-circle-outline' },
  { name: 'stats', label: 'Stats', icon: 'stats-chart', outline: 'stats-chart-outline' },
  { name: 'settings', label: 'Settings', icon: 'options', outline: 'options-outline' },
];

function Root() {
  const { state, ready } = useStore();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

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
      {Platform.OS === 'android' ? <View style={{ height: RNStatusBar.currentHeight || 0 }} /> : null}
      <View style={{ flex: 1 }}>{screen}</View>
      {showTabs ? (
        <View style={styles.tabbar}>
          {TABS.map((t) => {
            const active = current.name === t.name;
            return (
              <Pressable
                key={t.name}
                style={styles.tab}
                onPress={() => nav.tab(t.name)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={active ? t.icon : t.outline} size={24} color={active ? C.blue : C.mute} />
                <Text style={[styles.tabLabel, active ? { color: C.blue } : null]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root}>
        <Root />
      </SafeAreaView>
    </StoreProvider>
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: C.paper,
    borderTopWidth: 2,
    borderTopColor: C.swan,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', color: C.mute },
});
