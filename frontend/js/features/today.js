// ═══════════════════════════════
// TODAY PAGE — header, ring, rules, quote, mood
// ═══════════════════════════════
function renderRules(){
  const host=document.getElementById('today-sections');
  if(!host)return;
  const c=todayChecks();
  const rs=rules();
  const casino=isCasinoDay();
  const exemptSections=(S.casinoMode&&S.casinoMode.exemptSections)||['avond'];
  const scheduleLabel=(S.casinoMode&&S.casinoMode.label)||'Nachtdienst';

  if(rs.length===0){
    host.innerHTML='<div style="padding:40px 22px;text-align:center;color:var(--muted);font-size:13px">Geen wetten geladen.</div>';
    return;
  }

  let h='';
  SECTION_ORDER.forEach(secKey=>{
    const meta=SECTION_META[secKey];
    const secRules=rs.filter(r=>r.section===secKey);
    if(!secRules.length)return;
    const exempt=casino&&exemptSections.includes(secKey);
    const active=exempt?[]:secRules;
    const sd=active.filter(r=>c[r.id]).length;
    const countTxt=exempt?`<span class="sec-casino-badge">${escapeHtml(scheduleLabel.toLowerCase())}</span>`:`${sd}/${secRules.length}`;
    h+=`<div class="t-section">
      <div class="t-sec-head">
        <div class="t-sec-head-l"><span class="t-sec-icon">${meta.icon}</span><span class="t-sec-title">${escapeHtml(meta.name)}</span></div>
        <span class="t-sec-count">${countTxt}</span>
      </div>
      <div class="t-sec-card">`;
    secRules.forEach(r=>{
      const isExempt=casino&&exemptSections.includes(r.section);
      const done=!isExempt&&c[r.id]?' done':'';
      const hasInfo=r.sub||r.warn;
      h+=`<div class="t-task${done}${isExempt?' casino-exempt':''}" id="rule-${r.id}">
        <div class="t-task-main" onclick="${isExempt?'':`toggleRule('${r.id}')`}">
          <div class="t-check"><span class="t-check-mark">✓</span></div>
          <div class="t-task-text">${escapeHtml(r.name)}${isExempt?'<span class="casino-badge">opt.</span>':''}</div>
          ${hasInfo?`<button class="t-task-info" onclick="event.stopPropagation();toggleRuleExpand('${r.id}')">ⓘ</button>`:''}
        </div>
        ${r.sub?`<div class="t-task-sub">${escapeHtml(r.sub)}</div>`:''}
        ${r.warn?`<div class="t-task-warn">${escapeHtml(r.warn)}</div>`:''}
      </div>`;
    });
    h+=`</div></div>`;
  });
  host.innerHTML=h;
}

function renderCasinoBanner(){
  const el=document.getElementById('casino-banner-wrap');
  if(!el)return;
  if(!isCasinoDay()){el.innerHTML='';return;}
  const label=(S.casinoMode&&S.casinoMode.label)||'Nachtdienst';
  const exemptSecs=(S.casinoMode&&S.casinoMode.exemptSections)||['avond'];
  const exemptCount=rules().filter(r=>exemptSecs.includes(r.section)).length;
  el.innerHTML=`<div class="casino-banner">
    <span class="casino-banner-ic">📅</span>
    <span class="casino-banner-txt">${escapeHtml(label)} — ${exemptCount} regel${exemptCount===1?'':'s'} tel${exemptCount===1?'t':'len'} niet mee</span>
  </div>`;
}

function toggleRuleExpand(id){
  const el = document.getElementById('rule-'+id);
  if(el) el.classList.toggle('expanded');
}

function toggleRule(id){
  const c=todayChecks();c[id]=!c[id];
  save();renderRules();renderRingCard();renderProg();
  const{done,total}=progress();
  if(done===total){
    setTimeout(()=>{checkMilestone();},400);
  }
}

