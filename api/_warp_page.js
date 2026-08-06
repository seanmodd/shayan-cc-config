// The /warp page.
//
// Warp's signature on screen is BLOCKS: each command and its output is one discrete,
// bordered unit with its own exit status, rather than an undifferentiated scrollback.
// Plus the input editor pinned at the bottom. That is what the mock leads with, the same
// way herdr's leads with agent state and Zellij's with the mode bar.
//
// The page is also honest about a split the other terminal pages do not have: two of
// Warp's four config files are additive and safe to write, and settings.toml is not.
// See the note at the top of _warp.js.
//
// As everywhere else in this repo, the browser JS lives inside a template literal:
// no backticks, no ${...}, and every backslash doubled.

const { TERM_CSS } = require('./_term.js');
const { STUDIO_CSS } = require('./_customize.js');
const { topBar, navPayload } = require('./_nav.js');
const { compareBlock, COMPARE_CSS } = require('./_compare.js');
const {
  WARP_DEFAULTS, DETAILS, PANE_COLORS, CURSOR_TYPES, INPUT_MODES,
  SPACINGS, SPLITS, AGENT_COMMANDS,
} = require('./_warp.js');

const WARP_CSS = `
  .wwrap{max-width:1440px;margin:0 auto;padding:0 24px 40px;}
  .wpair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
  .wcol{min-width:0;}

  /* The Warp window mock. Colours are custom properties so the preview updates by
     setting variables rather than re-rendering markup. */
  .wwin{border:1px solid var(--wp-chrome);border-radius:11px;overflow:hidden;
    background:var(--wp-bg);box-shadow:0 18px 40px rgba(0,0,0,.45);
    display:flex;flex-direction:column;
    font-family:ui-monospace,"SF Mono",Menlo,monospace;}
  .wtabs{display:flex;align-items:center;gap:2px;padding:5px 7px 0;flex:none;
    background:var(--wp-chrome);font-size:10px;}
  .wtab{padding:4px 11px;border-radius:6px 6px 0 0;color:var(--wp-dim);white-space:nowrap;}
  .wtab.on{background:var(--wp-bg);color:var(--wp-text);}
  .wtabplus{margin-left:4px;color:var(--wp-dim);padding:0 5px;}

  /* Blocks — the thing that makes Warp look like Warp. */
  .wblocks{flex:1;padding:8px;display:flex;flex-direction:column;gap:var(--wp-gap);
    overflow:hidden;}
  .wblock{border:var(--wp-divw) solid var(--wp-blockborder);border-radius:7px;
    overflow:hidden;}
  .wblock.on{border-color:var(--wp-accent);}
  .wblock.dim{opacity:var(--wp-dimop);}
  .wbhead{display:flex;align-items:center;gap:6px;padding:3px 8px;font-size:9.5px;}
  .wbdir{color:var(--wp-dim);}
  .wbchev{color:var(--wp-accent);}
  .wbcmd{color:var(--wp-text);}
  /* Exit status per block: success or failure is legible without reading the output. */
  .wbdot{margin-left:auto;width:6px;height:6px;border-radius:50%;flex:none;}
  .wbdot.ok{background:var(--wp-green);}
  .wbdot.bad{background:var(--wp-red);}
  .wbdot.run{background:var(--wp-yellow);}
  .wbout{padding:3px 9px 5px;font-size:var(--wp-font);line-height:1.6;}
  .wbout .l{white-space:pre-wrap;word-break:break-word;}

  /* The input editor. Warp pins it to the bottom by default; "classic" puts it inline
     after the last block, which the mock reflects. */
  .winput{flex:none;margin:0 8px 8px;border:1px solid var(--wp-accent);
    border-radius:8px;background:var(--wp-blockbg);
    display:flex;align-items:center;gap:7px;padding:5px 9px;font-size:var(--wp-font);}
  .winput.classic{margin-top:2px;}
  .winput .wichev{color:var(--wp-accent);}
  .winput .wicur{display:inline-block;width:7px;height:calc(var(--wp-font) + 2px);
    background:var(--wp-accent);vertical-align:text-bottom;}
  .winput .wicur.bar{width:2px;}
  .winput .wicur.underline{height:2px;align-self:flex-end;margin-bottom:2px;width:7px;}
  .winput .wiph{color:var(--wp-dim);flex:1;}

  .wbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .wbadge b{color:var(--text);letter-spacing:.02em;}
  .wbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .wbadge .pill.aft{border-color:var(--accent);color:var(--accent);}

  body.pinned .wpair{position:sticky;top:var(--switch-h,46px);z-index:45;background:var(--bg);
    padding-bottom:12px;box-shadow:0 16px 20px -14px rgba(0,0,0,.75);}
  body.pinned .wblocks{height:var(--dock-h,min(26dvh,210px));flex:none;overflow:hidden;}
  body.docked .wblocks{height:var(--dock-h);flex:none;overflow:hidden;}

  .wpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;
    align-items:start;}
  @media(min-width:760px){#warpControls{grid-template-columns:repeat(auto-fit,minmax(370px,1fr));}}

  .wfiles{background:#0b0e14;border:1px solid var(--border);border-radius:10px;
    padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:11px;
    color:#b7c3d6;overflow:auto;white-space:pre;line-height:1.6;max-height:400px;}
  /* The one file we refuse to write gets its own treatment, so it does not read as
     just another generated artefact. */
  .wmanual{border-color:var(--gold);}
  .wmanualbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:8px;}
  .wmanualbar .wmtag{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--gold);border:1px solid var(--gold);border-radius:20px;padding:2px 8px;}
  .wmanualbar button{margin-left:auto;cursor:pointer;font-family:inherit;font-size:10.5px;
    font-weight:600;letter-spacing:.04em;text-transform:uppercase;
    border:1px solid var(--border);background:#161c26;color:var(--dim);border-radius:6px;
    padding:5px 10px;min-height:30px;}
  .wmanualbar button:hover{border-color:var(--accent);color:var(--text);}

  .whead{padding-bottom:2px;}
  .whead h1{font-size:32px;}

  @media(max-width:700px),(max-height:520px){
    .wwrap{padding:0 12px 40px;}
    .wpair{grid-template-columns:1fr;gap:0;}
    .wpair[data-pane="after"] .wcol-before{display:none;}
    .wpair[data-pane="before"] .wcol-after{display:none;}
    .whead h1{font-size:25px;margin-bottom:2px;}
    .wpanels{grid-template-columns:1fr;}
    .wbadge span:last-child{display:none;}
    .wmanualbar button{min-height:40px;}
  }
`;

