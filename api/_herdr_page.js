// The /herdr page — herdr's looks and behaviour, layered on a Claude Code theme.
//
// The mock here is deliberately not another terminal window. herdr's distinguishing
// feature is that it knows what your agents are DOING — working, blocked, done, idle —
// and rolls that state up from pane to tab to workspace. So the preview leads with the
// agent sidebar, because that is the thing you are actually configuring.
//
// As everywhere else in this repo, the browser JS lives inside a template literal:
// no backticks, no ${...}, and every backslash doubled.

const { TERM_CSS } = require('./_term.js');
const { STUDIO_CSS } = require('./_customize.js');
const { topBar, navPayload } = require('./_nav.js');
const { compareBlock, COMPARE_CSS } = require('./_compare.js');
const {
  HERDR_DEFAULTS, HERDR_THEMES, HERDR_PLUGINS, SHELL_MODES, NEW_CWD,
  COLLAPSED_MODES, HOST_CURSORS, TAB_POSITIONS, AGENT_SORTS, TOAST_DELIVERY,
  TOAST_POSITIONS, UPDATE_CHANNELS, PREFIXES,
} = require('./_herdr.js');

// Palettes for the built-in themes, so a theme chip previews in its own colours rather
// than as a name in a list. Values are the widely-published hexes for each scheme; herdr
// resolves the real ones itself, so these drive the PREVIEW only and never the config.
const THEME_PREVIEW = {
  'catppuccin':       { bg: '#1e1e2e', panel: '#181825', text: '#cdd6f4', dim: '#9399b2', accent: '#89b4fa', green: '#a6e3a1', yellow: '#f9e2af', red: '#f38ba8' },
  'catppuccin-latte': { bg: '#eff1f5', panel: '#e6e9ef', text: '#4c4f69', dim: '#6c6f85', accent: '#1e66f5', green: '#40a02b', yellow: '#df8e1d', red: '#d20f39' },
  'terminal':         { bg: '#0b0e14', panel: '#11151c', text: '#c8ccd4', dim: '#7f8896', accent: '#5aa2f7', green: '#8fc46a', yellow: '#d8b06a', red: '#e06c75' },
  'tokyo-night':      { bg: '#1a1b26', panel: '#16161e', text: '#c0caf5', dim: '#565f89', accent: '#7aa2f7', green: '#9ece6a', yellow: '#e0af68', red: '#f7768e' },
  'tokyo-night-day':  { bg: '#e1e2e7', panel: '#d4d6e4', text: '#3760bf', dim: '#6172b0', accent: '#2e7de9', green: '#587539', yellow: '#8c6c3e', red: '#f52a65' },
  'dracula':          { bg: '#282a36', panel: '#21222c', text: '#f8f8f2', dim: '#6272a4', accent: '#bd93f9', green: '#50fa7b', yellow: '#f1fa8c', red: '#ff5555' },
  'nord':             { bg: '#2e3440', panel: '#292e39', text: '#d8dee9', dim: '#7b88a1', accent: '#88c0d0', green: '#a3be8c', yellow: '#ebcb8b', red: '#bf616a' },
  'gruvbox':          { bg: '#282828', panel: '#1d2021', text: '#ebdbb2', dim: '#928374', accent: '#83a598', green: '#b8bb26', yellow: '#fabd2f', red: '#fb4934' },
  'gruvbox-light':    { bg: '#fbf1c7', panel: '#f2e5bc', text: '#3c3836', dim: '#7c6f64', accent: '#076678', green: '#79740e', yellow: '#b57614', red: '#9d0006' },
  'one-dark':         { bg: '#282c34', panel: '#21252b', text: '#abb2bf', dim: '#5c6370', accent: '#61afef', green: '#98c379', yellow: '#e5c07b', red: '#e06c75' },
  'one-light':        { bg: '#fafafa', panel: '#eaeaeb', text: '#383a42', dim: '#a0a1a7', accent: '#4078f2', green: '#50a14f', yellow: '#c18401', red: '#e45649' },
  'solarized':        { bg: '#002b36', panel: '#073642', text: '#93a1a1', dim: '#586e75', accent: '#268bd2', green: '#859900', yellow: '#b58900', red: '#dc322f' },
  'solarized-light':  { bg: '#fdf6e3', panel: '#eee8d5', text: '#586e75', dim: '#93a1a1', accent: '#268bd2', green: '#859900', yellow: '#b58900', red: '#dc322f' },
  'kanagawa':         { bg: '#1f1f28', panel: '#16161d', text: '#dcd7ba', dim: '#727169', accent: '#7e9cd8', green: '#98bb6c', yellow: '#e6c384', red: '#e82424' },
  'kanagawa-lotus':   { bg: '#f2ecbc', panel: '#e7dba0', text: '#545464', dim: '#8a8980', accent: '#4d699b', green: '#6f894e', yellow: '#77713f', red: '#c84053' },
  'rose-pine':        { bg: '#191724', panel: '#1f1d2e', text: '#e0def4', dim: '#6e6a86', accent: '#c4a7e7', green: '#9ccfd8', yellow: '#f6c177', red: '#eb6f92' },
  'rose-pine-dawn':   { bg: '#faf4ed', panel: '#fffaf3', text: '#575279', dim: '#9893a5', accent: '#907aa9', green: '#56949f', yellow: '#ea9d34', red: '#b4637a' },
  'vesper':           { bg: '#101010', panel: '#161616', text: '#ffffff', dim: '#8b8b8b', accent: '#ffc799', green: '#99ffe4', yellow: '#ffc799', red: '#ff8080' },
};

