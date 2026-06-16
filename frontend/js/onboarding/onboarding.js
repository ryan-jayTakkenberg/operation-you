// ═══════════════════════════════
// ONBOARDING
// ═══════════════════════════════
const ONB_TOTAL=8; // input screens 1-7 + welcome 0 = 8 progress dots; loading & reveal handled separately
let onbStep=0;

function showOnboarding(){
  document.getElementById('onb').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  onbStep=0;
  renderOnbStep();
  prefillOnboarding();
}

function prefillOnboarding(){
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v; };
  set('i-name', 'Ryan-Jay');
  set('i-age', '21');
  set('i-daily', 'Ma–vr stage van 9 tot 17 als HBO ICT-student. Avond gym, BJJ of MMA — ik train gemiddeld 4x per week. Vrijdag en zaterdag nacht werk ik in een casino van 20:00 tot 05:15. Zondag is hersteldag na de casino-nacht: slaap inhalen, weinig structuur. Over ~4 maanden begin ik als officier ICT bij Defensie.');
  set('i-energy', 'BJJ trainen — 3x goud, 2x zilver, 2x brons op toernooien. MMA en kickboks. Gym 4x per week, ook als ik geen zin heb. Bezig zijn met mijn eigen coachingbedrijf voor mannen. YouTube — mijn eigen proces vastleggen en delen. Trading en mijn weg naar een funded account.');
  set('i-story', 'Ik ben 21, laatste jaar HBO ICT, en ga over 4 maanden als officier ICT bij Defensie beginnen. Naast mijn stage werk ik vrijdag en zaterdagnacht in een casino — dat vreet aan slaap en ritme, maar het is wat het is. Sport is mijn constante: BJJ, MMA, kickboks, gym. Ik heb ambitie op meerdere fronten — coaching, YouTube, trading — maar mijn follow-through over langere tijd is mijn zwakste punt. Na een maand val ik terug in oud gedrag, altijd. Die patroon wil ik in deze 75 dagen doorbreken.');
  set('i-strengths', '1. Hoge discipline als ik eenmaal start — ik train ook op slechte dagen en na casino-nachten. 2. Eerlijk met mezelf, ook als het pijn doet. 3. Ik neem initiatief: sport, ondernemerschap, Defensie — ik wacht niet af. 4. Ik kan meerdere fronten tegelijk aanhouden.');
  set('i-weak', 'Na een maand stop ik altijd met nieuwe gewoontes — de initiële push zakt weg en ik val terug. Revenge trading na een verlies: emotie wordt beslissing, ik weet het maar doe het toch. Te veel tegelijk willen waardoor niets echt afkomt. Casino-nachten (vr+za) breken mijn ritme — zondag is een verloren dag door slaaptekort. Vermijd lastige gesprekken liever dan ze direct aan te gaan.');
  set('i-goal', 'Na 75 dagen: ik heb 60+ dagen volledig afgemaakt — dat is bewijs dat ik het patroon van stoppen na een maand heb doorbroken. Mijn trading journal heeft 75 dagen data en ik trade niet meer op emotie. De eerste YouTube video\'s staan online. Ik ben fysiek sterker dan nu. Ik stap Defensie in als iemand die al 75 dagen bewust en gedisciplineerd heeft geleefd.');
}

