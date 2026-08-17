// The /codex page.
//
// Codex CLI is the OTHER agent — Claude Code's peer from OpenAI — and it runs in
// whatever terminal you already themed, inheriting those colours. What Codex itself
// draws, and what this page therefore styles, is everything on top: the syntax
// highlighting theme its code blocks use (tui.theme, a .tmTheme name), the status
// line and the terminal title (ordered item lists), the terminal pet, and the small
// behaviour toggles. All nine managed keys were verified against the 0.147.0 binary
// and live config probes — see _codex.js.
//
// The mock leads with what a Codex session actually looks like: the ">_ OpenAI Codex"
// banner, the slash-command greeting, a working spinner, an exec cell, a code block
// painted with the REAL token colours of the selected theme (extracted from the same
// theme files codex embeds — see tools/extract-codex-syntax-themes.js), the composer,
// and the status line. BEFORE is stock codex on a stock dark terminal; AFTER is yours
// on your Claude Code palette.
//
// As everywhere else in this repo, the browser JS lives inside a template literal:
// no backticks, no dollar-brace, and every backslash doubled.

const { STUDIO_CSS } = require('./_customize.js');
const { topBar, navPayload } = require('./_nav.js');
const { compareBlock, COMPARE_CSS } = require('./_compare.js');
const { STARTERS } = require('./_theme.js');
const { RECIPE_CSS, RECIPE_JS } = require('./_recipes.js');
const {
  CODEX_THEMES, CODEX_SYNTAX, STATUS_ITEMS, TITLE_ITEMS, CODEX_PETS,
  PET_ANCHORS, PICKER_VIEWS, CODEX_DEFAULTS,
} = require('./_codex.js');

