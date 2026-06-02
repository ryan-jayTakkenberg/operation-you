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
  checks:{}, fails:[], restarts:0, entries:[], whoop:{}, milestones:{},
  mood:{},         // {'YYYY-MM-DD': {score, note}}
  dayQuotes:{},    // {'YYYY-MM-DD': {text, tone, count}}
  chat:[],         // [{role, content, ts}]
  notif:null,      // {morning:{enabled,time}, evening:{enabled,time}, lastFired:{}}
  backlog:[],      // [{id,title,desc,priority,status,notes,createdAt,updatedAt}]
  casinoMode:{ enabled:true, days:[5,6], label:'Nachtdienst', exemptSections:['avond'] },
  dayInsight:{},
  quickLogs:[],
  trainingLog:[]  // [{id, date, activity, intensity, duration, note, ts}]
};
// migration guards voor bestaande localStorage-data
if(!S.mood) S.mood = {};
if(!S.dayQuotes) S.dayQuotes = {};
if(!S.chat) S.chat = [];
if(!S.backlog) S.backlog = [];
if(!S.notif) S.notif = {morning:{enabled:false,time:'08:00'},evening:{enabled:false,time:'21:00'},lastFired:{}};
if(!S.casinoMode) S.casinoMode = { enabled:true, days:[5,6], label:'Nachtdienst', exemptSections:['avond'] };
if(!S.casinoMode.label) S.casinoMode.label = 'Nachtdienst';
if(!S.casinoMode.exemptSections) S.casinoMode.exemptSections = ['avond'];
if(!S.dayInsight) S.dayInsight = {};
if(!S.quickLogs) S.quickLogs = [];
if(!S.trainingLog) S.trainingLog = [];
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
function progress(){
  const c=todayChecks();const rs=rules();
  const casino=typeof isCasinoDay==='function'&&isCasinoDay();
  const exempt=S.casinoMode.exemptSections||['avond'];
  const active=casino?rs.filter(r=>!exempt.includes(r.section)):rs;
  const done=active.filter(r=>c[r.id]).length;
  return{done,total:active.length,casinoNight:casino};
}
function entryForDate(date){return S.entries.find(e=>e.date===date)||null;}
