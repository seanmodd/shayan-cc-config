// The /cmux page — cmux's own looks, layered on top of a Claude Code theme.
//
// The Studio (/customize) answers "what does Claude Code look like". This page
// answers "what does the terminal AROUND Claude Code look like", and the two
// compose: the mock below is a cmux window (sidebar, workspaces, split panes, a
// surface tab bar) with the chosen Claude Code palette rendering inside the panes.
// That is why the colour controls default to "from the Claude Code theme" — the
// point is one coherent setup, not two colour schemes sharing a window.
//
// The window anatomy follows cmux's own vocabulary from https://cmux.com/docs/concepts:
//   Window -> Workspace (sidebar entry) -> Pane (split region) -> Surface (tab) -> Panel
//
// As everywhere else in this repo, the browser JS lives inside a template literal:
// no backticks, no ${...}, and every backslash doubled.

const { TERM_CSS } = require('./_term.js');
const { STARTERS } = require('./_theme.js');
const { STUDIO_CSS } = require('./_customize.js');
const {
  CMUX_DEFAULTS, GHOSTTY_FONTS, APPEARANCES, PLACEMENTS,
  ALIGNMENTS, BRANCH_LAYOUTS, INDICATOR_STYLES,
} = require('./_cmux.js');

const CMUX_CSS = `
  .cwrap{max-width:1440px;margin:0 auto;padding:0 24px 40px;}
  .cmuxpair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
  .cmuxcol{min-width:0;}

  /* The cmux window mock. Every colour here is a CSS custom property so the live
     preview updates by setting variables rather than re-rendering the markup. */
  .cwin{border:1px solid var(--cm-chrome);border-radius:12px;overflow:hidden;
    background:var(--cm-bg);box-shadow:0 18px 40px rgba(0,0,0,.45);}
  .ctitle{display:flex;align-items:center;gap:8px;padding:8px 11px;
    background:var(--cm-titlebar);border-bottom:1px solid var(--cm-chrome);
    font-size:11.5px;color:var(--cm-dim);}
  .ctitle .tdot{width:11px;height:11px;border-radius:50%;flex:none;}
  .ctitle .ttext{margin-left:6px;font-family:ui-monospace,Menlo,monospace;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cbody{display:flex;min-height:0;}

  /* Sidebar: workspaces, each with a colour indicator whose STYLE is configurable. */
  .cside{flex:none;width:132px;padding:8px 6px;border-right:1px solid var(--cm-chrome);
    background:var(--cm-sidebar);position:relative;}
  .cside .sgroup{font-size:9px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--cm-faint);padding:4px 6px 5px;}
  .cws{display:flex;align-items:center;gap:6px;padding:5px 7px;border-radius:6px;
    font-size:var(--cm-sidefont);color:var(--cm-dim);position:relative;margin-bottom:2px;
    border:1px solid transparent;}
  .cws .wname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cws .wmeta{font-size:9.5px;color:var(--cm-faint);margin-left:auto;flex:none;}
  .cws.on{color:var(--cm-text);}
  /* indicatorStyle — the eight ways cmux can mark the selected workspace */
  .cws.on[data-ind="leftRail"]{box-shadow:inset 3px 0 0 var(--cm-sel);background:var(--cm-selwash);}
  .cws.on[data-ind="solidFill"]{background:var(--cm-sel);color:#0b0e14;}
  .cws.on[data-ind="rail"]{box-shadow:inset 0 -2px 0 var(--cm-sel);}
  .cws.on[data-ind="border"]{border-color:var(--cm-sel);}
  .cws.on[data-ind="wash"]{background:var(--cm-selwash);}
  .cws.on[data-ind="lift"]{background:var(--cm-titlebar);box-shadow:0 3px 10px rgba(0,0,0,.5);}
  .cws.on[data-ind="typography"]{font-weight:700;color:var(--cm-sel);}
  .cws.on[data-ind="washRail"]{background:var(--cm-selwash);box-shadow:inset 3px 0 0 var(--cm-sel);}
  .cws.on[data-ind="blueWashColorRail"]{background:rgba(96,140,220,.20);box-shadow:inset 3px 0 0 var(--cm-sel);}

  /* Panes and their surface tab bars. */
  .cpanes{flex:1;display:flex;min-width:0;}
  .cpane{flex:1;min-width:0;display:flex;flex-direction:column;
    border:1px solid var(--cm-pane);}
  .cpane+.cpane{border-left:var(--cm-divider-w) solid var(--cm-divider);}
  .cpane.active{border-color:var(--cm-panehot);}
  .ctabs{display:flex;gap:1px;padding:4px 5px 0;background:var(--cm-titlebar);
    font-size:var(--cm-tabfont);}
  .ctab{padding:3px 8px;border-radius:5px 5px 0 0;color:var(--cm-faint);
    background:transparent;white-space:nowrap;}
  .ctab.on{background:var(--cm-bg);color:var(--cm-text);}
  .cterm{flex:1;padding:7px 9px;font-family:ui-monospace,"SF Mono",Menlo,monospace;
    font-size:var(--cm-font);line-height:1.65;overflow:hidden;position:relative;
    background:var(--cm-bg);}
  .cterm .l{white-space:pre-wrap;word-break:break-word;}
  .cscroll{position:absolute;right:2px;top:8px;bottom:8px;width:4px;border-radius:3px;
    background:var(--cm-chrome);}
  .cterm[data-align="center"]{text-align:left;}
  .cbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .cbadge b{color:var(--text);letter-spacing:.02em;}
  .cbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .cbadge .pill.aft{border-color:var(--accent);color:var(--accent);}
  .chead{padding-bottom:2px;}
  .chead h1{font-size:32px;}

  /* Three columns, not the four that a 300px minimum yields at 1440px: several rows
     here put two controls side by side, and a 340px panel wraps "Selected workspace
     style" onto three lines. Gated on min-width because a 380px track is wider than
     a 320px phone and pushes the whole page into horizontal scroll. */
  @media(min-width:760px){
    #cmuxControls{grid-template-columns:repeat(auto-fit,minmax(380px,1fr));}
  }
  .cpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;}
  .filebox{background:#0b0e14;border:1px solid var(--border);border-radius:10px;
    padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;
    color:#b7c3d6;overflow-x:auto;white-space:pre;line-height:1.6;}
  .filebox .fk{color:var(--accent);}
  .filebox h4{margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--gold);}

  /* Phones — by width OR by height, so a 844x390 landscape phone gets this too.
     The desktop mock is a faithful two-pane window; at 390px that is 110px of
     terminal per pane, which wraps every line to two words and grows the window
     past the bottom of the screen before you reach a single control. So on a phone
     the mock becomes a schematic: the second pane shrinks to a sliver (which is
     still enough to show the divider and the unfocused border, the whole point of
     those two controls), the terminal gets a hard height, and the mock's font
     scales from the slider rather than tracking it 1:1. */
  @media(max-width:700px),(max-height:520px){
    .cwrap{padding:0 12px 40px;}
    .cmuxpair{grid-template-columns:1fr;gap:0;}
    .cmuxpair[data-pane="after"] .cmuxcol-before{display:none;}
    .cmuxpair[data-pane="before"] .cmuxcol-after{display:none;}
    .chead h1{font-size:25px;margin-bottom:2px;}
    .chead .sub{font-size:12.5px;line-height:1.5;}
    .cside{width:96px;padding:6px 4px;}
    .cbadge{font-size:10px;gap:5px;margin-bottom:5px;}
    .cbadge span:last-child{display:none;}
    /* The sliver: enough for the tab and both borders, not enough to compete. */
    .cpanes>.cpane:last-child{flex:0 0 42px;}
    .cpanes>.cpane:last-child .ctab:not(.on){display:none;}
    .cterm{height:min(30dvh,210px);flex:none;
      font-size:calc(var(--cm-font) * 0.66);padding:6px 7px;line-height:1.55;}
    .ctitle{padding:6px 9px;font-size:10.5px;}
    .ctitle .tdot{width:9px;height:9px;}
    .cpanels{grid-template-columns:1fr;}
    .filebox{font-size:10.5px;padding:9px 10px;}
  }
  /* Landscape has width to spare and almost no height. */
  @media(max-height:460px){
    .chead{display:none;}
    .cterm{height:min(34dvh,120px);}
  }
`;