const CODEX_CSS = `
  .cxwrap{max-width:1360px;margin:0 auto;padding:0 24px 40px;}
  .cxhead{padding-bottom:2px;}
  .cxhead h1{font-size:32px;}

  .cxpair{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
  .cxcol{min-width:0;}
  .cxbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .cxbadge b{color:var(--text);letter-spacing:.02em;}
  .cxbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .cxbadge .pill.aft{border-color:var(--accent);color:var(--accent);}

  /* The terminal window the codex session lives in. Colours are custom properties so
     the preview updates by setting variables rather than re-rendering markup. */
  .cxwin{border:1px solid #3a3f4a;border-radius:11px;overflow:hidden;background:var(--cx-bg);
    box-shadow:0 18px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;
    font-family:ui-monospace,"SF Mono",Menlo,monospace;position:relative;}
  .cxtitle{flex:none;display:flex;align-items:center;gap:6px;padding:7px 10px;
    background:rgba(127,127,127,.09);border-bottom:1px solid rgba(127,127,127,.14);}
  .cxdots{display:flex;gap:5px;flex:none;}
  .cxdots span{width:10px;height:10px;border-radius:50%;}
  .cxdots span:nth-child(1){background:#ff5f57;}
  .cxdots span:nth-child(2){background:#febc2e;}
  .cxdots span:nth-child(3){background:#28c840;}
  .cxtitletext{flex:1;text-align:center;font-size:10.5px;color:var(--cx-dim);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
  .cxterm{flex:1;padding:11px 13px 9px;font-size:11.5px;line-height:1.62;
    color:var(--cx-text);overflow:hidden;display:flex;flex-direction:column;}
  .cxterm > *{flex:none;}
  /* The transcript. Bottom-anchored and the only shrinkable child, so a short pinned
     dock eats lines off the TOP - the composer and the status line, which the controls
     change, are always the visible part. Exactly what a real terminal does. */
  .cxscroll{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;
    flex-direction:column;justify-content:flex-end;}
  .cxscroll > *{flex:none;}
  .cxterm .l{white-space:pre-wrap;word-break:break-word;min-height:1.62em;}
  .cxterm .dim{color:var(--cx-dim);}
  .cxterm .acc{color:var(--cx-accent);}
  .cxbanner{font-weight:700;}
  .cxrow{display:flex;gap:8px;}
  .cxrow .k{color:var(--cx-dim);min-width:92px;display:inline-block;}

  .cxuser{border-left:3px solid var(--cx-accent);padding-left:8px;margin:7px 0;}

  /* The working shimmer — tui.animations. Off, the same line just sits still. */
  .cxwork .sp{display:inline-block;}
  .cxwin.anim .cxwork .shimmer{background:linear-gradient(90deg,var(--cx-dim) 25%,
    var(--cx-text) 50%,var(--cx-dim) 75%);background-size:200% 100%;
    -webkit-background-clip:text;background-clip:text;color:transparent;
    animation:cxshimmer 1.8s linear infinite;}
  @keyframes cxshimmer{0%{background-position:200% 0;}100%{background-position:0 0;}}
  .cxwin.anim .cxwork .sp{animation:cxspin 1s steps(4) infinite;}
  @keyframes cxspin{0%{opacity:1;}50%{opacity:.45;}100%{opacity:1;}}

  /* The code block: codex paints token colours from the syntax theme onto the
     terminal background — there is no block background of its own. */
  .cxcode{margin:5px 0 5px 14px;padding:2px 0;}

  .cxcomposer{margin-top:6px;border:1px solid var(--cx-dim);border-radius:8px;
    padding:5px 10px;display:flex;align-items:center;gap:7px;}
  .cxcomposer .caret{color:var(--cx-accent);}
  .cxcomposer .ph{color:var(--cx-dim);flex:1;}
  .cxhints{display:flex;gap:14px;flex-wrap:wrap;padding:5px 2px 0;font-size:10px;
    color:var(--cx-dim);}
  .cxhints .key{border:1px solid var(--cx-dim);border-radius:4px;padding:0 4px;
    font-size:9px;opacity:.85;}

  .cxstatus{display:flex;gap:12px;flex-wrap:wrap;padding:6px 2px 0;font-size:10.5px;
    color:var(--cx-dim);border-radius:6px;}
  .cxstatus .si{white-space:nowrap;}
  .cxstatus.flash{animation:cxflash 1.1s ease-out 1;}
  @keyframes cxflash{0%{background:rgba(122,162,247,.28);box-shadow:0 0 0 3px rgba(122,162,247,.28);}
    100%{background:transparent;box-shadow:none;}}

  .cxpet{position:absolute;font-size:15px;line-height:1;filter:saturate(.9);
    text-align:right;}
  .cxpet.composer{right:16px;bottom:84px;}
  .cxpet.screen-bottom{right:14px;bottom:10px;}
  .cxpet .petcap{display:block;font-size:7.5px;color:var(--cx-dim);margin-top:2px;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;}

  /* ── the theme picker ─────────────────────────────────────────────────────── */
  .thgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:7px;}
  .thhead{grid-column:1/-1;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--gold);margin:6px 0 -1px;}
  .thchip{display:flex;flex-direction:column;gap:4px;cursor:pointer;text-align:left;
    font-family:inherit;border:1px solid var(--border);background:#10141b;
    border-radius:9px;padding:7px 9px;color:var(--dim);transition:border-color .12s;}
  .thchip:hover{border-color:var(--accent);}
  .thchip.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);color:var(--text);}
  .thname{font-size:11.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;}
  .thsw{display:flex;gap:4px;align-items:center;border-radius:5px;padding:3px 6px;}
  .thsw i{width:9px;height:9px;border-radius:50%;flex:none;}
  .thnote{display:block;margin-top:7px;}

  /* ── the item pickers (status line, terminal title) ───────────────────────── */
  .itgrid{display:flex;flex-wrap:wrap;gap:6px;}
  .itchip{display:inline-flex;align-items:center;gap:6px;cursor:pointer;
    font-family:inherit;font-size:11.5px;border:1px solid var(--border);
    background:#10141b;color:var(--dim);border-radius:20px;padding:5px 11px;min-height:30px;}
  .itchip:hover{border-color:var(--accent);}
  .itchip.on{border-color:var(--accent);color:var(--text);background:rgba(122,162,247,.10);}
  .itchip .ord{display:inline-flex;align-items:center;justify-content:center;
    width:15px;height:15px;border-radius:50%;background:var(--accent);color:#0b0e14;
    font-size:9.5px;font-weight:700;flex:none;}
  .itchip.off .ord{display:none;}

  /* ── the pet picker ───────────────────────────────────────────────────────── */
  .petgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px;}
  .petchip{display:flex;gap:9px;align-items:center;cursor:pointer;text-align:left;
    font-family:inherit;border:1px solid var(--border);background:#10141b;
    border-radius:9px;padding:8px 10px;color:var(--dim);}
  .petchip:hover{border-color:var(--accent);}
  .petchip.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);color:var(--text);}
  .petglyph{font-size:17px;flex:none;}
  .petname{font-size:11.5px;font-weight:600;}
  .petblurb{font-size:10px;color:var(--faint);line-height:1.35;}

  .cxpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;
    align-items:start;}
  @media(min-width:760px){#controls{grid-template-columns:repeat(auto-fit,minmax(370px,1fr));}}

  .cxfiles{background:#0b0e14;border:1px solid var(--border);border-radius:10px;
    padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;
    color:#b7c3d6;overflow-x:auto;white-space:pre;line-height:1.6;}
  .cxfiles .fk{color:var(--accent);}
  .cxfiles h4{margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--gold);}

  .ccpick{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--dim);
    white-space:nowrap;}
  .ccpick select{background:#0b0e14;border:1px solid var(--border);border-radius:8px;
    color:var(--text);font-family:inherit;font-size:12.5px;padding:7px 9px;min-height:38px;}

  body.pinned .cxpair{position:sticky;top:var(--switch-h,46px);z-index:45;background:var(--bg);
    padding-bottom:12px;box-shadow:0 16px 20px -14px rgba(0,0,0,.75);}
  /* Tall enough that the code block, composer and status line — the things the
     controls actually change — stay in view while pinned. */
  body.pinned .cxterm{height:var(--dock-h,min(56dvh,486px));flex:none;overflow:hidden;}
  body.docked .cxterm{height:var(--dock-h);flex:none;overflow:hidden;}

  @media(max-width:700px),(max-height:520px){
    .cxwrap{padding:0 12px 40px;}
    .cxpair{grid-template-columns:1fr;gap:0;}
    .cxpair[data-pane="before"] .cxcol-after{display:none;}
    .cxpair[data-pane="after"] .cxcol-before{display:none;}
    .cxhead h1{font-size:25px;margin-bottom:2px;}
    .cxpanels{grid-template-columns:1fr;}
    .cxbadge span:last-child{display:none;}
    .cxterm{font-size:10.5px;}
    .thgrid{grid-template-columns:repeat(auto-fill,minmax(128px,1fr));}
    .ccpick{flex:1 1 100%;}
    .ccpick select{flex:1;min-height:44px;font-size:16px;}
    /* The greeting is flavour; the composer and status line are what the controls
       change. On a phone the height budget goes to the second. */
    .cxgreet{display:none;}
    body.pinned .cxterm{height:min(46dvh,400px);}
  }
`;

