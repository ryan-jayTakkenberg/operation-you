// ═══════════════════════════════
// SPIEGEL — manifest, wetten, droomwerk, week review
// ═══════════════════════════════
function renderSpiegel(){
  if(!document.getElementById('sp-scroll')) return;
  const id=S.identity;
  const p=S.profile;
  if(!id||!p){
    document.getElementById('sp-scroll').innerHTML='<div style="padding:40px 20px;text-align:center;color:var(--muted)">Geen profiel geladen.</div>';
    return;
  }
  const name=id.name||(p.name+' 75');
  const nameEl=document.getElementById('sp-challenge-name');
  if(nameEl) nameEl.innerHTML=name.replace(/(\S+)$/,'<span>$1</span>');
  const tagEl=document.getElementById('sp-tag');
  if(tagEl) tagEl.textContent=`Voor ${p.name} — geschreven op basis van jouw verhaal`;

  let h='';

  h+=`<div class="sp-section">
    <div class="sp-label">Manifest</div>
    <div class="sp-manifesto">${escapeHtml(id.manifesto||'')}</div>
  </div>`;

  if(id.shadow){
    h+=`<div class="sp-section">
      <div class="sp-label danger">Je schaduw</div>
      <div class="sp-shadow-card"><div class="sp-text">${escapeHtml(id.shadow)}</div></div>
    </div>`;
  }

  h+=`<div class="sp-section">
    <div class="sp-label">Jouw 12 wetten</div>
    <div class="sp-rules-grid">`;
  let n=1;
  SECTION_ORDER.forEach(secKey=>{
    const meta=SECTION_META[secKey];
    const secRules=id.rules.filter(r=>r.section===secKey);
    if(!secRules.length)return;
    h+=`<div>
      <div class="sp-rule-sec-head"><span class="sp-rule-sec-icon">${meta.icon}</span><span class="sp-rule-sec-name">${meta.name}</span></div>`;
    secRules.forEach(r=>{
      h+=`<div class="sp-rule">
        <div class="sp-rule-top">
          <div class="sp-rule-num">${n++}.</div>
          <div class="sp-rule-name">${escapeHtml(r.name)}</div>
        </div>
        <div class="sp-rule-why">${escapeHtml(r.warn||r.sub||'')}</div>
      </div>`;
    });
    h+=`</div>`;
  });
  h+=`</div></div>`;

  const dreamEntries=S.entries.filter(e=>e.dream&&e.dream.trim()).sort((a,b)=>a.date.localeCompare(b.date));
  h+=`<div class="sp-section">
    <div class="sp-label">Wat ik bouw — droomwerk</div>`;
  if(dreamEntries.length===0){
    h+=`<div class="dr-empty">
      <div class="dr-empty-ic">🎯</div>
      <div class="dr-empty-t">Nog niets gebouwd</div>
      <div class="dr-empty-s">Voeg een dag toe in Journey en schrijf wat je deed aan je droom. Na 75 dagen staat hier alles wat je hebt gebouwd.</div>
    </div>`;
  } else {
    const totalMin=dreamEntries.length*30;
    const hrs=Math.floor(totalMin/60),mins=totalMin%60;
    h+=`<div class="dr-stats">
      <div class="dr-stat"><div class="dr-stat-n">${dreamEntries.length}</div><div class="dr-stat-l">Sessies</div></div>
      <div class="dr-stat"><div class="dr-stat-n">${hrs>0?hrs+'u':totalMin+'m'}</div><div class="dr-stat-l">Gewerkt</div></div>
      <div class="dr-stat"><div class="dr-stat-n">${Math.round(dreamEntries.length/75*100)}%</div><div class="dr-stat-l">Van 75</div></div>
    </div>`;
    h+=`<div class="dr-list">`;
    dreamEntries.slice().reverse().forEach(e=>{
      const grade=getDayGrade(e.date);
      const parts=e.date.split('-');
      const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
      h+=`<div class="dr-item">
        <div class="dr-item-top">
          <div><span class="dr-item-day">DAG ${e.dayNum}</span> <span class="dr-item-date">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</span></div>
          <div class="dr-item-grade" style="color:${gradeColor(grade)}">${grade}</div>
        </div>
        <div class="dr-item-txt">${escapeHtml(e.dream)}</div>
      </div>`;
    });
    h+=`</div>`;
  }
  h+=`</div>`;

  h+=`<div class="sp-section">
    <div class="sp-label muted">Wat je zei op dag 1</div>
    <div class="sp-profile-grid">
      <div class="sp-pf-item"><div class="sp-pf-lbl">Dagelijks leven</div><div class="sp-pf-val">${escapeHtml(p.daily)}</div></div>
      <div class="sp-pf-item"><div class="sp-pf-lbl">Wat je energie geeft</div><div class="sp-pf-val">${escapeHtml(p.energy)}</div></div>
      <div class="sp-pf-item"><div class="sp-pf-lbl">Je verhaal</div><div class="sp-pf-val">${escapeHtml(p.story)}</div></div>
      <div class="sp-pf-item"><div class="sp-pf-lbl">Sterktes</div><div class="sp-pf-val">${escapeHtml(p.strengths)}</div></div>
      <div class="sp-pf-item"><div class="sp-pf-lbl">Zwaktes</div><div class="sp-pf-val">${escapeHtml(p.weak)}</div></div>
      <div class="sp-pf-item"><div class="sp-pf-lbl">Wie je op dag 75 wil zijn</div><div class="sp-pf-val">${escapeHtml(p.goal)}</div></div>
    </div>
  </div>`;

  h+=`<div class="sp-section">
    <div class="sp-label muted">Spiegel-acties</div>
    <div class="sp-action-row">
      <button class="sp-action-btn primary" onclick="weekReview()">Week review</button>
      <button class="sp-action-btn" onclick="growthCheck()">Groei-check</button>
    </div>
    <div id="review-result" style="display:none;margin-top:14px"></div>
  </div>`;

  document.getElementById('sp-scroll').innerHTML=h;
}

