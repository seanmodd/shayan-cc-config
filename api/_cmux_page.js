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
const { presetsForClient } = require('./_cmux_presets.js');
const {
  CMUX_DEFAULTS, GHOSTTY_FONTS, APPEARANCES, PLACEMENTS,
  ALIGNMENTS, BRANCH_LAYOUTS, INDICATOR_STYLES, FONT_SOURCES,
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
  .cws.on[data-ind="solidFill"]{background:var(--cm-sel);color:var(--cm-onsel);}
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
  /* sessionContentAlignment only does anything when the PANE is wider than the session
     content. The mock's panes are ~275px, narrower than any transcript line, so there is
     genuinely nothing to align here and faking it would misrepresent the setting. The
     control is badged instead. (The previous rule mapped center to text-align:left, which
     was neither honest nor functional.) */
  .cterm[data-align]{}
  .cbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .cbadge b{color:var(--text);letter-spacing:.02em;}
  .cbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .cbadge .pill.aft{border-color:var(--accent);color:var(--accent);}
  .presetpanel{grid-column:1/-1;margin-bottom:14px;}
  .phint{margin:0 0 11px;font-size:12.5px;line-height:1.55;color:var(--dim);max-width:78ch;}
  #presetGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:9px;}
  .pgroup{grid-column:1/-1;display:flex;align-items:baseline;gap:8px;font-size:10.5px;
    letter-spacing:.11em;text-transform:uppercase;color:var(--gold);margin:4px 0 -2px;}
  .pgroup span{letter-spacing:0;text-transform:none;font-size:11.5px;color:var(--faint);}
  /* Each chip previews the theme in the theme's own colours, so the picker is the
     comparison rather than a list of names you have to click through. */
  .pchip{display:block;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    border:1px solid var(--border);border-radius:10px;padding:0;overflow:hidden;
    background:#0b0e14;transition:border-color .14s,transform .14s;min-height:44px;}
  .pchip:hover{transform:translateY(-1px);}
  .pchip.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
  .pchip .pcbody{padding:8px 10px 9px;}
  .pchip .pcname{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;
    color:var(--text);margin-bottom:3px;}
  .pchip .pctag{flex:none;font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;
    border:1px solid var(--border);border-radius:20px;padding:1px 6px;color:var(--faint);}
  .pchip .pctag.mine{border-color:var(--gold);color:var(--gold);}
  .pchip .pcblurb{font-size:11px;line-height:1.45;color:var(--dim);}
  .pchip .pccredit{font-size:10px;color:var(--faint);margin-top:4px;}
  /* The swatch strip is the theme rendering itself: real bg, real fg, real accents. */
  .pcswatch{display:flex;height:30px;align-items:center;gap:5px;padding:0 10px;
    font-family:ui-monospace,Menlo,monospace;font-size:10px;}
  .pcswatch .dot{width:9px;height:9px;border-radius:50%;flex:none;}
  .pcswatch .sample{margin-left:auto;opacity:.9;}
  .pnote{margin-top:11px;font-size:12px;line-height:1.55;color:var(--dim);
    border-left:2px solid var(--border);padding-left:10px;min-height:1px;}
  .pnote b{color:var(--text);}
  .pnote .cr{color:var(--faint);}
  @media(max-width:700px),(max-height:520px){
    #presetGrid{grid-template-columns:1fr 1fr;gap:7px;}
    .pchip .pcblurb,.pchip .pccredit{display:none;}
    .pchip .pcname{font-size:12px;}
    .phint{font-size:11.5px;}
  }
  @media(max-width:380px){#presetGrid{grid-template-columns:1fr;}}
  /* Background opacity and blur are visible properties, so the preview shows them
     rather than only writing them to the file. The pane sits on a stand-in "desktop"
     gradient; at opacity 1 nothing shows through and this is inert. */
  .cwin.seethru .cterm{background:transparent;}
  .cwin.seethru .cpanes{position:relative;}
  .cwin.seethru .cpanes::before{content:"";position:absolute;inset:0;z-index:0;
    background:
      repeating-linear-gradient(115deg,rgba(140,120,200,.55) 0 22px,rgba(90,140,190,.5) 22px 44px,rgba(60,90,150,.55) 44px 66px);
  }
  .cwin.seethru .cpane{position:relative;z-index:1;}
  .cwin.seethru .cpane .cterm{
    background-color:color-mix(in srgb, var(--cm-termbg) calc(var(--cm-opacity) * 100%), transparent);}
  .cwin.blurred .cpanes::before{filter:var(--cm-blur);}
  /* "no visual change" is a promise to the user: this control is doing something, it
     just is not something a mock can show. Without it these read as broken. */
  .nov{margin-left:7px;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--faint);border:1px solid var(--border);border-radius:20px;padding:1px 6px;
    white-space:nowrap;}
  .hint.ok{color:var(--ok);}
  .hint.warn{color:var(--gold);}
  /* An overridden control stays readable — you need to see what it is set to — but it
     is visibly not in play, and it says what is holding it. */
  .ctl.overridden,.ctl2.overridden{opacity:.5;}
  .ctl.overridden input,.ctl.overridden select,
  .ctl2.overridden input,.ctl2.overridden select{cursor:not-allowed;}
  .ovnote{display:block;margin-top:4px;font-size:10.5px;color:var(--gold);
    letter-spacing:.01em;}
  .ctl2.overridden .ovnote{margin-left:26px;}
  /* "not installed" has to be actionable, so it comes with the install line and the
     download link rather than just the bad news. */
  .fontget{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:6px;}
  .fontget code{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#b7c3d6;
    background:#0b0e14;border:1px solid var(--border);border-radius:6px;padding:4px 8px;
    white-space:nowrap;overflow-x:auto;max-width:100%;}
  .fontget .fcopy{cursor:pointer;font-family:inherit;font-size:10.5px;font-weight:600;
    letter-spacing:.04em;text-transform:uppercase;border:1px solid var(--border);
    background:#161c26;color:var(--dim);border-radius:6px;padding:4px 8px;min-height:28px;}
  .fontget .fcopy:hover{border-color:var(--accent);color:var(--text);}
  .fontget a{color:var(--accent);font-size:11.5px;text-decoration:none;
    border-bottom:1px solid transparent;}
  .fontget a:hover{border-bottom-color:var(--accent);}
  .fontget .fpaid{font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;
    color:var(--gold);border:1px solid var(--gold);border-radius:20px;padding:1px 6px;}
  @media(max-width:700px),(max-height:520px){
    .fontget .fcopy{min-height:40px;}
    .fontget code{font-size:10.5px;}
  }
  /* .switchrow, .pinbtn and .dockgrip are in STUDIO_CSS — the Studio renders the
     same row above its own preview, and two copies of that would drift. */

  /* Pinned: the mock rides the top of the viewport with the controls sliding under it.
     The terminal takes a fixed height while pinned so the window's own height stops
     depending on the font size — otherwise raising the font from 13pt to 28pt grew the
     mock from 201px to 626px and it spilled over the controls underneath. Clipping the
     transcript is the right trade here: pinned, you are watching the chrome and the
     colours, and the top of the transcript is what matters. */
  body.pinned .cmuxpair{position:sticky;top:0;z-index:45;background:var(--bg);
    padding-bottom:12px;box-shadow:0 16px 20px -14px rgba(0,0,0,.75);}
  /* The var's fallback is how a dragged height takes precedence without a specificity
     fight: --dock-h only exists once you have used the handle. */
  body.pinned .cterm{height:var(--dock-h,min(26dvh,200px));flex:none;overflow:hidden;}
  body.pinned .cwin{box-shadow:0 8px 22px rgba(0,0,0,.4);}
  /* Unpinned the mock is content-sized, so a dragged height needs saying outright.
     This out-ranks the phone and landscape heights further down on specificity, which
     is the point: an explicit drag beats a breakpoint guess. */
  body.docked .cterm{height:var(--dock-h);flex:none;overflow:hidden;}
  /* The editable cmux.json. Monospace and the same colours as the read-only box beside
     it, so it still reads as the file rather than as a form field. */
  .filebox.jsonbox{padding:10px 12px 11px;white-space:normal;}
  /* Short files should not leave a tall empty box beside a tall editor. */
  .cpanels{align-items:start;}
  .jsonbox .editable{margin-left:7px;font-size:9px;letter-spacing:.08em;color:var(--accent);
    border:1px solid var(--accent);border-radius:20px;padding:1px 6px;}
  #jsonEdit{display:block;width:100%;min-height:230px;resize:vertical;
    font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.6;
    color:#b7c3d6;background:#080b10;border:1px solid var(--border);border-radius:8px;
    padding:9px 10px;white-space:pre;overflow:auto;tab-size:2;}
  #jsonEdit:focus{outline:none;border-color:var(--accent);}
  .jsonbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:9px;}
  .jsonbar button{cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    border:1px solid var(--border);background:#161c26;color:var(--text);border-radius:8px;
    padding:7px 12px;min-height:34px;}
  .jsonbar button:hover{border-color:var(--accent);}
  .jsonbar button.ghost{background:transparent;color:var(--dim);font-weight:500;}
  .jsonmsg{font-size:11px;color:var(--faint);flex:1 1 100%;line-height:1.4;}
  .jsonmsg.ok{color:var(--ok);}
  .jsonmsg.bad{color:var(--red,#f7768e);}

  /* Our Community: saved setups, and the card that saves one. */
  .pchip.savechip{border-style:dashed;}
  .pchip.savechip .pcname{color:var(--accent);}
  /* The save card is a div, so its call-to-action carries the button styling. */
  .savecta{display:block;width:100%;text-align:left;padding:0;margin:0 0 3px;border:none;
    background:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;
    color:var(--accent);}
  .saveinput{width:100%;margin:5px 0 7px;padding:7px 9px;border:1px solid var(--accent);
    border-radius:7px;background:#080b10;color:var(--text);font-family:inherit;font-size:13px;}
  .saveinput:focus{outline:none;box-shadow:0 0 0 2px rgba(122,162,247,.25);}
  .saverow{display:flex;gap:7px;}
  .saverow button{cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    border:1px solid var(--border);border-radius:7px;background:#161c26;color:var(--text);
    padding:6px 11px;min-height:32px;}
  .saverow button:hover{border-color:var(--accent);}
  .saverow .saveno{background:transparent;color:var(--dim);font-weight:500;}
  .pctag.ours{border-color:var(--accent);color:var(--accent);}
  .ouracts{display:flex;gap:10px;margin-top:6px;}
  .ouract{font-size:10.5px;color:var(--dim);border-bottom:1px solid var(--border);
    cursor:pointer;line-height:1.4;}
  .ouract:hover{color:var(--accent);border-bottom-color:var(--accent);}
  @media(max-width:700px),(max-height:520px){
    #jsonEdit{min-height:180px;font-size:16px;}
    .jsonbar button{min-height:44px;}
    .pchip.savechip .pcblurb{display:block;}
    /* 16px, or iOS Safari zooms the page on focus and never zooms back out. */
    .saveinput{font-size:16px;}
    .saverow button{min-height:44px;}
  }
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
    /* A pinned mock may not take more than half the screen on a phone, or there is
       nothing left to scroll the controls in. Dragging past that is allowed — the
       handle clamps to 72% of the viewport — so the cap lifts once you have asked. */
    body.pinned .cmuxpair{max-height:52dvh;overflow:hidden;height:auto;}
    body.pinned.docked .cmuxpair{max-height:none;}
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
  ['prompt', ' > fix the failing checkout test '],
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
    fontSources: FONT_SOURCES,
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
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which window to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn" aria-pressed="false"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Pin preview</span></button>
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
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

  <div class="panel presetpanel"><h3>\u{1F3AC} Start from a theme</h3>
    <p class="phint">Pick a starting point, then change anything below. A community
    theme is a real, widely-used scheme applied by name from the 463 that ship inside
    cmux; an example theme was made for this site and writes its colours out in full.
    Either way the cmux chrome \u2014 borders, sidebar tint, workspace marker \u2014 follows the
    colours you land on.</p>
    <div id="presetGrid"></div>
    <div id="presetNote" class="pnote"></div>
  </div>
  <div class="panels" id="cmuxControls"></div>

  <div class="cpanels" style="margin-top:16px">
    <div class="filebox" id="fileGhostty"></div>
    <div class="filebox jsonbox">
      <h4>~/.config/cmux/cmux.json <span class="editable">editable</span></h4>
      <textarea id="jsonEdit" spellcheck="false" aria-label="cmux.json, editable"></textarea>
      <div class="jsonbar">
        <button type="button" id="jsonApply">Apply to controls</button>
        <button type="button" id="jsonRevert" class="ghost">Revert</button>
        <span class="jsonmsg" id="jsonMsg"></span>
      </div>
    </div>
  </div>
</div>

<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">🔗 Share</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">writes <span class="mono">~/.config/cmux/cmux.json</span> plus every Ghostty config on your machine — <span class="mono">~/.config/ghostty/config</span> and, if you have one, <span class="mono">~/Library/Application&nbsp;Support/com.mitchellh.ghostty/config</span>, because on macOS that second one is read last and wins. All merged, all backed up first. Reload with <span class="mono">Cmd+Shift+,</span> or <span class="mono">cmux reload-config</span>.</div>
</div>
<div style="height:120px"></div>
<div id="toast"></div>
<script>
var STARTERS=${starters};
var CMUX_DEFAULTS=${defaults};
var CMUX_PRESETS=${JSON.stringify(presetsForClient())};
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
// mapPreview returns rgb() strings while the palette side produces #rrggbb. Anything
// that has to do arithmetic on a colour goes through here first.
function hexOf(c){
  var m=/^rgb\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\)$/.exec(String(c).replace(/\\s/g,''));
  if(m)return hx([+m[1],+m[2],+m[3]]);
  m=/^#([0-9a-fA-F]{6})$/.exec(String(c).trim());
  return m?('#'+m[1].toLowerCase()):'#12141a';
}
function mix(hex,over,alpha){
  hex=hexOf(hex);over=hexOf(over);
  var a=toRGBarr(hex),b=toRGBarr(over);
  return 'rgb('+a.map(function(v,i){return Math.round(v*(1-alpha)+b[i]*alpha);}).join(',')+')';
}

// ── the window mock ────────────────────────────────────────────────────────────
function winHTML(s,pal,label){
  var c=cmColors(s,pal);
  var pv=mapPreview(expandPalette(sanePal(pal)));

  // The window background is the TERMINAL's background, so where it comes from
  // depends on whether we actually know it.
  //   with a preset: we do, exactly -- the install writes that background itself.
  //   without one:   we do not. The user's Ghostty keeps whatever theme it had, so
  //                  fall back to the Studio's own approximation via termBg() and
  //                  stay consistent with what /customize shows.
  var hasPreset=!!presetById(s.preset);
  var bg=hasPreset?palHex(pal.bg,pv.bg):pv.bg;
  var text=hasPreset?palHex(pal.text,pv.text):pv.text;
  var dim=hasPreset?palHex(pal.comment,pv.inactive):pv.inactive;
  var faint=dim;

  // Light schemes need the chrome darkened, not lightened.
  //
  // Two things decide this and they are genuinely independent: the TERMINAL's own
  // background (which the theme sets) and cmux's APP appearance (which dresses the
  // window furniture). Setting appearance to light around a dark terminal is a real
  // combination, and previously only the background was consulted — so changing
  // appearance moved the cmux.json and nothing else, which read as a dead control.
  var bgIsLight=relLum(toRGBarr(hexOf(bg)))>0.4;
  var lightBg = s.appearance==='light' ? true
              : s.appearance==='dark'  ? false
              : bgIsLight;
  var lift=lightBg?'#000000':'#ffffff';
  // When the app appearance disagrees with the terminal background, the furniture is
  // the app's colour rather than a tint of the terminal's — which is what cmux does,
  // and what makes the setting visible at all.
  var furnitureBase = (s.appearance==='light'&&!bgIsLight) ? '#e9eaee'
                    : (s.appearance==='dark'&&bgIsLight)   ? '#22242a'
                    : bg;
  var titlebar=mix(furnitureBase,lift,lightBg?0.05:0.06);
  var sidebar=s.matchTerminalBg?bg:mix(furnitureBase,c.tint,Math.max(s.tintOpacity,0.02));
  var chrome=mix(furnitureBase,lift,lightBg?0.16:0.12);
  var vars=[
    '--cm-bg:'+bg,'--cm-text:'+text,'--cm-dim:'+dim,'--cm-faint:'+faint,
    '--cm-titlebar:'+titlebar,'--cm-sidebar:'+sidebar,'--cm-chrome:'+chrome,
    '--cm-pane:'+c.paneBorder,'--cm-panehot:'+c.activePaneBorder,
    '--cm-divider:'+c.divider,'--cm-divider-w:'+(s.minimalMode?'1px':'2px'),
    '--cm-sel:'+c.selection,'--cm-selwash:'+mix(bg,c.selection,lightBg?0.22:0.16),
    '--cm-onsel:'+(relLum(toRGBarr(hexOf(c.selection)))>0.45?'#0b0e14':'#f4f7fb'),
    '--cm-termbg:'+bg,
    '--cm-opacity:'+s.bgOpacity,
    '--cm-blur:'+(s.bgBlur?('blur('+Math.round(s.bgBlur/3)+'px)'):'none'),
    '--cm-font:'+s.fontSize+'px','--cm-sidefont:'+s.sidebarFontSize+'px',
    '--cm-tabfont:'+s.tabBarFontSize+'px'
  ].join(';');
  // JSON.stringify put DOUBLE quotes around the family name, and this string goes into
  // a style="..." attribute — so the attribute ended at the first quote and the font
  // silently never applied, for any choice. Single quotes are valid in CSS and survive
  // a double-quoted attribute intact.
  var fam=s.fontFamily?("font-family:'"+esc(s.fontFamily)+"',ui-monospace,Menlo,monospace;"):'';

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
    // The description, the PR and the git mark are three independent features in the
    // schema, so they render independently here. Nesting the latter two inside the
    // description meant turning the description off silently killed both toggles,
    // which is indistinguishable from them being broken.
    if(on&&!s.sidebarHideDetails){
      var bits=[];
      if(s.sidebarDescription)bits.push('main');
      if(s.sidebarPullRequests)bits.push('#512');
      if(s.sidebarGitStatus)bits.push('\u270e');
      if(bits.length)
        side+='<div class="sgroup" style="padding:0 7px 6px;letter-spacing:0;text-transform:none">'
          +bits.join(s.branchLayout==='inline'?' \u00b7 ':'<br>')+'</div>';
    }
  });

  // The prompt you send is the most visible Claude Code element inside a cmux window,
  // so the mock renders it with its actual message styling rather than as plain text —
  // otherwise the colour controls for it would have nothing to show.
  var um=(ccPayload.um&&typeof ccPayload.um==='object')?ccPayload.um:{};
  var promptFg=um.fg?hexOf(um.fg):text;
  var promptBg=um.bg?hexOf(um.bg):'';
  var promptCss='color:'+promptFg+';';
  if(promptBg)promptCss+='background:'+promptBg+';';
  if((um.st||[]).indexOf('bold')>=0)promptCss+='font-weight:700;';
  if((um.st||[]).indexOf('italic')>=0)promptCss+='font-style:italic;';
  var pb=String(ccPayload.ub||'none'), pbc=ccPayload.uc?hexOf(ccPayload.uc):dim;
  var promptBox=BOX_FOR(pb);

  var body='';
  CC_LINES.forEach(function(pair){
    var kind=pair[0], t=pair[1];
    if(kind==='nl'){body+='</div><div class="l">';return;}
    if(kind==='prompt'){
      // Border first, because in the terminal it is a whole row of box characters
      // above and below rather than a hairline on the strip.
      if(promptBox)body+='</div><div class="l" style="color:'+pbc+'">'
        +esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)
        +esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)
        +esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)+esc(promptBox.t)
        +'</div><div class="l">';
      body+='<span style="'+promptCss+'">'+esc(t)+'</span>';
      if(promptBox)body+='</div><div class="l" style="color:'+pbc+'">'
        +esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)
        +esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)
        +esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)+esc(promptBox.b)
        +'</div><div class="l">';
      return;
    }
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

  return '<div class="cwin'+(s.bgOpacity<1?' seethru':'')+(s.bgBlur>0?' blurred':'')
    +'" style="'+vars+'">'
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

