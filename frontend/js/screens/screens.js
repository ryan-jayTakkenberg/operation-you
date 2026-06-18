// ═══════════════════════════════
// MAIN APP — core rendering & navigation
// ═══════════════════════════════
function renderHeader(){
  const n=dayNum();
  const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  setText('dn',n);
  setText('mdaynum',n);
  const now=new Date();
  setText('ds',now.toLocaleDateString('nl-NL',{day:'numeric',month:'long'}).toUpperCase());
  setText('whoop-date-lbl',now.toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'}));
  if(S.identity&&S.identity.name){
    setText('brand-name',S.identity.name);
  }
  if(S.profile&&S.profile.name){
    setText('j-name',(S.identity&&S.identity.name)||(S.profile.name.toUpperCase()));
    setText('j-sub',`Start: ${S.startDate||'—'} — 75 dagen`);
  }
}

function renderProg(){
  const{done,total}=progress();
  const p=total?Math.round(done/total*100):0;
  const pctEl=document.getElementById('pct');
  if(pctEl) pctEl.textContent=p+'%';
  const lineEl=document.getElementById('plinef');
  if(lineEl) lineEl.style.width=p+'%';
}

function renderDots(){
  renderDots75('dot75', 'dots');
}

let currentPage = 'today';

function renderToday(){
  renderHeader();renderProg();renderTodayHeader();renderRingCard();renderRules();checkMilestone();renderMoodStrip();renderCasinoBanner();
}

function renderAll(){
  renderHeader();
  if(currentPage==='today') { renderProg();renderTodayHeader();renderRingCard();renderRules();checkMilestone();renderMoodStrip();renderCasinoBanner(); }
  else if(currentPage==='plan') { renderJourney();renderPlanScreen(); }
  else if(currentPage==='me') { renderStats();renderMeScreen(); }
  else if(currentPage==='coach') { renderChat(); }
}

function go(p){
  const mainRoutes = ['today','plan','coach','me'];
  const legacyRemap = {chat:'coach',journey:'plan',stats:'me'};
  const subpages = {spiegel:'spiegel',build:'build',whoop:'whoop'};
  if(subpages[p]){openSettings();setTimeout(()=>openSubpage(subpages[p]),50);return;}
  if(legacyRemap[p]) p = legacyRemap[p];
  if(mainRoutes.indexOf(p) === -1) p = 'today';
  currentPage = p;
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('on'));
  document.getElementById('page-'+p).classList.add('on');
  document.querySelectorAll('.nbtn').forEach((el,i)=>el.classList.toggle('on',mainRoutes[i]===p));
  if(p==='today'){renderToday();}
  if(p==='me'){renderStats();renderMeScreen();}
  if(p==='plan'){renderJourney();renderPlanScreen();}
  if(p==='coach'){renderChat();setTimeout(()=>{const i=document.getElementById('chat-input');if(i)i.focus();},100);}
  const fabEl=document.getElementById('fab-btn');
  if(fabEl)fabEl.classList.toggle('fab-hidden',p!=='today'&&p!=='coach');
}

let confirmCallback=null;
function showConfirm(title,msg,onYes){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').textContent=msg;
  confirmCallback=onYes;
  document.getElementById('confirm-dialog').classList.remove('hidden');
  document.getElementById('confirm-yes-btn').onclick=()=>confirmYes();
}
function confirmYes(){document.getElementById('confirm-dialog').classList.add('hidden');if(confirmCallback)confirmCallback();confirmCallback=null;}
function confirmNo(){document.getElementById('confirm-dialog').classList.add('hidden');confirmCallback=null;}

function failDay(){
  showConfirm('Dag mislukt','Je gaat terug naar dag 1. Alle checks worden gewist. Je start vandaag opnieuw.',
    ()=>{
      S.fails.push({date:today(),day:dayNum()});
      S.restarts++;
      S.checks={};
      S.startDate=today();
      save();renderAll();
    });
}

function resetAll(){
  showConfirm('Challenge resetten','Checks, entries, Whoop data, milestones — alles weg. Je wetten en profiel blijven staan.',
    ()=>{
      S.checks={};S.fails=[];S.restarts=0;S.entries=[];S.whoop={};S.milestones={};S.dayQuotes={};S.dayInsight={};S.quickLogs=[];
      S.startDate=today();
      save();renderAll();closeDetail();
    });
}

function bootApp(){
  if(S.profile&&S.identity&&S.startDate){
    seedBacklog();
    markBuiltIssuesDone();
    hideOnboarding();
    renderAll();
    setTimeout(loadDayQuote,300);
    setTimeout(loadDayInsight,600);
    startNotifScheduler();
  } else {
    showOnboarding();
  }
}

