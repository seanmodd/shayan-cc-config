// The /zellij page.
//
// The mock leads with the two things Zellij puts on screen that nothing else here does:
// pane FRAMES (with the rounded-corner option that only works nested under ui{}), and the
// MODE indicator in the status bar, which is the whole modal-keybinding model made
// visible. Picking zjstatus swaps that status bar for zjstatus's own, because "what do
// these plugins actually change" is otherwise invisible until you install them.
//
// As everywhere else in this repo, the browser JS lives inside a template literal:
// no backticks, no ${...}, and every backslash doubled.

const { TERM_CSS } = require('./_term.js');
const { STUDIO_CSS } = require('./_customize.js');
const { topBar, navPayload } = require('./_nav.js');
const { compareBlock, COMPARE_CSS } = require('./_compare.js');
const {
  ZELLIJ_DEFAULTS, ZJ_THEMES, ZJ_MODES, ZJ_LAYOUTS, ON_FORCE_CLOSE,
  COPY_CLIPBOARD, WEB_SHARING, COPY_COMMANDS, ZJ_PLUGINS,
} = require('./_zellij.js');

// Preview palettes. Zellij resolves the real ones itself; these drive the MOCK only and
// never the config, so a slightly-off hex here cannot produce a wrong config file.
const ZJ_PREVIEW = {
  'ansi': ['#000000', '#111111', '#c0c0c0', '#808080', '#00aaff', '#00aa00', '#aaaa00', '#aa0000'],
  'ao': ['#1c1c1c', '#232323', '#d0d0d0', '#767676', '#00afaf', '#87af5f', '#d7af5f', '#d75f5f'],
  'atelier-sulphurpool': ['#202746', '#293256', '#979db4', '#6b7394', '#3d8fd1', '#ac9739', '#c08b30', '#c94922'],
  'ayu-dark': ['#0a0e14', '#0f131a', '#b3b1ad', '#4d5566', '#39bae6', '#c2d94c', '#e6b450', '#f07178'],
  'ayu-light': ['#fafafa', '#f0f0f0', '#5c6166', '#8a9199', '#399ee6', '#86b300', '#f2ae49', '#f07171'],
  'ayu-mirage': ['#1f2430', '#242936', '#cccac2', '#707a8c', '#5ccfe6', '#bae67e', '#ffd580', '#f28779'],
  'blade-runner': ['#0b0e14', '#121722', '#c8ccd4', '#6b7280', '#ff2e88', '#00e5ff', '#ffb300', '#ff3860'],
  'catppuccin-frappe': ['#303446', '#292c3c', '#c6d0f5', '#838ba7', '#8caaee', '#a6d189', '#e5c890', '#e78284'],
  'catppuccin-latte': ['#eff1f5', '#e6e9ef', '#4c4f69', '#8c8fa1', '#1e66f5', '#40a02b', '#df8e1d', '#d20f39'],
  'catppuccin-macchiato': ['#24273a', '#1e2030', '#cad3f5', '#8087a2', '#8aadf4', '#a6da95', '#eed49f', '#ed8796'],
  'catppuccin-mocha': ['#1e1e2e', '#181825', '#cdd6f4', '#9399b2', '#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8'],
  'cyber-noir': ['#0d0d12', '#14141c', '#d6d6e0', '#6a6a80', '#00f0ff', '#39ff14', '#ffd400', '#ff2e63'],
  'dayfox': ['#f6f2ee', '#eae3d9', '#3d2b5a', '#7c6f8f', '#2848a9', '#396847', '#ac5402', '#a5222f'],
  'dracula': ['#282a36', '#21222c', '#f8f8f2', '#6272a4', '#bd93f9', '#50fa7b', '#f1fa8c', '#ff5555'],
  'everforest-dark': ['#2d353b', '#272e33', '#d3c6aa', '#859289', '#7fbbb3', '#a7c080', '#dbbc7f', '#e67e80'],
  'everforest-light': ['#fdf6e3', '#f4f0d9', '#5c6a72', '#939f91', '#3a94c5', '#8da101', '#dfa000', '#f85552'],
  'flexoki-dark': ['#100f0f', '#1c1b1a', '#cecdc3', '#878580', '#4385be', '#879a39', '#d0a215', '#d14d41'],
  'gruber-darker': ['#181818', '#282828', '#e4e4ef', '#666666', '#96a6c8', '#73c936', '#ffdd33', '#f43841'],
  'gruvbox-dark': ['#282828', '#1d2021', '#ebdbb2', '#928374', '#83a598', '#b8bb26', '#fabd2f', '#fb4934'],
  'gruvbox-light': ['#fbf1c7', '#f2e5bc', '#3c3836', '#7c6f64', '#076678', '#79740e', '#b57614', '#9d0006'],
  'iceberg-dark': ['#161821', '#1e2132', '#c6c8d1', '#6b7089', '#84a0c6', '#b4be82', '#e2a478', '#e27878'],
  'iceberg-light': ['#e8e9ec', '#dcdfe7', '#33374c', '#8389a3', '#2d539e', '#668e3d', '#c57339', '#cc517a'],
  'kanagawa': ['#1f1f28', '#16161d', '#dcd7ba', '#727169', '#7e9cd8', '#98bb6c', '#e6c384', '#e82424'],
  'lucario': ['#2b3e50', '#243441', '#f8f8f2', '#6c7a89', '#5cacd6', '#a6e22e', '#f9d648', '#ff6541'],
  'menace': ['#100c0c', '#181212', '#d8cfc4', '#7a6e66', '#6ea1c9', '#8fb573', '#d4a76a', '#c1524f'],
  'molokai-dark': ['#1b1d1e', '#232526', '#f8f8f2', '#75715e', '#66d9ef', '#a6e22e', '#e6db74', '#f92672'],
  'night-owl': ['#011627', '#01121f', '#d6deeb', '#5f7e97', '#82aaff', '#addb67', '#ecc48d', '#ef5350'],
  'nightfox': ['#192330', '#131a24', '#cdcecf', '#71839b', '#719cd6', '#81b29a', '#dbc074', '#c94f6d'],
  'nord': ['#2e3440', '#292e39', '#d8dee9', '#7b88a1', '#88c0d0', '#a3be8c', '#ebcb8b', '#bf616a'],
  'one-half-dark': ['#282c34', '#21252b', '#dcdfe4', '#5c6370', '#61afef', '#98c379', '#e5c07b', '#e06c75'],
  'onedark': ['#282c34', '#21252b', '#abb2bf', '#5c6370', '#61afef', '#98c379', '#e5c07b', '#e06c75'],
  'pencil-light': ['#f1f1f1', '#e4e4e4', '#424242', '#8a8a8a', '#008ec4', '#20a5ba', '#c7a900', '#c30771'],
  'retro-wave': ['#1a1033', '#241546', '#f2e9ff', '#7a6ba3', '#ff6ac1', '#5af78e', '#f3f99d', '#ff5c57'],
  'solarized-dark': ['#002b36', '#073642', '#93a1a1', '#586e75', '#268bd2', '#859900', '#b58900', '#dc322f'],
  'solarized-light': ['#fdf6e3', '#eee8d5', '#586e75', '#93a1a1', '#268bd2', '#859900', '#b58900', '#dc322f'],
  'terafox': ['#152528', '#0f1c1e', '#e6eaea', '#587539', '#5a93aa', '#7aa4a1', '#fda47f', '#e85c51'],
  'tokyo-night-dark': ['#1a1b26', '#16161e', '#a9b1d6', '#565f89', '#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'],
  'tokyo-night-light': ['#d5d6db', '#cbccd1', '#343b58', '#9699a3', '#34548a', '#485e30', '#8f5e15', '#8c4351'],
  'tokyo-night-storm': ['#24283b', '#1f2335', '#c0caf5', '#565f89', '#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'],
  'tokyo-night': ['#1a1b26', '#16161e', '#c0caf5', '#565f89', '#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'],
  'vesper': ['#101010', '#161616', '#ffffff', '#8b8b8b', '#ffc799', '#99ffe4', '#ffc799', '#ff8080'],
};

