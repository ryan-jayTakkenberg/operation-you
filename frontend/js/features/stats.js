// ═══════════════════════════════
// STATS — streak, grid, grades
// ═══════════════════════════════
function calcStreak(){
  let streak=0;
  const rs=rules();
  if(!rs.length)return 0;
  for(let i=dayNum()-2;i>=0;i--){
    const start=startDateObj();
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate());
    d.setDate(d.getDate()+i);
    const k=localDate(d);
    const c=S.checks[k]||{};
    if(rs.filter(r=>c[r.id]).length===rs.length)streak++;
    else break;
  }
  return streak;
}

function renderStats(){
  if(!document.getElementById('g75')) return;
  const td=today();let h='';
  const start=startDateObj();
  const rs=rules();
  for(let i=0;i<75;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate());
    d.setDate(d.getDate()+i);
    const k=localDate(d);
    const c=S.checks[k]||{};
    const done=rs.filter(r=>c[r.id]).length;
    const fail=S.fails.find(f=>f.date===k);
    let cls='';
    if(k===td)cls='now';else if(fail)cls='fail';else if(rs.length>0&&done===rs.length)cls='ok';
    h+=`<div class="g75 ${cls}">${i+1}</div>`;
  }
  document.getElementById('g75').innerHTML=h;
  let totalDone=0;
  Object.entries(S.checks).forEach(([k,v])=>{if(rs.length>0&&rs.filter(r=>v[r.id]).length===rs.length)totalDone++;});
  document.getElementById('ss-done').textContent=totalDone;
  document.getElementById('ss-str').textContent=calcStreak();
  document.getElementById('ss-rst').textContent=S.restarts;
}

function getDayGrade(date){
  const c=S.checks[date]||{};
  const rs=rules();
  if(!rs.length)return'—';
  const done=rs.filter(r=>c[r.id]).length;
  const total=rs.length;
  const hasEntry=!!entryForDate(date);
  const pct=done/total;
  if(pct===1&&hasEntry)return'A+';
  if(pct===1)return'A';
  if(pct>=0.85)return'B';
  if(pct>=0.65)return'C';
  if(pct>=0.4)return'D';
  return'F';
}

function gradeColor(g){
  if(g==='A+'||g==='A')return'var(--ac)';
  if(g==='B')return'#4a6b35';
  if(g==='C')return'var(--orange)';
  if(g==='D')return'#a06628';
  if(g==='—')return'var(--dim)';
  return'var(--red)';
}

function renderDots75Me(){
  renderDots75('g75', 'grid');
}