const HERDR_CSS = `
  .hwrap{max-width:1440px;margin:0 auto;padding:0 24px 40px;}
  .hpair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
  .hcol{min-width:0;}

  /* The herdr window mock. Every colour is a custom property so the preview updates by
     setting variables rather than re-rendering markup. */
  .hwin{border:1px solid var(--hd-chrome);border-radius:11px;overflow:hidden;
    background:var(--hd-bg);box-shadow:0 18px 40px rgba(0,0,0,.45);
    font-family:ui-monospace,"SF Mono",Menlo,monospace;}
  .hbody{display:flex;min-height:0;}
  /* The agent sidebar — the reason this page exists. */
  .hside{flex:none;background:var(--hd-panel);border-right:1px solid var(--hd-chrome);
    padding:7px 0 8px;display:flex;flex-direction:column;gap:2px;overflow:hidden;}
  .hside .hgroup{font-size:8.5px;letter-spacing:.11em;text-transform:uppercase;
    color:var(--hd-dim);padding:5px 9px 3px;}
  .hrow{display:flex;align-items:center;gap:6px;padding:3px 9px;font-size:var(--hd-sidefont);
    color:var(--hd-dim);white-space:nowrap;overflow:hidden;}
  .hrow .hname{overflow:hidden;text-overflow:ellipsis;}
  .hrow.on{color:var(--hd-text);background:var(--hd-selwash);
    box-shadow:inset 2px 0 0 var(--hd-accent);}
  .hrow .hsub{font-size:8.5px;color:var(--hd-dim);opacity:.75;}
  /* State is the point: a dot per documented state, coloured so "blocked" reads as
     needing you and "working" reads as busy. */
  .hdot{width:7px;height:7px;border-radius:50%;flex:none;}
  .hdot.working{background:var(--hd-yellow);}
  .hdot.blocked{background:var(--hd-red);box-shadow:0 0 0 2px color-mix(in srgb,var(--hd-red) 30%,transparent);}
  .hdot.done{background:var(--hd-green);}
  .hdot.idle{background:var(--hd-dim);opacity:.55;}
  .hstate{margin-left:auto;font-size:8px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--hd-dim);}
  .hpanes{flex:1;display:flex;flex-direction:column;min-width:0;}
  .htabs{display:flex;gap:2px;padding:4px 6px 0;background:var(--hd-panel);font-size:9.5px;}
  .htabs.bottom{order:2;padding:0 6px 4px;}
  .htab{padding:3px 9px;border-radius:5px 5px 0 0;color:var(--hd-dim);white-space:nowrap;}
  .htab.on{background:var(--hd-bg);color:var(--hd-text);}
  .htabs.bottom .htab{border-radius:0 0 5px 5px;}
  .hsplit{flex:1;display:flex;min-width:0;gap:var(--hd-gap);padding:var(--hd-gap);}
  .hpane{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--hd-bg);
    border:var(--hd-bw) solid var(--hd-pane);border-radius:5px;position:relative;overflow:hidden;}
  .hpane.active{border-color:var(--hd-accent);}
  .hlabel{position:absolute;top:-1px;right:5px;font-size:7.5px;letter-spacing:.06em;
    text-transform:uppercase;color:var(--hd-bg);background:var(--hd-accent);
    padding:0 4px;border-radius:0 0 3px 3px;}
  .hterm{flex:1;padding:6px 8px;font-size:var(--hd-font);line-height:1.6;overflow:hidden;}
  .hterm .l{white-space:pre-wrap;word-break:break-word;}
  .hscroll{position:absolute;right:1px;top:5px;bottom:5px;width:3px;border-radius:3px;
    background:var(--hd-chrome);}
  /* The toast, when notifications are on — it is the one setting whose effect is
     invisible unless the mock draws it. */
  .htoast{position:absolute;font-size:8.5px;background:var(--hd-panel);color:var(--hd-text);
    border:1px solid var(--hd-accent);border-radius:6px;padding:4px 7px;max-width:62%;
    box-shadow:0 6px 16px rgba(0,0,0,.5);}
  .htoast.bottom-right{right:7px;bottom:7px;} .htoast.bottom-left{left:7px;bottom:7px;}
  .htoast.top-right{right:7px;top:7px;} .htoast.top-left{left:7px;top:7px;}
  .hbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .hbadge b{color:var(--text);letter-spacing:.02em;}
  .hbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .hbadge .pill.aft{border-color:var(--accent);color:var(--accent);}

  .hpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;
    align-items:start;}
  @media(min-width:760px){#herdrControls{grid-template-columns:repeat(auto-fit,minmax(370px,1fr));}}

  /* Theme chips preview in the theme's own colours. */
  #hthemeGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;}
  .hchip{display:block;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    border:1px solid var(--border);border-radius:9px;padding:0;overflow:hidden;
    background:#0b0e14;transition:border-color .14s,transform .14s;}
  .hchip:hover{transform:translateY(-1px);}
  .hchip.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
  .hchip .hcsw{display:flex;height:26px;align-items:center;gap:4px;padding:0 9px;}
  .hchip .hcdot{width:8px;height:8px;border-radius:50%;flex:none;}
  .hchip .hcname{padding:6px 9px 7px;font-size:11.5px;color:var(--text);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

  /* Plugins. Each one installs somebody else's code, so the card says so and links out. */
  .plugrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:11px;}
  .plucard{border:1px solid var(--border);border-radius:11px;background:#0b0e14;
    padding:11px 12px 10px;display:flex;flex-direction:column;gap:6px;}
  .plucard.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
  .pluhead{display:flex;align-items:center;gap:8px;}
  .pluhead input{accent-color:var(--accent);width:16px;height:16px;flex:none;cursor:pointer;}
  .pluname{font-size:13px;font-weight:600;color:var(--text);}
  .plustars{margin-left:auto;font-size:10.5px;color:var(--gold);white-space:nowrap;}
  .plublurb{font-size:11.5px;line-height:1.5;color:var(--dim);}
  .plurepo{font-size:10.5px;color:var(--faint);font-family:ui-monospace,Menlo,monospace;}
  .plurepo a{color:var(--dim);}
  .plurepo a:hover{color:var(--accent);}
  .pluwarn{margin:10px 0 0;font-size:11.5px;line-height:1.55;color:var(--dim);
    border-left:2px solid var(--gold);padding-left:10px;}

  .hfiles{background:#0b0e14;border:1px solid var(--border);border-radius:10px;
    padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;
    color:#b7c3d6;overflow-x:auto;white-space:pre;line-height:1.6;}
  .hfiles h4{margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--gold);}

  .hhead{padding-bottom:2px;}
  .hhead h1{font-size:32px;}

  @media(max-width:700px),(max-height:520px){
    .hwrap{padding:0 12px 40px;}
    .hpair{grid-template-columns:1fr;gap:0;}
    .hpair[data-pane="after"] .hcol-before{display:none;}
    .hpair[data-pane="before"] .hcol-after{display:none;}
    .hhead h1{font-size:25px;margin-bottom:2px;}
    .hhead .sub{font-size:12.5px;line-height:1.5;}
    .hterm{height:min(30dvh,200px);flex:none;font-size:calc(var(--hd-font) * .9);}
    .hpanels{grid-template-columns:1fr;}
    .hbadge span:last-child{display:none;}
  }
`;