function renderCodex(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const opts = JSON.stringify({
    themes: CODEX_THEMES,
    syntax: CODEX_SYNTAX,
    statusItems: STATUS_ITEMS,
    titleItems: TITLE_ITEMS,
    pets: CODEX_PETS,
    anchors: PET_ANCHORS,
    pickerViews: PICKER_VIEWS,
  });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Codex CLI · shayan-cc-config</title>${favicon}<style>${baseCss}${STUDIO_CSS}${COMPARE_CSS}${RECIPE_CSS}${CODEX_CSS}</style></head><body class="pinned">
${topBar('codex', ghSvg)}
<header class="cxhead"><h1>▸ Codex CLI</h1>
<p class="sub" style="margin-top:8px">The other agent. Codex inherits your terminal's colours — what it draws itself is the
<b>syntax theme</b> its code blocks use, the <b>status line</b>, the <b>terminal title</b>, and (really) a <b>terminal pet</b>.
Every key below was verified against the 0.147.0 binary, and the installer merges into
<span class="mono">~/.codex/config.toml</span> without touching your model, MCP servers or anything else in it.</p></header>

<div class="cxwrap">
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn" aria-pressed="false"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Pin preview</span></button>
    <label class="ccpick"><span>Terminal palette</span><select id="ccTheme"
      title="Preview context only: the colours your terminal gives codex — from one of your saved setups or a starter."></select></label>
  </div>
  <div class="cxpair" data-pane="after" id="pair">
    <div class="cxcol cxcol-before">
      <div class="cxbadge"><span class="pill">before</span><b>Stock Codex</b><span>— on a stock dark terminal</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="cxcol cxcol-after">
      <div class="cxbadge"><span class="pill aft">after</span><b>Your Codex</b><span>— on your terminal palette</span></div>
      <div id="winAfter"></div>
    </div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

  <div class="cxpanels" id="controls"></div>

  <div class="cxpanels" style="margin-top:16px">
    <div class="panel"><h3>\u{1F4C4} ~/.codex/config.toml — the [tui] block</h3>
      <p class="phint">This file also holds your model, MCP servers and plugins, so the installer never
      replaces it: it backs your file up, parses it (and <b>aborts if it doesn't parse</b>), rebuilds
      only the <span class="mono">[tui]</span> table — keeping any [tui] keys this page doesn't manage,
      though comments inside that one table don't survive the rebuild — and validates the result before
      writing a byte. Codex reads it on startup.</p>
      <div class="cxfiles" id="fileToml"></div>
    </div>
    <div class="panel"><h3>\u{1F9EA} How this was verified</h3>
      <p class="phint">Codex has no config schema and no <span class="mono">codex config</span> command, and an
      unknown value can make the config fail to load — so nothing here is guessed. The nine managed keys, every
      enum value, and the stock defaults were read from the serde tables inside the 0.147.0 binary, cross-checked
      against live <span class="mono">config/read</span> probes under a throwaway CODEX_HOME, and against the
      openai/codex source at that exact tag. The 27 theme palettes in the preview were not typed in by hand:
      22 were rendered through <span class="mono">bat</span> (which embeds the identical theme set) and the
      colours parsed off its truecolor output; the other 5 are syntect's built-ins, parsed from the exact
      upstream .tmTheme files syntect pins.</p>
      <p class="phint">Keys whose semantics could not be pinned three ways
      (<span class="mono">notifications</span>, <span class="mono">keymap</span>,
      <span class="mono">raw_output_mode</span>, <span class="mono">resume_cwd</span>) are deliberately not
      managed: a config this page writes must never be the reason codex fails to start.</p>
      <p class="phint"><b>Your prompts can't be recoloured — on purpose.</b> Codex 0.147.0 has no setting for
      the text or background of the messages you send it: no such key exists anywhere in the binary, and no
      theme scope reaches it (the syntax theme paints code blocks only). Codex is a compiled binary, so unlike
      Claude Code there is nothing to patch. If a future release adds a key, this page's verified pipeline
      will pick it up. Until then, the one agent whose prompts you can style — any colours, yellow strip and
      black text included — is Claude Code, in <a href="/customize" style="color:var(--accent)">the Studio</a>
      under <b>Your messages</b>.</p>
    </div>
  </div>

${compareBlock('codex')}
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">\u{1F517} Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">Verified against the Codex CLI 0.147.0 binary and source, not docs ·
  <a href="https://developers.openai.com/codex/cli/" target="_blank" rel="noreferrer">Codex CLI docs</a> ·
  <a href="https://github.com/openai/codex" target="_blank" rel="noreferrer">openai/codex</a></div>
</div>
<div style="height:110px"></div>
<div id="toast"></div>
<script>
var NAV=${navPayload('codex')};
var STARTERS=${JSON.stringify(STARTERS)};
var CX_DEFAULTS=${JSON.stringify(CODEX_DEFAULTS)};
var CX_OPTS=${opts};
${clientLib}
${RECIPE_JS}
${CODEX_JS}
</script></body></html>`;
}

const CODEX_JS = `
var ORIGIN=location.origin;
var state=null, ccPayload=null;

function ownKey(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}
function defaultCodex(){var d=copyObj(CX_DEFAULTS);d.on=true;return d;}
function defaultCC(){
  return {n:'My Setup',s:'blue',p:{bg:[26,27,38],raised:[41,46,66],text:[192,202,245],
    comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],
    cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],
    yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]},
    vf:'{}\\u2026 ',vv:['Cooking','Vibing'],ph:['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],
    rm:true,iv:120,ub:'none',uc:'rgb(122,162,247)',id:'codex',author:'you'};
}

