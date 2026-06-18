import { EVOLVE, EVOLVE_THEMES } from '../constants/theme';
import { useStore } from '../store/useStore';

// Evolve-tokens met het gekozen accent erin verwerkt. Drop-in vervanger voor
// `import { EVOLVE as E }` — gebruik `const E = useEvolve()` in een component zodat
// het scherm live mee-kleurt wanneer de gebruiker een ander thema kiest.
//
// Alleen accent-afgeleide waarden veranderen: gold, gold2 en de rgba's die daarop
// gebaseerd zijn (warmBorder, goldGlow). bg/surfaces/ink/line/goldText blijven vast.
// De accent-afgeleide velden zijn dynamisch (string), de rest blijft het vaste palet.
export type EvolveColors = Omit<typeof EVOLVE, 'gold' | 'gold2' | 'warmBorder' | 'goldGlow'> & {
  gold: string;
  gold2: string;
  warmBorder: string;
  goldGlow: string;
};

export function useEvolve(): EvolveColors {
  const accent = useStore((s) => s.accent);
  const t = EVOLVE_THEMES.find((x) => x.id === accent) ?? EVOLVE_THEMES[0];
  return {
    ...EVOLVE,
    gold: t.gold,
    gold2: t.gold2,
    warmBorder: `rgba(${t.rgb},0.26)`,
    goldGlow: `rgba(${t.rgb},0.5)`,
  };
}
