import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { LawsProps } from './types';

// STUB — vervang door het volledige Evolve Wetten-scherm:
// header (eyebrow + "Zes wetten, op jou gebouwd." + sub), lijst van wet-kaarten
// (icoon-tegel + titel + waarom-tekst + mono-pills freq/moeilijkheid/categorie +
// "Aanpassen"-link), vaste CTA "Start challenge" → onStart + disclaimer
// "75 dagen · je kunt je wetten altijd bijsturen". Data komt uit `identity`.
export default function LawsScreen({ identity, onStart }: LawsProps) {
  const rules = identity?.rules ?? [];
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>JOUW PERSOONLIJKE WETTEN</Text>
        <Text style={s.title}>{identity?.name || 'Op jou gebouwd.'}</Text>
        {identity?.manifesto ? <Text style={s.manifesto}>{identity.manifesto}</Text> : null}

        {rules.map((r) => (
          <View key={r.id} style={s.card}>
            <Text style={s.cardText}>{r.text}</Text>
            <Text style={s.cardSection}>{r.section}</Text>
          </View>
        ))}

        <TouchableOpacity style={s.btn} onPress={onStart} activeOpacity={0.85}>
          <Text style={s.btnText}>Start challenge</Text>
        </TouchableOpacity>
        <Text style={s.disclaimer}>75 dagen · je kunt je wetten altijd bijsturen</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: E.gold, marginBottom: 10 },
  title: { fontFamily: F.display, fontSize: 26, color: E.ink, letterSpacing: -0.5, marginBottom: 8 },
  manifesto: { fontFamily: F.body, fontSize: 14, color: E.dim, lineHeight: 21, marginBottom: 18 },
  card: { padding: 16, backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, borderRadius: 18, marginBottom: 12 },
  cardText: { fontFamily: F.bodySemi, fontSize: 15, color: E.ink },
  cardSection: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1, color: E.faint, marginTop: 6, textTransform: 'uppercase' },
  btn: { height: 56, borderRadius: 17, backgroundColor: E.gold, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
  disclaimer: { fontFamily: F.body, fontSize: 12, color: E.faint, textAlign: 'center', marginTop: 11 },
});
