import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { WelcomeProps } from './types';

// STUB — vervang door het volledige Evolve Welcome/Landing-scherm.
// Spec: logo-rij (goud-stip + "EVOLVE"), eyebrow, grote hero-titel
// "Word elke dag de persoon die je wilt zijn.", subtekst, preview-cluster
// (3 zwevende kaartjes), primaire knop "Start mijn traject" → onStart,
// secundaire knop "Bekijk voorbeeld" → onPreview.
export default function WelcomeScreen({ onStart, onPreview }: WelcomeProps) {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="light" />
      <View style={s.body}>
        <Text style={s.logo}>EVOLVE</Text>
        <Text style={s.hero}>Word elke dag de persoon die je wilt zijn.</Text>
        <Text style={s.sub}>
          Geen generieke regels. Evolve bouwt een challenge rond jouw doelen,
          zwaktes en de identiteit die je wilt worden.
        </Text>
        <TouchableOpacity style={s.primary} onPress={onStart} activeOpacity={0.85}>
          <Text style={s.primaryText}>Start mijn traject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondary} onPress={onPreview} activeOpacity={0.7}>
          <Text style={s.secondaryText}>Bekijk voorbeeld</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, gap: 16 },
  logo: { fontFamily: F.displayBold, fontSize: 15, letterSpacing: 5, color: E.ink },
  hero: { fontFamily: F.display, fontSize: 39, lineHeight: 42, letterSpacing: -1, color: E.ink },
  sub: { fontFamily: F.body, fontSize: 15.5, lineHeight: 24, color: E.dim },
  primary: { height: 56, borderRadius: 17, backgroundColor: E.gold, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
  secondary: { height: 54, borderRadius: 17, borderWidth: 1, borderColor: E.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: F.bodyMed, fontSize: 15, color: E.ink },
});
