// ═══════════════════════════════
// BACKLOG (BUILD tab)
// ═══════════════════════════════
const BACKLOG_SEED = [
  { title: 'Praat met Claude tab', priority: 'high', desc: 'Chat-tab waarmee je realtime kan praten met Claude over je dag, zwaktes en beslissingen. Profiel, schaduw en recente data zit automatisch in context. Voor momenten zoals "wil revenge traden vanavond" of "overweegt BJJ te skippen". On-demand persoonlijke pushback.' },
  { title: 'Voice journal', priority: 'high', desc: 'Spreek je dagboek in plaats van typen. Web Speech API voor transcriptie (werkt native in iOS Safari). Claude structureert het ruwe audio-transcript in coherente reflectie. Verlaagt frictie voor avond-journal van "open app, typ 5 min" naar "praat 30 sec".' },
  { title: 'PWA notificaties', priority: 'high', desc: 'Push notificatie 22:00 als je nog niet alles hebt afgevinkt. Daily morning reminder 07:00 met je dagquote. Zonder reminders wordt 80% van apps niet doorgebruikt na week 2 — dit is geen luxe maar noodzaak voor 75 dagen volhouden.' },
  { title: 'Casino-modus toggle', priority: 'high', desc: 'Aparte regels/scoring voor vrijdag+zaterdag nachten waar standaard regels niet kloppen. Slaap-target verschuift, schermtijd-rules milder, journal-timing anders. Niet ontsnappen aan eisen, wel realistisch zijn voor jouw specifieke leven.' },
  { title: 'Patroon-spotter', priority: 'normal', desc: 'Elke 10-14 dagen analyseert Claude automatisch je data en stuurt één specifiek observeerbaar patroon. Voorbeeld: "je mist regel X altijd op zondagochtenden na casino-nachten." Inzichten die jij zelf nooit zou zien in de cijfers.' },
  { title: 'Foto lightbox + galerij', priority: 'normal', desc: 'Tik op een foto in Journey → fullscreen swipe-able carrousel met dag, datum, regels en AI-feedback. Na 75 dagen wil je je transformatie scrollen als verhaal, niet als raster van kleine vierkantjes. Native iOS-stijl swipe + pinch zoom.' },
  { title: 'Mood/energie 1-tap', priority: 'normal', desc: 'Elke dag een 1-5 rating in 2 seconden — één tik op een schaal. Combineren met Whoop → "mood vaak laag op dagen met lage recovery na slechte slaap" wordt zichtbaar. Verlaagt drempel van schrijven naar tikken.' },
  { title: 'Training log', priority: 'normal', desc: 'Quick log na elke BJJ/MMA/gym/kickboks sessie. Wat trainde je, hoe zwaar (1-10), wat geleerd, wat slecht ging. Over 75 dagen bouw je een gevechtssport-portfolio met patronen — welke sport het meest, hoe progressie loopt.' },
  { title: 'Defensie-countdown', priority: 'low', desc: 'Klein blokje op Vandaag dat aftelt naar je officier-start (4 maanden). Claude refereert er soms naar in feedback: "wat doe je deze week dat je officier-fitter maakt?" Bewuste context van je horizon, niet alleen 75 dagen vooruit.' },
  { title: 'Zwakste & sterkste wet stats', priority: 'low', desc: 'In Stats: welke wet mis je het meest? Welke is altijd raak? Bijv. "regel #3 hit rate 47%" vs "regel #7 hit rate 98%". Eye-opener voor echte gedragspatronen, niet je perceptie ervan. Per wet over 75 dagen.' }
];

const STATUS_ORDER = ['doing','next','idea','done'];
const STATUS_LABELS = {idea:'Idea',next:'Next',doing:'Doing',done:'Done'};
const PRIORITY_ORDER = ['urgent','high','normal','low'];
const PRIORITY_LABELS = {low:'Low',normal:'Normal',high:'High',urgent:'Urgent'};

let activeBacklogIssue = null;
let backlogFilter = 'all';

function seedBacklog(){
  if(S.backlog!==undefined) return;
  const now=Date.now();
  S.backlog = BACKLOG_SEED.map((s,i)=>({
    id:'b'+(i+1),
    title:s.title,
    desc:s.desc,
    priority:s.priority,
    status:'idea',
    notes:'',
    createdAt:now,
    updatedAt:now
  }));
  save();
}

