// The /moshi page — a theme builder for the Moshi app (getmoshi.app).
//
// Moshi renders your coding-agent sessions on the phone, and one theme drives the
// whole app: the terminal colours are exact, and the app derives its UI palette
// from them (contrast-checked). There is NOTHING to install on this machine for
// the theme — the app imports it, and the three import paths are verified against
// the app bundle (v3.12.3) and the live gallery:
//   QR code of a moshi://theme?d=<base64 JSON> deep link · a moshi-theme:<base64>
//   clipboard string · a plain .json file through the in-app picker.
// The only host-side surface is behavioural (moshi-hook's [gateway] settings, five
// keys total) and the generated script drives moshi-hook's own `set` command.
//
// As everywhere in this repo, browser JS lives inside template literals: no
// backticks, no dollar-brace, every backslash doubled.

const { STUDIO_CSS } = require('./_customize.js');
const { topBar, navPayload } = require('./_nav.js');
const {
  MOSHI_COLOR_KEYS, MOSHI_MODES, MOSHI_DEFAULTS,
} = require('./_moshi.js');
const { MOSHI_STARTERS } = require('./_moshi_starters.js');

const MOSHI_CSS = `
  .mwrap{max-width:1240px;margin:0 auto;padding:0 24px 40px;}
  .mhead{padding-bottom:2px;}
  .mhead h1{font-size:32px;}

  /* ── the phone mock + the delivery card, side by side ─────────────────────── */
  .mpair{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:18px;
    margin-bottom:18px;align-items:start;}
  .mbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .mbadge b{color:var(--text);letter-spacing:.02em;}
  .mbadge .pill{border:1px solid var(--accent);color:var(--accent);border-radius:20px;
    padding:2px 9px;font-size:10.5px;letter-spacing:.04em;}

  /* The phone. Terminal colours are EXACT; the surrounding app chrome is an
     approximation of the app's derive-from-terminal tinting, and the page says so. */
  .phone{border-radius:34px;border:2px solid #3a3f4a;padding:10px;background:var(--ph-chrome);
    box-shadow:0 18px 44px rgba(0,0,0,.5);max-width:340px;}
  .pscreen{border-radius:26px;overflow:hidden;background:var(--ph-bg);
    display:flex;flex-direction:column;min-height:520px;}
  .pstatus{display:flex;justify-content:space-between;padding:9px 16px 4px;
    font-size:10.5px;color:var(--ph-dim);font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
  .papp{display:flex;align-items:center;gap:8px;padding:8px 14px 8px;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
  .papp .ptitle{font-size:15px;font-weight:700;color:var(--ph-text);}
  .papp .pdot{margin-left:auto;width:8px;height:8px;border-radius:50%;background:var(--ph-ok);}
  .papp .psess{font-size:10px;color:var(--ph-dim);}
  .pcard{margin:0 10px 8px;border-radius:12px;background:var(--ph-card);
    padding:8px 11px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
  .pcard .pcap{font-size:11px;font-weight:600;color:var(--ph-text);display:flex;gap:6px;align-items:center;}
  .pcard .psub{font-size:9.5px;color:var(--ph-dim);margin-top:2px;}
  .pcard .pbtns{display:flex;gap:6px;margin-top:7px;}
  .pcard .pbtn{font-size:9.5px;font-weight:600;border-radius:7px;padding:4px 10px;}
  .pcard .pbtn.ok{background:var(--ph-okwash);color:var(--ph-ok);}
  .pcard .pbtn.no{background:var(--ph-redwash);color:var(--ph-red);}
  .pterm{flex:1;margin:0 10px 10px;border-radius:12px;background:var(--mo-bg);color:var(--mo-fg);
    font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;line-height:1.62;
    padding:9px 10px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;}
  .pterm .l{white-space:pre-wrap;word-break:break-word;min-height:1.62em;}
  .pterm .cursor{display:inline-block;width:6px;height:11px;vertical-align:-1px;
    background:var(--mo-cursor);}
  .pterm .sel{background:var(--mo-selbg);}
  .pcompose{margin:0 10px 12px;border-radius:11px;background:var(--ph-card);
    display:flex;align-items:center;gap:7px;padding:7px 11px;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:10.5px;color:var(--ph-dim);}

  /* ── delivery ──────────────────────────────────────────────────────────────── */
  .getcard{border:1px solid var(--border);border-radius:14px;background:var(--panel);
    padding:15px 16px;}
  .getcard h3{margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;
    color:var(--gold);}
  .getgrid{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;margin-top:10px;}
  .qrbox{background:#ffffff;border-radius:12px;padding:10px;line-height:0;width:196px;height:196px;}
  .qrbox img{width:176px;height:176px;image-rendering:pixelated;}
  .getsteps{font-size:12.5px;color:var(--dim);line-height:1.65;margin:0;padding-left:18px;}
  .getsteps b{color:var(--text);}
  .getbtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px;}
  .getbtns button,.getbtns a{cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    border:1px solid var(--border);background:#161c26;color:var(--text);border-radius:8px;
    padding:8px 13px;min-height:36px;text-decoration:none;display:inline-flex;align-items:center;}
  .getbtns button:hover,.getbtns a:hover{border-color:var(--accent);}
  .gethint{font-size:11px;color:var(--faint);margin-top:8px;line-height:1.55;}

  /* ── controls ──────────────────────────────────────────────────────────────── */
  .modechips{display:flex;gap:6px;}
  .stychip{cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    border:1px solid var(--border);background:#10141b;color:var(--dim);border-radius:20px;
    padding:6px 13px;min-height:32px;}
  .stychip:hover{border-color:var(--accent);}
  .stychip.on{border-color:var(--accent);color:var(--text);background:rgba(122,162,247,.10);}
  .cologrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:7px;
    margin-top:9px;}
  .colohead{grid-column:1/-1;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--gold);margin:5px 0 -2px;}
  .curow{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--dim);
    border:1px solid var(--border);border-radius:9px;padding:5px 8px;cursor:pointer;}
  .curow input[type=color]{width:28px;height:28px;border:none;background:none;padding:0;
    cursor:pointer;flex:none;}
  .stgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px;}
  .stchip{display:flex;flex-direction:column;gap:5px;cursor:pointer;text-align:left;
    font-family:inherit;border:1px solid var(--border);background:#10141b;border-radius:9px;
    padding:8px 9px;color:var(--dim);}
  .stchip:hover{border-color:var(--accent);}
  .stname{font-size:11.5px;font-weight:600;color:var(--text);}
  .stsw{display:flex;gap:4px;align-items:center;border-radius:5px;padding:4px 6px;}
  .stsw i{width:9px;height:9px;border-radius:50%;flex:none;}
  .stmode{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);}

  /* saved setups — same look as the other pages */
  .svrow{display:flex;flex-direction:column;gap:7px;}
  .svchip{display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;
    font-family:inherit;border:1px solid var(--border);background:#10141b;
    border-radius:10px;padding:8px 11px;color:var(--dim);width:100%;}
  .svchip:hover{border-color:var(--accent);}
  .svchip.savecard{border-style:dashed;}
  .svsw{display:flex;gap:4px;flex:none;}
  .svsw i{width:10px;height:10px;border-radius:50%;}
  .svbody{flex:1;min-width:0;}
  .svname{font-size:12.5px;font-weight:600;color:var(--text);overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap;}
  .svmeta{font-size:10.5px;color:var(--faint);margin-top:1px;}
  .svacts{display:flex;gap:9px;flex:none;font-size:10.5px;}
  .svact{color:var(--faint);text-decoration:underline;text-underline-offset:2px;padding:6px 2px;}
  .svact:hover{color:var(--accent);}

  @media(max-width:900px),(max-height:520px){
    .mwrap{padding:0 12px 40px;}
    .mhead h1{font-size:26px;}
    .mpair{grid-template-columns:1fr;}
    .phone{margin:0 auto;}
    .qrbox{margin:0 auto;}
    .getgrid{grid-template-columns:1fr;justify-items:center;}
    .getbtns button,.getbtns a{min-height:44px;flex:1 1 45%;justify-content:center;}
    .curow input[type=color]{width:34px;height:34px;}
  }
`;

