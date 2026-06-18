export const COLORS = {
  bg: '#08090c',
  bg2: '#10131a',
  bg3: '#1a1e28',
  bg4: '#252b38',
  bg5: '#323a4a',
  line: 'rgba(255,255,255,0.06)',
  line2: 'rgba(255,255,255,0.14)',
  text: '#f4f7fb',
  muted: '#7a8395',
  dim: '#4a5363',
  ac: '#5ef0ff',
  acStrong: '#7df5ff',
  acDim: 'rgba(94,240,255,0.12)',
  acGlow: 'rgba(94,240,255,0.22)',
  red: '#ff7a85',
  green: '#5ee3a5',
  gold: '#ffe14d',
  blue: '#60a5fa',
  orange: '#fb923c',
};

export const THEMES = [
  { id: 'arctic', name: 'Arctic', ac: '#5ef0ff', acStrong: '#7df5ff', rgb: [94, 240, 255] },
  { id: 'solar',  name: 'Solar',  ac: '#ff8a3d', acStrong: '#ffaa6d', rgb: [255, 138, 61] },
  { id: 'plasma', name: 'Plasma', ac: '#ff4dd2', acStrong: '#ff7de0', rgb: [255, 77, 210] },
  { id: 'forest', name: 'Forest', ac: '#7dd87d', acStrong: '#a3e8a3', rgb: [125, 216, 125] },
  { id: 'volt',   name: 'Volt',   ac: '#ffe14d', acStrong: '#ffed80', rgb: [255, 225, 77] },
  { id: 'coral',  name: 'Coral',  ac: '#ff6363', acStrong: '#ff8b8b', rgb: [255, 99, 99] },
];

export const FONTS = {
  mono: 'JetBrainsMono',
  sans: 'InterTight',
  body: 'Inter',
};

// ─── Evolve design system (handoff: design_handoff_evolve) ────────────────────
// Vaste premium dark+goud tokens. Staat los van het arctic-themasysteem (COLORS/
// THEMES) — Evolve-schermen gebruiken deze waarden direct.
export const EVOLVE = {
  bg: '#0B0B0D',       // app-achtergrond
  s0: '#0E0E10',       // diepste surface (AI-inzicht-kaart)
  s1: '#161618',       // standaard kaart-surface
  s2: '#1E1E21',       // verhoogd surface (chips, icoon-tegels)
  line: 'rgba(236,231,220,0.09)',
  line2: 'rgba(236,231,220,0.05)',
  ringTrack: 'rgba(236,231,220,0.08)',
  ink: '#ECE7DC',      // primaire tekst (bone/ivoor)
  dim: 'rgba(236,231,220,0.56)',
  faint: 'rgba(236,231,220,0.34)',
  gold: '#C8A45C',     // signature accent
  gold2: '#E6CB8E',    // lichtere goud (highlights)
  goldText: '#0B0B0D', // tekst op goud-vlakken
  green: '#8FB48A',
  red: '#C97B6E',
  // warm goud-verloop voor identiteit/inzicht-kaarten (expo-linear-gradient)
  warmGrad: ['#221D13', '#15130E'] as const,
  warmBorder: 'rgba(200,164,92,0.26)',
  goldGlow: 'rgba(200,164,92,0.5)',
} as const;

// Accent-thema's voor Evolve. Alleen het signature-accent (gold/gold2) wisselt;
// surfaces, ink en lijnen blijven het vaste dark-charcoal palet. 'evolve' (goud) is
// de default. Gelezen via de useEvolve()-hook → app-breed reactief.
export const EVOLVE_THEMES = [
  { id: 'evolve', name: 'Evolve', gold: '#C8A45C', gold2: '#E6CB8E', rgb: '200,164,92' },
  { id: 'arctic', name: 'Arctic', gold: '#5EF0FF', gold2: '#7DF5FF', rgb: '94,240,255' },
  { id: 'solar',  name: 'Solar',  gold: '#FF8A3D', gold2: '#FFAA6D', rgb: '255,138,61' },
  { id: 'plasma', name: 'Plasma', gold: '#FF4DD2', gold2: '#FF7DE0', rgb: '255,77,210' },
  { id: 'forest', name: 'Forest', gold: '#7DD87D', gold2: '#A3E8A3', rgb: '125,216,125' },
  { id: 'volt',   name: 'Volt',   gold: '#FFE14D', gold2: '#FFED80', rgb: '255,225,77' },
  { id: 'coral',  name: 'Coral',  gold: '#FF6363', gold2: '#FF8B8B', rgb: '255,99,99' },
] as const;

// Evolve font-families (gewicht in de naam, zoals geladen via @expo-google-fonts)
export const EV_FONTS = {
  display: 'SpaceGrotesk_600SemiBold',
  displayMed: 'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',
  body: 'HankenGrotesk_400Regular',
  bodyMed: 'HankenGrotesk_500Medium',
  bodySemi: 'HankenGrotesk_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;
