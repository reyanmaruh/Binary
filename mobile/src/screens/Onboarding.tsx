import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Byte } from '../components/Byte';
import { Btn, Card } from '../components/UI';
import { useStore } from '../store';
import { C, R, T } from '../theme';

export function OnboardingScreen() {
  const { setProfile, completeOnboarding, state } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setError('Add a name, or skip for now.');
      return;
    }
    let parsedAge: number | null = null;
    if (age.trim()) {
      const n = Number(age.trim());
      if (!Number.isFinite(n) || n < 4 || n > 120) {
        setError('Age should be between 4 and 120.');
        return;
      }
      parsedAge = Math.round(n);
    }
    setProfile(clean, parsedAge);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Byte size={104} reduced={state.settings.reducedMotion} />
          <Text style={[T.h1, styles.title]}>Hi, I&apos;m Byte.</Text>
          <Text style={styles.blurb}>Two quick things so I can greet you properly. Everything stays on this device.</Text>

          <View style={styles.form}>
            <Text style={T.label}>Your name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="Your name"
              placeholderTextColor={C.mute}
              maxLength={24}
              autoCapitalize="words"
              style={styles.input}
              accessibilityLabel="Your name"
            />
            <Text style={[T.label, { marginTop: 12 }]}>Your age</Text>
            <TextInput
              value={age}
              onChangeText={(t) => {
                setAge(t.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="Optional"
              placeholderTextColor={C.mute}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.input}
              accessibilityLabel="Your age"
            />
            <Text style={styles.hint}>Optional. Only shown on your stats card.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={{ gap: 10, marginTop: 18 }}>
              <Btn label="Start learning" onPress={submit} />
              <Btn label="Skip for now" variant="ghost" onPress={completeOnboarding} />
            </View>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { alignItems: 'center', paddingVertical: 26 },
  title: { textAlign: 'center', marginTop: 4 },
  blurb: { ...T.body, textAlign: 'center', maxWidth: 300, marginTop: 8 },
  form: { width: '100%', marginTop: 20 },
  input: {
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600',
    color: C.graphite,
    backgroundColor: C.paper,
  },
  hint: { ...T.tiny, marginTop: 6 },
  error: { fontSize: 13, fontWeight: '700', color: C.red, marginTop: 8 },
});