// Daily quote — Claude writes a personalized message, cached per day
const QUOTE_TONES=[
  {key:'herinnering',label:'Herinnering',brief:'Herinner ze waarom ze dit doen — verwijs naar iets specifieks uit hun verhaal of dag-75 visie.'},
  {key:'schaduw',label:'Schaduw-check',brief:'Wijs ze op hun schaduw-patroon. Direct, niet zoetig. Vandaag waakzaam voor X.'},
  {key:'war_cry',label:'Strijdkreet',brief:'Korte, harde strijdkreet. Geen filosofie. Aanzetten tot actie nu.'},
  {key:'reflectie',label:'Reflectie',brief:'Een vraag of observatie die ze even doet stilstaan. Fraunces-stijl. Diep.'},
  {key:'sterkte',label:'Sterkte',brief:'Speel terug op een van hun sterktes. Maak het concreet voor vandaag.'},
  {key:'bouw',label:'Bouw',brief:'Wijs naar wat ze aan het bouwen zijn (dag 75 visie). 1 brick today.'}
];

async function loadDayQuote(force=false){
  const el=document.getElementById('day-quote');
  const sig=document.getElementById('dq-signature');
  const btn=document.getElementById('dq-refresh-btn');
  if(!el)return;
  if(!S.dayQuotes)S.dayQuotes={};
  const td=today();

  if(!force&&S.dayQuotes[td]){
    el.classList.remove('dq-loading');
    el.textContent=S.dayQuotes[td].text||S.dayQuotes[td];
    if(sig)sig.textContent= (S.dayQuotes[td].tone? '— '+S.dayQuotes[td].tone+' · dag '+dayNum():'— dag '+dayNum());
    return;
  }
  if(!S.identity||!S.profile){
    el.textContent='Vandaag is dag '+dayNum()+'. Begin met je eerste wet.';
    if(sig)sig.textContent='';
    return;
  }

  const dateSeed=parseInt(td.replace(/-/g,''));
  const refreshOffset = force ? (S.dayQuotes[td]&&S.dayQuotes[td].count?S.dayQuotes[td].count:0)+1 : 0;
  const tone=QUOTE_TONES[(dateSeed+refreshOffset)%QUOTE_TONES.length];

  el.classList.add('dq-loading');
  el.textContent='Boodschap laden…';
  if(sig)sig.textContent='— '+tone.label.toLowerCase()+' wordt geschreven';
  if(btn){btn.classList.add('spinning');btn.disabled=true;}

  const n=dayNum();
  const prompt=`Je bent de persoonlijke coach van ${S.profile.name}. Korte boodschap voor dag ${n} van 75.

PERSOON (kort):
- ${(S.profile.daily||'').slice(0,150)}
- Verhaal: ${(S.profile.story||'').slice(0,200)}
- Dag 75: ${(S.profile.goal||'').slice(0,150)}
- Sterktes: ${(S.profile.strengths||'').slice(0,100)}
- Zwaktes: ${(S.profile.weak||'').slice(0,150)}
- Schaduw: ${S.identity.shadow||''}

STIJL: ${tone.label} — ${tone.brief}

Schrijf 1-2 zinnen, direct 'je'. Geen "vandaag is dag X". Geen aanhalingstekens. Geen markdown. Nederlands. Iets dat hem/haar raakt voor vandaag — verwijs naar iets specifieks uit hun verhaal of zwaktes, niet algemeen.`;

  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:250});
    const txt=(data.content?.[0]?.text||'').trim().replace(/^["']|["']$/g,'');
    const prevCount=(S.dayQuotes[td]&&S.dayQuotes[td].count)||0;
    S.dayQuotes[td]={text:txt,tone:tone.label,count:prevCount+1};
    save();
    el.classList.remove('dq-loading');
    el.textContent=txt;
    if(sig)sig.textContent='— '+tone.label.toLowerCase()+' · dag '+n;
  }catch(e){
    el.classList.remove('dq-loading');
    el.textContent='Vandaag is dag '+n+'. Vink je eerste wet af.';
    if(sig)sig.textContent='';
  } finally {
    if(btn){btn.classList.remove('spinning');btn.disabled=false;}
  }
}

function refreshQuote(){loadDayQuote(true);}

