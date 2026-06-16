import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { WelcomeProps } from './types';

// Kleine vink voor de afgevinkte preview-taken (zelfde vorm als Evolve.dc.html:78).
function Check() {
  return (
    <Svg width={9} height={9} viewBox="0 0 12 12">
      <Path
        d="M2 6.2 5 9l5-6.5"
        stroke={E.goldText}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Bar-hoogtes + opacities van de week-grafiek in de handoff (Evolve.dc.html:66-71).
const WEEK_BARS: Array<{ h: number; o: number }> = [
  { h: 40, o: 0.32 },
  { h: 62, o: 0.45 },
  { h: 50, o: 0.4 },
  { h: 80, o: 0.6 },
  { h: 70, o: 0.5 },
  { h: 100, o: 1 },
];

// Evolve Welcome/Landing — intro-scherm: logo, hero, preview-cluster, twee knoppen.
export default function WelcomeScreen({ onStart, onPreview }: WelcomeProps) {
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Logo-rij */}
      <View style={s.logoRow}>
        <View style={s.logoDot} />
        <Text style={s.logoText}>EVOLVE</Text>
      </View>

      {/* Midden: eyebrow → hero → sub → preview-cluster */}
      <View style={s.middle}>
        <Text style={s.eyebrow}>PERSOONLIJK ONTWIKKELINGSSYSTEEM</Text>
        <Text style={s.hero}>Word elke dag de persoon die je wilt zijn.</Text>
        <Text style={s.sub}>
          Geen generieke regels. Evolve bouwt een challenge rond jouw doelen,
          zwaktes en de identiteit die je wilt worden.
        </Text>

        <View style={s.cluster}>
          {/* Week-kaart (links-boven) */}
          <View style={[s.card, s.weekCard]}>
            <View style={s.weekHead}>
              <Text style={s.weekDay}>DAG 12 / 75</Text>
              <Text style={s.weekStreak}>🔥 12</Text>
            </View>
            <View style={s.bars}>
              {WEEK_BARS.map((b, i) => (
                <View
                  key={i}
                  style={[s.bar, { height: `${b.h}%`, opacity: b.o }]}
                />
              ))}
            </View>
            <Text style={s.weekCaption}>Voltooiing deze week</Text>
          </View>

          {/* Taken-kaart (rechts) */}
          <View style={[s.card, s.taskCard]}>
            <Text style={s.taskHead}>VANDAAG</Text>
            <View style={s.taskRow}>
              <View style={s.checkOn}>
                <Check />
              </View>
              <Text style={s.taskText}>Train 45 min</Text>
            </View>
            <View style={s.taskRow}>
              <View style={s.checkOn}>
                <Check />
              </View>
              <Text style={s.taskText}>Lees 10 pagina's</Text>
            </View>
            <View style={s.taskRowLast}>
              <View style={s.checkOff} />
              <Text style={s.taskTextDim}>Reflectie schrijven</Text>
            </View>
          </View>

          {/* +18%-kaart (links-onder) */}
          <LinearGradient
            colors={E.warmGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.scoreCard}
          >
            <Text style={s.scoreNum}>+18%</Text>
            <Text style={s.scoreCaption}>discipline-score deze maand</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Knoppen */}
      <View style={s.actions}>
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

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.6,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 24 },
  elevation: 12,
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg, paddingHorizontal: 26, paddingBottom: 30 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 6 },
  logoDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: E.gold,
    shadowColor: E.gold,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  logoText: { fontFamily: F.displayBold, fontSize: 15, letterSpacing: 5, color: E.ink },

  middle: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 3, color: E.gold, marginBottom: 18 },
  hero: { fontFamily: F.display, fontSize: 39, lineHeight: 42, letterSpacing: -1, color: E.ink },
  sub: { fontFamily: F.body, fontSize: 15.5, lineHeight: 24, color: E.dim, maxWidth: 300, marginTop: 18 },

  cluster: { position: 'relative', height: 212, marginTop: 30 },
  card: { backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, ...CARD_SHADOW },

  weekCard: { position: 'absolute', left: 0, top: 0, width: 188, padding: 16, borderRadius: 20 },
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekDay: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint },
  weekStreak: { fontFamily: F.body, fontSize: 11, color: E.gold },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 54, marginTop: 14 },
  bar: { flex: 1, backgroundColor: E.gold, borderRadius: 3 },
  weekCaption: { fontFamily: F.body, fontSize: 11, color: E.dim, marginTop: 10 },

  taskCard: { position: 'absolute', right: 0, top: 24, width: 176, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 20 },
  taskHead: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint, marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  taskRowLast: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkOn: { width: 17, height: 17, borderRadius: 6, backgroundColor: E.gold, alignItems: 'center', justifyContent: 'center' },
  checkOff: { width: 17, height: 17, borderRadius: 6, borderWidth: 1.5, borderColor: E.line },
  taskText: { fontFamily: F.body, fontSize: 12.5, color: E.ink },
  taskTextDim: { fontFamily: F.body, fontSize: 12.5, color: E.dim },

  scoreCard: {
    position: 'absolute',
    left: 40,
    bottom: 0,
    width: 150,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: E.warmBorder,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  scoreNum: { fontFamily: F.display, fontSize: 26, color: E.gold2 },
  scoreCaption: { fontFamily: F.body, fontSize: 11, color: E.dim, marginTop: 2 },

  actions: { gap: 11 },
  primary: {
    height: 56,
    borderRadius: 17,
    backgroundColor: E.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: E.gold,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  primaryText: { fontFamily: F.display, fontSize: 16, letterSpacing: 0.2, color: E.goldText },
  secondary: { height: 54, borderRadius: 17, borderWidth: 1, borderColor: E.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: F.bodyMed, fontSize: 15, color: E.ink },
});
