import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { GeneratingProps } from './types';

// STUB — vervang door het volledige Evolve AI-generatie-scherm:
// roterende goud spinner-ring met pulserende kern, titel "Jouw persoonlijke
// wetten worden gemaakt…", wisselende mono-statusregel, smalle progress-bar,
// en een 2×3 grid van categorie-kaarten (Discipline, Fysiek, Mindset, Carrière,
// Relaties, Lifestyle) die één voor één "activeren" (opacity .42→1, goud rand,
// check-badge fade-in). Dit scherm is puur visueel — de container wisselt zelf
// naar het Wetten-scherm zodra de AI-call klaar is, dus laat de animatie loopen.
export default function GeneratingScreen({ error }: GeneratingProps) {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="light" />
      <View style={s.body}>
        <ActivityIndicator size="large" color={E.gold} />
        <Text style={s.title}>Jouw persoonlijke wetten worden gemaakt…</Text>
        <Text style={s.sub}>We analyseren je doelen, gewoontes en gewenste identiteit.</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  title: { fontFamily: F.display, fontSize: 24, color: E.ink, textAlign: 'center', marginTop: 16, letterSpacing: -0.4 },
  sub: { fontFamily: F.body, fontSize: 14.5, color: E.dim, textAlign: 'center' },
  error: { fontFamily: F.body, fontSize: 13, color: E.red, textAlign: 'center', marginTop: 8 },
});
