import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore, today, dayNum } from '../store/useStore';
import { EVOLVE as E, EV_FONTS as F } from '../constants/theme';

const WEEKDAYS = [
  'ZONDAG',
  'MAANDAG',
  'DINSDAG',
  'WOENSDAG',
  'DONDERDAG',
  'VRIJDAG',
  'ZATERDAG',
];

const MONTHS = [
  'JANUARI',
  'FEBRUARI',
  'MAART',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AUGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DECEMBER',
];

const MOOD_EMOJIS = ['😞', '😕', '🙂', '😊', '🔥'];

// 1-10 segment-selector (geen externe slider).
function ScoreSelector({
  value,
  accent,
  onChange,
}: {
  value: number;
  accent: string;
  onChange: (n: number) => void;
}) {
  return (
    <View style={s.segRow}>
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <TouchableOpacity
            key={n}
            activeOpacity={0.7}
            style={[s.seg, { backgroundColor: filled ? accent : E.s2 }]}
            onPress={() => onChange(n)}
          />
        );
      })}
    </View>
  );
}

export default function JournalScreen() {
  const startDate = useStore((s) => s.startDate);
  const mood = useStore((s) => s.mood);
  const entries = useStore((s) => s.entries);
  const setMood = useStore((s) => s.setMood);
  const updateEntry = useStore((s) => s.updateEntry);

  const todayStr = today();
  const entry = entries.find((e) => e.date === todayStr);

  const currentDay = startDate ? dayNum(startDate) : 1;
  const now = new Date();
  const dateLine = `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${
    MONTHS[now.getMonth()]
  } · DAG ${currentDay}`;

  const currentMood = mood[todayStr];
  const disc = entry?.disc ?? 5;
  const energy = entry?.energy ?? 5;
  const lived = entry?.lived;

  const [note, setNote] = useState(entry?.note ?? '');
  const [proud, setProud] = useState(entry?.proud ?? '');
  const [better, setBetter] = useState(entry?.better ?? '');

  function handleSave() {
    updateEntry(todayStr, { note, proud, better });
    Alert.alert('Opgeslagen', 'Je journal van vandaag is bewaard.');
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.eyebrow}>{dateLine}</Text>
            <Text style={s.title}>Dagboek</Text>
          </View>

          {/* Mood */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Hoe voel je je?</Text>
            <View style={s.moodRow}>
              {MOOD_EMOJIS.map((emoji, i) => {
                const selected = currentMood === i;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.75}
                    style={[s.moodTile, selected ? s.moodTileOn : s.moodTileOff]}
                    onPress={() => setMood(todayStr, i)}
                  >
                    <Text style={s.moodEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scores */}
          <View style={s.card}>
            <View style={s.scoreBlock}>
              <View style={s.scoreHead}>
                <Text style={s.scoreLabel}>Discipline</Text>
                <Text style={[s.scoreVal, { color: E.gold }]}>{disc}/10</Text>
              </View>
              <ScoreSelector
                value={disc}
                accent={E.gold}
                onChange={(n) => updateEntry(todayStr, { disc: n })}
              />
            </View>

            <View style={[s.scoreBlock, { marginTop: 18 }]}>
              <View style={s.scoreHead}>
                <Text style={s.scoreLabel}>Energie</Text>
                <Text style={[s.scoreVal, { color: E.green }]}>{energy}/10</Text>
              </View>
              <ScoreSelector
                value={energy}
                accent={E.green}
                onChange={(n) => updateEntry(todayStr, { energy: n })}
              />
            </View>
          </View>

          {/* Lived by laws */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Heb je volgens je wetten geleefd?</Text>
            <View style={s.livedRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[s.livedBtn, lived === true && s.livedYesOn]}
                onPress={() => updateEntry(todayStr, { lived: true })}
              >
                <Text
                  style={[s.livedText, lived === true && { color: E.goldText }]}
                >
                  Ja
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[s.livedBtn, lived === false && s.livedNoOn]}
                onPress={() => updateEntry(todayStr, { lived: false })}
              >
                <Text
                  style={[s.livedText, lived === false && { color: E.red }]}
                >
                  Nog niet helemaal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Free-text fields */}
          <View style={s.textCard}>
            <Text style={s.textLabel}>Hoe ging vandaag?</Text>
            <TextInput
              style={s.textInput}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Schrijf vrijuit over je dag..."
              placeholderTextColor={E.faint}
            />
          </View>

          <View style={s.textCard}>
            <Text style={s.textLabel}>Waar ben je trots op?</Text>
            <TextInput
              style={s.textInput}
              value={proud}
              onChangeText={setProud}
              multiline
              placeholder="Eén ding dat je goed deed..."
              placeholderTextColor={E.faint}
            />
          </View>

          <View style={s.textCard}>
            <Text style={s.textLabel}>Wat moet morgen beter?</Text>
            <TextInput
              style={s.textInput}
              value={better}
              onChangeText={setBetter}
              multiline
              placeholder="Eén concrete verbetering..."
              placeholderTextColor={E.faint}
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={s.saveBtn}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <Text style={s.saveBtnText}>Opslaan in journal</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

  header: { paddingTop: 6 },
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: E.gold },
  title: {
    fontFamily: F.display,
    fontSize: 25,
    color: E.ink,
    marginTop: 3,
    letterSpacing: -0.4,
  },

  card: {
    marginTop: 18,
    padding: 18,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    borderRadius: 20,
  },
  cardTitle: {
    fontFamily: F.displayBold,
    fontSize: 16,
    color: E.ink,
    marginBottom: 14,
  },

  // Mood
  moodRow: { flexDirection: 'row', gap: 10 },
  moodTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moodTileOff: { backgroundColor: E.s2, borderColor: E.line },
  moodTileOn: {
    backgroundColor: 'rgba(200,164,92,0.18)',
    borderColor: E.gold,
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: { fontSize: 24 },

  // Scores
  scoreBlock: {},
  scoreHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreLabel: { fontFamily: F.bodySemi, fontSize: 14.5, color: E.ink },
  scoreVal: { fontFamily: F.monoBold, fontSize: 14 },
  segRow: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 10, borderRadius: 4 },

  // Lived
  livedRow: { flexDirection: 'row', gap: 11 },
  livedBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: E.s2,
    borderWidth: 1,
    borderColor: E.line,
  },
  livedYesOn: { backgroundColor: E.gold, borderColor: E.gold },
  livedNoOn: {
    backgroundColor: 'rgba(201,123,110,0.2)',
    borderColor: E.red,
  },
  livedText: { fontFamily: F.bodySemi, fontSize: 14, color: E.ink },

  // Free text
  textCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    borderRadius: 18,
  },
  textLabel: {
    fontFamily: F.bodySemi,
    fontSize: 13.5,
    color: E.gold2,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: F.body,
    fontSize: 15,
    color: E.ink,
    lineHeight: 23,
    backgroundColor: 'transparent',
    minHeight: 64,
    padding: 0,
    textAlignVertical: 'top',
  },

  // Save
  saveBtn: {
    marginTop: 22,
    height: 54,
    borderRadius: 16,
    backgroundColor: E.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
});