// A short Claude Code transcript for the panes. Kept tiny on purpose: this page is
// about the window around Claude Code, and the Studio is where the transcript itself
// gets designed.
const LINES = [
  ['dim', '❯ '], ['user', 'fix the failing checkout test'],
  ['nl', ''],
  ['accent', '✳ '], ['accent', 'Vibing… '], ['dim', '(esc to interrupt)'],
  ['nl', ''],
  ['green', '● '], ['text', 'Bash'], ['dim', '(npm test -- checkout)'],
  ['nl', ''],
  ['dim', '  └ '], ['green', '12 passing'], ['dim', ' (0.9s)'],
  ['nl', ''],
  ['text', '● Fixed — totals round to '], ['bold', '2 decimals'], ['text', ' ✓'],
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderCmux(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const defaults = JSON.stringify(CMUX_DEFAULTS);
  const opts = JSON.stringify({
    fonts: GHOSTTY_FONTS, appearances: APPEARANCES, placements: PLACEMENTS,
    alignments: ALIGNMENTS, branchLayouts: BRANCH_LAYOUTS, indicators: INDICATOR_STYLES,
  });
  const starters = JSON.stringify(STARTERS);
  const lines = JSON.stringify(LINES);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>cmux · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}${CMUX_CSS}</style></head><body>
<div class="top"><a class="brand" href="/" style="text-decoration:none">← shayan-cc-config</a><span class="spacer"></span>
<a class="iconbtn" href="/customize">🎛 Studio</a>
<a class="iconbtn" href="${ghUrl}" target="_blank" rel="noreferrer">${ghSvg}GitHub</a></div>
<header class="chead"><h1>🪟 cmux</h1>
<p class="sub" style="margin-top:8px">The terminal <b>around</b> Claude Code. cmux is a native macOS terminal built on Ghostty — sidebar workspaces, split panes, surface tabs. Style it here and it layers <b>on top of</b> the Claude Code theme you picked, so the whole window is one setup. One command applies both.</p></header>

<div class="cwrap">
  <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
    <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
    <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
  </div>
  <div class="cmuxpair" data-pane="after" id="pair">
    <div class="cmuxcol cmuxcol-before">
      <div class="cbadge"><span class="pill">before</span><b>Stock cmux</b><span>— every default, straight from the schema</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="cmuxcol cmuxcol-after">
      <div class="cbadge"><span class="pill aft">after</span><b>Your cmux</b><span>— live preview</span></div>
      <div id="winAfter"></div>
    </div>
  </div>

  <div class="panels" id="cmuxControls"></div>

  <div class="cpanels" style="margin-top:16px">
    <div class="filebox" id="fileGhostty"></div>
    <div class="filebox" id="fileJson"></div>
  </div>
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">🔗 Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">writes <span class="mono">~/.config/ghostty/config</span> and <span class="mono">~/.config/cmux/cmux.json</span> — both merged, both backed up first. Reload with <span class="mono">Cmd+Shift+,</span> or <span class="mono">cmux reload-config</span>.</div>
</div>
<div style="height:120px"></div>
<div id="toast"></div>
<script>
var STARTERS=${starters};
var CMUX_DEFAULTS=${defaults};
var CMUX_OPTS=${opts};
var CC_LINES=${lines};
${clientLib}
${CMUX_JS}
</script></body></html>`;
}

const CMUX_JS = `
var ORIGIN=location.origin;
var state=null, ccPayload=null, allowDraft=false, _urlT=null;

function defaultCmux(){var o={};for(var k in CMUX_DEFAULTS){if(ownKey(CMUX_DEFAULTS,k))o[k]=CMUX_DEFAULTS[k];}o.on=true;return o;}
function ownKey(o,k){return typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);}

