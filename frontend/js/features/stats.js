// ═══════════════════════════════
// STATS — streak, grid, grades
// ═══════════════════════════════
// Huidige reeks: aaneengesloten complete dagen eindigend op vandaag of gisteren
// (vandaag mag nog niet af zijn). Zelfde semantiek als mobile currentStreak.
function calcStreak(){
  const rs=rules();
  if(!rs.length||!S.startDate)return 0;
  const total=dayNum();
  const isComplete=(n)=>{const dc=S.checks[dateForDay(n)]||{};return rs.every(r=>dc[r.id]);};
  let n=total;
  if(!isComplete(n))n--;
  let run=0;
  while(n>=1&&isComplete(n)){run++;n--;}
  return run;
}

// Area-chart als SVG-string (parity met mobile AreaChart). Waarden 0-100.
function areaChartSVG(values,color){
  const W=100,H=100;
  if(!values.length)return `<div class="v-chart-empty">Nog geen data</div>`;
  const clamp=v=>Math.max(0,Math.min(100,isFinite(v)?v:0));
  const rnd=n=>Math.round(n*100)/100;
  let coords;
  if(values.length===1){const y=H-clamp(values[0])/100*H;coords=[{x:0,y},{x:W,y}];}
  else coords=values.map((v,i)=>({x:i/(values.length-1)*W,y:H-clamp(v)/100*H}));
  const line=coords.map(c=>`${rnd(c.x)},${rnd(c.y)}`).join(' ');
  const first=coords[0],last=coords[coords.length-1];
  const area=`${line} ${rnd(last.x)},${H} ${rnd(first.x)},${H}`;
  const fill=color==='var(--green)'?'rgba(143,180,138,0.12)':'rgba(200,164,92,0.12)';
  return `<svg class="v-chart-svg" width="100%" height="100" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <polygon points="${area}" fill="${fill}"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${rnd(last.x)}" cy="${rnd(last.y)}" r="3" fill="${color}" stroke="var(--bg)" stroke-width="1"/>
  </svg>`;
}

function vBarColor(pct){if(pct>=75)return'var(--green)';if(pct<55)return'var(--red)';return'var(--gold)';}

