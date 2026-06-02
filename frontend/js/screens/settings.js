// ═══════════════════════════════
// SETTINGS OVERLAY & SUBPAGES
// ═══════════════════════════════
function openSettings(){
  document.getElementById('settings-overlay').classList.add('open');
  const c = document.getElementById('settings-build-count');
  if(c){
    const open = (S.backlog||[]).filter(b=>b.status!=='done').length;
    c.textContent = open;
  }
  const notifDesc = document.getElementById('settings-notif-desc');
  if(notifDesc){
    ensureNotifSettings();
    const m = S.notif.morning.enabled, e = S.notif.evening.enabled;
    if(m && e) notifDesc.textContent = 'Ochtend + avond actief';
    else if(m) notifDesc.textContent = 'Alleen ochtend actief';
    else if(e) notifDesc.textContent = 'Alleen avond actief';
    else notifDesc.textContent = 'Uitgeschakeld';
  }
  const apiDesc = document.getElementById('settings-api-desc');
  if(apiDesc){
    const k = getApiKey();
    apiDesc.textContent = k ? 'Ingesteld — werkt overal' : 'Niet ingesteld';
  }
}

function closeSettings(){
  document.getElementById('settings-overlay').classList.remove('open');
  document.querySelectorAll('.subpage.open').forEach(el=>el.classList.remove('open'));
}

function openSubpage(name){
  const el = document.getElementById('subpage-'+name);
  if(!el) return;
  if(name==='spiegel') renderSpiegelInSubpage();
  if(name==='build') renderBacklogInSubpage();
  if(name==='whoop') renderWhoopInSubpage();
  if(name==='notif') renderNotifInSubpage();
  if(name==='apikey') renderApikeyInSubpage();
  if(name==='casino') renderCasinoInSubpage();
  el.classList.add('open');
}

function closeSubpage(name){
  const el = document.getElementById('subpage-'+name);
  if(el) el.classList.remove('open');
}

function renderSpiegelInSubpage(){
  const body = document.getElementById('subpage-spiegel-body');
  body.innerHTML = `
    <div class="spiegel-header">
      <div class="spiegel-eyebrow">Jouw spiegel</div>
      <div class="spiegel-name" id="sp-challenge-name-sub">JOUW <span>75</span></div>
      <div class="spiegel-tag" id="sp-tag-sub">—</div>
    </div>
    <div id="sp-scroll-sub"></div>
  `;
  const orig = {
    name: document.getElementById('sp-challenge-name'),
    tag: document.getElementById('sp-tag'),
    scroll: document.getElementById('sp-scroll')
  };
  if(orig.name) orig.name.id = 'sp-challenge-name-orig';
  if(orig.tag) orig.tag.id = 'sp-tag-orig';
  if(orig.scroll) orig.scroll.id = 'sp-scroll-orig';
  document.getElementById('sp-challenge-name-sub').id = 'sp-challenge-name';
  document.getElementById('sp-tag-sub').id = 'sp-tag';
  document.getElementById('sp-scroll-sub').id = 'sp-scroll';
  renderSpiegel();
  document.getElementById('sp-challenge-name').id = 'sp-challenge-name-sub';
  document.getElementById('sp-tag').id = 'sp-tag-sub';
  document.getElementById('sp-scroll').id = 'sp-scroll-sub';
  if(orig.name) orig.name.id = 'sp-challenge-name';
  if(orig.tag) orig.tag.id = 'sp-tag';
  if(orig.scroll) orig.scroll.id = 'sp-scroll';
}

function renderBacklogInSubpage(){
  const body = document.getElementById('subpage-build-body');
  body.innerHTML = `
    <div class="bl-quick">
      <input class="bl-quick-in" id="bl-quick-input" placeholder="Idee toevoegen…" onkeydown="if(event.key==='Enter')quickAddIssue()">
      <button class="bl-quick-btn" onclick="quickAddIssue()">+ Add</button>
    </div>
    <div class="bl-filters" id="bl-filters"></div>
    <div id="bl-list"></div>
  `;
  renderBacklog();
}