// Client mirror of sanitizeCodex. A ?c= link is a stranger's; everything is enum-or-
// boolean by design, so sanitizing is picking from known lists.
function xPick(v,l,d){return l.indexOf(v)>=0?v:d;}
function xBool(v,d){return typeof v==='boolean'?v:d;}
function xList(v,valid,d){
  if(Object.prototype.toString.call(v)!=='[object Array]')return d.slice();
  var seen=[];
  for(var i=0;i<v.length&&seen.length<10;i++){
    if(valid.indexOf(v[i])>=0&&seen.indexOf(v[i])<0)seen.push(v[i]);
  }
  return seen;
}
var STATUS_IDS=CX_OPTS.statusItems.map(function(i){return i.id;});
var TITLE_IDS=CX_OPTS.titleItems.map(function(i){return i.id;});
var PET_IDS=CX_OPTS.pets.map(function(p){return p.id;});
function saneCodex(o){
  var d=defaultCodex();
  if(!o||typeof o!=='object')return d;
  return {
    theme:o.theme===''?'':xPick(o.theme,CX_OPTS.themes,d.theme),
    statusLine:xList(o.statusLine,STATUS_IDS,d.statusLine),
    slColors:xBool(o.slColors,d.slColors),
    terminalTitle:xList(o.terminalTitle,TITLE_IDS,d.terminalTitle),
    pet:o.pet===''?'':xPick(o.pet,PET_IDS,d.pet),
    petAnchor:xPick(o.petAnchor,CX_OPTS.anchors,d.petAnchor),
    animations:xBool(o.animations,d.animations),
    tooltips:xBool(o.tooltips,d.tooltips),
    pickerView:xPick(o.pickerView,CX_OPTS.pickerViews,d.pickerView),
    on:true
  };
}

