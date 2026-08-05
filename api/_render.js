// shayan-cc-config renderer: homepage (favorites, GitHub logo, customize CTA,
// published/shared custom setups) + the real-time customizer.
const { EXPAND_SRC, STARTERS } = require('./_theme.js');

const GITHUB_URL = 'https://github.com/seanmodd/shayan-cc-config';

const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230a0c10'/><rect x='4' y='4' width='24' height='24' rx='5' fill='none' stroke='%237aa2f7' stroke-width='1.4'/><text x='7' y='22' font-family='monospace' font-size='15' fill='%23bb9af7'>&gt;_</text></svg>">`;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function terminalBg(colors) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(colors.inverseText || '');
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    if (0.299 * r + 0.587 * g + 0.114 * b < 150) return `rgb(${r},${g},${b})`;
  }
  return '#12141a';
}

function previewColors(c) {
  return {
    bg: terminalBg(c), text: c.text, accent: c.claude, shimmer: c.claudeShimmer,
    success: c.success, error: c.error, warning: c.warning, permission: c.permission,
    inactive: c.inactive, subtle: c.subtle, planMode: c.planMode,
    userMsgBg: c.userMessageBackground, promptBorder: c.promptBorder,
    diffAdded: c.diffAdded, diffRemoved: c.diffRemoved,
    diffAddedWord: c.diffAddedWord, diffRemovedWord: c.diffRemovedWord,
  };
}

function clientPreset(DATA, p) {
  const dark = DATA.defaultThemes.find(t => t.id === 'dark') || DATA.defaultThemes[0];
  const c = (p.theme || dark).colors;
  return {
    id: p.id, name: p.name, author: p.author, tagline: p.tagline,
    statuslineColor: p.statuslineColor,
    verbs: p.thinkingVerbs.verbs.slice(0, 12), verbFormat: p.thinkingVerbs.format,
    phases: p.thinkingStyle.phases, reverseMirror: p.thinkingStyle.reverseMirror,
    interval: Math.max(p.thinkingStyle.updateInterval, 80),
    umd: { borderStyle: p.userMessageDisplay.borderStyle, borderColor: p.userMessageDisplay.borderColor },
    colors: previewColors(c),
  };
}