// The Claude Code half of the payload. Arriving with ?c= (from the Studio's Share or
// its install command) means this page styles cmux around THAT setup; arriving bare
// falls back to the first starter palette so the page still works on its own.
function defaultCC(){
  return {n:'My Setup', s:'blue', p:copyObj(STARTERS['tokyo-night']),
    vf:'{}… ', vv:['Cooking','Vibing'], ph:['·','✶','✳','✶','✻','✽'], rm:true, iv:120,
    ub:'none', uc:'rgb(122,162,247)',
    um:{f:' > {} ', st:[], fg:'', bg:'', px:0, py:0, fit:false},
    sl:{on:true, seg:['model','dir','git','ctx'], sep:' | ', em:true, bar:'blocks', ctxFmt:'pct-of', text:''},
    id:'cmux', author:'you'};
}
function copyObj(o){return JSON.parse(JSON.stringify(o));}
function hx(t){return '#'+t.map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('');}
function toRGBarr(hex){hex=String(hex).replace('#','');return [parseInt(hex.slice(0,2),16)||0,parseInt(hex.slice(2,4),16)||0,parseInt(hex.slice(4,6),16)||0];}

function palHex(t,fb){return (Object.prototype.toString.call(t)==='[object Array]'&&t.length===3)?hx(t.map(function(n){return Math.max(0,Math.min(255,Math.round(n||0)));})):fb;}

// Mirrors resolveCmuxColors() on the server: the preview must show exactly the
// colours the installer writes.
function cmColors(s,pal){
  return {
    divider: s.dividerFromPalette?palHex(pal.subtle,s.dividerColor):s.dividerColor,
    paneBorder: s.paneBorderFromPalette?palHex(pal.subtle,s.paneBorder):s.paneBorder,
    activePaneBorder: s.activePaneBorderFromPalette?palHex(pal.accent,s.activePaneBorder):s.activePaneBorder,
    tint: s.tintFromPalette?palHex(pal.bg,s.tintColor):s.tintColor,
    selection: s.selectionFromPalette?palHex(pal.accent,s.selectionColor):s.selectionColor
  };
}
function mix(hex,over,alpha){
  var a=toRGBarr(hex),b=toRGBarr(over);
  return 'rgb('+a.map(function(v,i){return Math.round(v*(1-alpha)+b[i]*alpha);}).join(',')+')';
}