function renderStats(){
  const host=document.getElementById('voortgang-stats');
  if(!host)return;
  const rs=rules();
  const td=today();
  const elapsed=S.startDate?dayNum():0;

  const streak=calcStreak();
  const avg=avgComplianceWeb();
  let voltooid=0;
  Object.values(S.checks).forEach(v=>{if(rs.length&&rs.every(r=>v[r.id]))voltooid++;});

  // Voltooiing per dag — laatste 30 dagen
  const compSeries=[];
  if(S.startDate&&rs.length&&elapsed>0){
    const startN=Math.max(1,elapsed-29);
    for(let n=startN;n<=elapsed;n++){
      const dc=S.checks[dateForDay(n)]||{};
      compSeries.push(rs.filter(r=>dc[r.id]).length/rs.length*100);
    }
  }
  const lastC=compSeries.length?compSeries[compSeries.length-1]:0;
  const prevC=compSeries.length>1?compSeries[compSeries.length-2]:lastC;
  const compDelta=Math.round(lastC-prevC);

  // Per categorie — gemiddelde naleving per sectie over verstreken dagen
  const present=[...new Set(rs.map(r=>r.section))];
  const ordered=SECTION_ORDER.filter(k=>present.includes(k)).concat(present.filter(k=>!SECTION_ORDER.includes(k)));
  const cats=ordered.map(key=>{
    const meta=SECTION_META[key]||{icon:'•',name:key};
    const secRules=rs.filter(r=>r.section===key);
    let pct=0;
    if(secRules.length&&S.startDate&&elapsed>0){
      let sum=0;
      for(let n=1;n<=elapsed;n++){
        const dc=S.checks[dateForDay(n)]||{};
        sum+=secRules.filter(r=>dc[r.id]).length/secRules.length;
      }
      pct=Math.round(sum/elapsed*100);
    }
    return{icon:meta.icon,label:meta.name,pct};
  });
  let strongest=null,weakest=null;
  if(cats.length){strongest=cats.reduce((a,b)=>b.pct>a.pct?b:a);weakest=cats.reduce((a,b)=>b.pct<a.pct?b:a);}

  // Stemming-trend — laatste 14 dagen (web mood 1-5 → 0-100%)
  const moodSeries=[];
  if(S.startDate&&elapsed>0){
    const startN=Math.max(1,elapsed-13);
    for(let n=startN;n<=elapsed;n++){
      const m=S.mood&&S.mood[dateForDay(n)];
      const val=(typeof m==='object'&&m)?m.score:m;
      if(val===undefined||val===null)continue;
      moodSeries.push((val-1)/4*100);
    }
  }

  // 75-dagen grid
  let dots='';
  for(let i=0;i<75;i++){
    const date=dateForDay(i+1);
    let cls='future';
    if(date<td){
      if(S.fails.find(f=>f.date===date))cls='fail';
      else if(rs.length){
        const done=rs.filter(r=>(S.checks[date]||{})[r.id]).length;
        cls=done===0?'zero':done<rs.length?'partial':'full';
      }
    }else if(date===td){cls='today';}
    dots+=`<div class="v-dot ${cls}"></div>`;
  }

  // Wet-analyse — naleving per wet over verstreken dagen (excl. vandaag)
  let wetCard='';
  const hits={};let pastDays=0;
  for(let n=1;n<=elapsed;n++){
    const date=dateForDay(n);
    if(date>=td)continue;
    pastDays++;
    const dc=S.checks[date]||{};
    rs.forEach(r=>{hits[r.id]=(hits[r.id]||0)+(dc[r.id]?1:0);});
  }
  if(rs.length&&pastDays>0){
    const rated=rs.map(r=>({r,pct:Math.round((hits[r.id]||0)/pastDays*100)})).sort((a,b)=>a.pct-b.pct);
    const wk=rated.slice(0,3),st=rated.slice(-3).reverse();
    const row=(o,mark,color)=>`<div class="v-rule-row">
      <span class="v-rule-mark" style="color:${color}">${mark}</span>
      <span class="v-rule-name">${escapeHtml(o.r.name)}</span>
      <span class="v-rule-track"><span class="v-rule-fill" style="width:${o.pct}%;background:${color}"></span></span>
      <span class="v-rule-pct" style="color:${color}">${o.pct}%</span>
    </div>`;
    wetCard=`<div class="v-card">
      <div class="v-card-head"><div class="v-card-title">Wet-analyse</div><div class="v-card-meta faint">${pastDays} dag${pastDays===1?'':'en'}</div></div>
      <div class="v-subhead weak">Zwakste wetten</div>
      ${wk.map(o=>row(o,'✗','var(--gold)')).join('')}
      <div class="v-subhead strong">Sterkste wetten</div>
      ${st.map(o=>row(o,'✓','var(--green)')).join('')}
    </div>`;
  }

  const insightText=(S.identity&&S.identity.shadow)||'Bouw je geschiedenis op — na een paar dagen zie je hier je patronen.';

  host.innerHTML=`
    <div class="v-header">
      <div class="v-title">Voortgang</div>
      <div class="v-sub">Je groei over 75 dagen.</div>
    </div>

    <div class="v-tiles">
      <div class="v-tile"><div class="v-tile-eyebrow">Huidige reeks</div><div class="v-tile-num">${streak}<span class="v-tile-unit"> dgn</span></div></div>
      <div class="v-tile"><div class="v-tile-eyebrow">Gem. naleving</div><div class="v-tile-num green">${avg}<span class="v-tile-unit">%</span></div></div>
      <div class="v-tile"><div class="v-tile-eyebrow">Dagen voltooid</div><div class="v-tile-num">${voltooid}</div></div>
      <div class="v-tile"><div class="v-tile-eyebrow">Herstarts</div><div class="v-tile-num">${S.restarts||0}</div></div>
    </div>

    <div class="v-card">
      <div class="v-card-head"><div class="v-card-title">Voltooiing per dag</div><div class="v-card-meta ${compDelta<0?'red':''}">${compDelta>=0?'+':''}${compDelta}% vs gisteren</div></div>
      ${areaChartSVG(compSeries,'var(--gold)')}
    </div>

    <div class="v-card">
      <div class="v-card-head"><div class="v-card-title">Per categorie</div></div>
      ${cats.length&&strongest&&weakest?`<div class="v-cat-summary">Sterkste: <b style="color:var(--green)">${escapeHtml(strongest.label)}</b> · Zwakste: <b style="color:var(--red)">${escapeHtml(weakest.label)}</b></div>`:`<div class="v-cat-summary">Nog geen categorieën om te tonen.</div>`}
      <div class="v-bars">
        ${cats.map(c=>{const col=vBarColor(c.pct);return `<div class="v-bar-row">
          <span class="v-bar-label">${c.icon} ${escapeHtml(c.label)}</span>
          <span class="v-bar-track"><span class="v-bar-fill" style="width:${Math.max(0,Math.min(100,c.pct))}%;background:${col}"></span></span>
          <span class="v-bar-pct" style="color:${col}">${c.pct}%</span>
        </div>`;}).join('')}
      </div>
    </div>

    <div class="v-card">
      <div class="v-card-head"><div class="v-card-title">Stemming-trend</div><div class="v-card-meta faint">2 weken</div></div>
      ${areaChartSVG(moodSeries,'var(--green)')}
    </div>

    <div class="v-card">
      <div class="v-card-head"><div class="v-card-title">75 dagen</div></div>
      <div class="v-grid">${dots}</div>
    </div>

    ${wetCard}

    <div class="v-insight">
      <div class="v-insight-badge"><span class="v-insight-dot"></span></div>
      <div style="flex:1;min-width:0">
        <div class="v-insight-eyebrow">AI-inzicht</div>
        <div class="v-insight-text">${escapeHtml(insightText)}</div>
      </div>
    </div>`;
}

// (75-grid wordt nu in renderStats getekend — losse renderDots75Me vervallen)

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