// Mirrors resolveCmuxColors() on the server: with a preset active the terminal's own
// background and foreground come from the preset, so the chrome has to as well.
function presetById(id){
  if(!id)return null;
  for(var i=0;i<CMUX_PRESETS.length;i++)if(CMUX_PRESETS[i].id===id)return CMUX_PRESETS[i];
  return null;
}
/**
 * A Ghostty theme name typed by hand, matched against the schemes this page ships a
 * palette for. Ghostty has hundreds of bundled themes and this page knows the colours
 * of twelve, so a typed name that is not one of them installs fine but cannot be
 * previewed — themeNote() says which of the two you are in rather than leaving the
 * control looking broken.
 */
function presetByThemeName(name){
  if(!name)return null;
  var want=String(name).trim().toLowerCase();
  if(!want)return null;
  for(var i=0;i<CMUX_PRESETS.length;i++){
    var p=CMUX_PRESETS[i];
    if(p.theme&&String(p.theme).toLowerCase()===want)return p;
  }
  return null;
}
function activePal(){
  var pre=presetById(state.preset)||presetByThemeName(state.theme);
  return (pre&&pre.pal)?pre.pal:ccPayload.p;
}
function themeNote(){
  var el=$('#themenote'); if(!el)return;
  var name=(state.theme||'').trim();
  if(!name){
    el.className='hint';
    el.textContent='Leaving your Ghostty colours alone.';
    return;
  }
  var pre=presetByThemeName(name);
  if(pre){
    el.className='hint ok';
    el.textContent='Known scheme — the preview is using its palette.';
  }else{
    el.className='hint warn';
    el.textContent='cmux will apply it. This page does not ship that theme’s colours, '
      +'so the preview keeps the ones above.';
  }
}

