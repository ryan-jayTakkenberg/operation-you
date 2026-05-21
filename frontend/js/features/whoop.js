// ═══════════════════════════════
// WHOOP DATA
// ═══════════════════════════════
function renderWhoop(){
  if(!document.getElementById('wv-rec')) return;
  const td=today();const w=S.whoop[td]||{};
  const set=(id,fn)=>{const el=document.getElementById(id);if(el)fn(el);};
  if(w.rec!==undefined){set('wv-rec',el=>el.textContent=w.rec);set('wb-rec',el=>el.style.width=w.rec+'%');set('wi-rec',el=>el.value=w.rec);}
  if(w.hrv!==undefined)set('wi-hrv',el=>el.value=w.hrv);
  if(w.slp!==undefined){set('wv-slp',el=>el.textContent=w.slp);set('wb-slp',el=>el.style.width=Math.min(100,w.slp/10*100)+'%');set('wi-slp',el=>el.value=w.slp);}
  if(w.slps!==undefined)set('wi-slps',el=>el.value=w.slps);
  if(w.str!==undefined){set('wv-str',el=>el.textContent=w.str);set('wb-str',el=>el.style.width=Math.min(100,w.str/21*100)+'%');set('wi-str',el=>el.value=w.str);}
  if(w.cal!==undefined)set('wi-cal',el=>el.value=w.cal);
  renderWhoopHist();
}

function saveWhoop(){
  const td=today();
  S.whoop[td]={
    rec:parseFloat(document.getElementById('wi-rec').value)||undefined,
    hrv:parseFloat(document.getElementById('wi-hrv').value)||undefined,
    slp:parseFloat(document.getElementById('wi-slp').value)||undefined,
    slps:parseFloat(document.getElementById('wi-slps').value)||undefined,
    str:parseFloat(document.getElementById('wi-str').value)||undefined,
    cal:parseFloat(document.getElementById('wi-cal').value)||undefined
  };
  save();renderWhoop();
}

function renderWhoopHist(){
  const histEl=document.getElementById('w-hist');
  if(!histEl) return;
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    days.push(localDate(d));
  }
  const items=days.filter(k=>S.whoop[k]&&Object.values(S.whoop[k]).some(v=>v!==undefined));
  if(!items.length){histEl.innerHTML='<div style="padding:8px 16px;font-size:12px;color:var(--dim)">Nog geen data.</div>';return;}
  histEl.innerHTML=items.reverse().map(k=>{
    const w=S.whoop[k];
    const parts=k.split('-');
    const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
    return`<div class="w-hist-row"><div class="w-hist-d">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div><div class="w-hist-vals">${w.rec!==undefined?`<span class="whv r">${w.rec}%</span>`:''}${w.slp!==undefined?`<span class="whv s">${w.slp}u</span>`:''}${w.str!==undefined?`<span class="whv st">${w.str}</span>`:''}</div></div>`;
  }).join('');
}

async function whoopAI(){
  const td=today();const w=S.whoop[td]||{};
  const el=document.getElementById('w-ai-res');
  el.classList.remove('hidden');el.textContent='Claude analyseert je data...';
  const{done,total}=progress();
  const prompt=`Coach. ${buildCoachContext()}
Vandaag dag ${dayNum()} van 75. Whoop: rec ${w.rec!==undefined?w.rec+'%':'?'}, HRV ${w.hrv||'?'}ms, slaap ${w.slp||'?'}u (score ${w.slps||'?'}%), strain ${w.str||'?'}/21. Wetten: ${done}/${total}.
2–3 zinnen concreet trainingsadvies voor vandaag. Hoe zwaar? Wat extra letten op? Direct. Nederlands.`;
  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:500});
    el.textContent=data.content?.[0]?.text||'Kon niet laden.';
  }catch(e){el.textContent='Kon niet laden.';}
}
