// ═══════════════════════════════
// TRAINING LOG
// ═══════════════════════════════

const TRAINING_TYPES = ['BJJ', 'MMA', 'Kickboks', 'Gym', 'Hardlopen', 'Wandelen', 'Anders'];

let _tlActivity = '';
let _tlIntensity = 7;

function renderTrainingInSubpage(){
  const body = document.getElementById('subpage-training-body');
  if(!body) return;

  body.innerHTML = `
    <div class="tl-body">
      <div class="tl-form">
        <div class="tl-form-title">Nieuwe training loggen</div>

        <div class="tl-row">
          <div class="tl-lbl">Activiteit</div>
          <div class="tl-chips" id="tl-chips"></div>
          <input class="tl-input" id="tl-act-input" placeholder="of typ hier…" style="margin-top:8px" oninput="_tlSetActivity(this.value)">
        </div>

        <div class="tl-row">
          <div class="tl-lbl">Intensiteit</div>
          <div class="tl-intensity-row">
            <div class="tl-intensity-val" id="tl-int-val">7</div>
            <input type="range" class="tl-slider" id="tl-int-slider" min="1" max="10" value="7" oninput="_tlSetIntensity(this.value)">
            <div class="tl-intensity-lbl" id="tl-int-lbl">Pittig</div>
          </div>
        </div>

        <div class="tl-row">
          <div class="tl-lbl">Duur</div>
          <div class="tl-dur-row">
            <input type="number" class="tl-input tl-dur-in" id="tl-dur-input" min="1" max="300" placeholder="60">
            <span class="tl-dur-unit">min</span>
          </div>
        </div>

        <div class="tl-row">
          <div class="tl-lbl">Wat geleerd / notitie</div>
          <textarea class="tl-input" id="tl-note-input" placeholder="Techniek, progressie, wat ging slecht…"></textarea>
        </div>

        <button class="tl-save" onclick="saveTrainingEntry()">Opslaan</button>
      </div>

      <div>
        <div class="tl-hist-header">Recente trainingen</div>
        <div id="tl-hist-list"></div>
      </div>

      <button class="tl-ai-btn" onclick="trainingAI()">Claude: analyseer mijn laatste trainingen</button>
      <div class="tl-ai-res hidden" id="tl-ai-res"></div>
    </div>
  `;

  _tlActivity = '';
  _tlIntensity = 7;

  _renderTlChips();
  _renderTlHist();
}

function _tlIntensityLabel(v){
  v = parseInt(v, 10);
  if(v <= 2) return 'Rustig';
  if(v <= 4) return 'Matig';
  if(v <= 6) return 'Stevig';
  if(v <= 8) return 'Pittig';
  return 'Max';
}

function _tlSetActivity(val){
  _tlActivity = val;
  _renderTlChips();
}

function _tlSetIntensity(val){
  _tlIntensity = parseInt(val, 10);
  const el = document.getElementById('tl-int-val');
  const lbl = document.getElementById('tl-int-lbl');
  if(el) el.textContent = _tlIntensity;
  if(lbl) lbl.textContent = _tlIntensityLabel(_tlIntensity);
}

function _renderTlChips(){
  const wrap = document.getElementById('tl-chips');
  if(!wrap) return;
  wrap.innerHTML = TRAINING_TYPES.map(t =>
    `<div class="tl-chip${_tlActivity===t?' active':''}" onclick="_tlPickType('${t}')">${t}</div>`
  ).join('');
}

function _tlPickType(type){
  _tlActivity = type;
  const inp = document.getElementById('tl-act-input');
  if(inp) inp.value = type;
  _renderTlChips();
}

