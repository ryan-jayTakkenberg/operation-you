// ═══════════════════════════════
// MILESTONES
// ═══════════════════════════════
const MILESTONES={
  7:{emoji:'⚡',title:'DAG 7',sub:'EERSTE WEEK VOLTOOID'},
  21:{emoji:'🔥',title:'DAG 21',sub:'3 WEKEN — GEWOONTE GEBOUWD'},
  30:{emoji:'💪',title:'DAG 30',sub:'EEN MAAND STERK'},
  50:{emoji:'🏆',title:'DAG 50',sub:'MEER DAN HALVERWEGE'},
  75:{emoji:'👑',title:'DAG 75',sub:'OPERATION VOLTOOID'},
};

function checkMilestone(){
  const n=dayNum();
  const ms=MILESTONES[n];
  if(!ms)return;
  const c=todayChecks();
  const rs=rules();
  const done=rs.filter(r=>c[r.id]).length;
  if(rs.length===0||done<rs.length)return;
  if(S.milestones&&S.milestones[n])return;
  if(!S.milestones)S.milestones={};
  S.milestones[n]=true;
  save();
  showMilestone(n,ms);
}

async function showMilestone(n,ms){
  document.getElementById('ms-emoji').textContent=ms.emoji;
  document.getElementById('ms-title').textContent=ms.title;
  document.getElementById('ms-sub').textContent=ms.sub;
  document.getElementById('ms-msg').textContent='Claude schrijft jouw persoonlijke boodschap...';
  document.getElementById('milestone-overlay').classList.remove('hidden');
  const rs=rules();
  let totalDone=0;
  Object.entries(S.checks).forEach(([k,v])=>{if(rs.filter(r=>v[r.id]).length===rs.length)totalDone++;});
  const dreamEntries=S.entries.filter(e=>e.dream&&e.dream.trim()).length;
  const prompt=`Je bent een directe coach. ${buildCoachContext()}

Hij/zij heeft net dag ${n} van zijn/haar 75 dagen voltooid — ${ms.sub.toLowerCase()}.
Stats: ${totalDone} complete dagen, ${dreamEntries} droomsessies. Restarts: ${S.restarts}.
${n===30?'Bijzonder: in zijn/haar verhaal staat dat ze altijd stopt na een maand. Verwijs daar naar.':''}
${n===75?'Hij/zij heeft de volledige 75 dagen voltooid.':''}

3-4 zinnen. Eerlijk, direct. Geen "gefeliciteerd". Begin met iets scherps dat raakt. Verwijs naar hun specifieke verhaal of schaduw. Spreek 'je' aan. Nederlands.`;
  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:500});
    document.getElementById('ms-msg').textContent=data.content?.[0]?.text||'Ga door.';
  }catch(e){
    document.getElementById('ms-msg').textContent='Dag '+n+' voltooid. Morgen weer.';
  }
}

function closeMilestone(){document.getElementById('milestone-overlay').classList.add('hidden');}
