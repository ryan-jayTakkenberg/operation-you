import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { EVOLVE as E, EV_FONTS as F } from '../../constants/theme';
import type { OnboardingStepsProps, OnboForm } from './types';

const TOTAL = 7;

// Chip-opties (uit de Evolve-handoff state).
const SPORTS = ['Krachttraining', 'Hardlopen', 'Voetbal', 'Zwemmen', 'Yoga', 'Boksen'];
const HOBBIES = ['Lezen', 'Koken', 'Schaken', 'Gitaar', 'Fotografie', 'Gamen', 'Reizen', 'Schrijven'];
const IMPROVE = ['Focus', 'Discipline', 'Slaap', 'Cardio', 'Geduld', 'Sociaal'];

const STRICT: { key: OnboForm['strictness']; title: string; desc: string }[] = [
  { key: 'Light', title: 'Light', desc: '3 wetten · flexibel ritme' },
  { key: 'Balanced', title: 'Balanced', desc: '5-6 wetten · stevig & haalbaar' },
  { key: 'Extreme', title: 'Extreme', desc: '7+ wetten · geen excuses' },
];

// Tekstvelden (de string-keys van OnboForm).
type StrKey =
  | 'name' | 'age' | 'work' | 'study' | 'energy'
  | 'goals' | 'weak' | 'year1' | 'year5' | 'becoming';

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

// ─── Zelfgebouwde tijd-slider (geen externe lib) ──────────────────────────────
const T_MIN = 15;
const T_MAX = 180;
const T_STEP = 15;
const THUMB = 22;

function TimeSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [trackW, setTrackW] = useState(0);
  const geo = useRef({ px: 0, w: 1 });
  const cb = useRef(onChange);
  cb.current = onChange;
  const wrapRef = useRef<View>(null);

  const snap = (absX: number) => {
    const { px, w } = geo.current;
    const ratio = Math.max(0, Math.min(1, (absX - px) / w));
    const raw = T_MIN + ratio * (T_MAX - T_MIN);
    const snapped = Math.round(raw / T_STEP) * T_STEP;
    return Math.max(T_MIN, Math.min(T_MAX, snapped));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, g) => cb.current(snap(g.x0)),
      onPanResponderMove: (_e, g) => cb.current(snap(g.moveX)),
    })
  ).current;

  const pct = (value - T_MIN) / (T_MAX - T_MIN);
  const thumbLeft = Math.max(0, Math.min(trackW - THUMB, pct * trackW - THUMB / 2));

  return (
    <View
      ref={wrapRef}
      style={s.sliderWrap}
      onLayout={() => {
        wrapRef.current?.measure((_x, _y, w, _h, px) => {
          geo.current = { px, w };
          setTrackW(w);
        });
      }}
      {...responder.panHandlers}
    >
      <View style={s.sliderTrack}>
        <View style={[s.sliderFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={[s.sliderThumb, { left: thumbLeft }]} />
    </View>
  );
}

export default function OnboardingSteps({ initialForm, onComplete, onExit }: OnboardingStepsProps) {
  const [form, setForm] = useState<OnboForm>(initialForm);
  const [step, setStep] = useState(0);

  const setField = <K extends keyof OnboForm>(key: K, value: OnboForm[K]) =>
    setForm((f) => ({ ...f, [key]: value } as OnboForm));

  // Goud progress-bar animeert op breedte bij stap-wissel.
  const progress = useRef(new Animated.Value((step + 1) / TOTAL)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: (step + 1) / TOTAL,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step, progress]);

  const handleNext = () => {
    if (step >= TOTAL - 1) onComplete(form);
    else setStep((n) => n + 1);
  };
  const handleBack = () => {
    if (step <= 0) onExit();
    else setStep((n) => n - 1);
  };

  // ── Herbruikbare bouwstenen (functies, geen components → geen focus-verlies) ──
  const field = (
    label: string,
    key: StrKey,
    opts?: { multiline?: boolean; numeric?: boolean; placeholder?: string; minHeight?: number; redLabel?: boolean }
  ) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={[s.fieldLabel, opts?.redLabel && { color: E.red }]}>{label}</Text>
      <TextInput
        style={[
          s.input,
          opts?.multiline && s.inputMulti,
          opts?.minHeight ? { minHeight: opts.minHeight } : null,
        ]}
        value={form[key]}
        onChangeText={(t) => setField(key, t)}
        multiline={opts?.multiline}
        keyboardType={opts?.numeric ? 'numeric' : 'default'}
        placeholder={opts?.placeholder}
        placeholderTextColor={E.faint}
      />
    </View>
  );

  const chips = (label: string, options: string[], selected: string[], key: 'sports' | 'hobbies' | 'improve') => (
    <View>
      <Text style={s.groupLabel}>{label}</Text>
      <View style={s.chipWrap}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.8}
              style={[s.chip, on ? s.chipOn : s.chipOff]}
              onPress={() => setField(key, toggle(selected, opt))}
            >
              <Text style={[s.chipText, on ? s.chipTextOn : s.chipTextOff]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const heading = (eyebrow: string, title: string, sub?: string) => (
    <View style={{ marginBottom: 26 }}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.title}>{title}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <View>
            {heading(
              'WIE BEN JE',
              'Laten we beginnen bij jou.',
              'Dit traject draait volledig om jou. Hoe eerlijker je antwoordt, hoe scherper je wetten worden.'
            )}
            {field('NAAM', 'name', { placeholder: 'Je naam' })}
            {field('LEEFTIJD', 'age', { numeric: true, placeholder: '24' })}
          </View>
        );
      case 1:
        return (
          <View>
            {heading('JOUW DAGELIJKS LEVEN', 'Wat doe je op dit moment?', 'Je challenge moet in jouw werkelijke leven passen.')}
            {field('WERK', 'work', { placeholder: 'Wat is je werk?' })}
            {field('SCHOOL / STUDIE', 'study', { placeholder: 'Studeer je nog?' })}
          </View>
        );
      case 2:
        return (
          <View>
            {heading('LICHAAM & GEEST', 'Hoe houd je je bezig?', 'Selecteer wat bij je past — dit kleurt je wetten.')}
            <View style={{ marginBottom: 24 }}>{chips('SPORTEN', SPORTS, form.sports, 'sports')}</View>
            {chips("HOBBY'S", HOBBIES, form.hobbies, 'hobbies')}
          </View>
        );
      case 3:
        return (
          <View>
            {heading('GROEIRICHTING', 'Waar wil je beter in worden?', 'Kies de gebieden waar de meeste winst ligt.')}
            <View style={{ marginBottom: 26 }}>{chips('GROEIGEBIEDEN', IMPROVE, form.improve, 'improve')}</View>
            {field('WAT GEEFT JE ENERGIE?', 'energy', {
              multiline: true,
              minHeight: 80,
              placeholder: 'Bv. iets bouwen, buiten zijn, leren…',
            })}
          </View>
        );
      case 4:
        return (
          <View>
            {heading('EERLIJKHEID', 'Doelen en valkuilen.', 'Hier wordt het echt. Wees eerlijk tegen jezelf.')}
            {field('JE GROOTSTE DOELEN', 'goals', { multiline: true, minHeight: 84, placeholder: 'Wat wil je écht bereiken?' })}
            {field('JE SLECHTE GEWOONTES', 'weak', {
              multiline: true,
              minHeight: 84,
              placeholder: 'Wat houdt je tegen?',
              redLabel: true,
            })}
          </View>
        );
      case 5:
        return (
          <View>
            {heading('JE TOEKOMST', 'Waar wil je naartoe?', 'Schrijf alsof het al waar is. Dit is je kompas.')}
            {field('OVER 1 JAAR', 'year1', { multiline: true, minHeight: 80, placeholder: 'Hoe ziet je leven er over een jaar uit?' })}
            {field('OVER 5 JAAR', 'year5', { multiline: true, minHeight: 80, placeholder: 'En over vijf jaar?' })}
          </View>
        );
      case 6:
        return (
          <View>
            {heading('DE LAT', 'Wie word je, en hoe streng?')}
            {field('WAT VOOR PERSOON WIL JE WORDEN?', 'becoming', { placeholder: 'Beschrijf je toekomstige zelf' })}

            <View style={s.sliderHead}>
              <Text style={s.groupLabel}>TIJD PER DAG</Text>
              <Text style={s.timeLabel}>{form.timePerDay} min</Text>
            </View>
            <View style={{ marginBottom: 26 }}>
              <TimeSlider value={form.timePerDay} onChange={(n) => setField('timePerDay', n)} />
            </View>

            <Text style={[s.groupLabel, { marginBottom: 12 }]}>HOE STRENG?</Text>
            <View style={{ gap: 11 }}>
              {STRICT.map((o) => {
                const on = form.strictness === o.key;
                const inner = (
                  <>
                    <View style={[s.radioOuter, { borderColor: on ? E.gold : E.faint }]}>
                      <View style={[s.radioInner, { backgroundColor: on ? E.gold : 'transparent' }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.strictTitle}>{o.title}</Text>
                      <Text style={s.strictDesc}>{o.desc}</Text>
                    </View>
                  </>
                );
                return (
                  <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => setField('strictness', o.key)}>
                    {on ? (
                      <LinearGradient
                        colors={E.warmGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[s.strictCard, { borderColor: E.goldGlow }]}
                      >
                        {inner}
                      </LinearGradient>
                    ) : (
                      <View style={[s.strictCard, s.strictCardOff]}>{inner}</View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      default:
        return null;
    }
  }

  const nextLabel = step >= TOTAL - 1 ? 'Genereer mijn challenge' : 'Volgende';
  const stepNum = String(step + 1).padStart(2, '0');

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Vaste header: terug-knop + stapteller + progress-bar */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={s.backTile}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path d="M15 5l-7 7 7 7" stroke={E.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={s.stepCount}>STAP {stepNum} / {String(TOTAL).padStart(2, '0')}</Text>
          </View>
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressFill,
                { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Vaste primaire knop */}
        <View style={s.footer}>
          <TouchableOpacity style={s.btn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={s.btnText}>{nextLabel}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: E.faint },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: 'rgba(236,231,220,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: E.gold },

  // Scroll content
  scroll: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30 },

  // Step heading
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: E.gold, marginBottom: 12 },
  title: { fontFamily: F.display, fontSize: 27, color: E.ink, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontFamily: F.body, fontSize: 14.5, color: E.dim, lineHeight: 21 },

  // Fields
  fieldLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint, marginBottom: 8 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: E.s1,
    borderWidth: 1,
    borderColor: E.line,
    borderRadius: 14,
    color: E.ink,
    fontFamily: F.body,
    fontSize: 15.5,
  },
  inputMulti: { height: undefined, minHeight: 80, paddingTop: 14, paddingBottom: 12, textAlignVertical: 'top', lineHeight: 22 },

  // Chips
  groupLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: E.faint, marginBottom: 11 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1 },
  chipOn: { backgroundColor: E.gold, borderColor: E.gold },
  chipOff: { backgroundColor: 'transparent', borderColor: E.line },
  chipText: { fontSize: 13.5 },
  chipTextOn: { fontFamily: F.bodySemi, color: E.goldText },
  chipTextOff: { fontFamily: F.bodyMed, color: E.dim },

  // Slider
  sliderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  timeLabel: { fontFamily: F.monoBold, fontSize: 14, color: E.gold },
  sliderWrap: { height: 36, justifyContent: 'center' },
  sliderTrack: { height: 5, borderRadius: 999, backgroundColor: E.s2, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 999, backgroundColor: E.gold },
  sliderThumb: {
    position: 'absolute',
    top: (36 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: E.gold2,
    borderWidth: 3,
    borderColor: E.bg,
  },

  // Strictness radio cards
  strictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: 16,
    borderWidth: 1,
  },
  strictCardOff: { backgroundColor: E.s1, borderColor: E.line },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 9, height: 9, borderRadius: 4.5 },
  strictTitle: { fontFamily: F.display, fontSize: 16, color: E.ink },
  strictDesc: { fontFamily: F.body, fontSize: 12.5, color: E.dim, marginTop: 2 },

  // Footer button
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },
  btn: { height: 56, borderRadius: 17, backgroundColor: E.gold, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: F.display, fontSize: 16, color: E.goldText },
});
