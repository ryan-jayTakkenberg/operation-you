// ═══════════════════════════════
// JOURNEY — grid, detail overlay, day export
// ═══════════════════════════════
function renderJourney(){
  if(!document.getElementById('grid75')) return;
  const rs=rules();
  const done=Object.values(S.checks).filter(v=>rs.length>0 && rs.filter(r=>v[r.id]).length===rs.length).length;
  const entries=S.entries.length;
  const streak=calcStreak();
  document.getElementById('profile-stats').innerHTML=`
    <div class="pstat"><div class="pstat-n">${done}</div><div class="pstat-l">Voltooid</div></div>
    <div class="pstat"><div class="pstat-n">${entries}</div><div class="pstat-l">Posts</div></div>
    <div class="pstat"><div class="pstat-n">${streak}</div><div class="pstat-l">Streak</div></div>`;

  const td=today();let h='';
  const start=startDateObj();
  for(let i=0;i<75;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate());
    d.setDate(d.getDate()+i);
    const k=localDate(d);
    const dayN=i+1;
    const c=S.checks[k]||{};
    const dn=rs.filter(r=>c[r.id]).length;
    const fail=S.fails.find(f=>f.date===k);
    const entry=entryForDate(k);
    const isTd=k===td;
    const isPast=k<td&&!isTd;
    let badgeCls='',badgeTxt='';
    if(isTd){badgeCls='today';badgeTxt='VANDAAG';}
    else if(fail){badgeCls='partial';badgeTxt='FAIL';}
    else if(rs.length>0 && dn===rs.length){badgeCls='done';badgeTxt='✓';}
    else if(dn>0&&isPast){badgeCls='partial';badgeTxt=dn+'/'+rs.length;}
    else if(!entry&&!isPast&&!isTd){badgeCls='empty';badgeTxt='DAG '+dayN;}

    if(entry&&entry.photo){
      h+=`<div class="grid-cell" onclick="openDetail(${dayN})">
        <img src="${entry.photo}" alt="">
        <div class="grid-cell-overlay"><span class="grid-cell-badge ${badgeCls}">${badgeTxt}</span></div>
      </div>`;
    } else {
      let bg='var(--bg3)',numColor='var(--dim)';
      if(isTd){bg='rgba(234,88,12,0.10)';numColor='var(--ac)';}
      else if(fail||isPast&&dn<rs.length){bg='rgba(168,58,42,0.06)';}
      else if(rs.length>0&&dn===rs.length){bg='rgba(234,88,12,0.08)';}
      h+=`<div class="grid-cell" onclick="openDetail(${dayN})" style="background:${bg}">
        <div class="grid-cell-empty">
          <div class="grid-cell-num" style="color:${numColor}">${dayN}</div>
          ${dn>0?`<div class="grid-cell-dot" style="background:${rs.length>0&&dn===rs.length?'var(--ac)':'var(--orange)'}"></div>`:''}
        </div>
        ${badgeTxt?`<div class="grid-cell-overlay"><span class="grid-cell-badge ${badgeCls}">${badgeTxt}</span></div>`:''}
      </div>`;
    }
  }
  document.getElementById('grid75').innerHTML=h;
}