// A terminal font can only be previewed if the browser can actually load it, which
// means it has to be installed on this machine. Silently falling back looked exactly
// like a broken control, so the preview says which case you are in.
// document.fonts.check() is not usable for this: it returned true for every name
// tried, including 'ThisFontCertainlyDoesNotExist12345'. Measuring a string rendered
// in the candidate family against the same string rendered in a family that certainly
// does not exist does discriminate — a missing font falls back to the same metrics as
// the missing sentinel, an installed one does not.
var _fontCanvas=null,_fontCache={};
function fontAvailable(name){
  if(!name)return true;
  if(Object.prototype.hasOwnProperty.call(_fontCache,name))return _fontCache[name];
  var ok=true;
  try{
    if(!_fontCanvas)_fontCanvas=document.createElement('canvas').getContext('2d');
    var SENTINEL='ZZZNoSuchFamilyZZZ', SAMPLE='mmmiiilll0O@W';
    var probe=function(fam){
      _fontCanvas.font="72px '"+fam+"', "+SENTINEL;
      return _fontCanvas.measureText(SAMPLE).width;
    };
    var base=probe(SENTINEL);
    ok=Math.abs(probe(name)-base)>0.5;
  }catch(e){ok=true;}
  _fontCache[name]=ok;
  return ok;
}
function paintFontNote(){
  var el=$('#fontnote'); if(!el)return;
  var name=state.fontFamily;
  if(!name){
    el.className='hint';
    el.textContent='Leaving your terminal font alone.';
    return;
  }
  var src=(CMUX_OPTS.fontSources&&Object.prototype.hasOwnProperty.call(CMUX_OPTS.fontSources,name))
    ? CMUX_OPTS.fontSources[name] : null;

  if(fontAvailable(name)){
    el.className='hint ok';
    el.textContent='Installed here \u2014 the preview above is using it.';
    return;
  }

  // Not installed: say so, then say exactly how to get it. A dead end here is what
  // made the control feel broken in the first place.
  el.className='hint warn';
  el.innerHTML='';
  var line=document.createElement('span');
  line.textContent='Not installed on this Mac, so the preview falls back to a system mono. '
    +'cmux will use it once you install it.';
  el.appendChild(line);

  if(!src||(!src.url&&!src.cask)){
    if(src&&src.cost==='macos'){
      // Ships with macOS, so "not installed" almost certainly means the detection is
      // wrong rather than the font being absent. Say that instead of offering a link.
      el.className='hint';
      el.textContent=name+' ships with macOS, so it should already be there \u2014 '
        +'if the preview looks unchanged, that is the detection being cautious, not a problem.';
    }
    return;
  }

  var row=document.createElement('span');
  row.className='fontget';
  if(src.cask){
    var cmd='brew install --cask '+src.cask;
    var code=document.createElement('code');
    code.textContent=cmd;
    row.appendChild(code);
    var copy=document.createElement('button');
    copy.type='button';copy.className='fcopy';copy.textContent='copy';
    copy.addEventListener('click',function(){copyText(cmd);toast('Copied \u2014 paste it in a terminal');});
    row.appendChild(copy);
  }
  if(src.url){
    var a=document.createElement('a');
    a.href=src.url;a.target='_blank';a.rel='noreferrer noopener';
    a.textContent=src.cost==='paid'?'buy it \u2197':'download \u2197';
    row.appendChild(a);
  }
  if(src.cost==='paid'){
    var paid=document.createElement('span');
    paid.className='fpaid';paid.textContent='paid font';
    row.appendChild(paid);
  }
  el.appendChild(row);
}

