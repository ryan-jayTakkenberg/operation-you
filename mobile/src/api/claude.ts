import API from './client';
import type { Profile, Identity } from '../store/useStore';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 1024;

export function buildCoachContext(profile: Profile | null, identity: Identity | null): string {
  if (!profile && !identity) return '';

  const lines: string[] = [];
  lines.push('=== GEBRUIKERSPROFIEL ===');

  if (identity) {
    lines.push(`Identiteit: ${identity.name}`);
    lines.push(`Manifest: ${identity.manifesto}`);
    if (identity.shadow) lines.push(`Schaduw: ${identity.shadow}`);
    if (identity.why) lines.push(`Kernmotivatie: ${identity.why}`);
  }

  if (profile) {
    lines.push(`Naam: ${profile.name}, Leeftijd: ${profile.age}`);
    lines.push(`Dagelijks leven: ${profile.daily}`);
    lines.push(`Energie: ${profile.energy}`);
    lines.push(`Verhaal: ${profile.story}`);
    lines.push(`Sterke punten: ${profile.strengths}`);
    lines.push(`Zwakke punten: ${profile.weak}`);
    lines.push(`Dag-75 visie: ${profile.goal}`);
  }

  if (identity?.rules?.length) {
    lines.push('');
    lines.push('=== 12 WETTEN ===');
    for (const r of identity.rules) {
      lines.push(`[${r.section}] ${r.text}`);
    }
  }

  return lines.join('\n');
}

export interface ClaudeOptions {
  system?: string;
  maxTokens?: number;
  apiKey?: string;
  model?: string;
}

export async function claudeCall(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ClaudeOptions = {}
): Promise<string | null> {
  const {
    system,
    maxTokens = DEFAULT_MAX_TOKENS,
    apiKey,
    model = DEFAULT_MODEL,
  } = options;

  const payload = {
    model,
    max_tokens: maxTokens,
    messages,
    ...(system ? { system } : {}),
  };

  // 1. Try server proxy first
  try {
    const res = await API.claude(payload);
    if (res?.content?.[0]?.text) {
      return res.content[0].text;
    }
  } catch {
    // fall through to direct
  }

  // 2. Fallback: direct Anthropic API with user's API key.
  //    Key komt van de store (options.apiKey), anders uit .env (EXPO_PUBLIC_ANTHROPIC_API_KEY).
  const effectiveKey = apiKey || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!effectiveKey) return null;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('[Claude] Direct API error:', res.status);
      return null;
    }

    const data = await res.json() as { content: Array<{ text: string }> };
    return data?.content?.[0]?.text ?? null;
  } catch (err) {
    console.warn('[Claude] Direct API failed:', err);
    return null;
  }
}