// Daily insight — Claude analyzes last 7 days of check + mood data, cached per day
async function loadDayInsight(force=false){
  const el=document.getElementById('day-insight');
  const btn=document.getElementById('di-refresh-btn');
  if(!el)return;
  if(!S.dayInsight)S.dayInsight={};
  const td=today();

  if(!force&&S.dayInsight[td]){
    el.classList.remove('di-loading');
    el.textContent=S.dayInsight[td].text||S.dayInsight[td];
    return;
  }
  if(!S.identity||!S.profile){
    const card=document.getElementById('insight-card');
    if(card)card.style.display='none';
    return;
  }

  el.classList.add('di-loading');
  el.textContent='Analyse laden…';
  if(btn){btn.classList.add('spinning');btn.disabled=true;}

  const rs=rules();
  const n=dayNum();

  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();
    d.setDate(d.getDate()-i);
    const dt=localDate(d);
    const chk=S.checks[dt]||{};
    const mood=S.mood&&S.mood[dt];
    const done=rs.filter(r=>chk[r.id]).length;
    const pct=rs.length?Math.round(done/rs.length*100):0;
    const secs={};
    SECTION_ORDER.forEach(sec=>{
      const sr=rs.filter(r=>r.section===sec);
      const sd=sr.filter(r=>chk[r.id]).length;
      secs[sec]=sr.length?Math.round(sd/sr.length*100):null;
    });
    days.push({dt,pct,mood,secs});
  }

  const missCount={};
  days.forEach(({dt})=>{
    const chk=S.checks[dt]||{};
    rs.forEach(r=>{if(!chk[r.id])missCount[r.id]=(missCount[r.id]||0)+1;});
  });
  const topMissed=rs.filter(r=>(missCount[r.id]||0)>=4)
    .sort((a,b)=>(missCount[b.id]||0)-(missCount[a.id]||0))
    .slice(0,3);

  const dataStr=days.map(d=>`${d.dt}: ${d.pct}% totaal, energie=${d.mood||'?'}/5, ochtend=${d.secs.ochtend??'?'}%, avond=${d.secs.avond??'?'}%`).join('\n');
  const missedStr=topMissed.length
    ?topMissed.map(r=>`"${r.name}" (${missCount[r.id]}x gemist)`).join(', ')
    :'geen consistent patroon';

  const prompt=`Je bent de coach van ${S.profile.name}. Dag ${n} van 75.

DATA LAATSTE 7 DAGEN:
${dataStr}

CONSISTENT GEMISTE REGELS (4+ van 7 dagen):
${missedStr}

ZWAKTES: ${S.profile.weak||''}
SCHADUW: ${S.identity.shadow||''}

Schrijf 1-2 zinnen: een scherpe data-gedreven observatie of concrete opdracht. Direct, eerlijk, specifiek. Verwijs naar de data. Geen "je kunt het!". Geen aanhaling. Geen markdown. Nederlands.`;

  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:200});
    const txt=(data.content?.[0]?.text||'').trim().replace(/^["']|["']$/g,'');
    S.dayInsight[td]={text:txt,ts:Date.now()};
    save();
    el.classList.remove('di-loading');
    el.textContent=txt;
  }catch(e){
    el.classList.remove('di-loading');
    el.textContent='';
    const card=document.getElementById('insight-card');
    if(card)card.style.display='none';
  }finally{
    if(btn){btn.classList.remove('spinning');btn.disabled=false;}
  }
}

function refreshInsight(){loadDayInsight(true);}

// ═══════════════════════════════
// QUICK LOG — FAB bottom sheet
// ═══════════════════════════════
let _qlogType=null;

function openQuickLog(){
  const ov=document.getElementById('quicklog-overlay');
  if(!ov)return;
  ov.classList.remove('hidden');
  document.getElementById('qlog-type-view').classList.remove('hidden');
  document.getElementById('qlog-input-view').classList.add('hidden');
  _qlogType=null;
}

function closeQuickLog(){
  const ov=document.getElementById('quicklog-overlay');
  if(ov)ov.classList.add('hidden');
  _qlogType=null;
}

function selectQuickLogType(type){
  _qlogType=type;
  const labels={workout:'Workout',gedachte:'Gedachte',win:'Win van de dag',notitie:'Notitie'};
  document.getElementById('qlog-input-label').textContent=labels[type]||type;
  document.getElementById('qlog-text').value='';
  document.getElementById('qlog-type-view').classList.add('hidden');
  document.getElementById('qlog-input-view').classList.remove('hidden');
  setTimeout(()=>document.getElementById('qlog-text').focus(),100);
}

function backToQuickLogTypes(){
  document.getElementById('qlog-type-view').classList.remove('hidden');
  document.getElementById('qlog-input-view').classList.add('hidden');
  _qlogType=null;
}