const ZJ_CSS = `
  .zwrap{max-width:1440px;margin:0 auto;padding:0 24px 40px;}
  .zpair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
  .zcol{min-width:0;}

  .zwin{border:1px solid var(--zj-frame);border-radius:10px;overflow:hidden;
    background:var(--zj-bg);box-shadow:0 18px 40px rgba(0,0,0,.45);
    font-family:ui-monospace,"SF Mono",Menlo,monospace;display:flex;flex-direction:column;}
  /* The tab bar is a plugin in Zellij, which is worth knowing and worth showing. */
  .ztabs{display:flex;gap:0;background:var(--zj-panel);font-size:10px;flex:none;}
  .ztab{padding:3px 11px;color:var(--zj-dim);white-space:nowrap;}
  .ztab.on{background:var(--zj-accent);color:var(--zj-bg);font-weight:600;}
  .zsplit{flex:1;display:flex;min-width:0;padding:4px;gap:4px;}
  /* Pane frames, and the rounded corners that only apply when nested under ui{}. */
  .zpane{flex:1;min-width:0;display:flex;flex-direction:column;position:relative;
    border:1px solid var(--zj-frame);border-radius:var(--zj-radius);overflow:hidden;}
  .zpane.noframe{border-color:transparent;border-radius:0;}
  .zpane.active{border-color:var(--zj-accent);}
  .zptitle{font-size:8.5px;letter-spacing:.05em;padding:1px 6px;color:var(--zj-dim);
    background:var(--zj-panel);white-space:nowrap;overflow:hidden;}
  .zpane.active .zptitle{color:var(--zj-accent);}
  .zterm{flex:1;padding:5px 7px;font-size:var(--zj-font);line-height:1.6;overflow:hidden;}
  .zterm .l{white-space:pre-wrap;word-break:break-word;}
  /* The status bar. Zellij's default shows the MODE and the keys available in it —
     the modal model made visible — and zjstatus replaces the whole thing. */
  .zstatus{flex:none;background:var(--zj-panel);font-size:9.5px;display:flex;
    align-items:center;gap:0;overflow:hidden;white-space:nowrap;}
  .zmode{padding:2px 9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    background:var(--zj-accent);color:var(--zj-bg);}
  .zmode.locked{background:var(--zj-red);}
  .zkeys{padding:2px 9px;color:var(--zj-dim);overflow:hidden;text-overflow:ellipsis;}
  .zsession{margin-left:auto;padding:2px 9px;color:var(--zj-dim);}
  .zjs{padding:2px 9px;color:var(--zj-green);}
  .zjs .zjsdim{color:var(--zj-dim);}
  .zplugbadge{flex:none;font-size:8px;letter-spacing:.05em;text-transform:uppercase;
    background:var(--zj-green);color:var(--zj-bg);padding:2px 7px;font-weight:700;}

  .zbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .zbadge b{color:var(--text);letter-spacing:.02em;}
  .zbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .zbadge .pill.aft{border-color:var(--accent);color:var(--accent);}

  /* Pinned: same arrangement as the other terminal pages — the mock sticks below the
     switch row, and the pane height stops tracking its content so the window cannot
     grow over the controls underneath. A dragged height wins via the var's fallback. */
  body.pinned .zpair{position:sticky;top:var(--switch-h,46px);z-index:45;background:var(--bg);
    padding-bottom:12px;box-shadow:0 16px 20px -14px rgba(0,0,0,.75);}
  body.pinned .zterm{height:var(--dock-h,min(24dvh,180px));flex:none;overflow:hidden;}
  body.docked .zterm{height:var(--dock-h);flex:none;overflow:hidden;}

  .zpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;
    align-items:start;}
  @media(min-width:760px){#zjControls{grid-template-columns:repeat(auto-fit,minmax(370px,1fr));}}

  #zthemeGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(146px,1fr));gap:8px;
    max-height:330px;overflow-y:auto;padding-right:3px;}
  .zchip{display:block;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    border:1px solid var(--border);border-radius:9px;padding:0;overflow:hidden;
    background:#0b0e14;transition:border-color .14s,transform .14s;}
  .zchip:hover{transform:translateY(-1px);}
  .zchip.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
  .zchip .zcsw{display:flex;height:24px;align-items:center;gap:4px;padding:0 9px;}
  .zchip .zcdot{width:8px;height:8px;border-radius:50%;flex:none;}
  .zchip .zcname{padding:5px 9px 6px;font-size:11px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;}

  .zfiles{background:#0b0e14;border:1px solid var(--border);border-radius:10px;
    padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11px;
    color:#b7c3d6;overflow:auto;white-space:pre;line-height:1.6;max-height:420px;}
  .zwarn{margin:10px 0 0;font-size:11.5px;line-height:1.55;color:var(--dim);
    border-left:2px solid var(--gold);padding-left:10px;}
  .zwarn b{color:var(--text);}
  .zhead{padding-bottom:2px;}
  .zhead h1{font-size:32px;}

  @media(max-width:700px),(max-height:520px){
    .zwrap{padding:0 12px 40px;}
    .zpair{grid-template-columns:1fr;gap:0;}
    .zpair[data-pane="after"] .zcol-before{display:none;}
    .zpair[data-pane="before"] .zcol-after{display:none;}
    .zhead h1{font-size:25px;margin-bottom:2px;}
    .zterm{height:min(28dvh,190px);flex:none;}
    .zpanels{grid-template-columns:1fr;}
    .zbadge span:last-child{display:none;}
  }
`;

