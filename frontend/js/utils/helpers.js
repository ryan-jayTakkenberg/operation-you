// ═══════════════════════════════
// HELPERS — shared utilities (global, no module system)
// ═══════════════════════════════

// ── HTML escaping ────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Coach context builder ─────────────────────────────────────
// Used by journey.js, spiegel.js, coach.js, modal.js, milestones.js, whoop.js
function buildCoachContext(){
  const p=S.profile||{}, id=S.identity||{};
  return `Persoon: ${p.name||'?'}, ${p.age||'?'}.
Leven: ${(p.daily||'').slice(0,250)}
Verhaal in 't kort: ${(p.story||'').slice(0,300)}
Sterktes: ${(p.strengths||'').slice(0,150)}
Zwaktes: ${(p.weak||'').slice(0,200)}
Doel dag 75: ${(p.goal||'').slice(0,200)}
Schaduw: ${id.shadow||''}`;
}

// ── 75-day dot grid renderer ──────────────────────────────────
// containerId  — the element to populate
// mode         — 'dots' (small .dd divs, uses dot75 logic) or 'grid' (numbered .g75 divs)
function renderDots75(containerId, mode){
  const el = document.getElementById(containerId);
  if(!el) return;
  const rs = rules();
  const td = today();
  const n = dayNum();
  let h = '';
  if(mode === 'grid'){
    // Numbered grid used on the Me/Stats screen (#g75)
    for(let i=1;i<=75;i++){
      const d = new Date(S.startDate||new Date());
      d.setDate(d.getDate()+(i-1));
      const k = d.toISOString().slice(0,10);
      const c = S.checks[k]||{};
      const done = rs.length>0 && rs.filter(r=>c[r.id]).length===rs.length;
      const fail = (S.fails||[]).find ? !!(S.fails||[]).find(f=>f.date===k) : (S.fails||[]).includes(k);
      let cls = 'g75';
      if(i===n) cls+=' now';
      else if(fail) cls+=' fail';
      else if(done) cls+=' ok';
      h+=`<div class="${cls}"></div>`;
    }
  } else {
    // Small dot strip used on Today screen (#dot75)
    const start = startDateObj();
    for(let i=0;i<75;i++){
      const d = new Date(start.getFullYear(),start.getMonth(),start.getDate());
      d.setDate(d.getDate()+i);
      const k = localDate(d);
      const c = S.checks[k]||{};
      const done = rs.filter(r=>c[r.id]).length;
      const fail = S.fails.find(f=>f.date===k);
      let cls = '';
      if(k===td) cls='now';
      else if(fail) cls='fail';
      else if(rs.length>0 && done===rs.length) cls='ok';
      else if(k<td) cls='fail';
      h+=`<div class="dd ${cls}"></div>`;
    }
  }
  el.innerHTML = h;
}
