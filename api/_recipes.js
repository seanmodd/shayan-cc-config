// Recipes — a Claude Code config plus a terminal theme, kept together.
//
// The two halves were already travelling in one payload: `p`/`vv`/`sl`/… is the Claude
// Code side and `cm`/`hd`/`zj`/`wp` is whichever terminal layer is switched on. What was
// missing was a NAME for that pair and somewhere to keep it, so people were building a
// combination, copying one install command, and losing the combination the moment they
// closed the tab.
//
// A recipe is therefore not a new format. It is the same payload with a label on it,
// which is what makes "download the whole recipe with one curl" fall out for free:
// /apply.sh?c=<payload> already applies both halves in one run.
//
// Storage is the browser, like every other saved thing here — this site is a stateless
// function with no database. A recipe leaves the machine only when you copy its link.

// Same convention as scc_favs / scc_customs on the homepage.
const RECIPE_KEY = 'scc_recipes';
const RECIPE_FAV_KEY = 'scc_recipe_favs';

// Which terminal layer a payload carries. Order matters only for display.
const TERMINALS = [
  { id: 'cmux', key: 'cm', label: 'cmux', icon: '\u{1FA9F}', path: '/cmux' },
  { id: 'herdr', key: 'hd', label: 'herdr', icon: '\u{1F9AC}', path: '/herdr' },
  { id: 'zellij', key: 'zj', label: 'Zellij', icon: '\u{1F9E9}', path: '/zellij' },
  { id: 'warp', key: 'wp', label: 'Warp', icon: '\u{1F300}', path: '/warp' },
];

const RECIPE_CSS = `
  /* The recipes card. It sits above the gallery because a recipe is the thing most
     people came back for — the gallery is where you start, this is where you return. */
  .recwrap{max-width:1200px;margin:22px auto 0;padding:0 24px;}
  .reccard{background:var(--panel);border:1px solid var(--border);border-radius:14px;
    padding:15px 16px 14px;}
  .rechead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;}
  .rechead h3{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);
    margin:0;display:flex;align-items:center;gap:7px;}
  .rechead select{background:#0b0e14;border:1px solid var(--border);border-radius:8px;
    color:var(--text);font-size:12.5px;font-family:inherit;padding:6px 9px;}
  .reccount{margin-left:auto;font-size:11.5px;color:var(--faint);}
  .rechint{margin:0 0 12px;font-size:12.5px;line-height:1.55;color:var(--dim);max-width:80ch;}
  .rechint b{color:var(--text);}
  .recgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:11px;}
  .recitem{border:1px solid var(--border);border-radius:11px;background:#0b0e14;
    overflow:hidden;display:flex;flex-direction:column;}
  .recitem.fav{border-color:var(--gold);}
  /* The swatch is the recipe rendering itself — the Claude Code palette on the left,
     the terminal's own background on the right, so the pairing is the picture. */
  .recsw{display:flex;height:32px;align-items:center;gap:5px;padding:0 11px;
    font-family:ui-monospace,Menlo,monospace;font-size:10px;}
  .recsw .rdot{width:9px;height:9px;border-radius:50%;flex:none;}
  .recsw .rterm{margin-left:auto;font-size:9px;letter-spacing:.06em;text-transform:uppercase;
    border:1px solid currentColor;border-radius:20px;padding:1px 7px;opacity:.85;}
  .recbody{padding:9px 11px 10px;display:flex;flex-direction:column;gap:5px;flex:1;}
  .recname{font-size:13.5px;font-weight:600;color:var(--text);display:flex;
    align-items:center;gap:6px;}
  .recmeta{font-size:11px;color:var(--faint);}
  .recacts{display:flex;gap:6px;margin-top:auto;padding-top:7px;flex-wrap:wrap;}
  .recacts button{cursor:pointer;font-family:inherit;font-size:10.5px;font-weight:600;
    letter-spacing:.03em;border:1px solid var(--border);background:#161c26;color:var(--dim);
    border-radius:6px;padding:5px 9px;min-height:30px;}
  .recacts button:hover{border-color:var(--accent);color:var(--text);}
  .recacts .recstar{font-size:13px;padding:5px 8px;line-height:1;}
  .recacts .recstar.on{color:var(--gold);border-color:var(--gold);}
  .recempty{font-size:12.5px;line-height:1.6;color:var(--faint);
    border-left:2px solid var(--border);padding-left:11px;}
  .recempty b{color:var(--dim);}
  /* The save control on a terminal page. */
  .recsave{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px;}
  .recsave input{flex:1 1 200px;min-width:0;background:#080b10;border:1px solid var(--border);
    border-radius:7px;color:var(--text);font-family:inherit;font-size:13px;padding:7px 9px;}
  .recsave input:focus{outline:none;border-color:var(--accent);}
  .recsave button{cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    border:1px solid var(--border);background:#161c26;color:var(--text);border-radius:7px;
    padding:7px 12px;min-height:34px;}
  .recsave button:hover{border-color:var(--accent);}
  @media(max-width:700px),(max-height:520px){
    .recwrap{padding:0 12px;}
    .recgrid{grid-template-columns:1fr;}
    .recacts button{min-height:40px;}
    .recsave button{min-height:44px;}
  }
`;

