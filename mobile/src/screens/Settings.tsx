import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Btn, Card, PageHead } from '../components/UI';
import { CONFIG } from '../data/curriculum';
import { FadeIn } from '../motion';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';

export function SettingsScreen({ nav }: { nav: Nav }) {
  const { state, setProfile, toggleSetting, reset } = useStore();
  const [name, setName] = useState(state.profile.name);
  const [age, setAge] = useState(state.profile.age ? String(state.profile.age) : '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const reduced = state.settings.reducedMotion;

  const save = () => {
    let parsedAge: number | null = null;
    if (age.trim()) {
      const n = Number(age.trim());
      if (!Number.isFinite(n) || n < 4 || n > 120) {
        setError('Age should be between 4 and 120.');
        return;
      }
      parsedAge = Math.round(n);
    }
    setProfile(name.trim().replace(/\s+/g, ' '), parsedAge);
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <PageHead title="Settings" subtitle="Make it feel right." onBack={() => nav.tab('home')} />

      <FadeIn from={10} enabled={!reduced}>
        <Card style={{ paddingVertical: 8 }}>
          <Row
            title="Haptics"
            desc="A light tap on answers and purchases."
            value={state.settings.haptics}
            onChange={() => toggleSetting('haptics')}
          />
          <Row
            title="Reduced motion"
            desc="No floating mascot or popping cards."
            value={state.settings.reducedMotion}
            onChange={() => toggleSetting('reducedMotion')}
            last
          />
        </Card>
      </FadeIn>

      <FadeIn delay={70} from={14} enabled={!reduced} style={{ marginTop: 16 }}>
        <Card style={{ padding: 20 }}>
          <Text style={T.h3}>Your profile</Text>
          <Text style={[T.tiny, { marginTop: 6, lineHeight: 18 }]}>
            Used to greet you and to label your stats. Stays on this device.
          </Text>
          <Text style={[T.label, { marginTop: 14 }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              setSaved(false);
            }}
            placeholder="Your name"
            placeholderTextColor={C.mute}
            style={styles.input}
            maxLength={24}
          />
          <Text style={[T.label, { marginTop: 12 }]}>Age</Text>
          <TextInput
            value={age}
            onChangeText={(t) => {
              setAge(t.replace(/[^0-9]/g, ''));
              setSaved(false);
            }}
            placeholder="Optional"
            placeholderTextColor={C.mute}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={3}
          />
          <Text style={[T.tiny, { marginTop: 6 }]}>Optional. Only shown on your stats card.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Btn label={saved ? 'Saved' : 'Save profile'} variant="secondary" onPress={save} style={{ marginTop: 14 }} />
        </Card>
      </FadeIn>

      <FadeIn delay={140} from={14} enabled={!reduced} style={{ marginTop: 16 }}>
        <Card style={{ padding: 20 }}>
          <Text style={T.h3}>Rewards &amp; rules</Text>
          {[
            ['diamond', 'First clear', `Full lesson XP plus ${CONFIG.firstClearGems} gems, once per lesson.`],
            ['timer', 'Replay', `${Math.round(CONFIG.replayXpFactor * 100)}% of the base XP and no gems.`],
            ['trophy', 'New personal best', `+${CONFIG.pbGems} gems, once a day per lesson.`],
            ['locate', 'Practice', 'Pays answer XP only and never costs hearts.'],
            ['lock-closed', 'Unlock rule', `Pass the practice session at ${Math.round(CONFIG.practiceGate * 100)}% accuracy to open the next lesson.`],
            ['information-circle', 'Daily cap', `${CONFIG.dailyXpCap} XP and ${CONFIG.dailyGemCap} gems from lessons, practice and speed runs.`],
          ].map(([icon, title, body]) => (
            <View key={title} style={styles.rule}>
              <View style={styles.ruleIcon}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={C.greenDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>{title}</Text>
                <Text style={styles.ruleBody}>{body}</Text>
              </View>
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={210} from={14} enabled={!reduced} style={{ marginTop: 16 }}>
        <Card style={{ padding: 20 }}>
          <Text style={T.h3}>Danger zone</Text>
          <Text style={[T.tiny, { marginTop: 6, lineHeight: 18 }]}>
            Resetting clears XP, hearts, stars and every saved stat on this device.
          </Text>
          <Btn
            label="Reset progress"
            variant="danger"
            style={{ marginTop: 14 }}
            onPress={() =>
              Alert.alert('Reset everything?', 'This wipes all progress on this device. It cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    reset();
                    nav.tab('home');
                  },
                },
              ])
            }
          />
        </Card>
      </FadeIn>

      <Text style={styles.footer}>
        Binary Trainer · offline · no accounts · no leaderboard{'\n'}Everything lives on your device.
      </Text>
    </ScrollView>
  );
}

function Row({
  title,
  desc,
  value,
  onChange,
  last,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? { borderBottomWidth: 0 } : null]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.swan, true: C.green }}
        ios_backgroundColor={C.swan}
        thumbColor={C.paper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: C.graphite },
  rowDesc: { ...T.tiny, marginTop: 2, lineHeight: 18 },
  input: {
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600',
    color: C.graphite,
    marginTop: 6,
    backgroundColor: C.paper,
    shadowColor: C.swan,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
  error: { fontSize: 13, fontWeight: '600', color: C.red, marginTop: 8 },
  rule: { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  ruleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.eelLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleTitle: { fontSize: 14, fontWeight: '700', color: C.graphite },
  ruleBody: { ...T.tiny, marginTop: 1, lineHeight: 18 },
  footer: { ...T.tiny, textAlign: 'center', marginTop: 20, lineHeight: 19 },
});