// ── colours ───────────────────────────────────────────────────────────────────
function palHex(t,fb){
  if(Object.prototype.toString.call(t)!=='[object Array]'||t.length!==3)return fb;
  return '#'+t.map(function(n){
    n=Math.max(0,Math.min(255,Math.round(n)));
    return (n<16?'0':'')+n.toString(16);
  }).join('');
}
function relLum(hex){
  var h=String(hex).replace('#','');
  var c=[0,2,4].map(function(i){
    var v=(parseInt(h.slice(i,i+2),16)||0)/255;
    return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
  });
  return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
}
// The palette the mock's code block uses. '' = adaptive, which is exactly what codex
// does with the key unset: catppuccin-latte on a light terminal, -mocha on a dark one.
function themePal(s,bgHex){
  if(s.theme&&ownKey(CX_OPTS.syntax,s.theme))return CX_OPTS.syntax[s.theme];
  return relLum(bgHex)>0.4?CX_OPTS.syntax['catppuccin-latte']:CX_OPTS.syntax['catppuccin-mocha'];
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;');}

function itemMeta(id){
  for(var i=0;i<CX_OPTS.titleItems.length;i++)
    if(CX_OPTS.titleItems[i].id===id)return CX_OPTS.titleItems[i];
  return {id:id,label:id,sample:id};
}

// ── the mock ──────────────────────────────────────────────────────────────────
// mode: 'before' = stock defaults on a stock dark terminal; 'after' = your codex on
// your terminal palette.
function winHTML(s,mode){
  var stock=mode==='before';
  var p=stock?null:(ccPayload.p||{});
  var bg=stock?'#1e222a':palHex(p.bg,'#1a1b26');
  var text=stock?'#d5d9e0':palHex(p.text,'#c0caf5');
  var dim=stock?'#767e8c':palHex(p.comment,'#565f89');
  var accent=stock?'#89b4fa':palHex(p.accent,'#7aa2f7');
  var pal=themePal(s,bg);

  var title=s.terminalTitle.map(function(id){return itemMeta(id).sample;}).join(' ');
  if(!s.terminalTitle.length)title='terminal';

  // The status line: with use-colors on, items take token colours from the active
  // theme — that is literally what the setting does ("Apply colors from the active
  // /theme"). Off, everything is the terminal's dim.
  var slCycle=[pal.fn,pal.str,pal.num,pal.kw];
  var slHTML=s.statusLine.map(function(id,ix){
    var col=s.slColors?slCycle[ix%slCycle.length]:dim;
    return '<span class="si" style="color:'+esc(col)+'">'+esc(itemMeta(id).sample)+'</span>';
  }).join('');

  var petHTML='';
  if(s.pet){
    var pet=null;
    for(var i=0;i<CX_OPTS.pets.length;i++)if(CX_OPTS.pets[i].id===s.pet)pet=CX_OPTS.pets[i];
    if(pet)petHTML='<div class="cxpet '+esc(s.petAnchor)+'">'+esc(pet.glyph)
      +'<span class="petcap">'+esc(pet.name)+' \\u00b7 animated for real</span></div>';
  }

  var hints=s.tooltips
    ? '<div class="cxhints"><span><span class="key">\\u23CE</span> to submit message</span>'
      +'<span><span class="key">?</span> for shortcuts</span>'
      +'<span><span class="key">/</span> for commands</span>'
      +'<span><span class="key">@</span> for file paths</span></div>'
    : '';

  // Six code lines, each token painted with the theme's REAL colour for that role.
  var code=''
    +'<div class="l" style="color:'+esc(pal.com)+'">// retry the flaky checkout</div>'
    +'<div class="l"><span style="color:'+esc(pal.kw)+'">function</span> <span style="color:'
      +esc(pal.fn)+'">retryCheckout</span><span style="color:'+esc(pal.fg)+'">(cart) {</span></div>'
    +'<div class="l">  <span style="color:'+esc(pal.kw)+'">const</span> <span style="color:'
      +esc(pal.fg)+'">limit =</span> <span style="color:'+esc(pal.num)+'">3</span><span style="color:'
      +esc(pal.fg)+'">;</span></div>'
    +'<div class="l cxgreet">  <span style="color:'+esc(pal.kw2)+'">if</span> <span style="color:'
      +esc(pal.fg)+'">(!cart.ok) log(</span><span style="color:'+esc(pal.str)
      +'">&quot;retrying\\u2026&quot;</span><span style="color:'+esc(pal.fg)+'">);</span></div>'
    +'<div class="l">  <span style="color:'+esc(pal.kw2)+'">return</span> <span style="color:'
      +esc(pal.fg)+'">attempt(cart, limit);</span></div>'
    +'<div class="l" style="color:'+esc(pal.fg)+'">}</div>';

  return '<div class="cxwin'+(s.animations?' anim':'')+'" style="--cx-bg:'+esc(bg)
    +';--cx-text:'+esc(text)+';--cx-dim:'+esc(dim)+';--cx-accent:'+esc(accent)+'">'
    +'<div class="cxtitle"><div class="cxdots"><span></span><span></span><span></span></div>'
    +'<div class="cxtitletext">'+esc(title)+'</div></div>'
    +'<div class="cxterm">'
    +'<div class="cxscroll">'
    +'<div class="l cxbanner">&gt;_ OpenAI Codex</div>'
    +'<div class="l cxrow"><span class="k">directory:</span><span>~/my-project</span></div>'
    +'<div class="l cxrow"><span class="k">permissions:</span><span>workspace</span>'
      +'<span class="dim">  /permissions to change</span></div>'
    +'<div class="l cxrow"><span class="k">model:</span><span>gpt-5.2-codex</span>'
      +'<span class="dim">  /model to change</span></div>'
    +'<div class="l"></div>'
    +'<div class="l dim cxgreet">To get started, describe a task or try one of these commands:</div>'
    +'<div class="l cxgreet"><span class="acc">/init</span><span class="dim"> - create an AGENTS.md file with instructions for Codex</span></div>'
    +'<div class="l cxgreet"><span class="acc">/status</span><span class="dim"> - show current session configuration</span></div>'
    +'<div class="l cxgreet"></div>'
    +'<div class="l cxuser">fix the failing checkout test</div>'
    +'<div class="l cxwork"><span class="sp acc">\\u2736</span> <span class="shimmer">Working</span>'
      +'<span class="dim"> (3s \\u00b7 Esc to interrupt)</span></div>'
    +'<div class="l dim cxgreet">\\u2022 Started npm test \\u2014 2 passing, 1 failing</div>'
    +'<div class="cxcode">'+code+'</div>'
    +'<div class="l dim cxgreet">\\u2022 Updated 2 file(s) \\u00b7 Worked for 12s</div>'
    +'</div>'
    +'<div class="cxcomposer"><span class="caret">\\u258C</span>'
      +'<span class="ph">Ask Codex to do anything</span></div>'
    +hints
    +(s.statusLine.length?'<div class="cxstatus">'+slHTML+'</div>':'')
    +'</div>'+petHTML+'</div>';
}

function drawWindows(){
  $('#winBefore').innerHTML=winHTML(defaultCodex(),'before');
  $('#winAfter').innerHTML=winHTML(state,'after');
  // A status-line change lands at the bottom of the window while the eye is on the
  // controls - flash the row so the edit visibly arrives.
  var sig=JSON.stringify([state.statusLine,state.slColors]);
  if(drawWindows._sig&&drawWindows._sig!==sig){
    var row=$('#winAfter .cxstatus');
    if(row)row.classList.add('flash');
  }
  drawWindows._sig=sig;
}

// ── controls ──────────────────────────────────────────────────────────────────
var TIPS={
 theme:{t:'Syntax theme',d:'What tui.theme actually is: a syntax-highlighting theme (a .tmTheme name) for the code codex prints \\u2014 NOT a UI colour scheme. The TUI chrome keeps your terminal\\u2019s colours. Left on Adaptive, codex picks catppuccin-latte on a light terminal and catppuccin-mocha on a dark one, at startup, by measuring the background.'},
 statusLine:{t:'Status line',d:'The row under the composer. Pick items in the order you want them \\u2014 the number on each chip is its position. The same thing /statusline configures inside codex; stock is model + effort, then the directory. Empty is allowed and simply hides the line.'},
 slColors:{t:'Status line colours',d:'The picker calls this \\u201cApply colors from the active /theme\\u201d: on, items take token colours from the syntax theme above; off, the whole line renders dim.'},
 terminalTitle:{t:'Terminal title',d:'What codex writes into the terminal tab / window title, from the same item list plus \\u201cactivity\\u201d (the working/attention indicator) and \\u201capp-name\\u201d. Stock is activity + project name. The preview\\u2019s title bar shows the items in your order; codex renders its own separators.'},
 pet:{t:'Terminal pets',d:'Yes, really \\u2014 an animated sprite that lives above the composer. Eight ship with codex 0.147; the picker inside codex is /pets. The preview shows a stand-in glyph: the real one is an animated sprite the terminal draws, which a static mock cannot do honestly.'},
 petAnchor:{t:'Pet position',d:'composer keeps the pet next to the input box; screen-bottom pins it to the bottom of the window.'},
 animations:{t:'Animations',d:'The shimmer on \\u201cWorking\\u2026\\u201d and other small movements. Off, the same text just sits still \\u2014 useful over SSH or for reduced motion.'},
 tooltips:{t:'Tooltips',d:'The contextual hint popups and shortcut reminders (the keycap row under the composer stands in for them here). Turning this off declutters, at the cost of discoverability.'},
 pickerView:{t:'Session picker',d:'How the resume picker (codex resume) lays out rows: dense fits more sessions on screen, comfortable gives each row more air. No visual change in this preview \\u2014 it only shows inside the picker itself.'}
};
function ihtml(k){return TIPS[k]?'<button type="button" class="i" data-tip="'+k+'" aria-label="What is this?">i</button>':'';}

function themeChip(id){
  var pal=CX_OPTS.syntax[id]||{};
  var bg=palHex((ccPayload.p||{}).bg,'#1a1b26');
  var dots=['kw','str','fn','num'].map(function(k){
    return '<i style="background:'+esc(pal[k]||'#888')+'"></i>';
  }).join('');
  return '<button type="button" class="thchip" data-theme="'+esc(id)+'">'
    +'<span class="thname">'+esc(id)+'</span>'
    +'<span class="thsw" style="background:'+esc(bg)+'">'+dots
    +'<span style="color:'+esc(pal.fg||'#aaa')+';font-size:9px;margin-left:2px">text</span></span>'
    +'</button>';
}

function buildControls(){
  var host=$('#controls');
  var s=state;

  var dark=CX_OPTS.themes.filter(function(t){return !(CX_OPTS.syntax[t]||{}).light;});
  var light=CX_OPTS.themes.filter(function(t){return (CX_OPTS.syntax[t]||{}).light;});
  var themeHTML='<div class="thgrid">'
    +'<button type="button" class="thchip" data-theme=""><span class="thname">Adaptive (stock)</span>'
    +'<span class="thsw" style="background:#10141b"><span style="color:var(--dim);font-size:9px">latte on light \\u00b7 mocha on dark</span></span></button>'
    +'<div class="thhead">Dark terminals</div>'+dark.map(themeChip).join('')
    +'<div class="thhead">Light terminals</div>'+light.map(themeChip).join('')
    +'</div><span class="hint thnote" id="thnote"></span>';

  function itemChips(hostId,items){
    return '<div class="itgrid" id="'+hostId+'">'+items.map(function(it){
      return '<button type="button" class="itchip off" data-id="'+esc(it.id)+'" title="'
        +esc(it.sample)+'"><span class="ord"></span>'+esc(it.label)+'</button>';
    }).join('')+'</div>';
  }

  host.innerHTML=''
   +'<div class="panel"><h3>\u{1F3A8} Syntax theme'+ihtml('theme')+'</h3>'
    +'<p class="phint">Colours below are each theme\\u2019s real token colours \\u2014 extracted from the'
    +' theme files codex embeds, shown on your terminal background.</p>'+themeHTML+'</div>'
   +'<div class="panel"><h3>\u{1F4CA} Status line'+ihtml('statusLine')+'</h3>'
    +'<p class="phint">Click to add in order; click again to remove. Hover a chip for its sample.</p>'
    +itemChips('slPick',CX_OPTS.statusItems)
    +'<label class="ctl2" style="margin-top:10px"><input type="checkbox" id="x_slc"'
    +(s.slColors?' checked':'')+'> apply colours from the theme'+ihtml('slColors')+'</label>'
    +'<span class="hint" id="slnote"></span></div>'
   +'<div class="panel"><h3>\u{1FA9F} Terminal title'+ihtml('terminalTitle')+'</h3>'
    +itemChips('ttPick',CX_OPTS.titleItems)+'</div>'
   +'<div class="panel"><h3>\u{1F43E} Terminal pet'+ihtml('pet')+'</h3>'
    +'<div class="petgrid">'
    +'<button type="button" class="petchip" data-pet=""><span class="petglyph">\\u2205</span>'
    +'<span><span class="petname">No pet</span><span class="petblurb" style="display:block">stock \\u2014 nothing drawn</span></span></button>'
    +CX_OPTS.pets.map(function(p){
      return '<button type="button" class="petchip" data-pet="'+esc(p.id)+'">'
        +'<span class="petglyph">'+esc(p.glyph)+'</span><span><span class="petname">'+esc(p.name)
        +'</span><span class="petblurb" style="display:block">'+esc(p.blurb)+'</span></span></button>';
    }).join('')+'</div>'
    +'<label class="ctl" style="margin-top:10px"><span class="cap">Position'+ihtml('petAnchor')+'</span>'
    +'<select id="x_anchor">'+CX_OPTS.anchors.map(function(a){
      return '<option value="'+esc(a)+'"'+(s.petAnchor===a?' selected':'')+'>'+esc(a)+'</option>';
    }).join('')+'</select></label></div>'
   +'<div class="panel"><h3>⚙ Behaviour</h3>'
    +'<label class="ctl2"><input type="checkbox" id="x_anim"'+(s.animations?' checked':'')
    +'> animations (the working shimmer)'+ihtml('animations')+'</label>'
    +'<label class="ctl2"><input type="checkbox" id="x_tips"'+(s.tooltips?' checked':'')
    +'> tooltips &amp; hint popups'+ihtml('tooltips')+'</label>'
    +'<label class="ctl"><span class="cap">Session picker view'
    +'<span class="nov">no visual change</span>'+ihtml('pickerView')+'</span>'
    +'<select id="x_spv">'+CX_OPTS.pickerViews.map(function(v){
      return '<option value="'+esc(v)+'"'+(s.pickerView===v?' selected':'')+'>'+esc(v)+'</option>';
    }).join('')+'</select></label></div>';

  // theme chips
  Array.prototype.forEach.call(host.querySelectorAll('.thchip'),function(ch){
    ch.addEventListener('click',function(){
      state.theme=this.getAttribute('data-theme')||'';
      syncThemeChips();refresh();
    });
  });
  syncThemeChips();

  // ordered item pickers
  wireItemPicker('slPick','statusLine');
  wireItemPicker('ttPick','terminalTitle');
  syncItemPicker('slPick','statusLine');
  syncItemPicker('ttPick','terminalTitle');

  // pets
  Array.prototype.forEach.call(host.querySelectorAll('.petchip'),function(ch){
    ch.addEventListener('click',function(){
      state.pet=this.getAttribute('data-pet')||'';
      syncPetChips();refresh();
    });
  });
  syncPetChips();

  $('#x_anchor').addEventListener('change',function(){state.petAnchor=this.value;refresh();});
  $('#x_slc').addEventListener('change',function(){state.slColors=this.checked;refresh();});
  $('#x_anim').addEventListener('change',function(){state.animations=this.checked;refresh();});
  $('#x_tips').addEventListener('change',function(){state.tooltips=this.checked;refresh();});
  $('#x_spv').addEventListener('change',function(){state.pickerView=this.value;refresh();});
}

function syncThemeChips(){
  Array.prototype.forEach.call(document.querySelectorAll('.thchip'),function(ch){
    ch.classList.toggle('on',(ch.getAttribute('data-theme')||'')===state.theme);
  });
  themeNote();
}
function themeNote(){
  var el=$('#thnote'); if(!el)return;
  if(!state.theme){
    el.className='hint thnote';
    el.textContent='Adaptive: codex measures your terminal background at startup and picks the latte or mocha flavour itself.';
    return;
  }
  var pal=CX_OPTS.syntax[state.theme]||{};
  var bgIsLight=relLum(palHex((ccPayload.p||{}).bg,'#1a1b26'))>0.4;
  if(pal.light&&!bgIsLight){
    el.className='hint thnote warn';
    el.textContent='This theme is built for a LIGHT terminal \\u2014 on your dark background its colours will be hard to read. Codex will still apply it.';
  }else if(!pal.light&&bgIsLight){
    el.className='hint thnote warn';
    el.textContent='This theme is built for a DARK terminal \\u2014 on your light background its colours will be hard to read. Codex will still apply it.';
  }else{
    el.className='hint thnote ok';
    el.textContent='Suits your terminal background. The code block above is using it.';
  }
}
function syncPetChips(){
  Array.prototype.forEach.call(document.querySelectorAll('.petchip'),function(ch){
    ch.classList.toggle('on',(ch.getAttribute('data-pet')||'')===state.pet);
  });
  var an=$('#x_anchor');
  if(an)an.disabled=!state.pet;
}
function wireItemPicker(hostId,key){
  var el=$('#'+hostId); if(!el)return;
  el.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('.itchip'):null; if(!b)return;
    var id=b.getAttribute('data-id');
    var arr=state[key];
    var at=arr.indexOf(id);
    if(at>=0)arr.splice(at,1);
    else if(arr.length<10)arr.push(id);
    else{toast('Ten items is the cap \\u2014 remove one first');return;}
    syncItemPicker(hostId,key);refresh();
  });
}
function syncItemPicker(hostId,key){
  var el=$('#'+hostId); if(!el)return;
  var arr=state[key];
  Array.prototype.forEach.call(el.querySelectorAll('.itchip'),function(ch){
    var at=arr.indexOf(ch.getAttribute('data-id'));
    ch.classList.toggle('on',at>=0);
    ch.classList.toggle('off',at<0);
    ch.querySelector('.ord').textContent=at>=0?String(at+1):'';
  });
  if(hostId==='slPick'){
    var note=$('#slnote');
    if(note)note.textContent=arr.length?'':'Empty \\u2014 the status line is hidden entirely.';
  }
}