function hideOnboarding(){
  document.getElementById('onb').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function renderOnbStep(){
  // progress dots — show only for steps 1-7
  const prog=document.getElementById('onb-prog');
  if(onbStep>=1&&onbStep<=7){
    let h='';
    for(let i=1;i<=7;i++){
      let cls='';
      if(i<onbStep) cls='done';
      else if(i===onbStep) cls='on';
      h+=`<div class="onb-pd ${cls}"></div>`;
    }
    prog.innerHTML=h;
    prog.style.display='flex';
  } else {
    prog.innerHTML='';
    prog.style.display='none';
  }

  // step visibility
  document.querySelectorAll('.onb-step').forEach(el=>{
    el.classList.toggle('on',parseInt(el.dataset.step)===onbStep);
  });
  // scroll to top
  document.getElementById('onb-scroll').scrollTop=0;

  // footer logic
  const back=document.getElementById('onb-back-btn');
  const next=document.getElementById('onb-next-btn');
  const foot=document.getElementById('onb-foot');
  if(onbStep===8){
    foot.style.display='none';
  } else if(onbStep===9){
    foot.style.display='flex';
    back.style.visibility='hidden';
    next.textContent='Start de 75 dagen →';
    next.disabled=false;
  } else {
    foot.style.display='flex';
    back.style.visibility=onbStep===0?'hidden':'visible';
    next.textContent= onbStep===0 ? 'Begin →' : onbStep===7 ? 'Claude gaat lezen →' : 'Volgende →';
    next.disabled=false;
  }
}

function validateStep(){
  if(onbStep===1){
    return document.getElementById('i-name').value.trim().length>0 && document.getElementById('i-age').value.trim().length>0;
  }
  if(onbStep===2)return document.getElementById('i-daily').value.trim().length>=20;
  if(onbStep===3)return document.getElementById('i-energy').value.trim().length>=15;
  if(onbStep===4)return document.getElementById('i-story').value.trim().length>=40;
  if(onbStep===5)return document.getElementById('i-strengths').value.trim().length>=15;
  if(onbStep===6)return document.getElementById('i-weak').value.trim().length>=20;
  if(onbStep===7)return document.getElementById('i-goal').value.trim().length>=20;
  return true;
}

function onbNext(){
  if(onbStep>=1&&onbStep<=7){
    if(!validateStep()){
      // soft nudge
      const next=document.getElementById('onb-next-btn');
      next.style.background='var(--red)';
      next.textContent='Schrijf eerst iets meer →';
      setTimeout(()=>{
        next.style.background='var(--ac)';
        next.textContent=onbStep===7 ? 'Claude gaat lezen →' : 'Volgende →';
      },1200);
      return;
    }
  }

  if(onbStep===7){
    // Collect profile, go to loading, fire API
    S.profile = {
      name:document.getElementById('i-name').value.trim(),
      age:parseInt(document.getElementById('i-age').value)||0,
      daily:document.getElementById('i-daily').value.trim(),
      energy:document.getElementById('i-energy').value.trim(),
      story:document.getElementById('i-story').value.trim(),
      strengths:document.getElementById('i-strengths').value.trim(),
      weak:document.getElementById('i-weak').value.trim(),
      goal:document.getElementById('i-goal').value.trim()
    };
    save();
    onbStep=8;
    renderOnbStep();
    rotateLoadMessages();
    generateIdentity();
    return;
  }

  if(onbStep===9){
    // finish
    S.startDate=today();
    save();
    hideOnboarding();
    renderAll();
    go('today');
    setTimeout(loadDayQuote, 500);
    return;
  }

  onbStep++;
  renderOnbStep();
}

function onbBack(){
  if(onbStep>0&&onbStep<8){
    onbStep--;
    renderOnbStep();
  }
}

// Rotating load messages
const LOAD_MSGS=[
  'Je verhaal verwerken…',
  'Patronen vinden in je leven…',
  'Je sterktes en zwaktes wegen…',
  'Wetten ontwerpen die jou raken…',
  'Een naam vinden voor jouw 75 dagen…',
  'Je schaduw benoemen…'
];
let loadInterval=null;
function rotateLoadMessages(){
  const el=document.getElementById('load-msg');
  let i=0;
  el.textContent=LOAD_MSGS[0];
  if(loadInterval)clearInterval(loadInterval);
  loadInterval=setInterval(()=>{
    i=(i+1)%LOAD_MSGS.length;
    el.style.opacity='0';
    setTimeout(()=>{
      el.textContent=LOAD_MSGS[i];
      el.style.opacity='1';
    },300);
  },3000);
}
function stopLoadMessages(){if(loadInterval)clearInterval(loadInterval);}

// CALL CLAUDE to generate identity & rules
async function generateIdentity(retry=0){
  const p=S.profile;
  const prompt=`Je bent een meester-coach met scherp inzicht. Iemand komt naar je toe en wil zichzelf 75 dagen lang dagelijks uitdagen. Hier is wat ze over zichzelf hebben verteld:

NAAM: ${p.name}
LEEFTIJD: ${p.age}
DAGELIJKS LEVEN: ${p.daily}
WAT GEEFT MIJ ENERGIE: ${p.energy}
MIJN VERHAAL: ${p.story}
MIJN STERKTES: ${p.strengths}
WAAR IK VAL: ${p.weak}
WIE IK OP DAG 75 BEN: ${p.goal}

Je opdracht — geef ALLEEN geldige JSON terug, geen tekst eromheen, geen markdown fences:

{
  "name": "Korte krachtige naam voor deze 75 dagen (max 3 woorden, hoofdletters)",
  "manifesto": "Een persoonlijk manifest in 4-5 zinnen, in tweede persoon ('je'). Begin met iets scherps dat ALLEEN op deze persoon slaat. Geen cliché's. Geef ze terug wat ze zelf hebben gezegd, maar dieper - laat zien wat de essentie van hun strijd en hun belofte is. Eindig met een zin die ze in hun darmen voelen.",
  "shadow": "2-3 zinnen over hun schaduw. Direct, eerlijk. Het patroon dat ze deze 75 dagen kapot moeten maken. Geen zoetigheid. Spreek 'je' aan.",
  "rules": [
    { "section":"ochtend", "cat":"KORTE CATEGORIE", "name":"De regel zelf — concreet, dagelijks meetbaar, 1 zin", "sub":"Hoe je het doet — praktische uitvoering", "warn":"Waarom dit voor JOU belangrijk is — verwijs naar iets uit hun verhaal" }
  ]
}

REGELS VOOR DE REGELS:
- EXACT 12 regels. Niet meer, niet minder.
- Verdeel over 5 secties: ochtend, dag, fysiek, mentaal, avond. Section ID moet exact één van deze 5 zijn (lowercase).
- 2-3 regels per sectie. Minstens 2 in elke sectie.
- Elke regel adresseert een ECHTE zwakte of bouwt aan een ECHTE droom van DEZE persoon. Geen generieke 75-Hard regels.
- "warn" verwijst ECHT naar iets specifieks uit hun verhaal. Niet algemeen.
- Schrijf in helder Nederlands. Geen Engels.
- Geen markdown, geen ** of *, geen code fences. Alleen platte tekst in de JSON velden.

Lever GEEN tekst voor of na de JSON. Alleen de JSON.`;

  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:3000});
    let txt=data.content?.[0]?.text||'';
    // Strip code fences if present
    txt=txt.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
    // Try to find JSON object boundaries
    const firstBrace=txt.indexOf('{');
    const lastBrace=txt.lastIndexOf('}');
    if(firstBrace>=0&&lastBrace>firstBrace) txt=txt.slice(firstBrace,lastBrace+1);

    const parsed=JSON.parse(txt);

    // Validate & assign IDs
    if(!parsed.rules||!Array.isArray(parsed.rules)||parsed.rules.length<8){
      throw new Error('Onvoldoende regels gegenereerd');
    }
    parsed.rules=parsed.rules.slice(0,12).map((r,i)=>({
      id:'r'+(i+1),
      section: SECTION_ORDER.includes((r.section||'').toLowerCase()) ? r.section.toLowerCase() : 'dag',
      cat:r.cat||'',
      name:r.name||'Regel '+(i+1),
      sub:r.sub||'',
      warn:r.warn||''
    }));

    S.identity=parsed;
    save();
    stopLoadMessages();
    onbStep=9;
    renderOnbStep();
    renderReveal();
  } catch(e){
    if(retry<1){
      // retry once
      setTimeout(()=>generateIdentity(retry+1),800);
      return;
    }
    stopLoadMessages();
    // Show error in the loading step
    document.querySelector('.onb-loading').innerHTML=`
      <div style="font-size:48px;margin-bottom:20px">⚠</div>
      <div class="load-title" style="color:var(--red)">Kon je wetten niet bouwen</div>
      <div style="font-size:14px;color:var(--muted);line-height:1.6;font-weight:300;max-width:300px;margin-top:14px;text-align:center">${(e&&e.message)||'Verbinding met Claude lukt nu niet.'}</div>
      <button onclick="generateIdentity(0)" style="margin-top:24px;padding:12px 24px;background:var(--ac);color:#000;font-family:var(--mono);font-size:13px;font-weight:700;letter-spacing:.1em;border:none;border-radius:2px;cursor:pointer;text-transform:uppercase">Probeer opnieuw</button>
      <button onclick="onbStep=7;renderOnbStep()" style="margin-top:10px;padding:10px 20px;background:none;border:1px solid var(--line2);color:var(--muted);font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.1em;border-radius:2px;cursor:pointer;text-transform:uppercase">Terug</button>
    `;
  }
}