// ── the window mock ────────────────────────────────────────────────────────────
function winHTML(s,pal,label){
  var c=cmColors(s,pal);
  var pv=mapPreview(expandPalette(sanePal(pal)));
  var isLight=s.appearance==='light';
  var bg=pv.bg, text=pv.text, dim=pv.inactive, faint=pv.inactive;
  var titlebar=mix(bg,isLight?'#ffffff':'#ffffff',isLight?0.55:0.06);
  var sidebar=s.matchTerminalBg?bg:mix(bg,c.tint,Math.max(s.tintOpacity,0.02));
  var chrome=mix(bg,'#ffffff',0.12);
  var vars=[
    '--cm-bg:'+bg,'--cm-text:'+text,'--cm-dim:'+dim,'--cm-faint:'+faint,
    '--cm-titlebar:'+titlebar,'--cm-sidebar:'+sidebar,'--cm-chrome:'+chrome,
    '--cm-pane:'+c.paneBorder,'--cm-panehot:'+c.activePaneBorder,
    '--cm-divider:'+c.divider,'--cm-divider-w:'+(s.minimalMode?'1px':'2px'),
    '--cm-sel:'+c.selection,'--cm-selwash:'+mix(bg,c.selection,0.16),
    '--cm-font:'+s.fontSize+'px','--cm-sidefont:'+s.sidebarFontSize+'px',
    '--cm-tabfont:'+s.tabBarFontSize+'px'
  ].join(';');
  var fam=s.fontFamily?('font-family:'+JSON.stringify(s.fontFamily)+',ui-monospace,Menlo,monospace;'):'';

  var title=s.titleTemplate||'senpex-frontend — cmux';
  var ws=[['dev','2'],['server','1'],['logs','']];
  var side='';
  if(!s.sidebarHideDetails)side+='<div class="sgroup">workspaces</div>';
  ws.forEach(function(w,i){
    var on=i===0;
    side+='<div class="cws'+(on?' on':'')+'" data-ind="'+esc(s.indicatorStyle)+'">'
      +'<span class="wname">'+esc(w[0])+'</span>'
      +((!s.sidebarHideDetails&&w[1])?'<span class="wmeta">'+esc(w[1])+'</span>':'')
      +'</div>';
    if(on&&s.sidebarDescription&&!s.sidebarHideDetails)
      side+='<div class="sgroup" style="padding:0 7px 6px;letter-spacing:0;text-transform:none">'
        +(s.branchLayout==='inline'?'main · ':'main<br>')
        +(s.sidebarPullRequests?'#512':'')+(s.sidebarGitStatus?' ✎':'')+'</div>';
  });

  var body='';
  CC_LINES.forEach(function(pair){
    var kind=pair[0], t=pair[1];
    if(kind==='nl'){body+='</div><div class="l">';return;}
    var col=kind==='user'?text:kind==='accent'?pv.accent:kind==='green'?pv.ok:kind==='dim'?dim:text;
    var w=kind==='bold'?'font-weight:700;':'';
    body+='<span style="color:'+col+';'+w+'">'+esc(t)+'</span>';
  });

  function pane(active,tabs){
    var t='';
    tabs.forEach(function(nm,i){t+='<div class="ctab'+(i===0?' on':'')+'">'+esc(nm)+'</div>';});
    return '<div class="cpane'+(active?' active':'')+'">'
      +(s.minimalMode?'':'<div class="ctabs">'+t+'</div>')
      +'<div class="cterm" data-align="'+esc(s.contentAlignment)+'" style="'+fam+'">'
      +'<div class="l">'+body+'</div>'
      +(s.showScrollBar?'<div class="cscroll"></div>':'')
      +'</div></div>';
  }

  return '<div class="cwin" style="'+vars+'">'
    +'<div class="ctitle">'
    +'<span class="tdot" style="background:#ff5f57"></span>'
    +'<span class="tdot" style="background:#febc2e"></span>'
    +'<span class="tdot" style="background:#28c840"></span>'
    +'<span class="ttext">'+esc(label||title)+'</span></div>'
    +'<div class="cbody">'
    +'<div class="cside">'+side+'</div>'
    +'<div class="cpanes">'+pane(true,['S1','S2'])+pane(false,['S1'])+'</div>'
    +'</div></div>';
}

function drawWindows(){
  var pal=ccPayload.p;
  $('#winBefore').innerHTML=winHTML(defaultCmux(),pal,'senpex-frontend — cmux');
  $('#winAfter').innerHTML=winHTML(state,pal,state.titleTemplate||'senpex-frontend — cmux');
  drawFiles();
  drawCmd();
}

// ── the two files, shown verbatim ──────────────────────────────────────────────
function ghosttyLines(s,pal){
  var c=cmColors(s,pal), out=[];
  if(s.fontFamily)out.push(['font-family',s.fontFamily]);
  out.push(['font-size',String(s.fontSize)]);
  out.push(['sidebar-font-size',String(s.sidebarFontSize)]);
  out.push(['surface-tab-bar-font-size',String(s.tabBarFontSize)]);
  if(s.theme)out.push(['theme',s.theme]);
  out.push(['scrollback-limit',String(s.scrollback)]);
  out.push(['split-divider-color',c.divider]);
  if(s.bgOpacity<1)out.push(['background-opacity',String(s.bgOpacity)]);
  if(s.bgBlur>0)out.push(['background-blur',String(s.bgBlur)]);
  return out;
}
function cmuxJsonObj(s,pal){
  var c=cmColors(s,pal);
  var o={schemaVersion:1,paneBorderColor:c.paneBorder,activePaneBorderColor:c.activePaneBorder,
    app:{appearance:s.appearance,minimalMode:s.minimalMode,newWorkspacePlacement:s.placement},
    terminal:{showScrollBar:s.showScrollBar,copyOnSelect:s.copyOnSelect,scrollSpeed:s.scrollSpeed,sessionContentAlignment:s.contentAlignment},
    sidebar:{hideAllDetails:s.sidebarHideDetails,showWorkspaceDescription:s.sidebarDescription,showPullRequests:s.sidebarPullRequests,watchGitStatus:s.sidebarGitStatus,branchLayout:s.branchLayout},
    sidebarAppearance:{matchTerminalBackground:s.matchTerminalBg,tintColor:c.tint,tintOpacity:s.tintOpacity},
    workspaceColors:{indicatorStyle:s.indicatorStyle,selectionColor:c.selection}};
  if(s.titleTemplate)o.app.windowTitleTemplate=s.titleTemplate;
  return o;
}
function drawFiles(){
  var pal=ccPayload.p;
  var g=ghosttyLines(state,pal).map(function(kv){
    return '<span class="fk">'+esc(kv[0])+'</span> = '+esc(kv[1]);
  }).join('\\n');
  $('#fileGhostty').innerHTML='<h4>~/.config/ghostty/config</h4>'+g;
  $('#fileJson').innerHTML='<h4>~/.config/cmux/cmux.json</h4>'
    +esc(JSON.stringify(cmuxJsonObj(state,pal),null,2));
}