function sortedBacklog(){
  if(!S.backlog) return [];
  const so = STATUS_ORDER;
  const po = PRIORITY_ORDER;
  return [...S.backlog].sort((a,b)=>{
    const ds = so.indexOf(a.status) - so.indexOf(b.status);
    if(ds!==0) return ds;
    const dp = po.indexOf(a.priority) - po.indexOf(b.priority);
    if(dp!==0) return dp;
    return b.createdAt - a.createdAt;
  });
}

function renderBacklog(){
  if(!document.getElementById('bl-list')) return;
  seedBacklog();
  const items = sortedBacklog();
  const counts = {all:items.length, idea:0, next:0, doing:0, done:0};
  items.forEach(it=>{counts[it.status] = (counts[it.status]||0)+1;});
  const cnt = document.getElementById('bl-count');
  if(cnt) cnt.innerHTML = `<span>${counts.doing}</span> doing · ${counts.all} total`;

  const filterDef = [['all','Alles'],['doing','Doing'],['next','Next'],['idea','Idea'],['done','Done']];
  const filtEl = document.getElementById('bl-filters');
  if(filtEl) filtEl.innerHTML = filterDef.map(([k,lbl])=>
    `<div class="bl-fpill ${backlogFilter===k?'on':''}" onclick="setBacklogFilter('${k}')">${lbl}<span class="bl-fpill-n">${counts[k]||0}</span></div>`
  ).join('');

  const filtered = backlogFilter==='all' ? items : items.filter(it=>it.status===backlogFilter);
  const list = document.getElementById('bl-list');
  if(filtered.length===0){
    list.innerHTML = `<div class="bl-empty">
      <div class="bl-empty-ic">🛠</div>
      <div class="bl-empty-t">${backlogFilter==='all'?'Geen issues':'Niks in '+STATUS_LABELS[backlogFilter]}</div>
      <div class="bl-empty-s">${backlogFilter==='all'?'Voeg een idee toe via het invoerveld bovenaan.':'Verander het filter of voeg een issue toe.'}</div>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map(it=>`
    <div class="bl-card s-${it.status}" onclick="openBacklogDetail('${it.id}')">
      <div class="bl-card-head">
        <div class="bl-pdot p-${it.priority}"></div>
        <div class="bl-card-title">${escapeHtml(it.title)}</div>
        ${it.priority==='urgent'||it.priority==='high' ? `<div class="bl-card-prio p-${it.priority}">${PRIORITY_LABELS[it.priority]}</div>` : ''}
      </div>
      ${it.desc ? `<div class="bl-card-desc">${escapeHtml(it.desc)}</div>` : ''}
      <div class="bl-card-meta">
        <span class="bl-stat-pill s-${it.status}">${STATUS_LABELS[it.status]}</span>
      </div>
    </div>
  `).join('');
}

function setBacklogFilter(f){
  backlogFilter = f;
  renderBacklog();
}

function quickAddIssue(){
  const inp = document.getElementById('bl-quick-input');
  const t = inp.value.trim();
  if(!t) return;
  seedBacklog();
  const now = Date.now();
  const id = 'b' + (Math.max(0, ...S.backlog.map(b=>parseInt(b.id.replace('b',''))||0)) + 1);
  S.backlog.unshift({id, title:t, desc:'', priority:'normal', status:'idea', notes:'', createdAt:now, updatedAt:now});
  save();
  inp.value = '';
  renderBacklog();
}

function openBacklogDetail(id){
  const it = S.backlog.find(x=>x.id===id);
  if(!it) return;
  activeBacklogIssue = id;
  document.getElementById('bd-tlbl').textContent = it.title.toUpperCase();
  const created = new Date(it.createdAt).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});
  const updated = new Date(it.updatedAt).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});

  document.getElementById('bd-scroll').innerHTML = `
    <div class="bd-section first">
      <div class="bd-label">Titel</div>
      <input class="bd-title-input" id="bd-title" value="${escapeHtml(it.title)}" onblur="updateIssue('${id}',{title:this.value.trim()||'Naamloos'})">
    </div>
    <div class="bd-section">
      <div class="bd-label">Status</div>
      <div class="bd-pills">
        ${['idea','next','doing','done'].map(s=>`<div class="bd-pill ${it.status===s?'on':''} ${s==='done'?'done':''}" onclick="updateIssue('${id}',{status:'${s}'})">${STATUS_LABELS[s]}</div>`).join('')}
      </div>
    </div>
    <div class="bd-section">
      <div class="bd-label">Prioriteit</div>
      <div class="bd-pills">
        ${['low','normal','high','urgent'].map(p=>`<div class="bd-pill ${it.priority===p?'on':''} ${p==='urgent'?'urgent':''}" onclick="updateIssue('${id}',{priority:'${p}'})">${PRIORITY_LABELS[p]}</div>`).join('')}
      </div>
    </div>
    <div class="bd-section">
      <div class="bd-label">Beschrijving — wat is dit, waarom belangrijk</div>
      <textarea class="bd-ta" id="bd-desc" placeholder="Waar gaat dit issue over? Wat is het probleem of de wens?" onblur="updateIssue('${id}',{desc:this.value.trim()})">${escapeHtml(it.desc)}</textarea>
    </div>
    <div class="bd-section">
      <div class="bd-label">Mijn notities — gedachten, links, eisen</div>
      <textarea class="bd-ta" id="bd-notes" placeholder="Eigen notities, links, screenshots-beschrijvingen, eisen…" onblur="updateIssue('${id}',{notes:this.value.trim()})">${escapeHtml(it.notes||'')}</textarea>
    </div>
    <div class="bd-copy-wrap">
      <button class="bd-copy-btn" id="bd-copy-btn" onclick="copyIssueToClipboard('${id}')">↗ Stuur naar Claude</button>
      <div class="bd-copy-hint">Kopieert deze issue naar je klembord. Plak in Claude-chat — ik bouw het en update de status naar Done.</div>
    </div>
    <div class="bd-meta">
      Aangemaakt: ${created} · Bijgewerkt: ${updated}<br>
      Issue-ID: ${id}
    </div>
    <button class="bd-delete" onclick="deleteIssue('${id}')">Verwijder issue</button>
  `;
  document.getElementById('bd-overlay').classList.add('open');
}

function closeBacklogDetail(){
  document.getElementById('bd-overlay').classList.remove('open');
  activeBacklogIssue = null;
  renderBacklog();
}

function updateIssue(id, fields){
  const idx = S.backlog.findIndex(x=>x.id===id);
  if(idx<0) return;
  Object.assign(S.backlog[idx], fields, {updatedAt: Date.now()});
  save();
  if(fields.status!==undefined || fields.priority!==undefined){
    openBacklogDetail(id);
  }
}

function deleteIssue(id){
  const it = S.backlog.find(x=>x.id===id);
  if(!it) return;
  showConfirm('Issue verwijderen','"'+it.title+'" wordt permanent verwijderd. Niet terug te halen.',
    ()=>{
      S.backlog = S.backlog.filter(x=>x.id!==id);
      save();
      closeBacklogDetail();
    });
}

async function copyIssueToClipboard(id){
  const it = S.backlog.find(x=>x.id===id);
  if(!it) return;
  const btn = document.getElementById('bd-copy-btn');
  const txt = `🛠 Werk aan deze feature uit mijn OPERATION YOU backlog:

[${it.title.toUpperCase()}]
Prioriteit: ${PRIORITY_LABELS[it.priority]}
Status: ${STATUS_LABELS[it.status]} → DOING

Beschrijving:
${it.desc || '(nog geen beschrijving)'}

Mijn notities:
${it.notes || '(geen notities)'}

Bouw deze feature in de OPERATION YOU app. Update status naar 'done' wanneer klaar. Issue-ID: ${it.id}.`;

  const ok = await doCopy(txt);
  if(ok){
    updateIssue(id, {status:'doing'});
    btn.classList.add('copied');
    btn.textContent = '✓ Gekopieerd — plak in Claude';
    setTimeout(()=>{
      btn.classList.remove('copied');
      btn.textContent = '↗ Stuur naar Claude';
    }, 2400);
  } else {
    btn.textContent = '⚠ Kopiëren mislukt — selecteer handmatig';
    setTimeout(()=>{ btn.textContent = '↗ Stuur naar Claude'; }, 2400);
  }
}

async function doCopy(text){
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch(e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch(e2) {
      return false;
    }
  }
}

function markBuiltIssuesDone(){
  if(!S.backlog||S._migratedBuiltIssues) return;
  const builtTitles = ['Praat met Claude tab','Voice journal','PWA notificaties'];
  let changed = false;
  S.backlog.forEach(it=>{
    if(builtTitles.includes(it.title)&&it.status!=='done'){it.status='done';changed=true;}
  });
  S._migratedBuiltIssues = true;
  if(changed) save();
}