/**
 * Some settings override others, and cmux does not tell you which. Toggling
 * "show pull requests" while "hide all sidebar details" is on changes the cmux.json
 * and nothing else — correct, and indistinguishable from a broken control. Same for
 * the sidebar tint under "match terminal background", and blur at full opacity.
 *
 * So the overridden control is disabled and says what is overriding it. This is the
 * actual fix for the page feeling buggy: every control that looks inert now either
 * moves the preview or explains why it cannot.
 */
var DEPS=[
  { ids:['m_sd','m_spr','m_sgs','m_bl'], off:function(){return state.sidebarHideDetails;},
    why:'hide all sidebar details is on' },
  { ids:['m_bl'], off:function(){
      // Nothing to lay out until at least two of the three details are showing.
      return state.sidebarHideDetails
        || (!!state.sidebarDescription + !!state.sidebarPullRequests + !!state.sidebarGitStatus) < 2;
    }, why:'needs two or more sidebar details showing' },
  { ids:['m_to','m_tn'], off:function(){return state.matchTerminalBg;},
    why:'match terminal background is on' },
  { ids:['m_tf'], off:function(){return state.minimalMode;},
    why:'minimal mode hides the tab bars' },
  { ids:['m_bb'], off:function(){return state.bgOpacity>=1;},
    why:'blur needs a background under 100% opacity' }
];
function syncDeps(){
  DEPS.forEach(function(d){
    var off=d.off();
    d.ids.forEach(function(id){
      var el=$('#'+id); if(!el)return;
      var row=el.closest('.ctl')||el.closest('.ctl2'); if(!row)return;
      el.disabled=off;
      row.classList.toggle('overridden',off);
      var note=row.querySelector('.ovnote');
      if(off){
        if(!note){
          note=document.createElement('span');
          note.className='ovnote';
          row.appendChild(note);
        }
        note.textContent='\u2192 '+d.why;
      }else if(note){
        note.remove();
      }
    });
  });
}

// Only the topBottom* border styles are drawn on the mock's prompt: those are two
// full-width rules, which is exactly what a one-line prompt gets. The full-box styles
// would need a width the mock does not have, so they show as no border here rather
// than as a wrong one.
function BOX_FOR(style){
  if(style==='topBottomSingle')return {t:'\u2500',b:'\u2500'};
  if(style==='topBottomDouble')return {t:'\u2550',b:'\u2550'};
  if(style==='topBottomBold')return {t:'\u2501',b:'\u2501'};
  return null;
}

// The Studio's border list, so both pages offer the same choices. Only the three
// topBottom* styles are drawn on the mock (see BOX_FOR); the full-box styles still
// install, they just need a width the one-line mock prompt does not have.
var PROMPT_BORDERS=['none','single','round','double','bold','singleDouble','doubleSingle',
  'classic','topBottomSingle','topBottomDouble','topBottomBold'];

/** The payload stores message colours as rgb() strings, matching the Studio. */
function hexToRgbStrC(hex){
  var c=toRGBarr(hexOf(hex));
  return 'rgb('+c[0]+','+c[1]+','+c[2]+')';
}
function promptColorRow(label,help,modeId,pickId){
  return '<div class="ctl"><span class="cap">'+label+ihtml(help)+'</span>'
   +'<div class="modrow"><span class="stychips" id="'+modeId+'"></span>'
   +'<input type="color" id="'+pickId+'">'
   +'<span class="hint" id="'+modeId+'h"></span></div></div>';
}
/**
 * Default/Custom for a prompt colour. "Default" means the key is absent from the
 * payload so Claude Code uses its own \u2014 and for the background that means no strip at
 * all, so these two options are genuinely different states rather than two colours.
 */
