import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Rule } from '../store/useStore';

interface Props {
  rule: Rule;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function RuleItem({ rule, checked, onToggle, disabled = false }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.ac : '#323a4a',
            backgroundColor: checked ? colors.acDim : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Text style={[styles.checkmark, { color: colors.ac }]}>✓</Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.text,
          {
            color: checked ? colors.muted : '#f4f7fb',
            textDecorationLine: checked ? 'line-through' : 'none',
          },
        ]}
      >
        {rule.text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  text: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // expose muted for use (not directly used in JSX but documents the intent)
  muted: {
    color: '#7a8395',
  },
});
