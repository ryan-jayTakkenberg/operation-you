// ═══════════════════════════════
// AUTH — login / register overlay
// ═══════════════════════════════
function showAuth(){
  const ov = document.getElementById('auth-overlay');
  ov.classList.remove('hidden');
  // Show loading state briefly while we check server
  showAuthState('loading');
}

function hideAuth(){
  document.getElementById('auth-overlay').classList.add('hidden');
}

function showAuthState(state){
  document.getElementById('auth-loading').classList.toggle('hidden', state !== 'loading');
  document.getElementById('auth-login-form').classList.toggle('hidden', state !== 'login');
  document.getElementById('auth-register-form').classList.toggle('hidden', state !== 'register');
  document.getElementById('auth-offline').classList.toggle('hidden', state === 'loading');
}

function authShowLogin(){
  document.getElementById('auth-err').classList.add('hidden');
  showAuthState('login');
  setTimeout(()=>{ document.getElementById('auth-email').focus(); }, 100);
}

function authShowRegister(){
  document.getElementById('auth-reg-err').classList.add('hidden');
  showAuthState('register');
  setTimeout(()=>{ document.getElementById('auth-reg-email').focus(); }, 100);
}

function setAuthError(id, msg){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function authDoLogin(){
  const btn = document.getElementById('auth-login-btn');
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value;
  if(!email || !pass){ setAuthError('auth-err','Vul beide velden in.'); return; }
  btn.disabled = true;
  btn.textContent = 'Even wachten…';
  document.getElementById('auth-err').classList.add('hidden');
  const data = await API.login(email, pass);
  btn.disabled = false;
  btn.textContent = 'Inloggen →';
  if(!data || !data.token){
    setAuthError('auth-err', (data&&data.error) || 'Inloggen mislukt. Controleer je gegevens.');
    return;
  }
  await authOnSuccess();
}

async function authDoRegister(){
  const btn = document.getElementById('auth-reg-btn');
  const email = document.getElementById('auth-reg-email').value.trim();
  const pass = document.getElementById('auth-reg-pass').value;
  if(!email || !pass){ setAuthError('auth-reg-err','Vul beide velden in.'); return; }
  if(pass.length < 8){ setAuthError('auth-reg-err','Wachtwoord moet minstens 8 tekens zijn.'); return; }
  btn.disabled = true;
  btn.textContent = 'Even wachten…';
  document.getElementById('auth-reg-err').classList.add('hidden');
  const data = await API.register(email, pass);
  btn.disabled = false;
  btn.textContent = 'Account aanmaken →';
  if(!data || !data.token){
    setAuthError('auth-reg-err', (data&&data.error) || 'Registratie mislukt. Probeer opnieuw.');
    return;
  }
  await authOnSuccess();
}

function authOffline(){
  // Allow using app without account (localStorage only)
  hideAuth();
  bootApp();
}

async function authOnSuccess(){
  // Pull state from server and merge with / replace local state
  const serverState = await API.pullState();
  if(serverState && typeof serverState === 'object'){
    // Server has data — use it
    Object.assign(S, serverState);
    localStorage.setItem('75h6', JSON.stringify(S));
  }
  // Update user email in settings
  updateSettingsUserEmail();
  hideAuth();
  bootApp();
}

async function updateSettingsUserEmail(){
  const el = document.getElementById('settings-user-email');
  if(!el) return;
  const me = await API.isLoggedIn() ? (await (async()=>{
    try {
      const r = await fetch(
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? `http://${window.location.hostname}:3001/api`
          : '/api') + '/auth/me',
        { headers: { 'Authorization': 'Bearer ' + API.token() } }
      );
      return r.ok ? r.json() : null;
    } catch { return null; }
  })()) : null;
  if(me) el.textContent = me.email;
}

async function initAuth(){
  if(API.isLoggedIn()){
    // Token exists — verify it's still valid and pull latest state
    showAuthState('loading');
    const ok = await API.healthCheck();
    if(ok){
      const serverState = await API.pullState();
      if(serverState && typeof serverState === 'object'){
        Object.assign(S, serverState);
        localStorage.setItem('75h6', JSON.stringify(S));
      }
      updateSettingsUserEmail();
      hideAuth();
      bootApp();
    } else {
      // Server unreachable — use local state, show offline option
      hideAuth();
      bootApp();
    }
  } else {
    // No token — check if server is available
    const ok = await API.healthCheck();
    if(ok){
      showAuthState('login');
    } else {
      // Server offline — allow offline mode
      showAuthState('login');
    }
  }
}