function renderReveal(){
  const id=S.identity;
  if(!id){return;}
  const p=S.profile;
  let h='';
  h+=`<div class="reveal-eyebrow">Hallo ${p.name||''} — dit ben jij</div>`;
  h+=`<div class="reveal-name">${(id.name||'JOUW 75').replace(/(\S+)$/,'<span>$1</span>')}</div>`;
  h+=`<div class="reveal-tag">Geschreven door Claude — op basis van jouw verhaal</div>`;

  h+=`<div class="reveal-card manifest">
    <div class="reveal-card-title">Manifest</div>
    <div class="reveal-text">${escapeHtml(id.manifesto||'')}</div>
  </div>`;

  h+=`<div class="reveal-card shadow">
    <div class="reveal-card-title danger">Je schaduw — waar je voor wakker moet zijn</div>
    <div class="reveal-text">${escapeHtml(id.shadow||'')}</div>
  </div>`;

  h+=`<div class="reveal-rules-title">Jouw 12 wetten</div>`;
  h+=`<div class="reveal-rules-sub">Elke dag. 75 dagen. Eén missen = terug naar dag 1.</div>`;

  let ruleNum=1;
  SECTION_ORDER.forEach(secKey=>{
    const meta=SECTION_META[secKey];
    const secRules=id.rules.filter(r=>r.section===secKey);
    if(!secRules.length)return;
    h+=`<div class="reveal-sec">
      <div class="reveal-sec-head"><span class="reveal-sec-icon">${meta.icon}</span><span class="reveal-sec-name">${meta.name}</span></div>`;
    secRules.forEach(r=>{
      h+=`<div class="reveal-rule">
        <div class="reveal-rule-num">${ruleNum++}.</div>
        <div class="reveal-rule-body">
          <div class="reveal-rule-name">${escapeHtml(r.name)}</div>
          <div class="reveal-rule-why">${escapeHtml(r.warn||r.sub||'')}</div>
        </div>
      </div>`;
    });
    h+=`</div>`;
  });

  h+=`<div class="reveal-edit-hint">Je kunt de wetten later opnieuw laten schrijven via Stats → "Wetten opnieuw laten schrijven".</div>`;
  document.getElementById('reveal-content').innerHTML=h;
}

