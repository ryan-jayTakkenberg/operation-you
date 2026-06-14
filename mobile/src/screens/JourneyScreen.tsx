import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useStore, dateForDay, today, getRules } from '../store/useStore';
import type { Identity } from '../store/useStore';
import { claudeCall, buildCoachContext } from '../api/claude';
import { useTheme } from '../hooks/useTheme';
import RuleItem from '../components/RuleItem';

function getDayColor(
  dayIndex: number,
  startDate: string | null,
  checks: Record<string, Record<string, boolean>>,
  fails: Array<{ date: string }>,
  identity: Identity | null,
  accentColor: string
): string {
  const todayStr = today();
  const date = dateForDay(startDate, dayIndex + 1);
  const isFuture = date > todayStr;
  const isToday = date === todayStr;

  if (isFuture) return '#1a1e28';
  if (isToday) return accentColor;

  const isFail = fails.some((f) => f.date === date);
  if (isFail) return '#ff7a85';

  const rules = identity?.rules ?? [];
  const total = rules.length;
  const dayChecks = checks[date] ?? {};
  const done = Object.values(dayChecks).filter(Boolean).length;

  if (total === 0) return '#1a1e28';
  if (done === 0) return '#ff7a85';
  if (done < total) return '#fb923c';
  return '#5ee3a5';
}