function saveQuickLog(){
  const text=document.getElementById('qlog-text').value.trim();
  if(!text||!_qlogType)return;
  if(!S.quickLogs)S.quickLogs=[];
  S.quickLogs.push({type:_qlogType,text,date:today(),dayNum:dayNum(),ts:Date.now()});
  save();
  closeQuickLog();
}


// ═══════════════════════════════
// HEADER + RING (Evolve parity met mobile TodayScreen)
// ═══════════════════════════════
function greetingWeb(){
  const h=new Date().getHours();
  if(h<12)return'Goedemorgen';
  if(h<18)return'Goedemiddag';
  return'Goedenavond';
}

// Beste reeks: langste aaneengesloten run van complete dagen (1..vandaag).
function bestStreakWeb(){
  const rs=rules();if(!rs.length||!S.startDate)return 0;
  const total=dayNum();let best=0,run=0;
  for(let nn=1;nn<=total;nn++){
    const dc=S.checks[dateForDay(nn)]||{};
    if(rs.every(r=>dc[r.id])){run++;if(run>best)best=run;}else run=0;
  }
  return best;
}

// Gem. naleving: gemiddeld percentage afgevinkte wetten over alle verstreken dagen.
function avgComplianceWeb(){
  const rs=rules();if(!rs.length||!S.startDate)return 0;
  const total=dayNum();if(total<=0)return 0;
  let sum=0;
  for(let nn=1;nn<=total;nn++){
    const dc=S.checks[dateForDay(nn)]||{};
    sum+=rs.filter(r=>dc[r.id]).length/rs.length;
  }
  return Math.round(sum/total*100);
}

function renderTodayHeader(){
  const el=document.getElementById('today-header');
  if(!el)return;
  const n=dayNum();
  const name=(S.profile&&S.profile.name)?', '+S.profile.name:'';
  el.innerHTML=`<div class="t-header-l">
      <div class="t-eyebrow">DAG ${n} / 75</div>
      <div class="t-greeting">${greetingWeb()}${escapeHtml(name)}</div>
    </div>
    <div class="t-streak"><span class="t-streak-emoji">🔥</span><span class="t-streak-num">${calcStreak()}</span></div>`;
}

function renderRingCard(){
  const el=document.getElementById('today-ring');
  if(!el)return;
  const{done,total}=progress();
  const frac=total?done/total:0;
  const pct=Math.round(frac*100);
  const R=54,C=2*Math.PI*R;
  const offset=C*(1-frac);
  el.innerHTML=`<div class="t-ring-wrap">
      <svg width="128" height="128" class="t-ring-svg" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="${R}" stroke="var(--ring-track)" stroke-width="11" fill="none"/>
        <circle cx="64" cy="64" r="${R}" stroke="var(--gold)" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
      </svg>
      <div class="t-ring-center"><div class="t-ring-pct">${pct}<span class="t-ring-unit">%</span></div><div class="t-ring-label">VOLTOOID</div></div>
    </div>
    <div class="t-ring-info">
      <div class="t-ring-desc">Je hebt <b>${done} van ${total}</b> wetten nageleefd vandaag.</div>
      <div class="t-mini">
        <div class="t-mini-row"><span class="t-mini-lbl">Beste reeks</span><span class="t-mini-val">${bestStreakWeb()} dgn</span></div>
        <div class="t-mini-row"><span class="t-mini-lbl">Gem. naleving</span><span class="t-mini-val green">${avgComplianceWeb()}%</span></div>
      </div>
    </div>`;
}

// ═══════════════════════════════
// MOOD STRIP
// ═══════════════════════════════
const MOOD_LABELS = ['leeg','mat','oké','goed','aan'];

function setMood(v){
  if(!S.mood) S.mood = {};
  S.mood[today()] = v;
  save();
  renderMoodStrip();
}

function renderMoodStrip(){
  const el = document.getElementById('mood-strip-wrap');
  if(!el) return;
  const cur = S.mood && S.mood[today()];
  el.innerHTML = `<div class="mood-card">
    <div class="mood-title">Energie vandaag</div>
    <div class="mood-strip">
      ${MOOD_LABELS.map((lbl,i)=>`<button class="mood-btn${cur===i+1?' on':''}" onclick="setMood(${i+1})"><div class="mood-lbl">${lbl}</div></button>`).join('')}
    </div>
  </div>`;
}
