import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Rule {
  id: string;
  text: string;
  section: string;
}

export interface Profile {
  name: string;
  age: number;
  daily: string;
  energy: string;
  story: string;
  strengths: string;
  weak: string;
  goal: string;
}

export interface Identity {
  name: string;
  manifesto: string;
  shadow: string;
  rules: Rule[];
  why?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface Entry {
  date: string;
  note?: string;
  dream?: string;
  photo?: string;
  aiFb?: string;
}

export interface WhoopData {
  rec?: number;
  hrv?: number;
  slp?: number;
  str?: number;
  cal?: number;
}

export interface AppState {
  profile: Profile | null;
  identity: Identity | null;
  startDate: string | null;
  checks: Record<string, Record<string, boolean>>;
  fails: Array<{ date: string }>;
  entries: Entry[];
  whoop: Record<string, WhoopData>;
  milestones: Record<string, boolean>;
  chat: ChatMessage[];
  mood: Record<string, number>;
  theme: string;
  apiKey: string;
  token: string | null;
  email: string | null;
  dayQuotes: Record<string, string>;

  // Actions
  setProfile: (profile: Profile) => void;
  setIdentity: (identity: Identity) => void;
  setStartDate: (date: string) => void;
  toggleCheck: (date: string, ruleId: string) => void;
  addFail: (date: string) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (date: string, updates: Partial<Entry>) => void;
  setMood: (date: string, value: number) => void;
  setTheme: (theme: string) => void;
  setApiKey: (key: string) => void;
  setToken: (token: string | null) => void;
  setEmail: (email: string | null) => void;
  setDayQuote: (date: string, quote: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setMilestone: (key: string) => void;
  setWhoopData: (date: string, data: WhoopData) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  identity: null,
  startDate: null,
  checks: {},
  fails: [],
  entries: [],
  whoop: {},
  milestones: {},
  chat: [],
  mood: {},
  theme: 'arctic',
  apiKey: '',
  token: null,
  email: null,
  dayQuotes: {},
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile }),
      setIdentity: (identity) => set({ identity }),
      setStartDate: (date) => set({ startDate: date }),

      toggleCheck: (date, ruleId) =>
        set((state) => {
          const dayChecks = { ...(state.checks[date] ?? {}) };
          dayChecks[ruleId] = !dayChecks[ruleId];
          return { checks: { ...state.checks, [date]: dayChecks } };
        }),

      addFail: (date) =>
        set((state) => ({
          fails: [...state.fails.filter((f) => f.date !== date), { date }],
        })),

      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries.filter((e) => e.date !== entry.date), entry],
        })),

      updateEntry: (date, updates) =>
        set((state) => {
          const existing = state.entries.find((e) => e.date === date) ?? { date };
          return {
            entries: [
              ...state.entries.filter((e) => e.date !== date),
              { ...existing, ...updates },
            ],
          };
        }),

      setMood: (date, value) =>
        set((state) => ({ mood: { ...state.mood, [date]: value } })),

      setTheme: (theme) => set({ theme }),
      setApiKey: (apiKey) => set({ apiKey }),
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }),

      setDayQuote: (date, quote) =>
        set((state) => ({ dayQuotes: { ...state.dayQuotes, [date]: quote } })),

      addChatMessage: (msg) =>
        set((state) => ({ chat: [...state.chat, msg] })),

      clearChat: () => set({ chat: [] }),

      setMilestone: (key) =>
        set((state) => ({ milestones: { ...state.milestones, [key]: true } })),

      setWhoopData: (date, data) =>
        set((state) => ({ whoop: { ...state.whoop, [date]: data } })),

      reset: () => set({ ...initialState }),
    }),
    {
      name: '75h6-mobile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Pure helper functions ───────────────────────────────────────────────────

export function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return localDate(new Date());
}

export function startDateObj(startDate: string | null): Date {
  if (!startDate) return new Date();
  const [y, m, d] = startDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayNum(startDate: string | null): number {
  if (!startDate) return 0;
  const start = startDateObj(startDate);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(Math.max(diff + 1, 1), 75);
}

export function dateForDay(startDate: string | null, n: number): string {
  if (!startDate) return today();
  const start = startDateObj(startDate);
  const d = new Date(start);
  d.setDate(d.getDate() + n - 1);
  return localDate(d);
}

export function getRules(identity: AppState['identity']): Rule[] {
  return identity?.rules ?? [];
}

export function getProgress(
  identity: AppState['identity'],
  checks: AppState['checks']
): { done: number; total: number } {
  const rules = getRules(identity);
  const t = today();
  const dayChecks = checks[t] ?? {};
  const done = rules.filter((r) => dayChecks[r.id]).length;
  return { done, total: rules.length };
}
