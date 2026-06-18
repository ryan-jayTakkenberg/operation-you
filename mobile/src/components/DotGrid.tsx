import React from 'react';
import { View, StyleSheet } from 'react-native';
import { dateForDay, today } from '../store/useStore';
import { EVOLVE as BASE } from '../constants/theme';
import { useEvolve } from '../hooks/useEvolve';
import type { Identity } from '../store/useStore';

interface Props {
  startDate: string | null;
  checks: Record<string, Record<string, boolean>>;
  fails: Array<{ date: string }>;
  identity: Identity | null;
  size?: 'small' | 'large';
}

// 75-dagen voortgangsraster in Evolve-stijl. Het accent (vandaag + voltooid) volgt
// het gekozen thema via useEvolve; surfaces/semantiek blijven vast.
export default function DotGrid({ startDate, checks, fails, identity, size = 'large' }: Props) {
  const E = useEvolve();
  const todayStr = today();
  const rules = identity?.rules ?? [];
  const total = rules.length;
  const dotSize = size === 'small' ? 8 : 11;
  const gap = size === 'small' ? 5 : 6;

  function getDotColor(dayIndex: number): string {
    const date = dateForDay(startDate, dayIndex + 1);
    const isFuture = date > todayStr;
    const isToday = date === todayStr;

    if (isFuture) return BASE.s2;
    if (isToday) return E.gold;

    const isFail = fails.some((f) => f.date === date);
    if (isFail) return BASE.red;

    const dayChecks = checks[date] ?? {};
    const done = Object.values(dayChecks).filter(Boolean).length;

    if (total === 0) return BASE.s2;
    if (done === 0) return BASE.red;
    if (done < total) return E.gold2;
    return BASE.green;
  }

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: 75 }, (_, i) => {
        const date = dateForDay(startDate, i + 1);
        const isToday = date === todayStr;
        const c = getDotColor(i);
        const partial = c === E.gold2;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: c,
                opacity: partial ? 0.55 : 1,
              },
              isToday && {
                borderWidth: 1.5,
                borderColor: E.gold2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dot: {
    // sizing handled inline
  },
});
