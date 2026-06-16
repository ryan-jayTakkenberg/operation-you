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
  if(!S.identity){el.innerHTML='';return;}
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
  // only include rules that had at least one opportunity (all rules qualify once total>0)
  const rated=rs.map(r=>({r,pct:Math.round((hits[r.id]||0)/total*100),count:hits[r.id]||0}));
  rated.sort((a,b)=>a.pct-b.pct);
  const weakest=rated.slice(0,3);
  const strongest=rated.slice(-3).reverse();
  const weakRow=({r,pct,count})=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line2)">
      <div style="font-size:10px;font-family:var(--mono);color:var(--ac);flex-shrink:0;font-weight:700">✗</div>
      <div style="flex:1;font-size:11px;font-family:var(--mono);color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(r.name)}</div>
      <div style="width:72px;height:3px;background:var(--bg4);flex-shrink:0">
        <div style="width:${pct}%;height:100%;background:var(--ac)"></div>
      </div>
      <div style="width:34px;text-align:right;font-size:11px;font-family:var(--mono);color:var(--ac);flex-shrink:0;font-weight:600">${pct}%</div>
    </div>`;
  const strongRow=({r,pct,count})=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line2)">
      <div style="font-size:10px;font-family:var(--mono);color:var(--green);flex-shrink:0;font-weight:700">✓</div>
      <div style="flex:1;font-size:11px;font-family:var(--mono);color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(r.name)}</div>
      <div style="width:72px;height:3px;background:var(--bg4);flex-shrink:0">
        <div style="width:${pct}%;height:100%;background:var(--green)"></div>
      </div>
      <div style="width:34px;text-align:right;font-size:11px;font-family:var(--mono);color:var(--green);flex-shrink:0;font-weight:600">${pct}%</div>
    </div>`;
  el.innerHTML=`
    <div style="margin:20px 16px 0;border:1px solid var(--line2);padding:14px 14px 6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.22em;color:var(--muted);text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid var(--line2);padding-bottom:8px">Wet analyse — ${total} dag${total===1?'':'en'}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:.18em;color:var(--ac);text-transform:uppercase;margin-bottom:4px">Zwakste wetten</div>
      ${weakest.map(weakRow).join('')}
      <div style="font-size:9px;font-weight:700;letter-spacing:.18em;color:var(--green);text-transform:uppercase;margin:14px 0 4px">Sterkste wetten</div>
      ${strongest.map(strongRow).join('')}
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
  if(g==='B')return'var(--green)';
  if(g==='C')return'var(--orange)';
  if(g==='D')return'var(--orange)';
  if(g==='—')return'var(--dim)';
  return'var(--red)';
}

function renderDots75Me(){
  renderDots75('g75', 'grid');
}