const CSS = `
  :root{--bg:#0a0c10;--panel:#10141b;--border:#1e2530;--text:#dce3ee;--dim:#8b96a8;--faint:#5b6470;--accent:#7aa2f7;--ok:#9ece6a;--gold:#e5c07b;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-image:radial-gradient(1200px 500px at 50% -100px,#131a28 0%,transparent 70%);}
  a{color:inherit;}
  .mono{font-family:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;}
  .top{max-width:1200px;margin:0 auto;padding:20px 24px 0;display:flex;align-items:center;gap:14px;}
  .top .brand{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:15px;color:var(--dim);}
  .top .spacer{flex:1;}
  .iconbtn{display:inline-flex;align-items:center;gap:7px;color:var(--dim);text-decoration:none;border:1px solid var(--border);border-radius:9px;padding:7px 12px;font-size:13px;transition:all .15s;}
  .iconbtn:hover{border-color:var(--accent);color:var(--text);transform:translateY(-1px);}
  .iconbtn svg{width:17px;height:17px;fill:currentColor;}
  header{max-width:1200px;margin:0 auto;padding:26px 24px 6px;text-align:center;}
  h1{font-size:44px;letter-spacing:-1px;font-family:ui-monospace,"SF Mono",Menlo,monospace;background:linear-gradient(90deg,#7aa2f7,#bb9af7,#f5c2e7,#94e2d5);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .sub{color:var(--dim);margin:12px auto 0;font-size:15px;max-width:760px;line-height:1.55;}
  .cta{display:inline-flex;gap:8px;align-items:center;margin-top:16px;background:linear-gradient(90deg,#7aa2f7,#bb9af7);color:#0a0c10;font-weight:700;border:none;border-radius:10px;padding:11px 20px;font-size:15px;cursor:pointer;text-decoration:none;transition:transform .15s,box-shadow .15s;box-shadow:0 6px 24px rgba(122,162,247,.28);}
  .cta:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(122,162,247,.4);}
  .applybar{position:sticky;top:10px;z-index:50;max-width:980px;margin:22px auto 0;background:rgba(16,20,27,.93);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 30px rgba(0,0,0,.4);}
  .applybar.pulse{animation:pulse 1.2s ease 2;}
  @keyframes pulse{0%,100%{border-color:var(--border);}50%{border-color:var(--accent);}}
  .step{color:var(--faint);font-size:12px;text-transform:uppercase;letter-spacing:.08em;}
  .selbadge{font-size:13px;color:var(--dim);}.selbadge b{color:var(--text);}
  .cmd{flex:1 1 380px;display:flex;align-items:center;gap:8px;background:#0b0e14;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:12.5px;color:#b7c3d6;overflow-x:auto;white-space:nowrap;}
  .cmd .dollar{color:var(--ok);}
  button.copy{cursor:pointer;border-radius:8px;border:1px solid var(--border);background:#161c26;color:var(--text);padding:9px 14px;font-size:13px;transition:all .15s;}
  button.copy:hover{border-color:var(--accent);color:var(--accent);}
  .sectlabel{max-width:1200px;margin:30px auto 0;padding:0 26px;font-size:13px;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:8px;}
  main{max-width:1200px;margin:14px auto 60px;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:22px;}
  .card{position:relative;background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px;transition:transform .15s,border-color .15s,box-shadow .15s;}
  .card:hover{transform:translateY(-3px);box-shadow:0 12px 34px rgba(0,0,0,.45);}
  .card.selected{border-color:var(--card-accent,var(--accent));box-shadow:0 0 0 1px var(--card-accent,var(--accent)),0 12px 34px rgba(0,0,0,.45);}
  .star{position:absolute;top:10px;right:12px;z-index:3;cursor:pointer;font-size:19px;line-height:1;color:var(--faint);background:none;border:none;transition:transform .12s,color .12s;}
  .star:hover{transform:scale(1.2);} .star.on{color:var(--gold);}
  .term{border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.06);}
  .tbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.05);font-size:12.5px;}
  .dots{display:flex;gap:6px;} .dot{width:11px;height:11px;border-radius:50%;}
  .tname{margin-left:4px;font-weight:600;} .tauthor{margin-left:auto;font-size:11px;opacity:.6;}
  .tbody{padding:13px 14px 12px;font-size:12.5px;line-height:1.85;font-family:ui-monospace,"SF Mono",Menlo,monospace;}
  .row{white-space:pre-wrap;} .umsg-border{display:inline-block;border-radius:6px;padding:1px 9px;}
  .statusline{padding:7px 12px 9px;font-size:11px;border-top:1px solid rgba(255,255,255,.05);font-family:ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;}
  .meta{display:flex;align-items:baseline;gap:8px;} .tagline{color:var(--dim);font-size:13.5px;font-style:italic;}
  .chip{margin-left:auto;font-size:10.5px;color:var(--faint);border:1px solid var(--border);padding:2px 8px;border-radius:20px;white-space:nowrap;}
  .verbsline{color:var(--faint);font-size:11.5px;font-family:ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cardbtns{display:flex;gap:8px;}
  button.pick{flex:1;padding:11px;font-size:14px;font-weight:600;cursor:pointer;border-radius:8px;border:1px solid var(--card-accent,var(--border));background:#161c26;color:var(--text);transition:all .15s;}
  button.pick:hover{background:var(--card-accent);color:#0a0c10;}
  .card.selected button.pick{background:var(--card-accent);color:#0a0c10;}
  button.ghost{padding:11px 12px;font-size:13px;cursor:pointer;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--dim);transition:all .15s;}
  button.ghost:hover{border-color:var(--accent);color:var(--text);}
  footer{text-align:center;color:var(--faint);font-size:12.5px;padding:8px 24px 46px;line-height:2;}
  footer a{color:var(--dim);text-decoration:underline;}
  #toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(80px);background:#161c26;border:1px solid var(--accent);color:var(--text);padding:12px 20px;border-radius:10px;font-size:13.5px;opacity:0;transition:all .3s;z-index:100;max-width:92vw;text-align:center;}
  #toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
`;

const GH_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>';

