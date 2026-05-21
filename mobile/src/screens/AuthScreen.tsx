import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import API from '../api/client';
import { useTheme } from '../hooks/useTheme';

type Mode = 'login' | 'register' | 'offline';

export default function AuthScreen() {
  const colors = useTheme();
  const setToken = useStore((s) => s.setToken);
  const setEmail = useStore((s) => s.setEmail);
  const setProfile = useStore((s) => s.setProfile);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = makeStyles(colors);

  async function handleLogin() {
    if (!email || !password) {
      setError('Vul alle velden in.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.login(email, password);
      if (res?.token) {
        setToken(res.token);
        setEmail(res.email ?? email);
      } else {
        setError('Inloggen mislukt. Controleer je gegevens.');
      }
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email || !password || !confirm) {
      setError('Vul alle velden in.');
      return;
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.register(email, password);
      if (res?.token) {
        setToken(res.token);
        setEmail(res.email ?? email);
      } else {
        setError('Registratie mislukt. Probeer opnieuw.');
      }
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  function handleOffline() {
    // Set a dummy profile indicator so navigation moves forward
    // without a real server token — identity check in RootNavigator handles the rest
    setToken('offline');
    setEmail('offline');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>OPERATION YOU</Text>
            <Text style={styles.subtitle}>75 DAGEN. 12 WETTEN. GEEN EXCUSES.</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && { borderBottomColor: colors.ac, borderBottomWidth: 2 }]}
              onPress={() => { setMode('login'); setError(''); }}
            >
              <Text style={[styles.tabText, mode === 'login' && { color: colors.ac }]}>
                Inloggen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && { borderBottomColor: colors.ac, borderBottomWidth: 2 }]}
              onPress={() => { setMode('register'); setError(''); }}
            >
              <Text style={[styles.tabText, mode === 'register' && { color: colors.ac }]}>
                Registreren
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="E-mailadres"
              placeholderTextColor="#4a5363"
              value={email}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Wachtwoord"
              placeholderTextColor="#4a5363"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="Bevestig wachtwoord"
                placeholderTextColor="#4a5363"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.ac }]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#08090c" />
              ) : (
                <Text style={styles.btnText}>
                  {mode === 'login' ? 'INLOGGEN' : 'REGISTREREN'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Offline option */}
          <View style={styles.offlineSection}>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.offlineBtn} onPress={handleOffline}>
              <Text style={styles.offlineText}>Offline verdergaan →</Text>
            </TouchableOpacity>
            <Text style={styles.offlineHint}>
              Geen account nodig. Je voortgang wordt lokaal opgeslagen.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#08090c',
    },
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.ac,
      letterSpacing: 4,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 11,
      color: '#4a5363',
      letterSpacing: 2,
    },
    tabRow: {
      flexDirection: 'row',
      marginBottom: 24,
      borderBottomColor: 'rgba(255,255,255,0.06)',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomColor: 'transparent',
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4a5363',
    },
    form: {
      gap: 12,
    },
    input: {
      backgroundColor: '#10131a',
      borderRadius: 10,
      padding: 14,
      color: '#f4f7fb',
      fontSize: 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    error: {
      color: '#ff7a85',
      fontSize: 13,
      textAlign: 'center',
      marginTop: 4,
    },
    btn: {
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    btnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#08090c',
      letterSpacing: 2,
    },
    offlineSection: {
      marginTop: 40,
      alignItems: 'center',
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginBottom: 24,
    },
    offlineBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    offlineText: {
      color: '#7a8395',
      fontSize: 15,
      fontWeight: '600',
    },
    offlineHint: {
      color: '#4a5363',
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
    },
  });
}
