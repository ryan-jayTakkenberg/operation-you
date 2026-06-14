import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { OnboardingStepsProps, OnboForm } from './types';

// STUB — vervang door de volledige Evolve onboarding (7 stappen):
// vaste header (terug-knop + "STAP NN / 07" + progress-bar), per stap wisselende
// inhoud, chips voor sporten/hobby's/groeirichting (stap 3-4), slider tijd-per-dag
// + strengheid-radiokaarten (stap 7), reflectieve copy. Knop "Volgende" (stap 1-6)
// / "Genereer mijn challenge" (stap 7) → onComplete(form). Terug vanaf stap 1 → onExit.
// Dit kale formulier verzamelt alvast de kernvelden zodat de flow werkt.
export default function OnboardingSteps({ initialForm, onComplete, onExit }: OnboardingStepsProps) {
  const [form, setForm] = useState<OnboForm>(initialForm);
  const set = (patch: Partial<OnboForm>) => setForm((f) => ({ ...f, ...patch }));

  const Field = ({ label, value, onChangeText, multiline, keyboardType }: {
    label: string; value: string; onChangeText: (t: string) => void;
    multiline?: boolean; keyboardType?: 'default' | 'numeric';
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={E.faint}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={onExit} style={{ marginBottom: 16 }}>
            <Text style={s.back}>‹ Terug</Text>
          </TouchableOpacity>
          <Text style={s.title}>Vertel over jezelf</Text>

          <Field label="NAAM" value={form.name} onChangeText={(t) => set({ name: t })} />
          <Field label="LEEFTIJD" value={form.age} onChangeText={(t) => set({ age: t })} keyboardType="numeric" />
          <Field label="WERK / STUDIE" value={form.work} onChangeText={(t) => set({ work: t })} />
          <Field label="WAT GEEFT JE ENERGIE?" value={form.energy} onChangeText={(t) => set({ energy: t })} multiline />
          <Field label="JE GROOTSTE DOELEN" value={form.goals} onChangeText={(t) => set({ goals: t })} multiline />
          <Field label="JE SLECHTE GEWOONTES" value={form.weak} onChangeText={(t) => set({ weak: t })} multiline />
          <Field label="OVER 1 JAAR" value={form.year1} onChangeText={(t) => set({ year1: t })} multiline />
          <Field label="WAT VOOR PERSOON WIL JE WORDEN?" value={form.becoming} onChangeText={(t) => set({ becoming: t })} multiline />

          <TouchableOpacity style={s.btn} onPress={() => onComplete(form)} activeOpacity={0.85}>
            <Text style={s.btnText}>Genereer mijn challenge</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  back: { fontFamily: F.bodySemi, fontSize: 14, color: E.dim },
  title: { fontFamily: F.display, fontSize: 27, color: E.ink, letterSpacing: -0.5, marginBottom: 22 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint, marginBottom: 8 },
  input: { height: 52, paddingHorizontal: 16, backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, borderRadius: 14, color: E.ink, fontFamily: F.body, fontSize: 15.5 },
  inputMulti: { height: undefined, minHeight: 80, paddingTop: 14, textAlignVertical: 'top' },
  btn: { height: 56, borderRadius: 17, backgroundColor: E.gold, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
});