function payload(){
  var pl=copyObj(ccPayload);
  pl.cm=copyObj(state);
  return pl;
}
function drawCmd(){
  var b=b64e(payload());
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/apply.sh?c='+encodeURIComponent(b)+'" | bash';
  clearTimeout(_urlT);
  _urlT=setTimeout(function(){
    try{history.replaceState(null,'','/cmux?c='+encodeURIComponent(b));}catch(e){}
    if(allowDraft){try{localStorage.setItem('scc_cmux',JSON.stringify(state));}catch(e){}}
  },400);
}
function edited(){allowDraft=true;drawWindows();}

// ── controls ───────────────────────────────────────────────────────────────────
var HELP={
 fontFamily:{t:'Terminal font',d:'The typeface every terminal in cmux uses. Written to ~/.config/ghostty/config as font-family, because cmux is built on Ghostty and takes its terminal rendering from Ghostty\\u2019s own config. Leave it as System default to keep whatever you already had.'},
 fontSize:{t:'Font size',d:'Terminal text size in points (Ghostty font-size). Everything inside a pane scales with it; the sidebar and tab bar have their own sizes below.'},
 sidebarFontSize:{t:'Sidebar font size',d:'Size of the workspace names in the left sidebar (Ghostty sidebar-font-size). Independent of the terminal font, so you can keep a big terminal and a compact sidebar.'},
 tabBarFontSize:{t:'Tab bar font size',d:'Size of the surface tabs along the top of each pane (Ghostty surface-tab-bar-font-size). A surface is one tab inside a pane.'},
 theme:{t:'Ghostty theme',d:'An optional named Ghostty theme, e.g. \\u201cOne Dark\\u201d. Leave it BLANK unless you want it: a Ghostty theme sets the terminal\\u2019s own background and foreground, which will fight the Claude Code palette you picked. Blank means the preview you see here is what you get.'},
 scrollback:{t:'Scrollback limit',d:'How many bytes of history each terminal keeps (Ghostty scrollback-limit). cmux\\u2019s own example config uses 50,000,000 \\u2014 generous, because agent sessions are long.'},
 bgOpacity:{t:'Background opacity',d:'Terminal transparency, 1 being opaque (Ghostty background-opacity). Anything below 1 lets your desktop through. Only written when you move it off 1, so it cannot clobber a value you set yourself.'},
 bgBlur:{t:'Background blur',d:'Blurs whatever shows through a transparent background (Ghostty background-blur). Has no effect at full opacity.'},
 appearance:{t:'App appearance',d:'Whether cmux\\u2019s own chrome follows macOS or is pinned to light or dark (cmux.json app.appearance). This is the window furniture, not the terminal colours.'},
 minimalMode:{t:'Minimal mode',d:'Strips cmux down \\u2014 the surface tab bars go away and the pane divider thins. Good if you live in one pane per workspace and want nothing between you and the terminal.'},
 placement:{t:'New workspace position',d:'Where a new workspace lands in the sidebar: at the top, right after the current one, or at the end (cmux.json app.newWorkspacePlacement).'},
 titleTemplate:{t:'Window title',d:'What the macOS window title says (cmux.json app.windowTitleTemplate). Leave blank for cmux\\u2019s default. Only written when you type something.'},
 paneBorder:{t:'Pane border',d:'The outline around every split pane. Defaults to your Claude Code theme\\u2019s subtle colour so the window and the transcript match \\u2014 switch to Custom to pin a colour instead.'},
 activePaneBorder:{t:'Focused pane border',d:'The outline around the pane you are typing in \\u2014 this is how you tell at a glance where your keystrokes are going. Defaults to your Claude Code accent.'},
 divider:{t:'Split divider',d:'The line between two panes (Ghostty split-divider-color). Distinct from the pane border: the divider is the seam, the border traces each pane.'},
 tint:{t:'Sidebar tint',d:'A wash of colour over the sidebar (cmux.json sidebarAppearance). Defaults to your Claude Code background so the sidebar reads as part of the same theme. Note this tints only the sidebar \\u2014 terminal transparency is Background opacity above.'},
 tintOpacity:{t:'Tint strength',d:'How strongly the sidebar tint applies, 0 to 1. cmux\\u2019s default is 0.03 \\u2014 a hint rather than a colour.'},
 matchTerminalBg:{t:'Match terminal background',d:'Makes the sidebar exactly the terminal background instead of a tinted version of it, so the window reads as one surface with no seam.'},
 indicatorStyle:{t:'Selected workspace style',d:'How cmux marks the workspace you are in \\u2014 all nine of its styles are here and the preview shows each one. leftRail is the default: a coloured bar down the left edge.'},
 selectionColor:{t:'Selection colour',d:'The colour that marking uses. Defaults to your Claude Code accent.'},
 showScrollBar:{t:'Show scroll bar',d:'Whether a scroll bar appears inside terminal panes (cmux.json terminal.showScrollBar).'},
 copyOnSelect:{t:'Copy on select',d:'Selecting text copies it straight to the clipboard, no \\u2318C. Off by default, and when off cmux leaves the decision to your Ghostty config.'},
 scrollSpeed:{t:'Scroll speed',d:'Multiplier for mouse and trackpad scrolling in terminals, 0.25 to 3.'},
 contentAlignment:{t:'Session content alignment',d:'Where a session\\u2019s content sits when the pane is wider than the content (cmux.json terminal.sessionContentAlignment).'},
 sidebarHideDetails:{t:'Hide sidebar details',d:'Collapses everything but the workspace names \\u2014 no branch, no PR, no counts. The fastest way to a quiet sidebar.'},
 sidebarDescription:{t:'Show workspace description',d:'Shows the branch and directory line under each workspace name.'},
 sidebarPullRequests:{t:'Show pull requests',d:'Surfaces the PR for a workspace\\u2019s branch in the sidebar, clickable.'},
 sidebarGitStatus:{t:'Watch git status',d:'Watches each workspace\\u2019s repo and marks it when the working tree is dirty. Costs a little battery for a lot of awareness.'},
 branchLayout:{t:'Branch layout',d:'Whether the branch sits on its own line under the workspace name (vertical) or runs inline with it.'}
};
function ihtml(k){return '<button type="button" class="i" data-h="'+k+'" aria-label="Explain this option">i</button>';}