function renderZellij(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const defaults = JSON.stringify(ZELLIJ_DEFAULTS);
  const opts = JSON.stringify({
    themes: ZJ_THEMES, modes: ZJ_MODES, layouts: ZJ_LAYOUTS,
    onForceClose: ON_FORCE_CLOSE, copyClipboard: COPY_CLIPBOARD,
    webSharing: WEB_SHARING, copyCommands: COPY_COMMANDS,
  });
  const preview = JSON.stringify(ZJ_PREVIEW);
  const plugins = JSON.stringify(ZJ_PLUGINS);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zellij · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}${COMPARE_CSS}${ZJ_CSS}</style></head><body class="pinned">
${topBar('zellij', ghSvg)}
<header class="zhead"><h1>\u{1F9E9} Zellij</h1>
<p class="sub" style="margin-top:8px">A terminal workspace with <b>layouts you can check into the repo</b> and sessions that come back after a crash,
not just after a disconnect. It knows nothing about your agent — panes are panes — but it is the most durable place to leave one running.
Build a <span class="mono">config.kdl</span> and an agent layout here; one command writes both.</p></header>

<div class="zwrap">
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn on" aria-pressed="true"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Preview pinned</span></button>
  </div>
  <div class="zpair" data-pane="after" id="pair">
    <div class="zcol zcol-before">
      <div class="zbadge"><span class="pill">before</span><b>Stock Zellij</b><span>— defaults from 0.44.3</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="zcol zcol-after">
      <div class="zbadge"><span class="pill aft">after</span><b>Your Zellij</b><span>— live preview, plugins included</span></div>
      <div id="winAfter"></div>
    </div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

  <div class="panel" style="margin-bottom:14px"><h3>\u{1F3A8} Theme</h3>
    <p class="phint">All 41 themes that ship with Zellij 0.44.3. Names are taken from inside each
    shipped theme file \u2014 the published docs list three of them under the wrong names
    (<span class="mono">ayu_dark</span> rather than <span class="mono">ayu-dark</span>) and omit four
    entirely, and a name Zellij does not recognise is <b>silently ignored</b>.</p>
    <div id="zthemeGrid"></div>
  </div>

  <div class="zpanels" id="zjControls"></div>

  <div class="panel" style="margin-top:16px"><h3>\u{1F50C} Plugins</h3>
    <p class="phint">Zellij plugins are WebAssembly, so there is nothing to install into your
    system \u2014 a <span class="mono">.wasm</span> file is downloaded to
    <span class="mono">~/.config/zellij/plugins/</span> and referenced by path. Every one below was
    checked against the GitHub API for a real release asset. <b>Tick zjstatus and watch the status
    bar in the preview change</b> \u2014 it replaces Zellij's own.</p>
    <div class="plugrid" id="pluginGrid"></div>
    <div class="plucmds" id="pluCmds"></div>
    <p class="zwarn"><b>Two things the docs get wrong here.</b> Zellij <i>silently accepts and
    ignores</i> unknown option keys \u2014 <span class="mono">zellij setup --check</span> returns
    success on a misspelled one \u2014 so a hand-edited config can look fine and do nothing. And
    three theme actions the docs list as bindable
    (<span class="mono">SetDarkTheme</span>, <span class="mono">SetLightTheme</span>,
    <span class="mono">ToggleTheme</span>) are a <b>hard parse error</b> in 0.44.3; they work only
    as CLI actions. Nothing generated here uses them.</p>
  </div>

  <div class="zpanels" style="margin-top:16px">
    <div class="panel"><h3>\u{1F4C4} config.kdl</h3>
      <p class="phint">Written to <span class="mono">~/.config/zellij/config.kdl</span>. That path is
      not XDG: Zellij ignores <span class="mono">$XDG_CONFIG_HOME</span> and takes the first
      directory that exists from its own search order, which puts
      <span class="mono">~/.config/zellij</span> first.</p>
      <div class="zfiles" id="kdlOut"></div>
    </div>
    <div class="panel"><h3>\u{1F5C2} layouts/ai-agent.kdl</h3>
      <p class="phint">The agent, a shell and a git pane in one shape \u2014
      <span class="mono">zellij --layout ai-agent</span>. The agent and git panes are
      <span class="mono">start_suspended</span>, so opening the layout does not immediately spawn an
      AI session; you press Enter when you want it.</p>
      <div class="zfiles" id="layoutOut"></div>
    </div>
  </div>