// ── payload / refresh ─────────────────────────────────────────────────────────
function payload(){var pl=copyObj(ccPayload);pl.cx=copyObj(state);pl.cx.on=true;return pl;}
function refresh(){
  drawWindows();
  var c=encodeURIComponent(b64e(payload()));
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/apply.sh?c='+c+'" | bash';
  window.__sccPayloadC=c;
  // Server-rendered, so the preview is the installer's own output rather than a second
  // TOML builder that could drift from it. The sequence counter keeps a slow older
  // response from landing on top of a newer one.
  var seq=(refresh._seq=(refresh._seq||0)+1);
  fetch('/codex-files.txt?c='+c).then(function(r){return r.text();}).then(function(t){
    if(seq!==refresh._seq)return;
    var box=$('#fileToml'); if(!box)return;
    box.innerHTML='<h4>[tui] \\u2014 merged into your config.toml</h4>'
      +t.split('\\n').map(function(ln){
        var eq=ln.indexOf(' = ');
        if(eq<0)return esc(ln);
        return '<span class="fk">'+esc(ln.slice(0,eq))+'</span> ='+esc(ln.slice(eq+2));
      }).join('\\n');
  }).catch(function(){});
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/codex?c='+c);}catch(e){}
    try{localStorage.setItem('scc_codex',JSON.stringify(state));}catch(e){}
  },400);
}