function selHTML(id,list,cur){
  var o='';list.forEach(function(v){
    var lbl=v===''?'System default':v;
    o+='<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(lbl)+'</option>';
  });
  return '<select id="'+id+'">'+o+'</select>';
}
function row(label,key,inner){
  return '<label class="ctl"><span class="cap">'+label+ihtml(key)+'</span>'+inner+'</label>';
}
function chk(label,key,id,on){
  return '<label class="ctl2"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'> '+label+ihtml(key)+'</label>';
}
function colorRow(label,key,modeId,pickId,fromPal,hexVal){
  return '<div class="ctl"><span class="cap">'+label+ihtml(key)+'</span>'
   +'<div class="modrow"><span class="stychips" id="'+modeId+'"></span>'
   +'<input type="color" id="'+pickId+'" value="'+esc(hexVal)+'">'
   +'<span class="hint" id="'+modeId+'h"></span></div></div>';
}

function buildControls(){
  var s=state,O=CMUX_OPTS;
  $('#cmuxControls').innerHTML=
  '<div class="panel"><h3>\\u{1F5A5} Terminal (Ghostty)</h3>'
   +row('Terminal font','fontFamily',selHTML('m_font',O.fonts,s.fontFamily))
   +'<div class="inline2">'
   +row('Font size <span class="hint" id="m_fsl"></span>','fontSize','<input id="m_fs" type="range" min="8" max="32" step="1" value="'+s.fontSize+'">')
   +row('Sidebar font <span class="hint" id="m_sfl"></span>','sidebarFontSize','<input id="m_sf" type="range" min="8" max="24" step="1" value="'+s.sidebarFontSize+'">')
   +'</div>'
   +'<div class="inline2">'
   +row('Tab bar font <span class="hint" id="m_tfl"></span>','tabBarFontSize','<input id="m_tf" type="range" min="8" max="20" step="1" value="'+s.tabBarFontSize+'">')
   +row('Ghostty theme <span class="hint">(optional)</span>','theme','<input id="m_theme" type="text" maxlength="40" placeholder="leave blank" value="'+esc(s.theme)+'">')
   +'</div>'
   +'<div class="inline2">'
   +row('Background opacity <span class="hint" id="m_bol"></span>','bgOpacity','<input id="m_bo" type="range" min="0.3" max="1" step="0.02" value="'+s.bgOpacity+'">')
   +row('Background blur <span class="hint" id="m_bbl"></span>','bgBlur','<input id="m_bb" type="range" min="0" max="64" step="2" value="'+s.bgBlur+'">')
   +'</div>'
   +row('Scrollback limit <span class="hint" id="m_sbl"></span>','scrollback','<input id="m_sb" type="range" min="1000000" max="100000000" step="1000000" value="'+s.scrollback+'">')
  +'</div>'
  +'<div class="panel"><h3>\\u{1F3A8} Window &amp; panes</h3>'
   +'<div class="inline2">'
   +row('App appearance','appearance',selHTML('m_appear',O.appearances,s.appearance))
   +row('New workspace position','placement',selHTML('m_place',O.placements,s.placement))
   +'</div>'
   +row('Window title <span class="hint">(blank = cmux default)</span>','titleTemplate','<input id="m_title" type="text" maxlength="60" value="'+esc(s.titleTemplate)+'">')
   +colorRow('Pane border','paneBorder','m_pbm','m_pb',s.paneBorderFromPalette,s.paneBorder)
   +colorRow('Focused pane border','activePaneBorder','m_apbm','m_apb',s.activePaneBorderFromPalette,s.activePaneBorder)
   +colorRow('Split divider','divider','m_dvm','m_dv',s.dividerFromPalette,s.dividerColor)
   +chk('minimal mode','minimalMode','m_min',s.minimalMode)
  +'</div>'
  +'<div class="panel"><h3>\\u{1F4D1} Sidebar</h3>'
   +colorRow('Sidebar tint','tint','m_tnm','m_tn',s.tintFromPalette,s.tintColor)
   +row('Tint strength <span class="hint" id="m_tol"></span>','tintOpacity','<input id="m_to" type="range" min="0" max="1" step="0.01" value="'+s.tintOpacity+'">')
   +chk('match terminal background','matchTerminalBg','m_mtb',s.matchTerminalBg)
   +'<div class="inline2">'
   +row('Selected workspace style','indicatorStyle',selHTML('m_ind',O.indicators,s.indicatorStyle))
   +row('Branch layout','branchLayout',selHTML('m_bl',O.branchLayouts,s.branchLayout))
   +'</div>'
   +colorRow('Selection colour','selectionColor','m_slm','m_sl',s.selectionFromPalette,s.selectionColor)
   +chk('hide all sidebar details','sidebarHideDetails','m_shd',s.sidebarHideDetails)
   +chk('show workspace description','sidebarDescription','m_sd',s.sidebarDescription)
   +chk('show pull requests','sidebarPullRequests','m_spr',s.sidebarPullRequests)
   +chk('watch git status','sidebarGitStatus','m_sgs',s.sidebarGitStatus)
  +'</div>'
  +'<div class="panel"><h3>\\u2328 Terminal behaviour</h3>'
   +chk('show scroll bar','showScrollBar','m_ssb',s.showScrollBar)
   +chk('copy on select','copyOnSelect','m_cos',s.copyOnSelect)
   +'<div class="inline2">'
   +row('Scroll speed <span class="hint" id="m_ssl"></span>','scrollSpeed','<input id="m_ss" type="range" min="0.25" max="3" step="0.05" value="'+s.scrollSpeed+'">')
   +row('Content alignment','contentAlignment',selHTML('m_align',O.alignments,s.contentAlignment))
   +'</div>'
  +'</div>';

  // -- wiring ---------------------------------------------------------------
  function onSel(id,key){var e=$('#'+id);e.addEventListener('change',function(){state[key]=this.value;edited();});}
  function onChk(id,key){var e=$('#'+id);e.addEventListener('change',function(){state[key]=this.checked;edited();});}
  function onRange(id,key,lblId,fmt){
    var e=$('#'+id), l=lblId?$('#'+lblId):null;
    var show=function(){if(l)l.textContent=fmt(state[key]);};
    show();
    e.addEventListener('input',function(){state[key]=parseFloat(this.value);show();edited();});
  }
  onSel('m_font','fontFamily');onSel('m_theme','theme');
  $('#m_theme').addEventListener('input',function(){state.theme=this.value;edited();});
  onRange('m_fs','fontSize','m_fsl',function(v){return v+'pt';});
  onRange('m_sf','sidebarFontSize','m_sfl',function(v){return v+'pt';});
  onRange('m_tf','tabBarFontSize','m_tfl',function(v){return v+'pt';});
  onRange('m_bo','bgOpacity','m_bol',function(v){return Math.round(v*100)+'%';});
  onRange('m_bb','bgBlur','m_bbl',function(v){return v?v+'px':'off';});
  onRange('m_sb','scrollback','m_sbl',function(v){return Math.round(v/1000000)+'M bytes';});
  onSel('m_appear','appearance');onSel('m_place','placement');
  $('#m_title').addEventListener('input',function(){state.titleTemplate=this.value;edited();});
  onChk('m_min','minimalMode');
  onRange('m_to','tintOpacity','m_tol',function(v){return Math.round(v*100)+'%';});
  onChk('m_mtb','matchTerminalBg');
  onSel('m_ind','indicatorStyle');onSel('m_bl','branchLayout');
  onChk('m_shd','sidebarHideDetails');onChk('m_sd','sidebarDescription');
  onChk('m_spr','sidebarPullRequests');onChk('m_sgs','sidebarGitStatus');
  onChk('m_ssb','showScrollBar');onChk('m_cos','copyOnSelect');
  onRange('m_ss','scrollSpeed','m_ssl',function(v){return v+'x';});
  onSel('m_align','contentAlignment');

  colorMode('m_pbm','m_pb','paneBorderFromPalette','paneBorder','subtle');
  colorMode('m_apbm','m_apb','activePaneBorderFromPalette','activePaneBorder','accent');
  colorMode('m_dvm','m_dv','dividerFromPalette','dividerColor','subtle');
  colorMode('m_tnm','m_tn','tintFromPalette','tintColor','bg');
  colorMode('m_slm','m_sl','selectionFromPalette','selectionColor','accent');
}

