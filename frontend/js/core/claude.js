// ═══════════════════════════════
// API KEY & CLAUDE CALL
// ═══════════════════════════════
function getApiKey(){
  // Lokale dev-override: js/config.local.js (gitignored) kan window.LOCAL_API_KEY zetten.
  // Werkt als een .env voor deze no-build app — blijft lokaal, wordt nooit gecommit/gedeployed.
  if(typeof window !== 'undefined' && window.LOCAL_API_KEY){
    return window.LOCAL_API_KEY;
  }
  return localStorage.getItem('75h_apikey') || '';
}

function saveApiKey(){
  const v = document.getElementById('ak-input').value.trim();
  if(!v){return;}
  localStorage.setItem('75h_apikey', v);
  document.getElementById('ak-input').value='';
  updateApiKeyStatus();
}

function clearApiKey(){
  localStorage.removeItem('75h_apikey');
  updateApiKeyStatus();
}

function updateApiKeyStatus(){
  const k = getApiKey();
  const dot = document.getElementById('ak-dot');
  const txt = document.getElementById('ak-status-text');
  if(!dot||!txt)return;
  if(k){
    dot.classList.remove('miss');
    dot.classList.add('ok');
    txt.textContent = 'API key ingesteld — werkt overal (...' + k.slice(-6) + ')';
  } else {
    dot.classList.add('miss');
    dot.classList.remove('ok');
    txt.textContent = 'API key niet ingesteld — werkt alleen binnen Claude.ai chat';
  }
}

// Universal Claude API call — routes through backend proxy when logged in,
// falls back to direct browser call with user API key when offline/not logged in
async function claudeCall(messages, options){
  options = options || {};

  if(API.isLoggedIn()){
    const data = await API.claude(messages, options);
    if(data) return data;
  }

  const apiKey = getApiKey();
  if(!apiKey){
    throw new Error('Geen API key. Log in of voeg een API key toe bij Instellingen.');
  }
  const headers = {
    'Content-Type':'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: options.maxTokens || 1000,
    messages: messages
  };
  if(options.system) body.system = options.system;
  const res = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST', headers, body: JSON.stringify(body)
  });
  if(!res.ok){
    const txt = await res.text();
    throw new Error('API error '+res.status+': '+txt.slice(0,200));
  }
  return await res.json();
}

function claudeHeaders(){
  const headers = {'Content-Type':'application/json'};
  const k = getApiKey();
  if(k){
    headers['x-api-key'] = k;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }
  return headers;
}