function promptColorMode(hostId,pickId,key,fallbackPalKey){
  var host=$('#'+hostId), pick=$('#'+pickId), hint=$('#'+hostId+'h');
  function cur(){
    if(!ccPayload.um)ccPayload.um={};
    return ccPayload.um[key]||'';
  }
  function chip(label,on,cb){
    var el=document.createElement('span');
    el.className='stychip'+(on?' on':'');el.textContent=label;
    el.addEventListener('click',function(){if(!el.classList.contains('on'))cb();});
    return el;
  }
  function sync(){
    var custom=!!cur();
    host.innerHTML='';
    host.appendChild(chip('Default',!custom,function(){ccPayload.um[key]='';sync();edited();}));
    host.appendChild(chip('Custom',custom,function(){
      ccPayload.um[key]=pick.value||'#ffff00';sync();edited();
    }));
    var shown=cur()||(fallbackPalKey?palHex(activePal()[fallbackPalKey],'#c0caf5'):'#ffff00');
    pick.value=hexOf(shown);
    hint.textContent=custom?'custom'
      :(fallbackPalKey?'the theme\u2019s text colour':'no background strip');
  }
  pick.addEventListener('input',function(){
    if(!ccPayload.um)ccPayload.um={};
    ccPayload.um[key]=this.value;sync();edited();
  });
  sync();
}

function drawWindows(){
  // BEFORE is the machine as it is right now, so it keeps the colours the user already
  // has -- passing it the preset's palette would paint Dracula on both sides and hide
  // the single biggest thing a preset changes.
  $('#winBefore').innerHTML=winHTML(defaultCmux(),ccPayload.p,'senpex-frontend — cmux');
  $('#winAfter').innerHTML=winHTML(state,activePal(),state.titleTemplate||'senpex-frontend — cmux');
  drawFiles();
  drawCmd();
}