// Theme/Custom pair, same idea as the Studio's message colours: the picker always
// shows the colour actually in force, so switching to Custom never jumps.
function colorMode(hostId,pickId,flagKey,valKey,palKey){
  var host=$('#'+hostId), pick=$('#'+pickId), hint=$('#'+hostId+'h');
  function themeHex(){return palHex(ccPayload.p[palKey],state[valKey]);}
  function chip(label,on,cb){
    var el=document.createElement('span');
    el.className='stychip'+(on?' on':'');el.textContent=label;
    el.addEventListener('click',function(){if(!el.classList.contains('on'))cb();});
    return el;
  }
  function sync(){
    var fromPal=!!state[flagKey];
    host.innerHTML='';
    host.appendChild(chip('Theme',fromPal,function(){state[flagKey]=true;sync();edited();}));
    host.appendChild(chip('Custom',!fromPal,function(){state[flagKey]=false;state[valKey]=pick.value;sync();edited();}));
    pick.value=fromPal?themeHex():state[valKey];
    hint.textContent=fromPal?'from the Claude Code theme':'custom';
  }
  pick.addEventListener('input',function(){state[valKey]=this.value;state[flagKey]=false;sync();edited();});
  sync();
  return sync;
}

// ── tooltips (same behaviour as the Studio) ───────────────────────────────────
var _tip=null,_tipBtn=null,_tipPinned=false;
function tipNode(){
  if(!_tip){_tip=document.createElement('div');_tip.className='tip';_tip.setAttribute('role','tooltip');
    _tip.appendChild(document.createElement('b'));_tip.appendChild(document.createElement('span'));
    _tip.style.display='none';document.body.appendChild(_tip);}
  return _tip;
}
function hideTip(){if(_tip)_tip.style.display='none';if(_tipBtn)_tipBtn.classList.remove('on');_tipBtn=null;_tipPinned=false;}
function showTip(btn){
  var k=btn.getAttribute('data-h');if(!ownKey(HELP,k))return;
  var h=HELP[k],t=tipNode();
  t.firstChild.textContent=h.t;t.lastChild.textContent=h.d;
  t.style.display='block';t.style.left='0px';t.style.top='0px';
  if(_tipBtn)_tipBtn.classList.remove('on');
  _tipBtn=btn;btn.classList.add('on');
  var r=btn.getBoundingClientRect(),w=t.offsetWidth,hh=t.offsetHeight;
  var vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight;
  var left=r.left+window.pageXOffset-8, maxL=window.pageXOffset+vw-w-12;
  if(left>maxL)left=maxL;
  if(left<window.pageXOffset+12)left=window.pageXOffset+12;
  var bar=document.querySelector('.barbot');
  var floor=vh-(bar?bar.offsetHeight+8:8);
  var below=r.bottom+7,above=r.top-7-hh,top;
  if(below+hh<=floor)top=below;else if(above>=4)top=above;else top=Math.max(4,Math.min(floor-hh,below));
  t.style.left=left+'px';t.style.top=(top+window.pageYOffset)+'px';
}
document.addEventListener('mouseover',function(e){var b=e.target&&e.target.closest?e.target.closest('.i'):null;if(b&&!_tipPinned)showTip(b);});
document.addEventListener('mouseout',function(e){var b=e.target&&e.target.closest?e.target.closest('.i'):null;if(b&&!_tipPinned&&b===_tipBtn)hideTip();});
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b){e.preventDefault();e.stopPropagation();
    if(_tipPinned&&b===_tipBtn){hideTip();return;}
    showTip(b);_tipPinned=true;return;}
  if(_tipPinned&&(!_tip||!_tip.contains(e.target)))hideTip();
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideTip();});
window.addEventListener('scroll',function(){if(_tipBtn)hideTip();},true);