function renderWarp(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const defaults = JSON.stringify(WARP_DEFAULTS);
  const opts = JSON.stringify({
    details: DETAILS, paneColors: PANE_COLORS, cursors: CURSOR_TYPES,
    inputModes: INPUT_MODES, spacings: SPACINGS, splits: SPLITS,
    agentCommands: AGENT_COMMANDS,
  });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Warp · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}${COMPARE_CSS}${WARP_CSS}</style></head><body class="pinned">
${topBar('warp', ghSvg)}
<header class="whead"><h1>\u{1F300} Warp</h1>
<p class="sub" style="margin-top:8px">The terminal that puts every command in its own <b>block</b> — with its own exit status, its own output,
and its own share link. Build a theme from your Claude Code palette here, plus a launch configuration that opens the agent, a shell
and a git pane in one go. Both are new files, so nothing you already have gets overwritten.</p></header>

<div class="wwrap">
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn on" aria-pressed="true"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Preview pinned</span></button>
  </div>
  <div class="wpair" data-pane="after" id="pair">
    <div class="wcol wcol-before">
      <div class="wbadge"><span class="pill">before</span><b>Stock Warp</b><span>— the built-in dark theme</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="wcol wcol-after">
      <div class="wbadge"><span class="pill aft">after</span><b>Your Warp</b><span>— live preview</span></div>
      <div id="winAfter"></div>
    </div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

  <div class="wpanels" id="warpControls"></div>

  <div class="wpanels" style="margin-top:16px">
    <div class="panel"><h3>\u{1F3A8} themes/&lt;name&gt;.yaml</h3>
      <p class="phint">A new file in <span class="mono">~/.warp/themes/</span>, so it cannot disturb
      anything you already have. Warp picks up new theme files without a restart — you still have to
      <b>select it</b> in Settings → Appearance → Themes once.</p>
      <div class="wfiles" id="themeOut"></div>
    </div>
    <div class="panel"><h3>\u{1F5C2} launch_configurations/&lt;name&gt;.yaml</h3>
      <p class="phint">Also a new file. Open it from the command palette with
      <b>Launch Configuration</b>. No <span class="mono">cwd</span> is baked in, so the panes open
      wherever you launch it from.</p>
      <div class="wfiles" id="launchOut"></div>
    </div>
  </div>

  <div class="panel" style="margin-top:16px"><h3>\u{2699} settings.toml — yours to paste</h3>
    <div class="wmanualbar">
      <span class="wmtag">not written by the installer</span>
      <button type="button" id="copySettings">Copy this snippet</button>
    </div>
    <p class="phint" style="margin-bottom:9px"><b>Why this one is different.</b> Warp owns
    <span class="mono">~/.warp/settings.toml</span> and rewrites it whenever you change anything in the
    Settings UI. It is a single file holding your notification preferences, global hotkeys, and agent
    execution profiles <i>including the command allow and deny lists</i>. Replacing all of that to change
    a font size would be a bad trade, and an external write can be clobbered the next time you touch a
    setting anyway. So the keys are real and the values are yours — but you paste them, or set them in
    the Settings UI, and the installer leaves the file alone.</p>
    <div class="wfiles wmanual" id="settingsOut"></div>
  </div>

