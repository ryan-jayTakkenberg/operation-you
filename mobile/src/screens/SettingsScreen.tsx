import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { THEMES } from '../constants/theme';
import API from '../api/client';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const colors = useTheme();
  const theme = useStore((s) => s.theme);
  const apiKey = useStore((s) => s.apiKey);
  const token = useStore((s) => s.token);
  const setTheme = useStore((s) => s.setTheme);
  const setApiKey = useStore((s) => s.setApiKey);
  const setToken = useStore((s) => s.setToken);
  const setEmail = useStore((s) => s.setEmail);
  const reset = useStore((s) => s.reset);

  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [morningNotif, setMorningNotif] = useState(false);
  const [eveningNotif, setEveningNotif] = useState(false);

  const styles = makeStyles(colors);

  function handleSaveApiKey() {
    setApiKey(apiKeyInput.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  async function scheduleMorning(enabled: boolean) {
    setMorningNotif(enabled);
    if (!enabled) {
      await Notifications.cancelScheduledNotificationAsync('morning-notif').catch(() => {});
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Toestemming vereist', 'Sta meldingen toe in je instellingen.');
      setMorningNotif(false);
      return;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: 'morning-notif',
      content: {
        title: 'OPERATION YOU',
        body: 'Goedemorgen soldaat. Klaar voor dag ' + new Date().getDate() + '?',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 0 },
    }).catch(() => {});
  }

  async function scheduleEvening(enabled: boolean) {
    setEveningNotif(enabled);
    if (!enabled) {
      await Notifications.cancelScheduledNotificationAsync('evening-notif').catch(() => {});
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Toestemming vereist', 'Sta meldingen toe in je instellingen.');
      setEveningNotif(false);
      return;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: 'evening-notif',
      content: {
        title: 'OPERATION YOU',
        body: 'Heb je je dag al afgesloten? Vul je wetten in.',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 21, minute: 0 },
    }).catch(() => {});
  }

  function handleReset() {
    Alert.alert(
      'Opnieuw beginnen',
      'Dit wist al je voortgang, identiteit en instellingen. Weet je het zeker?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Wissen',
          style: 'destructive',
          onPress: () => {
            reset();
          },
        },
      ]
    );
  }

  async function handleLogout() {
    await API.logout();
    setToken(null);
    setEmail(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Thema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THEMA</Text>
          <View style={styles.themeRow}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.swatch,
                  { backgroundColor: t.ac },
                  theme === t.id && styles.swatchActive,
                ]}
                onPress={() => setTheme(t.id)}
                activeOpacity={0.8}
              >
                {theme === t.id && (
                  <Text style={styles.swatchCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.themeLabels}>
            {THEMES.map((t) => (
              <Text
                key={t.id}
                style={[
                  styles.themeLabel,
                  { color: theme === t.id ? colors.ac : '#4a5363' },
                ]}
              >
                {t.name}
              </Text>
            ))}
          </View>
        </View>

        {/* API Key */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLAUDE API SLEUTEL</Text>
          <Text style={styles.hint}>
            Optioneel. Nodig voor directe AI-verbinding zonder server.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="sk-ant-..."
            placeholderTextColor="#4a5363"
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            secureTextEntry
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: apiKeySaved ? colors.green : colors.ac }]}
            onPress={handleSaveApiKey}
          >
            <Text style={styles.btnText}>
              {apiKeySaved ? '✓ Opgeslagen' : 'Opslaan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notificaties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIES</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Ochtend herinnering</Text>
              <Text style={styles.rowSub}>07:00 — Dagelijkse challenge start</Text>
            </View>
            <Switch
              value={morningNotif}
              onValueChange={scheduleMorning}
              trackColor={{ false: '#1a1e28', true: colors.acDim }}
              thumbColor={morningNotif ? colors.ac : '#4a5363'}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Avond herinnering</Text>
              <Text style={styles.rowSub}>21:00 — Dag afsluiten</Text>
            </View>
            <Switch
              value={eveningNotif}
              onValueChange={scheduleEvening}
              trackColor={{ false: '#1a1e28', true: colors.acDim }}
              thumbColor={eveningNotif ? colors.ac : '#4a5363'}
            />
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFIEL</Text>
          <TouchableOpacity
            style={[styles.dangerBtn, { borderColor: '#ff7a85' }]}
            onPress={handleReset}
          >
            <Text style={styles.dangerBtnText}>Opnieuw beginnen</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        {token && token !== 'offline' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: '#4a5363' }]}
              onPress={handleLogout}
            >
              <Text style={[styles.dangerBtnText, { color: '#7a8395' }]}>Uitloggen</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' },
    scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    section: {
      backgroundColor: '#10131a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    sectionTitle: {
      color: '#7a8395',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 14,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchActive: {
      borderWidth: 3,
      borderColor: '#f4f7fb',
    },
    swatchCheck: {
      color: '#08090c',
      fontSize: 14,
      fontWeight: '800',
    },
    themeLabels: {
      flexDirection: 'row',
      gap: 10,
    },
    themeLabel: {
      width: 40,
      textAlign: 'center',
      fontSize: 9,
    },
    hint: {
      color: '#4a5363',
      fontSize: 12,
      marginBottom: 12,
    },
    input: {
      backgroundColor: '#1a1e28',
      borderRadius: 10,
      padding: 14,
      color: '#f4f7fb',
      fontSize: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      marginBottom: 12,
    },
    btn: {
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    btnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#08090c',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    rowInfo: {
      flex: 1,
    },
    rowLabel: {
      color: '#f4f7fb',
      fontSize: 14,
    },
    rowSub: {
      color: '#4a5363',
      fontSize: 12,
      marginTop: 2,
    },
    dangerBtn: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 14,
      alignItems: 'center',
    },
    dangerBtnText: {
      color: '#ff7a85',
      fontSize: 14,
      fontWeight: '600',
    },
    green: { color: '#5ee3a5' },
  });
}
