// shayan-cc-config renderer: homepage (favorites, GitHub logo, customize CTA,
// published/shared custom setups). The customizer studio lives in _customize.js.
const { EXPAND_SRC } = require('./_theme.js');
const { previewColors } = require('./_term.js');

// _nav.js owns the page list and the repo URL; re-exported here so the existing
// importers (index.js and the two page modules) keep one place to get chrome from.
const { GITHUB_URL, topBar, navPayload } = require('./_nav.js');

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
  .sectlabel{max-width:1200px;margin:30px auto 0;padding:0 24px;font-size:13px;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:8px;}
  /* ── Favorites ──────────────────────────────────────────────────────────────
     The starred subset of the gallery, folded and remembered. */
  /* Tight under #favlabel, which is this region's heading rather than a separate band. */
  .favwrap{max-width:1200px;margin:12px auto 0;padding:0 24px;display:flex;flex-direction:column;gap:10px;}
  .favsec{background:var(--panel);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
  .favsec>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);}
  .favsec>summary::-webkit-details-marker{display:none;}
  /* The twisty is drawn here rather than left to the browser, so it points the same
     way everywhere and can sit to the left of the label. */
  .favsec>summary::before{content:'\\25B8';font-size:11px;color:var(--dim);display:inline-block;transition:transform .15s;}
  .favsec[open]>summary::before{transform:rotate(90deg);}
  .favsec>summary:hover{background:#11161f;}
  .favn{background:#0b0e14;border:1px solid var(--border);border-radius:20px;padding:1px 8px;font-size:11px;color:var(--dim);letter-spacing:.04em;}
  .favsub{margin-left:auto;text-transform:none;letter-spacing:0;font-size:11.5px;color:var(--faint);}
  .favbody{padding:0 16px 15px;}
  .favbody.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:22px;}
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

  /* ── Phones ─────────────────────────────────────────────────────────────────
     The homepage had no media queries at all, so a 44px display title wrapped
     onto two lines, the intro ran to nine, and reaching the first setup card
     took most of a screen. Nothing here changes the desktop layout. */
  @media(max-width:700px){
    .top{padding:14px 14px 0;gap:9px;flex-wrap:nowrap;}
    .brand{font-size:14px;white-space:nowrap;}
    .iconbtn{padding:9px 11px;font-size:12.5px;min-height:42px;white-space:nowrap;}
    header{padding:16px 14px 4px;}
    h1{font-size:30px;letter-spacing:-.5px;}
    .sub{font-size:12px;line-height:1.55;margin-top:9px;}
    /* The favourite star is absolutely positioned in the corner; without this the
       author name slides underneath it. */
    .tauthor{padding-right:20px;}
    /* #grid, not .grid: the gallery is <main id="grid">, so a .grid rule here was
       dead CSS that merely looked like a fix.
       minmax(0,1fr) and not 1fr: a bare 1fr track has an auto minimum, so it grows
       to the card's min-content width — the terminal previews inside contain long
       unbreakable lines, and the grid blew out to 625px on a 390px screen. */
    #grid{grid-template-columns:minmax(0,1fr)!important;gap:12px;}
    #grid>*{min-width:0;}
    /* #favlabel is the only .sectlabel, and it heads .favwrap — so the two have to
       keep the same gutter on a phone or the heading sits proud of its own region. */
    .sectlabel{padding:0 12px;margin-top:22px;}
    .favwrap{padding:0 12px;}
    /* The description drops to its own line rather than squeezing the count off the
       right edge. */
    .favsub{margin-left:0;flex-basis:100%;}
    .favbody.cards{grid-template-columns:minmax(0,1fr);gap:12px;}
    .favbody.cards>*{min-width:0;}
    .card{padding:12px;}
    footer{padding:8px 16px 40px;font-size:12px;}
    /* Wide, unbreakable install commands must scroll in their own box, never the
       page. (.cmdbox does not exist — the box is .cmd.) */
    .cmd{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  }

  /* ── The navigator ──────────────────────────────────────────────────────────
     One panel with two presentations: a dropdown under the top bar on a wide
     screen, a bottom sheet on a phone. Both are built by installNav() from the
     same PAGES list, so they cannot disagree about what the site contains.

     It is no longer phone-only. The bar used to carry a named link per page,
     which stopped fitting once there was more than a gallery and a studio —
     and choosing which two to keep would just move the problem. The bar now
     holds the constant things and the menu holds the pages. */
  .navbtn{cursor:pointer;font-family:inherit;background:#10141b;}
  .navbtn .navbars{font-size:15px;line-height:1;}
  .navbtn[aria-expanded="true"]{border-color:var(--accent);color:var(--accent);}
  .navfab{display:none;}
  .navback{display:none;position:fixed;inset:0;z-index:125;}
  .navback.open{display:block;}
  .navsheet{display:none;position:fixed;z-index:130;top:62px;right:24px;width:330px;
    max-width:calc(100vw - 32px);max-height:calc(100vh - 86px);overflow-y:auto;
    background:#0b0e14;border:1px solid var(--border);border-radius:14px;
    padding:4px 8px 10px;box-shadow:0 22px 50px rgba(0,0,0,.6);}
  .navsheet.open{display:block;}
  /* The sheet's drag grip and explicit Close row are phone affordances; on a
     dropdown, clicking away or pressing Escape is how you close it. */
  .navsheet .grip,.navsheet .closerow{display:none;}
  .navsheet .navhead{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;
    color:var(--faint);padding:11px 10px 4px;}
  .navsheet a,.navsheet button.navitem{display:flex;align-items:center;gap:10px;width:100%;
    min-height:42px;padding:6px 10px;margin:1px 0;border-radius:10px;
    border:1px solid transparent;background:none;color:var(--text);font-family:inherit;
    font-size:13.5px;text-align:left;text-decoration:none;cursor:pointer;}
  .navsheet a:hover,.navsheet button.navitem:hover{background:#141a24;}
  .navsheet a[aria-current="page"]{border-color:var(--accent);color:var(--accent);
    background:rgba(122,162,247,.1);}
  .navsheet .ico{flex:none;width:20px;text-align:center;font-size:14px;}
  .navsheet .navtxt{display:flex;flex-direction:column;gap:1px;min-width:0;}
  .navsheet .sub2{color:var(--faint);font-size:11px;line-height:1.35;}
  @media(max-width:700px),(max-height:520px){
    /* The bar is tight enough on a phone that the word goes and the bars stay. */
    .navbtn .navword{display:none;}
    .navfab{display:flex;position:fixed;right:14px;z-index:120;
      bottom:calc(var(--navbottom,18px) + env(safe-area-inset-bottom,0px));
      width:52px;height:52px;border-radius:50%;align-items:center;justify-content:center;
      border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,#7aa2f7,#bb9af7);
      color:#0b0e14;font-size:21px;line-height:1;cursor:pointer;
      box-shadow:0 10px 26px rgba(0,0,0,.55);padding:0;}
    .navfab:active{transform:scale(.95);}
    .navback{display:block;position:fixed;inset:0;z-index:125;background:rgba(0,0,0,.55);
      opacity:0;pointer-events:none;transition:opacity .2s ease;}
    .navback.open{opacity:1;pointer-events:auto;}
    /* Back to a bottom sheet: every dropdown-specific value above has to be undone
       explicitly, or top/width/border-radius leak in and the sheet floats. */
    .navsheet{display:block;position:fixed;left:0;right:0;bottom:0;top:auto;z-index:130;
      width:auto;max-width:none;border:none;
      background:#0b0e14;border-top:1px solid var(--border);border-radius:16px 16px 0 0;
      padding:6px 10px calc(14px + env(safe-area-inset-bottom,0px));
      max-height:76vh;max-height:76dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;
      transform:translateY(102%);transition:transform .24s ease;
      box-shadow:0 -14px 34px rgba(0,0,0,.6);}
    .navsheet.open{transform:none;}
    .navsheet .grip{display:block;width:38px;height:4px;border-radius:3px;background:#2a3446;margin:8px auto 4px;}
    .navsheet .closerow{display:block;}
    .navsheet .navhead{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;
      color:var(--faint);padding:12px 12px 4px;}
    /* Vertical padding, not a bare min-height: an item now stacks a label over a
       description, and 0 padding clipped the second line. */
    .navsheet a,.navsheet button.navitem{display:flex;align-items:center;gap:11px;width:100%;
      min-height:50px;padding:7px 12px;margin:1px 0;border-radius:11px;border:1px solid transparent;
      background:none;color:var(--text);font-family:inherit;font-size:14.5px;text-align:left;
      text-decoration:none;cursor:pointer;}
    .navsheet .sub2{font-size:11.5px;}
    .navsheet a[aria-current="page"]{border-color:var(--accent);color:var(--accent);
      background:rgba(122,162,247,.1);}
    .navsheet a:active,.navsheet button.navitem:active{background:#141a24;border-color:var(--border);}
    .navsheet .ico{flex:none;width:22px;text-align:center;font-size:15px;}
    .navsheet .sub2{color:var(--faint);font-size:11.5px;}
    .navsheet .closerow{padding:6px 0 2px;}
  }
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

// ── Navigator ───────────────────────────────────────────────────────────────
// One component, injected from here so every page gets the same thing without any
// HTML template knowing about it. Two triggers open the same panel: the Menu button
// in the top bar, and the floating button on a phone. Sections are read from the live
// DOM when it opens, so the Studio's panels are always current even after a preset
// rebuilds them.
//
// The page list comes from NAV, which the server stamps in from _nav.js. It used to be
// hardcoded here AND in each page's top bar, which is two places to forget.
function installNav(){
  if(document.getElementById('navfab'))return;
  var panelHost=document.getElementById('controls')||document.getElementById('cmuxControls');
  var NAVDATA=(typeof NAV!=='undefined'&&NAV)?NAV:{pages:[],current:'',gh:''};

  var fab=document.createElement('button');
  fab.type='button';fab.id='navfab';fab.className='navfab';
  fab.setAttribute('aria-label','Open navigation');
  fab.setAttribute('aria-expanded','false');
  fab.setAttribute('aria-controls','nav');
  fab.textContent='\u2630';

  var back=document.createElement('div');back.className='navback';
  var sheet=document.createElement('nav');sheet.id='nav';sheet.className='navsheet';
  sheet.setAttribute('aria-label','Site navigation');

  function item(tag,icon,label,sub){
    var el=document.createElement(tag);
    if(tag==='button'){el.type='button';el.className='navitem';}
    var i=document.createElement('span');i.className='ico';i.textContent=icon;
    // Label over description in a column, so a 330px dropdown does not have to fit
    // both on one line.
    var col=document.createElement('span');col.className='navtxt';
    var t=document.createElement('span');t.className='navlbl';t.textContent=label;
    col.appendChild(t);
    if(sub){var s2=document.createElement('span');s2.className='sub2';s2.textContent=sub;col.appendChild(s2);}
    el.appendChild(i);el.appendChild(col);
    return el;
  }
  function head(text){var h=document.createElement('div');h.className='navhead';h.textContent=text;return h;}

  function close(){
    sheet.classList.remove('open');back.classList.remove('open');
    fab.setAttribute('aria-expanded','false');
    var tb=document.getElementById('navbtn');
    if(tb)tb.setAttribute('aria-expanded','false');
  }
  function build(){
    sheet.innerHTML='';
    var grip=document.createElement('div');grip.className='grip';sheet.appendChild(grip);

    sheet.appendChild(head('Pages'));
    var here=location.pathname.replace(/\\/$/,'')||'/';
    // Every builder page carries the current setup forward, so whichever one you open
    // next starts layered on what you were just looking at. A page that holds a live
    // payload publishes it on __sccPayloadC; otherwise the address bar is the source.
    // The gallery is excluded: it takes ?shared=, not ?c=.
    var cq=window.__sccPayloadC||new URLSearchParams(location.search).get('c');
    NAVDATA.pages.forEach(function(p){
      var a=item('a',p.icon,p.label,p.sub);
      a.href=p.path+((cq&&p.path!=='/')?('?c='+encodeURIComponent(cq)):'');
      if(here===p.path.replace(/\\/$/,'')||NAVDATA.current===p.id)a.setAttribute('aria-current','page');
      sheet.appendChild(a);
    });

    if(panelHost){
      // Panels are discovered rather than hardcoded: seeding a preset rebuilds
      // them, and a hardcoded list would drift the moment a panel is renamed.
      var panels=panelHost.querySelectorAll('.panel');
      if(panels.length){
        sheet.appendChild(head('Jump to'));
        var top=item('button','\u2191','Top \u2014 before / after terminals');
        top.addEventListener('click',function(){
          close();window.scrollTo({top:0,behavior:'smooth'});
        });
        sheet.appendChild(top);
        Array.prototype.forEach.call(panels,function(pan){
          var h3=pan.querySelector('h3');
          if(!h3)return;
          var label=h3.textContent.replace(/^[^A-Za-z]+/,'').trim()||'Section';
          var b=item('button','\u2022',label);
          b.addEventListener('click',function(){
            close();
            // The sheet animates out; scrolling after it starts avoids a jump.
            setTimeout(function(){
              var y=pan.getBoundingClientRect().top+window.pageYOffset-8;
              window.scrollTo({top:y,behavior:'smooth'});
            },60);
          });
          sheet.appendChild(b);
        });
      }
    }

    sheet.appendChild(head('Elsewhere'));
    var gh=item('a','\u2691','GitHub','source and issues');
    gh.href=NAVDATA.gh||'https://github.com/seanmodd/shayan-cc-config';
    gh.target='_blank';gh.rel='noreferrer';
    sheet.appendChild(gh);

    var row=document.createElement('div');row.className='closerow';
    var c=item('button','\u2715','Close');
    c.addEventListener('click',close);
    row.appendChild(c);sheet.appendChild(row);
  }

  var topBtn=document.getElementById('navbtn');
  function toggle(){
    if(sheet.classList.contains('open')){close();return;}
    build();
    sheet.classList.add('open');back.classList.add('open');
    fab.setAttribute('aria-expanded','true');
    if(topBtn)topBtn.setAttribute('aria-expanded','true');
  }
  fab.addEventListener('click',toggle);
  if(topBtn)topBtn.addEventListener('click',toggle);
  back.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  // A dropdown closes when you click off it. The backdrop covers the page but sits
  // under the top bar, so the Menu button itself is excluded here rather than
  // toggling twice.
  document.addEventListener('click',function(e){
    if(!sheet.classList.contains('open'))return;
    if(sheet.contains(e.target))return;
    if(topBtn&&topBtn.contains(e.target))return;
    if(fab.contains(e.target))return;
    close();
  },true);

  // Sit above the Studio's fixed install bar rather than under it.
  function lift(){
    var bar=document.querySelector('.barbot');
    var h=bar?bar.getBoundingClientRect().height:0;
    document.documentElement.style.setProperty('--navbottom',(h?h+12:18)+'px');
  }
  document.body.appendChild(back);
  document.body.appendChild(sheet);
  document.body.appendChild(fab);
  lift();
  window.addEventListener('resize',lift);
  window.addEventListener('orientationchange',lift);
  // The bar reflows as the install command changes length.
  if(window.ResizeObserver){
    var bar=document.querySelector('.barbot');
    if(bar)new ResizeObserver(lift).observe(bar);
  }
}

// ── the preview dock ──────────────────────────────────────────────────────────
// The Studio and /cmux both hang a live before/after preview above a long column of
// controls, and both need the same two decisions made about it: whether it stays on
// screen while you scroll, and how much of the screen it is allowed to take. That is
// this function, shared, so the two pages cannot drift apart.
//
// Sticky rather than fixed for the pin: sticky keeps the dock in normal flow, so the
// controls below do not jump up by its height the moment you pin it, and it stops
// sticking naturally when you scroll back past it.
//
// The height is published as one custom property, --dock-h, on <html>. Each page
// decides what that property sizes -- the Studio sizes .xterm, /cmux sizes .cterm --
// so one drag reads correctly on two quite different mocks. Until you actually grab
// the handle no property is set at all, which is what lets each page keep its own
// responsive default height at every breakpoint.
function installPreviewDock(o){
  var dock=document.querySelector(o.dock); if(!dock)return;
  var grip=document.querySelector(o.grip);
  var pin=document.querySelector(o.pin);
  var root=document.documentElement;
  var KEY_PIN='scc_'+o.key+'_pin', KEY_H='scc_'+o.key+'_dockh';
  var MIN=120;
  // A dock that may grow to the full viewport leaves nothing to scroll the controls
  // in, which is the one thing the dock exists to help you do.
  function maxH(){return Math.max(MIN+60,Math.round(window.innerHeight*0.72));}
  function store(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function read(k){try{return localStorage.getItem(k);}catch(e){return null;}}

  function setPin(on,save){
    document.body.classList.toggle('pinned',on);
    if(pin){
      pin.classList.toggle('on',on);
      pin.setAttribute('aria-pressed',on?'true':'false');
      var t=pin.querySelector('.ptxt');
      if(t)t.textContent=on?'Preview pinned':'Pin preview';
    }
    if(save)store(KEY_PIN,on?'1':'0');
  }
  if(pin)pin.addEventListener('click',function(){
    setPin(!document.body.classList.contains('pinned'),true);
  });
  var savedPin=read(KEY_PIN);
  setPin(savedPin===null?!!o.pinDefault:savedPin==='1',false);

  // The row holding the Pin button sticks too, directly above the preview — otherwise
  // the control that unpins scrolls away the moment pinning starts mattering, and you
  // have to scroll back to the top to turn it off.
  //
  // Two stacked sticky elements need the lower one offset by the height of the upper
  // one, and that height is not a constant: the row wraps to two full-width buttons on a
  // phone. So it is measured and published as --switch-h for the CSS to offset against.
  var row=document.querySelector('.switchrow');
  if(row){
    var measure2=function(){
      var h=Math.round(row.getBoundingClientRect().height);
      if(h>0)root.style.setProperty('--switch-h',h+'px');
    };
    measure2();
    window.addEventListener('resize',measure2);
    window.addEventListener('orientationchange',measure2);
    if(window.ResizeObserver)new ResizeObserver(measure2).observe(row);
  }

  if(!grip)return;

  // Measuring the live terminal rather than tracking a number in JS means a drag
  // always starts from whatever the stylesheet currently computes, at any breakpoint.
  // The loop skips hidden panes: on a phone the before/after switch display:none-s one
  // whole column, and a hidden element measures zero.
  function measure(){
    var els=document.querySelectorAll(o.term);
    for(var i=0;i<els.length;i++){
      var h=els[i].getBoundingClientRect().height;
      if(h>0)return Math.round(h);
    }
    return 300;
  }
  function setH(px,save){
    var v=Math.max(MIN,Math.min(maxH(),Math.round(px)));
    root.style.setProperty('--dock-h',v+'px');
    document.body.classList.add('docked');
    grip.setAttribute('aria-valuenow',String(v));
    grip.setAttribute('aria-valuemin',String(MIN));
    grip.setAttribute('aria-valuemax',String(maxH()));
    if(save)store(KEY_H,String(v));
    return v;
  }
  function clearH(){
    root.style.removeProperty('--dock-h');
    document.body.classList.remove('docked');
    grip.removeAttribute('aria-valuenow');
    try{localStorage.removeItem(KEY_H);}catch(e){}
  }
  var savedH=parseInt(read(KEY_H)||'',10);
  if(isFinite(savedH)&&savedH>0)setH(savedH,false);

  var startY=0,startH=0,dragging=false;
  grip.addEventListener('pointerdown',function(e){
    dragging=true;startY=e.clientY;startH=measure();
    document.body.classList.add('dockdrag');
    // Capture, so the drag survives the pointer leaving the 20px handle -- which it
    // does immediately, since dragging is the act of moving away from it.
    if(grip.setPointerCapture){try{grip.setPointerCapture(e.pointerId);}catch(err){}}
    e.preventDefault();
  });
  grip.addEventListener('pointermove',function(e){
    if(dragging)setH(startH+(e.clientY-startY),false);
  });
  function stop(){
    if(!dragging)return;
    dragging=false;
    document.body.classList.remove('dockdrag');
    var cur=parseInt(root.style.getPropertyValue('--dock-h'),10);
    if(isFinite(cur))store(KEY_H,String(cur));
  }
  grip.addEventListener('pointerup',stop);
  grip.addEventListener('pointercancel',stop);
  // A drag handle nobody can reach from the keyboard is a control half the people on
  // the page do not have. Arrows nudge it, Home hands the height back to the stylesheet.
  grip.addEventListener('keydown',function(e){
    var k=e.key;
    if(k==='ArrowUp'||k==='ArrowDown'){
      e.preventDefault();
      setH(measure()+(k==='ArrowDown'?1:-1)*(e.shiftKey?48:16),true);
    }else if(k==='Home'){e.preventDefault();clearH();}
  });
  grip.addEventListener('dblclick',function(e){e.preventDefault();clearH();});
  // Rotating a phone can drop the ceiling below the height you dragged to.
  window.addEventListener('resize',function(){
    var cur=parseInt(root.style.getPropertyValue('--dock-h'),10);
    if(isFinite(cur))setH(cur,false);
  });
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
  // Cards animate on intervals and now live in two containers, so tear down by class
  // rather than by container — scoping this to #grid would leak two timers per card
  // into the favorites section on every repaint.
  Array.prototype.forEach.call(document.querySelectorAll('.card'),function(el){if(el._t1)clearInterval(el._t1);if(el._t2)clearInterval(el._t2);});
  var grid=$('#grid');grid.innerHTML='';
  var fg=$('#favccgrid');fg.innerHTML='';
  // Starred setups move into the favorites section rather than being copied there, so
  // the gallery below is what is left to discover.
  favModels.forEach(function(m){fg.appendChild(card(m));});
  rest.forEach(function(m){grid.appendChild(card(m));});
  paintFavWrap();
  paintSel();
}
// The region hides itself when nothing is starred. An empty scaffold with two empty
// sections is a worse first impression than no region at all, and the star on each card
// is where you learn what it is for.
function paintFavWrap(){
  var cc=$('#favccgrid').children.length;
  $('#favccn').textContent=cc;
  $('#favcc').style.display=cc?'':'none';
  $('#favwrap').style.display=cc?'':'none';
  $('#favlabel').style.display=cc?'flex':'none';
}
// Fold state is per-section and remembered: the two lists grow at very different rates,
// and people settle on keeping one open and the other shut.
['favcc'].forEach(function(id){
  var d=$('#'+id), k='scc_fold_'+id, v=null;
  try{v=localStorage.getItem(k);}catch(e){}
  d.open=(v!=='closed');
  d.addEventListener('toggle',function(){
    try{localStorage.setItem(k,d.open?'open':'closed');}catch(e){}
  });
});
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
installNav();
`;

function renderPage(DATA) {
  const presets = DATA.presets.map(p => clientPreset(DATA, p));
  const payload = JSON.stringify(presets).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>shayan-cc-config — Claude Code setup picker</title>${FAVICON}<style>${CSS}</style></head><body>
${topBar('home', GH_SVG)}
<header><h1>shayan-cc-config</h1>
<p class="sub">Pick a Claude Code look for your cmux terminals. Click a card — its one-line install command copies itself; run it and <span class="mono">tweakcc</span> applies the theme, thinking verbs, spinner and status-line accent together. Or open <b>the studio</b>: interactive before/after terminals, your-message styling, and a build-your-own status line.</p>
<div><a class="cta" href="/customize">🎛 Customize everything — before / after studio →</a></div>
<div class="applybar" id="applybar"><div><div class="step" id="steplabel">Step 1 — click a setup (☆ to favorite)</div><div class="selbadge" id="selbadge">No setup selected yet</div></div>
<div class="cmd"><span class="dollar">$</span><span id="cmdtext">pick a setup to get its install command</span></div>
<button class="copy" id="copybtn">Copy</button></div></header>
<div class="sectlabel" id="favlabel" style="display:none">★ Your favorites</div>
<div class="favwrap" id="favwrap" style="display:none">
  <details class="favsec" id="favcc"><summary><span>★ Claude Code</span><span class="favn" id="favccn">0</span><span class="favsub">setups you starred in the gallery</span></summary>
    <div class="favbody cards" id="favccgrid"></div></details>
</div>
<main id="grid"></main>
<footer>Patching by <a href="https://github.com/Piebald-AI/tweakcc" target="_blank" rel="noreferrer">tweakcc</a> · community themes credited on each card · <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">source on GitHub</a> · re-run the command after Claude Code updates<br>built for Sean by Claude ✦ <span class="mono">shayan-cc-config</span></footer>
<div id="toast"></div>
<script>var PRESETS=${payload};
var NAV=${navPayload('home')};
${CLIENT_LIB}
${HOME_JS}
</script></body></html>`;
}

module.exports = { renderPage, CLIENT_LIB, CSS, FAVICON, GH_SVG, GITHUB_URL };