// Shared client helpers. Loaded on the homepage and on every terminal page, so both
// halves of the feature agree about the storage shape without either owning it.
//
// Lives in a template literal: no backticks, no ${...}, doubled backslashes.
const RECIPE_JS = `
var REC_KEY='${RECIPE_KEY}', REC_FAV='${RECIPE_FAV_KEY}';
var REC_TERMS=${JSON.stringify(TERMINALS)};

function rec_get(){
  try{var a=JSON.parse(localStorage.getItem(REC_KEY)||'[]');
    return Object.prototype.toString.call(a)==='[object Array]'?a:[];}catch(e){return [];}
}
function rec_set(a){try{localStorage.setItem(REC_KEY,JSON.stringify(a.slice(0,60)));}catch(e){}}
function recfav_get(){
  try{var a=JSON.parse(localStorage.getItem(REC_FAV)||'[]');
    return Object.prototype.toString.call(a)==='[object Array]'?a:[];}catch(e){return [];}
}
function recfav_set(a){try{localStorage.setItem(REC_FAV,JSON.stringify(a));}catch(e){}}

// Which terminal layer is switched on in a payload. A recipe without one is still a
// valid Claude Code setup, so this returns null rather than refusing.
function rec_terminalOf(pl){
  for(var i=0;i<REC_TERMS.length;i++){
    var t=REC_TERMS[i], layer=pl&&pl[t.key];
    if(layer&&typeof layer==='object'&&layer.on===true)return t;
  }
  return null;
}
function rec_hex(t,fb){
  if(Object.prototype.toString.call(t)!=='[object Array]'||t.length!==3)return fb;
  return '#'+t.map(function(n){
    n=Math.max(0,Math.min(255,Math.round(n)));
    return (n<16?'0':'')+n.toString(16);
  }).join('');
}
// One curl applies BOTH halves — that is the whole point of keeping them together.
function rec_curl(origin,pl){
  return 'curl -fsSL "'+origin+'/apply.sh?c='+encodeURIComponent(b64e(pl))+'" | bash';
}
function rec_link(origin,pl){
  var t=rec_terminalOf(pl);
  return origin+(t?t.path:'/customize')+'?c='+encodeURIComponent(b64e(pl));
}

// The Claude Code theme picker. Choosing one rewrites the palette the page carries,
// which is what the recipe pane paints with AND what the install command applies — so
// the preview and the thing you install cannot disagree. Identical on every terminal
// page, so it lives here rather than being written out four times.
//
// getCC/setCC are passed in because each page keeps its Claude Code half in its own
// variable; onChange is the page's own redraw.
function installCcPicker(getCC, setCC, onChange){
  var sel=document.getElementById('ccTheme'); if(!sel)return;
  var names=Object.keys(STARTERS);
  // Defensive: this must run AFTER the page's boot has set its Claude Code half. Called
  // too early it would throw and take the rest of the script's tail with it, which is
  // exactly what happened once on /cmux — so it fails quiet and visible instead.
  var cur=null;
  try{cur=getCC();}catch(e){}
  if(!cur){sel.disabled=true;return;}
  var linked=JSON.stringify(cur);
  var isStarter=names.some(function(n){return JSON.stringify(STARTERS[n])===linked;});
  // "As linked" only appears when the payload arrived with a palette that is not one of
  // the starters; otherwise it would duplicate whichever starter matches.
  if(!isStarter){
    var o=document.createElement('option');
    o.value='__linked';o.textContent='As linked';sel.appendChild(o);
  }
  names.forEach(function(n){
    var o=document.createElement('option');o.value=n;o.textContent=n;
    if(JSON.stringify(STARTERS[n])===linked)o.selected=true;
    sel.appendChild(o);
  });
  function label(){
    var t=sel.options[sel.selectedIndex];
    var el=document.getElementById('ccname');
    if(el)el.textContent='\\u2014 '+(t?t.textContent:'');
  }
  label();
  sel.addEventListener('change',function(){
    if(sel.value!=='__linked')setCC(JSON.parse(JSON.stringify(STARTERS[sel.value])));
    label();onChange();
  });
}

// The save control on a terminal page. Inline field, never a prompt() — a modal is
// counted by the browser as time the click handler spent blocking, which is the bug
// this repo already fixed once on /cmux.
function installRecipeSave(getPayload, defaultName){
  var host=document.getElementById('recsave'); if(!host)return;
  var input=document.getElementById('recname');
  var btn=document.getElementById('recsavebtn');
  var curlBtn=document.getElementById('reccurlbtn');
  if(input&&!input.value)input.value=defaultName||'My recipe';

  function save(){
    var name=(input.value||'').trim().slice(0,48);
    if(!name){input.focus();return;}
    var pl=getPayload();
    var all=rec_get();
    // Saving the same name twice replaces rather than accumulating near-duplicates.
    all=all.filter(function(x){return x.name!==name;});
    all.push({
      id:'r'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36),
      name:name,
      savedAt:new Date().toISOString().slice(0,10),
      payload:pl
    });
    rec_set(all);
    btn.textContent='Saved \\u2713';
    setTimeout(function(){btn.textContent='Save as recipe';},1700);
    toast('Saved \\u201c'+name+'\\u201d \\u2014 it is on the home page under Recipes');
  }
  if(btn)btn.addEventListener('click',save);
  if(input)input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();save();}
  });
  if(curlBtn)curlBtn.addEventListener('click',function(){
    copyText(rec_curl(location.origin,getPayload()));
    curlBtn.textContent='Copied \\u2713';
    setTimeout(function(){curlBtn.textContent='Copy the whole recipe';},1700);
  });
}
`;

// The markup for that control. Identical on every terminal page, so it lives here.
function recipeSaveBlock() {
  return `  <div class="panel" style="margin-top:16px"><h3>\u{1F9EA} Save as a recipe</h3>
    <p class="phint">A <b>recipe</b> is this terminal's theme plus the Claude Code config layered
    on top of it — both halves, one name. Saved recipes appear on the
    <a href="/" style="color:var(--accent)">home page</a>, where you can favourite them and copy
    a single curl that installs the pair.</p>
    <div class="recsave" id="recsave">
      <input type="text" id="recname" maxlength="48" autocomplete="off"
        aria-label="Name for this recipe" placeholder="Name this recipe">
      <button type="button" id="recsavebtn">Save as recipe</button>
      <button type="button" id="reccurlbtn">Copy the whole recipe</button>
    </div>
  </div>`;
}

module.exports = { RECIPE_KEY, RECIPE_FAV_KEY, TERMINALS, RECIPE_CSS, RECIPE_JS, recipeSaveBlock };