${compareBlock('zellij')}
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">\u{1F517} Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">Zellij 0.44.3 · every option here was executed against a real binary,
  because Zellij ignores unknown keys without complaining ·
  <a href="https://zellij.dev/documentation/" target="_blank" rel="noreferrer">docs</a></div>
</div>
<div style="height:110px"></div>
<div id="toast"></div>
<script>
var NAV=${navPayload('zellij')};
var ZJ_DEFAULTS=${defaults};
var ZJ_OPTS=${opts};
var ZJ_PREVIEW=${preview};
var ZJ_PLUGINS=${plugins};
${clientLib}
${ZJ_JS}
</script></body></html>`;
}

const ZJ_JS = `
var ORIGIN=location.origin;
var state=null, ccPayload=null;

function ownKey(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}
function defaultZj(){var d={};for(var k in ZJ_DEFAULTS){if(ownKey(ZJ_DEFAULTS,k))d[k]=ZJ_DEFAULTS[k];}
  d.plugins=[];d.on=true;return d;}
function defaultCC(){
  return {n:'My Setup',s:'blue',p:{bg:[26,27,38],raised:[41,46,66],text:[192,202,245],
    comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],
    cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],
    yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]},
    vf:'{}\\u2026 ',vv:['Cooking','Vibing'],ph:['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],
    rm:true,iv:120,ub:'none',uc:'rgb(122,162,247)',id:'zellij',author:'you'};
}

// Client mirror of sanitizeZellij. A ?c= link is a stranger's, and theme names and mode
// names are interpolated into the mock's style and class attributes.
function zPick(v,l,d){return l.indexOf(v)>=0?v:d;}
function zBool(v,d){return typeof v==='boolean'?v:d;}
function zNum(v,lo,hi,d){var n=Math.round(Number(v));return isFinite(n)?Math.max(lo,Math.min(hi,n)):d;}
function zShell(v,d){
  if(typeof v!=='string')return d;
  var s=v.trim();
  if(!s||s.length>80)return d;
  if(!/^[A-Za-z0-9._\\/-]+$/.test(s))return d;
  if(s.indexOf('..')>=0)return d;
  return s;
}
function saneZj(o){
  var d=defaultZj();
  if(!o||typeof o!=='object')return d;
  var ids=ZJ_PLUGINS.map(function(p){return p.id;});
  return {
    theme:zPick(o.theme,ZJ_OPTS.themes,d.theme),
    themeSplit:zBool(o.themeSplit,d.themeSplit),
    themeLight:zPick(o.themeLight,ZJ_OPTS.themes,d.themeLight),
    defaultLayout:zPick(o.defaultLayout,ZJ_OPTS.layouts,d.defaultLayout),
    defaultMode:zPick(o.defaultMode,ZJ_OPTS.modes,d.defaultMode),
    defaultShell:zShell(o.defaultShell,d.defaultShell),
    paneFrames:zBool(o.paneFrames,d.paneFrames),
    roundedCorners:zBool(o.roundedCorners,d.roundedCorners),
    hideSessionName:zBool(o.hideSessionName,d.hideSessionName),
    simplifiedUi:zBool(o.simplifiedUi,d.simplifiedUi),
    styledUnderlines:zBool(o.styledUnderlines,d.styledUnderlines),
    autoLayout:zBool(o.autoLayout,d.autoLayout),
    stackedResize:zBool(o.stackedResize,d.stackedResize),
    mouseMode:zBool(o.mouseMode,d.mouseMode),
    advancedMouseActions:zBool(o.advancedMouseActions,d.advancedMouseActions),
    mouseHoverEffects:zBool(o.mouseHoverEffects,d.mouseHoverEffects),
    focusFollowsMouse:zBool(o.focusFollowsMouse,d.focusFollowsMouse),
    mouseClickThrough:zBool(o.mouseClickThrough,d.mouseClickThrough),
    copyCommand:zPick(o.copyCommand,ZJ_OPTS.copyCommands,d.copyCommand),
    copyClipboard:zPick(o.copyClipboard,ZJ_OPTS.copyClipboard,d.copyClipboard),
    copyOnSelect:zBool(o.copyOnSelect,d.copyOnSelect),
    osc8Hyperlinks:zBool(o.osc8Hyperlinks,d.osc8Hyperlinks),
    scrollbackEditor:zShell(o.scrollbackEditor,d.scrollbackEditor),
    scrollBufferSize:zNum(o.scrollBufferSize,1000,1000000,d.scrollBufferSize),
    sessionSerialization:zBool(o.sessionSerialization,d.sessionSerialization),
    serializePaneViewport:zBool(o.serializePaneViewport,d.serializePaneViewport),
    serializationInterval:zNum(o.serializationInterval,5,3600,d.serializationInterval),
    onForceClose:zPick(o.onForceClose,ZJ_OPTS.onForceClose,d.onForceClose),
    attachToSession:zBool(o.attachToSession,d.attachToSession),
    showStartupTips:zBool(o.showStartupTips,d.showStartupTips),
    showReleaseNotes:zBool(o.showReleaseNotes,d.showReleaseNotes),
    webServer:zBool(o.webServer,d.webServer),
    webSharing:zPick(o.webSharing,ZJ_OPTS.webSharing,d.webSharing),
    webServerPort:zNum(o.webServerPort,1024,65535,d.webServerPort),
    agentLayout:zBool(o.agentLayout,d.agentLayout),
    plugins:(Object.prototype.toString.call(o.plugins)==='[object Array]'
      ? o.plugins.filter(function(x){return ids.indexOf(x)>=0;}) : []),
    on:true
  };
}

