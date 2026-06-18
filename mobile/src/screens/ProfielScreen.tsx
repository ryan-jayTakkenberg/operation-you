import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useStore, dayNum, bestStreak } from '../store/useStore';
import { EVOLVE_THEMES, EV_FONTS as F } from '../constants/theme';
import { useEvolve, type EvolveColors } from '../hooks/useEvolve';
import DotGrid from '../components/DotGrid';

// Fase-label op basis van challenge-dag (1-75).
function phaseFor(day: number): { n: number; text: string } {
  if (day >= 51) return { n: 3, text: 'Pieken' };
  if (day >= 26) return { n: 2, text: 'Bouwen' };
  return { n: 1, text: 'Fundering leggen' };
}

// Eerste zin uit vrije tekst trekken (op '. ' of regeleinde).
function firstSentence(text: string | undefined | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.split(/(?<=\.)\s|\n/)[0];
  return (match || trimmed).trim();
}

// Doel-string splitsen in losse bullets (zinnen of regels), max 4.
function toBullets(goal: string | undefined | null): string[] {
  if (!goal) return [];
  return goal
    .split(/\.\s+|\n+/)
    .map((p) => p.replace(/\.$/, '').trim())
    .filter((p) => p.length > 0)
    .slice(0, 4);
}

// Bel-icoon (outline) — stroke volgt E.ink.
function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={4} r={0} fill={color} />
    </Svg>
  );
}

