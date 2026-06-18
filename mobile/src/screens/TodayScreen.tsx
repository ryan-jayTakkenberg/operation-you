import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useStore,
  today,
  dayNum,
  dateForDay,
  getRules,
  getProgress,
  bestStreak,
  avgCompliance,
} from '../store/useStore';
import { claudeCall, buildCoachContext } from '../api/claude';
import { EV_FONTS as F } from '../constants/theme';
import { useEvolve, type EvolveColors } from '../hooks/useEvolve';

// Sectie-volgorde + Evolve-presentatie. Werkt met de AI-gegenereerde section-keys;
// onbekende keys vallen terug op een neutraal label onderaan.
const SECTION_META: Array<{ key: string; icon: string; label: string }> = [
  { key: 'ochtend', icon: '🌅', label: 'Ochtend' },
  { key: 'fysiek', icon: '🥊', label: 'Fysiek' },
  { key: 'mentaal', icon: '🧠', label: 'Mentaal' },
  { key: 'avond', icon: '🌙', label: 'Avond' },
  { key: 'dag', icon: '⚡', label: 'Hele dag' },
];

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R; // 339.29

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

// Huidige reeks: aaneengesloten complete dagen eindigend op vandaag (of gisteren).
function currentStreak(
  rules: { id: string }[],
  checks: Record<string, Record<string, boolean>>,
  startDate: string | null
): number {
  if (!rules.length || !startDate) return 0;
  const total = dayNum(startDate);
  const isComplete = (n: number) => {
    const dc = checks[dateForDay(startDate, n)] ?? {};
    return rules.every((r) => dc[r.id]);
  };
  let n = total;
  // sta toe dat vandaag nog niet af is: begin bij gisteren als vandaag niet compleet
  if (!isComplete(n)) n -= 1;
  let run = 0;
  while (n >= 1 && isComplete(n)) {
    run++;
    n--;
  }
  return run;
}