export default function JourneyScreen() {
  const colors = useTheme();
  const identity = useStore((s) => s.identity);
  const startDate = useStore((s) => s.startDate);
  const checks = useStore((s) => s.checks);
  const fails = useStore((s) => s.fails);
  const entries = useStore((s) => s.entries);
  const whoop = useStore((s) => s.whoop);
  const profile = useStore((s) => s.profile);
  const apiKey = useStore((s) => s.apiKey);
  const updateEntry = useStore((s) => s.updateEntry);
  const toggleCheck = useStore((s) => s.toggleCheck);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const todayStr = today();
  const rules = getRules(identity);

  const styles = makeStyles(colors);

  function openDay(index: number) {
    setSelectedDay(index);
  }

  function closeDay() {
    setSelectedDay(null);
  }

  const selectedDate = selectedDay !== null ? dateForDay(startDate, selectedDay + 1) : null;
  const selectedEntry = entries.find((e) => e.date === selectedDate);
  const selectedWhoop = selectedDate ? whoop[selectedDate] : null;
  const selectedDayChecks = selectedDate ? checks[selectedDate] ?? {} : {};
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate ? selectedDate < todayStr : false;

  async function handlePickPhoto() {
    if (!selectedDate) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      updateEntry(selectedDate, { photo: result.assets[0].uri });
    }
  }

  async function handleGetFeedback() {
    if (!selectedDate || loadingFeedback) return;
    setLoadingFeedback(true);
    const context = buildCoachContext(profile, identity);
    const dayNum = selectedDay !== null ? selectedDay + 1 : '?';
    const done = Object.values(selectedDayChecks).filter(Boolean).length;
    const result = await claudeCall(
      [{
        role: 'user',
        content: `Geef feedback op dag ${dayNum}. Regels voltooid: ${done}/${rules.length}. Datum: ${selectedDate}.`,
      }],
      { system: context, maxTokens: 300, apiKey }
    );
    if (result) {
      updateEntry(selectedDate, { aiFb: result });
    }
    setLoadingFeedback(false);
  }

  function handleExport() {
    if (!selectedDate || selectedDay === null) return;
    const dayNum = selectedDay + 1;
    const done = Object.values(selectedDayChecks).filter(Boolean).length;
    const lines = [
      `=== DAG ${dayNum} — ${selectedDate} ===`,
      `Regels: ${done}/${rules.length}`,
      '',
      'Wetten:',
      ...rules.map((r) => `[${selectedDayChecks[r.id] ? 'x' : ' '}] ${r.text}`),
    ];
    if (selectedEntry?.note) lines.push('', `Notitie: ${selectedEntry.note}`);
    if (selectedEntry?.aiFb) lines.push('', `AI Feedback: ${selectedEntry.aiFb}`);
    if (selectedWhoop) {
      lines.push('', 'WHOOP:', `  Herstel: ${selectedWhoop.rec ?? '-'}%`);
    }
    Alert.alert(`Dag ${dayNum}`, lines.join('\n'), [{ text: 'OK' }]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>REIS</Text>
        <Text style={styles.subtitle}>75-daagse reis</Text>

        {/* 75-day grid */}
        <View style={styles.grid}>
          {Array.from({ length: 75 }, (_, i) => {
            const bgColor = getDayColor(i, startDate, checks, fails, identity, colors.ac);
            const dateStr = dateForDay(startDate, i + 1);
            const isToday = dateStr === todayStr;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cell,
                  { backgroundColor: bgColor },
                  isToday && { borderWidth: 2, borderColor: '#f4f7fb' },
                ]}
                onPress={() => openDay(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.cellNum}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: '#5ee3a5', label: 'Compleet' },
            { color: '#fb923c', label: 'Deels' },
            { color: '#ff7a85', label: 'Gemist' },
            { color: colors.ac, label: 'Vandaag' },
            { color: '#1a1e28', label: 'Toekomst' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        visible={selectedDay !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDay}
      >
        <SafeAreaView style={styles.modal}>
          <StatusBar style="light" />
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalDayNum, { color: colors.ac }]}>
                  DAG {selectedDay !== null ? selectedDay + 1 : ''}
                </Text>
                <Text style={styles.modalDate}>{selectedDate}</Text>
              </View>
              <TouchableOpacity onPress={closeDay} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Photo */}
            {selectedEntry?.photo ? (
              <Image
                source={{ uri: selectedEntry.photo }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : null}
            {(isToday || isPast) && (
              <TouchableOpacity
                style={[styles.addPhotoBtn, { borderColor: colors.acDim }]}
                onPress={handlePickPhoto}
              >
                <Text style={[styles.addPhotoText, { color: colors.muted }]}>
                  {selectedEntry?.photo ? '📷 Foto wijzigen' : '📷 Foto toevoegen'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Entry note */}
            {selectedEntry?.note ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>NOTITIE</Text>
                <Text style={styles.cardText}>{selectedEntry.note}</Text>
              </View>
            ) : null}

            {/* Dream */}
            {selectedEntry?.dream ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>DROOM</Text>
                <Text style={styles.cardText}>{selectedEntry.dream}</Text>
              </View>
            ) : null}

            {/* Rules */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>WETTEN</Text>
              {rules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  checked={!!selectedDayChecks[rule.id]}
                  onToggle={() => {
                    if (selectedDate && isToday) {
                      toggleCheck(selectedDate, rule.id);
                    }
                  }}
                  disabled={!isToday}
                />
              ))}
            </View>

            {/* Whoop data */}
            {selectedWhoop ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>WHOOP DATA</Text>
                <View style={styles.whoopRow}>
                  {selectedWhoop.rec !== undefined && (
                    <View style={styles.whoopItem}>
                      <Text style={[styles.whoopVal, { color: colors.ac }]}>{selectedWhoop.rec}%</Text>
                      <Text style={styles.whoopLbl}>Herstel</Text>
                    </View>
                  )}
                  {selectedWhoop.hrv !== undefined && (
                    <View style={styles.whoopItem}>
                      <Text style={[styles.whoopVal, { color: colors.green }]}>{selectedWhoop.hrv}</Text>
                      <Text style={styles.whoopLbl}>HRV</Text>
                    </View>
                  )}
                  {selectedWhoop.slp !== undefined && (
                    <View style={styles.whoopItem}>
                      <Text style={[styles.whoopVal, { color: colors.blue }]}>{selectedWhoop.slp}h</Text>
                      <Text style={styles.whoopLbl}>Slaap</Text>
                    </View>
                  )}
                  {selectedWhoop.str !== undefined && (
                    <View style={styles.whoopItem}>
                      <Text style={[styles.whoopVal, { color: colors.orange }]}>{selectedWhoop.str}</Text>
                      <Text style={styles.whoopLbl}>Belasting</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* AI Feedback */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>AI FEEDBACK</Text>
              {selectedEntry?.aiFb ? (
                <Text style={styles.cardText}>{selectedEntry.aiFb}</Text>
              ) : (
                <TouchableOpacity
                  onPress={handleGetFeedback}
                  disabled={loadingFeedback}
                  style={[styles.feedbackBtn, { borderColor: colors.acDim }]}
                >
                  {loadingFeedback ? (
                    <ActivityIndicator color={colors.ac} size="small" />
                  ) : (
                    <Text style={[styles.feedbackBtnText, { color: colors.ac }]}>
                      Ophalen...
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Export */}
            <TouchableOpacity
              style={[styles.exportBtn, { borderColor: 'rgba(255,255,255,0.14)' }]}
              onPress={handleExport}
            >
              <Text style={styles.exportBtnText}>Exporteer dag</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' },
    scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    header: {
      fontSize: 24,
      fontWeight: '900',
      color: '#f4f7fb',
      letterSpacing: 4,
      marginBottom: 4,
    },
    subtitle: {
      color: '#4a5363',
      fontSize: 12,
      marginBottom: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    cell: {
      width: '17%',
      aspectRatio: 1.2,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellNum: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 11,
      fontWeight: '600',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      color: '#7a8395',
      fontSize: 11,
    },
    // Modal
    modal: {
      flex: 1,
      backgroundColor: '#08090c',
    },
    modalScroll: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    modalDayNum: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
    },
    modalDate: {
      color: '#7a8395',
      fontSize: 13,
      marginTop: 2,
    },
    closeBtn: {
      padding: 8,
    },
    closeBtnText: {
      color: '#7a8395',
      fontSize: 18,
    },
    photo: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
    },
    addPhotoBtn: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 14,
      alignItems: 'center',
      marginBottom: 12,
    },
    addPhotoText: {
      fontSize: 14,
    },
    card: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    cardLabel: {
      color: colors.ac,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 12,
    },
    cardText: {
      color: '#f4f7fb',
      fontSize: 14,
      lineHeight: 22,
    },
    whoopRow: {
      flexDirection: 'row',
      gap: 12,
    },
    whoopItem: {
      alignItems: 'center',
      flex: 1,
    },
    whoopVal: {
      fontSize: 20,
      fontWeight: '700',
    },
    whoopLbl: {
      color: '#7a8395',
      fontSize: 10,
      marginTop: 2,
    },
    feedbackBtn: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
    },
    feedbackBtnText: {
      fontSize: 14,
      fontWeight: '600',
    },
    exportBtn: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 14,
      alignItems: 'center',
    },
    exportBtnText: {
      color: '#7a8395',
      fontSize: 14,
    },
    muted: {
      color: '#7a8395',
    },
    green: {
      color: '#5ee3a5',
    },
    blue: {
      color: '#60a5fa',
    },
    orange: {
      color: '#fb923c',
    },
  });
}
