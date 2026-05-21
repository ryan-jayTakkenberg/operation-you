import { COLORS, THEMES } from '../constants/theme';
import { useStore } from '../store/useStore';

export interface ThemeColors {
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  bg5: string;
  line: string;
  line2: string;
  text: string;
  muted: string;
  dim: string;
  ac: string;
  acStrong: string;
  acDim: string;
  acGlow: string;
  red: string;
  green: string;
  gold: string;
  blue: string;
  orange: string;
}

export function useTheme(): ThemeColors {
  const themeName = useStore((s) => s.theme);
  const themeData = THEMES.find((t) => t.id === themeName) ?? THEMES[0];

  const [r, g, b] = themeData.rgb;

  return {
    ...COLORS,
    ac: themeData.ac,
    acStrong: themeData.acStrong,
    acDim: `rgba(${r},${g},${b},0.12)`,
    acGlow: `rgba(${r},${g},${b},0.22)`,
  };
}