${compareBlock('warp')}
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">\u{1F517} Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">Schemas taken from real files a Warp install wrote, not from docs ·
  <a href="https://docs.warp.dev/terminal/appearance/custom-themes" target="_blank" rel="noreferrer">theme docs</a> ·
  <a href="https://docs.warp.dev/features/sessions/launch-configurations" target="_blank" rel="noreferrer">launch configurations</a></div>
</div>
<div style="height:110px"></div>
<div id="toast"></div>
<script>
var NAV=${navPayload('warp')};
var WP_DEFAULTS=${defaults};
var WP_OPTS=${opts};
${clientLib}
${WARP_JS}
</script></body></html>`;
}

const WARP_JS = `
var ORIGIN=location.origin;
var state=null, ccPayload=null;

function ownKey(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}
function defaultWarp(){var d={};for(var k in WP_DEFAULTS){if(ownKey(WP_DEFAULTS,k))d[k]=WP_DEFAULTS[k];}d.on=true;return d;}
function defaultCC(){
  return {n:'My Setup',s:'blue',p:{bg:[26,27,38],raised:[41,46,66],text:[192,202,245],
    comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],
    cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],
    yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]},
    vf:'{}\\u2026 ',vv:['Cooking','Vibing'],ph:['\\u00b7','\\u2736','\\u2733','\\u2736','\\u273b','\\u273d'],
    rm:true,iv:120,ub:'none',uc:'rgb(122,162,247)',id:'warp',author:'you'};
}