function skipOnboarding(){
  S.profile = {
    name:'Test', age:21,
    daily:'(nog niet ingevuld — ga naar Stats om je echte profiel te bouwen)',
    energy:'(nog niet ingevuld)',
    story:'(nog niet ingevuld)',
    strengths:'(nog niet ingevuld)',
    weak:'(nog niet ingevuld)',
    goal:'(nog niet ingevuld)'
  };
  S.identity = {
    name:'JOUW 75',
    manifesto:'Dit is een tijdelijk manifest. Ga naar Stats en klik op "Profiel opnieuw invullen" om je persoonlijke manifest te krijgen — geschreven door Claude op basis van jouw verhaal, je sterktes, je zwaktes en wie je op dag 75 wil zijn.',
    shadow:'Vul je profiel in om je echte schaduw-patroon te zien — dat is het patroon dat deze 75 dagen kapot moet.',
    rules:[
      {id:'r1',section:'ochtend',cat:'JOURNAL',name:'Ochtend journal — 3 vragen',sub:'1. Hoe voel ik me? 2. Wat is mijn prioriteit? 3. Wie wil ik vandaag zijn?',warn:'Standaardregel — vul je profiel in voor persoonlijke wetten'},
      {id:'r2',section:'ochtend',cat:'KOUDE DOUCHE',name:'Koude douche — 2 minuten',sub:'Direct na opstaan, geen warm water ervoor',warn:'Bouwt de mentale spier voor lastige beslissingen'},
      {id:'r3',section:'ochtend',cat:'VOEDING',name:'Eiwitrijk ontbijt + supplementen',sub:'Geen suiker, geen junk',warn:'Consistente energie de hele dag'},
      {id:'r4',section:'dag',cat:'WATER',name:'3 liter water',sub:'Tel bij. Koffie telt niet.',warn:'Meten, niet gokken'},
      {id:'r5',section:'dag',cat:'VOEDING',name:'Geen junk, suiker of alcohol',sub:'Geen cheatdays',warn:'Geen uitzonderingen'},
      {id:'r6',section:'dag',cat:'FOCUS',name:'Max 1 uur schermtijd (social)',sub:'iPhone → Schermtijd instellen',warn:'Instellen en handhaven'},
      {id:'r7',section:'fysiek',cat:'TRAINING',name:'Training 45 minuten',sub:'Gym, BJJ, MMA of kickboks. Rustdag = 45 min wandelen',warn:'Geen uitzonderingen'},
      {id:'r8',section:'fysiek',cat:'BUITEN',name:'20 min buiten of mobility',sub:'Niet dezelfde sport als training 1',warn:'Lichaam vrijhouden'},
      {id:'r9',section:'mentaal',cat:'DROOM',name:'30 min werken aan je droom',sub:'Trading, YouTube, leren — concreet werk',warn:'Elke dag — geen excuses'},
      {id:'r10',section:'mentaal',cat:'KENNIS',name:'10 pagina\'s lezen of 20 min audioboek',sub:'Bijbel, psychologie, business — niet YouTube',warn:'YouTube telt NIET als kennis'},
      {id:'r11',section:'avond',cat:'JOURNAL',name:'Avond journal + dankbaarheid',sub:'Pen en papier — 4 reflectievragen + 1 zin dankbaarheid',warn:'Telefoon weg tijdens schrijven'},
      {id:'r12',section:'avond',cat:'SLAAP',name:'7 uur slaap',sub:'Niet-casinodagen minimum',warn:'Slaap is je beste recovery tool'}
    ]
  };
  S.startDate = today();
  seedBacklog();
  markBuiltIssuesDone();
  save();
  hideOnboarding();
  renderAll();
  setTimeout(()=>{loadDayQuote();go('build');},200);
  startNotifScheduler();
}

function resetProfileOnly(){
  showConfirm('Profiel opnieuw invullen','Je gaat de onboarding opnieuw doorlopen — naam, verhaal, sterktes, zwaktes, dag-75 visie. Claude bouwt op basis daarvan nieuwe persoonlijke wetten.\n\nJe backlog, journey, Whoop data en alle andere voortgang blijft staan.',
    ()=>{
      S.profile=null;
      S.identity=null;
      S.startDate=null;
      S.dayQuotes={};
      save();
      onbStep=0;
      document.getElementById('onb').classList.remove('hidden');
      document.getElementById('app').classList.add('hidden');
      renderOnbStep();
    });
}

function redoOnboarding(){
  showConfirm('Wetten opnieuw schrijven','Je profiel-antwoorden blijven staan, maar Claude bouwt opnieuw je manifest en je 12 wetten op basis daarvan.',
    ()=>{
      onbStep=8;
      document.getElementById('onb').classList.remove('hidden');
      document.getElementById('app').classList.add('hidden');
      renderOnbStep();
      rotateLoadMessages();
      generateIdentity();
    });
}
