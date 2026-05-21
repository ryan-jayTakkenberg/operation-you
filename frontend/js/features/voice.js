// ═══════════════════════════════
// VOICE — Web Speech API (free, native)
// ═══════════════════════════════
let recognition = null;
let isRecording = false;
let recordingTargetId = null;
let recordingBase = '';

function initVoice(){
  if(recognition) return recognition;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return null;
  recognition = new SR();
  recognition.lang = 'nl-NL';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = handleVoiceResult;
  recognition.onend = handleVoiceEnd;
  recognition.onerror = handleVoiceError;
  return recognition;
}

function toggleVoice(targetId){
  if(isRecording && recordingTargetId===targetId){ stopVoice(); return; }
  if(isRecording){ stopVoice(); }
  startVoice(targetId);
}

function startVoice(targetId){
  const rec = initVoice();
  if(!rec){
    alert('Spraak-naar-tekst wordt niet ondersteund in deze browser. Gebruik Safari op iOS of Chrome.');
    return;
  }
  const target = document.getElementById(targetId);
  if(!target) return;
  recordingTargetId = targetId;
  recordingBase = target.value;
  if(recordingBase && !recordingBase.endsWith(' ') && !recordingBase.endsWith('\n')) recordingBase += ' ';
  try {
    rec.start();
    isRecording = true;
    updateVoiceButtons();
  } catch(e){
    setTimeout(()=>{
      try{rec.stop();}catch(e2){}
      setTimeout(()=>{
        try{rec.start();isRecording=true;updateVoiceButtons();}catch(e3){alert('Mic start mislukt: '+e3.message);}
      },200);
    },50);
  }
}

function stopVoice(){
  if(recognition){
    try{recognition.stop();}catch(e){}
  }
  isRecording = false;
  recordingTargetId = null;
  updateVoiceButtons();
}

function handleVoiceResult(event){
  if(!recordingTargetId) return;
  const target = document.getElementById(recordingTargetId);
  if(!target) return;
  let final = '';
  let interim = '';
  for(let i = event.resultIndex; i < event.results.length; i++){
    if(event.results[i].isFinal) final += event.results[i][0].transcript;
    else interim += event.results[i][0].transcript;
  }
  target.value = recordingBase + final + interim;
  if(final){
    recordingBase = recordingBase + final;
    if(!recordingBase.endsWith(' ')) recordingBase += ' ';
  }
  target.dispatchEvent(new Event('input'));
}

function handleVoiceEnd(){
  if(isRecording && recordingTargetId){
    try{recognition.start();}catch(e){isRecording=false;updateVoiceButtons();}
  } else {
    isRecording = false;
    updateVoiceButtons();
  }
}

function handleVoiceError(event){
  isRecording = false;
  recordingTargetId = null;
  updateVoiceButtons();
  if(event.error === 'not-allowed' || event.error === 'service-not-allowed'){
    alert('Mic-toegang geweigerd. Sta toegang toe in Safari → Instellingen → Microfoon. Bij eerste keer staat Safari het automatisch toe.');
  } else if(event.error === 'no-speech' || event.error === 'aborted'){
    // silent
  } else {
    console.warn('Voice error:', event.error);
  }
}

function updateVoiceButtons(){
  document.querySelectorAll('.voice-btn').forEach(btn=>{
    btn.classList.toggle('recording', isRecording);
  });
}
