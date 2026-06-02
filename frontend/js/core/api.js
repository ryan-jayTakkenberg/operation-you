// OPERATION YOU — API client
// localStorage-first: app works offline, syncs to server in background
const API = (() => {
  const BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3001/api`
    : '/api';

  let _token = localStorage.getItem('oy_token') || null;

  function token() { return _token; }

  function setToken(t) {
    _token = t;
    if (t) localStorage.setItem('oy_token', t);
    else localStorage.removeItem('oy_token');
  }

  function isLoggedIn() { return !!_token; }

  function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (_token) h['Authorization'] = 'Bearer ' + _token;
    return h;
  }

  async function req(method, path, body) {
    try {
      const opts = { method, headers: authHeaders() };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const r = await fetch(BASE + path, opts);
      if (r.status === 401) {
        const hadToken = !!_token;
        setToken(null);
        if (hadToken && typeof showAuth === 'function') showAuth();
        return null;
      }
      if (!r.ok) {
        const txt = await r.text();
        let msg;
        try { msg = JSON.parse(txt).error; } catch { msg = txt; }
        throw new Error(msg || 'Server error ' + r.status);
      }
      return await r.json();
    } catch (e) {
      if (e.message !== 'Failed to fetch') console.warn('API:', e.message);
      return null;
    }
  }

  async function login(email, password) {
    const data = await req('POST', '/auth/login', { email, password });
    if (data && data.token) setToken(data.token);
    return data;
  }

  async function register(email, password) {
    const data = await req('POST', '/auth/register', { email, password });
    if (data && data.token) setToken(data.token);
    return data;
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('75h6');
    location.reload();
  }

  // Push full state to server — debounced 2s so rapid changes (rule ticks etc.) batch into one request
  let _syncTimer = null;
  function syncState(state) {
    if (!_token) return;
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      req('POST', '/sync', state).catch(() => {});
    }, 2000);
  }

  // Pull full state from server
  async function pullState() {
    if (!_token) return null;
    return req('GET', '/sync');
  }

  // Proxy Claude API call through server (keeps API key server-side)
  async function claude(messages, options) {
    options = options || {};
    const body = {
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 1000,
      messages
    };
    if (options.system) body.system = options.system;
    return req('POST', '/claude', body);
  }

  // Log a workout to server
  async function logWorkout(workout) {
    if (!_token) return null;
    return req('POST', '/workouts', workout);
  }

  async function getWorkouts(date) {
    if (!_token) return [];
    const path = date ? '/workouts/' + date : '/workouts';
    return (await req('GET', path)) || [];
  }

  async function healthCheck() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch(BASE + '/health', { signal: ctrl.signal });
      clearTimeout(t);
      return r.ok;
    } catch { return false; }
  }

  return { token, setToken, isLoggedIn, login, register, logout, syncState, pullState, claude, logWorkout, getWorkouts, healthCheck };
})();
