// ═══════════════════════════════
// COACH / CHAT TAB
// ═══════════════════════════════
function ensureChat(){
  if(!S.chat) S.chat = [];
}

function autoGrowChat(el){
  el.style.height = 'auto';
  el.style.height = Math.min(120, el.scrollHeight) + 'px';
}

function buildChatSystemPrompt(){
  const p = S.profile || {};
  const id = S.identity || {};
  const n = dayNum();
  const rs = rules();
  const c = todayChecks();
  const done = rs.filter(r=>c[r.id]).length;
  const okRules = rs.filter(r=>c[r.id]).map(r=>r.name);
  const missRules = rs.filter(r=>!c[r.id]).map(r=>r.name);
  const w = S.whoop[today()] || {};

  let totalDone = 0;
  Object.values(S.checks).forEach(v=>{if(rs.length>0 && rs.filter(r=>v[r.id]).length===rs.length) totalDone++;});
  const dreamCount = S.entries.filter(e=>e.dream && e.dream.trim()).length;
  const recentDream = S.entries.slice(-3).filter(e=>e.dream).map(e=>`Dag ${e.dayNum}: ${e.dream.slice(0,120)}`).join(' | ') || 'geen recente droomsessies';

  return `Je bent ${p.name || 'deze persoon'}'s persoonlijke coach. Je kent hem/haar diep.

PROFIEL:
- ${p.name || '?'}, ${p.age || '?'} jaar
- Dagelijks leven: ${(p.daily || '?').slice(0,300)}
- Wat geeft energie: ${(p.energy || '?').slice(0,200)}
- Verhaal: ${(p.story || '?').slice(0,400)}
- Sterktes: ${(p.strengths || '?').slice(0,200)}
- Zwaktes/waar val je in: ${(p.weak || '?').slice(0,300)}
- Wie op dag 75: ${(p.goal || '?').slice(0,200)}

SCHADUW (patroon dat kapot moet):
${id.shadow || '(nog niet ingevuld)'}

DE 12 WETTEN:
${rs.map((r,i)=>`${i+1}. ${r.name}`).join('\n')}

VANDAAG — DAG ${n} VAN 75:
- Wetten gehaald: ${done}/${rs.length}
- Gehaald: ${okRules.join(', ') || 'nog niets'}
- Nog te doen: ${missRules.join(', ') || 'alles klaar 🔥'}
${w.rec!==undefined ? `- Whoop: recovery ${w.rec}%, slaap ${w.slp||'?'}u, strain ${w.str||'?'}/21` : ''}

VOORTGANG TOTAAL:
- Complete dagen: ${totalDone}/${n}
- Droomsessies: ${dreamCount}
- Restarts: ${S.restarts}
- Recente droomwerk: ${recentDream}

JE ROL ALS COACH:
- Directe, eerlijke coach. Geen oppervlakkige motivatie. Geen "je kunt het!".
- Verwijs naar hun specifieke verhaal, zwaktes en schaduw. Niet algemeen.
- Korte responses (2-5 zinnen tenzij ze om uitleg vragen).
- Spreek 'je' aan. Nederlands. Geen markdown (geen ** of *).
- Als ze willen revenge traden, BJJ skippen, of opgeven: stop ze met scherpe vraag of herinnering aan hun dag-75 visie.
- Als ze trots zijn: niet bevestigen, maar vragen wat ze morgen doen.
- Als ze twijfelen: terug naar de feiten (data van vandaag, hun eigen woorden).
- Stel terug-vragen die hen scherp maken in plaats van advies te dumpen.
- Wees soms stil. Korte zinnen kunnen harder slaan dan lange.`;
}

function renderChat(){
  ensureChat();
  const el = document.getElementById('chat-messages');
  if(!el) return;

  if(S.chat.length === 0){
    el.innerHTML = `<div class="chat-empty">
      <div class="chat-empty-ic">💬</div>
      <div class="chat-empty-t">Praat met Claude</div>
      <div class="chat-empty-s">Direct contact met je coach. Hij kent je verhaal, je schaduw, en wat je vandaag wel/niet hebt gedaan.</div>
      <div class="chat-prompts">
        <button class="chat-prompt-btn" onclick="sendQuickPrompt('Ik twijfel of ik vandaag moet trainen.')">"Ik twijfel of ik vandaag moet trainen."</button>
        <button class="chat-prompt-btn" onclick="sendQuickPrompt('Net een trade verloren, wil revenge traden.')">"Net een trade verloren, wil revenge traden."</button>
        <button class="chat-prompt-btn" onclick="sendQuickPrompt('Voel me leeg. Geen zin om iets te doen.')">"Voel me leeg. Geen zin om iets te doen."</button>
        <button class="chat-prompt-btn" onclick="sendQuickPrompt('Hoe ga ik vandaag om met de casino-nacht?')">"Hoe ga ik vandaag om met de casino-nacht?"</button>
      </div>
    </div>`;
    return;
  }

  el.innerHTML = S.chat.map(m=>{
    if(m.role === 'user'){
      return `<div class="msg user">${escapeHtml(m.content)}</div>`;
    } else {
      return `<div class="msg assistant"><div class="msg-claude">Claude</div>${escapeHtml(m.content)}</div>`;
    }
  }).join('');

  setTimeout(()=>{el.scrollTop = el.scrollHeight;}, 50);
}

function sendQuickPrompt(text){
  const inp = document.getElementById('chat-input');
  inp.value = text;
  sendChat();
}

async function sendChat(){
  const inp = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const text = inp.value.trim();
  if(!text) return;
  ensureChat();
  if(isRecording) stopVoice();

  S.chat.push({role:'user', content:text, ts:Date.now()});
  save();
  inp.value = '';
  inp.style.height = 'auto';
  renderChat();

  const msgsEl = document.getElementById('chat-messages');
  const empty = msgsEl.querySelector('.chat-empty');
  if(empty) empty.remove();
  const thinking = document.createElement('div');
  thinking.className = 'msg-thinking';
  thinking.id = 'msg-thinking';
  thinking.textContent = 'Denkt na…';
  msgsEl.appendChild(thinking);
  setTimeout(()=>{msgsEl.scrollTop = msgsEl.scrollHeight;}, 20);
  sendBtn.disabled = true;

  const history = S.chat.slice(-20).map(m=>({role:m.role, content:m.content}));

  try {
    const data = await claudeCall(history, {
      maxTokens: 800,
      system: buildChatSystemPrompt()
    });
    const reply = data.content?.[0]?.text || '(geen antwoord)';
    S.chat.push({role:'assistant', content:reply, ts:Date.now()});
    save();
    renderChat();
  } catch(e){
    const t = document.getElementById('msg-thinking');
    if(t) t.remove();
    const errEl = document.createElement('div');
    errEl.className = 'msg assistant';
    errEl.style.borderColor = 'var(--red)';
    errEl.style.opacity = '0.8';
    errEl.innerHTML = `<div class="msg-claude" style="color:var(--red)">Verbindingsfout</div>${escapeHtml(e.message || 'Kon Claude niet bereiken.')}<br><br><span style="font-size:11px;color:var(--muted)">Heb je een API-key ingesteld? Check Stats → API Key.</span>`;
    msgsEl.appendChild(errEl);
    setTimeout(()=>{msgsEl.scrollTop = msgsEl.scrollHeight;}, 20);
  } finally {
    sendBtn.disabled = false;
  }
}

function clearChat(){
  if(!S.chat || S.chat.length===0) return;
  showConfirm('Chat wissen','Alle berichten worden gewist. Niet terug te halen.',
    ()=>{
      S.chat = [];
      save();
      renderChat();
    });
}
