import type { Identity } from '../../store/useStore';

// Gedeeld formulier-model voor de Evolve onboarding (7 stappen).
// De container (OnboardingScreen.tsx) mapt dit naar het Profile-model en
// bouwt de AI-prompt. De 4 scherm-bestanden lezen/schrijven alleen deze velden.
export interface OnboForm {
  name: string;
  age: string;
  work: string;        // stap 2 — werk
  study: string;       // stap 2 — school/studie
  sports: string[];    // stap 3 — geselecteerde sporten
  hobbies: string[];   // stap 3 — geselecteerde hobby's
  improve: string[];   // stap 4 — groeirichting-chips
  energy: string;      // stap 4 — "wat geeft je energie?"
  goals: string;       // stap 5 — grootste doelen
  weak: string;        // stap 5 — slechte gewoontes
  year1: string;       // stap 6 — over 1 jaar
  year5: string;       // stap 6 — over 5 jaar
  becoming: string;    // stap 7 — wat voor persoon wil je worden
  timePerDay: number;  // stap 7 — minuten per dag (15-180)
  strictness: 'Light' | 'Balanced' | 'Extreme'; // stap 7
}

export const emptyForm: OnboForm = {
  name: '',
  age: '',
  work: '',
  study: '',
  sports: [],
  hobbies: [],
  improve: [],
  energy: '',
  goals: '',
  weak: '',
  year1: '',
  year5: '',
  becoming: '',
  timePerDay: 90,
  strictness: 'Balanced',
};

// ─── Prop-contracten per scherm (door de container geleverd) ──────────────────

// 1. Welcome / Landing
export interface WelcomeProps {
  onStart: () => void;    // → start onboarding
  onPreview: () => void;  // → "Bekijk voorbeeld"
}

// 2. Onboarding (7 stappen) — bezit zijn eigen interne stap-state.
export interface OnboardingStepsProps {
  initialForm: OnboForm;
  onComplete: (form: OnboForm) => void; // alle stappen klaar → genereren
  onExit: () => void;                   // terug vanaf stap 1 → welcome
}

// 3. AI-generatie (loading) — puur visueel; container bepaalt wanneer door.
export interface GeneratingProps {
  error?: string;
}

// 4. Persoonlijke wetten
export interface LawsProps {
  identity: Identity;
  onStart: () => void; // "Start challenge" → vergrendel & ga de app in
}
