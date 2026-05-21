import React from 'react';
import { View, StyleSheet } from 'react-native';
import { dateForDay, today } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import type { Identity } from '../store/useStore';

interface Props {
  startDate: string | null;
  checks: Record<string, Record<string, boolean>>;
  fails: Array<{ date: string }>;
  identity: Identity | null;
  size?: 'small' | 'large';
}

export default function DotGrid({ startDate, checks, fails, identity, size = 'large' }: Props) {
  const colors = useTheme();
  const todayStr = today();
  const rules = identity?.rules ?? [];
  const total = rules.length;
  const dotSize = size === 'small' ? 8 : 12;
  const gap = size === 'small' ? 4 : 5;

  function getDotColor(dayIndex: number): string {
    const date = dateForDay(startDate, dayIndex + 1);
    const isFuture = date > todayStr;
    const isToday = date === todayStr;

    if (isFuture) return '#1a1e28';
    if (isToday) return colors.ac;

    const isFail = fails.some((f) => f.date === date);
    if (isFail) return colors.red;

    const dayChecks = checks[date] ?? {};
    const done = Object.values(dayChecks).filter(Boolean).length;

    if (total === 0) return '#1a1e28';
    if (done === 0) return colors.red;
    if (done < total) return colors.orange;
    return colors.green;
  }

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: 75 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: getDotColor(i),
            },
          ]}
        />
      ))}
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
