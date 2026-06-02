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
  renderRuleAnalytics();
}

function renderRuleAnalytics(){
  const el=document.getElementById('rule-analytics');
  if(!el)return;
  const rs=rules();
  if(!rs.length||!S.startDate){el.innerHTML='';return;}
  const start=startDateObj();
  const now=new Date();
  // collect hit counts per rule over elapsed days (excluding today)
  const hits={};
  const days=[];
  for(let i=0;i<75;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate());
    d.setDate(d.getDate()+i);
    if(d>=now)break;
    const k=localDate(d);
    days.push(k);
    const c=S.checks[k]||{};
    rs.forEach(r=>{
      if(!hits[r.id])hits[r.id]=0;
      if(c[r.id])hits[r.id]++;
    });
  }
  const total=days.length;
  if(!total){el.innerHTML='';return;}
  const rated=rs.map(r=>({r,pct:Math.round((hits[r.id]||0)/total*100)}));
  rated.sort((a,b)=>a.pct-b.pct);
  const weakest=rated.slice(0,3);
  const strongest=rated.slice(-3).reverse();
  const barColor=pct=>pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--ac)';
  const row=({r,pct})=>`
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line)">
      <div style="flex:1;font-size:11px;font-family:var(--mono);color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(r.name)}</div>
      <div style="width:80px;height:4px;background:var(--bg3);flex-shrink:0">
        <div style="width:${pct}%;height:100%;background:${barColor(pct)}"></div>
      </div>
      <div style="width:32px;text-align:right;font-size:11px;font-family:var(--mono);color:var(--muted);flex-shrink:0">${pct}%</div>
    </div>`;
  el.innerHTML=`
    <div style="margin:20px 16px 0">
      <div style="font-size:10px;font-weight:600;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Zwakste wetten</div>
      ${weakest.map(row).join('')}
      <div style="font-size:10px;font-weight:600;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;margin:16px 0 8px">Sterkste wetten</div>
      ${strongest.map(row).join('')}
    </div>`;
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
