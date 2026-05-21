// ═══════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════
const THEME_OPTIONS = [
  { id:'arctic', name:'Arctic', ac:'#5ef0ff', acStrong:'#7df5ff', rgb:'94,240,255' },
  { id:'solar',  name:'Solar',  ac:'#ff8a3d', acStrong:'#ffaa6d', rgb:'255,138,61' },
  { id:'plasma', name:'Plasma', ac:'#ff4dd2', acStrong:'#ff7de0', rgb:'255,77,210' },
  { id:'forest', name:'Forest', ac:'#7dd87d', acStrong:'#a3e8a3', rgb:'125,216,125' },
  { id:'volt',   name:'Volt',   ac:'#ffe14d', acStrong:'#ffed80', rgb:'255,225,77' },
  { id:'coral',  name:'Coral',  ac:'#ff6363', acStrong:'#ff8b8b', rgb:'255,99,99' },
];

function loadTheme(){ return localStorage.getItem('75h_theme') || 'arctic'; }

function saveTheme(id){ localStorage.setItem('75h_theme', id); }

function applyTheme(id){
  const t = THEME_OPTIONS.find(x=>x.id===id) || THEME_OPTIONS[0];
  const r = document.documentElement.style;
  r.setProperty('--ac', t.ac);
  r.setProperty('--ac-strong', t.acStrong);
  r.setProperty('--ac-dim', `rgba(${t.rgb},0.12)`);
  r.setProperty('--ac-glow', `rgba(${t.rgb},0.22)`);
  r.setProperty('--ac-rgb', t.rgb);
}

function selectTheme(id){
  saveTheme(id);
  applyTheme(id);
  renderThemeGrid();
}

function renderThemeGrid(){
  const el = document.getElementById('theme-grid');
  if(!el) return;
  const cur = loadTheme();
  el.innerHTML = THEME_OPTIONS.map(t=>`
    <button class="theme-tile${t.id===cur?' on':''}" onclick="selectTheme('${t.id}')" style="--tile-ac:${t.ac}">
      <div class="theme-dot" style="background:${t.ac}"></div>
      <div class="theme-name">${t.name}</div>
    </button>`).join('');
}
