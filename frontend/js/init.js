// ═══════════════════════════════
// INIT — keyboard listeners + boot
// ═══════════════════════════════
document.getElementById('auth-pass').addEventListener('keydown', e => { if(e.key==='Enter') authDoLogin(); });
document.getElementById('auth-email').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('auth-pass').focus(); });
document.getElementById('auth-reg-pass').addEventListener('keydown', e => { if(e.key==='Enter') authDoRegister(); });
document.getElementById('auth-reg-email').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('auth-reg-pass').focus(); });

applyTheme(loadTheme());
initAuth();
