// ═══════════════════════════════
// MAIN APP — core rendering & navigation
// ═══════════════════════════════
function renderHeader(){
  const n=dayNum();
  const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  setText('dn',n);
  setText('ss-day',n);
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
  renderHeader();renderDots();renderProg();renderRules();checkMilestone();renderHeroCard();renderMoodStrip();renderCasinoBanner();
}

function renderAll(){
  renderHeader();
  if(currentPage==='today') { renderDots();renderProg();renderRules();checkMilestone();renderHeroCard();renderMoodStrip();renderCasinoBanner(); }
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
// ME SCREEN
// ═══════════════════════════════
function renderMeScreen(){
  const el = document.getElementById('me-profile-header');
  if(el){
    const name = (S.identity&&S.identity.name)||(S.profile&&S.profile.name)||'Jij';
    const n = dayNum();
    el.innerHTML = `<div style="padding:20px 16px 8px;display:flex;align-items:center;gap:14px">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--ac-dim);border:2px solid var(--ac);display:flex;align-items:center;justify-content:center;font-size:22px">🔥</div>
      <div>
        <div style="font-family:var(--sans);font-size:18px;font-weight:700;color:var(--text)">${name}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">Dag ${n} van 75 — Operation You</div>
      </div>
      <button onclick="openSettings()" style="margin-left:auto;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer">⚙</button>
    </div>`;
  }
  renderThemeGrid();
  renderDots75Me();
}
