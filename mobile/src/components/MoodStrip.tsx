import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const MOODS = [
  { value: 1, emoji: '💀', label: 'Slecht' },
  { value: 2, emoji: '😤', label: 'Moe' },
  { value: 3, emoji: '😐', label: 'Neutraal' },
  { value: 4, emoji: '💪', label: 'Goed' },
  { value: 5, emoji: '🔥', label: 'Top' },
];

interface Props {
  value: number | undefined;
  onChange: (v: number) => void;
}

export default function MoodStrip({ value, onChange }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.row}>
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <TouchableOpacity
            key={m.value}
            style={[
              styles.btn,
              {
                backgroundColor: active ? colors.acDim : '#10131a',
                borderColor: active ? colors.ac : 'rgba(255,255,255,0.06)',
              },
            ]}
            onPress={() => onChange(m.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.label, { color: active ? colors.ac : '#4a5363' }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
