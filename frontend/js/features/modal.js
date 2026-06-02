// ═══════════════════════════════
// MODAL — entry toevoegen
// ═══════════════════════════════
function openModal(dayN){
  picData=null;
  const targetDayN=dayN||dayNum();
  const targetDate=dateForDay(targetDayN);
  modalTargetDay={dayN:targetDayN,date:targetDate};
  const existing=entryForDate(targetDate);
  document.getElementById('tdream').value=existing?existing.dream||'':'';
  document.getElementById('tnote').value=existing?existing.note||'':'';
  if(existing&&existing.photo){
    picData=existing.photo;
    const img=document.getElementById('ppreview');
    img.src=picData;img.classList.remove('hidden');
    document.getElementById('pzi').style.display='none';
  } else {
    picData=null;
    document.getElementById('ppreview').classList.add('hidden');
    document.getElementById('pzi').style.display='flex';
  }
  document.getElementById('mdaynum').textContent=targetDayN;

  const c=S.checks[targetDate]||{};
  const rs=rules();
  const done=rs.filter(r=>c[r.id]).length;
  const total=rs.length;
  const w=S.whoop[targetDate]||{};
  const hasWhoop=w.rec!==undefined||w.slp!==undefined||w.str!==undefined;

  let summary=`<div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Automatisch meegenomen</div>`;
  summary+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:${hasWhoop?'10px':'0'}">
    <div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:28px;font-weight:800;color:${done===total&&total>0?'var(--ac)':done>0?'var(--orange)':'var(--red)'}">${done}/${total}</div>
    <div style="font-size:12px;color:var(--muted);font-weight:300">wetten voltooid${done===total&&total>0?' 🔥':''}<br><span style="font-size:11px;color:var(--dim)">Vink op de Vandaag pagina</span></div>
  </div>`;
  if(hasWhoop){
    summary+=`<div style="display:flex;gap:14px;padding-top:8px;border-top:1px solid var(--line)">
      ${w.rec!==undefined?`<div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:18px;font-weight:700;color:#4a6b35">${w.rec}%</div><div style="font-size:10px;color:var(--muted)">Recovery</div></div>`:''}
      ${w.slp!==undefined?`<div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:18px;font-weight:700;color:#2b4d72">${w.slp}u</div><div style="font-size:10px;color:var(--muted)">Slaap</div></div>`:''}
      ${w.str!==undefined?`<div><div style="font-family:'Courier Prime','Roboto Mono',monospace;font-size:18px;font-weight:700;color:#a06628">${w.str}/21</div><div style="font-size:10px;color:var(--muted)">Strain</div></div>`:''}
    </div>`;
  }
  document.getElementById('modal-auto-summary').innerHTML=summary;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal(){document.getElementById('modal').classList.add('hidden');}

function compressImage(file,maxWidth,quality){
  maxWidth=maxWidth||800;quality=quality||0.75;
  return new Promise(function(resolve){
    const reader=new FileReader();
    reader.onload=function(e){
      const img=new Image();
      img.onload=function(){
        const ratio=Math.min(maxWidth/img.width,1);
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(img.width*ratio);
        canvas.height=Math.round(img.height*ratio);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePic(input){
  const f=input.files[0];if(!f)return;
  picData=await compressImage(f);
  const prev=document.getElementById('ppreview');
  if(!prev)return;
  prev.src=picData;prev.classList.remove('hidden');
  const pzi=document.getElementById('pzi');
  if(pzi)pzi.style.display='none';
}

function postEntry(){
  if(!modalTargetDay)return;
  const{dayN,date}=modalTargetDay;
  const checks={...( S.checks[date]||{})};
  S.entries=S.entries.filter(e=>e.date!==date);
  const entry={dayNum:dayN,date,photo:picData,dream:document.getElementById('tdream').value.trim(),note:document.getElementById('tnote').value.trim(),checks,aiFb:null,ts:Date.now()};
  S.entries.push(entry);
  save();closeModal();
  renderRules();renderProg();renderDots();renderJourney();renderSpiegel();
  autoFeedback(date,dayN);
  if(activeDetailDay===dayN)openDetail(dayN);
}

async function autoFeedback(date,dayN){
  const entry=entryForDate(date);if(!entry)return;
  const rs=rules();
  const ok=rs.filter(r=>entry.checks&&entry.checks[r.id]).map(r=>r.name);
  const miss=rs.filter(r=>!entry.checks||!entry.checks[r.id]).map(r=>r.name);
  const w=S.whoop[date]||{};
  const prompt=`Directe coach. ${buildCoachContext()}
Dag ${dayN}: gehaald (${ok.length}/${rs.length}): ${ok.join(', ')||'geen'}. Gemist: ${miss.join(', ')||'geen'}.
${entry.dream?`Droomwerk: ${entry.dream}`:''}${entry.note?` Notitie: ${entry.note}`:''}
${w.rec!==undefined?`Whoop: rec ${w.rec}%, slp ${w.slp||'?'}u, str ${w.str||'?'}/21`:''}

3–4 zinnen directe feedback. Verwijs naar zijn/haar specifieke verhaal of schaduw. Eindig met één opdracht voor morgen. Nederlands. 'Je' aanspreken.`;
  try{
    const data=await claudeCall([{role:'user',content:prompt}],{maxTokens:600});
    const txt=data.content?.[0]?.text||'';
    const idx=S.entries.findIndex(e=>e.date===date);
    if(idx>=0&&txt){S.entries[idx].aiFb=txt;save();}
    if(activeDetailDay===dayN)openDetail(dayN);
    renderJourney();
  }catch(e){}
}