function renderWhoopInSubpage(){
  const body = document.getElementById('subpage-whoop-body');
  body.innerHTML = `
    <div style="padding:14px 22px;border-bottom:1px solid var(--line)">
      <div style="font-size:11px;color:var(--muted);font-weight:300" id="whoop-date-lbl">Vandaag</div>
    </div>
    <div class="whoop-page-body">
      <div class="w-card">
        <div class="w-card-top"><div class="w-clbl rc">Recovery</div><div><span class="w-big rc" id="wv-rec">—</span><span class="w-unit">%</span></div></div>
        <div class="w-bar-wrap"><div class="w-bar-bg"><div class="w-bar-f rc" id="wb-rec" style="width:0%"></div></div></div>
        <div class="w-inputs">
          <div class="w-ig"><div class="w-il">Recovery (%)</div><input class="w-in" type="number" id="wi-rec" min="0" max="100" placeholder="0–100"></div>
          <div class="w-ig"><div class="w-il">HRV (ms)</div><input class="w-in" type="number" id="wi-hrv" placeholder="bijv. 65"></div>
        </div>
      </div>
      <div class="w-card">
        <div class="w-card-top"><div class="w-clbl sl">Slaap</div><div><span class="w-big sl" id="wv-slp">—</span><span class="w-unit">uur</span></div></div>
        <div class="w-bar-wrap"><div class="w-bar-bg"><div class="w-bar-f sl" id="wb-slp" style="width:0%"></div></div></div>
        <div class="w-inputs">
          <div class="w-ig"><div class="w-il">Slaapuren</div><input class="w-in" type="number" id="wi-slp" min="0" max="12" step="0.1" placeholder="bijv. 7.5"></div>
          <div class="w-ig"><div class="w-il">Slaapscore (%)</div><input class="w-in" type="number" id="wi-slps" min="0" max="100" placeholder="0–100"></div>
        </div>
      </div>
      <div class="w-card">
        <div class="w-card-top"><div class="w-clbl st">Strain</div><div><span class="w-big st" id="wv-str">—</span><span class="w-unit">/21</span></div></div>
        <div class="w-bar-wrap"><div class="w-bar-bg"><div class="w-bar-f st" id="wb-str" style="width:0%"></div></div></div>
        <div class="w-inputs">
          <div class="w-ig"><div class="w-il">Strain (0–21)</div><input class="w-in" type="number" id="wi-str" min="0" max="21" step="0.1" placeholder="bijv. 14.2"></div>
          <div class="w-ig"><div class="w-il">Calorieën</div><input class="w-in" type="number" id="wi-cal" placeholder="bijv. 3200"></div>
        </div>
      </div>
      <button class="w-save" onclick="saveWhoop()">Opslaan</button>
      <button class="w-ai-btn" onclick="whoopAI()">Claude: hoe zwaar train ik vandaag?</button>
      <div class="w-ai-res hidden" id="w-ai-res"></div>
      <div class="w-card">
        <div style="padding:12px 16px 8px"><div class="w-hist-title">Laatste 7 dagen</div></div>
        <div id="w-hist"></div>
        <div style="height:6px"></div>
      </div>
    </div>
  `;
  renderWhoop();
}

function renderNotifInSubpage(){
  const body = document.getElementById('subpage-notif-body');
  body.innerHTML = `
    <div style="padding:20px 22px">
      <div class="notif-section">
        <div class="notif-title">Dagelijkse reminders</div>
        <div class="notif-sub">Werkt alleen als je de app op je beginscherm hebt staan (iOS Safari → Deel → "Zet op beginscherm").</div>
        <div class="notif-row">
          <div class="notif-info">
            <div class="notif-info-lbl">Ochtend-reminder</div>
            <div class="notif-info-sub">Start je dag met je quote</div>
          </div>
          <input class="notif-time" type="time" id="notif-time-morning" value="07:00" onchange="updateNotifTime('morning',this.value)">
          <div class="toggle" id="notif-toggle-morning" onclick="toggleNotif('morning')"><div class="toggle-knob"></div></div>
        </div>
        <div class="notif-row">
          <div class="notif-info">
            <div class="notif-info-lbl">Avond-check</div>
            <div class="notif-info-sub">Nudge als nog niet alles is afgevinkt</div>
          </div>
          <input class="notif-time" type="time" id="notif-time-evening" value="21:00" onchange="updateNotifTime('evening',this.value)">
          <div class="toggle" id="notif-toggle-evening" onclick="toggleNotif('evening')"><div class="toggle-knob"></div></div>
        </div>
        <div class="notif-status" id="notif-status">
          <span class="notif-status-ic">ⓘ</span>
          <span id="notif-status-text">…</span>
        </div>
        <button class="notif-test" id="notif-test-btn" onclick="testNotification()">Stuur test-notificatie</button>
      </div>
    </div>
  `;
  renderNotifSettings();
}

