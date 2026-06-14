import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Polyline, Polygon, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useStore,
  dayNum,
  dateForDay,
  getRules,
  avgCompliance,
} from '../store/useStore';
import { EVOLVE as E, EV_FONTS as F } from '../constants/theme';

// Sectie-volgorde + Evolve-presentatie (groepering op rule.section).
const SECTION_META: Array<{ key: string; icon: string; label: string }> = [
  { key: 'ochtend', icon: '🌅', label: 'Ochtend' },
  { key: 'fysiek', icon: '🥊', label: 'Fysiek' },
  { key: 'mentaal', icon: '🧠', label: 'Mentaal' },
  { key: 'avond', icon: '🌙', label: 'Avond' },
  { key: 'dag', icon: '⚡', label: 'Hele dag' },
];

// Chart-viewBox-eenheden; rekt mee via preserveAspectRatio="none".
const CHART_W = 100;
const CHART_H = 100;

// Huidige reeks: aaneengesloten complete dagen eindigend op vandaag of gisteren.
function currentStreak(
  rules: { id: string }[],
  checks: Record<string, Record<string, boolean>>,
  startDate: string | null
): number {
  if (!rules.length || !startDate) return 0;
  const total = dayNum(startDate);
  if (total <= 0) return 0;
  const isComplete = (n: number) => {
    const dc = checks[dateForDay(startDate, n)] ?? {};
    return rules.every((r) => dc[r.id]);
  };
  let n = total;
  if (!isComplete(n)) n -= 1; // vandaag mag nog niet af zijn
  let run = 0;
  while (n >= 1 && isComplete(n)) {
    run++;
    n--;
  }
  return run;
}

function clamp(v: number): number {
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Map waarden (0-100) naar SVG-coords. Bij 1 punt: korte horizontale lijn.
function pointsToCoords(values: number[]): { x: number; y: number }[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) {
    const y = CHART_H - (clamp(values[0]) / 100) * CHART_H;
    return [
      { x: 0, y },
      { x: CHART_W, y },
    ];
  }
  return values.map((v, i) => ({
    x: (i / (n - 1)) * CHART_W,
    y: CHART_H - (clamp(v) / 100) * CHART_H,
  }));
}

function toLine(coords: { x: number; y: number }[]): string {
  return coords.map((c) => `${round(c.x)},${round(c.y)}`).join(' ');
}