// Client mirror of sanitizeWarp. A ?c= link is a stranger's, and the theme name reaches a
// FILENAME while the colours reach style attributes.
function wPick(v,l,d){return l.indexOf(v)>=0?v:d;}
function wBool(v,d){return typeof v==='boolean'?v:d;}
function wNum(v,lo,hi,d){var n=Math.round(Number(v));return isFinite(n)?Math.max(lo,Math.min(hi,n)):d;}
function wHex(v,d){return (typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v))?v.toLowerCase():d;}
function wName(v,d,max){
  if(typeof v!=='string')return d;
  var s=v.replace(/[^A-Za-z0-9 _-]/g,'').replace(/\\s+/g,' ');
  s=s.replace(/^ +| +$/g,'').slice(0,max);
  return s||d;
}
function saneWarp(o){
  var d=defaultWarp();
  if(!o||typeof o!=='object')return d;
  return {
    themeName:wName(o.themeName,d.themeName,40),
    fromPalette:wBool(o.fromPalette,d.fromPalette),
    background:wHex(o.background,d.background),
    foreground:wHex(o.foreground,d.foreground),
    accent:wHex(o.accent,d.accent),
    details:wPick(o.details,WP_OPTS.details,d.details),
    launchConfig:wBool(o.launchConfig,d.launchConfig),
    lcName:wName(o.lcName,d.lcName,40),
    lcTitle:wName(o.lcTitle,d.lcTitle,40),
    lcSplit:wPick(o.lcSplit,WP_OPTS.splits,d.lcSplit),
    lcColor:wPick(o.lcColor,WP_OPTS.paneColors,d.lcColor),
    lcGitPane:wBool(o.lcGitPane,d.lcGitPane),
    lcAgentCommand:wPick(o.lcAgentCommand,WP_OPTS.agentCommands,d.lcAgentCommand),
    keybindings:wBool(o.keybindings,d.keybindings),
    fontName:wName(o.fontName,d.fontName,40),
    fontSize:wNum(o.fontSize,8,32,d.fontSize),
    cursorType:wPick(o.cursorType,WP_OPTS.cursors,d.cursorType),
    inputMode:wPick(o.inputMode,WP_OPTS.inputModes,d.inputMode),
    spacing:wPick(o.spacing,WP_OPTS.spacings,d.spacing),
    opacity:wNum(o.opacity,20,100,d.opacity),
    blur:wNum(o.blur,0,30,d.blur),
    showBlockDividers:wBool(o.showBlockDividers,d.showBlockDividers),
    dimInactivePanes:wBool(o.dimInactivePanes,d.dimInactivePanes),
    on:true
  };
}

// ── the mock ──────────────────────────────────────────────────────────────────
function palHex(t,fb){
  if(Object.prototype.toString.call(t)!=='[object Array]'||t.length!==3)return fb;
  return '#'+t.map(function(n){
    n=Math.max(0,Math.min(255,Math.round(n)));
    return (n<16?'0':'')+n.toString(16);
  }).join('');
}
function liveColors(s){
  var p=ccPayload.p||{};
  if(!s.fromPalette)return {bg:s.background,fg:s.foreground,accent:s.accent};
  return {bg:palHex(p.bg,s.background),fg:palHex(p.text,s.foreground),accent:palHex(p.accent,s.accent)};
}
function mixHex(hex,to,amt){
  var m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  var t=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(to);
  if(!m||!t)return hex;
  var out='#';
  for(var i=1;i<=3;i++){
    var v=Math.round(parseInt(m[i],16)+(parseInt(t[i],16)-parseInt(m[i],16))*amt);
    out+=(v<16?'0':'')+v.toString(16);
  }
  return out;
}