// ── the two files, shown verbatim ──────────────────────────────────────────────
// Exact mirror of schemeLines() in _cmux.js. A community preset installs by name; one
// of ours has no theme file to point at, so its colours are written out in full.
function schemeLinesC(s){
  var pre=presetById(s.preset), out=[];
  var themeName=(pre&&pre.theme)||s.theme;
  if(themeName)out.push(['theme',themeName]);
  if(pre&&pre.scheme){
    if(pre.scheme.bg)out.push(['background',pre.scheme.bg]);
    if(pre.scheme.fg)out.push(['foreground',pre.scheme.fg]);
    var a=pre.scheme.ansi;
    if(Object.prototype.toString.call(a)==='[object Array]'){
      for(var i=0;i<a.length&&i<16;i++){
        if(/^#[0-9a-fA-F]{6}$/.test(a[i]))out.push(['palette',i+'='+String(a[i]).toLowerCase()]);
      }
    }
  }
  return out;
}
function ghosttyLines(s,pal){
  var c=cmColors(s,pal), out=[];
  if(s.fontFamily)out.push(['font-family',s.fontFamily]);
  out.push(['font-size',String(s.fontSize)]);
  out.push(['sidebar-font-size',String(s.sidebarFontSize)]);
  out.push(['surface-tab-bar-font-size',String(s.tabBarFontSize)]);
  schemeLinesC(s).forEach(function(kv){out.push(kv);});
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
/**
 * Read a cmux.json back into the controls.
 *
 * The inverse of buildCmuxJson, and deliberately partial: only keys this page owns are
 * mapped, so pasting a config with extra keys does not silently drop them from your
 * head — it just means those keys are not editable here. Colours arrive resolved, so
 * setting one flips its from-palette flag off, which is what the Theme/Custom chips
 * would have done.
 */
function stateFromCmuxJson(j){
  if(!j||typeof j!=='object'||Array.isArray(j))throw new Error('not a JSON object');
  var d=defaultCmux(), n=0;
  function num(v,lo,hi){var x=Number(v);return isFinite(x)?Math.max(lo,Math.min(hi,x)):null;}
  function put(k,v){if(v!==null&&v!==undefined){state[k]=v;n++;}}
  function pickOne(v,list){return list.indexOf(v)>=0?v:null;}
  function hex(v){return (typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v))?v.toLowerCase():null;}
  function bool(v){return typeof v==='boolean'?v:null;}

  if(hex(j.paneBorderColor)){put('paneBorder',hex(j.paneBorderColor));put('paneBorderFromPalette',false);}
  if(hex(j.activePaneBorderColor)){put('activePaneBorder',hex(j.activePaneBorderColor));put('activePaneBorderFromPalette',false);}
  var app=j.app||{};
  put('appearance',pickOne(app.appearance,CMUX_OPTS.appearances));
  put('minimalMode',bool(app.minimalMode));
  put('placement',pickOne(app.newWorkspacePlacement,CMUX_OPTS.placements));
  if(typeof app.windowTitleTemplate==='string')put('titleTemplate',app.windowTitleTemplate.slice(0,60));
  var t=j.terminal||{};
  put('showScrollBar',bool(t.showScrollBar));
  put('copyOnSelect',bool(t.copyOnSelect));
  put('scrollSpeed',num(t.scrollSpeed,0.25,3));
  put('contentAlignment',pickOne(t.sessionContentAlignment,CMUX_OPTS.alignments));
  var sb=j.sidebar||{};
  put('sidebarHideDetails',bool(sb.hideAllDetails));
  put('sidebarDescription',bool(sb.showWorkspaceDescription));
  put('sidebarPullRequests',bool(sb.showPullRequests));
  put('sidebarGitStatus',bool(sb.watchGitStatus));
  put('branchLayout',pickOne(sb.branchLayout,CMUX_OPTS.branchLayouts));
  var sa=j.sidebarAppearance||{};
  put('matchTerminalBg',bool(sa.matchTerminalBackground));
  if(hex(sa.tintColor)){put('tintColor',hex(sa.tintColor));put('tintFromPalette',false);}
  put('tintOpacity',num(sa.tintOpacity,0,1));
  var wc=j.workspaceColors||{};
  put('indicatorStyle',pickOne(wc.indicatorStyle,CMUX_OPTS.indicators));
  if(hex(wc.selectionColor)){put('selectionColor',hex(wc.selectionColor));put('selectionFromPalette',false);}
  if(!n)throw new Error('no settings this page recognises');
  return n;
}

var _jsonDirty=false;
function drawFiles(){
  var pal=activePal();
  var g=ghosttyLines(state,pal).map(function(kv){
    return '<span class="fk">'+esc(kv[0])+'</span> = '+esc(kv[1]);
  }).join('\\n');
  $('#fileGhostty').innerHTML='<h4>~/.config/ghostty/config</h4>'+g;
  // Do not stomp on what someone is halfway through typing. Once they apply or revert
  // it goes back to tracking the controls.
  var ta=$('#jsonEdit');
  if(ta&&!_jsonDirty)ta.value=JSON.stringify(cmuxJsonObj(state,pal),null,2);
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
function edited(){allowDraft=true;drawWindows();paintPresetNote();paintFontNote();themeNote();syncDeps();}

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
 umfg:{t:'Prompt text colour',d:'The colour of the text in the messages YOU send to Claude Code. Default leaves it as the theme\u2019s normal text colour. This is a Claude Code setting rather than a cmux one, but the same install command applies it.'},
 umbg:{t:'Prompt highlight',d:'A solid background strip behind your own messages \u2014 the thing that makes them stand out from Claude\u2019s replies as you scroll back. Default means no strip at all, so Default and Custom here are two different states rather than two colours.'},
 umb:{t:'Prompt border',d:'A border around your own messages. In the terminal this is drawn out of box-drawing CHARACTERS, so it costs a whole row above and below rather than being a thin line, and the preview draws it that way. The three topBottom styles are the ones the mock can show honestly at this width; the full-box styles still install.'},
 umbold:{t:'Bold prompts',d:'Renders your own messages in bold. Combines with the colours above.'},
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

// ── the preset picker ─────────────────────────────────────────────────────────
// Community and example are separated rather than mixed with a badge alone, because
// the distinction is a claim about provenance and the user asked to be able to tell
// which is which at a glance.
function paintPresets(){
  var host=$('#presetGrid');
  host.innerHTML='';

  function headRow(title,sub){
    var h=document.createElement('div');h.className='pgroup';
    h.appendChild(document.createTextNode(title));
    var sp=document.createElement('span');sp.textContent=sub;h.appendChild(sp);
    return h;
  }

  function chip(pre){
    var b=document.createElement('button');
    b.type='button';b.className='pchip'+(state.preset===pre.id?' on':'');
    b.setAttribute('data-preset',pre.id);
    b.setAttribute('aria-pressed',state.preset===pre.id?'true':'false');

    // The strip below the name IS the theme: its own background, its own foreground,
    // its own accents. Nothing here is a stand-in colour.
    var pal=pre.pal||ccPayload.p;
    var sw=document.createElement('div');
    sw.className='pcswatch';
    sw.style.background=palHex(pal.bg,'#0b0e14');
    ['accent','green','red','yellow','accent2'].forEach(function(k){
      var d=document.createElement('span');d.className='dot';
      d.style.background=palHex(pal[k],'#888');sw.appendChild(d);
    });
    var samp=document.createElement('span');
    samp.className='sample';samp.textContent='\u276F claude';
    samp.style.color=palHex(pal.text,'#ccc');
    sw.appendChild(samp);

    var body=document.createElement('div');body.className='pcbody';
    var nm=document.createElement('div');nm.className='pcname';
    nm.appendChild(document.createTextNode(pre.name));
    var tag=document.createElement('span');
    tag.className='pctag'+(pre.kind==='example'?' mine':'');
    tag.textContent=pre.kind==='example'?'example':'community';
    nm.appendChild(tag);
    body.appendChild(nm);
    if(pre.blurb){var bl=document.createElement('div');bl.className='pcblurb';bl.textContent=pre.blurb;body.appendChild(bl);}
    if(pre.credit){var cr=document.createElement('div');cr.className='pccredit';cr.textContent=pre.credit;body.appendChild(cr);}

    b.appendChild(sw);b.appendChild(body);
    b.addEventListener('click',function(){applyPreset(pre.id);});
    return b;
  }

  var community=CMUX_PRESETS.filter(function(p){return p.kind==='community';});
  var mine=CMUX_PRESETS.filter(function(p){return p.kind==='example';});

  // "None" first: it is the BEFORE state and the way back out of a preset.
  host.appendChild(headRow('No theme','leave the terminal colours you already have'));
  var none=document.createElement('button');
  none.type='button';none.className='pchip'+(state.preset?'':' on');
  none.setAttribute('aria-pressed',state.preset?'false':'true');
  var nb=document.createElement('div');nb.className='pcbody';
  var nn=document.createElement('div');nn.className='pcname';
  nn.textContent='Keep my colours';nb.appendChild(nn);
  var nbl=document.createElement('div');nbl.className='pcblurb';
  nbl.textContent='cmux chrome follows your Claude Code theme; the terminal keeps whatever Ghostty theme you already set.';
  nb.appendChild(nbl);
  none.appendChild(nb);
  none.addEventListener('click',function(){applyPreset('');});
  host.appendChild(none);

  // Ours goes first, above the community themes, because it is the shortest list and
  // the one you came back for.
  var mineSaved=ours_get();
  host.appendChild(headRow('Our Community',
    mineSaved.length
      ? mineSaved.length+' saved in this browser \u2014 share a link to pass one on'
      : 'nothing saved yet \u2014 build a look and press Save'));
  host.appendChild(saveCard());

  mineSaved.forEach(function(item){
    var b=document.createElement('button');
    b.type='button';b.className='pchip';
    var pal=item.pal||ccPayload.p;
    var sw=document.createElement('div');
    sw.className='pcswatch';
    sw.style.background=palHex(pal.bg,'#0b0e14');
    ['accent','green','red','yellow','accent2'].forEach(function(k){
      var d=document.createElement('span');d.className='dot';
      d.style.background=palHex(pal[k],'#888');sw.appendChild(d);
    });
    var samp=document.createElement('span');
    samp.className='sample';samp.textContent='\u276F claude';
    samp.style.color=palHex(pal.text,'#ccc');
    sw.appendChild(samp);

    var body=document.createElement('div');body.className='pcbody';
    var nm=document.createElement('div');nm.className='pcname';
    nm.appendChild(document.createTextNode(item.name));
    var tag=document.createElement('span');tag.className='pctag ours';tag.textContent='saved';
    nm.appendChild(tag);
    body.appendChild(nm);
    var cr=document.createElement('div');cr.className='pccredit';
    cr.textContent='saved '+(item.savedAt||'');
    body.appendChild(cr);

    var acts=document.createElement('div');acts.className='ouracts';
    function act(label,fn){
      var a=document.createElement('span');
      a.className='ouract';a.textContent=label;
      a.addEventListener('click',function(e){e.stopPropagation();fn();});
      return a;
    }
    acts.appendChild(act('share',function(){
      copyText(ORIGIN+'/cmux?c='+encodeURIComponent(b64e(item.payload)));
      toast('Link to \u201c'+item.name+'\u201d copied');
    }));
    acts.appendChild(act('delete',function(){
      ours_set(ours_get().filter(function(x){return x.name!==item.name;}));
      paintPresets();toast('Removed \u201c'+item.name+'\u201d');
    }));
    body.appendChild(acts);

    b.appendChild(sw);b.appendChild(body);
    b.addEventListener('click',function(){
      // Load the whole saved setup, both halves.
      ccPayload=copyObj(item.payload);
      var d=defaultCmux(), src=item.payload.cm||{};
      for(var k in d){if(ownKey(d,k)&&ownKey(src,k))d[k]=src[k];}
      d.on=true;state=d;
      allowDraft=true;_jsonDirty=false;
      buildControls();paintPresets();drawWindows();paintFontNote();themeNote();syncDeps();
      toast('Loaded \u201c'+item.name+'\u201d');
    });
    host.appendChild(b);
  });

  if(community.length){
    host.appendChild(headRow('Popular in the community',community.length+' schemes cmux already ships'));
    community.forEach(function(p){host.appendChild(chip(p));});
  }
  if(mine.length){
    host.appendChild(headRow('Example themes',
      mine.length+' made for this site, written out in full'));
    mine.forEach(function(p){host.appendChild(chip(p));});
  }
  paintPresetNote();
}

function paintPresetNote(){
  var el=$('#presetNote'),pre=presetById(state.preset);
  if(!pre){
    el.innerHTML='<b>No theme selected.</b> The install leaves your Ghostty colours alone '
      +'and derives the cmux chrome from your Claude Code palette.';
    return;
  }
  var pal=pre.pal||ccPayload.p;
  var ratio=contrastRatio(pal.text,pal.bg),cmt=contrastRatio(pal.comment,pal.bg);
  var how=pre.theme
    ? 'installs as <span class="mono">theme = '+esc(pre.theme)+'</span>, a scheme cmux already ships'
    : 'writes its background, foreground and all sixteen ANSI colours into your Ghostty config';
  el.innerHTML='<b>'+esc(pre.name)+'</b> \u2014 '+how+'.'
    +(pre.credit?' <span class="cr">'+esc(pre.credit)+'</span>':'')
    +(pre.evidence?'<br><span class="cr">'
       +(pre.kind==='community'?'Why it is here: ':'')+esc(pre.evidence)+'</span>':'')
    +'<br>Body text '+ratio.toFixed(1)+':1 on its background, dimmed text '+cmt.toFixed(1)+':1. '
    +(ratio<4.5?'Below the 4.5:1 readability guideline \u2014 that is how its author made it.'
              :(cmt<3?'Comments sit under 3:1, which is the author\u2019s choice, not a mistake here.'
                    :'Both clear the usual readability guidelines.'));
}

// WCAG relative luminance and contrast, so the page can state a real number rather
// than an adjective. Same formula the extraction tool uses.
function relLum(t){
  var c=(t||[0,0,0]).map(function(v){
    var x=Math.max(0,Math.min(255,v))/255;
    return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);
  });
  return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
}
function contrastRatio(a,b){
  var l1=relLum(a),l2=relLum(b);
  if(l2>l1){var t=l1;l1=l2;l2=t;}
  return (l1+0.05)/(l2+0.05);
}

/**
 * Apply a preset: its colours, plus the settings it deliberately changes.
 *
 * Only the keys the preset names are touched. Anything the user already changed and
 * the preset does not mention survives, because a preset is a starting point and
 * silently resetting the rest of someone's work would be the wrong trade.
 */
function applyPreset(id){
  state.preset=id||'';
  var pre=presetById(state.preset);
  if(pre){
    // The preset's own theme takes over from anything typed in the Ghostty theme box,
    // otherwise two theme directives would race and the typed one would win silently.
    state.theme='';
    var over=pre.cm||{};
    for(var k in over){
      if(Object.prototype.hasOwnProperty.call(over,k)
        && Object.prototype.hasOwnProperty.call(CMUX_DEFAULTS,k)) state[k]=over[k];
    }
  }
  allowDraft=true;
  buildControls();      // rebuild so the changed controls show their new values
  paintPresets();
  drawWindows();
  paintFontNote();themeNote();
  syncDeps();
  toast(pre?(pre.name+' applied \u2014 tweak anything below'):'Back to your own colours');
}

function buildControls(){
  var s=state,O=CMUX_OPTS;
  $('#cmuxControls').innerHTML=
  '<div class="panel"><h3>\\u{1F5A5} Terminal (Ghostty)</h3>'
   +row('Terminal font','fontFamily',selHTML('m_font',O.fonts,s.fontFamily)
       +'<span class="hint" id="fontnote" style="display:block;margin-top:5px"></span>')
   +'<div class="inline2">'
   +row('Font size <span class="hint" id="m_fsl"></span>','fontSize','<input id="m_fs" type="range" min="8" max="32" step="1" value="'+s.fontSize+'">')
   +row('Sidebar font <span class="hint" id="m_sfl"></span>','sidebarFontSize','<input id="m_sf" type="range" min="8" max="24" step="1" value="'+s.sidebarFontSize+'">')
   +'</div>'
   +'<div class="inline2">'
   +row('Tab bar font <span class="hint" id="m_tfl"></span>','tabBarFontSize','<input id="m_tf" type="range" min="8" max="20" step="1" value="'+s.tabBarFontSize+'">')
   +row('Ghostty theme <span class="hint">(optional)</span>','theme','<input id="m_theme" type="text" maxlength="40" placeholder="leave blank" value="'+esc(s.theme)+'" list="themelist">'
       +'<datalist id="themelist">'+CMUX_PRESETS.filter(function(p){return p.theme;})
         .map(function(p){return '<option value="'+esc(p.theme)+'">';}).join('')+'</datalist>'
       +'<span class="hint" id="themenote" style="display:block;margin-top:5px"></span>')
   +'</div>'
   +'<div class="inline2">'
   +row('Background opacity <span class="hint" id="m_bol"></span>','bgOpacity','<input id="m_bo" type="range" min="0.3" max="1" step="0.02" value="'+s.bgOpacity+'">')
   +row('Background blur <span class="hint" id="m_bbl"></span>','bgBlur','<input id="m_bb" type="range" min="0" max="64" step="2" value="'+s.bgBlur+'">')
   +'</div>'
   +row('Scrollback limit <span class="hint" id="m_sbl"></span><span class="nov">no visual change</span>','scrollback','<input id="m_sb" type="range" min="1000000" max="100000000" step="1000000" value="'+s.scrollback+'">')
  +'</div>'
  +'<div class="panel"><h3>\\u{1F3A8} Window &amp; panes</h3>'
   +'<div class="inline2">'
   +row('App appearance','appearance',selHTML('m_appear',O.appearances,s.appearance))
   +row('New workspace position<span class="nov">no visual change</span>','placement',selHTML('m_place',O.placements,s.placement))
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
  +'<div class="panel"><h3>\u{1F4AC} Your prompts</h3>'
   +'<p class="phint" style="margin-bottom:9px">The messages you type to Claude Code. '
   +'These live on the Claude Code side of the setup rather than in cmux \u2014 but they '
   +'are the most visible thing inside the window, so they are here too, and the same '
   +'install command applies them.</p>'
   +promptColorRow('Text colour','umfg','pm_fgm','pm_fg')
   +promptColorRow('Highlight / background strip','umbg','pm_bgm','pm_bg')
   +row('Border','umb',selHTML('pm_ub',PROMPT_BORDERS,String(ccPayload.ub||'none')))
   +'<div class="ctl"><span class="cap">Border colour</span>'
   +'<div class="modrow"><input type="color" id="pm_uc" value="'+esc(hexOf(ccPayload.uc||'#7aa2f7'))+'"></div></div>'
   +'<label class="ctl2"><input type="checkbox" id="pm_bold"'
   +(((ccPayload.um&&ccPayload.um.st)||[]).indexOf('bold')>=0?' checked':'')+'> bold prompts'
   +ihtml('umbold')+'</label>'
  +'</div>'
  +'<div class="panel"><h3>\\u2328 Terminal behaviour</h3>'
   +chk('show scroll bar','showScrollBar','m_ssb',s.showScrollBar)
   +chk('copy on select<span class="nov">no visual change</span>','copyOnSelect','m_cos',s.copyOnSelect)
   +'<div class="inline2">'
   +row('Scroll speed <span class="hint" id="m_ssl"></span><span class="nov">no visual change</span>','scrollSpeed','<input id="m_ss" type="range" min="0.25" max="3" step="0.05" value="'+s.scrollSpeed+'">')
   +row('Content alignment<span class="nov">only in a wide pane</span>','contentAlignment',selHTML('m_align',O.alignments,s.contentAlignment))
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
  $('#m_theme').addEventListener('input',function(){
    state.theme=this.value;
    // A typed theme name and a preset both emit a theme= directive. Rather than let
    // one win invisibly, typing takes over and the preset is released.
    if(this.value&&state.preset){state.preset='';paintPresets();}
    edited();
  });
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

  // The prompt controls edit ccPayload, not state: they belong to the Claude Code half
  // of the setup. Editing them still repaints the mock and rebuilds the install command,
  // which is what edited() does either way.
  promptColorMode('pm_fgm','pm_fg','fg','text');
  promptColorMode('pm_bgm','pm_bg','bg','');
  $('#pm_ub').addEventListener('change',function(){ccPayload.ub=this.value;edited();});
  $('#pm_uc').addEventListener('input',function(){ccPayload.uc=hexToRgbStrC(this.value);edited();});
  $('#pm_bold').addEventListener('change',function(){
    if(!ccPayload.um)ccPayload.um={};
    var st=(ccPayload.um.st||[]).filter(function(x){return x!=='bold';});
    if(this.checked)st.push('bold');
    ccPayload.um.st=st;edited();
  });

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
  function themeHex(){return palHex(activePal()[palKey],state[valKey]);}
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

// ── pin and resize the preview ────────────────────────────────────────────────
// Adjusting a control you cannot see the effect of is the whole problem with a long
// settings page. Pinning sticks the window mock to the top of the viewport so the
// controls scroll underneath it; the handle under the mock decides how much of the
// screen it gets. Both live in installPreviewDock(), shared with the Studio.
//
// Unpinned by default, unlike the Studio: this mock is a whole terminal window with
// a sidebar and two panes, and at its natural height it leaves a phone with nothing
// but chrome on screen. Whatever you last chose is remembered under scc_cmux_pin.
installPreviewDock({dock:'#pair',grip:'#dockgrip',pin:'#pinbtn',
  term:'.cterm',key:'cmux',pinDefault:false});

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
paintPresets();
drawWindows();
paintFontNote();themeNote();
syncDeps();

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
  buildControls();paintPresets();drawWindows();paintFontNote();themeNote();syncDeps();
  clearTimeout(_urlT);history.replaceState(null,'','/cmux');
  toast('Back to stock cmux');
});
// ── the editable cmux.json ────────────────────────────────────────────────────
// Editing the generated file directly is the fastest way to move a config in from
// somewhere else, or to reach a key faster than hunting for its control. Applying it
// runs the same sanitizers the controls do, so nothing typed here can produce a config
// the installer would not have produced anyway.
(function(){
  var ta=$('#jsonEdit'), msg=$('#jsonMsg');
  if(!ta)return;
  function say(text,kind){
    msg.textContent=text||'';
    msg.className='jsonmsg'+(kind?' '+kind:'');
  }
  ta.addEventListener('input',function(){
    _jsonDirty=true;
    try{
      JSON.parse(this.value);
      say('Valid JSON \u2014 Apply to load it into the controls.','ok');
    }catch(e){
      // Doubled, because this regex is written inside a template literal: a single
      // backslash is eaten there and the class reaches the browser as a literal "s".
      say(String(e.message).replace(/^JSON.parse:?\\s*/i,'').slice(0,90),'bad');
    }
  });
  $('#jsonApply').addEventListener('click',function(){
    var parsed;
    try{parsed=JSON.parse(ta.value);}
    catch(e){say('Cannot apply: '+String(e.message).slice(0,80),'bad');return;}
    var n;
    try{n=stateFromCmuxJson(parsed);}
    catch(e){say('Cannot apply: '+e.message,'bad');return;}
    _jsonDirty=false;
    // Colours came in resolved, so the preset's palette no longer describes them.
    buildControls();paintPresets();drawWindows();paintFontNote();themeNote();syncDeps();
    say('Applied '+n+' setting'+(n===1?'':'s')+' to the controls.','ok');
    toast('cmux.json applied \u2014 '+n+' setting'+(n===1?'':'s'));
  });
  $('#jsonRevert').addEventListener('click',function(){
    _jsonDirty=false;drawFiles();say('Back to what the controls say.','');
  });
})();

