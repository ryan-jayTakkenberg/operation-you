import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore, today, Profile, Identity } from '../store/useStore';
import { claudeCall } from '../api/claude';
import { useTheme } from '../hooks/useTheme';

const LOADING_MESSAGES = [
  'Je verhaal verwerken…',
  'Patronen vinden…',
  '12 wetten smeden…',
  'Bijna klaar…',
];

const SECTIONS: Record<string, string> = {
  ochtend: '🌅 Ochtend',
  dag: '☀️ Hele dag',
  fysiek: '🥊 Fysiek',
  mentaal: '🧠 Mentaal',
  avond: '🌙 Avond',
};

export default function OnboardingScreen() {
  const colors = useTheme();
  const setProfile = useStore((s) => s.setProfile);
  const setIdentity = useStore((s) => s.setIdentity);
  const setStartDate = useStore((s) => s.setStartDate);
  const apiKey = useStore((s) => s.apiKey);

  const [step, setStep] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [generatedIdentity, setGeneratedIdentity] = useState<Identity | null>(null);
  const [genError, setGenError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [daily, setDaily] = useState('');
  const [energy, setEnergy] = useState('');
  const [story, setStory] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weak, setWeak] = useState('');
  const [goal, setGoal] = useState('');

  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 8) {
      loadingInterval.current = setInterval(() => {
        setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length);
      }, 2000);
      generateIdentity();
    } else {
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
        loadingInterval.current = null;
      }
    }
    return () => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    };
  }, [step]);

  const styles = makeStyles(colors);

  function canAdvance(): boolean {
    switch (step) {
      case 1: return name.trim().length > 0 && age.trim().length > 0;
      case 2: return daily.trim().length > 0;
      case 3: return energy.trim().length > 0;
      case 4: return story.trim().length > 0;
      case 5: return strengths.trim().length > 0;
      case 6: return weak.trim().length > 0;
      case 7: return goal.trim().length > 0;
      default: return true;
    }
  }

  function handleNext() {
    if (!canAdvance()) {
      Alert.alert('Vul dit in', 'Beantwoord eerst deze vraag voordat je verder gaat.');
      return;
    }
    if (step === 7) {
      const profile: Profile = {
        name: name.trim(),
        age: parseInt(age, 10) || 0,
        daily: daily.trim(),
        energy: energy.trim(),
        story: story.trim(),
        strengths: strengths.trim(),
        weak: weak.trim(),
        goal: goal.trim(),
      };
      setProfile(profile);
      setStep(8);
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function generateIdentity() {
    const profile: Profile = {
      name: name.trim(),
      age: parseInt(age, 10) || 0,
      daily: daily.trim(),
      energy: energy.trim(),
      story: story.trim(),
      strengths: strengths.trim(),
      weak: weak.trim(),
      goal: goal.trim(),
    };

    const system = `Je bent een identiteitsarchitect voor een 75-daagse zelftransformatie challenge. Analyseer het profiel en genereer een JSON object met:
- name: krachtige codenaam/identiteit (bijv. "DE IJZEREN SOLDAAT")
- manifesto: 2-3 zinnen persoonlijk manifest
- shadow: 1 zin over de grootste innerlijke vijand
- rules: array van exact 12 regels, elk { id: "r1"..."r12", text: "...", section: "ochtend"|"dag"|"fysiek"|"mentaal"|"avond" }
  Verdeling: 2-3 per sectie
- why: 1 zin kernmotivatie
Reageer ALLEEN met het JSON object, geen uitleg.`;

    const userMsg = `Profiel:
Naam: ${profile.name}, Leeftijd: ${profile.age}
Dagelijks leven: ${profile.daily}
Energie: ${profile.energy}
Verhaal: ${profile.story}
Sterke punten: ${profile.strengths}
Zwakke punten: ${profile.weak}
Dag-75 visie: ${profile.goal}`;

    const result = await claudeCall(
      [{ role: 'user', content: userMsg }],
      { system, maxTokens: 1500, apiKey }
    );

    if (!result) {
      setGenError('Kon identiteit niet genereren. Controleer je API sleutel of internetverbinding.');
      // Create a default identity so the user can still proceed
      const fallback: Identity = {
        name: 'DE ONTEMBARE',
        manifesto: `${profile.name} kiest voor discipline boven gemak. 75 dagen van transformatie beginnen nu. Elke dag is een kans om sterker te worden.`,
        shadow: 'De innerlijke criticus die excuses maakt en uitstelt.',
        rules: [
          { id: 'r1', text: '06:00 opstaan, geen snooze', section: 'ochtend' },
          { id: 'r2', text: '10 minuten meditatie of journaling', section: 'ochtend' },
          { id: 'r3', text: 'Gezond ontbijt, geen suiker', section: 'ochtend' },
          { id: 'r4', text: 'Geen social media voor 12:00', section: 'dag' },
          { id: 'r5', text: 'Dagelijkse prioriteiten bepalen', section: 'dag' },
          { id: 'r6', text: '45 minuten training per dag', section: 'fysiek' },
          { id: 'r7', text: '10.000 stappen zetten', section: 'fysiek' },
          { id: 'r8', text: '3 liter water drinken', section: 'fysiek' },
          { id: 'r9', text: '30 minuten lezen', section: 'mentaal' },
          { id: 'r10', text: 'Geen alcohol of junkfood', section: 'mentaal' },
          { id: 'r11', text: 'Dagboek bijhouden', section: 'avond' },
          { id: 'r12', text: '23:00 naar bed', section: 'avond' },
        ],
        why: `Om op dag 75 te zijn wie ${profile.name} altijd al wilde zijn.`,
      };
      setGeneratedIdentity(fallback);
      setStep(9);
      return;
    }

    try {
      // Strip markdown code blocks if present
      const clean = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(clean) as Identity;
      setGeneratedIdentity(parsed);
      setStep(9);
    } catch {
      setGenError('JSON parse mislukt. Standaard identiteit toegepast.');
      const fallback: Identity = {
        name: `DE ${profile.name.toUpperCase()}`,
        manifesto: `75 dagen discipline. ${profile.goal}`,
        shadow: `De gewoonte van ${profile.weak}.`,
        rules: [
          { id: 'r1', text: '06:00 opstaan', section: 'ochtend' },
          { id: 'r2', text: 'Koude douche', section: 'ochtend' },
          { id: 'r3', text: 'Gezond ontbijt', section: 'ochtend' },
          { id: 'r4', text: 'Geen social media voor 12:00', section: 'dag' },
          { id: 'r5', text: 'Dagelijkse focus sessie', section: 'dag' },
          { id: 'r6', text: 'Training 45+ min', section: 'fysiek' },
          { id: 'r7', text: '10.000 stappen', section: 'fysiek' },
          { id: 'r8', text: '3L water', section: 'fysiek' },
          { id: 'r9', text: '30 min lezen', section: 'mentaal' },
          { id: 'r10', text: 'Geen alcohol', section: 'mentaal' },
          { id: 'r11', text: 'Dagboek', section: 'avond' },
          { id: 'r12', text: '23:00 slaap', section: 'avond' },
        ],
        why: profile.goal,
      };
      setGeneratedIdentity(fallback);
      setStep(9);
    }
  }

  function handleStart() {
    if (generatedIdentity) {
      setIdentity(generatedIdentity);
      setStartDate(today());
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  function renderDots() {
    if (step < 1 || step > 7) return null;
    return (
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && { backgroundColor: colors.ac, width: 16 },
              i < step && { backgroundColor: colors.acStrong },
            ]}
          />
        ))}
      </View>
    );
  }

  // Step 0 — Welcome
  if (step === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>OPERATION{'\n'}YOU</Text>
          <Text style={styles.welcomeSub}>75 DAGEN. 12 WETTEN. GEEN EXCUSES.</Text>
          <Text style={styles.welcomeDesc}>
            Klaar om te transformeren? Claude AI bouwt een persoonlijke identiteit
            en 12 regels speciaal voor jou.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.ac }]}
            onPress={() => setStep(1)}
          >
            <Text style={styles.btnText}>BEGIN NU →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 8 — Loading
  if (step === 8) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.ac} />
          <Text style={[styles.loadingTitle, { color: colors.ac }]}>
            IDENTITEIT BOUWEN
          </Text>
          <Text style={styles.loadingMsg}>{LOADING_MESSAGES[loadingMsg]}</Text>
          {genError ? <Text style={styles.errorText}>{genError}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  // Step 9 — Reveal
  if (step === 9 && generatedIdentity) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.revealScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.revealName, { color: colors.ac }]}>
            {generatedIdentity.name}
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MANIFEST</Text>
            <Text style={styles.cardText}>{generatedIdentity.manifesto}</Text>
          </View>
          {generatedIdentity.shadow ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SCHADUW</Text>
              <Text style={styles.cardText}>{generatedIdentity.shadow}</Text>
            </View>
          ) : null}

          <Text style={styles.rulesHeader}>12 WETTEN</Text>
          {Object.keys(SECTIONS).map((sec) => {
            const sectionRules = generatedIdentity.rules.filter((r) => r.section === sec);
            if (!sectionRules.length) return null;
            return (
              <View key={sec} style={styles.ruleSection}>
                <Text style={styles.ruleSectionHeader}>{SECTIONS[sec]}</Text>
                {sectionRules.map((r) => (
                  <View key={r.id} style={styles.ruleRow}>
                    <Text style={[styles.ruleDot, { color: colors.ac }]}>●</Text>
                    <Text style={styles.ruleText}>{r.text}</Text>
                  </View>
                ))}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.ac, marginTop: 32 }]}
            onPress={handleStart}
          >
            <Text style={styles.btnText}>START 75 DAGEN →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Steps 1-7 — Form questions
  // Stap 1 (isTwoFields) verzamelt naam + leeftijd samen. De rest van de stappen
  // (2-7) mapt op stepIndex = step - 1 → daily, energy, story, strengths, weak, goal.
  const questions: Array<{ label: string; placeholder: string; value: string; setter: (v: string) => void; multiline?: boolean; keyboardType?: 'default' | 'numeric' }> = [
    { label: 'Wat is je naam en leeftijd?', placeholder: 'Naam...', value: name, setter: setName },
    { label: 'Beschrijf je dagelijks leven', placeholder: 'Wat doe je dagelijks? School, werk, sport...', value: daily, setter: setDaily, multiline: true },
    { label: 'Hoe is je energieniveau doorgaans?', placeholder: 'Hoog, laag, wisselend... wanneer piekt je energie?', value: energy, setter: setEnergy, multiline: true },
    { label: 'Vertel je verhaal', placeholder: 'Wat heeft je hierheen geleid? Wat wil je veranderen?', value: story, setter: setStory, multiline: true },
    { label: 'Wat zijn je sterke punten?', placeholder: 'Waar ben je goed in? Wat maakt jou uniek?', value: strengths, setter: setStrengths, multiline: true },
    { label: 'Wat zijn je zwakke punten?', placeholder: 'Wees eerlijk. Wat saboteert je?', value: weak, setter: setWeak, multiline: true },
    { label: 'Stel je voor: dag 75.', placeholder: 'Hoe zie je eruit? Wat heb je bereikt? Wie ben je geworden?', value: goal, setter: setGoal, multiline: true },
  ];

  const stepIndex = step - 1;
  const isTwoFields = step === 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backText}>‹ Terug</Text>
          </TouchableOpacity>

          {renderDots()}

          {isTwoFields ? (
            <>
              <Text style={styles.questionNum}>01 / 07</Text>
              <Text style={styles.question}>Wie ben jij?</Text>
              <TextInput
                style={styles.input}
                placeholder="Naam..."
                placeholderTextColor="#4a5363"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Leeftijd..."
                placeholderTextColor="#4a5363"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <Text style={styles.questionNum}>
                {String(step).padStart(2, '0')} / 07
              </Text>
              <Text style={styles.question}>{questions[stepIndex].label}</Text>
              <TextInput
                style={[
                  styles.input,
                  questions[stepIndex].multiline && styles.inputMulti,
                ]}
                placeholder={questions[stepIndex].placeholder}
                placeholderTextColor="#4a5363"
                value={questions[stepIndex].value}
                onChangeText={questions[stepIndex].setter}
                multiline={questions[stepIndex].multiline}
                keyboardType={questions[stepIndex].keyboardType ?? 'default'}
                autoFocus
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canAdvance() ? colors.ac : '#1a1e28' }]}
            onPress={handleNext}
          >
            <Text style={[styles.btnText, { color: canAdvance() ? '#08090c' : '#4a5363' }]}>
              {step === 7 ? 'GENEREER IDENTITEIT →' : 'VERDER →'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' },
    flex: { flex: 1 },
    welcome: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    welcomeTitle: {
      fontSize: 52,
      fontWeight: '900',
      color: colors.ac,
      letterSpacing: 6,
      textAlign: 'center',
      marginBottom: 16,
    },
    welcomeSub: {
      fontSize: 12,
      color: '#4a5363',
      letterSpacing: 3,
      marginBottom: 32,
      textAlign: 'center',
    },
    welcomeDesc: {
      color: '#7a8395',
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 48,
    },
    btn: {
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
      width: '100%',
    },
    btnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#08090c',
      letterSpacing: 2,
    },
    backBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      marginBottom: 16,
    },
    backText: {
      color: '#7a8395',
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 1,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 40,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#1a1e28',
    },
    formScroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 40,
    },
    questionNum: {
      color: colors.ac,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 3,
      marginBottom: 12,
    },
    question: {
      color: '#f4f7fb',
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 24,
      lineHeight: 30,
    },
    input: {
      backgroundColor: '#10131a',
      borderRadius: 10,
      padding: 14,
      color: '#f4f7fb',
      fontSize: 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    inputMulti: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 32,
    },
    loadingTitle: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 3,
      marginTop: 16,
    },
    loadingMsg: {
      color: '#7a8395',
      fontSize: 15,
      textAlign: 'center',
    },
    errorText: {
      color: '#ff7a85',
      fontSize: 13,
      textAlign: 'center',
      marginTop: 8,
    },
    revealScroll: {
      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 60,
    },
    revealName: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 4,
      textAlign: 'center',
      marginBottom: 32,
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
      marginBottom: 8,
    },
    cardText: {
      color: '#f4f7fb',
      fontSize: 14,
      lineHeight: 22,
    },
    rulesHeader: {
      color: '#7a8395',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 3,
      marginTop: 24,
      marginBottom: 16,
      textAlign: 'center',
    },
    ruleSection: {
      marginBottom: 16,
    },
    ruleSectionHeader: {
      color: '#7a8395',
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 6,
    },
    ruleDot: {
      fontSize: 8,
      marginTop: 5,
    },
    ruleText: {
      color: '#f4f7fb',
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
  });
}