const LINES = [
  ['prompt', ' > add a retry to the upload path '],
  ['nl', ''],
  ['accent', '✳ '], ['accent', 'Working… '], ['dim', '(esc to interrupt)'],
  ['nl', ''],
  ['green', '● '], ['text', 'Edit'], ['dim', '(src/upload.ts)'],
  ['nl', ''],
  ['dim', '  └ '], ['green', '+18 −3'],
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderHerdr(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const defaults = JSON.stringify(HERDR_DEFAULTS);
  const opts = JSON.stringify({
    themes: HERDR_THEMES, shellModes: SHELL_MODES, newCwd: NEW_CWD,
    collapsed: COLLAPSED_MODES, cursors: HOST_CURSORS, tabPositions: TAB_POSITIONS,
    sorts: AGENT_SORTS, toastDelivery: TOAST_DELIVERY, toastPositions: TOAST_POSITIONS,
    channels: UPDATE_CHANNELS, prefixes: PREFIXES,
  });
  const themePreview = JSON.stringify(THEME_PREVIEW);
  const plugins = JSON.stringify(HERDR_PLUGINS);
  const lines = JSON.stringify(LINES);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>herdr · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}${COMPARE_CSS}${HERDR_CSS}</style></head><body>
${topBar('herdr', ghSvg)}
<header class="hhead"><h1>\u{1F9AC} herdr</h1>
<p class="sub" style="margin-top:8px">The multiplexer that knows what your agents are <b>doing</b>. herdr classifies every agent pane as
<b>working</b>, <b>blocked</b>, <b>done</b> or <b>idle</b> and rolls that up through tabs and workspaces — so the question
"which one is waiting on me?" has an answer you can see. Build a <span class="mono">config.toml</span> here; one command writes it.</p></header>

<div class="hwrap">
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn" aria-pressed="false"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Pin preview</span></button>
  </div>
  <div class="hpair" data-pane="after" id="pair">
    <div class="hcol hcol-before">
      <div class="hbadge"><span class="pill">before</span><b>Stock herdr</b><span>— every default, straight from 0.8.0</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="hcol hcol-after">
      <div class="hbadge"><span class="pill aft">after</span><b>Your herdr</b><span>— live preview</span></div>
      <div id="winAfter"></div>
    </div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

${compareBlock('herdr')}

  <div class="panel" style="margin-bottom:14px"><h3>\u{1F3A8} Theme</h3>
    <p class="phint">herdr ships 18 built-in themes. Pick one and the whole window follows —
    sidebar, panes, state dots. <b>terminal</b> is the odd one out: it follows your terminal's
    own ANSI palette instead of setting colours.</p>
    <div id="hthemeGrid"></div>
    <div id="hthemeNote" class="pnote"></div>
  </div>

  <div class="hpanels" id="herdrControls"></div>

  <div class="panel" style="margin-top:16px"><h3>\u{1F9E9} Plugins</h3>
    <p class="phint">A herdr plugin is any executable plus a manifest — Bash, JS, Lua, a Rust
    binary. These are real listings from the marketplace, ordered by stars. Tick any and the
    install command below adds <span class="mono">herdr plugin install</span> lines for them.</p>
    <div class="plugrid" id="pluginGrid"></div>
    <p class="pluwarn"><b>Worth knowing before you tick one.</b> The marketplace is an
    <i>automatic</i> index of public repos tagged <span class="mono">herdr-plugin</span>, refreshed
    every 30 minutes — herdr validates a plugin's manifest but does <b>not</b> review or sandbox
    what it does, and there is no plugin update command in v1. Installing one runs somebody
    else's code on your machine with your permissions. Read the repo first.</p>
  </div>

  <div class="hpanels" style="margin-top:16px">
    <div class="panel"><h3>\u{1F4C4} config.toml</h3>
      <p class="phint">Exactly what the command below writes to
      <span class="mono">~/.config/herdr/config.toml</span>, backing up any file already there.</p>
      <div class="hfiles" id="tomlOut"></div>
    </div>
    <div class="panel"><h3>\u{1F4E6} Getting herdr</h3>
      <p class="phint">The installer skips the herdr layer if the binary is missing, so it is
      safe to run either way — but nothing will happen until herdr is on the machine.</p>
      <div class="hfiles">curl -fsSL https://herdr.dev/install.sh | sh
<span style="color:#5b6470"># or</span>
brew install herdr</div>
      <p class="phint" style="margin-top:11px">Claude Code integration is a separate step the
      installer runs for you: it writes lifecycle hooks into
      <span class="mono">~/.claude</span> so herdr can resume the <b>conversation</b> after a server
      restart, not just the pane. herdr reads Claude Code's <i>state</i> from the screen either
      way — the hook supplies the session identity.</p>
    </div>
  </div>
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">\u{1F517} Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">herdr 0.8.0 · every key here is checked against the published config
  reference · <a href="https://herdr.dev/docs/config-reference/" target="_blank" rel="noreferrer">config reference</a>
  · <a href="https://herdr.dev/docs/agents/" target="_blank" rel="noreferrer">how agent state works</a></div>
</div>
<div style="height:110px"></div>
<div id="toast"></div>
<script>
var NAV=${navPayload('herdr')};
var HD_DEFAULTS=${defaults};
var HD_OPTS=${opts};
var HD_THEMES=${themePreview};
var HD_PLUGINS=${plugins};
var LINES=${lines};
${clientLib}
${HERDR_JS}
</script></body></html>`;
}

const HERDR_JS = `
var ORIGIN=location.origin;
var state=null, ccPayload=null;

function defaultHerdr(){var d={};for(var k in HD_DEFAULTS){if(ownKey(HD_DEFAULTS,k))d[k]=HD_DEFAULTS[k];}
  d.plugins=[];d.on=true;return d;}
function ownKey(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}

// ── the client mirror of sanitizeHerdr() ──────────────────────────────────────
// A ?c= link is attacker-controlled, and several of these values are interpolated into
// style="" and class="" attributes and into value="" on the controls. Without this, a
// crafted accentColor or toastPosition breaks out of its attribute. The server sanitizes
// before it writes any file; this is the same guarantee for the page itself.
//
// Kept in lockstep with sanitizeHerdr in _herdr.js — anything added there needs a line
// here, which is why both are driven off the same defaults object.
function hPick(v,list,dflt){return list.indexOf(v)>=0?v:dflt;}
function hBool(v,dflt){return typeof v==='boolean'?v:dflt;}
function hNum(v,lo,hi,dflt){var n=Math.round(Number(v));return isFinite(n)?Math.max(lo,Math.min(hi,n)):dflt;}
function hHex(v,dflt){return (typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v))?v.toLowerCase():dflt;}
function hPath(v,dflt){
  if(typeof v!=='string')return dflt;
  var s=v.trim();
  if(!s||s.length>120)return dflt;
  if(!/^[~A-Za-z0-9._\\/-]+$/.test(s))return dflt;
  if(s.indexOf('..')>=0)return dflt;
  return s;
}
function saneHerdr(o){
  var d=defaultHerdr();
  if(!o||typeof o!=='object')return d;
  var ids=HD_PLUGINS.map(function(p){return p.id;});
  return {
    theme:hPick(o.theme,HD_OPTS.themes,d.theme),
    autoSwitch:hBool(o.autoSwitch,d.autoSwitch),
    customAccent:hBool(o.customAccent,d.customAccent),
    accentColor:hHex(o.accentColor,d.accentColor),
    shellMode:hPick(o.shellMode,HD_OPTS.shellModes,d.shellMode),
    newCwd:hPick(o.newCwd,HD_OPTS.newCwd,d.newCwd),
    prefix:hPick(o.prefix,HD_OPTS.prefixes,d.prefix),
    sidebarWidth:hNum(o.sidebarWidth,18,36,d.sidebarWidth),
    sidebarStartCollapsed:hBool(o.sidebarStartCollapsed,d.sidebarStartCollapsed),
    sidebarCollapsedMode:hPick(o.sidebarCollapsedMode,HD_OPTS.collapsed,d.sidebarCollapsedMode),
    agentPanelSort:hPick(o.agentPanelSort,HD_OPTS.sorts,d.agentPanelSort),
    agentRowsStyle:hPick(o.agentRowsStyle,['default','compact','verbose'],d.agentRowsStyle),
    paneBorders:hBool(o.paneBorders,d.paneBorders),
    paneScrollbars:hBool(o.paneScrollbars,d.paneScrollbars),
    paneGaps:hBool(o.paneGaps,d.paneGaps),
    agentLabelsOnBorders:hBool(o.agentLabelsOnBorders,d.agentLabelsOnBorders),
    tabBarPosition:hPick(o.tabBarPosition,HD_OPTS.tabPositions,d.tabBarPosition),
    hideTabBarWhenSingle:hBool(o.hideTabBarWhenSingle,d.hideTabBarWhenSingle),
    mouseCapture:hBool(o.mouseCapture,d.mouseCapture),
    copyOnSelect:hBool(o.copyOnSelect,d.copyOnSelect),
    mouseScrollLines:hNum(o.mouseScrollLines,1,20,d.mouseScrollLines),
    hostCursor:hPick(o.hostCursor,HD_OPTS.cursors,d.hostCursor),
    confirmClose:hBool(o.confirmClose,d.confirmClose),
    toastDelivery:hPick(o.toastDelivery,HD_OPTS.toastDelivery,d.toastDelivery),
    toastDelaySeconds:hNum(o.toastDelaySeconds,0,3600,d.toastDelaySeconds),
    toastPosition:hPick(o.toastPosition,HD_OPTS.toastPositions,d.toastPosition),
    soundEnabled:hBool(o.soundEnabled,d.soundEnabled),
    resumeAgents:hBool(o.resumeAgents,d.resumeAgents),
    scrollbackBytes:hNum(o.scrollbackBytes,1000000,200000000,d.scrollbackBytes),
    worktreeDir:hPath(o.worktreeDir,d.worktreeDir),
    updateChannel:hPick(o.updateChannel,HD_OPTS.channels,d.updateChannel),
    paneHistory:hBool(o.paneHistory,d.paneHistory),
    allowNested:hBool(o.allowNested,d.allowNested),
    kittyGraphics:hBool(o.kittyGraphics,d.kittyGraphics),
    claudeIntegration:hBool(o.claudeIntegration,d.claudeIntegration),
    plugins:(Object.prototype.toString.call(o.plugins)==='[object Array]'
      ? o.plugins.filter(function(x){return ids.indexOf(x)>=0;}) : []),
    on:true
  };
}

