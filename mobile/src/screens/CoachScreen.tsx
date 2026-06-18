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
import { EV_FONTS as F } from '../constants/theme';
import { useEvolve, type EvolveColors } from '../hooks/useEvolve';
import type { ChatMessage } from '../store/useStore';

const QUICK_PROMPTS = [
  'Hoe gaat het met mijn voortgang?',
  'Geef me een motiverende kick',
  'Analyseer mijn zwaktes',
  'Wat is mijn patroon deze week?',
];

export default function CoachScreen() {
  const E = useEvolve();
  const s = makeStyles(E);
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
  const { total } = getProgress(identity, checks);
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

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
        {!isUser && (
          <View style={s.roleRow}>
            <View style={s.roleDot} />
            <Text style={s.bubbleRole}>COACH</Text>
          </View>
        )}
        <Text style={[s.bubbleText, isUser && s.userBubbleText]}>{item.content}</Text>
      </View>
    );
  }, [s]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            <Text style={s.headerSparkle}>✦ </Text>Coach
          </Text>
          <Text style={s.headerSub}>Persoonlijke AI — kent jouw verhaal</Text>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={s.clearBtn} activeOpacity={0.7}>
          <Text style={s.clearBtnText}>Wissen</Text>
        </TouchableOpacity>
      </View>

      {/* Quick prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.quickPrompts}
        style={s.quickPromptsRow}
      >
        {QUICK_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={s.quickPrompt}
            onPress={() => sendMessage(prompt)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={s.quickPromptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => String(item.ts)}
        renderItem={renderMessage}
        contentContainerStyle={s.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✦</Text>
            <Text style={s.emptyTitle}>Praat met je coach</Text>
            <Text style={s.emptyText}>
              Direct contact met je coach. Hij kent je verhaal, je schaduw, en wat je vandaag wel of
              niet hebt gedaan.
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={s.typing}>
              <ActivityIndicator color={E.gold} size="small" />
              <Text style={s.typingText}>Coach denkt na…</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Wat speelt er…"
            placeholderTextColor={E.faint}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: input.trim() && !loading ? E.gold : E.s2 }]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            <Text style={[s.sendBtnText, { color: input.trim() && !loading ? E.goldText : E.faint }]}>
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(E: EvolveColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: E.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: E.line,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 23,
    color: E.ink,
    letterSpacing: -0.4,
  },
  headerSparkle: {
    color: E.gold,
  },
  headerSub: {
    fontFamily: F.body,
    color: E.dim,
    fontSize: 12.5,
    marginTop: 3,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: E.line2,
  },
  clearBtnText: {
    fontFamily: F.mono,
    color: E.dim,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  quickPromptsRow: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: E.line,
  },
  quickPrompts: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 8,
  },
  quickPrompt: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: E.warmBorder,
    backgroundColor: E.s1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickPromptText: {
    fontFamily: F.bodyMed,
    fontSize: 12.5,
    color: E.gold2,
  },
  messages: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: E.gold,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: E.s1,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: E.line,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: E.gold,
    shadowColor: E.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleRole: {
    fontFamily: F.mono,
    fontSize: 9,
    color: E.gold,
    letterSpacing: 2,
  },
  bubbleText: {
    fontFamily: F.body,
    color: E.ink,
    fontSize: 14.5,
    lineHeight: 22,
  },
  userBubbleText: {
    fontFamily: F.bodyMed,
    color: E.goldText,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 38,
    color: E.gold,
    opacity: 0.4,
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: F.display,
    fontSize: 17,
    color: E.dim,
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: F.body,
    color: E.faint,
    fontSize: 13.5,
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
    fontFamily: F.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: E.dim,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: E.line,
    backgroundColor: E.bg,
  },
  input: {
    flex: 1,
    backgroundColor: E.s1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: E.ink,
    fontFamily: F.body,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: E.line,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 19,
    fontWeight: '700',
  },
  });
}