export default function ProfielScreen() {
  const navigation = useNavigation<any>();
  const E = useEvolve();
  const s = makeStyles(E);

  const profile = useStore((st) => st.profile);
  const identity = useStore((st) => st.identity);
  const startDate = useStore((st) => st.startDate);
  const checks = useStore((st) => st.checks);
  const fails = useStore((st) => st.fails);
  const accent = useStore((st) => st.accent);
  const setAccent = useStore((st) => st.setAccent);

  const day = startDate ? dayNum(startDate) : 1;
  const phase = phaseFor(day);
  const pct = Math.round((day / 75) * 100);
  const streak = bestStreak(identity, checks, startDate);

  const name = profile?.name || 'Operator';
  const initial = name.trim().charAt(0).toUpperCase() || 'O';

  const ruleCount = identity?.rules?.length ?? 0;

  // "Wie ik word"
  const becoming =
    identity?.why ||
    firstSentence(identity?.manifesto) ||
    profile?.goal ||
    'Je verhaal komt hier zodra je je profiel hebt ingevuld.';

  // Doelen
  const bullets = toBullets(profile?.goal);

  // Mijn waarom
  const why =
    identity?.why ||
    firstSentence(profile?.story) ||
    'Vul je profiel aan om je waarom vast te leggen.';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar-rij — profielkop */}
        <View style={s.avatarRow}>
          <LinearGradient
            colors={['#2A241B', '#15120D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.avatarTile}
          >
            <Text style={s.avatarLetter}>{initial}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            <Text style={s.phaseLabel}>
              Fase {phase.n} — {phase.text}
            </Text>
          </View>
        </View>

        {/* Wie ik word */}
        <LinearGradient
          colors={E.warmGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.becomingCard}
        >
          <Text style={s.becomingEyebrow}>WIE IK WORD</Text>
          <Text style={s.becomingText}>{becoming}</Text>
        </LinearGradient>

        {/* Mijn doelen */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>MIJN DOELEN</Text>
          {bullets.length > 0 ? (
            <View style={s.bulletList}>
              {bullets.map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={s.bulletDot} />
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.fallbackText}>
              Vul je profiel aan om je doelen te zien.
            </Text>
          )}
        </View>

        {/* Twee tegels */}
        <View style={s.tileRow}>
          <View style={[s.card, s.tile]}>
            <Text style={s.tileEyebrow}>MIJN WETTEN</Text>
            <Text style={s.tileNum}>{ruleCount}</Text>
            <Text style={s.tileSub}>actieve wetten</Text>
          </View>
          <View style={[s.card, s.tile]}>
            <Text style={s.tileEyebrow}>FASE</Text>
            <Text style={s.tileNum}>{pct}%</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` }]} />
            </View>
          </View>
        </View>

        {/* Voortgang — 75-dagen dots-grid */}
        <View style={s.card}>
          <View style={s.gridHead}>
            <Text style={s.cardEyebrow}>VOORTGANG</Text>
            <Text style={s.gridDay}>DAG {day} / 75</Text>
          </View>
          <DotGrid
            startDate={startDate}
            checks={checks}
            fails={fails}
            identity={identity}
            size="large"
          />
          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: E.gold }]} />
              <Text style={s.legendText}>Vandaag</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: E.green }]} />
              <Text style={s.legendText}>Voltooid</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: E.red }]} />
              <Text style={s.legendText}>Gemist</Text>
            </View>
            <Text style={s.streakText}>{streak} dagen streak</Text>
          </View>
        </View>

        {/* Mijn waarom */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>MIJN WAAROM</Text>
          <Text style={s.whyText}>{why}</Text>
        </View>

        {/* Thema */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>THEMA</Text>
          <View style={s.themeGrid}>
            {EVOLVE_THEMES.map((t) => {
              const active = t.id === accent;
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => setAccent(t.id)}
                  style={[
                    s.themeTile,
                    active && { borderColor: t.gold, backgroundColor: E.s2 },
                  ]}
                >
                  <View style={[s.themeDot, { backgroundColor: t.gold }]} />
                  <Text style={[s.themeName, active && { color: E.ink }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA's */}
        <View style={s.ctaCol}>
          <TouchableOpacity
            style={s.ctaPrimary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={s.ctaPrimaryText}>Challenge aanpassen met AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.ctaOutline}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Meldingen')}
          >
            <BellIcon color={E.ink} />
            <Text style={s.ctaOutlineText}>Meldingen beheren</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(E: EvolveColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: E.bg },
    scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

    // Avatar / profielkop
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6 },
    avatarTile: {
      width: 62,
      height: 62,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: E.warmBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: { fontFamily: F.display, fontSize: 24, color: E.gold2 },
    name: { fontFamily: F.display, fontSize: 23, color: E.ink, letterSpacing: -0.4 },
    phaseLabel: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: E.gold, marginTop: 3 },

    // Wie ik word
    becomingCard: {
      marginTop: 22,
      padding: 20,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: E.warmBorder,
      overflow: 'hidden',
    },
    becomingEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: E.gold, marginBottom: 9 },
    becomingText: { fontFamily: F.displayMed, fontSize: 17, lineHeight: 24, color: E.ink, letterSpacing: -0.2 },

    // Generieke kaart
    card: {
      marginTop: 16,
      padding: 20,
      backgroundColor: E.s1,
      borderWidth: 1,
      borderColor: E.line,
      borderRadius: 20,
    },
    cardEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: E.faint, marginBottom: 13 },

    // Doelen
    bulletList: { gap: 12 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    bulletDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: E.gold, marginTop: 7 },
    bulletText: { flex: 1, fontFamily: F.body, fontSize: 14.5, lineHeight: 21, color: E.ink },
    fallbackText: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: E.dim },

    // Tegels
    tileRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    tile: { flex: 1, marginTop: 0 },
    tileEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: E.faint, marginBottom: 10 },
    tileNum: { fontFamily: F.display, fontSize: 28, color: E.ink, letterSpacing: -0.5 },
    tileSub: { fontFamily: F.body, fontSize: 12.5, color: E.dim, marginTop: 4 },
    progressTrack: {
      height: 5,
      borderRadius: 999,
      backgroundColor: E.ringTrack,
      marginTop: 11,
      overflow: 'hidden',
    },
    progressFill: { height: 5, borderRadius: 999, backgroundColor: E.gold },

    // Voortgang-grid
    gridHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    gridDay: {
      fontFamily: F.monoBold,
      fontSize: 11,
      letterSpacing: 1,
      color: E.gold,
      marginBottom: 0,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 16,
      flexWrap: 'wrap',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: F.body, fontSize: 11.5, color: E.dim },
    streakText: { fontFamily: F.monoBold, fontSize: 11, color: E.faint, marginLeft: 'auto', letterSpacing: 0.5 },

    // Waarom
    whyText: { fontFamily: F.body, fontSize: 14.5, lineHeight: 22, color: E.dim, fontStyle: 'italic' },

    // Thema-picker
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    themeTile: {
      width: '31%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: E.line,
      backgroundColor: E.s0,
    },
    themeDot: { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
    themeName: { fontFamily: F.mono, fontSize: 11, color: E.dim, letterSpacing: 0.3 },

    // CTA
    ctaCol: { marginTop: 22, gap: 11 },
    ctaPrimary: {
      height: 54,
      borderRadius: 16,
      backgroundColor: E.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaPrimaryText: { fontFamily: F.display, fontSize: 15.5, color: E.goldText },
    ctaOutline: {
      height: 52,
      borderRadius: 16,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: E.line,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    ctaOutlineText: { fontFamily: F.display, fontSize: 15, color: E.ink },
  });
}
