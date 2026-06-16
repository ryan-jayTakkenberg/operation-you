import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { GeneratingProps } from './types';

// 6 categorie-kaarten die één voor één "activeren" tijdens het genereren.
const CATS = [
  { label: 'Discipline', icon: '🧭' },
  { label: 'Fysiek', icon: '💪' },
  { label: 'Mindset', icon: '🧠' },
  { label: 'Carrière', icon: '🚀' },
  { label: 'Relaties', icon: '🤝' },
  { label: 'Lifestyle', icon: '🌿' },
];

// Roulerende mono-statusregels — index loopt mee met de voortgang (0..6).
const STATUSES = [
  'Profiel analyseren…',
  'Doelen wegen…',
  'Zwaktes in kaart brengen…',
  'Identiteit vormgeven…',
  'Wetten schrijven…',
  'Ritme afstemmen…',
  'Bijna klaar…',
];

const STEP_MS = 560;

export default function GeneratingScreen({ error }: GeneratingProps) {
  // genIdx loopt 0→6 en wrapt terug — puur visueel, de container wisselt zelf weg.
  const [genIdx, setGenIdx] = useState(0);

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const cards = useRef(CATS.map(() => new Animated.Value(0))).current;

  // Stap-interval: schuift de voortgang vooruit en begint opnieuw na voltooiing.
  useEffect(() => {
    const id = setInterval(() => {
      setGenIdx((i) => (i >= 6 ? 0 : i + 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  // Doorlopende spinner-rotatie.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  // Pulserende kern-stip.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Progress-bar + kaart-activatie volgen genIdx.
  useEffect(() => {
    Animated.timing(bar, {
      toValue: Math.min(genIdx, 6) / 6,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    cards.forEach((v, i) => {
      Animated.timing(v, {
        toValue: genIdx > i ? 1 : 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [genIdx, bar, cards]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const status = STATUSES[Math.min(genIdx, 6)];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="light" />
      <View style={s.body}>
        {/* Spinner-ring met pulserende kern */}
        <View style={s.spinnerWrap}>
          <Animated.View style={[s.ring, { transform: [{ rotate }] }]} />
          <View style={s.coreWrap}>
            <Animated.View style={[s.core, { opacity: pulse }]} />
          </View>
        </View>

        <Text style={s.title}>Jouw persoonlijke wetten worden gemaakt…</Text>
        <Text style={s.sub}>We analyseren je doelen, gewoontes en gewenste identiteit.</Text>

        <Text style={s.status}>{status}</Text>

        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: barWidth }]} />
        </View>

        {/* 2×3 grid categorie-kaarten */}
        <View style={s.grid}>
          {CATS.map((c, i) => {
            const active = genIdx > i;
            const opacity = cards[i].interpolate({ inputRange: [0, 1], outputRange: [0.42, 1] });
            return (
              <Animated.View
                key={c.label}
                style={[
                  s.card,
                  { opacity },
                  active ? s.cardActive : null,
                ]}
              >
                <Text style={s.cardIcon}>{c.icon}</Text>
                <Text style={s.cardLabel}>{c.label}</Text>
                <Animated.View style={{ opacity: cards[i] }}>
                  <Svg width={16} height={16} viewBox="0 0 16 16">
                    <Circle cx={8} cy={8} r={8} fill={E.gold} />
                    <Path
                      d="M4.5 8.2 7 10.5 11.5 5.5"
                      stroke={E.goldText}
                      strokeWidth={1.8}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </Animated.View>
            );
          })}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  spinnerWrap: { width: 74, height: 74, marginBottom: 30 },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: E.ringTrack,
    borderTopColor: E.gold,
  },
  coreWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  core: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: E.gold,
    shadowColor: E.gold,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  title: {
    fontFamily: F.display,
    fontSize: 24,
    color: E.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  sub: {
    fontFamily: F.body,
    fontSize: 14.5,
    color: E.dim,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 18,
  },

  status: { fontFamily: F.mono, fontSize: 12, color: E.gold, marginBottom: 8 },

  barTrack: {
    width: 200,
    height: 4,
    borderRadius: 999,
    backgroundColor: E.ringTrack,
    overflow: 'hidden',
    marginBottom: 34,
  },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: E.gold },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    marginBottom: 11,
  },
  cardActive: { backgroundColor: E.s2, borderColor: E.gold },
  cardIcon: { fontSize: 18 },
  cardLabel: { flex: 1, fontFamily: F.bodySemi, fontSize: 13.5, color: E.ink },

  error: {
    fontFamily: F.body,
    fontSize: 13,
    color: E.red,
    textAlign: 'center',
    marginTop: 24,
  },
});