// The Claude Code half. This page styles the terminal AROUND Claude Code, so it carries
// whatever setup arrived in the link rather than inventing one.
function defaultCC(){
  return {n:'My Setup',s:'blue',p:{bg:[26,27,38],raised:[41,46,66],text:[192,202,245],
    comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],
    cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],
    yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]},
    vf:'{}\\u2026 ',vv:['Cooking','Vibing'],ph:['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],
    rm:true,iv:120,ub:'none',uc:'rgb(122,162,247)',id:'herdr',author:'you'};
}

// ── the window mock ───────────────────────────────────────────────────────────
// Four agents in three workspaces, chosen so every documented state is on screen at
// once: that is the whole pitch, and a mock showing four idle panes would not make it.
var AGENTS=[
  {ws:'api',    tab:'claude',  agent:'claude', state:'blocked', sub:'needs approval'},
  {ws:'api',    tab:'tests',   agent:'claude', state:'working', sub:'running suite'},
  {ws:'web',    tab:'claude',  agent:'claude', state:'done',    sub:'ready to read'},
  {ws:'infra',  tab:'shell',   agent:'',       state:'idle',    sub:''}
];

function themeOf(name){return HD_THEMES[name]||HD_THEMES['tokyo-night'];}

function winHTML(s){
  var t=themeOf(s.theme);
  var accent=s.customAccent?s.accentColor:t.accent;
  var vars=[
    '--hd-bg:'+t.bg,'--hd-panel:'+t.panel,'--hd-text:'+t.text,'--hd-dim:'+t.dim,
    '--hd-accent:'+accent,'--hd-green:'+t.green,'--hd-yellow:'+t.yellow,'--hd-red:'+t.red,
    '--hd-chrome:'+t.panel,'--hd-pane:'+(s.paneBorders?t.panel:'transparent'),
    '--hd-selwash:'+hexA(accent,0.14),
    '--hd-font:'+11+'px','--hd-sidefont:'+10+'px',
    '--hd-gap:'+(s.paneGaps?'5px':'0px'),'--hd-bw:'+(s.paneBorders?'1px':'0px')
  ].join(';');

  // Sidebar width is in COLUMNS in the config; the mock scales it to pixels so dragging
  // the number visibly moves the divider instead of doing nothing.
  var sidePx=Math.round(s.sidebarWidth*4.6)+'px';
  var collapsed=s.sidebarStartCollapsed&&s.sidebarCollapsedMode==='hidden';
  var side='';
  if(!collapsed){
    var narrow=s.sidebarStartCollapsed&&s.sidebarCollapsedMode==='compact';
    side='<div class="hside" style="width:'+(narrow?'34px':sidePx)+'">';
    // Sorting by priority puts the blocked one first — the setting is invisible unless
    // the mock actually reorders.
    var rows=AGENTS.slice();
    if(s.agentPanelSort==='priority'){
      var rank={blocked:0,done:1,working:2,idle:3};
      rows.sort(function(a,b){return rank[a.state]-rank[b.state];});
    }
    side+='<div class="hgroup">'+(narrow?'':(s.agentPanelSort==='priority'?'Agents':'Spaces'))+'</div>';
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      side+='<div class="hrow'+(i===0?' on':'')+'">'
        +'<span class="hdot '+r.state+'"></span>';
      if(!narrow){
        side+='<span class="hname">'+esc(r.ws)+(s.agentRowsStyle==='verbose'?(' / '+esc(r.tab)):'')+'</span>';
        if(s.agentRowsStyle!=='compact'&&r.sub)side+='<span class="hstate">'+esc(r.state)+'</span>';
      }
      side+='</div>';
    }
    side+='</div>';
  }

  var tabs='<div class="htabs'+(s.tabBarPosition==='bottom'?' bottom':'')+'">'
    +((s.hideTabBarWhenSingle)?'<div class="htab on">claude</div>':
      '<div class="htab on">claude</div><div class="htab">tests</div><div class="htab">shell</div>')
    +'</div>';

  var body='';
  for(var j=0;j<LINES.length;j++){
    var kind=LINES[j][0],txt=LINES[j][1];
    if(kind==='nl'){body+='</div><div class="l">';continue;}
    var col=kind==='accent'?accent:kind==='green'?t.green:kind==='dim'?t.dim:
      kind==='prompt'?t.text:t.text;
    var st='color:'+col;
    if(kind==='prompt')st+=';background:'+hexA(accent,0.16);
    body+='<span style="'+st+'">'+esc(txt)+'</span>';
  }

  var pane1='<div class="hpane active">'
    +(s.agentLabelsOnBorders?'<div class="hlabel">claude · blocked</div>':'')
    +'<div class="hterm"><div class="l">'+body+'</div></div>'
    +(s.paneScrollbars?'<div class="hscroll"></div>':'')+'</div>';
  var pane2='<div class="hpane">'
    +(s.agentLabelsOnBorders?'<div class="hlabel">shell</div>':'')
    +'<div class="hterm"><div class="l"><span style="color:'+t.dim+'">$ git status</span></div>'
    +'<div class="l"><span style="color:'+t.green+'">nothing to commit</span></div></div>'
    +(s.paneScrollbars?'<div class="hscroll"></div>':'')+'</div>';

  var toast='';
  if(s.toastDelivery!=='off'){
    var where=s.toastDelivery==='herdr'?s.toastPosition:'bottom-right';
    var what=s.toastDelivery==='system'?'macOS notification':
      s.toastDelivery==='terminal'?'terminal bell + title':'claude is blocked';
    toast='<div class="htoast '+where+'">'+esc(what)+'</div>';
  }

  var panes='<div class="hpanes" style="position:relative">'
    +(s.tabBarPosition==='bottom'?('<div class="hsplit">'+pane1+pane2+'</div>'+tabs)
      :(tabs+'<div class="hsplit">'+pane1+pane2+'</div>'))
    +toast+'</div>';

  return '<div class="hwin" style="'+vars+'"><div class="hbody">'+side+panes+'</div></div>';
}