// ── the mock ──────────────────────────────────────────────────────────────────
// Mode -> the keys Zellij's own status bar advertises in it. Showing the real hints
// makes the modal model legible instead of just printing a word.
var MODE_KEYS={
  normal:'Ctrl p pane · Ctrl t tab · Ctrl n resize · Ctrl s scroll',
  locked:'Ctrl g to unlock \\u2014 every other shortcut passes through',
  pane:'n new · x close · f fullscreen · d down · r right',
  tab:'n new · x close · r rename · 1-9 go to',
  resize:'h j k l · + grow · - shrink',
  scroll:'\\u2191\\u2193 line · PgUp PgDn page · e edit · s search',
  search:'\\u2191\\u2193 next/prev · c case · w word · Enter done',
  session:'d detach · w sessions · c configure · p plugins',
  move:'h j k l to move the pane · n next',
  tmux:'tmux-compatible bindings',
  entersearch:'type to search · Enter to accept',
  renametab:'type a name · Enter to accept',
  renamepane:'type a name · Enter to accept',
  prompt:'y confirm · n cancel'
};

function pal(name){return ZJ_PREVIEW[name]||ZJ_PREVIEW['catppuccin-mocha'];}

function winHTML(s){
  var p=pal(s.theme);
  var bg=p[0],panel=p[1],text=p[2],dim=p[3],accent=p[4],green=p[5],yellow=p[6],red=p[7];
  var vars=['--zj-bg:'+bg,'--zj-panel:'+panel,'--zj-text:'+text,'--zj-dim:'+dim,
    '--zj-accent:'+accent,'--zj-green:'+green,'--zj-yellow:'+yellow,'--zj-red:'+red,
    '--zj-frame:'+(s.paneFrames?dim:'transparent'),
    '--zj-radius:'+(s.roundedCorners?'6px':'0px'),
    '--zj-font:11px'].join(';');

  var tabs='<div class="ztabs">'
    +'<div class="ztab on">agent</div><div class="ztab">files</div>'
    +'</div>';

  var frameCls=s.paneFrames?'':' noframe';
  var body='<div class="l"><span style="color:'+text+'">&gt; add a retry to the upload path</span></div>'
    +'<div class="l"><span style="color:'+accent+'">\\u2733 Working\\u2026</span> <span style="color:'+dim+'">(esc to interrupt)</span></div>'
    +'<div class="l"><span style="color:'+green+'">\\u25cf</span> <span style="color:'+text+'">Edit</span><span style="color:'+dim+'">(src/upload.ts)</span></div>'
    +'<div class="l"><span style="color:'+dim+'">  \\u2514 </span><span style="color:'+green+'">+18 \\u22123</span></div>';

  var pane1='<div class="zpane active'+frameCls+'">'
    +(s.paneFrames?'<div class="zptitle">claude</div>':'')
    +'<div class="zterm">'+body+'</div></div>';
  var pane2='<div class="zpane'+frameCls+'">'
    +(s.paneFrames?'<div class="zptitle">shell</div>':'')
    +'<div class="zterm"><div class="l"><span style="color:'+dim+'">$ git status</span></div>'
    +'<div class="l"><span style="color:'+green+'">nothing to commit</span></div></div></div>';

  // The status bar, and the reason to tick zjstatus: it replaces this entirely.
  var status;
  if(s.plugins.indexOf('zjstatus')>=0){
    status='<div class="zstatus">'
      +'<span class="zplugbadge">zjstatus</span>'
      +'<span class="zjs">'+esc(String(s.defaultMode).toUpperCase())
      +' <span class="zjsdim">\\u2502</span> dev <span class="zjsdim">\\u2502</span> \\u2387 main'
      +' <span class="zjsdim">\\u2502</span> 14:32</span>'
      +'</div>';
  }else if(s.simplifiedUi){
    // simplified_ui drops the Nerd Font glyphs; the bar stays, the decoration goes.
    status='<div class="zstatus">'
      +'<span class="zmode'+(s.defaultMode==='locked'?' locked':'')+'">'+esc(s.defaultMode)+'</span>'
      +'<span class="zkeys">'+esc(MODE_KEYS[s.defaultMode]||'')+'</span></div>';
  }else{
    status='<div class="zstatus">'
      +'<span class="zmode'+(s.defaultMode==='locked'?' locked':'')+'">'+esc(s.defaultMode)+'</span>'
      +'<span class="zkeys">'+esc(MODE_KEYS[s.defaultMode]||'')+'</span>'
      +(s.hideSessionName?'':'<span class="zsession">zellij</span>')
      +'</div>';
  }

  return '<div class="zwin" style="'+vars+'">'+tabs
    +'<div class="zsplit">'+pane1+pane2+'</div>'+status+'</div>';
}