const DAY_LABELS = ['Zo','Ma','Di','Wo','Do','Vr','Za'];

function renderCasinoInSubpage(){
  const body = document.getElementById('subpage-casino-body');
  if(!body) return;
  const cm = S.casinoMode;
  const on = cm.enabled;
  const days = cm.days||[];
  const label = cm.label||'Nachtdienst';
  const exemptSections = cm.exemptSections||['avond'];
  body.innerHTML = `
    <div style="padding:20px 22px">
      <div class="notif-section">
        <div class="notif-title">Werkschema</div>
        <div class="notif-sub">Stel in op welke dagen bepaalde regels niet gelden — voor nachtdiensten, een vroeg rooster, of andere vaste afwijkingen van je standaard dag.</div>
        <div class="notif-row" style="margin-top:16px">
          <div class="notif-info">
            <div class="notif-info-lbl">Werkschema-uitzonderingen</div>
            <div class="notif-info-sub">${on?`Actief — ${exemptSections.length} secties vrijgesteld op geselecteerde dagen`:'Uitgeschakeld'}</div>
          </div>
          <div class="toggle${on?' on':''}" id="casino-main-toggle" onclick="toggleCasinoMode()"><div class="toggle-knob"></div></div>
        </div>
        <div id="casino-days-wrap" style="${on?'':'opacity:.35;pointer-events:none'}">
          <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.12em;margin:20px 0 6px;text-transform:uppercase">Naam voor deze dagen</div>
          <input type="text" class="ak-input" id="schedule-label-input" value="${escapeHtml(label)}" placeholder="bv. Nachtdienst, Vroegdienst…" oninput="S.casinoMode.label=this.value.trim()||'Nachtdienst';save();" onblur="renderCasinoBanner()" style="margin-bottom:16px">

          <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.12em;margin:0 0 10px;text-transform:uppercase">Op welke dagen</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${[0,1,2,3,4,5,6].map(d=>`
              <button class="casino-day-btn${days.includes(d)?' on':''}" onclick="toggleCasinoDay(${d})">${DAY_LABELS[d]}</button>
            `).join('')}
          </div>

          <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.12em;margin:20px 0 10px;text-transform:uppercase">Vrijgestelde secties</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${Object.entries(SECTION_META).map(([key,meta])=>`
              <button class="casino-day-btn${exemptSections.includes(key)?' on':''}" onclick="toggleExemptSection('${key}')">${meta.name}</button>
            `).join('')}
          </div>
          <div style="font-size:11px;color:var(--dim);margin-top:12px;line-height:1.6">Regels in vrijgestelde secties tellen niet mee op de geselecteerde dagen.</div>
        </div>
      </div>
    </div>
  `;
}

function toggleCasinoMode(){
  S.casinoMode.enabled = !S.casinoMode.enabled;
  save();
  renderCasinoInSubpage();
  renderAll();
}

function toggleCasinoDay(d){
  const idx = (S.casinoMode.days||[]).indexOf(d);
  if(idx===-1) S.casinoMode.days.push(d);
  else S.casinoMode.days.splice(idx,1);
  save();
  renderCasinoInSubpage();
  renderAll();
}

function toggleExemptSection(secKey){
  const cm = S.casinoMode;
  if(!cm.exemptSections) cm.exemptSections = ['avond'];
  const idx = cm.exemptSections.indexOf(secKey);
  if(idx===-1) cm.exemptSections.push(secKey);
  else cm.exemptSections.splice(idx,1);
  save();
  renderCasinoInSubpage();
  renderAll();
}

function renderApikeyInSubpage(){
  const body = document.getElementById('subpage-apikey-body');
  body.innerHTML = `
    <div style="padding:20px 22px">
      <div class="ak-section">
        <div class="ak-status">
          <span class="ak-dot miss" id="ak-dot"></span>
          <span id="ak-status-text">…</span>
        </div>
        <input type="password" class="ak-input" id="ak-input" placeholder="sk-ant-..." autocomplete="off">
        <div class="ak-row">
          <button class="ak-btn primary" onclick="saveApiKey()">Opslaan</button>
          <button class="ak-btn" onclick="clearApiKey()">Wissen</button>
        </div>
        <div class="ak-help">Voor gebruik op je telefoon buiten Claude.ai. Maak gratis een API-key op <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a> en stort min. $5 erop. Key wordt lokaal opgeslagen — gaat niet naar Anthropic of derden.</div>
      </div>
    </div>
  `;
  updateApiKeyStatus();
}