// ── Client-side JS shared by both pages (no template literals inside; safe to embed) ──
const CLIENT_LIB = EXPAND_SRC + `
var $=function(s,el){return (el||document).querySelector(s);};
function b64e(o){var s=btoa(unescape(encodeURIComponent(JSON.stringify(o))));return s.replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}
function b64d(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))));}
function termBg(c){var m=/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(c.inverseText||'');if(m){var r=+m[1],g=+m[2],b=+m[3];if(0.299*r+0.587*g+0.114*b<150)return 'rgb('+r+','+g+','+b+')';}return '#12141a';}
function mapPreview(c){return {bg:termBg(c),text:c.text,accent:c.claude,shimmer:c.claudeShimmer,success:c.success,error:c.error,warning:c.warning,permission:c.permission,inactive:c.inactive,subtle:c.subtle,planMode:c.planMode,userMsgBg:c.userMessageBackground,promptBorder:c.promptBorder,diffAdded:c.diffAdded,diffRemoved:c.diffRemoved,diffAddedWord:c.diffAddedWord,diffRemovedWord:c.diffRemovedWord};}
function spinnerSeq(p){var ph=p.phases;return (p.reverseMirror&&ph.length>2)?ph.concat(ph.slice(1,-1).reverse()):ph;}
function fav_get(){try{return JSON.parse(localStorage.getItem('scc_favs')||'[]');}catch(e){return [];}}
function fav_set(a){try{localStorage.setItem('scc_favs',JSON.stringify(a));}catch(e){}}
function fav_has(id){return fav_get().indexOf(id)>=0;}
function fav_toggle(id){var a=fav_get();var i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);fav_set(a);return i<0;}
function customs_get(){try{return JSON.parse(localStorage.getItem('scc_customs')||'[]');}catch(e){return [];}}
function customs_set(a){try{localStorage.setItem('scc_customs',JSON.stringify(a));}catch(e){}}
function toast(msg){var t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show');},4200);}
function copyText(text){try{navigator.clipboard.writeText(text);}catch(e){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(_){}ta.remove();}}
// Build a normalized card model from a custom payload {n,s,p,vf,vv,ph,rm,ub,uc}
function customToModel(pl){
  var full=expandPalette(pl.p);
  return {id:'custom:'+(pl.id||''),name:pl.n||'Custom',author:pl.author||'you',tagline:pl.tagline||'Your custom setup.',statuslineColor:pl.s||'blue',verbs:(pl.vv||[]).slice(0,12),verbFormat:pl.vf||'{}\\u2026 ',phases:pl.ph||['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],reverseMirror:pl.rm!==false,interval:110,umd:{borderStyle:pl.ub||'none',borderColor:pl.uc||'rgb(122,162,247)'},colors:mapPreview(full),custom:true,payload:pl};
}
`;

