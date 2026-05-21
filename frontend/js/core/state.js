// ═══════════════════════════════
// STATE
// ═══════════════════════════════
const SECTION_META = {
  ochtend:{icon:'🌅',name:'Ochtend'},
  dag:{icon:'☀️',name:'Hele dag'},
  fysiek:{icon:'🥊',name:'Fysiek'},
  mentaal:{icon:'🧠',name:'Mentaal'},
  avond:{icon:'🌙',name:'Avond'}
};
const SECTION_ORDER = ['ochtend','dag','fysiek','mentaal','avond'];

let S = JSON.parse(localStorage.getItem('75h6')||'null') || {
  profile:null,    // {name,age,daily,energy,story,strengths,weak,goal}
  identity:null,   // {name, manifesto, shadow, rules:[...]}
  startDate:null,  // YYYY-MM-DD
  checks:{}, fails:[], restarts:0, entries:[], whoop:{}, milestones:{}
};
function save(){
  localStorage.setItem('75h6',JSON.stringify(S));
  API.syncState(S);  // sync to server in background (noop if offline/not logged in)
}

let picData=null, activeDetailDay=null, modalTargetDay=null;

// ═══════════════════════════════
// DATE HELPERS
// ═══════════════════════════════
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function today(){return localDate(new Date());}
function startDateObj(){
  if(!S.startDate) return new Date();
  const p=S.startDate.split('-');
  return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
}
function dayNum(){
  if(!S.startDate) return 1;
  const start=startDateObj();
  const startLocal=new Date(start.getFullYear(),start.getMonth(),start.getDate());
  const now=new Date();
  const nowLocal=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const diff=Math.floor((nowLocal-startLocal)/86400000);
  return Math.max(1,Math.min(75,diff+1));
}
function dateForDay(n){
  const d=startDateObj();
  d.setDate(d.getDate()+n-1);
  return localDate(d);
}
function rules(){return (S.identity&&S.identity.rules)||[];}
function todayChecks(){if(!S.checks[today()])S.checks[today()]={};return S.checks[today()];}
function progress(){const c=todayChecks();const rs=rules();const done=rs.filter(r=>c[r.id]).length;return{done,total:rs.length};}
function entryForDate(date){return S.entries.find(e=>e.date===date)||null;}
