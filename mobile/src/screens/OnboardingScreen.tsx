import React, { useState } from 'react';
import { useStore, today, Profile, Identity } from '../store/useStore';
import { claudeCall } from '../api/claude';
import WelcomeScreen from './onboarding/WelcomeScreen';
import OnboardingSteps from './onboarding/OnboardingSteps';
import GeneratingScreen from './onboarding/GeneratingScreen';
import LawsScreen from './onboarding/LawsScreen';
import { OnboForm, emptyForm } from './onboarding/types';

type Phase = 'welcome' | 'onbo' | 'generating' | 'laws';

// Map het rijke Evolve-formulier naar het bestaande Profile-model.
function formToProfile(f: OnboForm): Profile {
  const sportsHobbies = [...f.sports, ...f.hobbies].join(', ');
  return {
    name: f.name.trim() || 'Operator',
    age: parseInt(f.age, 10) || 0,
    daily: [f.work, f.study].filter(Boolean).join(' · '),
    energy: f.energy.trim(),
    story: [f.year1, f.year5].filter(Boolean).join(' '),
    strengths: [sportsHobbies, f.improve.join(', ')].filter(Boolean).join('. '),
    weak: f.weak.trim(),
    goal: [f.goals, f.becoming].filter(Boolean).join('. '),
  };
}

function rulesHint(strictness: OnboForm['strictness']): string {
  if (strictness === 'Light') return '3-4 regels, flexibel ritme';
  if (strictness === 'Extreme') return '8-12 regels, geen excuses';
  return '5-6 regels, stevig maar haalbaar';
}

// AI-generatie met nette fallback-identiteit als de call faalt of JSON kapot is.
async function generateIdentity(
  profile: Profile,
  form: OnboForm,
  apiKey: string
): Promise<Identity> {
  const system = `Je bent een identiteitsarchitect voor een 75-daagse zelftransformatie challenge. Analyseer het profiel en genereer een JSON object met:
- name: krachtige codenaam/identiteit (bijv. "DE IJZEREN SOLDAAT")
- manifesto: 2-3 zinnen persoonlijk manifest
- shadow: 1 zin over de grootste innerlijke vijand
- rules: array van regels (${rulesHint(form.strictness)}), elk { id: "r1"..., text: "...", section: "ochtend"|"dag"|"fysiek"|"mentaal"|"avond" }, verdeeld over de secties
- why: 1 zin kernmotivatie
Reageer ALLEEN met het JSON object, geen uitleg.`;

  const userMsg = `Profiel:
Naam: ${profile.name}, Leeftijd: ${profile.age}
Dagelijks leven: ${profile.daily}
Energie: ${profile.energy}
Sterke punten: ${profile.strengths}
Slechte gewoontes: ${profile.weak}
Toekomstvisie: ${profile.story}
Doelen / gewenste persoon: ${profile.goal}
Tijd per dag: ${form.timePerDay} min · Strengheid: ${form.strictness}`;

  const fallback: Identity = {
    name: 'DE ONTEMBARE',
    manifesto: `${profile.name} kiest voor discipline boven gemak. 75 dagen van transformatie beginnen nu. Elke dag is een kans om sterker te worden.`,
    shadow: 'De innerlijke criticus die excuses maakt en uitstelt.',
    rules: [
      { id: 'r1', text: '06:00 opstaan, geen snooze', section: 'ochtend' },
      { id: 'r2', text: '10 minuten journalen', section: 'ochtend' },
      { id: 'r3', text: 'Geen social media voor 12:00', section: 'dag' },
      { id: 'r4', text: 'Dagelijkse prioriteiten bepalen', section: 'dag' },
      { id: 'r5', text: '45 minuten training', section: 'fysiek' },
      { id: 'r6', text: '10.000 stappen', section: 'fysiek' },
      { id: 'r7', text: '3 liter water', section: 'fysiek' },
      { id: 'r8', text: '30 minuten lezen', section: 'mentaal' },
      { id: 'r9', text: 'Geen alcohol of junkfood', section: 'mentaal' },
      { id: 'r10', text: 'Reflectie schrijven', section: 'avond' },
      { id: 'r11', text: 'Morgen voorbereiden', section: 'avond' },
      { id: 'r12', text: '23:00 naar bed', section: 'avond' },
    ],
    why: `Om op dag 75 te zijn wie ${profile.name} altijd al wilde zijn.`,
  };

  const result = await claudeCall(
    [{ role: 'user', content: userMsg }],
    { system, maxTokens: 1500, apiKey }
  );
  if (!result) return fallback;

  try {
    const clean = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean) as Identity;
  } catch {
    return fallback;
  }
}

export default function OnboardingScreen() {
  const setProfile = useStore((s) => s.setProfile);
  const setIdentity = useStore((s) => s.setIdentity);
  const setStartDate = useStore((s) => s.setStartDate);
  const apiKey = useStore((s) => s.apiKey);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [generated, setGenerated] = useState<Identity | null>(null);

  async function handleComplete(form: OnboForm) {
    const profile = formToProfile(form);
    setProfile(profile);
    setPhase('generating');
    const identity = await generateIdentity(profile, form, apiKey);
    setGenerated(identity);
    setPhase('laws');
  }

  function handleStart() {
    if (generated) {
      setIdentity(generated);
      setStartDate(today());
      // RootNavigator schakelt automatisch naar MainTabs zodra identity is gezet.
    }
  }

  if (phase === 'welcome') {
    return (
      <WelcomeScreen
        onStart={() => setPhase('onbo')}
        onPreview={() => setPhase('onbo')}
      />
    );
  }
  if (phase === 'onbo') {
    return (
      <OnboardingSteps
        initialForm={emptyForm}
        onComplete={handleComplete}
        onExit={() => setPhase('welcome')}
      />
    );
  }
  if (phase === 'laws' && generated) {
    return <LawsScreen identity={generated} onStart={handleStart} />;
  }
  return <GeneratingScreen />;
}
