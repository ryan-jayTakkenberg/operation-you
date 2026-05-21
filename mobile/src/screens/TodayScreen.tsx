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
import { useStore, today, dayNum, getRules, getProgress, dateForDay } from '../store/useStore';
import { claudeCall, buildCoachContext } from '../api/claude';
import { useTheme } from '../hooks/useTheme';
import DotGrid from '../components/DotGrid';
import RuleItem from '../components/RuleItem';
import MoodStrip from '../components/MoodStrip';

const SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'ochtend', label: '🌅 Ochtend' },
  { key: 'dag', label: '☀️ Hele dag' },
  { key: 'fysiek', label: '🥊 Fysiek' },
  { key: 'mentaal', label: '🧠 Mentaal' },
  { key: 'avond', label: '🌙 Avond' },
];

function getPhase(day: number): string {
  if (day <= 25) return 'FUNDAMENT';
  if (day <= 50) return 'BOUW';
  return 'PIEK';
}

export default function TodayScreen() {
  const colors = useTheme();
  const identity = useStore((s) => s.identity);
  const profile = useStore((s) => s.profile);
  const startDate = useStore((s) => s.startDate);
  const checks = useStore((s) => s.checks);
  const fails = useStore((s) => s.fails);
  const mood = useStore((s) => s.mood);
  const dayQuotes = useStore((s) => s.dayQuotes);
  const apiKey = useStore((s) => s.apiKey);
  const toggleCheck = useStore((s) => s.toggleCheck);
  const setMood = useStore((s) => s.setMood);
  const setDayQuote = useStore((s) => s.setDayQuote);
  const addEntry = useStore((s) => s.addEntry);
  const setMilestone = useStore((s) => s.setMilestone);
  const milestones = useStore((s) => s.milestones);

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [closingDay, setClosingDay] = useState(false);

  const todayStr = today();
  const currentDay = dayNum(startDate);
  const rules = getRules(identity);
  const { done, total } = getProgress(identity, checks);
  const progress = total > 0 ? done / total : 0;
  const currentMood = mood[todayStr];
  const quote = dayQuotes[todayStr];
  const dayChecks = checks[todayStr] ?? {};

  useEffect(() => {
    if (!quote && !quoteLoading) {
      fetchQuote();
    }
  }, [todayStr]);

  async function fetchQuote() {
    setQuoteLoading(true);
    const context = buildCoachContext(profile, identity);
    const result = await claudeCall(
      [{
        role: 'user',
        content: `Genereer een krachtige motiverende quote voor dag ${currentDay} van de 75-daagse challenge. Kort, puntig, Nederlands. Max 2 zinnen. Geen aanhalingstekens nodig.`,
      }],
      {
        system: `Je bent een stoïcijnse motivatiecoach. ${context}`,
        maxTokens: 150,
        apiKey,
      }
    );
    if (result) {
      setDayQuote(todayStr, result.trim());
    }
    setQuoteLoading(false);
  }

  async function handleCloseDay() {
    if (closingDay) return;
    setClosingDay(true);

    // Create entry
    addEntry({ date: todayStr });

    // Check milestones
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
      Alert.alert(
        '🎉 MILESTONE!',
        `Dag ${currentDay} voltooid! Je hebt een mijlpaal bereikt.`,
        [{ text: 'VERDER', style: 'default' }]
      );
    }

    // Generate AI feedback async
    const context = buildCoachContext(profile, identity);
    claudeCall(
      [{
        role: 'user',
        content: `Dag ${currentDay} van 75 gesloten. Regels voltooid: ${done}/${total}. Stemming: ${currentMood ?? 'niet opgegeven'}. Geef korte (3-4 zinnen) persoonlijke feedback op deze dag.`,
      }],
      { system: context, maxTokens: 300, apiKey }
    ).then((fb) => {
      if (fb) {
        // Update entry with AI feedback
        useStore.getState().updateEntry(todayStr, { aiFb: fb });
      }
    });

    setClosingDay(false);
    Alert.alert('Dag afgesloten', `${done} van ${total} wetten voltooid.`);
  }

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.dayNum, { color: colors.ac }]}>DAG {currentDay}</Text>
              <Text style={styles.phase}>{getPhase(currentDay)}</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {done}<Text style={styles.progressMuted}>/{total}</Text>
              </Text>
              <Text style={styles.progressLabel}>wetten</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` as any, backgroundColor: colors.ac },
              ]}
            />
          </View>
          <Text style={styles.progressSubText}>{done} van {total} wetten</Text>
        </View>

        {/* Dot Grid */}
        <View style={styles.section}>
          <DotGrid
            startDate={startDate}
            checks={checks}
            fails={fails}
            identity={identity}
            size="small"
          />
        </View>

        {/* Mood strip */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOE VOEL JE JE?</Text>
          <MoodStrip
            value={currentMood}
            onChange={(v) => setMood(todayStr, v)}
          />
        </View>

        {/* Daily Quote */}
        <View style={[styles.section, styles.quoteCard]}>
          <View style={styles.quoteHeader}>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>DAGELIJKSE QUOTE</Text>
            <TouchableOpacity onPress={fetchQuote} disabled={quoteLoading}>
              <Text style={[styles.refreshBtn, { color: colors.ac }]}>
                {quoteLoading ? '...' : '⟳'}
              </Text>
            </TouchableOpacity>
          </View>
          {quoteLoading ? (
            <ActivityIndicator color={colors.ac} size="small" style={{ marginTop: 12 }} />
          ) : quote ? (
            <Text style={styles.quoteText}>{quote}</Text>
          ) : (
            <Text style={styles.quoteMuted}>Quote ophalen...</Text>
          )}
        </View>

        {/* Rules grouped by section */}
        {SECTIONS.map(({ key, label }) => {
          const sectionRules = rules.filter((r) => r.section === key);
          if (!sectionRules.length) return null;
          return (
            <View key={key} style={styles.ruleSection}>
              <Text style={styles.ruleSectionHeader}>{label}</Text>
              {sectionRules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  checked={!!dayChecks[rule.id]}
                  onToggle={() => toggleCheck(todayStr, rule.id)}
                />
              ))}
            </View>
          );
        })}

        {/* Close day button */}
        <TouchableOpacity
          style={[styles.closeBtn, { borderColor: colors.ac }]}
          onPress={handleCloseDay}
          disabled={closingDay}
        >
          {closingDay ? (
            <ActivityIndicator color={colors.ac} />
          ) : (
            <Text style={[styles.closeBtnText, { color: colors.ac }]}>
              DAG AFSLUITEN
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' },
    scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    heroCard: {
      backgroundColor: '#10131a',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    dayNum: {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: 2,
      lineHeight: 44,
    },
    phase: {
      color: '#7a8395',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 3,
      marginTop: 2,
    },
    progressInfo: {
      alignItems: 'flex-end',
    },
    progressText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#f4f7fb',
    },
    progressMuted: {
      color: '#4a5363',
    },
    progressLabel: {
      color: '#7a8395',
      fontSize: 11,
      letterSpacing: 1,
    },
    progressBar: {
      height: 6,
      backgroundColor: '#1a1e28',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressSubText: {
      color: '#4a5363',
      fontSize: 12,
      marginTop: 8,
    },
    section: {
      marginBottom: 12,
    },
    sectionLabel: {
      color: '#7a8395',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 12,
    },
    quoteCard: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.acDim,
    },
    quoteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    refreshBtn: {
      fontSize: 18,
      fontWeight: '700',
    },
    quoteText: {
      color: '#f4f7fb',
      fontSize: 15,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    quoteMuted: {
      color: '#4a5363',
      fontSize: 14,
      fontStyle: 'italic',
    },
    ruleSection: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    ruleSectionHeader: {
      color: '#7a8395',
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    closeBtn: {
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 18,
      alignItems: 'center',
      marginTop: 8,
    },
    closeBtnText: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 3,
    },
  });
}