function _renderTlHist(){
  const listEl = document.getElementById('tl-hist-list');
  if(!listEl) return;
  const logs = (S.trainingLog || []).slice().reverse().slice(0, 10);
  if(!logs.length){
    listEl.innerHTML = '<div class="tl-hist-empty">Nog geen trainingen gelogd.</div>';
    return;
  }
  listEl.innerHTML = logs.map(entry => {
    const parts = entry.date ? entry.date.split('-') : [];
    let dateStr = entry.date || '';
    if(parts.length === 3){
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      dateStr = d.toLocaleDateString('nl-NL', {weekday:'short', day:'numeric', month:'short'});
    }
    return `<div class="tl-entry">
      <button class="tl-entry-del" onclick="deleteTrainingEntry('${entry.id}')">✕</button>
      <div class="tl-entry-top">
        <div class="tl-entry-act">${escapeHtml(entry.activity||'—')}</div>
        <div class="tl-entry-meta">
          <div>
            <div class="tl-entry-intensity">${entry.intensity||'—'}<span style="font-size:12px;color:var(--dim)">/10</span></div>
            <div class="tl-entry-intensity-lbl">${_tlIntensityLabel(entry.intensity||5)}</div>
          </div>
        </div>
      </div>
      <div class="tl-entry-date">${dateStr}${entry.duration?' — '+entry.duration+' min':''}</div>
      ${entry.note ? `<div class="tl-entry-note">${escapeHtml(entry.note)}</div>` : ''}
    </div>`;
  }).join('');
}

function saveTrainingEntry(){
  const actInput = document.getElementById('tl-act-input');
  const durInput = document.getElementById('tl-dur-input');
  const noteInput = document.getElementById('tl-note-input');
  const sliderEl = document.getElementById('tl-int-slider');

  const activity = (actInput ? actInput.value.trim() : '') || _tlActivity;
  if(!activity){
    if(actInput){actInput.style.borderColor='var(--ac)';actInput.placeholder='← kies of typ een activiteit';actInput.focus();}
    return;
  }
  if(actInput) actInput.style.borderColor='';

  const intensity = sliderEl ? parseInt(sliderEl.value, 10) : _tlIntensity;
  const duration = durInput ? (parseInt(durInput.value, 10) || null) : null;
  const note = noteInput ? noteInput.value.trim() : '';

  const entry = {
    id: 'tl_' + Date.now(),
    date: today(),
    activity,
    intensity,
    duration,
    note,
    ts: new Date().toISOString()
  };

  if(!S.trainingLog) S.trainingLog = [];
  S.trainingLog.push(entry);
  save();

  // Sync to backend if logged in
  if(API.isLoggedIn()){
    API.logWorkout({
      date: entry.date,
      type: entry.activity,
      intensity: entry.intensity,
      duration_min: entry.duration,
      notes: entry.note
    }).catch(() => {});
  }

  // Reset form
  if(actInput) actInput.value = '';
  if(durInput) durInput.value = '';
  if(noteInput) noteInput.value = '';
  if(sliderEl){ sliderEl.value = 7; }
  _tlActivity = '';
  _tlIntensity = 7;
  _renderTlChips();
  const intVal = document.getElementById('tl-int-val');
  const intLbl = document.getElementById('tl-int-lbl');
  if(intVal) intVal.textContent = '7';
  if(intLbl) intLbl.textContent = 'Pittig';

  _renderTlHist();
}

function deleteTrainingEntry(id){
  if(!S.trainingLog) return;
  S.trainingLog = S.trainingLog.filter(e => e.id !== id);
  save();
  _renderTlHist();
}

async function trainingAI(){
  const el = document.getElementById('tl-ai-res');
  if(!el) return;
  el.classList.remove('hidden');
  el.textContent = 'Claude analyseert je trainingen...';

  const recent = (S.trainingLog || []).slice().reverse().slice(0, 10);
  if(!recent.length){
    el.textContent = 'Geen trainingen om te analyseren. Log er eerst een paar.';
    return;
  }

  const trainingStr = recent.map(e =>
    `${e.date}: ${e.activity}, intensiteit ${e.intensity}/10${e.duration?' ('+e.duration+' min)':''}${e.note?' — '+e.note:''}`
  ).join('\n');

  const prompt = `Coach. ${buildCoachContext()}
Laatste trainingen van de gebruiker:
${trainingStr}

Analyseer dit in 3-4 zinnen. Focus op patronen: welke sport overweegt, gemiddelde intensiteit, balans, wat opvalt. Geef één concrete aanbeveling. Direct, geen open deuren. Nederlands.`;

  try{
    const data = await claudeCall([{role:'user',content:prompt}], {maxTokens:500});
    el.textContent = data.content?.[0]?.text || 'Kon niet laden.';
  } catch(e){
    el.textContent = 'Kon niet laden.';
  }
}