async function weekReview(){
  const el=document.getElementById('review-result');
  el.style.display='block';
  el.innerHTML=`<div class="review-result">
    <div class="review-result-top"><div class="ai-pulse"></div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--ac);text-transform:uppercase">Week review wordt geschreven…</div></div>
    <div class="review-body">Claude analyseert je laatste 7 dagen…</div>
  </div>`;
  el.scrollIntoView({behavior:'smooth',block:'start'});

  const days=[];
  const rs=rules();
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const k=localDate(d);
    const c=S.checks[k]||{};
    const done=rs.filter(r=>c[r.id]).length;
    const entry=entryForDate(k);
    const w=S.whoop[k]||{};
    const grade=getDayGrade(k);
    const start=startDateObj();
    const dayN=Math.floor((new Date(parseInt(k.split('-')[0]),parseInt(k.split('-')[1])-1,parseInt(k.split('-')[2]))-new Date(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1;
    if(dayN>0&&dayN<=75) days.push({date:k,dayN,done,total:rs.length,grade,dream:entry?entry.dream:'',recovery:w.rec,sleep:w.slp,strain:w.str});
  }
  const summary=days.map(d=>`Dag ${d.dayN}: ${d.done}/${d.total}, ${d.grade}${d.recovery!==undefined?`, rec ${d.recovery}%`:''}${d.sleep!==undefined?`, slp ${d.sleep}u`:''}${d.dream?`, droomwerk: "${d.dream.slice(0,80)}"`:''}`).join('\n');
  const avg=days.length?Math.round(days.reduce((a,d)=>a+d.done,0)/days.length*10)/10:0;
  const complete=days.filter(d=>d.total>0&&d.done===d.total).length;

  const prompt=`Je bent een directe, eerlijke coach. ${buildCoachContext()}

WEEK OVERZICHT (laatste 7 dagen):
${summary}
Gemiddeld: ${avg}/${rs.length} wetten per dag. ${complete}/${days.length} complete dagen.

Schrijf een wekelijkse review in 4 delen, met deze EXACTE kopjes:

WAT GING GOED
(concrete observaties, geen vage complimenten — 2-3 zinnen)

WAT MOET BETER
(direct, scherp, eerlijk — geen sugar-coating, verwijs naar zijn/haar schaduw — 2-3 zinnen)

PATROON
(wat zie je terugkomen in zijn/haar data deze week? 1-2 zinnen)

FOKUS VOLGENDE WEEK
(één concrete opdracht — geen lijst — 1 zin)

Schrijf scherp, direct, in zijn/haar taal. Spreek 'je' aan. Nederlands. Geen markdown, geen sterretjes, gewoon platte tekst met de hoofdletter-kopjes.`;

  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:1200});
    const txt=data.content?.[0]?.text||'Kon niet laden.';
    const weekNum=Math.ceil(dayNum()/7);
    el.innerHTML=`<div class="review-result">
      <div class="review-result-top"><div class="ai-pulse"></div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--ac);text-transform:uppercase">Week ${weekNum} — Claude review</div></div>
      <div class="review-body">${escapeHtml(txt)}</div>
    </div>`;
  }catch(e){
    el.innerHTML=`<div class="review-result"><div class="review-body" style="color:var(--red)">Kon niet laden. Probeer opnieuw.</div></div>`;
  }
}