// Polygon = lijn + terug langs de bodem voor een area-fill.
function toArea(coords: { x: number; y: number }[]): string {
  if (!coords.length) return '';
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${toLine(coords)} ${round(last.x)},${CHART_H} ${round(first.x)},${CHART_H}`;
}

// Herbruikbare area-chart op vaste hoogte. Lege data => rustige lege staat.
function AreaChart({
  values,
  height,
  color,
}: {
  values: number[];
  height: number;
  color: string;
}) {
  const coords = pointsToCoords(values);
  if (!coords.length) {
    return (
      <View style={[s.chartEmpty, { height }]}>
        <Text style={s.chartEmptyText}>Nog geen data</Text>
      </View>
    );
  }
  const last = coords[coords.length - 1];
  const fill = color === E.gold ? 'rgba(200,164,92,0.12)' : 'rgba(143,180,138,0.12)';
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
      <Polygon points={toArea(coords)} fill={fill} stroke="none" />
      <Polyline
        points={toLine(coords)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <Circle cx={last.x} cy={last.y} r={3} fill={color} stroke={E.bg} strokeWidth={1} />
    </Svg>
  );
}

export default function VoortgangScreen() {
  const identity = useStore((sel) => sel.identity);
  const startDate = useStore((sel) => sel.startDate);
  const checks = useStore((sel) => sel.checks);
  const mood = useStore((sel) => sel.mood);

  const rules = getRules(identity);
  const elapsed = startDate ? dayNum(startDate) : 0;

  const streak = currentStreak(rules, checks, startDate);
  const avg = avgCompliance(identity, checks, startDate);

  // Voltooiing per dag (max ~30 punten, laatste dagen).
  const completionSeries: number[] = [];
  if (startDate && rules.length && elapsed > 0) {
    const startN = Math.max(1, elapsed - 29);
    for (let n = startN; n <= elapsed; n++) {
      const dc = checks[dateForDay(startDate, n)] ?? {};
      const done = rules.filter((r) => dc[r.id]).length;
      completionSeries.push((done / rules.length) * 100);
    }
  }
  const lastCompletion = completionSeries.length
    ? completionSeries[completionSeries.length - 1]
    : 0;
  const prevCompletion =
    completionSeries.length > 1 ? completionSeries[completionSeries.length - 2] : lastCompletion;
  const completionDelta = Math.round(lastCompletion - prevCompletion);

  // Per categorie: groepeer op section, gemiddelde naleving over verstreken dagen.
  const presentKeys = Array.from(new Set(rules.map((r) => r.section)));
  const orderedSections = [
    ...SECTION_META.filter((m) => presentKeys.includes(m.key)),
    ...presentKeys
      .filter((k) => !SECTION_META.some((m) => m.key === k))
      .map((k) => ({ key: k, icon: '•', label: k })),
  ];

  const categories = orderedSections.map((meta) => {
    const secRules = rules.filter((r) => r.section === meta.key);
    let pct = 0;
    if (secRules.length && startDate && elapsed > 0) {
      let sum = 0;
      for (let n = 1; n <= elapsed; n++) {
        const dc = checks[dateForDay(startDate, n)] ?? {};
        const done = secRules.filter((r) => dc[r.id]).length;
        sum += done / secRules.length;
      }
      pct = Math.round((sum / elapsed) * 100);
    }
    return { ...meta, pct };
  });

  let strongest: (typeof categories)[number] | null = null;
  let weakest: (typeof categories)[number] | null = null;
  if (categories.length) {
    strongest = categories.reduce((a, b) => (b.pct > a.pct ? b : a));
    weakest = categories.reduce((a, b) => (b.pct < a.pct ? b : a));
  }

  // Stemming-trend: laatste ~14 dagen, mood 0-4 → 0-100%.
  const moodSeries: number[] = [];
  if (startDate && elapsed > 0) {
    const startN = Math.max(1, elapsed - 13);
    for (let n = startN; n <= elapsed; n++) {
      const m = mood[dateForDay(startDate, n)];
      if (m === undefined || m === null) continue;
      moodSeries.push((m / 4) * 100);
    }
  }

  const insightText =
    identity?.shadow ??
    'Je mist vooral taken in de avond. Maak je avondroutine kleiner en realistischer.';

  function barColor(pct: number): string {
    if (pct >= 75) return E.green;
    if (pct < 55) return E.red;
    return E.gold;
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Voortgang</Text>
          <Text style={s.sub}>Je groei over 75 dagen.</Text>
        </View>

        {/* Stat-tegels */}
        <View style={s.tilesRow}>
          <View style={s.tile}>
            <Text style={s.tileEyebrow}>HUIDIGE REEKS</Text>
            <Text style={s.tileNum}>
              {streak}
              <Text style={s.tileUnit}> dgn</Text>
            </Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileEyebrow}>GEM. NALEVING</Text>
            <Text style={[s.tileNum, { color: E.green }]}>
              {avg}
              <Text style={[s.tileUnit, { color: E.green }]}>%</Text>
            </Text>
          </View>
        </View>

        {/* Voltooiing per dag */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Voltooiing per dag</Text>
            <Text style={s.cardMeta}>
              {completionDelta >= 0 ? '+' : ''}
              {completionDelta}% vs gisteren
            </Text>
          </View>
          <View style={s.chartWrap}>
            <AreaChart values={completionSeries} height={100} color={E.gold} />
          </View>
        </View>

        {/* Per categorie */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Per categorie</Text>
          </View>
          {strongest && weakest ? (
            <Text style={s.catSummary}>
              Sterkste:{' '}
              <Text style={{ color: E.green, fontFamily: F.bodySemi }}>{strongest.label}</Text>
              {' · '}Zwakste:{' '}
              <Text style={{ color: E.red, fontFamily: F.bodySemi }}>{weakest.label}</Text>
            </Text>
          ) : (
            <Text style={s.catSummary}>Nog geen categorieën om te tonen.</Text>
          )}
          <View style={s.bars}>
            {categories.map((c) => {
              const col = barColor(c.pct);
              return (
                <View key={c.key} style={s.barRow}>
                  <Text style={s.barLabel} numberOfLines={1}>
                    {c.icon} {c.label}
                  </Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        { width: `${Math.max(0, Math.min(100, c.pct))}%`, backgroundColor: col },
                      ]}
                    />
                  </View>
                  <Text style={[s.barPct, { color: col }]}>{c.pct}%</Text>
                </View>
              );
            })}
            {!categories.length ? (
              <Text style={s.catSummary}>Nog geen wetten ingesteld.</Text>
            ) : null}
          </View>
        </View>

        {/* Stemming-trend */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Stemming-trend</Text>
            <Text style={[s.cardMeta, { color: E.faint }]}>2 weken</Text>
          </View>
          <View style={s.chartWrap}>
            <AreaChart values={moodSeries} height={100} color={E.green} />
          </View>
        </View>

        {/* AI-inzicht */}
        <LinearGradient
          colors={E.warmGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.insightCard}
        >
          <View style={s.insightBadge}>
            <View style={s.insightDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.insightEyebrow}>AI-INZICHT</Text>
            <Text style={s.insightText}>{insightText}</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

  header: { paddingTop: 6 },
  title: { fontFamily: F.display, fontSize: 25, color: E.ink, letterSpacing: -0.4 },
  sub: { fontFamily: F.body, fontSize: 13.5, color: E.dim, marginTop: 4 },

  tilesRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  tile: {
    flex: 1,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    borderRadius: 18,
    padding: 16,
  },
  tileEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint },
  tileNum: { fontFamily: F.display, fontSize: 30, color: E.ink, marginTop: 10 },
  tileUnit: { fontFamily: F.display, fontSize: 15, color: E.dim },

  card: {
    marginTop: 16,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    borderRadius: 20,
    padding: 18,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: { fontFamily: F.displayBold, fontSize: 16, color: E.ink },
  cardMeta: { fontFamily: F.mono, fontSize: 11.5, color: E.green },

  chartWrap: { width: '100%' },
  chartEmpty: { alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontFamily: F.mono, fontSize: 11, color: E.faint, letterSpacing: 1 },

  catSummary: { fontFamily: F.body, fontSize: 13, color: E.dim, marginBottom: 16, lineHeight: 19 },
  bars: { gap: 13 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  barLabel: { width: 96, fontFamily: F.bodyMed, fontSize: 12.5, color: E.ink },
  barTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: E.s2, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999 },
  barPct: { width: 42, textAlign: 'right', fontFamily: F.mono, fontSize: 12 },

  insightCard: {
    flexDirection: 'row',
    gap: 13,
    marginTop: 16,
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: E.warmBorder,
    overflow: 'hidden',
  },
  insightBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(200,164,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: E.gold },
  insightEyebrow: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: E.gold, marginBottom: 5 },
  insightText: { fontFamily: F.body, fontSize: 13.5, lineHeight: 20, color: E.ink },
});