function winHTML(s,stock){
  var p=ccPayload.p||{};
  var c=stock?{bg:'#1e2126',fg:'#d8dee9',accent:'#5aa2f7'}:liveColors(s);
  var dim=mixHex(c.fg,c.bg,0.45);
  var chrome=mixHex(c.bg,'#ffffff',0.05);
  var blockbg=mixHex(c.bg,'#ffffff',0.03);
  var border=mixHex(c.bg,'#ffffff',0.13);
  var gapMap={compact:'4px',standard:'7px',comfortable:'11px'};
  var vars=[
    '--wp-bg:'+c.bg,'--wp-text:'+c.fg,'--wp-accent:'+c.accent,'--wp-dim:'+dim,
    '--wp-chrome:'+chrome,'--wp-blockbg:'+blockbg,
    '--wp-blockborder:'+(stock?border:(s.showBlockDividers?border:'transparent')),
    '--wp-divw:'+((stock||s.showBlockDividers)?'1px':'0px'),
    '--wp-gap:'+(stock?'7px':(gapMap[s.spacing]||'7px')),
    '--wp-dimop:'+((stock||s.dimInactivePanes)?'0.55':'1'),
    '--wp-green:'+palHex(p.green,'#9ece6a'),
    '--wp-red:'+palHex(p.red,'#f7768e'),
    '--wp-yellow:'+palHex(p.yellow,'#e0af68'),
    '--wp-font:'+(stock?11:Math.max(8,Math.min(15,Math.round(s.fontSize*0.85))))+'px'
  ].join(';');

  var blk=function(cmd,status,out,cls){
    return '<div class="wblock'+(cls||'')+'">'
      +'<div class="wbhead"><span class="wbdir">~/app</span>'
      +'<span class="wbchev">\\u276f</span><span class="wbcmd">'+esc(cmd)+'</span>'
      +'<span class="wbdot '+status+'"></span></div>'
      +'<div class="wbout">'+out+'</div></div>';
  };
  var L=function(col,t){return '<div class="l"><span style="color:'+col+'">'+esc(t)+'</span></div>';};

  var body=blk('npm test','ok',L(palHex(p.green,'#9ece6a'),'12 passing (0.9s)'),' dim')
    +blk('claude','run',
      L(c.accent,'\\u2733 Working\\u2026')+L(c.fg,'\\u25cf Edit(src/upload.ts)')
      +L(palHex(p.green,'#9ece6a'),'  \\u2514 +18 \\u22123'),' on');

  var cur=stock?'bar':s.cursorType;
  var input='<div class="winput'+((!stock&&s.inputMode==='classic')?' classic':'')+'">'
    +'<span class="wichev">\\u276f</span>'
    +'<span class="wiph">run a command, or ask in plain English</span>'
    +'<span class="wicur '+cur+'"></span></div>';

  return '<div class="wwin" style="'+vars+'">'
    +'<div class="wtabs"><div class="wtab on">zsh</div><div class="wtab">claude</div>'
    +'<span class="wtabplus">+</span></div>'
    +'<div class="wblocks">'+body+'</div>'
    +input+'</div>';
}

function drawWindows(){
  $('#winBefore').innerHTML=winHTML(defaultWarp(),true);
  $('#winAfter').innerHTML=winHTML(state,false);
}

// ── controls ──────────────────────────────────────────────────────────────────
var TIPS={
  fromPalette:{t:'Colours from your palette',d:'Builds the theme out of the Claude Code palette carried in the link, so the terminal and the agent inside it match. Turn it off to pick the three base colours by hand.'},
  details:{t:'Details',d:'How Warp shades its own chrome against your background \\u2014 darker for a dark theme, lighter for a light one. Getting this wrong makes the UI furniture disappear into the background.'},
  showBlockDividers:{t:'Block dividers',d:'The border around each command block. Off is cleaner; on makes it obvious where one command ends and the next begins, which is most of the reason to use Warp.'},
  inputMode:{t:'Input position',d:'pinned_to_bottom keeps the editor at the bottom of the window always. classic puts it inline after the last block, the way an ordinary terminal behaves.'},
  spacing:{t:'Spacing',d:'How much air sits between blocks.'},
  launchConfig:{t:'Launch configuration',d:'A saved window layout you open from the command palette. This one puts the agent in a focused pane with a shell beside it, and optionally a git pane. It writes a NEW file, so it cannot disturb any launch configuration you already have.'},
  lcAgentCommand:{t:'What the first pane runs',d:'Picked from a list rather than typed: this value is executed when the layout opens, and a config built from a shared link does not get to choose what runs on your machine.'},
  keybindings:{t:'Keybindings',d:'Writes ~/.warp/keybindings.yaml, which holds OVERRIDES only \\u2014 Warp keeps its own default for every action you do not name. Unlike the theme and the launch config this file may already exist, so it is backed up first.'},
  themeName:{t:'Theme name',d:'Becomes the filename under ~/.warp/themes and the label in the theme picker. Restricted to letters, numbers, spaces, dashes and underscores, because it is a path.'},
  opacity:{t:'Window opacity',d:'100 is opaque. Warp writes this as override_opacity.'},
};
function ihtml(k){return TIPS[k]?'<button type="button" class="i" data-tip="'+k+'" aria-label="What is this?">i</button>':'';}
function sel(id,list,cur){
  var h='<select id="'+id+'">';
  for(var i=0;i<list.length;i++){
    var lbl=list[i]===''?'(none)':list[i];
    h+='<option value="'+esc(list[i])+'"'+(list[i]===cur?' selected':'')+'>'+esc(lbl)+'</option>';
  }
  return h+'</select>';
}
function chk(id,label,on,tip){
  return '<label class="ctl2"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+esc(label)+(tip?ihtml(tip):'')+'</span></label>';
}
function panel(t,inner){return '<div class="panel"><h3>'+t+'</h3>'+inner+'</div>';}