function drawWindows(){
  $('#winBefore').innerHTML=winHTML(defaultZj());
  $('#winAfter').innerHTML=winHTML(state);
}

// ── controls ──────────────────────────────────────────────────────────────────
var TIPS={
  defaultMode:{t:'Default mode',d:'Which modal mode a new session starts in. locked passes every shortcut through to whatever is running \\u2014 the usual fix when Zellij\\u2019s defaults fight your editor. Ctrl g unlocks.'},
  paneFrames:{t:'Pane frames',d:'The border and title around each pane. Turning them off reclaims two rows and two columns per pane; you lose the pane name and the visible focus edge.'},
  roundedCorners:{t:'Rounded corners',d:'Only works nested inside ui { pane_frames { \\u2026 } }. Written at the top level Zellij silently ignores it, which is a popular way to lose an afternoon. The generated file nests it correctly.'},
  simplifiedUi:{t:'Simplified UI',d:'Drops the Nerd Font glyphs from the UI. Turn this on if the status bar renders as boxes and question marks \\u2014 that means your font has no Nerd Font glyphs.'},
  onForceClose:{t:'On force close',d:'What happens when the terminal window is closed on a live session: detach leaves it running to reattach later, quit kills it. This enum is case-SENSITIVE \\u2014 the generated file writes it lowercase.'},
  sessionSerialization:{t:'Session serialization',d:'Zellij writes the session to disk so it can come back after a crash or a deliberate quit, not just after a detach. This is the thing Zellij does that cmux cannot.'},
  serializePaneViewport:{t:'Serialize pane viewport',d:'Also save what was ON SCREEN in each pane, not just the layout and commands. The docs call this pane_viewport_serialization; that name does nothing. The real key is serialize_pane_viewport, which is what gets written here.'},
  osc8Hyperlinks:{t:'OSC 8 hyperlinks',d:'Clickable links in terminal output. The docs say the default is false; the binary\\u2019s default is true. It is written explicitly here so the file means what it says.'},
  copyCommand:{t:'Copy command',d:'Zellij copies through OSC 52 by default, which silently fails in some terminals. Setting pbcopy on macOS routes copying through the system clipboard instead.'},
  webServer:{t:'Web client',d:'Serves your sessions over HTTP so you can attach from a browser. Keep sharing off unless you mean it \\u2014 this exposes live terminals.'},
  agentLayout:{t:'Agent layout',d:'Writes layouts/ai-agent.kdl alongside the config: the agent in a big pane, a shell and a git pane beside it. Open it with zellij --layout ai-agent.'},
  scrollBufferSize:{t:'Scroll buffer',d:'Lines of scrollback kept per pane. This one really is lines, unlike herdr\\u2019s byte budget.'},
};
function ihtml(k){return TIPS[k]?'<button type="button" class="i" data-tip="'+k+'" aria-label="What is this?">i</button>':'';}
function sel(id,list,cur){
  var h='<select id="'+id+'">';
  for(var i=0;i<list.length;i++){
    var label=list[i]===''?'(none \\u2014 use OSC 52)':list[i];
    h+='<option value="'+esc(list[i])+'"'+(list[i]===cur?' selected':'')+'>'+esc(label)+'</option>';
  }
  return h+'</select>';
}
function chk(id,label,on,tip){
  return '<label class="ctl2"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+esc(label)+(tip?ihtml(tip):'')+'</span></label>';
}
function panel(t,inner){return '<div class="panel"><h3>'+t+'</h3>'+inner+'</div>';}

