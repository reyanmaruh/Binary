import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Byte } from '../components/Byte';
import { Text, TextInput } from '../components/Text';
import { Btn, Card } from '../components/UI';
import { FadeIn } from '../motion';
import { useStore } from '../store';
import { C, R, T } from '../theme';

export function OnboardingScreen() {
  const { setProfile, completeOnboarding, state } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const reduced = state.settings.reducedMotion;

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <FadeIn from={14} enabled={!reduced}>
          <Card style={styles.card}>
            <Byte size={104} reduced={reduced} mood="celebrate" />
            <Text style={styles.title}>Hi, I&apos;m Byte.</Text>
            <Text style={styles.blurb}>Two quick things so I can greet you properly. Everything stays on this device.</Text>

            <View style={styles.form}>
              <Text style={[T.label, styles.fieldLabel]}>Your name</Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError('');
                }}
                placeholder="Your name"
                placeholderTextColor="#b9b9b9"
                maxLength={24}
                autoCapitalize="words"
                style={styles.input}
                accessibilityLabel="Your name"
              />
              <Text style={[T.label, styles.fieldLabel, { marginTop: 14 }]}>Your age</Text>
              <TextInput
                value={age}
                onChangeText={(t) => {
                  setAge(t.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="Optional"
                placeholderTextColor="#b9b9b9"
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
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 22 },
  title: { fontSize: 27, fontWeight: '700', color: C.graphite, letterSpacing: -0.8, textAlign: 'center', lineHeight: 32, marginTop: 10 },
  blurb: { fontSize: 15, fontWeight: '500', color: C.ash, lineHeight: 23, textAlign: 'center', maxWidth: 320, marginTop: 6 },
  form: { width: '100%', marginTop: 22 },
  fieldLabel: { marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: C.graphite,
    backgroundColor: C.paper,
    shadowColor: C.swan,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
  hint: { ...T.tiny, marginTop: 6 },
  error: { fontSize: 13, fontWeight: '600', color: C.red, marginTop: 8 },
});