(function(){
  ccPayload=defaultCC();state=defaultCodex();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'){
        if(pl.p&&typeof pl.p==='object')ccPayload=pl;
        if(pl.cx&&typeof pl.cx==='object')state=saneCodex(pl.cx);
      }
    }else{
      var draft=localStorage.getItem('scc_codex');
      if(draft)state=saneCodex(JSON.parse(draft));
    }
  }catch(e){ccPayload=defaultCC();state=defaultCodex();}
})();
buildControls();refresh();

$('#c_copy').addEventListener('click',function(){
  copyText($('#cmdtext').textContent);
  this.textContent='Copied \\u2713';var b=this;
  setTimeout(function(){b.textContent='Copy install command';},1600);
});
$('#c_share').addEventListener('click',function(){
  copyText(ORIGIN+'/codex?c='+encodeURIComponent(b64e(payload())));
  toast('Shareable Codex link copied');
});
$('#c_reset').addEventListener('click',function(){
  state=defaultCodex();
  try{localStorage.removeItem('scc_codex');}catch(e){}
  buildControls();refresh();
  clearTimeout(refresh._t);
  history.replaceState(null,'','/codex');
  toast('Reset to stock Codex');
});

var _tip=null,_tipBtn=null;
function hideTip(){if(_tip){_tip.remove();_tip=null;}if(_tipBtn){_tipBtn.classList.remove('on');_tipBtn=null;}}
function showTip(btn){
  hideTip();
  var k=btn.getAttribute('data-tip'),d=TIPS[k];if(!d)return;
  _tip=document.createElement('div');_tip.className='tip';
  _tip.innerHTML='<b>'+esc(d.t)+'</b>'+esc(d.d);
  document.body.appendChild(_tip);
  var r=btn.getBoundingClientRect();
  _tip.style.top=(r.bottom+window.pageYOffset+7)+'px';
  _tip.style.left=Math.max(12,Math.min(r.left+window.pageXOffset,window.innerWidth-_tip.offsetWidth-12))+'px';
  _tipBtn=btn;btn.classList.add('on');
}
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b){if(_tipBtn===b){hideTip();return;}showTip(b);return;}
  if(_tip&&!_tip.contains(e.target))hideTip();
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideTip();});

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

installCcPicker(function(){return ccPayload;},
                function(pl){ccPayload=pl;},
                function(){buildControls();refresh();});

installPreviewDock({dock:'#pair',grip:'#dockgrip',pin:'#pinbtn',term:'.cxterm',key:'codex',pinDefault:true});
installNav();
`;

module.exports = { renderCodex, CODEX_CSS };
