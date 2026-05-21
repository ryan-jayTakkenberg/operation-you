import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore, today, dayNum, dateForDay, getRules } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import DotGrid from '../components/DotGrid';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

function getGrade(done: number, total: number): string {
  if (total === 0) return '-';
  const pct = done / total;
  if (pct >= 0.97) return 'A+';
  if (pct >= 0.90) return 'A';
  if (pct >= 0.80) return 'B';
  if (pct >= 0.70) return 'C';
  if (pct >= 0.60) return 'D';
  return 'F';
}

export default function MeScreen() {
  const colors = useTheme();
  const navigation = useNavigation<NavProp>();
  const identity = useStore((s) => s.identity);
  const profile = useStore((s) => s.profile);
  const startDate = useStore((s) => s.startDate);
  const checks = useStore((s) => s.checks);
  const fails = useStore((s) => s.fails);

  const currentDay = dayNum(startDate);
  const rules = getRules(identity);
  const total = rules.length;
  const todayStr = today();

  const stats = useMemo(() => {
    let streak = 0;
    let doneDays = 0;
    let bestGrade = 'F';
    let bestPct = 0;

    for (let i = currentDay - 1; i >= 0; i--) {
      const date = dateForDay(startDate, i + 1);
      const dayChecks = checks[date] ?? {};
      const done = rules.filter((r) => dayChecks[r.id]).length;
      const pct = total > 0 ? done / total : 0;

      if (pct >= 1) doneDays++;
      if (pct > bestPct) {
        bestPct = pct;
        bestGrade = getGrade(done, total);
      }

      // Streak: consecutive complete days from today backwards
      if (i === currentDay - 1) {
        if (pct >= 1) streak = 1;
        else streak = 0;
      } else if (streak > 0) {
        if (pct >= 1) streak++;
        else break;
      }
    }

    return { streak, doneDays, bestGrade };
  }, [currentDay, checks, rules, total, startDate]);

  const progressPct = Math.min((currentDay - 1) / 74, 1);

  const styles = makeStyles(colors);

  const menuItems = [
    { icon: '⚙', label: 'Instellingen', onPress: () => navigation.navigate('Settings') },
    { icon: '📜', label: 'Manifest & Regels', onPress: () => navigation.navigate('Settings') },
    { icon: '💪', label: 'Whoop data', onPress: () => navigation.navigate('Settings') },
    { icon: '🪞', label: 'Spiegel', onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <Text style={[styles.identityName, { color: colors.ac }]}>
                {identity?.name ?? 'OPERATION YOU'}
              </Text>
              <Text style={styles.identitySub}>
                Dag {currentDay} van 75
              </Text>
              {profile?.name && (
                <Text style={styles.profileName}>{profile.name}</Text>
              )}
            </View>
            {/* Progress ring (View-based circle) */}
            <View style={styles.ringContainer}>
              <View style={[styles.ringOuter, { borderColor: colors.acDim }]}>
                <View style={[styles.ringInner, { borderColor: colors.ac, borderTopColor: 'transparent' }]}>
                  <Text style={[styles.ringPct, { color: colors.ac }]}>
                    {Math.round(progressPct * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct * 100}%` as any, backgroundColor: colors.ac },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{currentDay - 1} / 74 dagen</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={[styles.statValue, { color: colors.ac }]}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={[styles.statValue, { color: colors.green }]}>{stats.doneDays}</Text>
            <Text style={styles.statLabel}>Compleet</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{stats.bestGrade}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
        </View>

        {/* 75-day mini grid */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionLabel}>75 DAGEN</Text>
          <DotGrid
            startDate={startDate}
            checks={checks}
            fails={fails}
            identity={identity}
            size="small"
          />
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' },
    scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    profileCard: {
      backgroundColor: '#10131a',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    profileTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    profileInfo: {
      flex: 1,
    },
    identityName: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 2,
    },
    identitySub: {
      color: '#7a8395',
      fontSize: 13,
      marginTop: 4,
    },
    profileName: {
      color: '#4a5363',
      fontSize: 12,
      marginTop: 2,
    },
    ringContainer: {
      marginLeft: 16,
    },
    ringOuter: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringInner: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringPct: {
      fontSize: 12,
      fontWeight: '700',
    },
    progressBar: {
      height: 4,
      backgroundColor: '#1a1e28',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      color: '#4a5363',
      fontSize: 11,
      marginTop: 6,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
    },
    statValue: {
      fontSize: 26,
      fontWeight: '800',
    },
    statLabel: {
      color: '#7a8395',
      fontSize: 11,
      marginTop: 4,
    },
    gridSection: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    sectionLabel: {
      color: '#7a8395',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 12,
    },
    menu: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      gap: 14,
    },
    menuIcon: {
      fontSize: 18,
      width: 24,
      textAlign: 'center',
    },
    menuLabel: {
      flex: 1,
      color: '#f4f7fb',
      fontSize: 15,
    },
    menuChevron: {
      color: '#4a5363',
      fontSize: 20,
    },
    green: { color: '#5ee3a5' },
    gold: { color: '#ffe14d' },
  });
}