function buildControls(){
  var s=state,h='';
  h+=panel('\\u{1F3A8} Theme',
    '<label class="ctl"><span class="cap">Name'+ihtml('themeName')+'</span>'
    +'<input type="text" id="f_themeName" value="'+esc(s.themeName)+'" maxlength="40"></label>'
    +chk('f_fromPalette','Build the colours from my Claude Code palette',s.fromPalette,'fromPalette')
    +'<div class="swatches" style="margin-bottom:11px">'
    +'<label class="sw"><input type="color" id="f_background" value="'+esc(s.background)+'"'+(s.fromPalette?' disabled':'')+'><span>Background</span></label>'
    +'<label class="sw"><input type="color" id="f_foreground" value="'+esc(s.foreground)+'"'+(s.fromPalette?' disabled':'')+'><span>Foreground</span></label>'
    +'<label class="sw"><input type="color" id="f_accent" value="'+esc(s.accent)+'"'+(s.fromPalette?' disabled':'')+'><span>Accent</span></label>'
    +'</div>'
    +'<label class="ctl"><span class="cap">Details'+ihtml('details')+'</span>'+sel('f_details',WP_OPTS.details,s.details)+'</label>');

  h+=panel('\\u{1F5A5} Blocks &amp; window',
    chk('f_showBlockDividers','Block dividers',s.showBlockDividers,'showBlockDividers')
    +chk('f_dimInactivePanes','Dim inactive panes',s.dimInactivePanes)
    +'<label class="ctl"><span class="cap">Spacing'+ihtml('spacing')+'</span>'+sel('f_spacing',WP_OPTS.spacings,s.spacing)+'</label>'
    +'<label class="ctl"><span class="cap">Input position'+ihtml('inputMode')+'</span>'+sel('f_inputMode',WP_OPTS.inputModes,s.inputMode)+'</label>'
    +'<label class="ctl"><span class="cap">Cursor</span>'+sel('f_cursorType',WP_OPTS.cursors,s.cursorType)+'</label>'
    +'<div class="inline2">'
    +'<label class="ctl"><span class="cap">Opacity'+ihtml('opacity')+'</span><input type="number" id="f_opacity" min="20" max="100" value="'+s.opacity+'"></label>'
    +'<label class="ctl"><span class="cap">Blur</span><input type="number" id="f_blur" min="0" max="30" value="'+s.blur+'"></label>'
    +'</div>');

  h+=panel('\\u{1F524} Text',
    '<label class="ctl"><span class="cap">Font name</span>'
    +'<input type="text" id="f_fontName" value="'+esc(s.fontName)+'" maxlength="40"></label>'
    +'<label class="ctl"><span class="cap">Font size</span>'
    +'<input type="number" id="f_fontSize" min="8" max="32" value="'+s.fontSize+'"></label>'
    +'<p class="hint" style="margin-top:-4px">These two live in settings.toml, so they show in the snippet below rather than being written for you.</p>');

  h+=panel('\\u{1F5C2} Launch configuration',
    chk('f_launchConfig','Write a launch configuration',s.launchConfig,'launchConfig')
    +'<label class="ctl"><span class="cap">File / config name</span>'
    +'<input type="text" id="f_lcName" value="'+esc(s.lcName)+'" maxlength="40"></label>'
    +'<label class="ctl"><span class="cap">Tab title</span>'
    +'<input type="text" id="f_lcTitle" value="'+esc(s.lcTitle)+'" maxlength="40"></label>'
    +'<label class="ctl"><span class="cap">First pane runs'+ihtml('lcAgentCommand')+'</span>'+sel('f_lcAgentCommand',WP_OPTS.agentCommands,s.lcAgentCommand)+'</label>'
    +'<label class="ctl"><span class="cap">Split direction</span>'+sel('f_lcSplit',WP_OPTS.splits,s.lcSplit)+'</label>'
    +'<label class="ctl"><span class="cap">Tab colour</span>'+sel('f_lcColor',WP_OPTS.paneColors,s.lcColor)+'</label>'
    +chk('f_lcGitPane','Add a third pane running git status',s.lcGitPane));

  h+=panel('\\u2328 Keybindings',
    chk('f_keybindings','Write ~/.warp/keybindings.yaml',s.keybindings,'keybindings')
    +'<p class="hint">Overrides only, and the only file here that might already exist \\u2014 so it is backed up before anything is written. Two bindings are set: completion suggestions on ctrl-space, accept autosuggestion on tab.</p>');

  $('#warpControls').innerHTML=h;
  var els=$('#warpControls').querySelectorAll('[id^="f_"]');
  Array.prototype.forEach.call(els,function(el){
    var key=el.id.slice(2);
    var ev=(el.tagName==='SELECT'||el.type==='checkbox')?'change':'input';
    el.addEventListener(ev,function(){
      if(el.type==='checkbox')state[key]=el.checked;
      else if(el.type==='number')state[key]=Number(el.value);
      else state[key]=el.value;
      // The three colour wells only mean anything when the palette is not driving them.
      if(key==='fromPalette')buildControls();
      refresh();
    });
  });
}