function buildControls(){
  var s=state,h='';
  h+=panel('\\u{1F5A5} Appearance',
    chk('f_paneFrames','Pane frames',s.paneFrames,'paneFrames')
    +chk('f_roundedCorners','Rounded corners',s.roundedCorners,'roundedCorners')
    +chk('f_hideSessionName','Hide the session name in the status bar',s.hideSessionName)
    +chk('f_simplifiedUi','Simplified UI (no Nerd Font glyphs)',s.simplifiedUi,'simplifiedUi')
    +chk('f_styledUnderlines','Styled underlines',s.styledUnderlines)
    +chk('f_autoLayout','Auto layout',s.autoLayout)
    +chk('f_stackedResize','Stacked resize',s.stackedResize));

  h+=panel('\\u{1F3AF} Startup',
    '<label class="ctl"><span class="cap">Default mode'+ihtml('defaultMode')+'</span>'+sel('f_defaultMode',ZJ_OPTS.modes,s.defaultMode)+'</label>'
    +chk('f_agentLayout','Write an AI-agent layout and use it by default',s.agentLayout,'agentLayout')
    +'<label class="ctl"><span class="cap">Default layout <span class="hint">(when the agent layout is off)</span></span>'+sel('f_defaultLayout',ZJ_OPTS.layouts,s.defaultLayout)+'</label>'
    +chk('f_attachToSession','Attach to an existing session instead of making a new one',s.attachToSession)
    +chk('f_showStartupTips','Show startup tips',s.showStartupTips)
    +chk('f_showReleaseNotes','Show release notes',s.showReleaseNotes));

  h+=panel('\\u{1F5B1} Mouse &amp; clipboard',
    chk('f_mouseMode','Mouse mode',s.mouseMode)
    +chk('f_advancedMouseActions','Advanced mouse actions (drag-resize, Ctrl+scroll)',s.advancedMouseActions)
    +chk('f_mouseHoverEffects','Hover effects',s.mouseHoverEffects)
    +chk('f_focusFollowsMouse','Focus follows mouse',s.focusFollowsMouse)
    +chk('f_mouseClickThrough','Click through to an unfocused pane',s.mouseClickThrough)
    +'<label class="ctl"><span class="cap">Copy command'+ihtml('copyCommand')+'</span>'+sel('f_copyCommand',ZJ_OPTS.copyCommands,s.copyCommand)+'</label>'
    +'<label class="ctl"><span class="cap">Clipboard</span>'+sel('f_copyClipboard',ZJ_OPTS.copyClipboard,s.copyClipboard)+'</label>'
    +chk('f_copyOnSelect','Copy on select',s.copyOnSelect)
    +chk('f_osc8Hyperlinks','OSC 8 hyperlinks',s.osc8Hyperlinks,'osc8Hyperlinks'));

  h+=panel('\\u{1F4BE} Sessions',
    chk('f_sessionSerialization','Serialize sessions (survive a crash, not just a detach)',s.sessionSerialization,'sessionSerialization')
    +chk('f_serializePaneViewport','Also save what was on screen',s.serializePaneViewport,'serializePaneViewport')
    +'<label class="ctl"><span class="cap">Serialization interval (seconds)</span>'
    +'<input type="number" id="f_serializationInterval" min="5" max="3600" value="'+s.serializationInterval+'"></label>'
    +'<label class="ctl"><span class="cap">On force close'+ihtml('onForceClose')+'</span>'+sel('f_onForceClose',ZJ_OPTS.onForceClose,s.onForceClose)+'</label>'
    +'<label class="ctl"><span class="cap">Scroll buffer (lines)'+ihtml('scrollBufferSize')+'</span>'
    +'<input type="number" id="f_scrollBufferSize" min="1000" max="1000000" step="1000" value="'+s.scrollBufferSize+'"></label>');

  h+=panel('\\u{1F310} Web client',
    chk('f_webServer','Run the web server',s.webServer,'webServer')
    +'<label class="ctl"><span class="cap">Sharing</span>'+sel('f_webSharing',ZJ_OPTS.webSharing,s.webSharing)+'</label>'
    +'<label class="ctl"><span class="cap">Port</span>'
    +'<input type="number" id="f_webServerPort" min="1024" max="65535" value="'+s.webServerPort+'"></label>');

  $('#zjControls').innerHTML=h;
  var els=$('#zjControls').querySelectorAll('[id^="f_"]');
  Array.prototype.forEach.call(els,function(el){
    var key=el.id.slice(2);
    var ev=(el.tagName==='SELECT'||el.type==='checkbox')?'change':'input';
    el.addEventListener(ev,function(){
      if(el.type==='checkbox')state[key]=el.checked;
      else if(el.type==='number')state[key]=Number(el.value);
      else state[key]=el.value;
      refresh();
    });
  });
}

function paintThemes(){
  var g=$('#zthemeGrid');g.innerHTML='';
  ZJ_OPTS.themes.forEach(function(name){
    var p=ZJ_PREVIEW[name]||[];
    var b=document.createElement('button');
    b.type='button';b.className='zchip'+(name===state.theme?' on':'');
    var sw=document.createElement('div');sw.className='zcsw';sw.style.background=p[0]||'#111';
    [4,5,6,7].forEach(function(i){
      var d=document.createElement('span');d.className='zcdot';d.style.background=p[i]||'#888';sw.appendChild(d);
    });
    var nm=document.createElement('div');nm.className='zcname';nm.textContent=name;
    nm.style.color=p[2]||'#ccc';nm.style.background=p[1]||'#0b0e14';
    b.appendChild(sw);b.appendChild(nm);
    b.addEventListener('click',function(){state.theme=name;paintThemes();refresh();});
    g.appendChild(b);
  });
}

function paintPlugins(){
  var g=$('#pluginGrid');g.innerHTML='';
  ZJ_PLUGINS.forEach(function(p){
    var on=state.plugins.indexOf(p.id)>=0;
    var card=document.createElement('div');card.className='plucard'+(on?' on':'');
    var head=document.createElement('div');head.className='pluhead';
    var cb=document.createElement('input');cb.type='checkbox';cb.checked=on;cb.id='zplu_'+p.id;
    cb.setAttribute('aria-label','Install '+p.name);
    var nm=document.createElement('label');nm.className='pluname';nm.textContent=p.name;
    nm.setAttribute('for','zplu_'+p.id);
    var st=document.createElement('span');st.className='plustars';st.textContent='\\u2605 '+p.stars;
    head.appendChild(cb);head.appendChild(nm);head.appendChild(st);
    var bl=document.createElement('div');bl.className='plublurb';bl.textContent=p.blurb;
    var rp=document.createElement('div');rp.className='plurepo';
    var a=document.createElement('a');a.href='https://github.com/'+p.repo;
    a.target='_blank';a.rel='noreferrer';a.textContent=p.repo+' @ '+p.tag;
    rp.appendChild(a);
    if(p.bind){
      var kb=document.createElement('span');kb.style.marginLeft='7px';kb.style.color='#5b6470';
      kb.textContent='binds '+p.bind;rp.appendChild(kb);
    }
    var run=document.createElement('div');run.className='plurun';
    var code=document.createElement('code');code.textContent=pluCmd(p);
    var cpy=document.createElement('button');cpy.type='button';cpy.textContent='copy';
    cpy.setAttribute('aria-label','Copy the download command for '+p.name);
    cpy.addEventListener('click',function(e){
      e.preventDefault();copyText(pluCmd(p));
      cpy.textContent='copied';setTimeout(function(){cpy.textContent='copy';},1400);
    });
    run.appendChild(code);run.appendChild(cpy);
    card.appendChild(head);card.appendChild(bl);card.appendChild(rp);card.appendChild(run);
    cb.addEventListener('change',function(){
      var i=state.plugins.indexOf(p.id);
      if(cb.checked&&i<0)state.plugins.push(p.id);
      if(!cb.checked&&i>=0)state.plugins.splice(i,1);
      card.classList.toggle('on',cb.checked);
      refresh();
    });
    g.appendChild(card);
  });
}