// The card renderer + homepage boot logic (no template literals inside).
const HOME_JS = `
var ORIGIN=location.origin;
function cmdFor(m){return m.custom?('curl -fsSL "'+ORIGIN+'/apply.sh?c='+encodeURIComponent(b64e(m.payload))+'" | bash'):('curl -fsSL '+ORIGIN+'/apply/'+m.id+'.sh | bash');}
var selectedId=null;
function card(m){
  var c=m.colors;var el=document.createElement('div');el.className='card';el.dataset.id=m.id;el.style.setProperty('--card-accent',c.accent);
  var hasB=m.umd.borderStyle&&m.umd.borderStyle!=='none';
  var userMsg=hasB?('<span class="umsg-border" style="border:1px solid '+m.umd.borderColor+';color:'+c.text+'">fix the login redirect bug</span>'):('<span style="color:'+c.inactive+'">&gt;</span> <span style="color:'+c.text+'">fix the login redirect bug</span>');
  var star='<button class="star'+(fav_has(m.id)?' on':'')+'" title="Favorite">'+(fav_has(m.id)?'\\u2605':'\\u2606')+'</button>';
  var delBtn=m.custom?'<button class="ghost" data-act="del">Delete</button>':'<button class="ghost" data-act="share">Share</button>';
  el.innerHTML=star+
    '<div class="term" style="background:'+c.bg+'">'+
      '<div class="tbar" style="color:'+c.text+'"><div class="dots"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span></div><span class="tname">'+m.name+'</span><span class="tauthor">by '+m.author+'</span></div>'+
      '<div class="tbody">'+
        '<div class="row">'+userMsg+'</div>'+
        '<div class="row"><span class="spin" style="color:'+c.accent+'">'+m.phases[0]+'</span> <span class="verb" style="color:'+c.accent+'"></span><span style="color:'+c.inactive+'">(esc to interrupt)</span></div>'+
        '<div class="row"><span style="color:'+c.success+'">\\u23fa</span> <span style="color:'+c.text+'">Update(src/auth.ts)</span></div>'+
        '<div class="row" style="color:'+c.inactive+'">  \\u23bf  Updated 2 lines</div>'+
        '<div class="row" style="background:'+c.diffAdded+'"><span style="color:'+c.diffAddedWord+'">+ if (session.valid) return next()</span></div>'+
        '<div class="row" style="background:'+c.diffRemoved+'"><span style="color:'+c.diffRemovedWord+'">- return res.redirect("/login")</span></div>'+
      '</div>'+
      '<div class="statusline" style="color:'+c.inactive+'"><span style="color:'+c.accent+'">claude-fable-5</span> | \\ud83d\\udcc1senpex-frontend | \\ud83d\\udd00main | <span style="color:'+c.accent+'">\\u25ae\\u25ae\\u25ae\\u25ae</span><span style="color:'+c.subtle+'">\\u25af\\u25af\\u25af\\u25af\\u25af\\u25af</span> 42%</div>'+
    '</div>'+
    '<div class="meta"><span class="tagline">'+m.tagline+'</span><span class="chip">status line: '+m.statuslineColor+'</span></div>'+
    '<div class="verbsline">'+m.verbs.slice(0,6).join(' \\u00b7 ')+' \\u2026</div>'+
    '<div class="cardbtns"><button class="pick">Use this setup</button>'+delBtn+'</div>';
  var seq=spinnerSeq(m),si=0,vi=0,spinEl=$('.spin',el),verbEl=$('.verb',el);
  var fmt=function(v){return (m.verbFormat||'{}\\u2026 ').replace('{}',v);};
  verbEl.textContent=fmt(m.verbs[0]||'Working');
  setInterval(function(){si=(si+1)%seq.length;spinEl.textContent=seq[si];},m.interval);
  setInterval(function(){vi=(vi+1)%m.verbs.length;verbEl.textContent=fmt(m.verbs[vi]||'Working');},2600);
  $('.star',el).addEventListener('click',function(e){e.stopPropagation();var on=fav_toggle(m.id);this.classList.toggle('on',on);this.textContent=on?'\\u2605':'\\u2606';render();});
  $('.pick',el).addEventListener('click',function(){selectedId=m.id;paintSel();copyText(cmdFor(m));toast('\\u201c'+m.name+'\\u201d command copied \\u2014 paste it in any terminal');var b=$('#applybar');b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse');b.scrollIntoView({behavior:'smooth',block:'nearest'});});
  var act=$('[data-act]',el);
  if(act)act.addEventListener('click',function(){
    if(m.custom){ var cs=customs_get().filter(function(x){return x.id!==m.payload.id;});customs_set(cs);toast('Deleted \\u201c'+m.name+'\\u201d');render(); }
    else { copyText(ORIGIN+'/?shared='+encodeURIComponent(b64e({fromPreset:m.id})));toast('Preset link copied'); }
  });
  return el;
}
function models(){
  var out=PRESETS.slice();
  customs_get().forEach(function(pl){out.push(customToModel(pl));});
  return out;
}
function render(){
  var favs=fav_get();var all=models();
  var favModels=all.filter(function(m){return favs.indexOf(m.id)>=0;});
  var rest=all.filter(function(m){return favs.indexOf(m.id)<0;});
  var grid=$('#grid');grid.innerHTML='';
  var favLabel=$('#favlabel');
  if(favModels.length){favLabel.style.display='flex';favModels.forEach(function(m){grid.appendChild(card(m));});
    var sep=document.createElement('div');sep.style.gridColumn='1/-1';sep.style.height='1px';sep.style.background='var(--border)';sep.style.margin='6px 0';grid.appendChild(sep);
  } else {favLabel.style.display='none';}
  rest.forEach(function(m){grid.appendChild(card(m));});
  paintSel();
}
function paintSel(){
  document.querySelectorAll('.card').forEach(function(el){var s=el.dataset.id===selectedId;el.classList.toggle('selected',s);var pk=$('.pick',el);if(pk)pk.textContent=s?'\\u2713 Selected \\u2014 copied':'Use this setup';});
  var m=models().filter(function(x){return x.id===selectedId;})[0];
  $('#selbadge').innerHTML=m?('Selected: <b>'+m.name+'</b> \\u2014 run the command \\u2192'):'No setup selected yet';
  $('#steplabel').textContent=m?'Step 2 \\u2014 run in any terminal':'Step 1 \\u2014 click a setup (\\u2606 to favorite)';
  $('#cmdtext').textContent=m?cmdFor(m):'pick a setup to get its install command';
}
// import a shared setup from ?shared=
(function(){
  try{
    var q=new URLSearchParams(location.search);var sh=q.get('shared');
    if(sh){var d=b64d(sh);
      if(d && d.p){ var cs=customs_get();if(!cs.some(function(x){return x.id===d.id;})){cs.push(d);customs_set(cs);toast('Imported shared setup \\u201c'+(d.n||'Custom')+'\\u201d to your homepage');}}
    }
  }catch(e){}
})();
$('#copybtn').addEventListener('click',function(){copyText($('#cmdtext').textContent);this.textContent='Copied \\u2713';var b=this;setTimeout(function(){b.textContent='Copy';},1600);});
render();
`;