// #rrggbb + alpha -> rgba(), so a wash can be derived from whichever accent is live.
function hexA(hex,a){
  var m=/^#([0-9a-fA-F]{6})$/.exec(String(hex));
  if(!m)return 'rgba(122,162,247,'+a+')';
  var n=parseInt(m[1],16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
}

function drawWindows(){
  var before=defaultHerdr();
  $('#winBefore').innerHTML=winHTML(before);
  $('#winAfter').innerHTML=winHTML(state);
}

// ── controls ──────────────────────────────────────────────────────────────────
var TIPS={
  prefix:{t:'Prefix key',d:'The key you press before a herdr shortcut, tmux-style. Default ctrl+b. herdr is mouse-first, so you can ignore the prefix entirely — but if ctrl+b clashes with your editor, move it here.'},
  sidebarWidth:{t:'Sidebar width',d:'In terminal COLUMNS, not pixels (18\\u201336). The preview scales it so you can see the effect.'},
  agentPanelSort:{t:'Sidebar order',d:'spaces groups by workspace. priority floats the agents that need you \\u2014 blocked first, then done \\u2014 which is the ordering that makes a wall of agents readable.'},
  toastDelivery:{t:'Notifications',d:'OFF by default in herdr, which surprises people. herdr draws its own toast in the terminal; terminal uses the bell and title (works over SSH); system uses the OS notifier.'},
  paneHistory:{t:'Pane history replay',d:'Restores what was ON SCREEN after a server restart, not just the pane. Off by default upstream for a real reason: the stored output can contain secrets and tokens, and it lands in session-history.json in plain text.'},
  resumeAgents:{t:'Resume conversations',d:'After a server restart, reopen supported agents into their native conversation \\u2014 for Claude Code that is claude --resume. Needs the integration installed; on by default.'},
  scrollbackBytes:{t:'Scrollback limit',d:'A BYTE budget, not a line count, despite the legacy alias being named scrollback_lines. 10 MB is the default.'},
  allowNested:{t:'Allow nesting',d:'Lets you launch herdr inside a herdr pane. Off by default, and worth leaving off: agent-state detection reads the live screen, and a nested multiplexer redrawing over it breaks that reading.'},
  worktreeDir:{t:'Worktree directory',d:'Where herdr puts per-branch git checkouts when you run several agents on different branches. Default ~/.herdr/worktrees.'},
  claudeIntegration:{t:'Claude Code integration',d:'Runs herdr integration install claude, which writes lifecycle hooks into ~/.claude. It supplies the SESSION IDENTITY so a conversation can be resumed; herdr still reads Claude Code state from the screen.'},
  newCwd:{t:'New pane directory',d:'follow inherits the current pane\\u2019s directory, home always starts at ~, current uses the directory herdr was started in.'},
  hostCursor:{t:'Cursor',d:'auto lets herdr decide, native leaves your terminal\\u2019s own cursor alone, drawn makes herdr paint it (useful when the native one lands in the wrong pane).'},
};
function ihtml(k){return TIPS[k]?'<button type="button" class="i" data-tip="'+k+'" aria-label="What is this?">i</button>':'';}
function sel(id,list,cur){
  var h='<select id="'+id+'">';
  for(var i=0;i<list.length;i++){
    h+='<option value="'+esc(list[i])+'"'+(list[i]===cur?' selected':'')+'>'+esc(list[i])+'</option>';
  }
  return h+'</select>';
}
function chk(id,label,on,tip){
  return '<label class="ctl2"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+esc(label)+(tip?ihtml(tip):'')+'</span></label>';
}
function panel(title,inner){return '<div class="panel"><h3>'+title+'</h3>'+inner+'</div>';}

function buildControls(){
  var s=state,h='';
  h+=panel('\\u{1F5A5} Window',
    '<label class="ctl"><span class="cap">Tab bar position</span>'+sel('f_tabBarPosition',HD_OPTS.tabPositions,s.tabBarPosition)+'</label>'
    +chk('f_hideTabBarWhenSingle','Hide the tab bar when there is only one tab',s.hideTabBarWhenSingle)
    +chk('f_paneBorders','Pane borders',s.paneBorders)
    +chk('f_paneGaps','Gaps between panes',s.paneGaps)
    +chk('f_paneScrollbars','Pane scrollbars',s.paneScrollbars)
    +chk('f_agentLabelsOnBorders','Show the agent name on the pane border',s.agentLabelsOnBorders));

  h+=panel('\\u{1F9AC} Agent sidebar',
    '<label class="ctl"><span class="cap">Width'+ihtml('sidebarWidth')+'</span>'
    +'<input type="number" id="f_sidebarWidth" min="18" max="36" value="'+s.sidebarWidth+'"></label>'
    +'<label class="ctl"><span class="cap">Order'+ihtml('agentPanelSort')+'</span>'+sel('f_agentPanelSort',HD_OPTS.sorts,s.agentPanelSort)+'</label>'
    +'<label class="ctl"><span class="cap">Row detail</span>'+sel('f_agentRowsStyle',['default','compact','verbose'],s.agentRowsStyle)+'</label>'
    +chk('f_sidebarStartCollapsed','Start collapsed',s.sidebarStartCollapsed)
    +'<label class="ctl"><span class="cap">When collapsed</span>'+sel('f_sidebarCollapsedMode',HD_OPTS.collapsed,s.sidebarCollapsedMode)+'</label>');

  h+=panel('\\u{1F5B1} Input',
    '<label class="ctl"><span class="cap">Prefix key'+ihtml('prefix')+'</span>'+sel('f_prefix',HD_OPTS.prefixes,s.prefix)+'</label>'
    +chk('f_mouseCapture','Mouse capture',s.mouseCapture)
    +chk('f_copyOnSelect','Copy on select',s.copyOnSelect)
    +'<label class="ctl"><span class="cap">Scroll lines per notch</span>'
    +'<input type="number" id="f_mouseScrollLines" min="1" max="20" value="'+s.mouseScrollLines+'"></label>'
    +'<label class="ctl"><span class="cap">Cursor'+ihtml('hostCursor')+'</span>'+sel('f_hostCursor',HD_OPTS.cursors,s.hostCursor)+'</label>'
    +chk('f_confirmClose','Confirm before closing a pane',s.confirmClose));

  h+=panel('\\u{1F514} Notifications',
    '<label class="ctl"><span class="cap">Delivery'+ihtml('toastDelivery')+'</span>'+sel('f_toastDelivery',HD_OPTS.toastDelivery,s.toastDelivery)+'</label>'
    +'<label class="ctl"><span class="cap">Toast position <span class="hint">(herdr delivery only)</span></span>'+sel('f_toastPosition',HD_OPTS.toastPositions,s.toastPosition)+'</label>'
    +'<label class="ctl"><span class="cap">Delay before notifying (seconds)</span>'
    +'<input type="number" id="f_toastDelaySeconds" min="0" max="3600" value="'+s.toastDelaySeconds+'"></label>'
    +chk('f_soundEnabled','Sound',s.soundEnabled));

  h+=panel('\\u{1F4BE} Session &amp; storage',
    chk('f_resumeAgents','Resume agent conversations after a restart',s.resumeAgents,'resumeAgents')
    +chk('f_claudeIntegration','Install the Claude Code integration',s.claudeIntegration,'claudeIntegration')
    +'<label class="ctl"><span class="cap">Scrollback limit (bytes)'+ihtml('scrollbackBytes')+'</span>'
    +'<input type="number" id="f_scrollbackBytes" min="1000000" max="200000000" step="1000000" value="'+s.scrollbackBytes+'"></label>'
    +'<label class="ctl"><span class="cap">Worktree directory'+ihtml('worktreeDir')+'</span>'
    +'<input type="text" id="f_worktreeDir" value="'+esc(s.worktreeDir)+'"></label>'
    +'<label class="ctl"><span class="cap">Update channel</span>'+sel('f_updateChannel',HD_OPTS.channels,s.updateChannel)+'</label>');

  h+=panel('\\u{1F9EA} Shell &amp; experimental',
    '<label class="ctl"><span class="cap">Shell mode</span>'+sel('f_shellMode',HD_OPTS.shellModes,s.shellMode)+'</label>'
    +'<label class="ctl"><span class="cap">New pane directory'+ihtml('newCwd')+'</span>'+sel('f_newCwd',HD_OPTS.newCwd,s.newCwd)+'</label>'
    +chk('f_paneHistory','Replay pane screen history after a restart',s.paneHistory,'paneHistory')
    +chk('f_allowNested','Allow herdr inside herdr',s.allowNested,'allowNested')
    +chk('f_kittyGraphics','Kitty graphics protocol',s.kittyGraphics));

  $('#herdrControls').innerHTML=h;
  wire();
}

// One listener per control, bound by convention: an element id of f_<key> writes
// state.<key>. Adding a control above needs no extra wiring here.
function wire(){
  var host=$('#herdrControls');
  var els=host.querySelectorAll('[id^="f_"]');
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
  var g=$('#hthemeGrid');g.innerHTML='';
  HD_OPTS.themes.forEach(function(name){
    var t=HD_THEMES[name]||{};
    var b=document.createElement('button');
    b.type='button';b.className='hchip'+(name===state.theme?' on':'');
    var sw=document.createElement('div');sw.className='hcsw';
    sw.style.background=t.bg||'#111';
    ['accent','green','yellow','red'].forEach(function(k){
      var d=document.createElement('span');d.className='hcdot';d.style.background=t[k]||'#888';sw.appendChild(d);
    });
    var nm=document.createElement('div');nm.className='hcname';nm.textContent=name;
    nm.style.color=t.text||'#ccc';
    b.appendChild(sw);b.appendChild(nm);
    b.addEventListener('click',function(){state.theme=name;paintThemes();refresh();});
    g.appendChild(b);
  });
  var note=$('#hthemeNote');
  note.textContent=state.theme==='terminal'
    ? 'terminal follows your own terminal\\u2019s ANSI palette \\u2014 herdr sets no colours, so the preview here is a stand-in.'
    : 'Built into herdr 0.8.0, applied by name. The preview uses this scheme\\u2019s published colours.';
}

function paintPlugins(){
  var g=$('#pluginGrid');g.innerHTML='';
  HD_PLUGINS.forEach(function(p){
    var on=state.plugins.indexOf(p.id)>=0;
    var card=document.createElement('div');
    card.className='plucard'+(on?' on':'');
    var head=document.createElement('div');head.className='pluhead';
    var cb=document.createElement('input');cb.type='checkbox';cb.checked=on;
    cb.id='plu_'+p.id;
    cb.setAttribute('aria-label','Install '+p.name);
    var nm=document.createElement('label');nm.className='pluname';nm.textContent=p.name;
    nm.setAttribute('for','plu_'+p.id);
    var st=document.createElement('span');st.className='plustars';st.textContent='\\u2605 '+p.stars;
    head.appendChild(cb);head.appendChild(nm);head.appendChild(st);
    var bl=document.createElement('div');bl.className='plublurb';bl.textContent=p.blurb;
    var rp=document.createElement('div');rp.className='plurepo';
    var a=document.createElement('a');a.href='https://github.com/'+p.repo;
    a.target='_blank';a.rel='noreferrer';a.textContent=p.repo;
    rp.appendChild(a);
    card.appendChild(head);card.appendChild(bl);card.appendChild(rp);
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

// ── payload + output ──────────────────────────────────────────────────────────
function payload(){
  var pl=copyObj(ccPayload);
  pl.hd=copyObj(state);
  pl.hd.on=true;
  return pl;
}
function refresh(){
  drawWindows();
  var c=encodeURIComponent(b64e(payload()));
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/apply.sh?c='+c+'" | bash';
  window.__sccPayloadC=c;
  // The file preview is rendered server-side truth, fetched rather than reimplemented:
  // a second TOML builder in the browser is a second thing to drift.
  fetch('/herdr-files.txt?c='+c).then(function(r){return r.text();}).then(function(t){
    $('#tomlOut').textContent=t;
  }).catch(function(){});
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/herdr?c='+c);}catch(e){}
    try{localStorage.setItem('scc_herdr',JSON.stringify(state));}catch(e){}
  },400);
}

// ── boot ──────────────────────────────────────────────────────────────────────
(function(){
  ccPayload=defaultCC();
  state=defaultHerdr();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'){
        if(pl.p&&typeof pl.p==='object')ccPayload=pl;
        // Through saneHerdr, never merged raw: the link is a stranger's.
        if(pl.hd&&typeof pl.hd==='object')state=saneHerdr(pl.hd);
      }
    }else{
      // localStorage is this browser's own, but it was written from a payload that may
      // not have been, so it gets the same treatment.
      var draft=localStorage.getItem('scc_herdr');
      if(draft)state=saneHerdr(JSON.parse(draft));
    }
  }catch(e){ccPayload=defaultCC();state=defaultHerdr();}
})();
buildControls();
paintThemes();
paintPlugins();
refresh();