function payload(){var pl=copyObj(ccPayload);pl.wp=copyObj(state);pl.wp.on=true;return pl;}
function refresh(){
  drawWindows();
  var c=encodeURIComponent(b64e(payload()));
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/apply.sh?c='+c+'" | bash';
  window.__sccPayloadC=c;
  // Server-rendered, so the preview is the installer's own output rather than a second
  // YAML builder that can drift from it.
  fetch('/warp-files.txt?c='+c).then(function(r){return r.text();}).then(function(t){
    var parts=t.split('@@SPLIT@@');
    $('#themeOut').textContent=parts[0]||'';
    $('#launchOut').textContent=parts[1]||'(launch configuration turned off)';
    $('#settingsOut').textContent=parts[2]||'';
  }).catch(function(){});
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/warp?c='+c);}catch(e){}
    try{localStorage.setItem('scc_warp',JSON.stringify(state));}catch(e){}
  },400);
}

(function(){
  ccPayload=defaultCC();state=defaultWarp();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      if(pl&&typeof pl==='object'){
        if(pl.p&&typeof pl.p==='object')ccPayload=pl;
        if(pl.wp&&typeof pl.wp==='object')state=saneWarp(pl.wp);
      }
    }else{
      var draft=localStorage.getItem('scc_warp');
      if(draft)state=saneWarp(JSON.parse(draft));
    }
  }catch(e){ccPayload=defaultCC();state=defaultWarp();}
})();
buildControls();refresh();

$('#copySettings').addEventListener('click',function(){
  copyText($('#settingsOut').textContent);
  this.textContent='Copied \\u2713';var b=this;
  setTimeout(function(){b.textContent='Copy this snippet';},1600);
});
$('#c_copy').addEventListener('click',function(){
  copyText($('#cmdtext').textContent);
  this.textContent='Copied \\u2713';var b=this;
  setTimeout(function(){b.textContent='Copy install command';},1600);
});
$('#c_share').addEventListener('click',function(){
  copyText(ORIGIN+'/warp?c='+encodeURIComponent(b64e(payload())));
  toast('Shareable Warp link copied');
});
$('#c_reset').addEventListener('click',function(){
  state=defaultWarp();
  try{localStorage.removeItem('scc_warp');}catch(e){}
  buildControls();refresh();
  clearTimeout(refresh._t);
  history.replaceState(null,'','/warp');
  toast('Reset to stock Warp');
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
  term:'.wblocks',key:'warp',pinDefault:true});
installNav();
`;

module.exports = { renderWarp, WARP_CSS };