// ═══════════════════════════════
// PLAN SCREEN
// ═══════════════════════════════
function renderPlanScreen(){
  const n = dayNum();
  const whyEl = document.getElementById('plan-why-card');
  if(whyEl && S.identity && S.identity.why){
    whyEl.innerHTML = `<div class="why-card">
      <div style="font-family:var(--mono);font-size:10px;letter-spacing:.18em;color:var(--muted);margin-bottom:8px">JOUW WAAROM</div>
      <div style="font-size:14px;color:var(--text);line-height:1.6">${S.identity.why}</div>
    </div>`;
  } else if(whyEl){ whyEl.innerHTML=''; }

  const phasesEl = document.getElementById('plan-phases');
  if(!phasesEl) return;
  const phases = [
    {name:'Foundation',range:'1–25',start:1,end:25,desc:'Basis leggen. Ritme vinden.'},
    {name:'Build',range:'26–50',start:26,end:50,desc:'Intensiveren. Patronen breken.'},
    {name:'Peak',range:'51–75',start:51,end:75,desc:'Alles geven. Afronden.'},
  ];
  phasesEl.innerHTML = `<div class="phases-wrap">${phases.map(ph=>{
    const active = n>=ph.start && n<=ph.end;
    const done = n>ph.end;
    return `<div class="phase-row${active?' active':''}${done?' done':''}">
      <div class="phase-dot" style="${active?'background:var(--ac)':done?'background:var(--green)':''}"></div>
      <div>
        <div style="font-family:var(--sans);font-size:14px;font-weight:600;color:${active?'var(--text)':'var(--muted)'}">${ph.name} <span style="font-family:var(--mono);font-size:11px;color:var(--dim)">${ph.range}</span></div>
        <div style="font-size:12px;color:var(--dim);margin-top:2px">${ph.desc}</div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ═══════════════════════════════
// ME / PROFIEL SCREEN — parity met mobile ProfielScreen
// ═══════════════════════════════
function phaseForDay(day){
  if(day>=51) return {n:3,text:'Pieken'};
  if(day>=26) return {n:2,text:'Bouwen'};
  return {n:1,text:'Fundering leggen'};
}
function firstSentence(text){
  if(!text) return '';
  const t=text.trim();
  if(!t) return '';
  const m=t.split(/(?<=\.)\s|\n/)[0];
  return (m||t).trim();
}
function toBullets(goal){
  if(!goal) return [];
  return goal.split(/\.\s+|\n+/).map(p=>p.replace(/\.$/,'').trim()).filter(p=>p.length>0).slice(0,4);
}

function renderMeScreen(){
  const head = document.getElementById('me-profile-header');
  if(!head) return;
  const name = (S.profile&&S.profile.name)||'Operator';
  const initial = (name.trim().charAt(0)||'O').toUpperCase();
  const day = dayNum();
  const pct = Math.round(day/75*100);
  const phase = phaseForDay(day);
  const ruleCount = rules().length;
  const id = S.identity||{}, p = S.profile||{};

  const becoming = id.why || firstSentence(id.manifesto) || p.goal || 'Je verhaal komt hier zodra je je profiel hebt ingevuld.';
  const why = id.why || firstSentence(p.story) || 'Vul je profiel aan om je waarom vast te leggen.';
  const bullets = toBullets(p.goal);

  head.innerHTML = `<div class="me-avatar-tile">${escapeHtml(initial)}</div>
    <div style="flex:1;min-width:0">
      <div class="me-name">${escapeHtml(name)}</div>
      <div class="me-phase">Fase ${phase.n} — ${phase.text}</div>
    </div>`;

  const top = document.getElementById('me-profile-top');
  if(top){
    top.innerHTML = `
      <div class="me-becoming">
        <div class="me-becoming-eyebrow">Wie ik word</div>
        <div class="me-becoming-text">${escapeHtml(becoming)}</div>
      </div>
      <div class="me-card">
        <div class="me-card-eyebrow">Mijn doelen</div>
        ${bullets.length
          ? `<div class="me-bullets">${bullets.map(b=>`<div class="me-bullet"><span class="me-bullet-dot"></span><span class="me-bullet-text">${escapeHtml(b)}</span></div>`).join('')}</div>`
          : `<div class="me-fallback">Vul je profiel aan om je doelen te zien.</div>`}
      </div>
      <div class="me-tiles">
        <div class="me-tile"><div class="me-tile-eyebrow">Mijn wetten</div><div class="me-tile-num">${ruleCount}</div><div class="me-tile-sub">actieve wetten</div></div>
        <div class="me-tile"><div class="me-tile-eyebrow">Fase</div><div class="me-tile-num">${pct}<span class="me-tile-unit">%</span></div><div class="me-tile-track"><div class="me-tile-fill" style="width:${pct}%"></div></div></div>
      </div>`;
  }

  const bottom = document.getElementById('me-profile-bottom');
  if(bottom){
    bottom.innerHTML = `<div class="me-card">
      <div class="me-card-eyebrow">Mijn waarom</div>
      <div class="me-why">${escapeHtml(why)}</div>
    </div>`;
  }

  renderThemeGrid();
}
