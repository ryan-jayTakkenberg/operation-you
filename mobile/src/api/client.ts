import * as SecureStore from 'expo-secure-store';

// Change for production:
const BASE_URL = 'http://localhost:3001/api';
const TOKEN_KEY = '75h6-token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      console.warn(`[API] ${path} responded ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn('[API] request failed:', err);
    return null;
  }
}

export const API = {
  async login(email: string, password: string): Promise<{ token: string; email: string } | null> {
    const res = await request<{ token: string; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.token) {
      await saveToken(res.token);
    }
    return res;
  },

  async register(email: string, password: string): Promise<{ token: string; email: string } | null> {
    const res = await request<{ token: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.token) {
      await saveToken(res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    await clearToken();
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await getToken();
    return !!token;
  },

  syncState(state: unknown): void {
    // Fire and forget — don't await
    request('/state/sync', {
      method: 'POST',
      body: JSON.stringify({ state }),
    }).catch(() => {});
  },

  async pullState(): Promise<unknown | null> {
    return request('/state/pull');
  },

  async claude(payload: {
    model?: string;
    max_tokens?: number;
    messages: Array<{ role: string; content: string }>;
    system?: string;
  }): Promise<{ content: Array<{ text: string }> } | null> {
    return request('/claude', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async healthCheck(): Promise<boolean> {
    const res = await request<{ ok: boolean }>('/health');
    return res?.ok === true;
  },
};

export default API;