$('#c_copy').addEventListener('click',function(){
  copyText($('#cmdtext').textContent);
  this.textContent='Copied \\u2713';var b=this;
  setTimeout(function(){b.textContent='Copy install command';},1600);
});
$('#c_share').addEventListener('click',function(){
  copyText(ORIGIN+'/herdr?c='+encodeURIComponent(b64e(payload())));
  toast('Shareable herdr link copied');
});
$('#c_reset').addEventListener('click',function(){
  state=defaultHerdr();
  try{localStorage.removeItem('scc_herdr');}catch(e){}
  buildControls();paintThemes();paintPlugins();refresh();
  clearTimeout(refresh._t);
  history.replaceState(null,'','/herdr');
  toast('Reset to stock herdr');
});

// Tooltips, reusing the Studio's .i/.tip primitives.
var _tip=null,_tipBtn=null;
function hideTip(){if(_tip){_tip.remove();_tip=null;}if(_tipBtn){_tipBtn.classList.remove('on');_tipBtn=null;}}
function showTip(btn){
  hideTip();
  var k=btn.getAttribute('data-tip'),d=TIPS[k];if(!d)return;
  _tip=document.createElement('div');_tip.className='tip';
  _tip.innerHTML='<b>'+esc(d.t)+'</b>'+esc(d.d);
  document.body.appendChild(_tip);
  var r=btn.getBoundingClientRect();
  var top=r.bottom+window.pageYOffset+7;
  var left=Math.min(r.left+window.pageXOffset,window.innerWidth-_tip.offsetWidth-12);
  _tip.style.top=top+'px';_tip.style.left=Math.max(12,left)+'px';
  _tipBtn=btn;btn.classList.add('on');
}
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b){if(_tipBtn===b){hideTip();return;}showTip(b);return;}
  if(_tip&&!_tip.contains(e.target))hideTip();
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideTip();});

// before/after switch
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
  term:'.hterm',key:'herdr',pinDefault:false});
installNav();
`;

module.exports = { renderHerdr, HERDR_CSS, THEME_PREVIEW };