export default function TodayScreen() {
  const identity = useStore((s) => s.identity);
  const profile = useStore((s) => s.profile);
  const startDate = useStore((s) => s.startDate);
  const checks = useStore((s) => s.checks);
  const dayQuotes = useStore((s) => s.dayQuotes);
  const apiKey = useStore((s) => s.apiKey);
  const mood = useStore((s) => s.mood);
  const milestones = useStore((s) => s.milestones);
  const toggleCheck = useStore((s) => s.toggleCheck);
  const setDayQuote = useStore((s) => s.setDayQuote);
  const addEntry = useStore((s) => s.addEntry);
  const setMilestone = useStore((s) => s.setMilestone);

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [closingDay, setClosingDay] = useState(false);

  const E = useEvolve();
  const s = makeStyles(E);

  const todayStr = today();
  const currentDay = dayNum(startDate);
  const rules = getRules(identity);
  const { done, total } = getProgress(identity, checks);
  const progress = total > 0 ? done / total : 0;
  const pct = Math.round(progress * 100);
  const quote = dayQuotes[todayStr];
  const dayChecks = checks[todayStr] ?? {};

  const streak = currentStreak(rules, checks, startDate);
  const best = bestStreak(identity, checks, startDate);
  const avg = avgCompliance(identity, checks, startDate);
  const currentMood = mood[todayStr];

  useEffect(() => {
    if (!quote && !quoteLoading) fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  async function fetchQuote() {
    setQuoteLoading(true);
    const context = buildCoachContext(profile, identity);
    const result = await claudeCall(
      [{
        role: 'user',
        content: `Schrijf één korte identiteits-zin voor dag ${currentDay} van de 75-daagse challenge, in de vorm "Vandaag leef je als iemand die ...". Nederlands, krachtig, max 1 zin, geen aanhalingstekens.`,
      }],
      { system: `Je bent een directe, stoïcijnse coach. ${context}`, maxTokens: 120, apiKey }
    );
    if (result) setDayQuote(todayStr, result.trim());
    setQuoteLoading(false);
  }

  async function handleCloseDay() {
    if (closingDay) return;
    setClosingDay(true);
    addEntry({ date: todayStr });

    const milestoneChecks = [
      { key: 'day1', condition: currentDay === 1 },
      { key: 'day7', condition: currentDay === 7 },
      { key: 'day14', condition: currentDay === 14 },
      { key: 'day25', condition: currentDay === 25 },
      { key: 'day50', condition: currentDay === 50 },
      { key: 'day75', condition: currentDay === 75 },
    ];
    let milestone = '';
    for (const m of milestoneChecks) {
      if (m.condition && !milestones[m.key]) {
        setMilestone(m.key);
        milestone = m.key;
      }
    }
    if (milestone) {
      Alert.alert('Mijlpaal', `Dag ${currentDay} voltooid. Je hebt een mijlpaal bereikt.`, [
        { text: 'VERDER', style: 'default' },
      ]);
    }

    const context = buildCoachContext(profile, identity);
    claudeCall(
      [{
        role: 'user',
        content: `Dag ${currentDay} van 75 gesloten. Regels voltooid: ${done}/${total}. Stemming: ${currentMood ?? 'niet opgegeven'}. Geef korte (3-4 zinnen) persoonlijke feedback op deze dag.`,
      }],
      { system: context, maxTokens: 300, apiKey }
    ).then((fb) => {
      if (fb) useStore.getState().updateEntry(todayStr, { aiFb: fb });
    });

    setClosingDay(false);
    Alert.alert('Dag afgesloten', `${done} van ${total} wetten voltooid.`);
  }

  // Secties op volgorde, daarna eventuele onbekende keys.
  const presentKeys = Array.from(new Set(rules.map((r) => r.section)));
  const ordered = [
    ...SECTION_META.filter((m) => presentKeys.includes(m.key)),
    ...presentKeys
      .filter((k) => !SECTION_META.some((m) => m.key === k))
      .map((k) => ({ key: k, icon: '•', label: k })),
  ];

  const ringOffset = RING_C * (1 - progress);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>DAG {currentDay} / 75</Text>
            <Text style={s.greeting}>
              {greeting()}{profile?.name ? `, ${profile.name}` : ''}
            </Text>
          </View>
          <View style={s.streakPill}>
            <Text style={s.streakEmoji}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
          </View>
        </View>

        {/* Ring + progress */}
        <View style={s.ringCard}>
          <View style={s.ringWrap}>
            <Svg width={128} height={128} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={64} cy={64} r={RING_R} stroke={E.ringTrack} strokeWidth={11} fill="none" />
              <Circle
                cx={64}
                cy={64}
                r={RING_R}
                stroke={E.gold}
                strokeWidth={11}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={ringOffset}
              />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.ringPct}>
                {pct}<Text style={s.ringPctUnit}>%</Text>
              </Text>
              <Text style={s.ringLabel}>VOLTOOID</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.ringDesc}>
              Je hebt <Text style={s.ringDescStrong}>{done} van {total}</Text> wetten nageleefd vandaag.
            </Text>
            <View style={s.miniStats}>
              <View style={s.miniRow}>
                <Text style={s.miniLabel}>Beste reeks</Text>
                <Text style={s.miniVal}>{best} dgn</Text>
              </View>
              <View style={s.miniRow}>
                <Text style={s.miniLabel}>Gem. naleving</Text>
                <Text style={[s.miniVal, { color: E.green }]}>{avg}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Identiteit van vandaag */}
        <LinearGradient colors={E.warmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.identityCard}>
          <Text style={s.identityEyebrow}>IDENTITEIT VAN VANDAAG</Text>
          {quoteLoading && !quote ? (
            <ActivityIndicator color={E.gold} size="small" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          ) : (
            <Text style={s.identityText}>
              {quote || 'Vandaag leef je als iemand die discipline kiest boven comfort.'}
            </Text>
          )}
          <Text style={s.identityQuoteMark}>"</Text>
        </LinearGradient>

        {/* Secties */}
        {ordered.map(({ key, icon, label }) => {
          const sectionRules = rules.filter((r) => r.section === key);
          if (!sectionRules.length) return null;
          const secDone = sectionRules.filter((r) => dayChecks[r.id]).length;
          return (
            <View key={key} style={s.section}>
              <View style={s.sectionHead}>
                <View style={s.sectionHeadLeft}>
                  <Text style={s.sectionIcon}>{icon}</Text>
                  <Text style={s.sectionTitle}>{label}</Text>
                </View>
                <Text style={s.sectionCount}>{secDone}/{sectionRules.length}</Text>
              </View>
              <View style={s.sectionCard}>
                {sectionRules.map((rule, i) => {
                  const checked = !!dayChecks[rule.id];
                  return (
                    <TouchableOpacity
                      key={rule.id}
                      activeOpacity={0.7}
                      style={[s.task, i > 0 && s.taskBorder]}
                      onPress={() => toggleCheck(todayStr, rule.id)}
                    >
                      <View style={[s.checkbox, checked ? s.checkboxOn : s.checkboxOff]}>
                        {checked && <Text style={s.checkmark}>✓</Text>}
                      </View>
                      <Text style={[s.taskText, checked && s.taskTextDone]}>{rule.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* AI-inzicht */}
        {identity?.shadow ? (
          <View style={s.insightCard}>
            <View style={s.insightBadge}>
              <View style={s.insightDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.insightEyebrow}>AI-INZICHT</Text>
              <Text style={s.insightText}>{identity.shadow}</Text>
            </View>
          </View>
        ) : null}

        {/* Dag afsluiten */}
        <TouchableOpacity style={s.closeBtn} onPress={handleCloseDay} disabled={closingDay} activeOpacity={0.85}>
          {closingDay ? (
            <ActivityIndicator color={E.goldText} />
          ) : (
            <Text style={s.closeBtnText}>Dag afsluiten</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(E: EvolveColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 6 },
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: E.gold },
  greeting: { fontFamily: F.display, fontSize: 25, color: E.ink, marginTop: 3, letterSpacing: -0.4 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 13,
    borderRadius: 999, backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, marginLeft: 12,
  },
  streakEmoji: { fontSize: 14 },
  streakNum: { fontFamily: F.monoBold, fontSize: 14, color: E.ink },

  ringCard: {
    flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 22, padding: 20,
    backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, borderRadius: 24,
  },
  ringWrap: { width: 128, height: 128 },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontFamily: F.display, fontSize: 33, color: E.ink, lineHeight: 36 },
  ringPctUnit: { fontFamily: F.display, fontSize: 16, color: E.dim },
  ringLabel: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: E.faint, marginTop: 4 },
  ringDesc: { fontFamily: F.body, fontSize: 14, color: E.dim, lineHeight: 21 },
  ringDescStrong: { fontFamily: F.bodySemi, color: E.ink },
  miniStats: { marginTop: 14, gap: 9 },
  miniRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniLabel: { fontFamily: F.body, fontSize: 12.5, color: E.dim },
  miniVal: { fontFamily: F.mono, fontSize: 12.5, color: E.ink },

  identityCard: {
    marginTop: 16, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: E.warmBorder, overflow: 'hidden',
  },
  identityEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: E.gold, marginBottom: 9 },
  identityText: { fontFamily: F.displayMed, fontSize: 20, lineHeight: 26, color: E.ink, letterSpacing: -0.3 },
  identityQuoteMark: {
    position: 'absolute', right: -8, top: -34, fontSize: 120, lineHeight: 120,
    color: 'rgba(200,164,92,0.07)', fontFamily: F.displayBold,
  },

  section: { marginTop: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, paddingHorizontal: 4 },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { fontSize: 15 },
  sectionTitle: { fontFamily: F.displayBold, fontSize: 16, color: E.ink },
  sectionCount: { fontFamily: F.mono, fontSize: 12, color: E.faint },
  sectionCard: { backgroundColor: E.s1, borderWidth: 1, borderColor: E.line, borderRadius: 20, overflow: 'hidden' },

  task: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 17 },
  taskBorder: { borderTopWidth: 1, borderTopColor: E.line2 },
  checkbox: { width: 23, height: 23, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkboxOff: { borderWidth: 1.5, borderColor: E.line },
  checkboxOn: { backgroundColor: E.gold },
  checkmark: { position: 'absolute', color: E.goldText, fontSize: 13, fontWeight: '900', lineHeight: 15 },
  taskText: { flex: 1, fontFamily: F.body, fontSize: 14.5, color: E.ink },
  taskTextDone: { color: E.faint, textDecorationLine: 'line-through' },

  insightCard: {
    flexDirection: 'row', gap: 13, marginTop: 20, padding: 17,
    backgroundColor: E.s0, borderWidth: 1, borderColor: E.line, borderRadius: 20,
  },
  insightBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(200,164,92,0.14)', alignItems: 'center', justifyContent: 'center' },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: E.gold },
  insightEyebrow: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: E.gold, marginBottom: 5 },
  insightText: { fontFamily: F.body, fontSize: 13.5, lineHeight: 20, color: E.dim },

  closeBtn: {
    marginTop: 22, height: 56, borderRadius: 17, backgroundColor: E.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
  });
}