// ── before/after switch ───────────────────────────────────────────────────────
(function(){
  var sw=$('[data-pane-toggle]');if(!sw)return;
  var pair=$('#pair');
  sw.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('.pswbtn'):null;if(!b)return;
    var want=b.getAttribute('data-pane');
    pair.setAttribute('data-pane',want);
    Array.prototype.forEach.call(sw.querySelectorAll('.pswbtn'),function(x){
      var on=x.getAttribute('data-pane')===want;
      x.classList.toggle('on',on);x.setAttribute('aria-selected',on?'true':'false');
    });
  });
})();

// ── boot ──────────────────────────────────────────────────────────────────────
(function(){
  ccPayload=defaultCC();
  state=defaultCmux();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'){
        // The Claude Code half comes straight from the link so this page styles cmux
        // around the setup the user actually built.
        if(pl.p&&typeof pl.p==='object')ccPayload=pl;
        if(pl.cm&&typeof pl.cm==='object'){
          var d=defaultCmux();
          for(var k in d){if(ownKey(d,k)&&ownKey(pl.cm,k))d[k]=pl.cm[k];}
          d.on=true;state=d;
        }
      }
    }else{
      var draft=localStorage.getItem('scc_cmux');
      if(draft){var o=JSON.parse(draft),dd=defaultCmux();
        for(var k2 in dd){if(ownKey(dd,k2)&&ownKey(o,k2))dd[k2]=o[k2];}
        dd.on=true;state=dd;}
    }
  }catch(e){ccPayload=defaultCC();state=defaultCmux();}
})();
buildControls();
drawWindows();

$('#c_copy').addEventListener('click',function(){
  copyText($('#cmdtext').textContent);
  toast('Install command copied — paste it in a terminal');
});
$('#c_share').addEventListener('click',function(){
  copyText(ORIGIN+'/cmux?c='+encodeURIComponent(b64e(payload())));
  toast('Share link copied');
});
$('#c_reset').addEventListener('click',function(){
  state=defaultCmux();allowDraft=false;
  try{localStorage.removeItem('scc_cmux');}catch(e){}
  buildControls();drawWindows();
  clearTimeout(_urlT);history.replaceState(null,'','/cmux');
  toast('Back to stock cmux');
});
installMobileNav();
`;

module.exports = { renderCmux, CMUX_CSS };
