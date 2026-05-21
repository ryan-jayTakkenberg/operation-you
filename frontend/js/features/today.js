// ═══════════════════════════════
// TODAY PAGE — rules, quote, mood, hero
// ═══════════════════════════════
function renderRules(){
  const listEl=document.getElementById('rlist');
  if(!listEl) return;
  const c=todayChecks();let h='';
  const rs=rules();
  const casino=isCasinoDay();
  if(rs.length===0){
    listEl.innerHTML='<div style="padding:40px 22px;text-align:center;color:var(--muted);font-size:13px">Geen wetten geladen.</div>';
    return;
  }
  SECTION_ORDER.forEach(secKey=>{
    const meta=SECTION_META[secKey];
    const secRules=rs.filter(r=>r.section===secKey);
    if(!secRules.length)return;
    const exempt=casino&&secKey==='avond';
    const active=exempt?[]:secRules;
    const sd=active.filter(r=>c[r.id]).length;
    const secTotal=active.length;
    const full=secTotal>0&&sd===secTotal;
    const secProgTxt=exempt?`<span class="sec-casino-badge">casino</span>`:`${sd}/${secTotal}`;
    h+=`<div class="sec"><span class="sec-name">${meta.name}</span><span class="sec-prog ${full?'full':''}">${secProgTxt}</span></div>`;
    secRules.forEach(r=>{
      const isExempt=casino&&r.section==='avond';
      const done=!isExempt&&c[r.id]?'done':'';
      const hasInfo = r.sub || r.warn;
      h+=`<div class="rule ${done}${isExempt?' casino-exempt':''}" id="rule-${r.id}">
        <div class="rbox" onclick="event.stopPropagation();${isExempt?'':` toggleRule('${r.id}')`}"><span class="rchk">✓</span></div>
        <div class="rbody" onclick="toggleRuleExpand('${r.id}')">
          <div class="rname">${escapeHtml(r.name)}${isExempt?'<span class="casino-badge">opt.</span>':''}</div>
          ${r.sub?`<div class="rsub">${escapeHtml(r.sub)}</div>`:''}
          ${r.warn?`<div class="rwarn">${escapeHtml(r.warn)}</div>`:''}
        </div>
        ${hasInfo?`<div class="rule-info-btn" onclick="toggleRuleExpand('${r.id}')">ⓘ</div>`:''}
      </div>`;
    });
  });
  listEl.innerHTML=h;
}

function renderCasinoBanner(){
  const el=document.getElementById('casino-banner-wrap');
  if(!el)return;
  if(!isCasinoDay()){el.innerHTML='';return;}
  const avondCount=rules().filter(r=>r.section==='avond').length;
  el.innerHTML=`<div class="casino-banner">
    <span class="casino-banner-ic">🎰</span>
    <span class="casino-banner-txt">Casino-nacht — ${avondCount} avondregel${avondCount===1?'':'s'} tel${avondCount===1?'t':'len'} niet mee</span>
  </div>`;
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