function renderMoshi(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const opts = JSON.stringify({
    colorKeys: MOSHI_COLOR_KEYS,
    modes: MOSHI_MODES,
    starters: MOSHI_STARTERS,
  });
  const defaults = JSON.stringify(MOSHI_DEFAULTS);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moshi · shayan-cc-config</title>${favicon}<style>${baseCss}${STUDIO_CSS}${MOSHI_CSS}</style></head><body>
${topBar('moshi', ghSvg)}
<div class="mwrap">
<header class="mhead"><h1>\u{1F4F1} Moshi</h1>
<p class="sub" style="margin-top:8px">A theme for <b>the agent app on your phone</b>. Moshi (getmoshi.app) shows your
Claude Code and Codex sessions on iOS/Android, and <b>one theme styles the whole app</b> — the terminal exactly,
the surrounding UI derived from it. Nothing installs on this machine: build the theme here, then <b>scan the QR</b>
(or copy the string / download the file) and Moshi imports it. Formats verified against the app bundle and the
official gallery's own files.</p></header>

  <div class="mpair">
    <div>
      <div class="mbadge"><span class="pill">preview</span><b>Your Moshi</b><span>— terminal exact, chrome approximate</span></div>
      <div class="phone" id="phone"><div class="pscreen">
        <div class="pstatus"><span>21:47</span><span>\u{1F4F6} \u{1F50B}</span></div>
        <div class="papp"><span class="ptitle">Moshi</span><span class="psess">2 sessions</span><span class="pdot"></span></div>
        <div class="pcard">
          <div class="pcap">⏺ senpex-frontend <span style="opacity:.6">· claude</span></div>
          <div class="psub">Approval needed — run: npm test</div>
          <div class="pbtns"><span class="pbtn ok">Approve</span><span class="pbtn no">Deny</span></div>
        </div>
        <div class="pterm" id="pterm"></div>
        <div class="pcompose"><span>\u{1F399}</span><span>Message your agent…</span></div>
      </div></div>
      <span class="hint" style="display:block;margin-top:7px">The terminal pane uses your exact colours; the app chrome is an
      approximation — the real app derives its UI tints from the terminal colours, contrast-checked.</span>
    </div>
    <div class="getcard">
      <h3>\u{1F4E1} Get it onto your phone</h3>
      <p class="phint">Three ways in, all built into Moshi (Settings → Theme → Import theme). The QR is fastest.</p>
      <div class="getgrid">
        <div class="qrbox"><img id="qrimg" alt="QR code of this theme's moshi:// import link" width="176" height="176"></div>
        <div>
          <ol class="getsteps">
            <li><b>Scan the QR</b> with Moshi's importer (or your camera — the link opens Moshi).</li>
            <li>Or <b>copy the theme string</b> below and paste it in the importer.</li>
            <li>Or <b>download the .json</b> and open it from the Files app.</li>
          </ol>
          <div class="getbtns">
            <button type="button" id="g_link">Copy import link</button>
            <button type="button" id="g_str">Copy theme string</button>
            <a id="g_json" href="#" download>Download .json</a>
            <button type="button" id="g_share">Share this page</button>
          </div>
          <div class="gethint" id="gethint"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="panels" id="controls"></div>

  <div class="cxpanels" style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px">
    <div class="panel"><h3>\u{1F4C4} The theme file itself</h3>
      <p class="phint">Exactly what Moshi imports — the same shape the official gallery serves. The deep link and the
      QR are this JSON, base64-encoded (standard alphabet, padding stripped — byte-identical to how the gallery
      encodes its own links).</p>
      <div class="cxfiles" id="fileJson" style="background:#0b0e14;border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#b7c3d6;overflow-x:auto;white-space:pre;line-height:1.6;max-height:300px;overflow-y:auto"></div>
    </div>
    <div class="panel"><h3>\u{1F9EA} How this was verified</h3>
      <p class="phint">The theme JSON schema comes from the official gallery's own files (getmoshi.app/themes/&lt;slug&gt;.json),
      and the import mechanisms from the app bundle (v3.12.3): the deep-link pattern
      <span class="mono">moshi://theme?d=&lt;base64&gt;</span> is the bundle's own matcher, the QR path is the in-app
      scanner, and the clipboard prefix <span class="mono">moshi-theme:</span> is the paste importer. A live gallery
      link was decoded and re-encoded byte-identically to pin the base64 flavour. Imported themes restyle the terminal
      AND the app UI — the bundle's own words: “Imported themes style both the terminal and the app.”</p>
      <p class="phint">The host-side dial is deliberately small: moshi-hook 0.2.85's config is a single
      <span class="mono">[gateway]</span> table with five behavioural keys and <b>zero</b> cosmetic ones (verified in
      the binary), so the behaviour panel drives <span class="mono">moshi-hook set</span> — the CLI's own writer —
      and nothing else. The app's fonts, app icons and per-feature view toggles are in-app settings with no file or
      URL mechanism, so this page does not pretend to set them.</p>
    </div>
  </div>

</div>
<div id="toast"></div>
<script>
var NAV=${navPayload('moshi')};
${clientLib}
var MO_OPTS=${opts};
var MO_DEFAULTS=${defaults};
var ORIGIN=location.origin;
var state=null;

function ownKey(o,k){return typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}
function defaultMoshi(){var o=copyObj(MO_DEFAULTS);o.on=true;return o;}
function xHex(v,d){
  if(typeof v!=='string')return d;
  if(/^#[0-9a-fA-F]{6}$/.test(v))return v.toLowerCase();
  if(/^#[0-9a-fA-F]{3}$/.test(v))return ('#'+v.charAt(1)+v.charAt(1)+v.charAt(2)+v.charAt(2)+v.charAt(3)+v.charAt(3)).toLowerCase();
  return d;
}
function xName(v,d){
  if(typeof v!=='string')return d;
  var t=v.replace(/[^A-Za-z0-9 _-]/g,'').replace(/\\s+/g,' ');
  t=t.replace(/^ +| +$/g,'').slice(0,40);
  return t||d;
}
function saneMoshi(o){
  var d=defaultMoshi();
  if(!o||typeof o!=='object')return d;
  var out={name:xName(o.name,d.name),
    mode:MO_OPTS.modes.indexOf(o.mode)>=0?o.mode:d.mode,
    colors:{},gw:{},on:true};
  var ci=(o.colors&&typeof o.colors==='object')?o.colors:{};
  for(var i=0;i<MO_OPTS.colorKeys.length;i++){
    var k=MO_OPTS.colorKeys[i];
    out.colors[k]=xHex(ci[k],d.colors[k]);
  }
  var g=(o.gw&&typeof o.gw==='object')?o.gw:{};
  function xb(v,fb){return typeof v==='boolean'?v:fb;}
  out.gw={discovery:xb(g.discovery,d.gw.discovery),usage:xb(g.usage,d.gw.usage),
    suppressNested:xb(g.suppressNested,d.gw.suppressNested),
    suppressUnlocked:xb(g.suppressUnlocked,d.gw.suppressUnlocked),
    scanPorts:(g.scanPorts==='all'||g.scanPorts==='none'||(typeof g.scanPorts==='string'&&/^\\d{1,5}(,\\d{1,5}){0,19}$/.test(g.scanPorts)))?g.scanPorts:d.gw.scanPorts};
  return out;
}

// ── colour derivation for the app chrome (approximate, and labelled so) ────────
function relLum(hex){
  var c=[1,3,5].map(function(i){var v=parseInt(hex.slice(i,i+2),16)/255;
    return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
  return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
}
function mix(a,b,t){
  function ch(i){return Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t);}
  function hx(n){return ('0'+n.toString(16)).slice(-2);}
  return '#'+hx(ch(1))+hx(ch(3))+hx(ch(5));
}
function drawPhone(){
  var c=state.colors, light=state.mode==='light';
  var ph=document.getElementById('phone');
  ph.style.setProperty('--mo-bg',c.background);
  ph.style.setProperty('--mo-fg',c.foreground);
  ph.style.setProperty('--mo-cursor',c.cursor);
  ph.style.setProperty('--mo-selbg',c.selectionBackground);
  ph.style.setProperty('--ph-bg',mix(c.background,light?'#ffffff':'#000000',0.25));
  ph.style.setProperty('--ph-chrome',mix(c.background,light?'#ffffff':'#000000',0.5));
  ph.style.setProperty('--ph-card',mix(c.background,light?'#000000':'#ffffff',0.07));
  ph.style.setProperty('--ph-text',c.foreground);
  ph.style.setProperty('--ph-dim',mix(c.foreground,c.background,0.45));
  ph.style.setProperty('--ph-ok',c.green);
  ph.style.setProperty('--ph-okwash',mix(c.green,c.background,0.82));
  ph.style.setProperty('--ph-red',c.red);
  ph.style.setProperty('--ph-redwash',mix(c.red,c.background,0.82));

  // The terminal transcript: one line per colour family so every picker has a
  // visible consequence. esc() everything — colours are sanitized but the habit holds.
  var t=document.getElementById('pterm');
  t.innerHTML=''
   +'<div class="l"><span style="color:'+esc(c.brightBlack)+'">$ cd ~/senpex-frontend</span></div>'
   +'<div class="l"><span style="color:'+esc(c.brightBlue)+'">~/senpex-frontend</span><span style="color:'+esc(c.brightBlack)+'"> on </span><span style="color:'+esc(c.brightMagenta)+'">main</span></div>'
   +'<div class="l"><span style="color:'+esc(c.brightBlack)+'">$ git status</span></div>'
   +'<div class="l"><span style="color:'+esc(c.white)+'">modified: </span><span style="color:'+esc(c.brightYellow)+'">retry.js</span></div>'
   +'<div class="l"><span style="color:'+esc(c.brightCyan)+'">2 files</span><span style="color:'+esc(c.brightBlack)+'"> changed</span></div>'
   +'<div class="l"></div>'
   +'<div class="l"><span style="color:'+esc(c.brightBlack)+'">$ claude</span></div>'
   +'<div class="l"><span style="color:'+esc(c.blue)+';font-weight:700">✻ Claude Code</span><span style="color:'+esc(c.brightBlack)+'"> · opus</span></div>'
   +'<div class="l"><span class="sel" style="color:'+esc(c.foreground)+'"> &gt; fix the failing checkout test </span></div>'
   +'<div class="l"><span style="color:'+esc(c.magenta)+'">✳ Thinking…</span></div>'
   +'<div class="l"><span style="color:'+esc(c.brightBlack)+'">⎿ Read </span><span style="color:'+esc(c.cyan)+'">checkout.test.js</span></div>'
   +'<div class="l"><span style="color:'+esc(c.green)+'">⏺</span> Patching <span style="color:'+esc(c.yellow)+'">retry.js</span> — the helper drops the cart.</div>'
   +'<div class="l"><span style="color:'+esc(c.red)+'">12 failing</span> → <span style="color:'+esc(c.brightGreen)+'">12 passing</span></div>'
   +'<div class="l"><span style="color:'+esc(c.brightBlack)+'">$ </span><span class="cursor"></span></div>';
}

// ── payload / delivery ─────────────────────────────────────────────────────────
function payload(){var pl={ms:copyObj(state)};pl.ms.on=true;return pl;}
function themeJson(){
  return JSON.stringify({v:1,name:state.name,mode:state.mode,colors:state.colors});
}
function themeB64(){
  // Standard alphabet, padding stripped — the gallery's own encoding. btoa is fine:
  // the sanitized JSON is pure ASCII.
  return btoa(themeJson()).replace(/=+$/,'');
}
function deepLink(){return 'moshi://theme?d='+themeB64();}

function refresh(){
  drawPhone();
  var c=encodeURIComponent(b64e(payload()));
  document.getElementById('qrimg').src='/moshi-qr.svg?c='+c;
  document.getElementById('g_json').setAttribute('href','/moshi-theme.json?c='+c);
  document.getElementById('gethint').textContent='Link: '+deepLink().slice(0,52)+'\\u2026 ('+deepLink().length+' chars)';
  var box=document.getElementById('fileJson');
  box.textContent=JSON.stringify(JSON.parse(themeJson()),null,2);
  var gw=[];
  if(state.gw.discovery!==MO_DEFAULTS.gw.discovery)gw.push('always-on-discovery '+(state.gw.discovery?'on':'off'));
  if(state.gw.usage!==MO_DEFAULTS.gw.usage)gw.push('usage-collection '+(state.gw.usage?'on':'off'));
  if(state.gw.suppressNested!==MO_DEFAULTS.gw.suppressNested)gw.push('suppress-nested-agent-push '+(state.gw.suppressNested?'on':'off'));
  if(state.gw.suppressUnlocked!==MO_DEFAULTS.gw.suppressUnlocked)gw.push('suppress-push-while-unlocked '+(state.gw.suppressUnlocked?'on':'off'));
  if(state.gw.scanPorts)gw.push('scan-ports '+state.gw.scanPorts);
  var bar=document.getElementById('gwcmd');
  if(bar){
    if(gw.length){
      bar.style.display='';
      bar.querySelector('.mono').textContent='curl -fsSL "'+ORIGIN+'/moshi-apply.sh?c='+c+'" | bash';
    }else{
      bar.style.display='none';
    }
  }
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/moshi?c='+c);}catch(e){}
    try{localStorage.setItem('scc_moshi',JSON.stringify(state));}catch(e){}
  },400);
}

// ── saved setups ────────────────────────────────────────────────────────────────
function svGet(){
  try{var a=JSON.parse(localStorage.getItem('scc_moshi_saved')||'[]');
    return Object.prototype.toString.call(a)==='[object Array]'?a:[];}catch(e){return [];}
}
function svSet(a){try{localStorage.setItem('scc_moshi_saved',JSON.stringify(a.slice(0,40)));}catch(e){}}
function saveMoshiSetup(){
  var name=(prompt('Name this theme:',state.name)||'').replace(/^ +| +$/g,'').slice(0,40);
  if(!name)return;
  // The name IS part of a Moshi theme (the app shows it in its picker), so saving
  // under a new name renames the theme itself — card and theme can never diverge.
  state.name=xName(name,state.name);
  var all=svGet().filter(function(x){return x.name!==name;});
  all.push({name:name,savedAt:new Date().toISOString().slice(0,10),payload:payload()});
  svSet(all);
  buildControls();refresh();
  toast('Saved \\u201c'+name+'\\u201d');
}
function paintSaved(){
  var row=document.getElementById('svRow'); if(!row)return;
  row.innerHTML='';
  var save=document.createElement('button');
  save.type='button';save.className='svchip savecard';
  save.innerHTML='<span class="svsw"><i style="background:var(--accent)"></i></span>'
    +'<span class="svbody"><span class="svname">\\uFF0B Save this theme</span>'
    +'<span class="svmeta" style="display:block">name, mode, all 20 colours, behaviour</span></span>';
  save.addEventListener('click',saveMoshiSetup);
  row.appendChild(save);
  svGet().forEach(function(item){
    var ms=(item.payload&&item.payload.ms)||{};
    var cc=(ms.colors&&typeof ms.colors==='object')?ms.colors:MO_DEFAULTS.colors;
    var b=document.createElement('button');
    b.type='button';b.className='svchip';
    var sw=document.createElement('span');sw.className='svsw';
    ['blue','green','yellow','red'].forEach(function(k){
      var d=document.createElement('i');d.style.background=cc[k]||'#888';sw.appendChild(d);
    });
    var body=document.createElement('span');body.className='svbody';
    var nm=document.createElement('span');nm.className='svname';nm.textContent=item.name;
    var mt=document.createElement('span');mt.className='svmeta';
    mt.textContent=(ms.mode||'dark')+' \\u00b7 saved '+(item.savedAt||'');
    body.appendChild(nm);body.appendChild(mt);
    var acts=document.createElement('span');acts.className='svacts';
    function act(label,fn){
      var a=document.createElement('span');a.className='svact';a.textContent=label;
      a.addEventListener('click',function(e){e.stopPropagation();fn();});
      return a;
    }
    acts.appendChild(act('share',function(){
      copyText(ORIGIN+'/moshi?c='+encodeURIComponent(b64e(item.payload)));
      toast('Link to \\u201c'+item.name+'\\u201d copied');
    }));
    acts.appendChild(act('update',function(){
      svSet(svGet().map(function(x){
        return x.name===item.name
          ?{name:item.name,savedAt:new Date().toISOString().slice(0,10),payload:payload()}
          :x;
      }));
      paintSaved();toast('Updated \\u201c'+item.name+'\\u201d from the current controls');
    }));
    acts.appendChild(act('rename',function(){
      var n=(prompt('New name:',item.name)||'').trim().slice(0,40);
      if(!n)return;
      var out=[];
      svGet().forEach(function(x){
        if(x.name===item.name){
          x.name=n;
          if(x.payload&&x.payload.ms)x.payload.ms.name=xName(n,x.payload.ms.name);
          out.push(x);
        }else if(x.name!==n)out.push(x);
      });
      svSet(out);
      paintSaved();toast('Renamed to \\u201c'+n+'\\u201d');
    }));
    acts.appendChild(act('delete',function(){
      svSet(svGet().filter(function(x){return x.name!==item.name;}));
      paintSaved();toast('Removed \\u201c'+item.name+'\\u201d');
    }));
    b.appendChild(sw);b.appendChild(body);b.appendChild(acts);
    b.addEventListener('click',function(){
      state=saneMoshi(copyObj(ms));
      buildControls();refresh();
      toast('Loaded \\u201c'+item.name+'\\u201d');
    });
    row.appendChild(b);
  });
}

// ── controls ────────────────────────────────────────────────────────────────────
var TIPS={
 saved:{t:'Saved themes',d:'The whole page under one name, in THIS browser (localStorage \\u2014 this site has no server storage). Share copies a link that opens the theme here; the QR on that page imports it into Moshi.'},
 name:{t:'Theme name',d:'Shown in Moshi\\u2019s theme picker and used for the downloaded filename. Letters, numbers, spaces, dashes.'},
 mode:{t:'Dark or light',d:'Tells Moshi which side of its automatic light/dark switching this theme belongs to \\u2014 the app can follow the system and keep one theme for each.'},
 colors:{t:'Terminal colours',d:'background and foreground are required by the schema; the 16 ANSI slots and cursor/selection are optional but every gallery theme ships them, so this page does too. These drive the WHOLE app: Moshi derives its UI palette from them, contrast-checked.'},
 starters:{t:'Starters',d:'Vendored verbatim from the official gallery (getmoshi.app/themes) \\u2014 the exact JSON the app would import from there. Load one, then tweak.'},
 gw:{t:'moshi-hook behaviour',d:'The host-side daemon\\u2019s complete config surface \\u2014 five behavioural keys under [gateway], zero cosmetic ones (verified in the 0.2.85 binary). The command drives moshi-hook\\u2019s own set subcommand, which preserves comments and unknown keys in config.toml. Only shown when something differs from stock.'},
 scanPorts:{t:'Scan ports',d:'Which loopback ports the gateway HTTP-probes for dev-server discovery: all (stock), none, or a comma list like 3000,5173. Applies on the next refresh, no restart.'},
};
function ihtml(key){
  var t=TIPS[key];if(!t)return '';
  return ' <button type="button" class="i" data-tip="'+esc(key)+'" aria-label="What is this?">i</button>';
}
function tipFor(key){return TIPS[key]||null;}

var COLOR_LABELS={background:'Background',foreground:'Foreground',cursor:'Cursor',
  selectionBackground:'Selection',black:'Black',red:'Red',green:'Green',yellow:'Yellow',
  blue:'Blue',magenta:'Magenta',cyan:'Cyan',white:'White',brightBlack:'Bright black',
  brightRed:'Bright red',brightGreen:'Bright green',brightYellow:'Bright yellow',
  brightBlue:'Bright blue',brightMagenta:'Bright magenta',brightCyan:'Bright cyan',
  brightWhite:'Bright white'};

function buildControls(){
  var host=document.getElementById('controls');
  var s=state;
  var CORE=['background','foreground','cursor','selectionBackground'];
  var NORMAL=['black','red','green','yellow','blue','magenta','cyan','white'];
  var BRIGHT=['brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightMagenta','brightCyan','brightWhite'];
  function rows(keys){
    return keys.map(function(k){
      return '<label class="curow"><input type="color" id="mo_'+k+'" value="'+esc(s.colors[k])+'"><span>'+esc(COLOR_LABELS[k])+'</span></label>';
    }).join('');
  }
  host.innerHTML=''
   +'<div class="panel"><h3>\\u{1F4BE} Saved themes'+ihtml('saved')+'</h3>'
    +'<p class="phint">Yours, in this browser. Share hands someone the link; the QR on it imports into their Moshi.</p>'
    +'<div class="svrow" id="svRow"></div></div>'
   +'<div class="panel"><h3>\\u{1F3A8} Colours'+ihtml('colors')+'</h3>'
    +'<label class="ctl"><span class="cap">Theme name'+ihtml('name')+'</span>'
    +'<input type="text" id="mo_name" maxlength="40" value="'+esc(s.name)+'"></label>'
    +'<div class="ctl"><span class="cap">Mode'+ihtml('mode')+'</span>'
    +'<div class="modechips" id="moMode">'
    +MO_OPTS.modes.map(function(m){
      return '<button type="button" class="stychip'+(s.mode===m?' on':'')+'" data-mode="'+esc(m)+'">'+esc(m)+'</button>';
    }).join('')+'</div></div>'
    +'<div class="cologrid">'
    +'<div class="colohead">Core</div>'+rows(CORE)
    +'<div class="colohead">ANSI</div>'+rows(NORMAL)
    +'<div class="colohead">Bright</div>'+rows(BRIGHT)
    +'</div></div>'
   +'<div class="panel"><h3>\\u{1F680} Starters'+ihtml('starters')+'</h3>'
    +'<p class="phint">Straight from the official gallery \\u2014 load one, then make it yours. There are a thousand more at getmoshi.app/themes.</p>'
    +'<div class="stgrid">'
    +Object.keys(MO_OPTS.starters).map(function(slug){
      var t=MO_OPTS.starters[slug];
      var dots=['blue','green','yellow','red'].map(function(k){
        return '<i style="background:'+esc(t.colors[k]||'#888')+'"></i>';
      }).join('');
      return '<button type="button" class="stchip" data-slug="'+esc(slug)+'">'
        +'<span class="stname">'+esc(t.name)+'</span>'
        +'<span class="stsw" style="background:'+esc(t.colors.background)+'">'+dots
        +'<span style="color:'+esc(t.colors.foreground)+';font-size:9px;font-family:ui-monospace,Menlo,monospace">text</span></span>'
        +'<span class="stmode">'+esc(t.mode)+' \\u00b7 gallery</span></button>';
    }).join('')+'</div></div>'
   +'<div class="panel"><h3>\\u2699 moshi-hook behaviour'+ihtml('gw')+'</h3>'
    +'<p class="phint">The daemon on THIS machine \\u2014 push and discovery behaviour, not looks. Verified: these five keys are its entire config.</p>'
    +'<label class="ctl2"><input type="checkbox" id="gw_disc"'+(s.gw.discovery?' checked':'')+'> always-on discovery</label>'
    +'<label class="ctl2"><input type="checkbox" id="gw_usage"'+(s.gw.usage?' checked':'')+'> usage collection</label>'
    +'<label class="ctl2"><input type="checkbox" id="gw_nested"'+(s.gw.suppressNested?' checked':'')+'> suppress nested-agent push</label>'
    +'<label class="ctl2"><input type="checkbox" id="gw_unlocked"'+(s.gw.suppressUnlocked?' checked':'')+'> suppress push while Mac unlocked</label>'
    +'<label class="ctl"><span class="cap">Scan ports'+ihtml('scanPorts')+'</span>'
    +'<input type="text" id="gw_ports" placeholder="all (stock) \\u00b7 none \\u00b7 3000,5173" value="'+esc(s.gw.scanPorts)+'"></label>'
    +'<div id="gwcmd" style="display:none;margin-top:9px">'
    +'<span class="cap" style="display:block;margin-bottom:5px">Apply on this machine:</span>'
    +'<div class="mono" style="font-size:10.5px;background:#0b0e14;border:1px solid var(--border);border-radius:8px;padding:8px 10px;overflow-x:auto;white-space:nowrap"></div>'
    +'<button type="button" class="stychip" id="gwcopy" style="margin-top:7px">Copy command</button>'
    +'</div></div>';

  document.getElementById('mo_name').addEventListener('input',function(){
    state.name=xName(this.value,'My Moshi Theme');refresh();
  });
  Array.prototype.forEach.call(host.querySelectorAll('#moMode .stychip'),function(ch){
    ch.addEventListener('click',function(){
      state.mode=this.getAttribute('data-mode');
      Array.prototype.forEach.call(host.querySelectorAll('#moMode .stychip'),function(x){
        x.classList.toggle('on',x===ch);
      });
      refresh();
    });
  });
  MO_OPTS.colorKeys.forEach(function(k){
    var el=document.getElementById('mo_'+k); if(!el)return;
    el.addEventListener('input',function(){state.colors[k]=this.value;refresh();});
  });
  Array.prototype.forEach.call(host.querySelectorAll('.stchip[data-slug]'),function(ch){
    ch.addEventListener('click',function(){
      var t=MO_OPTS.starters[this.getAttribute('data-slug')];
      if(!t)return;
      var next=copyObj(state);
      next.name=t.name;next.mode=t.mode;
      // The gallery file may omit optional keys; keep the current value there so
      // the preview never shows a hole the app would not show.
      MO_OPTS.colorKeys.forEach(function(k){
        if(t.colors[k])next.colors[k]=t.colors[k];
      });
      state=saneMoshi(next);
      buildControls();refresh();
      toast(t.name+' loaded \\u2014 tweak anything');
    });
  });
  document.getElementById('gw_disc').addEventListener('change',function(){state.gw.discovery=this.checked;refresh();});
  document.getElementById('gw_usage').addEventListener('change',function(){state.gw.usage=this.checked;refresh();});
  document.getElementById('gw_nested').addEventListener('change',function(){state.gw.suppressNested=this.checked;refresh();});
  document.getElementById('gw_unlocked').addEventListener('change',function(){state.gw.suppressUnlocked=this.checked;refresh();});
  document.getElementById('gw_ports').addEventListener('input',function(){
    var v=this.value.replace(/[^0-9a-z,]/g,'');
    state.gw.scanPorts=(v==='all'||v==='none'||/^\\d{1,5}(,\\d{1,5}){0,19}$/.test(v))?v:'';
    refresh();
  });
  var gwc=document.getElementById('gwcopy');
  if(gwc)gwc.addEventListener('click',function(){
    copyText(document.querySelector('#gwcmd .mono').textContent);
    toast('Command copied \\u2014 run it in any terminal');
  });
  paintSaved();
}

// tooltips (same pattern as the studio)
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  var open=document.querySelector('.tip');
  if(open&&(!b||open._for!==b)){open.remove();}
  if(!b)return;
  if(open&&open._for===b)return;
  var t=tipFor(b.getAttribute('data-tip'));if(!t)return;
  var tip=document.createElement('div');tip.className='tip';tip._for=b;
  tip.innerHTML='<b>'+esc(t.t)+'</b>'+esc(t.d);
  document.body.appendChild(tip);
  var r=b.getBoundingClientRect();
  var w=Math.min(340,innerWidth-24);
  tip.style.maxWidth=w+'px';
  var x=Math.min(Math.max(12,r.left-8),innerWidth-w-12);
  tip.style.left=x+'px';
  tip.style.top=(r.bottom+scrollY+8)+'px';
});

// ── delivery buttons ────────────────────────────────────────────────────────────
document.getElementById('g_link').addEventListener('click',function(){
  copyText(deepLink());
  toast('Import link copied \\u2014 send it to your phone (it opens Moshi)');
});
document.getElementById('g_str').addEventListener('click',function(){
  copyText('moshi-theme:'+themeB64());
  toast('Theme string copied \\u2014 paste it in Moshi\\u2019s importer');
});
document.getElementById('g_share').addEventListener('click',function(){
  copyText(ORIGIN+'/moshi?c='+encodeURIComponent(b64e(payload())));
  toast('Page link copied');
});

// ── boot ────────────────────────────────────────────────────────────────────────
(function(){
  state=defaultMoshi();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'&&pl.ms&&typeof pl.ms==='object')state=saneMoshi(pl.ms);
    }else{
      var draft=localStorage.getItem('scc_moshi');
      if(draft)state=saneMoshi(JSON.parse(draft));
    }
  }catch(e){state=defaultMoshi();}
})();
buildControls();
refresh();
installNav();
</script></body></html>`;
}

module.exports = { renderMoshi, MOSHI_CSS };
