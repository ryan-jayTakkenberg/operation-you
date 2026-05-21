// ═══════════════════════════════
// NOTIFICATIONS (PWA local)
// ═══════════════════════════════
function ensureNotifSettings(){
  if(!S.notif) S.notif = {
    morning: {enabled:false, time:'07:00'},
    evening: {enabled:false, time:'21:00'},
    lastFired: {}
  };
  if(!S.notif.lastFired) S.notif.lastFired = {};
}

function isStandalone(){
  return (window.matchMedia('(display-mode: standalone)').matches) ||
         (window.navigator.standalone === true);
}

function renderNotifSettings(){
  ensureNotifSettings();
  const mTog = document.getElementById('notif-toggle-morning');
  const eTog = document.getElementById('notif-toggle-evening');
  const mTime = document.getElementById('notif-time-morning');
  const eTime = document.getElementById('notif-time-evening');
  if(!mTog) return;

  mTog.classList.toggle('on', S.notif.morning.enabled);
  eTog.classList.toggle('on', S.notif.evening.enabled);
  mTime.value = S.notif.morning.time;
  eTime.value = S.notif.evening.time;

  const statusEl = document.getElementById('notif-status');
  const txt = document.getElementById('notif-status-text');
  const ic = statusEl.querySelector('.notif-status-ic');
  const testBtn = document.getElementById('notif-test-btn');

  statusEl.classList.remove('warn','err');

  if(!('Notification' in window)){
    statusEl.classList.add('err');
    ic.textContent = '⚠';
    txt.innerHTML = 'Notificaties worden niet ondersteund in deze browser.';
    testBtn.disabled = true;
    return;
  }

  if(!isStandalone()){
    statusEl.classList.add('warn');
    ic.textContent = '⚠';
    txt.innerHTML = '<strong>App nog niet op beginscherm.</strong><br>iOS Safari: druk op het deel-icoon (⎘) → "Zet op beginscherm". Daarna open app vanaf beginscherm en notificaties werken.';
    testBtn.disabled = false;
    return;
  }

  const perm = Notification.permission;
  if(perm === 'denied'){
    statusEl.classList.add('err');
    ic.textContent = '⚠';
    txt.innerHTML = 'Notificaties zijn geblokkeerd. Schakel in via: iPhone Instellingen → Notificaties → OPERATION YOU.';
    testBtn.disabled = true;
    return;
  }
  if(perm === 'default'){
    ic.textContent = 'ⓘ';
    txt.innerHTML = 'App staat op beginscherm. <strong>Druk op test om toestemming te geven.</strong>';
    testBtn.disabled = false;
    return;
  }
  ic.textContent = '✓';
  statusEl.style.borderLeftColor = 'var(--green)';
  const anyOn = S.notif.morning.enabled || S.notif.evening.enabled;
  txt.innerHTML = anyOn
    ? 'Notificaties actief. Schakelaars hierboven bepalen wanneer je een seintje krijgt.'
    : 'Toestemming gegeven. Zet schakelaars hierboven aan om actief te worden.';
  testBtn.disabled = false;
}

function toggleNotif(which){
  ensureNotifSettings();
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission().then(p=>{
      if(p === 'granted'){
        S.notif[which].enabled = !S.notif[which].enabled;
        save();
        renderNotifSettings();
      } else {
        renderNotifSettings();
      }
    });
    return;
  }
  if('Notification' in window && Notification.permission === 'denied'){
    renderNotifSettings();
    return;
  }
  S.notif[which].enabled = !S.notif[which].enabled;
  save();
  renderNotifSettings();
}

function updateNotifTime(which, value){
  ensureNotifSettings();
  S.notif[which].time = value;
  save();
}

function testNotification(){
  if(!('Notification' in window)){
    alert('Notificaties niet ondersteund in deze browser.');
    return;
  }
  if(Notification.permission === 'default'){
    Notification.requestPermission().then(p=>{
      if(p === 'granted') sendTestNotif();
      renderNotifSettings();
    });
    return;
  }
  if(Notification.permission === 'denied'){
    alert('Notificaties zijn geblokkeerd. Schakel in via iPhone Instellingen → Notificaties → OPERATION YOU.');
    return;
  }
  sendTestNotif();
}

function sendTestNotif(){
  try {
    const n = new Notification('OPERATION YOU — Test', {
      body: 'Notificaties werken. Vandaag is dag '+dayNum()+' van 75.',
      tag: 'oy-test',
      icon: 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 180 180\'><rect width=\'180\' height=\'180\' fill=\'%23ebe6d8\'/><text x=\'50%25\' y=\'54%25\' font-family=\'Courier New,monospace\' font-weight=\'900\' font-size=\'72\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%231a1a1a\'>OY</text></svg>'
    });
    n.onclick = ()=>{window.focus();n.close();};
  } catch(e){
    alert('Kon notificatie niet sturen: '+e.message);
  }
}

function checkScheduledNotifs(){
  if(!('Notification' in window) || Notification.permission !== 'granted') return;
  ensureNotifSettings();
  const now = new Date();
  const td = today();
  const hhmm = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');

  ['morning','evening'].forEach(which=>{
    const cfg = S.notif[which];
    if(!cfg.enabled) return;
    if(cfg.time !== hhmm) return;
    const fireKey = td + '-' + which;
    if(S.notif.lastFired[fireKey]) return;

    let title = '';
    let body = '';
    const n = dayNum();
    if(which === 'morning'){
      title = 'OPERATION YOU — Dag ' + n;
      const q = (S.dayQuotes && S.dayQuotes[td]) ? (S.dayQuotes[td].text || S.dayQuotes[td]) : '';
      body = q || 'Tijd om in te checken. Wat is je eerste wet vandaag?';
    } else {
      const c = S.checks[td] || {};
      const rs = rules();
      const done = rs.filter(r=>c[r.id]).length;
      const missing = rs.length - done;
      title = 'OPERATION YOU — Avond-check';
      if(done === rs.length){
        body = 'Alle ' + rs.length + ' wetten gehaald 🔥 Dag ' + n + ' is van jou.';
      } else if(done === 0){
        body = 'Dag ' + n + ' — nog niets afgevinkt. Wat ga je nu doen?';
      } else {
        body = 'Dag ' + n + ' — nog ' + missing + ' wet' + (missing===1?'':'ten') + ' te gaan. Maak ze af.';
      }
    }

    try {
      const notif = new Notification(title, {body, tag:'oy-'+which+'-'+td});
      notif.onclick = ()=>{window.focus();notif.close();};
      S.notif.lastFired[fireKey] = true;
      Object.keys(S.notif.lastFired).forEach(k=>{
        const datePart = k.slice(0,10);
        if(datePart < td){
          const dDate = new Date(datePart);
          const tDate = new Date(td);
          if((tDate - dDate)/86400000 > 3) delete S.notif.lastFired[k];
        }
      });
      save();
    } catch(e){
      console.warn('Notif fire failed:', e);
    }
  });
}

function startNotifScheduler(){
  ensureNotifSettings();
  setTimeout(checkScheduledNotifs, 5000);
  setInterval(checkScheduledNotifs, 60000);
}
