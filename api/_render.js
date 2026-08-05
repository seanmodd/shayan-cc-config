// shayan-cc-config renderer: homepage (favorites, GitHub logo, customize CTA,
// published/shared custom setups). The customizer studio lives in _customize.js.
const { EXPAND_SRC } = require('./_theme.js');
const { previewColors } = require('./_term.js');

const GITHUB_URL = 'https://github.com/seanmodd/shayan-cc-config';

const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230a0c10'/><rect x='4' y='4' width='24' height='24' rx='5' fill='none' stroke='%237aa2f7' stroke-width='1.4'/><text x='7' y='22' font-family='monospace' font-size='15' fill='%23bb9af7'>&gt;_</text></svg>">`;

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
  .top{max-width:1440px;margin:0 auto;padding:20px 24px 0;display:flex;align-items:center;gap:14px;}
  .top .brand{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:15px;color:var(--dim);}
  .top .spacer{flex:1;}
  .iconbtn{display:inline-flex;align-items:center;gap:7px;color:var(--dim);text-decoration:none;border:1px solid var(--border);border-radius:9px;padding:7px 12px;font-size:13px;transition:all .15s;}
  .iconbtn:hover{border-color:var(--accent);color:var(--text);transform:translateY(-1px);}
  .iconbtn svg{width:17px;height:17px;fill:currentColor;}
  header{max-width:1200px;margin:0 auto;padding:26px 24px 6px;text-align:center;}
  h1{font-size:44px;letter-spacing:-1px;font-family:ui-monospace,"SF Mono",Menlo,monospace;background:linear-gradient(90deg,#7aa2f7,#bb9af7,#f5c2e7,#94e2d5);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .sub{color:var(--dim);margin:12px auto 0;font-size:15px;max-width:760px;line-height:1.55;}
  .sub b{color:var(--text);}
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
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function okColor(s){return (typeof s==='string'&&/^rgb\\(\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}\\)$/.test(s))?s.replace(/\\s+/g,''):null;}
function b64e(o){var s=btoa(unescape(encodeURIComponent(JSON.stringify(o))));return s.replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}
function b64d(s){s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))));}
function termBg(c){var m=/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(c.inverseText||'');if(m){var r=+m[1],g=+m[2],b=+m[3];if(0.299*r+0.587*g+0.114*b<150)return 'rgb('+r+','+g+','+b+')';}return '#12141a';}
// The 14 palette keys, clamped to integer RGB triples. Palettes arrive from share
// links, and expandPalette builds colors by string concatenation — so an unclamped
// component would land verbatim inside a style="…" attribute. Mirrors sanePalette().
var PAL_FALLBACK={bg:[26,27,38],raised:[41,46,66],text:[192,202,245],comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]};
function sanePal(p){
  var src=(p&&typeof p==='object')?p:{},out={};
  for(var k in PAL_FALLBACK){
    if(!Object.prototype.hasOwnProperty.call(PAL_FALLBACK,k))continue;
    var v=src[k],ok=Object.prototype.toString.call(v)==='[object Array]'&&v.length===3;
    if(ok)for(var i=0;i<3;i++)if(typeof v[i]!=='number'||!isFinite(v[i]))ok=false;
    out[k]=ok?[Math.max(0,Math.min(255,Math.round(v[0]))),Math.max(0,Math.min(255,Math.round(v[1]))),Math.max(0,Math.min(255,Math.round(v[2])))]:PAL_FALLBACK[k].slice();
  }
  return out;
}
// Every value here is interpolated into a style attribute, so each one must be a
// literal rgb() string or it is replaced by the theme-neutral fallback.
function mapPreview(c){
  var F={bg:'#12141a',text:'rgb(220,227,238)',accent:'rgb(122,162,247)',dim:'rgb(120,130,150)',bgish:'rgb(30,32,42)'};
  var C=function(v,fb){return okColor(v)||fb;};
  return {bg:C(termBg(c),F.bg),text:C(c.text,F.text),accent:C(c.claude,F.accent),shimmer:C(c.claudeShimmer,F.accent),
    success:C(c.success,F.text),error:C(c.error,F.text),warning:C(c.warning,F.text),permission:C(c.permission,F.text),
    inactive:C(c.inactive,F.dim),subtle:C(c.subtle,F.bgish),planMode:C(c.planMode,F.accent),ide:C(c.ide,F.accent),
    remember:C(c.remember,F.text),userMsgBg:C(c.userMessageBackground,F.bgish),promptBorder:C(c.promptBorder,F.dim),
    diffAdded:C(c.diffAdded,F.bgish),diffRemoved:C(c.diffRemoved,F.bgish),
    diffAddedWord:C(c.diffAddedWord,F.text),diffRemovedWord:C(c.diffRemovedWord,F.text)};
}
function spinnerSeq(p){var ph=p.phases;return (p.reverseMirror&&ph.length>2)?ph.concat(ph.slice(1,-1).reverse()):ph;}
// Exact mirrors of the server sanitizers in _term.js. The preview is only honest if
// it applies the same truncation and stripping the installer will apply, so these
// must stay in lockstep with cleanTerm/cleanText/cleanName/cleanFormat.
var C_CTRL=/[\\x00-\\x1f\\x7f-\\x9f\\u200b-\\u200f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069]/g;
function cTerm(s,max){return String(s==null?'':s).replace(C_CTRL,'').slice(0,max);}
function cText(s,max){return String(s==null?'':s).replace(C_CTRL,'').replace(/['"\\\\\`$]/g,'').slice(0,max);}
function cName(s,max){
  var out;
  try{out=String(s==null?'':s).replace(/[^\\p{L}\\p{N}\\p{Emoji_Presentation} ._,:!?+()#@\\u00d7\\u2013\\u2014-]/gu,'');}
  catch(e){out=String(s==null?'':s).replace(/[^0-9A-Za-z ._,:!?+()#@-]/g,'');}
  return out.replace(/\\s+/g,' ').slice(0,max).replace(/^\\s+|\\s+$/g,'');
}
// Slice FIRST, then require the placeholder — a "{}" straddling the cut must not
// pass the check and then be truncated away.
function cFmt(s,max,fb){
  if(typeof s!=='string')return fb;
  var out=cTerm(s,max);
  return out.indexOf('{}')>=0?out:fb;
}
// Mirror of clampInt: a value that coerces to a finite number is clamped, anything
// else falls back to the default (so 'abc' and undefined behave identically here
// and server-side, rather than one of them silently becoming 0).
function cClamp(v,lo,hi,dflt){var n=Math.round(Number(v));return isFinite(n)?Math.max(lo,Math.min(hi,n)):dflt;}
function cList(a,maxLen,maxCount){
  if(Object.prototype.toString.call(a)!=='[object Array]')return [];
  var out=[];
  for(var i=0;i<a.length&&out.length<maxCount;i++){var v=cTerm(a[i],maxLen);if(v)out.push(v);}
  return out;
}
function fav_get(){try{return JSON.parse(localStorage.getItem('scc_favs')||'[]');}catch(e){return [];}}
function fav_set(a){try{localStorage.setItem('scc_favs',JSON.stringify(a));}catch(e){}}
function fav_has(id){return fav_get().indexOf(id)>=0;}
function fav_toggle(id){var a=fav_get();var i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);fav_set(a);return i<0;}
function customs_get(){try{return JSON.parse(localStorage.getItem('scc_customs')||'[]');}catch(e){return [];}}
function customs_set(a){try{localStorage.setItem('scc_customs',JSON.stringify(a));}catch(e){}}
function toast(msg){var t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show');},4200);}
function copyText(text){try{navigator.clipboard.writeText(text);}catch(e){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(_){}ta.remove();}}
// Build a normalized card model from a custom payload {n,s,p,vf,vv,ph,rm,ub,uc,...}
function customToModel(pl){
  var full=expandPalette(sanePal(pl.p));
  var arr=function(v,fb){return (Object.prototype.toString.call(v)==='[object Array]'&&v.length)?v.map(function(x){return String(x).slice(0,32);}):fb;};
  return {id:'custom:'+String(pl.id||'').slice(0,24),name:String(pl.n||'Custom').slice(0,60),author:String(pl.author||'you').slice(0,40),tagline:String(pl.tagline||'Your custom setup.').slice(0,80),statuslineColor:String(pl.s||'blue').slice(0,12),verbs:arr(pl.vv,['Working']).slice(0,12),verbFormat:String(pl.vf||'{}\\u2026 ').slice(0,24),phases:arr(pl.ph,['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d']).slice(0,24),reverseMirror:pl.rm!==false,interval:110,umd:{borderStyle:String(pl.ub||'none'),borderColor:okColor(pl.uc)||'rgb(122,162,247)'},colors:mapPreview(full),custom:true,payload:pl};
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
  var extra=m.custom
    ?'<button class="ghost" data-act="edit" title="Open in the studio">Edit</button><button class="ghost" data-act="del">Delete</button>'
    :'<button class="ghost" data-act="remix" title="Open in the studio, seeded with this setup">Customize</button>';
  el.innerHTML=star+
    '<div class="term" style="background:'+c.bg+'">'+
      '<div class="tbar" style="color:'+c.text+'"><div class="dots"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span></div><span class="tname">'+esc(m.name)+'</span><span class="tauthor">by '+esc(m.author)+'</span></div>'+
      '<div class="tbody">'+
        '<div class="row">'+userMsg+'</div>'+
        '<div class="row"><span class="spin" style="color:'+c.accent+'">'+esc(m.phases[0])+'</span> <span class="verb" style="color:'+c.accent+'"></span><span style="color:'+c.inactive+'">(esc to interrupt)</span></div>'+
        '<div class="row"><span style="color:'+c.success+'">\\u23fa</span> <span style="color:'+c.text+'">Update(src/auth.ts)</span></div>'+
        '<div class="row" style="color:'+c.inactive+'">  \\u23bf  Updated 2 lines</div>'+
        '<div class="row" style="background:'+c.diffAdded+'"><span style="color:'+c.diffAddedWord+'">+ if (session.valid) return next()</span></div>'+
        '<div class="row" style="background:'+c.diffRemoved+'"><span style="color:'+c.diffRemovedWord+'">- return res.redirect("/login")</span></div>'+
      '</div>'+
      '<div class="statusline" style="color:'+c.inactive+'"><span style="color:'+c.accent+'">claude-fable-5</span> | \\ud83d\\udcc1senpex-frontend | \\ud83d\\udd00main | <span style="color:'+c.accent+'">\\u25ae\\u25ae\\u25ae\\u25ae</span><span style="color:'+c.subtle+'">\\u25af\\u25af\\u25af\\u25af\\u25af\\u25af</span> 42%</div>'+
    '</div>'+
    '<div class="meta"><span class="tagline">'+esc(m.tagline)+'</span><span class="chip">status line: '+esc(m.statuslineColor)+'</span></div>'+
    '<div class="verbsline">'+esc(m.verbs.slice(0,6).join(' \\u00b7 '))+' \\u2026</div>'+
    '<div class="cardbtns"><button class="pick">Use this setup</button>'+extra+'</div>';
  var seq=spinnerSeq(m),si=0,vi=0,spinEl=$('.spin',el),verbEl=$('.verb',el);
  var fmt=function(v){return (m.verbFormat||'{}\\u2026 ').replace('{}',v);};
  verbEl.textContent=fmt(m.verbs[0]||'Working');
  // Handles are kept so render() can clear them — otherwise every star toggle or
  // delete leaves two live timers per card writing to detached nodes forever.
  el._t1=setInterval(function(){si=(si+1)%seq.length;spinEl.textContent=seq[si];},m.interval);
  el._t2=setInterval(function(){vi=(vi+1)%Math.max(1,m.verbs.length);verbEl.textContent=fmt(m.verbs[vi]||'Working');},2600);
  $('.star',el).addEventListener('click',function(e){e.stopPropagation();var on=fav_toggle(m.id);this.classList.toggle('on',on);this.textContent=on?'\\u2605':'\\u2606';render();});
  $('.pick',el).addEventListener('click',function(){selectedId=m.id;paintSel();copyText(cmdFor(m));toast('\\u201c'+m.name+'\\u201d command copied \\u2014 paste it in any terminal');var b=$('#applybar');b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse');b.scrollIntoView({behavior:'smooth',block:'nearest'});});
  Array.prototype.forEach.call(el.querySelectorAll('[data-act]'),function(act){
    act.addEventListener('click',function(){
      var a=this.getAttribute('data-act');
      if(a==='del'){var cs=customs_get().filter(function(x){return x.id!==m.payload.id;});customs_set(cs);toast('Deleted \\u201c'+m.name+'\\u201d');render();}
      else if(a==='edit'){location.href='/customize?c='+encodeURIComponent(b64e(m.payload));}
      else if(a==='remix'){location.href='/customize?from='+encodeURIComponent(m.id);}
    });
  });
  return el;
}
function models(){
  var out=PRESETS.slice();
  customs_get().forEach(function(pl){try{out.push(customToModel(pl));}catch(e){}});
  return out;
}
function render(){
  var favs=fav_get();var all=models();
  var favModels=all.filter(function(m){return favs.indexOf(m.id)>=0;});
  var rest=all.filter(function(m){return favs.indexOf(m.id)<0;});
  var grid=$('#grid');
  Array.prototype.forEach.call(grid.querySelectorAll('.card'),function(el){if(el._t1)clearInterval(el._t1);if(el._t2)clearInterval(el._t2);});
  grid.innerHTML='';
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
  $('#selbadge').innerHTML=m?('Selected: <b>'+esc(m.name)+'</b> \\u2014 run the command \\u2192'):'No setup selected yet';
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
<a class="iconbtn" href="/customize">🎛 Open the studio</a>
<a class="iconbtn" href="${GITHUB_URL}" target="_blank" rel="noreferrer">${GH_SVG}GitHub</a></div>
<header><h1>shayan-cc-config</h1>
<p class="sub">Pick a Claude Code look for your cmux terminals. Click a card — its one-line install command copies itself; run it and <span class="mono">tweakcc</span> applies the theme, thinking verbs, spinner and status-line accent together. Or open <b>the studio</b>: interactive before/after terminals, your-message styling, and a build-your-own status line.</p>
<div><a class="cta" href="/customize">🎛 Customize everything — before / after studio →</a></div>
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

module.exports = { renderPage, CLIENT_LIB, CSS, FAVICON, GH_SVG, GITHUB_URL };