function openDetail(dayN){
  activeDetailDay=dayN;
  const date=dateForDay(dayN);
  const entry=entryForDate(date);
  const c=S.checks[date]||{};
  const rs=rules();
  const done=rs.filter(r=>c[r.id]).length;
  const w=S.whoop[date]||{};
  const isTd=date===today();

  document.getElementById('detail-lbl').textContent='DAG '+dayN;
  const addBtn=document.getElementById('detail-add-btn');
  addBtn.style.display = (!isTd && date<today() && !entry) ? 'none' : 'block';
  if(isTd) addBtn.style.display='block';

  let h='';
  if(entry&&entry.photo)h+=`<img class="detail-img" src="${entry.photo}" alt="">`;
  else h+=`<div class="detail-img-ph">📷</div>`;

  h+=`<div class="detail-body">`;
  const parts=date.split('-');
  const dateObj=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
  const dateStr=dateObj.toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const grade=getDayGrade(date);
  h+=`<div class="detail-meta"><div class="detail-daynum">DAG ${dayN}</div><div style="display:flex;align-items:center;gap:10px"><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:26px;font-weight:800;color:${gradeColor(grade)}">${grade}</div><div class="detail-date">${dateStr}</div></div></div>`;

  if(entry&&entry.dream)h+=`<div class="detail-txt">${escapeHtml(entry.dream)}</div>`;
  if(entry&&entry.note)h+=`<div class="detail-note">${escapeHtml(entry.note)}</div>`;

  const pct=rs.length?Math.round(done/rs.length*100):0;
  const r=24,circ=2*Math.PI*r;
  const offset=circ-(pct/100*circ);
  h+=`<div class="detail-progress">
    <div class="ring-wrap">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle class="ring-bg" cx="28" cy="28" r="${r}"/>
        <circle class="ring-fill" cx="28" cy="28" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="ring-txt">${pct}%</div>
    </div>
    <div><div class="detail-prog-n">${done} / ${rs.length}</div><div class="detail-prog-s">Wetten voltooid${done===rs.length&&rs.length>0?' — perfecte dag 🔥':''}</div></div>
  </div>`;

  h+=`<div class="detail-rules"><div class="detail-rules-title">Wetten</div>`;
  rs.forEach(r=>{
    const ok=c[r.id];
    h+=`<div class="drule"><div class="drule-dot ${ok?'ok':'miss'}"></div><div class="drule-name ${ok?'ok':'miss'}">${escapeHtml(r.name)}</div></div>`;
  });
  h+=`</div>`;

  if(w.rec!==undefined||w.slp!==undefined||w.str!==undefined){
    h+=`<div class="detail-whoop"><div class="detail-whoop-title">Whoop Data</div>
    <div class="whoop-mini-grid">
      <div class="whoop-mini"><div class="whoop-mini-n r">${w.rec!==undefined?w.rec+'%':'—'}</div><div class="whoop-mini-l">Recovery</div></div>
      <div class="whoop-mini"><div class="whoop-mini-n s">${w.slp!==undefined?w.slp+'u':'—'}</div><div class="whoop-mini-l">Slaap</div></div>
      <div class="whoop-mini"><div class="whoop-mini-n st">${w.str!==undefined?w.str+'/21':'—'}</div><div class="whoop-mini-l">Strain</div></div>
    </div></div>`;
  }

  h+=`<div class="detail-ai" id="detail-ai">`;
  if(entry&&entry.aiFb){
    h+=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude — Dag ${dayN}</div></div><div class="ai-txt">${escapeHtml(entry.aiFb)}</div>`;
  } else if(entry){
    h+=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude feedback</div></div><button class="get-fb" onclick="getFbForDay('${date}')">Vraag feedback voor dag ${dayN}</button>`;
  } else {
    h+=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude feedback</div></div><div class="ai-txt" style="color:var(--dim)">Voeg eerst een entry toe voor AI feedback.</div>`;
  }
  h+=`</div>`;

  h+=`<div class="export-wrap"><button class="export-btn" onclick="exportDay('${date}',${dayN})">Exporteer dag ${dayN} als tekst</button></div>`;
  h+=`</div>`;
  document.getElementById('detail-scroll').innerHTML=h;
  document.getElementById('detail-overlay').classList.add('open');
}

function closeDetail(){document.getElementById('detail-overlay').classList.remove('open');activeDetailDay=null;}
function openModalFromDetail(){if(activeDetailDay)openModal(activeDetailDay);}

async function getFbForDay(date){
  const entry=entryForDate(date);
  const el=document.getElementById('detail-ai');
  if(!el||!entry)return;
  const dayN=entry.dayNum;
  el.innerHTML=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude analyseert dag ${dayN}...</div></div><div class="ai-load">Even geduld...</div>`;
  const rs=rules();
  const ok=rs.filter(r=>entry.checks&&entry.checks[r.id]).map(r=>r.name);
  const miss=rs.filter(r=>!entry.checks||!entry.checks[r.id]).map(r=>r.name);
  const w=S.whoop[date]||{};
  const prompt=`Je bent een directe, eerlijke coach. Je kent deze persoon goed:
${buildCoachContext()}

Dag ${dayN} — ${date}:
Wetten gehaald (${ok.length}/${rs.length}): ${ok.join(', ')||'geen'}
Gemist: ${miss.join(', ')||'geen'}
${entry.dream?`Droomwerk: ${entry.dream}`:''}
${entry.note?`Notitie: ${entry.note}`:''}
${w.rec!==undefined?`Whoop: recovery ${w.rec}%, slaap ${w.slp||'?'}u, strain ${w.str||'?'}/21`:''}

3–4 zinnen directe feedback. Geen open deuren. Verwijs naar zijn/haar specifieke verhaal en schaduw. Eindig met één concrete opdracht voor morgen. Nederlands. Spreek 'je' aan.`;
  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:600});
    const txt=data.content?.[0]?.text||'Kon niet laden.';
    const idx=S.entries.findIndex(e=>e.date===date);
    if(idx>=0){S.entries[idx].aiFb=txt;save();}
    el.innerHTML=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude — Dag ${dayN}</div></div><div class="ai-txt">${escapeHtml(txt)}</div>`;
  }catch(e){
    el.innerHTML=`<div class="ai-top"><div class="ai-pulse"></div><div class="ai-lbl">Claude feedback</div></div><div style="color:var(--red);font-size:12px">Kon niet laden.</div><button class="ai-retry" onclick="getFbForDay('${date}')">Opnieuw</button>`;
  }
}

function exportDay(date,dayN){
  const entry=entryForDate(date);
  const c=S.checks[date]||{};
  const w=S.whoop[date]||{};
  const rs=rules();
  const done=rs.filter(r=>c[r.id]).length;
  let txt=`OPERATION YOU — DAG ${dayN}\n${date}\n\n`;
  txt+=`WETTEN: ${done}/${rs.length}\n`;
  rs.forEach(r=>txt+=`${c[r.id]?'✓':'✗'} ${r.name}\n`);
  if(entry&&entry.dream)txt+=`\nDROOMWERK:\n${entry.dream}\n`;
  if(entry&&entry.note)txt+=`\nNOTITIE:\n${entry.note}\n`;
  if(w.rec!==undefined)txt+=`\nWHOOP:\nRecovery: ${w.rec}%\nSlaap: ${w.slp||'—'}u\nStrain: ${w.str||'—'}/21\n`;
  if(entry&&entry.aiFb)txt+=`\nCLAUDE FEEDBACK:\n${entry.aiFb}\n`;
  const blob=new Blob([txt],{type:'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`operation-you-dag${dayN}.txt`;
  a.click();
}