function renderPage(DATA) {
  const presets = DATA.presets.map(p => clientPreset(DATA, p));
  const payload = JSON.stringify(presets).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>shayan-cc-config — Claude Code setup picker</title>${FAVICON}<style>${CSS}</style></head><body>
<div class="top"><span class="brand">shayan-cc-config</span><span class="spacer"></span>
<a class="iconbtn" href="/customize">🎨 Customize your own</a>
<a class="iconbtn" href="${GITHUB_URL}" target="_blank" rel="noreferrer">${GH_SVG}GitHub</a></div>
<header><h1>shayan-cc-config</h1>
<p class="sub">Pick a Claude Code look for your cmux terminals. Click a card — its one-line install command copies itself; run it and <span class="mono">tweakcc</span> applies the theme, thinking verbs, spinner and status-line accent together. Star your favorites, or build your own.</p>
<div><a class="cta" href="/customize">✨ Build a custom setup →</a></div>
<div class="applybar" id="applybar"><div><div class="step" id="steplabel">Step 1 — click a setup (☆ to favorite)</div><div class="selbadge" id="selbadge">No setup selected yet</div></div>
<div class="cmd"><span class="dollar">$</span><span id="cmdtext">pick a setup to get its install command</span></div>
<button class="copy" id="copybtn">Copy</button></div></header>
<div class="sectlabel" id="favlabel" style="display:none">★ Your favorites</div>
<main id="grid"></main>
<footer>Patching by <a href="https://github.com/Piebald-AI/tweakcc" target="_blank" rel="noreferrer">tweakcc</a> · community themes credited on each card · <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">source on GitHub</a> · re-run the command after Claude Code updates<br>built for Sean by Claude ✦ <span class="mono">shayan-cc-config</span></footer>
<div id="toast"></div>
<script>var PRESETS=${payload};
${CLIENT_LIB}
${HOME_JS}
</script></body></html>`;
}

// ── Customizer page ──
const CUSTOMIZE_JS = `
var ORIGIN=location.origin;
var STATUS_COLORS=['gray','orange','blue','teal','green','lavender','rose','gold','slate','cyan'];
var SPINNERS={
 'dots braille':['\\u280b','\\u2819','\\u2839','\\u2838','\\u283c','\\u2834','\\u2826','\\u2827','\\u2807','\\u280f'],
 'classic':['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],
 'circle':['\\u25dc','\\u25e0','\\u25dd','\\u25de','\\u25e1','\\u25df'],
 'moon':['\\u25d0','\\u25d3','\\u25d1','\\u25d2'],
 'bar':['|','/','-','\\\\'],
 'pulse':['\\u00b7','\\u2219','\\u25cf','\\u2219'],
 'blocks':['\\u2581','\\u2582','\\u2583','\\u2584','\\u2585','\\u2586','\\u2587','\\u2588','\\u2587','\\u2586','\\u2585','\\u2584','\\u2583','\\u2582']
};
function hx(t){return '#'+t.map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('');}
function toRGBarr(hex){hex=hex.replace('#','');return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];}
var PAL_KEYS=[['bg','Background'],['raised','Raised / panel'],['text','Text'],['comment','Comment / dim'],['subtle','Subtle'],['accent','Accent (Claude)'],['accent2','Accent 2'],['cyan','Cyan / plan'],['green','Success'],['red','Error'],['orange','Warning'],['yellow','Remember'],['pink','Pink'],['blue','Blue / IDE']];
var state=null;
function defaultState(){
  return {n:'My Setup', s:'blue', p:JSON.parse(JSON.stringify(STARTERS['tokyo-night'])),
    vf:'{}\\u2026 ', vv:['Cooking','Vibing','Conjuring','Tinkering','Orchestrating','Brewing','Sculpting','Percolating','Noodling','Summoning'],
    ph:SPINNERS['classic'], rm:true, ub:'none', uc:'#7aa2f7', id:''};
}
function shortId(){var s=JSON.stringify(state.p)+state.n+state.vv.join();var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}return h.toString(36);}
function currentModel(){
  var full=expandPalette(state.p);
  return {id:'custom:preview',name:state.n||'Custom',author:'you',tagline:'Your custom setup.',statuslineColor:state.s,verbs:state.vv.slice(0,12),verbFormat:state.vf,phases:state.ph,reverseMirror:state.rm,interval:110,umd:{borderStyle:state.ub,borderColor:hexToRgbStr(state.uc)},colors:mapPreview(full),custom:true};
}
function hexToRgbStr(h){var a=toRGBarr(h);return 'rgb('+a[0]+','+a[1]+','+a[2]+')';}
function payload(){
  return {n:state.n,s:state.s,p:state.p,vf:state.vf,vv:state.vv,ph:state.ph,rm:state.rm,ub:state.ub,uc:hexToRgbStr(state.uc),id:shortId(),author:'you'};
}
var previewCard=null;
function drawPreview(){
  var host=$('#preview');host.innerHTML='';
  previewCard=makeCard(currentModel());host.appendChild(previewCard);
  var pl=payload();
  var cmd='curl -fsSL "'+ORIGIN+'/apply.sh?c='+encodeURIComponent(b64e(pl))+'" | bash';
  $('#ccmd').textContent=cmd;
}
// A static (non-interval churning is fine) card for the preview — reuse home card()-like builder
function makeCard(m){
  var c=m.colors;var el=document.createElement('div');el.className='card';el.style.maxWidth='430px';el.style.margin='0 auto';el.style.setProperty('--card-accent',c.accent);
  var hasB=m.umd.borderStyle&&m.umd.borderStyle!=='none';
  var userMsg=hasB?('<span class="umsg-border" style="border:1px solid '+m.umd.borderColor+';color:'+c.text+'">fix the login redirect bug</span>'):('<span style="color:'+c.inactive+'">&gt;</span> <span style="color:'+c.text+'">fix the login redirect bug</span>');
  el.innerHTML='<div class="term" style="background:'+c.bg+'">'+
    '<div class="tbar" style="color:'+c.text+'"><div class="dots"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span></div><span class="tname">'+m.name+'</span><span class="tauthor">live preview</span></div>'+
    '<div class="tbody">'+
      '<div class="row">'+userMsg+'</div>'+
      '<div class="row"><span class="spin" style="color:'+c.accent+'">'+m.phases[0]+'</span> <span class="verb" style="color:'+c.accent+'"></span><span style="color:'+c.inactive+'">(esc to interrupt)</span></div>'+
      '<div class="row"><span style="color:'+c.success+'">\\u23fa</span> <span style="color:'+c.text+'">Update(src/auth.ts)</span></div>'+
      '<div class="row" style="color:'+c.inactive+'">  \\u23bf  Updated 2 lines</div>'+
      '<div class="row" style="background:'+c.diffAdded+'"><span style="color:'+c.diffAddedWord+'">+ if (session.valid) return next()</span></div>'+
      '<div class="row" style="background:'+c.diffRemoved+'"><span style="color:'+c.diffRemovedWord+'">- return res.redirect("/login")</span></div>'+
      '<div class="row"><span style="color:'+c.warning+'">\\u26a0</span> <span style="color:'+c.text+'">2 files changed</span></div>'+
    '</div>'+
    '<div class="statusline" style="color:'+c.inactive+'"><span style="color:'+c.accent+'">claude-fable-5</span> | \\ud83d\\udcc1senpex-frontend | \\ud83d\\udd00main | <span style="color:'+c.accent+'">\\u25ae\\u25ae\\u25ae\\u25ae</span><span style="color:'+c.subtle+'">\\u25af\\u25af\\u25af\\u25af\\u25af\\u25af</span> 42%</div>'+
    '</div>';
  var seq=spinnerSeq(m),si=0,vi=0,spinEl=$('.spin',el),verbEl=$('.verb',el);
  var fmt=function(v){return (m.verbFormat||'{}\\u2026 ').replace('{}',v);};
  verbEl.textContent=fmt(m.verbs[0]||'Working');
  el._t1=setInterval(function(){si=(si+1)%seq.length;spinEl.textContent=seq[si];},m.interval);
  el._t2=setInterval(function(){vi=(vi+1)%Math.max(1,m.verbs.length);verbEl.textContent=fmt(m.verbs[vi]||'Working');},2000);
  return el;
}
function buildControls(){
  var host=$('#controls');
  var h='';
  h+='<label class="ctl">Name<input id="c_name" type="text" value="'+state.n.replace(/"/g,'&quot;')+'"></label>';
  h+='<label class="ctl">Start from<select id="c_start">'+Object.keys(STARTERS).map(function(k){return '<option value="'+k+'">'+k+'</option>';}).join('')+'</select></label>';
  h+='<div class="grp">Palette</div><div class="swatches">';
  PAL_KEYS.forEach(function(k){h+='<label class="sw"><input type="color" data-pal="'+k[0]+'" value="'+hx(state.p[k[0]])+'"><span>'+k[1]+'</span></label>';});
  h+='</div>';
  h+='<div class="grp">Status line accent</div><label class="ctl"><select id="c_status">'+STATUS_COLORS.map(function(x){return '<option value="'+x+'"'+(x===state.s?' selected':'')+'>'+x+'</option>';}).join('')+'</select></label>';
  h+='<div class="grp">Spinner</div><label class="ctl"><select id="c_spin">'+Object.keys(SPINNERS).map(function(k){return '<option value="'+k+'">'+k+'</option>';}).join('')+'</select></label>';
  h+='<label class="ctl2"><input id="c_rm" type="checkbox"'+(state.rm?' checked':'')+'> bounce spinner (mirror)</label>';
  h+='<div class="grp">Thinking verbs <span class="hint">(one per line; used with the format below)</span></div>';
  h+='<textarea id="c_verbs" rows="6">'+state.vv.join('\\n')+'</textarea>';
  h+='<label class="ctl">Verb format <span class="hint">{} = the verb</span><input id="c_vf" type="text" value="'+state.vf.replace(/"/g,'&quot;')+'"></label>';
  h+='<div class="grp">User message box</div><label class="ctl">Border<select id="c_ub">'+['none','round','single','double','bold','classic'].map(function(x){return '<option value="'+x+'"'+(x===state.ub?' selected':'')+'>'+x+'</option>';}).join('')+'</select></label>';
  h+='<label class="sw"><input type="color" id="c_uc" value="'+state.uc+'"><span>Border color</span></label>';
  host.innerHTML=h;
  $('#c_name').addEventListener('input',function(){state.n=this.value;drawPreview();});
  $('#c_start').addEventListener('change',function(){state.p=JSON.parse(JSON.stringify(STARTERS[this.value]));buildControls();drawPreview();});
  $('#c_status').addEventListener('change',function(){state.s=this.value;drawPreview();});
  $('#c_spin').addEventListener('change',function(){state.ph=SPINNERS[this.value].slice();drawPreview();});
  $('#c_rm').addEventListener('change',function(){state.rm=this.checked;drawPreview();});
  $('#c_verbs').addEventListener('input',function(){state.vv=this.value.split('\\n').map(function(s){return s.trim();}).filter(Boolean);drawPreview();});
  $('#c_vf').addEventListener('input',function(){state.vf=this.value;drawPreview();});
  $('#c_ub').addEventListener('change',function(){state.ub=this.value;drawPreview();});
  $('#c_uc').addEventListener('input',function(){state.uc=this.value;drawPreview();});
  Array.prototype.forEach.call(document.querySelectorAll('[data-pal]'),function(inp){inp.addEventListener('input',function(){state.p[this.getAttribute('data-pal')]=toRGBarr(this.value);drawPreview();});});
}
state=defaultState();
buildControls();drawPreview();
$('#c_copy').addEventListener('click',function(){copyText($('#ccmd').textContent);this.textContent='Copied \\u2713';var b=this;setTimeout(function(){b.textContent='Copy install command';},1600);});
$('#c_publish').addEventListener('click',function(){var cs=customs_get();var pl=payload();cs=cs.filter(function(x){return x.id!==pl.id;});cs.push(pl);customs_set(cs);toast('Published \\u201c'+pl.n+'\\u201d to your homepage \\u2b50');});
$('#c_share').addEventListener('click',function(){var link=ORIGIN+'/?shared='+encodeURIComponent(b64e(payload()));copyText(link);toast('Shareable link copied \\u2014 anyone who opens it gets this setup');});
$('#c_reset').addEventListener('click',function(){state=defaultState();buildControls();drawPreview();toast('Reset to defaults');});
`;

const CUSTOMIZE_CSS = `
  .wrap{max-width:1200px;margin:0 auto;padding:8px 24px 60px;display:grid;grid-template-columns:minmax(320px,420px) 1fr;gap:30px;align-items:start;}
  @media(max-width:900px){.wrap{grid-template-columns:1fr;}}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:18px;}
  .ctl{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--dim);margin-bottom:12px;}
  .ctl2{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dim);margin:6px 0 12px;}
  .ctl input,.ctl select,textarea{background:#0b0e14;border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px 10px;font-size:13px;font-family:inherit;}
  textarea{width:100%;resize:vertical;font-family:ui-monospace,Menlo,monospace;line-height:1.5;}
  .grp{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--gold);margin:16px 0 9px;}
  .hint{color:var(--faint);text-transform:none;letter-spacing:0;font-size:11px;}
  .swatches{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
  .sw{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--dim);}
  .sw input[type=color]{width:34px;height:26px;border:1px solid var(--border);border-radius:6px;background:#0b0e14;padding:2px;cursor:pointer;}
  .stickyprev{position:sticky;top:16px;}
  .prevlabel{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--faint);margin-bottom:12px;}
  .cbox{margin-top:18px;background:#0b0e14;border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-size:12px;color:#b7c3d6;font-family:ui-monospace,Menlo,monospace;word-break:break-all;line-height:1.5;}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;}
  .actions button{cursor:pointer;border-radius:9px;padding:11px 16px;font-size:13.5px;font-weight:600;border:1px solid var(--border);background:#161c26;color:var(--text);transition:all .15s;}
  .actions button:hover{transform:translateY(-1px);}
  #c_publish{background:linear-gradient(90deg,#e5c07b,#e0a060);color:#0a0c10;border:none;}
  #c_copy{background:linear-gradient(90deg,#7aa2f7,#bb9af7);color:#0a0c10;border:none;}
`;

function renderCustomize(DATA) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Customize · shayan-cc-config</title>${FAVICON}<style>${CSS}${CUSTOMIZE_CSS}</style></head><body>
<div class="top"><a class="brand" href="/" style="text-decoration:none">← shayan-cc-config</a><span class="spacer"></span>
<a class="iconbtn" href="/">Home</a>
<a class="iconbtn" href="${GITHUB_URL}" target="_blank" rel="noreferrer">${GH_SVG}GitHub</a></div>
<header style="padding-bottom:0"><h1 style="font-size:34px">🎨 Customize your look</h1>
<p class="sub">Tweak colors, thinking verbs, spinner and status line. The preview updates live. When you love it, copy the install command, publish it to your homepage, or share a link.</p></header>
<div class="wrap">
  <div class="panel"><div id="controls"></div>
    <div class="actions">
      <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
      <button id="c_share">🔗 Share link</button>
      <button id="c_publish">⭐ Publish to homepage</button>
    </div>
  </div>
  <div class="stickyprev">
    <div class="prevlabel">Live preview</div>
    <div id="preview"></div>
    <div class="cbox" id="ccmd"></div>
    <div class="actions"><button id="c_copy">Copy install command</button></div>
  </div>
</div>
<div id="toast"></div>
<script>
${CLIENT_LIB}
var STARTERS=${JSON.stringify(STARTERS)};
${CUSTOMIZE_JS}
</script></body></html>`;
}

module.exports = { renderPage, renderCustomize, GITHUB_URL };
