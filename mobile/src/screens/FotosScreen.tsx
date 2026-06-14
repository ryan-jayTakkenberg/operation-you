import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  useStore,
  today,
  dayNum,
  dateForDay,
} from '../store/useStore';
import { EVOLVE as E, EV_FONTS as F } from '../constants/theme';

const NL_MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// "14 juni 2026" uit een YYYY-MM-DD string (lokaal, geen TZ-shift).
function formatNL(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return dateStr;
  const [y, m, d] = parts;
  const maand = NL_MAANDEN[Math.min(Math.max(m - 1, 0), 11)];
  return `${d} ${maand} ${y}`;
}

// Welke kalenderdag (1..75) hoort bij een datum-string, relatief aan startDate.
function dayForDate(startDate: string | null, dateStr: string): number | null {
  if (!startDate) return null;
  for (let n = 1; n <= 75; n++) {
    if (dateForDay(startDate, n) === dateStr) return n;
  }
  return null;
}

// ── Iconen ────────────────────────────────────────────────────────────────
function IconPlus({ size = 24, color = E.goldText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function IconLock({ size = 14, color = E.green }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={15} r={1.4} fill={color} />
    </Svg>
  );
}

export default function FotosScreen() {
  const entries = useStore((s) => s.entries);
  const startDate = useStore((s) => s.startDate);
  const updateEntry = useStore((s) => s.updateEntry);
  const addEntry = useStore((s) => s.addEntry);

  const todayStr = today();
  const currentDay = dayNum(startDate);

  // Foto-entries chronologisch (oudste eerst).
  const photoEntries = (entries ?? [])
    .filter((e) => !!e.photo)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayEntry = (entries ?? []).find((e) => e.date === todayStr);
  const todayPhoto = todayEntry?.photo;

  const firstPhoto = photoEntries[0] ?? null;
  const lastPhoto = photoEntries.length ? photoEntries[photoEntries.length - 1] : null;

  async function pickForDate(date: string) {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Geen toegang',
          'Geef toegang tot je foto’s in je instellingen om een progressie-foto toe te voegen. Deze foto’s blijven privé en lokaal op je toestel.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: false,
      });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      const exists = (entries ?? []).some((e) => e.date === date);
      if (!exists) addEntry({ date });
      updateEntry(date, { photo: uri });
    } catch (err) {
      Alert.alert('Er ging iets mis', 'De foto kon niet worden geladen. Probeer het opnieuw.');
    }
  }

  function addTodayPhoto() {
    pickForDate(todayStr);
  }

  // ── Render-helpers ────────────────────────────────────────────────────────
  function PhotoTile({
    uri,
    dayLabel,
    onPress,
  }: {
    uri?: string;
    dayLabel: string;
    onPress?: () => void;
  }) {
    return (
      <TouchableOpacity
        style={s.tile}
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        disabled={!onPress}
      >
        {uri ? (
          <Image source={{ uri }} style={s.tileImg} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={E.warmGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.tilePlaceholder}
          >
            <Text style={s.placeholderMark}>—</Text>
          </LinearGradient>
        )}
        <View style={s.dayPill}>
          <Text style={s.dayPillText}>{dayLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={s.title}>Progressie-foto’s</Text>
        <View style={s.privacyPill}>
          <IconLock size={13} color={E.green} />
          <Text style={s.privacyText}>Alleen jij ziet deze foto’s</Text>
        </View>

        {/* Foto van vandaag — preview als die er is */}
        {todayPhoto ? (
          <View style={s.todayPreview}>
            <Image source={{ uri: todayPhoto }} style={s.todayPreviewImg} resizeMode="cover" />
            <View style={s.todayPreviewBar}>
              <Text style={s.todayPreviewLabel}>
                DAG {currentDay} · VANDAAG
              </Text>
              <TouchableOpacity activeOpacity={0.8} onPress={addTodayPhoto}>
                <Text style={s.todayPreviewChange}>WIJZIG</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Upload-dropzone
          <TouchableOpacity activeOpacity={0.9} onPress={addTodayPhoto} style={s.dropzoneWrap}>
            <LinearGradient
              colors={['#19160F', '#100F0D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.dropzone}
            >
              <View style={s.dropzoneBtn}>
                <IconPlus size={26} color={E.goldText} />
              </View>
              <Text style={s.dropzoneTitle}>Voeg de foto van vandaag toe</Text>
              <Text style={s.dropzoneSub}>
                Dag {currentDay} · {formatNL(todayStr)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Before / after */}
        <Text style={[s.eyebrow, { marginTop: 28 }]}>
          VERGELIJK · DAG {firstPhoto ? dayForDate(startDate, firstPhoto.date) ?? 1 : 1} → DAG {currentDay}
        </Text>
        <View style={s.compareRow}>
          <View style={s.compareCol}>
            <PhotoTile
              uri={firstPhoto?.photo}
              dayLabel={
                firstPhoto
                  ? `DAG ${dayForDate(startDate, firstPhoto.date) ?? 1}`
                  : 'DAG 1'
              }
            />
            <Text style={s.compareCaption}>EERSTE</Text>
          </View>
          <View style={s.compareCol}>
            <PhotoTile
              uri={lastPhoto?.photo}
              dayLabel={
                lastPhoto
                  ? `DAG ${dayForDate(startDate, lastPhoto.date) ?? currentDay}`
                  : `DAG ${currentDay}`
              }
            />
            <Text style={s.compareCaption}>NU</Text>
          </View>
        </View>

        {/* Tijdlijn */}
        <Text style={[s.eyebrow, { marginTop: 28 }]}>TIJDLIJN</Text>
        <View style={s.timelineGrid}>
          {/* Upload-tegel als eerste cel */}
          <TouchableOpacity
            style={[s.tile, s.timelineCell, s.uploadTile]}
            activeOpacity={0.85}
            onPress={addTodayPhoto}
          >
            <View style={s.uploadTileBtn}>
              <IconPlus size={22} color={E.goldText} />
            </View>
            <Text style={s.uploadTileText}>Vandaag</Text>
          </TouchableOpacity>

          {photoEntries.map((e) => {
            const n = dayForDate(startDate, e.date);
            return (
              <TouchableOpacity key={e.date} style={[s.tile, s.timelineCell]} activeOpacity={0.85}>
                <Image source={{ uri: e.photo }} style={s.tileImg} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(11,11,13,0.85)']}
                  style={s.timelineOverlay}
                >
                  <Text style={s.timelineLabel}>{n ? `DAG ${n}` : formatNL(e.date)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {photoEntries.length === 0 ? (
          <Text style={s.emptyTimeline}>
            Nog geen foto’s vastgelegd. Voeg vandaag je eerste toe — over 75 dagen zie je het verschil.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE_GAP = 10;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110 },

  title: { fontFamily: F.display, fontSize: 25, color: E.ink, letterSpacing: -0.4, paddingTop: 6 },

  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
  },
  privacyText: { fontFamily: F.body, fontSize: 12, color: E.dim },

  // Dropzone
  dropzoneWrap: { marginTop: 22 },
  dropzone: {
    height: 200,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(200,164,92,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropzoneBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: E.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dropzoneTitle: { fontFamily: F.display, fontSize: 16, color: E.ink, textAlign: 'center' },
  dropzoneSub: { fontFamily: F.mono, fontSize: 11, color: E.faint, marginTop: 6, letterSpacing: 0.5 },

  // Foto van vandaag (preview)
  todayPreview: {
    marginTop: 22,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: E.warmBorder,
  },
  todayPreviewImg: { width: '100%', height: 240, backgroundColor: E.s2 },
  todayPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: E.s1,
  },
  todayPreviewLabel: { fontFamily: F.mono, fontSize: 11, color: E.gold, letterSpacing: 1.2 },
  todayPreviewChange: { fontFamily: F.monoBold, fontSize: 11, color: E.dim, letterSpacing: 1.2 },

  // Eyebrows
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.8, color: E.faint, marginBottom: 12 },

  // Compare
  compareRow: { flexDirection: 'row', gap: TILE_GAP },
  compareCol: { flex: 1 },
  compareCaption: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: E.faint,
    textAlign: 'center',
    marginTop: 8,
  },

  // Tegels
  tile: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
  },
  tileImg: { width: '100%', height: '100%' },
  tilePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderMark: { fontFamily: F.display, fontSize: 28, color: 'rgba(200,164,92,0.25)' },

  dayPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(11,11,13,0.7)',
  },
  dayPillText: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1, color: E.ink },

  // Tijdlijn-grid (3 koloms). flexBasis < 1/3 zodat de gap past en er 3 op een rij staan.
  timelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  timelineCell: { flexBasis: '31.5%', flexGrow: 0 },
  uploadTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: 'rgba(200,164,92,0.4)',
    backgroundColor: '#100F0D',
  },
  uploadTileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: E.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTileText: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1, color: E.dim },

  timelineOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 7,
    paddingHorizontal: 8,
    justifyContent: 'flex-end',
  },
  timelineLabel: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1, color: E.ink },

  emptyTimeline: {
    fontFamily: F.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: E.dim,
    marginTop: 16,
    paddingHorizontal: 4,
  },
});