// ── Our Community ─────────────────────────────────────────────────────────────
// Saved setups, kept in this browser under the same localStorage convention the
// Studio's Publish button already uses. They are yours until you hand someone the
// link — which is what the Share button on each card is for — so the section says
// where they live rather than implying a server keeps them.
function ours_get(){
  try{
    var a=JSON.parse(localStorage.getItem('scc_cmux_saved')||'[]');
    return Object.prototype.toString.call(a)==='[object Array]'?a:[];
  }catch(e){return [];}
}
function ours_set(a){try{localStorage.setItem('scc_cmux_saved',JSON.stringify(a));}catch(e){}}

// The card that saves one, in two states: a button, and the button replaced by a name
// field. It used to call prompt() instead, which is a synchronous modal \u2014 the browser
// counts every second that dialog is open as time your click handler spent blocking the
// main thread, so naming a setup at human speed reported a ~6s interaction and Chrome
// flagged the page for it. Nothing was actually slow; the dialog just cannot be
// measured any other way. An inline field returns to the event loop immediately.
//
// A <div>, not the <button> this used to be: an <input> inside a <button> is invalid
// HTML, and browsers will not reliably let you focus or type into one.
function saveCard(){
  var card=document.createElement('div');
  card.className='pchip savechip';
  var body=document.createElement('div');
  body.className='pcbody';
  card.appendChild(body);

  function idle(){
    body.textContent='';
    var b=document.createElement('button');
    b.type='button';b.className='savecta';
    b.textContent='\uff0b  Save this setup';
    var bl=document.createElement('div');bl.className='pcblurb';
    bl.textContent='Keeps the whole thing \u2014 cmux settings, colours and your Claude Code side.';
    body.appendChild(b);body.appendChild(bl);
    b.addEventListener('click',naming);
  }

  function naming(){
    body.textContent='';
    var lab=document.createElement('label');
    lab.className='pcname';lab.setAttribute('for','oursName');
    lab.textContent='Name this setup';
    var inp=document.createElement('input');
    inp.type='text';inp.id='oursName';inp.className='saveinput';
    inp.setAttribute('maxlength','40');
    inp.setAttribute('autocomplete','off');
    inp.value=ccPayload.n||'My cmux setup';
    var row=document.createElement('div');row.className='saverow';
    var go=document.createElement('button');
    go.type='button';go.className='savego';go.textContent='Save';
    var no=document.createElement('button');
    no.type='button';no.className='saveno';no.textContent='Cancel';
    row.appendChild(go);row.appendChild(no);
    body.appendChild(lab);body.appendChild(inp);body.appendChild(row);

    function commit(){
      var n=(inp.value||'').trim();
      if(!n){inp.focus();return;}
      commitSave(n);
    }
    go.addEventListener('click',commit);
    no.addEventListener('click',idle);
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();commit();}
      else if(e.key==='Escape'){e.preventDefault();idle();}
    });
    // Safe here and not in idle(): naming() only ever runs from a click, by which
    // point the card is in the document. focus() on a detached node does nothing.
    inp.focus();inp.select();
  }

  idle();
  return card;
}

function commitSave(name){
  var pl=payload();
  pl.n=name.slice(0,40);
  var all=ours_get().filter(function(x){return x.name!==pl.n;});
  all.push({
    name: pl.n,
    savedAt: new Date().toISOString().slice(0,10),
    pal: copyObj(activePal()),
    payload: pl
  });
  ours_set(all);
  // Repaints the grid, which rebuilds this card in its idle state.
  paintPresets();
  toast('Saved \u201c'+pl.n+'\u201d to Our Community');
}

installMobileNav();
`;

module.exports = { renderCmux, CMUX_CSS };
