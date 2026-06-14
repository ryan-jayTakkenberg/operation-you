import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { EVOLVE as E, EV_FONTS as F } from '../constants/theme';

// Toggle-switch (44x26). Witte knop schuift van 0 (uit) naar 20 (aan).
function Switch({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[s.track, { backgroundColor: on ? E.gold : E.s2 }]}
    >
      <View style={[s.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </TouchableOpacity>
  );
}

export default function MeldingenScreen() {
  const navigation = useNavigation<any>();
  const notifs = useStore((s) => s.notifs);
  const toggleNotif = useStore((s) => s.toggleNotif);

  const list = notifs ?? [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={s.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 5l-7 7 7 7"
                stroke={E.ink}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={s.title}>Meldingen</Text>
        </View>

        <Text style={s.sub}>Kleine duwtjes op de juiste momenten. Niet meer, niet minder.</Text>

        {/* Lijst */}
        <View style={s.list}>
          {list.map((item) => {
            const on = !!item.on;
            return (
              <View key={item.key} style={s.card}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text style={s.desc}>{item.desc}</Text>
                </View>
                <View style={[s.timePill, { backgroundColor: E.s2 }]}>
                  <Text style={[s.timeText, { color: on ? E.ink : E.faint }]}>{item.time}</Text>
                </View>
                <Switch on={on} onPress={() => toggleNotif(item.key)} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingTop: 6 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: F.display, fontSize: 23, color: E.ink, letterSpacing: -0.4 },

  sub: { fontFamily: F.body, fontSize: 13.5, color: E.dim, lineHeight: 20, marginTop: 12 },

  list: { marginTop: 22, gap: 11 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: E.s1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 17,
  },
  label: { fontFamily: F.bodySemi, fontSize: 15, color: E.ink },
  desc: { fontFamily: F.body, fontSize: 12.5, color: E.dim, marginTop: 3 },

  timePill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeText: { fontFamily: F.monoBold, fontSize: 14 },

  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});