// A Zellij plugin is a .wasm file on disk, so "installing" one is a download plus the
// alias and keybind that the generated config.kdl already carries.
function pluCmd(p){
  return 'curl -fsSL -o ~/.config/zellij/plugins/'+p.asset
    +' https://github.com/'+p.repo+'/releases/download/'+p.tag+'/'+p.asset;
}

function paintPluCmds(){
  var host=$('#pluCmds');if(!host)return;
  var chosen=ZJ_PLUGINS.filter(function(p){return state.plugins.indexOf(p.id)>=0;});
  host.innerHTML='';
  host.className='plucmds'+(chosen.length?'':' empty');

  var head=document.createElement('div');head.className='pchead';
  var t=document.createElement('span');t.className='pctitle';t.textContent='What ticking these adds';
  var n=document.createElement('span');n.className='pccount';
  n.textContent=chosen.length?(chosen.length+' selected'):'none selected';
  head.appendChild(t);head.appendChild(n);

  var pre=document.createElement('pre');
  if(chosen.length){
    var cpy=document.createElement('button');
    cpy.type='button';cpy.className='pccopy';cpy.textContent='Copy these lines';
    cpy.addEventListener('click',function(){
      copyText('mkdir -p ~/.config/zellij/plugins\\n'+chosen.map(pluCmd).join('\\n'));
      cpy.textContent='Copied \u2713';
      setTimeout(function(){cpy.textContent='Copy these lines';},1600);
    });
    head.appendChild(cpy);
    var bound=chosen.filter(function(p){return p.bind;}).length;
    var note=document.createElement('span');note.className='pcnote';
    note.innerHTML='These run as part of the <b>install command at the bottom of this page</b> \u2014 '
      +'you do not need to run them separately. The generated <b>config.kdl</b> above already '
      +'carries the matching <b>plugins</b> aliases'
      +(bound?' and the keybinds for the '+bound+' that bind one':'')+'.';
    head.appendChild(note);
    pre.textContent='mkdir -p ~/.config/zellij/plugins\\n'+chosen.map(pluCmd).join('\\n');
  }else{
    pre.textContent='Nothing selected, so the install command downloads no plugins and config.kdl keeps only the ten built-in aliases. Tick one above and the exact command appears here.';
  }
  host.appendChild(head);host.appendChild(pre);
}

function payload(){var pl=copyObj(ccPayload);pl.zj=copyObj(state);pl.zj.on=true;return pl;}
function refresh(){
  drawWindows();
  paintPluCmds();
  var c=encodeURIComponent(b64e(payload()));
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/apply.sh?c='+c+'" | bash';
  window.__sccPayloadC=c;
  fetch('/zellij-files.txt?c='+c).then(function(r){return r.text();}).then(function(t){
    var parts=t.split('@@LAYOUT@@');
    $('#kdlOut').textContent=parts[0]||'';
    $('#layoutOut').textContent=parts[1]||'(agent layout turned off)';
  }).catch(function(){});
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/zellij?c='+c);}catch(e){}
    try{localStorage.setItem('scc_zellij',JSON.stringify(state));}catch(e){}
  },400);
}

(function(){
  ccPayload=defaultCC();state=defaultZj();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'){
        if(pl.p&&typeof pl.p==='object')ccPayload=pl;
        if(pl.zj&&typeof pl.zj==='object')state=saneZj(pl.zj);
      }
    }else{
      var draft=localStorage.getItem('scc_zellij');
      if(draft)state=saneZj(JSON.parse(draft));
    }
  }catch(e){ccPayload=defaultCC();state=defaultZj();}
})();
buildControls();paintThemes();paintPlugins();refresh();

$('#c_copy').addEventListener('click',function(){
  copyText($('#cmdtext').textContent);
  this.textContent='Copied \\u2713';var b=this;
  setTimeout(function(){b.textContent='Copy install command';},1600);
});
$('#c_share').addEventListener('click',function(){
  copyText(ORIGIN+'/zellij?c='+encodeURIComponent(b64e(payload())));
  toast('Shareable Zellij link copied');
});
$('#c_reset').addEventListener('click',function(){
  state=defaultZj();
  try{localStorage.removeItem('scc_zellij');}catch(e){}
  buildControls();paintThemes();paintPlugins();refresh();
  clearTimeout(refresh._t);
  history.replaceState(null,'','/zellij');
  toast('Reset to stock Zellij');
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

installPreviewDock({dock:'#pair',grip:'#dockgrip',pin:'#pinbtn',
  term:'.zterm',key:'zellij',pinDefault:true});
installNav();
`;

module.exports = { renderZellij, ZJ_CSS, ZJ_PREVIEW };
