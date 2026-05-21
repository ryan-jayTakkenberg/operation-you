// ═══════════════════════════════
// TODAY PAGE — rules, quote, mood, hero
// ═══════════════════════════════
function renderRules(){
  const listEl=document.getElementById('rlist');
  if(!listEl) return;
  const c=todayChecks();let h='';
  const rs=rules();
  if(rs.length===0){
    listEl.innerHTML='<div style="padding:40px 22px;text-align:center;color:var(--muted);font-size:13px">Geen wetten geladen.</div>';
    return;
  }
  SECTION_ORDER.forEach(secKey=>{
    const meta=SECTION_META[secKey];
    const secRules=rs.filter(r=>r.section===secKey);
    if(!secRules.length)return;
    const sd=secRules.filter(r=>c[r.id]).length;
    const full=sd===secRules.length;
    h+=`<div class="sec"><span class="sec-name">${meta.name}</span><span class="sec-prog ${full?'full':''}">${sd}/${secRules.length}</span></div>`;
    secRules.forEach(r=>{
      const done=c[r.id]?'done':'';
      const hasInfo = r.sub || r.warn;
      h+=`<div class="rule ${done}" id="rule-${r.id}">
        <div class="rbox" onclick="event.stopPropagation();toggleRule('${r.id}')"><span class="rchk">✓</span></div>
        <div class="rbody" onclick="toggleRuleExpand('${r.id}')">
          <div class="rname">${escapeHtml(r.name)}</div>
          ${r.sub?`<div class="rsub">${escapeHtml(r.sub)}</div>`:''}
          ${r.warn?`<div class="rwarn">${escapeHtml(r.warn)}</div>`:''}
        </div>
        ${hasInfo?`<div class="rule-info-btn" onclick="toggleRuleExpand('${r.id}')">ⓘ</div>`:''}
      </div>`;
    });
  });
  listEl.innerHTML=h;
}

function toggleRuleExpand(id){
  const el = document.getElementById('rule-'+id);
  if(el) el.classList.toggle('expanded');
}

function toggleRule(id){
  const c=todayChecks();c[id]=!c[id];
  save();renderRules();renderProg();renderDots();
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

// ═══════════════════════════════
// HERO CARD
// ═══════════════════════════════
function renderHeroCard(){
  const el = document.getElementById('today-hero');
  if(!el) return;
  const n = dayNum();
  const rs = rules();
  const c = todayChecks();
  const done = rs.filter(r=>c[r.id]).length;
  const total = rs.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const phase = n<=25?'Foundation':n<=50?'Build':'Peak';
  const phaseColor = n<=25?'var(--blue)':n<=50?'var(--orange)':'var(--red)';

  const dots = Array.from({length:75},(_,i)=>{
    const d = i+1;
    if(d < n) return `<div class="dot75-bar ok"></div>`;
    if(d === n) return `<div class="dot75-bar now"></div>`;
    return `<div class="dot75-bar"></div>`;
  }).join('');

  el.innerHTML = `<div class="hero-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Dag</div>
        <div style="font-family:var(--sans);font-size:72px;font-weight:900;color:var(--text);line-height:1">${n}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">van 75</div>
      </div>
      <div style="text-align:right">
        <div style="background:${phaseColor};color:#000;font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.14em;padding:4px 10px;border-radius:20px;display:inline-block;margin-bottom:8px">${phase.toUpperCase()}</div>
        <div style="font-family:var(--mono);font-size:28px;font-weight:700;color:var(--ac)">${pct}%</div>
        <div style="font-size:11px;color:var(--muted)">${done}/${total} wetten</div>
      </div>
    </div>
    <div class="dot75-grid" style="margin-top:16px">${dots}</div>
    <button onclick="openSettings()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;display:none">⚙</button>
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
