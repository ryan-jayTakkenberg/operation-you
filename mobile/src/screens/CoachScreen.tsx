import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore, today, dayNum, getRules, getProgress } from '../store/useStore';
import { claudeCall, buildCoachContext } from '../api/claude';
import { useTheme } from '../hooks/useTheme';
import type { ChatMessage } from '../store/useStore';

const QUICK_PROMPTS = [
  'Hoe gaat het met mijn voortgang?',
  'Geef me een motiverende kick',
  'Analyseer mijn zwaktes',
  'Wat is mijn patroon deze week?',
];

export default function CoachScreen() {
  const colors = useTheme();
  const profile = useStore((s) => s.profile);
  const identity = useStore((s) => s.identity);
  const startDate = useStore((s) => s.startDate);
  const checks = useStore((s) => s.checks);
  const mood = useStore((s) => s.mood);
  const apiKey = useStore((s) => s.apiKey);
  const chatMessages = useStore((s) => s.chat);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const clearChat = useStore((s) => s.clearChat);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const rules = getRules(identity);
  const { done, total } = getProgress(identity, checks);
  const currentDay = dayNum(startDate);

  function buildSystemPrompt(): string {
    const context = buildCoachContext(profile, identity);
    const todayStr = today();
    const dayChecks = checks[todayStr] ?? {};
    const todayDone = rules.filter((r) => dayChecks[r.id]).length;
    const currentMood = mood[todayStr];

    return `${context}

=== HUIDIGE STATUS ===
Dag: ${currentDay}/75
Vandaag: ${todayDone}/${total} wetten voltooid
Stemming: ${currentMood ? `${currentMood}/5` : 'niet opgegeven'}

Je bent een persoonlijke discipline coach. Wees direct, eerlijk en motiverend. Gebruik de persoonlijke context altijd. Reageer in het Nederlands.`;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), ts: Date.now() };
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    // Use last 20 messages for context
    const allMsgs = [...useStore.getState().chat];
    const recent = allMsgs.slice(-20);
    const messages = recent.map((m) => ({ role: m.role, content: m.content }));

    const result = await claudeCall(messages, {
      system: buildSystemPrompt(),
      maxTokens: 500,
      apiKey,
    });

    if (result) {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result,
        ts: Date.now(),
      };
      addChatMessage(assistantMsg);
    } else {
      addChatMessage({
        role: 'assistant',
        content: 'Kon geen verbinding maken. Controleer je API sleutel of internetverbinding.',
        ts: Date.now(),
      });
    }

    setLoading(false);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  function handleClearChat() {
    Alert.alert(
      'Chat wissen',
      'Weet je zeker dat je de chat wilt wissen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Wissen', style: 'destructive', onPress: clearChat },
      ]
    );
  }

  const styles = makeStyles(colors);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            { backgroundColor: isUser ? colors.acDim : '#10131a' },
          ]}
        >
          {!isUser && (
            <Text style={[styles.bubbleRole, { color: colors.ac }]}>COACH</Text>
          )}
          <Text style={[styles.bubbleText, isUser && { color: colors.acStrong }]}>
            {item.content}
          </Text>
        </View>
      );
    },
    [colors]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>COACH</Text>
          <Text style={styles.headerSub}>
            {identity?.name ?? 'Operation You'} · Dag {currentDay}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Wissen</Text>
        </TouchableOpacity>
      </View>

      {/* Quick prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickPrompts}
        style={styles.quickPromptsRow}
      >
        {QUICK_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={[styles.quickPrompt, { borderColor: colors.acDim }]}
            onPress={() => sendMessage(prompt)}
            disabled={loading}
          >
            <Text style={[styles.quickPromptText, { color: colors.ac }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => String(item.ts)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>◎</Text>
            <Text style={styles.emptyText}>
              Hoi {profile?.name ?? 'soldaat'}.{'\n'}
              Ik ben je persoonlijke coach.{'\n'}
              Wat heb je op je hart?
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.typing}>
              <ActivityIndicator color={colors.ac} size="small" />
              <Text style={[styles.typingText, { color: colors.muted }]}>Coach typt…</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputRow, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
          <TextInput
            style={styles.input}
            placeholder="Bericht…"
            placeholderTextColor="#4a5363"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? colors.ac : '#1a1e28' },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={[styles.sendBtnText, { color: input.trim() && !loading ? '#08090c' : '#4a5363' }]}>
              ↑
            </Text>
          </TouchableOpacity>
        </View>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: '#f4f7fb',
      letterSpacing: 3,
    },
    headerSub: {
      color: '#4a5363',
      fontSize: 12,
      marginTop: 2,
    },
    clearBtn: {
      padding: 8,
    },
    clearBtnText: {
      color: '#4a5363',
      fontSize: 13,
    },
    quickPromptsRow: {
      flexGrow: 0,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    quickPrompts: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    quickPrompt: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    quickPromptText: {
      fontSize: 12,
      fontWeight: '600',
    },
    messages: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      flexGrow: 1,
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    userBubble: {
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    bubbleRole: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 6,
    },
    bubbleText: {
      color: '#f4f7fb',
      fontSize: 14,
      lineHeight: 21,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyTitle: {
      fontSize: 48,
      color: '#1a1e28',
      marginBottom: 16,
    },
    emptyText: {
      color: '#4a5363',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
    },
    typing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    typingText: {
      fontSize: 13,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
    },
    input: {
      flex: 1,
      backgroundColor: '#10131a',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: '#f4f7fb',
      fontSize: 15,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnText: {
      fontSize: 18,
      fontWeight: '700',
    },
    muted: {
      color: '#7a8395',
    },
  });
}