async function growthCheck(){
  const el=document.getElementById('review-result');
  el.style.display='block';
  el.innerHTML=`<div class="review-result">
    <div class="review-result-top"><div class="ai-pulse"></div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--ac);text-transform:uppercase">Groei-check wordt geschreven…</div></div>
    <div class="review-body">Claude vergelijkt jouw dag 1 met nu…</div>
  </div>`;
  el.scrollIntoView({behavior:'smooth',block:'start'});

  const rs=rules();
  const n=dayNum();
  let totalDone=0;
  Object.values(S.checks).forEach(v=>{if(rs.filter(r=>v[r.id]).length===rs.length)totalDone++;});
  const dreamEntries=S.entries.filter(e=>e.dream&&e.dream.trim()).length;
  const lastDreams=S.entries.filter(e=>e.dream&&e.dream.trim()).slice(-5).map(e=>`Dag ${e.dayNum}: ${e.dream.slice(0,100)}`).join('\n');

  const prompt=`Je bent een directe, eerlijke coach. ${buildCoachContext()}

Persoon is nu op dag ${n}/75. Tot nu toe: ${totalDone} complete dagen, ${dreamEntries} droomwerk-sessies, ${S.restarts} restarts.
Laatste droomwerk-sessies:
${lastDreams||'geen'}

Schrijf in 4-5 zinnen een eerlijke groei-check. Vergelijk waar deze persoon zei dat ze stond (in hun verhaal en zwaktes) met waar ze nu staat in de data. Wat is écht veranderd? Wat niet? Geen kleffe zin als "je bent zoveel gegroeid". Geef bewijs. Eindig met de vraag die ze zichzelf nu moeten stellen.

Nederlands. Direct. 'Je' aanspreken. Geen markdown.`;

  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:800});
    const txt=data.content?.[0]?.text||'Kon niet laden.';
    el.innerHTML=`<div class="review-result">
      <div class="review-result-top"><div class="ai-pulse"></div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--ac);text-transform:uppercase">Groei-check — Dag ${n}</div></div>
      <div class="review-body">${escapeHtml(txt)}</div>
    </div>`;
  }catch(e){
    el.innerHTML=`<div class="review-result"><div class="review-body" style="color:var(--red)">Kon niet laden.</div></div>`;
  }
}
