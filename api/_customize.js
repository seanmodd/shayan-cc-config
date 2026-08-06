// The customizer studio: interactive BEFORE / AFTER terminals + deep controls.
const { EXPAND_SRC } = require('./_theme.js');
const { topBar, navPayload } = require('./_nav.js');
const { TERM_SRC, TERM_CSS, previewColors, paletteSeedHex } = require('./_term.js');

// Client entry for each preset: exact preview colors + full config for the
// BEFORE terminal, plus 14 hex swatches to seed the editor ("start from").
function studioPreset(DATA, p) {
  const dark = DATA.defaultThemes.find(t => t.id === 'dark') || DATA.defaultThemes[0];
  const theme = p.theme || dark;
  return {
    id: p.id, name: p.name, author: p.author,
    statuslineColor: p.statuslineColor,
    verbs: p.thinkingVerbs.verbs.slice(0, 16),
    verbFormat: p.thinkingVerbs.format,
    phases: p.thinkingStyle.phases,
    reverseMirror: p.thinkingStyle.reverseMirror,
    interval: Math.max(p.thinkingStyle.updateInterval, 60),
    umd: p.userMessageDisplay,
    pv: previewColors(theme.colors),
    seed: paletteSeedHex(theme.colors),
  };
}

const STUDIO_CSS = `
  .swrap{max-width:1440px;margin:0 auto;padding:0 22px 80px;}
  /* Sticky is now a choice rather than the only option — see .pinbtn below. The
     Studio defaults to pinned because watching the AFTER pane react is the whole
     point of the page, but a preview that owns the top of the screen is exactly
     wrong when you are reading a long control panel, so it comes off. */
  .terms{position:relative;z-index:40;background:var(--bg);padding:14px 0 16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  body.pinned .terms{position:sticky;top:var(--switch-h,46px);box-shadow:0 18px 22px -14px rgba(0,0,0,.65);}
  /* Matched specificity, or the pinned rule above would out-rank this and stick a
     full-height terminal to the top of a narrow screen. */
  @media(max-width:980px){
    .terms{grid-template-columns:1fr;}
    body.pinned .terms{position:static;box-shadow:none;}
  }
  .tcol{display:flex;flex-direction:column;gap:8px;min-width:0;}
  .tcol .xterm{height:clamp(300px,44vh,520px);}
  /* Dragged height wins over every breakpoint default, including .xterm's own
     min-height:300px — you asked for 140px, you get 140px. */
  body.docked .tcol .xterm{height:var(--dock-h);min-height:0;}
  .tbadge{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);}
  .tbadge b{color:var(--text);letter-spacing:.02em;}
  .tbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;font-size:10.5px;letter-spacing:.04em;}
  .pill.aft{border-color:var(--accent);color:var(--accent);}
  .toolrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 16px;}
  .toolrow .lbl{font-size:11.5px;color:var(--faint);text-transform:uppercase;letter-spacing:.09em;margin-right:2px;}
  .chipbtn{cursor:pointer;font-size:12.5px;border:1px solid var(--border);background:#10141b;color:var(--dim);border-radius:20px;padding:7px 13px;transition:all .15s;font-family:ui-monospace,Menlo,monospace;}
  .chipbtn:hover{border-color:var(--accent);color:var(--text);transform:translateY(-1px);}
  .panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;align-items:start;}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:16px 16px 14px;}
  .panel h3{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin:0 0 12px;display:flex;align-items:center;gap:7px;}
  .ctl{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--dim);margin-bottom:11px;}
  .ctl input[type=text],.ctl input[type=number],.ctl select,.ctl textarea,textarea{background:#0b0e14;border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px 10px;font-size:13px;font-family:inherit;width:100%;}
  textarea{resize:vertical;font-family:ui-monospace,Menlo,monospace;line-height:1.5;}
  .ctl2{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dim);margin:4px 0 10px;cursor:pointer;}
  .ctl2 input{accent-color:var(--accent);}
  .inline2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .inline3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
  .hint{color:var(--faint);text-transform:none;letter-spacing:0;font-size:11px;font-weight:400;}
  .cap{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
  .i{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;flex:none;border:1px solid var(--border);background:#10141b;color:var(--faint);border-radius:50%;font:italic 700 10px/1 Georgia,serif;cursor:help;padding:0;margin-left:2px;}
  .i:hover,.i.on{border-color:var(--accent);color:var(--accent);background:rgba(122,162,247,.12);}
  /* A 15px circle is a 15px tap target. Expand the hit area without growing
     the mark, so the label line does not gain height. */
  .i{position:relative;}
  .i::after{content:'';position:absolute;left:50%;top:50%;width:40px;height:40px;transform:translate(-50%,-50%);}
  .i:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
  .tip{position:absolute;z-index:200;width:330px;max-width:calc(100vw - 24px);background:#0b0e14;border:1px solid var(--accent);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.55;color:var(--text);box-shadow:0 16px 38px rgba(0,0,0,.65);}
  .tip b{display:block;color:var(--accent);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
  .modrow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
  .modrow .stychips{margin-bottom:0;}
  .modrow input[type=color]{width:34px;height:26px;border:1px solid var(--border);border-radius:6px;background:#0b0e14;padding:2px;cursor:pointer;flex:none;}
  .swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .sw{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--dim);}
  .sw input[type=color]{width:34px;height:26px;border:1px solid var(--border);border-radius:6px;background:#0b0e14;padding:2px;cursor:pointer;flex:none;}
  .stychips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:11px;}
  .stychip{cursor:pointer;font-size:12px;border:1px solid var(--border);border-radius:7px;padding:6px 11px;color:var(--dim);user-select:none;transition:all .12s;}
  .stychip.on{border-color:var(--accent);color:var(--accent);background:rgba(122,162,247,.08);}
  .colorrow{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--dim);margin-bottom:11px;flex-wrap:wrap;}
  .colorrow input[type=color]{width:34px;height:26px;border:1px solid var(--border);border-radius:6px;background:#0b0e14;padding:2px;cursor:pointer;}
  .seglist{display:flex;flex-direction:column;gap:5px;margin-bottom:11px;}
  .segrow{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dim);border:1px solid var(--border);border-radius:8px;padding:6px 9px;background:#0b0e14;}
  .segrow.on{color:var(--text);border-color:#2a3446;}
  .segrow input{accent-color:var(--accent);}
  .segrow .nm{flex:1;}
  .segrow button{cursor:pointer;background:none;border:1px solid var(--border);border-radius:6px;color:var(--dim);font-size:11px;padding:2px 7px;}
  .segrow button:hover{border-color:var(--accent);color:var(--accent);}
  /* touch-action:none only here, so dragging the handle reorders while a swipe
     anywhere else on the row still scrolls the page. */
  .seghandle{touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;
    color:var(--faint);font-size:14px;line-height:1;flex:none;min-width:26px;min-height:26px;
    display:inline-flex;align-items:center;justify-content:center;}
  .seghandle:active{cursor:grabbing;color:var(--accent);}
  .ghosthandle{visibility:hidden;}
  .segrow.dragging{border-color:var(--accent);background:#141a24;opacity:.92;
    box-shadow:0 8px 20px rgba(0,0,0,.55);}
  .barbot{position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(13,16,22,.96);backdrop-filter:blur(10px);border-top:1px solid var(--border);padding:11px 22px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
  .barbot .cmd{flex:1 1 340px;display:flex;align-items:center;gap:8px;background:#0b0e14;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;color:#b7c3d6;overflow-x:auto;white-space:nowrap;font-family:ui-monospace,Menlo,monospace;scrollbar-width:thin;}
  .barbot .cmd .dollar{color:var(--ok);}
  .barbot button{cursor:pointer;border-radius:9px;padding:10px 15px;font-size:13px;font-weight:600;border:1px solid var(--border);background:#161c26;color:var(--text);transition:all .15s;white-space:nowrap;}
  .barbot button:hover{transform:translateY(-1px);}
  #c_copy{background:linear-gradient(90deg,#7aa2f7,#bb9af7);color:#0a0c10;border:none;}
  #c_publish{background:linear-gradient(90deg,#e5c07b,#e0a060);color:#0a0c10;border:none;}
  .minilinks{font-size:11px;color:var(--faint);width:100%;}
  .minilinks a{color:var(--dim);}
  select.tsel{background:#0b0e14;border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;padding:3px 6px;max-width:170px;}
  /* The BEFORE/AFTER switch. Hidden on desktop, where both panes fit side by
     side; on a phone two 366px terminals cannot, and stacking them costs ~950px
     of scrolling before the first control. One pane at a time, one tap to
     compare. */
  .paneswitch{display:none;}
  .pswbtn{appearance:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;
    letter-spacing:.04em;text-transform:uppercase;border:1px solid var(--border);
    background:#10141b;color:var(--dim);border-radius:10px;min-height:44px;padding:0 10px;}
  .pswbtn.on{border-color:var(--accent);color:var(--accent);background:rgba(122,162,247,.12);}

  /* ── the preview dock's own two controls ──────────────────────────────────
     Shared with /cmux, which renders the same row above its window mock. The
     behaviour behind both lives in installPreviewDock(). */
  .switchrow{display:flex;align-items:center;gap:10px;margin-bottom:2px;}
  .switchrow .paneswitch{flex:1;}
  /* Pinned, the row sticks above the preview so the button that unpins is still
     reachable — it is the one control you want when a pinned preview is in the way.
     z-index sits above the preview's own, and the background keeps the controls
     scrolling underneath from showing through. --switch-h is published by
     installPreviewDock(); the fallback covers the moment before the script runs. */
  body.pinned .switchrow{position:sticky;top:0;z-index:46;background:var(--bg);
    padding:8px 0 4px;margin-bottom:0;}
  .pinbtn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;
    font-size:12.5px;font-weight:600;letter-spacing:.02em;border:1px solid var(--border);
    background:#10141b;color:var(--dim);border-radius:10px;padding:0 12px;min-height:38px;
    white-space:nowrap;transition:all .14s;}
  .pinbtn:hover{border-color:var(--accent);color:var(--text);}
  .pinbtn.on{border-color:var(--accent);color:var(--accent);background:rgba(122,162,247,.12);}
  .pinbtn .pico{font-size:13px;}
  /* The resize handle. grid-column:1/-1 because it is a child of the preview grid
     itself — that way it stays glued to the bottom edge of the preview and rides
     along inside the sticky region when the preview is pinned. */
  .dockgrip{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:9px;
    width:100%;height:20px;margin:1px 0 0;padding:0;border:none;background:transparent;
    color:var(--faint);cursor:ns-resize;border-radius:8px;
    transition:color .14s,background .14s;
    user-select:none;-webkit-user-select:none;
    /* Without this a touch-drag scrolls the page instead of resizing. */
    touch-action:none;}
  .dockgrip:hover,.dockgrip:focus-visible{color:var(--accent);background:rgba(122,162,247,.09);}
  .dockgrip:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
  .dockgrip .gbar{height:3px;flex:0 1 54px;border-radius:3px;background:currentColor;opacity:.5;}
  .dockgrip .gtxt{font-size:10px;letter-spacing:.09em;text-transform:uppercase;
    white-space:nowrap;opacity:0;transition:opacity .14s;}
  .dockgrip:hover .gtxt,.dockgrip:focus-visible .gtxt{opacity:.9;}
  /* Mid-drag the pointer is nowhere near the 20px handle, so the resize cursor and
     the selection lock have to live on the whole document instead. */
  body.dockdrag{cursor:ns-resize;user-select:none;-webkit-user-select:none;}
  body.dockdrag .dockgrip{color:var(--accent);background:rgba(122,162,247,.09);}

  /* Phones — by width OR by height. A phone in landscape is 844x390: a width-only
     breakpoint left it on the desktop layout, stacking two 698px terminals into
     390px of viewport. The comma is an OR in CSS media queries.
     The ordering matters: this block is the last word on layout, so anything above
     it that assumes width gets corrected here. */
  @media(max-width:700px),(max-height:520px){
    .paneswitch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 10px;}
    /* Stacked, both full width: a 390px row cannot hold a two-button switch and a
       "Preview pinned" chip side by side. The switch's own bottom margin would
       double up with the row gap, so it goes. */
    .switchrow{flex-wrap:wrap;gap:7px;}
    .switchrow .paneswitch{flex:1 1 100%;margin-bottom:0;}
    .pinbtn{flex:1 1 100%;justify-content:center;min-height:44px;}
    /* A 20px target is a miss on a touchscreen, and there is no hover to reveal the
       label, so it stays visible. */
    .dockgrip{height:34px;}
    .dockgrip .gtxt{opacity:.75;}
    .terms{gap:0;}
    .terms[data-pane="after"] .tcol-before{display:none;}
    .terms[data-pane="before"] .tcol-after{display:none;}
    /* dvh after vh: on iOS Safari, vh is the LARGEST viewport height, so a vh-sized
       terminal is taller than what you can actually see while the toolbars are up.
       Browsers that do not know dvh ignore the second declaration. */
    .tcol .xterm{height:min(46vh,360px);height:min(46dvh,360px);}
    /* 12.5px monospace fits ~45 characters across a 390px phone, which mangles
       almost every line of a real transcript. 10px fits ~58. */
    .terms .xbody,.terms .xfoot{font-size:10px;line-height:1.7;}
    .terms .xbody{padding:9px 10px 9px;}
    .terms .xstatus,.terms .xmode{font-size:9.5px;}
    /* 16px, not 10px: iOS Safari zooms the whole page when you focus an input
       smaller than 16px and does not zoom back out afterwards, which leaves the
       page scaled and horizontally scrollable. Typing into either terminal is a
       headline feature here, so the prompt line runs a little larger than the
       transcript above it rather than booby-trapping the first tap. */
    .terms .xinput{font-size:16px;}
    .terms .xinbox .xchev{font-size:14px;}
    .terms .xtag{display:none;}
    /* Selects zoom the page on focus below 16px too, same as text inputs. */
    select.tsel{font-size:16px;max-width:150px;padding:6px 8px;}

    /* Panels and rows go single-column; two number inputs side by side on a
       phone are two unusable number inputs. */
    .inline2,.inline3{grid-template-columns:1fr!important;}
    .swatches{grid-template-columns:1fr 1fr;}
    .panel{padding:14px 13px 12px;}
    .ctl2{margin:6px 0 12px;}

    /* Touch targets. Apple's floor is 44px and nearly every control here was
       31-37px. */
    .ctl input[type=text],.ctl input[type=number],.ctl select,.ctl textarea{
      min-height:44px;font-size:16px;}
    .ctl textarea{min-height:120px;}
    .ctl2 input[type=checkbox]{width:22px;height:22px;}
    .stychip{padding:10px 13px;min-height:40px;display:inline-flex;align-items:center;}
    .chipbtn{min-height:44px;padding:0 14px;}
    .sw input[type=color]{width:42px;height:34px;}
    .modrow input[type=color]{width:46px;height:38px;}
    .segrow{padding:8px 10px;min-height:48px;}
    .segrow button{min-width:40px;min-height:40px;font-size:13px;}
    .seghandle{min-width:40px;min-height:40px;font-size:19px;}
    .segrow input[type=checkbox]{width:22px;height:22px;}

    /* Header and intro: on a phone the intro paragraph alone was a full screen. */
    header h1{font-size:24px!important;}
    /* The brand wrapped onto two lines and pushed the header taller than the
       buttons beside it. */
    .top .brand{font-size:13px;white-space:nowrap;}
    .top{gap:8px;}
    .iconbtn{min-height:40px;display:inline-flex;align-items:center;}
    /* The intro was six lines — most of a phone screen before any content. */
    .sub{font-size:12px;line-height:1.6;}
    header{padding-bottom:0!important;}
    .tbadge{font-size:10px;gap:6px;}
    .tbadge span:last-child{display:none;}
    .toolrow{margin:2px 0 12px;}
  }

  /* 320px (iPhone SE) could not fit brand + Home + GitHub across the header, and
     the overflow put the whole page into horizontal scroll. The navigator carries
     a Gallery entry, so the Home link is the redundant one to drop. */
  @media(max-width:380px){
    .top{gap:6px;padding-left:12px;padding-right:12px;}
    .brand{min-width:0;overflow:hidden;text-overflow:ellipsis;}
    .top a.iconbtn[href="/"]{display:none;}
    .pswbtn{font-size:12px;}
  }

  /* The fixed action bar is generous on desktop; on phones it has to earn its
     height back so the terminals stay readable. */
  @media(max-width:640px),(max-height:520px){
    .swrap{padding:0 12px 40px;}
    /* Without the safe-area inset the bottom row of buttons sits under the home
       indicator on a notched iPhone. */
    .barbot{padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));gap:7px;}
    .barbot .cmd{flex:1 1 100%;order:-1;font-size:11px;padding:6px 9px;}
    /* Three buttons plus a command do not fit across 390px: Publish was clipped
       at the right edge. The primary action takes its own full-width row and the
       secondary ones share the next. */
    .barbot button{padding:9px 10px;font-size:12.5px;min-height:44px;}
    .barbot #c_copy{flex:1 1 100%;}
    .barbot #c_share,.barbot #c_publish,.barbot #c_reset{flex:1 1 0;min-width:0;}
    .barbot .minilinks{display:none;}
  }
  /* Short screens: an SE is 568px tall and the bar was taking 26% of it. Trim the
     chrome without hiding anything. */
  @media(max-height:620px){
    .barbot{padding:6px 10px calc(6px + env(safe-area-inset-bottom,0px));gap:6px;}
    .barbot button{min-height:40px;padding:7px 9px;font-size:12px;}
    .barbot .cmd{font-size:10.5px;padding:5px 8px;}
  }
  /* True landscape: 390px of height in total. There is width to spare here, so the
     bar collapses to a single row instead of the three it uses in portrait, and the
     page header earns its space back for the terminal. */
  @media(max-height:460px){
    .barbot{flex-wrap:nowrap;}
    /* The single row has one flexible member and it is the command box, which already
       scrolls internally. Letting the buttons shrink instead crushed Share/Reset to
       ~19px slivers: they inherit flex:1 1 0 from the portrait block above, and
       nowrap gives them nothing to wrap to. flex:0 0 auto pins them at label width.
       The overrides have to be ID-level: the portrait rules are #id selectors, so a
       plain .barbot-button rule loses to them no matter where it sits. */
    .barbot .cmd{flex:1 1 0;min-width:0;order:0;}
    .barbot button{min-height:40px;font-size:11.5px;padding:7px 10px;}
    .barbot #c_copy,.barbot #c_share,.barbot #c_publish,.barbot #c_reset{flex:0 0 auto;min-width:max-content;}
    .tcol .xterm{height:min(58dvh,230px);}
    header,.sub{display:none;}
  }
`;

const STUDIO_JS = `
var ORIGIN=location.origin;
var STATUS_COLORS=['gray','orange','blue','teal','green','lavender','rose','gold','slate','cyan'];
var SPINNERS={
 'classic':['·','✶','✳','✶','✻','✽'],
 'dots braille':['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'],
 'circle':['◜','◠','◝','◞','◡','◟'],
 'moon':['◐','◓','◑','◒'],
 'bar':['|','/','-','\\\\'],
 'pulse':['·','∙','●','∙'],
 'blocks':['▁','▂','▃','▄','▅','▆','▇','█','▇','▆','▅','▄','▃','▂'],
 'arrows':['←','↖','↑','↗','→','↘','↓','↙'],
 'custom':null
};
var BORDERS=['none','single','round','double','bold','singleDouble','doubleSingle','classic','topBottomSingle','topBottomDouble','topBottomBold'];
var CHEVRONS=['default','claude','planMode','success','warning','error','ide','remember','permission'];
var PAL_KEYS=[['bg','Background'],['raised','Raised / panel'],['text','Text'],['comment','Comment / dim'],['subtle','Subtle'],['accent','Accent (Claude)'],['accent2','Accent 2'],['cyan','Cyan / plan'],['green','Success'],['red','Error'],['orange','Warning'],['yellow','Remember'],['pink','Pink'],['blue','Blue / IDE']];
function hx(t){return '#'+t.map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('');}
function toRGBarr(hex){hex=String(hex).replace('#','');return [parseInt(hex.slice(0,2),16)||0,parseInt(hex.slice(2,4),16)||0,parseInt(hex.slice(4,6),16)||0];}
function hexToRgbStr(h){var a=toRGBarr(h);return 'rgb('+a[0]+','+a[1]+','+a[2]+')';}
function okHex(h){return typeof h==='string'&&/^#[0-9a-fA-F]{6}$/.test(h);}
function copyObj(o){return JSON.parse(JSON.stringify(o));}

var state=null;
function defaultState(){
  return {n:'My Setup', s:'blue', p:copyObj(STARTERS['tokyo-night']),
    vf:'{}… ',
    vv:['Cooking','Vibing','Conjuring','Tinkering','Orchestrating','Brewing','Sculpting','Percolating','Noodling','Summoning'],
    ph:SPINNERS['classic'].slice(), rm:true, iv:120,
    ub:'none', uc:'#7aa2f7',
    um:{f:' > {} ', st:[], fg:'', bg:'', px:0, py:0, fit:false},
    ib:{rb:false, ch:''},
    sl:{on:true, seg:['model','dir','git','ctx'], sep:' | ', em:true, bar:'blocks', ctxFmt:'pct-of', ctxBasis:'window', text:''},
    id:''};
}
// merge an incoming shared payload into a fresh state (defensive: shapes + colors validated)
function stateFromPayload(pl){
  var st=defaultState();
  try{
    if(typeof pl.n==='string')st.n=pl.n.slice(0,60);
    if(STATUS_COLORS.indexOf(pl.s)>=0)st.s=pl.s;
    if(pl.p&&typeof pl.p==='object'){PAL_KEYS.forEach(function(k){var v=pl.p[k[0]];if(Array.isArray(v)&&v.length===3)st.p[k[0]]=[+v[0]||0,+v[1]||0,+v[2]||0].map(function(x){return Math.max(0,Math.min(255,Math.round(x)));});});}
    st.vf=cFmt(pl.vf,24,st.vf);
    // Arrays are honoured even when EMPTY — the UI can legitimately produce an empty
    // verb/phase/segment list, and resurrecting defaults would install something the
    // sharer explicitly cleared.
    if(Array.isArray(pl.vv))st.vv=pl.vv.map(function(s){return String(s).slice(0,32);}).filter(Boolean).slice(0,40);
    if(Array.isArray(pl.ph))st.ph=pl.ph.map(function(s){return String(s).slice(0,4);}).filter(Boolean).slice(0,24);
    if(pl.rm===false)st.rm=false;
    st.iv=cClamp(pl.iv,40,1000,120);
    if(BORDERS.indexOf(pl.ub)>=0)st.ub=pl.ub;
    if(typeof pl.uc==='string'){var m=/^rgb\\((\\d+),(\\d+),(\\d+)\\)$/.exec(pl.uc.replace(/\\s+/g,''));if(m)st.uc=hx([+m[1],+m[2],+m[3]]);else if(okHex(pl.uc))st.uc=pl.uc;}
    // The server's fallback format depends on whether there is a border (a box
    // supplies its own framing, so it drops the "> " chevron). Mirror that here or a
    // link with an unusable format would install one thing and re-emit another.
    st.um.f=(st.ub!=='none')?' {} ':' > {} ';
    // Server buildUMD defaults, applied whether um is absent OR present-but-partial
    // (an empty um object with a border must still get paddingX 1 and fit true).
    var hasB=st.ub!=='none';
    st.um.px=hasB?1:0; st.um.fit=hasB;
    if(pl.um&&typeof pl.um==='object'){
      var um=pl.um;
      st.um.f=cFmt(um.f,40,st.um.f);
      if(Array.isArray(um.st))st.um.st=um.st.filter(function(s){return ['bold','italic','underline','strikethrough','inverse'].indexOf(s)>=0;});
      if(okHex(um.fg))st.um.fg=um.fg;
      if(okHex(um.bg))st.um.bg=um.bg;
      st.um.px=cClamp(um.px,0,4,hasB?1:0);
      st.um.py=cClamp(um.py,0,2,0);
      if(um.fit!==undefined)st.um.fit=!!um.fit;
    }
    if(pl.ib&&typeof pl.ib==='object'){st.ib.rb=!!pl.ib.rb;if(CHEVRONS.indexOf(pl.ib.ch)>0)st.ib.ch=pl.ib.ch;}
    if(pl.sl&&typeof pl.sl==='object'){
      var sl=pl.sl;
      st.sl.on=!!sl.on;
      if(Array.isArray(sl.seg)){var seen={};st.sl.seg=sl.seg.filter(function(s){var ok=SL_SEG_META.some(function(x){return x.id===s;})&&!seen[s];seen[s]=1;return ok;});}
      if(SL_SEPLIST.indexOf(sl.sep)>=0)st.sl.sep=sl.sep;
      st.sl.em=sl.em!==false;
      if(ownKey(SL_BARSETS,sl.bar))st.sl.bar=sl.bar;
      if(['pct','pct-of','tokens'].indexOf(sl.ctxFmt)>=0)st.sl.ctxFmt=sl.ctxFmt;
      if(['window','autocompact'].indexOf(sl.ctxBasis)>=0)st.sl.ctxBasis=sl.ctxBasis;
      if(typeof sl.text==='string')st.sl.text=cText(sl.text,24);
    }
    if(typeof pl.id==='string')st.id=pl.id.slice(0,16);
  }catch(e){}
  return st;
}
// seed from a preset (palette + verbs + spinner + user-message display)
function stateFromPreset(pe){
  var st=defaultState();
  st.n=pe.name+' remix';
  st.s=pe.statuslineColor||'blue';
  PAL_KEYS.forEach(function(k){if(pe.seed&&okHex(pe.seed[k[0]]))st.p[k[0]]=toRGBarr(pe.seed[k[0]]);});
  st.vv=pe.verbs.slice();st.vf=pe.verbFormat;st.ph=pe.phases.slice();st.rm=pe.reverseMirror;st.iv=pe.interval;
  var u=pe.umd||{};
  if(BORDERS.indexOf(u.borderStyle)>=0)st.ub=u.borderStyle;
  var m=/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/.exec(u.borderColor||'');
  if(m)st.uc=hx([+m[1],+m[2],+m[3]]);
  if(typeof u.format==='string'&&u.format.indexOf('{}')>=0)st.um.f=u.format;
  st.um.st=(u.styling||[]).slice();
  st.um.px=u.paddingX||0;st.um.py=u.paddingY||0;st.um.fit=!!u.fitBoxToContent;
  // Message colours, which this used to drop on the floor: seeding from a preset
  // that styles user messages produced everything EXCEPT its colours. 'default'
  // and null both mean "follow the theme", which is the empty string here.
  var fgm=/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/.exec(u.foregroundColor||'');
  if(fgm)st.um.fg=hx([+fgm[1],+fgm[2],+fgm[3]]);else if(okHex(u.foregroundColor))st.um.fg=u.foregroundColor;
  var bgm=/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/.exec(u.backgroundColor||'');
  if(bgm)st.um.bg=hx([+bgm[1],+bgm[2],+bgm[3]]);else if(okHex(u.backgroundColor))st.um.bg=u.backgroundColor;
  return st;
}
// Hash EVERY field that changes the installed setup — a narrower hash makes two
// distinct setups share an id, and Publish/import both key off it.
function shortId(){
  var s=JSON.stringify([state.n,state.s,state.p,state.vf,state.vv,state.ph,state.rm,state.iv,state.ub,state.uc,state.um,state.ib,state.sl]);
  var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0;}
  return h.toString(36);
}
function payload(){
  return {n:state.n,s:state.s,p:state.p,vf:state.vf,vv:state.vv,ph:state.ph,rm:state.rm,iv:state.iv,
    ub:state.ub,uc:hexToRgbStr(state.uc),
    um:{f:state.um.f,st:state.um.st,fg:state.um.fg||'',bg:state.um.bg||'',px:state.um.px,py:state.um.py,fit:state.um.fit},
    ib:(state.ib.rb||state.ib.ch)?{rb:state.ib.rb,ch:state.ib.ch||''}:undefined,
    sl:state.sl, id:shortId(), author:'you'};
}
// The preview must show exactly what the install command produces, so every
// server-side fallback (empty verbs/phases, a status line with no segments) is
// mirrored here rather than being allowed to diverge.
function afterModel(){
  var full=expandPalette(sanePal(state.p));
  // Every user-authored string goes through the same sanitizer the installer uses,
  // so what the AFTER pane shows is what actually lands in Claude Code — including
  // the truncation and control-character stripping.
  var verbs=cList(state.vv,32,40); if(!verbs.length)verbs=['Working'];
  var phases=cList(state.ph,4,24); if(!phases.length)phases=['·','✶','✳','✶','✻','✽'];
  var slLive=state.sl.on&&state.sl.seg.length>0;
  return {
    name:cName(state.n,60)||'Custom',
    colors:mapPreview(full),
    umd:{format:cFmt(state.um.f,40,state.ub!=='none'?' {} ':' > {} '),styling:state.um.st,
      foregroundColor:state.um.fg?hexToRgbStr(state.um.fg):'default',
      backgroundColor:state.um.bg?hexToRgbStr(state.um.bg):null,
      borderStyle:state.ub,borderColor:hexToRgbStr(state.uc),
      paddingX:state.um.px,paddingY:state.um.py,fitBoxToContent:state.um.fit},
    verbs:verbs,verbFormat:cFmt(state.vf,24,'{}… '),phases:phases,reverseMirror:state.rm,interval:state.iv,
    ib:{rb:state.ib.rb,ch:state.ib.ch},
    sl:{on:slLive,seg:state.sl.seg,sep:state.sl.sep,em:state.sl.em,bar:state.sl.bar,ctxFmt:state.sl.ctxFmt,ctxBasis:state.sl.ctxBasis,text:cText(state.sl.text,24)}
  };
}
function beforeModel(pe){
  return {
    name:pe.name,colors:pe.pv,umd:pe.umd,
    verbs:pe.verbs,verbFormat:pe.verbFormat,phases:pe.phases,reverseMirror:pe.reverseMirror,interval:pe.interval,
    ib:{rb:false,ch:''},
    sl:{on:true,seg:['model','dir','git','ctx'],sep:' | ',em:true,bar:'blocks',ctxFmt:'pct',ctxBasis:'window',text:''}
  };
}

var termB=null,termA=null,sendCounter=0;
function presetById(id){for(var i=0;i<PRESETS.length;i++)if(PRESETS[i].id===id)return PRESETS[i];return PRESETS[0];}
function currentBefore(){return presetById($('#beforeSel')?$('#beforeSel').value:'stock');}
// Returns false when the send was refused, so the terminal can keep the typed text
// in the input instead of silently eating it.
function sendBoth(text,ri){
  if(termA.busy||termB.busy){toast('Hold on — still responding…');return false;}
  if(ri==null){ri=sendCounter%3;}
  sendCounter++;
  termB.send(text,ri);termA.send(text,ri);
  return true;
}
function buildTerms(){
  var stockIdx=0;for(var i=0;i<PRESETS.length;i++)if(PRESETS[i].id==='stock')stockIdx=i;
  termB=makeTerm($('#termB'),beforeModel(PRESETS[stockIdx]),{
    label:'BEFORE',
    onSend:function(t){sendBoth(t);},
    onInput:function(v){termA.setInput(v);}
  });
  termA=makeTerm($('#termA'),afterModel(),{
    label:'AFTER',
    onSend:function(t){sendBoth(t);},
    onInput:function(v){termB.setInput(v);}
  });
  var sel=document.createElement('select');sel.className='tsel';sel.id='beforeSel';
  for(var j=0;j<PRESETS.length;j++){var o=document.createElement('option');o.value=PRESETS[j].id;o.textContent=PRESETS[j].name;if(PRESETS[j].id==='stock')o.selected=true;sel.appendChild(o);}
  sel.addEventListener('change',function(){termB.setModel(beforeModel(currentBefore()));});
  termB.slot.appendChild(sel);
}

var _urlT=null,allowDraft=false;
function drawOutputs(){
  var pl=payload();
  var c=encodeURIComponent(b64e(pl));
  var cmd='curl -fsSL "'+ORIGIN+'/apply.sh?c='+c+'" | bash';
  $('#cmdtext').textContent=cmd;
  $('#lnkCfg').href='/config.json?c='+c;
  var slLive=state.sl.on&&state.sl.seg.length>0;
  $('#lnkSl').href='/statusline.js?c='+c;
  // Hand the current setup to the other builder pages, so whichever one you open next
  // starts layered on it. The menu reads this when it opens; it is set here rather than
  // read from the address bar because the URL write below is debounced by 400ms and a
  // fresh page has not written anything yet.
  window.__sccPayloadC=c;
  $('#lnkSl').style.display=slLive?'inline':'none';
  var warn=$('#slwarn');
  if(warn)warn.style.display=(state.sl.on&&!state.sl.seg.length)?'block':'none';
  clearTimeout(_urlT);
  _urlT=setTimeout(function(){
    try{history.replaceState(null,'','/customize?c='+c);}catch(e){}
    // Only persist once the user has actually edited something — merely OPENING
    // someone else's shared link must not overwrite their own saved draft.
    if(allowDraft){try{localStorage.setItem('scc_draft',JSON.stringify(pl));}catch(e){}}
  },400);
}
function refreshAfter(){termA.setModel(afterModel());drawOutputs();}
// Called by every control handler: from here on, changes are the user's own and
// are safe to persist as their draft.
function edited(){allowDraft=true;refreshAfter();}

// ── Explanations ────────────────────────────────────────────────────────────
// Every control gets an (i). The terms here are Claude Code's and tweakcc's, not
// ones a newcomer can be expected to know, so each entry says what the option
// does, what it affects, and — where two options look similar — how they differ.
var HELP={
 name:{t:'Setup name',d:'What this setup is called. It shows up in the install command and in tweakcc’s theme list, so you can pick it again later. A label only — it changes nothing about how the terminal looks.'},
 start:{t:'Start from a starter palette',d:'Replaces ONLY the colours below with a hand‑picked set. Everything else you have set — thinking verbs, spinner, message style, input box, status line — is left exactly as it is. Use this when you like your setup and just want it in different colours.'},
 seed:{t:'…or seed everything from a preset',d:'Replaces your WHOLE setup with a complete ready‑made one: the colours and the verbs, spinner, message format, input box and status line. Use this to start over from a finished look. It overwrites the panels below, so if you only want new colours use the starter palette above instead.'},
 palette:{t:'Palette',d:'The colour Claude Code uses for each job. These are roles, not decoration: Accent tints Claude’s own name and spinner, Cyan is plan mode, Success / Error / Warning colour tool results, Remember is the memory notice. Change one and every place that uses it changes in the AFTER preview.'},
 verbs:{t:'Thinking verbs',d:'The words shown while Claude works — the “Cooking” in “Cooking… (esc to interrupt)”. One per line, and Claude Code shows one of them each time it starts thinking. Add as many as you like; empty lines are ignored.'},
 vf:{t:'Verb format',d:'The wrapper around each verb. {} is where the verb goes and everything else is printed literally, so “{}… ” gives “Cooking… ” and “· {} ·” gives “· Cooking ·”. It must contain {} or the change is ignored.'},
 spin:{t:'Spinner',d:'The small animation that turns next to the verb. Picking one here fills in the frames below. Edit those frames yourself and this drops to “custom”.'},
 phases:{t:'Custom phases',d:'The individual animation frames, separated by spaces. The spinner shows them in order, one per tick, then starts again. Any characters work, emoji included — up to 24 frames.'},
 iv:{t:'Speed',d:'How long each frame is held, in milliseconds. Lower is faster: 40ms is nearly a blur, 400ms is a slow pulse.'},
 rm:{t:'bounce (mirror)',d:'Plays the frames forward and then backwards, instead of snapping from the last frame straight back to the first. On an uneven spinner this reads as a sweep back and forth rather than a jump.'},
 umf:{t:'Message format',d:'How YOUR typed messages are drawn in the transcript — this is the main way to tell your lines apart from Claude’s. {} is your message text, everything else is literal, so “ ❯ {} ” puts a chevron in front of every message you send. Must contain {}.'},
 umst:{t:'Text style',d:'Terminal text attributes applied to your messages. “inverse” swaps the text and background colours, which is the loudest option and the easiest to spot while scrolling. Combine as many as you like; very old terminals ignore some of them.'},
 fg:{t:'Text colour',d:'The colour of your own messages. “Theme” follows the palette’s Text colour, so it keeps matching if you change palettes later. “Custom” pins the exact colour in the picker — useful when you want your lines in a different colour from Claude’s replies.'},
 bg:{t:'Background strip',d:'A block of colour painted behind your messages, so your lines read as a solid band rather than plain text. “Theme” follows the palette’s message background; “Custom” pins the colour in the picker. Switching to Custom starts from the colour already showing, so nothing jumps.'},
 ub:{t:'Border',d:'Draws a box around each of your messages out of line characters. “none” is no box, “round” has curved corners, and the topBottom… options draw only a rule above and below instead of a full frame. Turning a border on also switches the message format to “ {} ”, since the box already separates your text.'},
 uc:{t:'Border colour',d:'The colour of the box drawn around your messages. Only visible when Border is something other than “none”.'},
 px:{t:'Pad X',d:'Blank columns between the border and your text, on the left and right. 0 to 4. Only visible with a border.'},
 py:{t:'Pad Y',d:'Blank lines between the border and your text, above and below. 0 to 2. Only visible with a border.'},
 fit:{t:'fit box',d:'The box hugs the width of your text instead of stretching the full width of the terminal, so a short message gets a short box.'},
 ibrb:{t:'remove the input‑box border',d:'Hides the rounded frame around the prompt you type into, leaving just the chevron and your text. Cleaner, at the cost of the visible edge that shows where the input area is.'},
 ibch:{t:'Idle chevron colour',d:'The colour of the ❯ in front of the prompt before you start typing. The options are palette roles rather than fixed colours, so “claude” matches Claude’s accent and “planMode” matches plan mode, and they follow your palette.'},
 slon:{t:'Install a custom status line',d:'The status line is the single row along the very bottom of Claude Code. Ticked, the install command writes a statusLine entry into ~/.claude/settings.json pointing at a generated script. Unticked, your existing status line is left completely alone.'},
 segs:{t:'Segments',d:'Which pieces of information the bottom row shows, and in which order. Tick one to include it; use ▲▼ to move it. They print left to right in the order listed here. With none ticked, no status line is installed at all.'},
 sltext:{t:'Custom text segment',d:'Any text you want pinned in the status line — a project name, a reminder, an emoji. Typing here switches the “Custom text” segment on for you.'},
 slsep:{t:'Separator',d:'The characters printed between one segment and the next.'},
 slbar:{t:'Bar style',d:'Which pair of characters draws the context gauge — one for the filled part, one for the empty part. “shade” is solid blocks, “braille” is the finest grained. Only matters if the Context bar segment is on.'},
 slctx:{t:'Context as',d:'How the number is written: a bare percentage, a percentage with the total after it, or used and total tokens.'},
 slbasis:{t:'Measured against',d:'What the gauge is a fraction OF. \u201cModel window\u201d uses the real context window Claude Code reports \u2014 200k, or 1M on an extended\u2011context model \u2014 so it answers \u201chow much room is left\u201d. \u201cAuto\u2011compact point\u201d uses the threshold this session will actually compact at, which is usually lower, and answers the more useful question: how long until I get interrupted. That threshold is not in the status\u2011line data, so the script resolves it the way Claude Code does \u2014 CLAUDE_CODE_AUTO_COMPACT_WINDOW first, then autoCompactWindow in your project and user settings. If auto\u2011compaction is off, or nothing sets a window, it falls back to the model window rather than inventing a number.'},
 slem:{t:'emoji icons',d:'Puts a small emoji in front of each segment instead of a plain label. Shorter, but it needs a terminal font that has them — if you see boxes, turn this off.'},
 status:{t:'Legacy context‑bar.sh accent',d:'Only affects the older standalone context‑bar.sh script, if you happen to use one. It has NO effect on the status line built above, and nothing in the preview changes when you touch it. Leave it alone unless you know you want it.'},
 seg_model:{t:'Model name',d:'The model answering right now, e.g. Opus 5.'},
 seg_effort:{t:'Reasoning effort',d:'The effort level the current model is running at \u2014 low, medium, high, xhigh or max \u2014 read live, so it follows a mid\u2011session /effort change. Models without an effort setting send nothing, and the segment disappears rather than printing a blank.'},
 seg_dir:{t:'Folder',d:'The name of the folder Claude Code is working in — just the last part, not the whole path.'},
 seg_git:{t:'Git branch',d:'The branch currently checked out, with a marker when the working tree has uncommitted changes. Blank outside a git repository.'},
 seg_ctx:{t:'Context bar',d:'A gauge of how much context is in use, drawn with the Bar style characters, written in the Context as format, and measured against whichever Measured against basis you pick.'},
 seg_cost:{t:'Session cost',d:'What this session has cost so far, in dollars.'},
 seg_dur:{t:'Duration',d:'How long this session has been running, in minutes (or hours and minutes once it passes an hour).'},
 seg_lines:{t:'Lines +/−',d:'How many lines this session has added and removed across all its edits.'},
 seg_style:{t:'Output style',d:'The active output style, if you have set one. Blank when you have not.'},
 seg_ver:{t:'CC version',d:'The version of Claude Code you are running.'},
 seg_clock:{t:'Clock',d:'The current time, as HH:MM.'},
 seg_text:{t:'Custom text',d:'Whatever you typed into the Custom text segment field.'}
};
function ihtml(k){return '<button type="button" class="i" data-h="'+k+'" aria-label="Explain this option">i</button>';}
var _tip=null,_tipBtn=null,_tipPinned=false;
function tipNode(){
  if(!_tip){
    _tip=document.createElement('div');_tip.className='tip';_tip.setAttribute('role','tooltip');
    _tip.appendChild(document.createElement('b'));_tip.appendChild(document.createElement('span'));
    _tip.style.display='none';document.body.appendChild(_tip);
  }
  return _tip;
}
function hideTip(){
  if(_tip)_tip.style.display='none';
  if(_tipBtn)_tipBtn.classList.remove('on');
  _tipBtn=null;_tipPinned=false;
}
function showTip(btn){
  var k=btn.getAttribute('data-h');
  if(!ownKey(HELP,k))return;
  var h=HELP[k],t=tipNode();
  // textContent, never innerHTML: the copy is ours, but this is the one place a
  // future entry with an angle bracket in it could otherwise become markup.
  t.firstChild.textContent=h.t;t.lastChild.textContent=h.d;
  t.style.display='block';t.style.left='0px';t.style.top='0px';
  if(_tipBtn)_tipBtn.classList.remove('on');
  _tipBtn=btn;btn.classList.add('on');
  var r=btn.getBoundingClientRect(),w=t.offsetWidth,hh=t.offsetHeight;
  var vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight;
  var left=r.left+window.pageXOffset-8;
  var maxL=window.pageXOffset+vw-w-12;
  if(left>maxL)left=maxL;
  if(left<window.pageXOffset+12)left=window.pageXOffset+12;
  // The install bar is position:fixed across the bottom, so "fits on screen" ends
  // above it, not at the viewport edge — otherwise the last few tooltips in the
  // Status line panel open underneath it and cannot be read.
  var barEl=document.querySelector('.barbot');
  var floor=vh-(barEl?barEl.offsetHeight+8:8);
  var below=r.bottom+7,above=r.top-7-hh,top;
  if(below+hh<=floor)top=below;
  else if(above>=4)top=above;
  else top=Math.max(4,Math.min(floor-hh,below));
  t.style.left=left+'px';t.style.top=(top+window.pageYOffset)+'px';
}
document.addEventListener('mouseover',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b&&!_tipPinned)showTip(b);
});
document.addEventListener('mouseout',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b&&!_tipPinned&&b===_tipBtn)hideTip();
});
// Click pins it open, which is the only way this works on a touch screen and the
// only way the text stays put long enough to read a long explanation.
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.i'):null;
  if(b){
    e.preventDefault();e.stopPropagation();
    if(_tipPinned&&b===_tipBtn){hideTip();return;}
    showTip(b);_tipPinned=true;return;
  }
  if(_tipPinned&&(!_tip||!_tip.contains(e.target)))hideTip();
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideTip();});
window.addEventListener('scroll',function(){if(_tipBtn)hideTip();},true);

function chip(label,on,cb){
  var el=document.createElement('span');el.className='stychip'+(on?' on':'');el.textContent=label;
  el.addEventListener('click',function(){cb(!el.classList.contains('on'));el.classList.toggle('on');});
  return el;
}
function detectSpinner(){
  for(var k in SPINNERS){if(!ownKey(SPINNERS,k)||!SPINNERS[k])continue;if(SPINNERS[k].join(',')===state.ph.join(','))return k;}
  return 'custom';
}
// Text/background colour for your own messages.
//
// This replaced a checkbox captioned "theme text color" sitting next to a colour
// picker, which was unreadable in both directions: ticked meant "ignore the picker",
// and unticking it applied whatever the picker happened to hold — a hardcoded Tokyo
// Night value, so on any other palette the message colour jumped to something
// unrelated to the theme. Now the two states are named, and the picker always shows
// the colour currently in force, so switching to Custom starts where Theme left off.
var _syncFg=null,_syncBg=null;
function rgbToHex(v){
  var m=/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/.exec(String(v||''));
  if(m)return hx([+m[1],+m[2],+m[3]]);
  return okHex(v)?v:'#000000';
}
// The colour the theme is currently using for that slot, straight from the same
// mapping the AFTER preview renders with.
function themeColorHex(which){
  var c=mapPreview(expandPalette(sanePal(state.p)));
  return rgbToHex(which==='fg'?c.text:c.userMsgBg);
}
function modeChip(label,on,cb){
  var el=document.createElement('span');
  el.className='stychip'+(on?' on':'');el.textContent=label;
  el.addEventListener('click',function(){if(!el.classList.contains('on'))cb();});
  return el;
}
function buildColorMode(which){
  var isFg=which==='fg';
  var host=$(isFg?'#c_fgmode':'#c_bgmode');
  var pick=$(isFg?'#c_fg':'#c_bg');
  var hint=$(isFg?'#c_fghint':'#c_bghint');
  function cur(){return isFg?state.um.fg:state.um.bg;}
  function set(v){if(isFg)state.um.fg=v;else state.um.bg=v;}
  function sync(){
    var custom=!!cur();
    host.innerHTML='';
    host.appendChild(modeChip('Theme',!custom,function(){set('');sync();edited();}));
    // Seeding Custom from the picker's current value — which in Theme mode is the
    // live theme colour — is what stops the colour jumping when you switch.
    host.appendChild(modeChip('Custom',custom,function(){set(pick.value);sync();edited();}));
    pick.value=custom?cur():themeColorHex(which);
    hint.textContent=custom?'custom':'following the palette';
  }
  pick.addEventListener('input',function(){set(this.value);sync();edited();});
  sync();
  return sync;
}
// Called whenever the palette changes: in Theme mode the picker must keep showing
// the colour actually in force, not the one from the palette before last.
function resyncColorModes(){if(_syncFg)_syncFg();if(_syncBg)_syncBg();}

function buildControls(){
  var host=$('#controls');
  host.innerHTML=
  '<div class="panel"><h3>\u{1F3AF} Setup</h3>'+
    '<label class="ctl"><span class="cap">Name'+ihtml('name')+'</span><input id="c_name" type="text" maxlength="60"></label>'+
    '<label class="ctl"><span class="cap">Start from a starter palette'+ihtml('start')+'</span><select id="c_start"><option value="">— pick —</option></select></label>'+
    '<label class="ctl"><span class="cap">…or seed everything from a preset'+ihtml('seed')+'</span><select id="c_seed"><option value="">— pick —</option></select></label>'+
    '<div class="ctl"><span class="cap">Palette'+ihtml('palette')+'</span><div class="swatches" id="c_swatches"></div></div>'+
  '</div>'+
  '<div class="panel"><h3>✳ Thinking &amp; spinner</h3>'+
    '<label class="ctl"><span class="cap">Thinking verbs <span class="hint">(one per line)</span>'+ihtml('verbs')+'</span><textarea id="c_verbs" rows="5"></textarea></label>'+
    '<div class="inline2">'+
    '<label class="ctl"><span class="cap">Verb format <span class="hint">{} = verb</span>'+ihtml('vf')+'</span><input id="c_vf" type="text" maxlength="24"></label>'+
    '<label class="ctl"><span class="cap">Spinner'+ihtml('spin')+'</span><select id="c_spin"></select></label>'+
    '</div>'+
    '<label class="ctl"><span class="cap">Custom phases <span class="hint">(space-separated characters)</span>'+ihtml('phases')+'</span><input id="c_phases" type="text"></label>'+
    '<div class="inline2">'+
    '<label class="ctl"><span class="cap">Speed <span class="hint" id="c_ivlbl"></span>'+ihtml('iv')+'</span><input id="c_iv" type="range" min="40" max="400" step="10"></label>'+
    '<label class="ctl2" style="margin-top:20px"><input id="c_rm" type="checkbox"> bounce (mirror)'+ihtml('rm')+'</label>'+
    '</div>'+
  '</div>'+
  '<div class="panel"><h3>\u{1F4AC} Your messages</h3>'+
    '<label class="ctl"><span class="cap">Format <span class="hint">{} = your message, e.g. " ❯ {} "</span>'+ihtml('umf')+'</span><input id="c_umf" type="text" maxlength="40"></label>'+
    '<div class="ctl"><span class="cap">Text style'+ihtml('umst')+'</span><div class="stychips" id="c_umst"></div></div>'+
    '<div class="ctl"><span class="cap">Text colour'+ihtml('fg')+'</span><div class="modrow"><span class="stychips" id="c_fgmode"></span><input type="color" id="c_fg"><span class="hint" id="c_fghint"></span></div></div>'+
    '<div class="ctl"><span class="cap">Background strip'+ihtml('bg')+'</span><div class="modrow"><span class="stychips" id="c_bgmode"></span><input type="color" id="c_bg"><span class="hint" id="c_bghint"></span></div></div>'+
    '<div class="inline2">'+
    '<label class="ctl"><span class="cap">Border'+ihtml('ub')+'</span><select id="c_ub"></select></label>'+
    '<div class="colorrow" style="margin-top:20px"><input type="color" id="c_uc"><span>border colour</span>'+ihtml('uc')+'</div>'+
    '</div>'+
    '<div class="inline3">'+
    '<label class="ctl"><span class="cap">Pad X'+ihtml('px')+'</span><input id="c_px" type="number" min="0" max="4"></label>'+
    '<label class="ctl"><span class="cap">Pad Y'+ihtml('py')+'</span><input id="c_py" type="number" min="0" max="2"></label>'+
    '<label class="ctl2" style="margin-top:20px"><input id="c_fit" type="checkbox"> fit box'+ihtml('fit')+'</label>'+
    '</div>'+
  '</div>'+
  '<div class="panel"><h3>⌨ Input box</h3>'+
    '<label class="ctl2"><input id="c_ibrb" type="checkbox"> remove the input-box border'+ihtml('ibrb')+'</label>'+
    '<label class="ctl"><span class="cap">Idle chevron (&gt;) colour'+ihtml('ibch')+'</span><select id="c_ibch"></select></label>'+
    '<div class="hint" style="margin-top:6px">Patched into Claude Code by tweakcc, previewed live above.</div>'+
  '</div>'+
  '<div class="panel"><h3>\u{1F4CA} Status line</h3>'+
    '<label class="ctl2"><input id="c_slon" type="checkbox"> install a custom status line <span class="hint">(~/.claude/settings.json)</span>'+ihtml('slon')+'</label>'+
    '<div id="slwarn" class="hint" style="display:none;color:#e5c07b;margin:-4px 0 10px">Pick at least one segment — with none selected, no status line gets installed.</div>'+
    '<div class="ctl"><span class="cap">Segments'+ihtml('segs')+'</span><div class="seglist" id="c_segs"></div></div>'+
    '<label class="ctl"><span class="cap">Custom text segment'+ihtml('sltext')+'</span><input id="c_sltext" type="text" maxlength="24"></label>'+
    '<div class="inline3">'+
    '<label class="ctl"><span class="cap">Separator'+ihtml('slsep')+'</span><select id="c_slsep"></select></label>'+
    '<label class="ctl"><span class="cap">Bar style'+ihtml('slbar')+'</span><select id="c_slbar"></select></label>'+
    '<label class="ctl"><span class="cap">Context as'+ihtml('slctx')+'</span><select id="c_slctx"><option value="pct">42%</option><option value="pct-of">42% of 200k</option><option value="tokens">84k/200k</option></select></label>'+
    '<label class="ctl"><span class="cap">Measured against'+ihtml('slbasis')+'</span><select id="c_slbasis"><option value="window">Model window (200k / 1M)</option><option value="autocompact">Auto-compact point</option></select></label>'+
    '</div>'+
    '<label class="ctl2"><input id="c_slem" type="checkbox"> emoji icons'+ihtml('slem')+'</label>'+
    '<label class="ctl"><span class="cap">Legacy context-bar.sh accent'+ihtml('status')+'</span><select id="c_status"></select></label>'+
  '</div>';

  $('#c_name').value=state.n;
  $('#c_name').addEventListener('input',function(){state.n=this.value;edited();});

  var startSel=$('#c_start');
  Object.keys(STARTERS).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;startSel.appendChild(o);});
  startSel.addEventListener('change',function(){if(!this.value)return;state.p=copyObj(STARTERS[this.value]);paintSwatches();resyncColorModes();edited();this.value='';});
  var seedSel=$('#c_seed');
  PRESETS.forEach(function(pe){var o=document.createElement('option');o.value=pe.id;o.textContent=pe.name;seedSel.appendChild(o);});
  seedSel.addEventListener('change',function(){if(!this.value)return;state=stateFromPreset(presetById(this.value));buildControls();edited();toast('Seeded from “'+presetById(this.value).name+'”');});

  paintSwatches();

  $('#c_verbs').value=state.vv.join('\\n');
  $('#c_verbs').addEventListener('input',function(){state.vv=this.value.split('\\n').map(function(s){return s.trim();}).filter(Boolean);edited();});
  $('#c_vf').value=state.vf;
  $('#c_vf').addEventListener('input',function(){if(this.value.indexOf('{}')>=0)state.vf=this.value;edited();});
  var spinSel=$('#c_spin');
  Object.keys(SPINNERS).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;spinSel.appendChild(o);});
  spinSel.value=detectSpinner();
  spinSel.addEventListener('change',function(){if(ownKey(SPINNERS,this.value)&&SPINNERS[this.value]){state.ph=SPINNERS[this.value].slice();$('#c_phases').value=state.ph.join(' ');edited();}});
  $('#c_phases').value=state.ph.join(' ');
  $('#c_phases').addEventListener('input',function(){var ph=this.value.split(' ').filter(Boolean);if(ph.length){state.ph=ph.slice(0,24);spinSel.value=detectSpinner();edited();}});
  var ivl=function(){$('#c_ivlbl').textContent=state.iv+'ms/frame';};
  $('#c_iv').value=state.iv;ivl();
  $('#c_iv').addEventListener('input',function(){state.iv=+this.value;ivl();edited();});
  $('#c_rm').checked=state.rm;
  $('#c_rm').addEventListener('change',function(){state.rm=this.checked;edited();});

  $('#c_umf').value=state.um.f;
  $('#c_umf').addEventListener('input',function(){if(this.value.indexOf('{}')>=0){state.um.f=this.value;edited();}});
  var stHost=$('#c_umst');
  ['bold','italic','underline','strikethrough','inverse'].forEach(function(sname){
    stHost.appendChild(chip(sname,state.um.st.indexOf(sname)>=0,function(on){
      var ix=state.um.st.indexOf(sname);
      if(on&&ix<0)state.um.st.push(sname);
      if(!on&&ix>=0)state.um.st.splice(ix,1);
      edited();
    }));
  });
  _syncFg=buildColorMode('fg');
  _syncBg=buildColorMode('bg');
  var ubSel=$('#c_ub');
  BORDERS.forEach(function(b){var o=document.createElement('option');o.value=b;o.textContent=b;ubSel.appendChild(o);});
  ubSel.value=state.ub;
  ubSel.addEventListener('change',function(){state.ub=this.value;edited();});
  $('#c_uc').value=state.uc;
  $('#c_uc').addEventListener('input',function(){state.uc=this.value;edited();});
  $('#c_px').value=state.um.px;
  $('#c_px').addEventListener('input',function(){state.um.px=Math.max(0,Math.min(4,+this.value||0));edited();});
  $('#c_py').value=state.um.py;
  $('#c_py').addEventListener('input',function(){state.um.py=Math.max(0,Math.min(2,+this.value||0));edited();});
  $('#c_fit').checked=state.um.fit;
  $('#c_fit').addEventListener('change',function(){state.um.fit=this.checked;edited();});

  $('#c_ibrb').checked=state.ib.rb;
  $('#c_ibrb').addEventListener('change',function(){state.ib.rb=this.checked;edited();});
  var chSel=$('#c_ibch');
  CHEVRONS.forEach(function(k){var o=document.createElement('option');o.value=k==='default'?'':k;o.textContent=k;chSel.appendChild(o);});
  chSel.value=state.ib.ch||'';
  chSel.addEventListener('change',function(){state.ib.ch=this.value;edited();});

  $('#c_slon').checked=state.sl.on;
  $('#c_slon').addEventListener('change',function(){state.sl.on=this.checked;paintSegs();edited();});
  paintSegs();
  $('#c_sltext').value=state.sl.text;
  $('#c_sltext').addEventListener('input',function(){state.sl.text=cText(this.value,24);if(state.sl.text&&state.sl.seg.indexOf('text')<0){state.sl.seg.push('text');paintSegs();}edited();});
  var sepSel=$('#c_slsep');
  SL_SEPLIST.forEach(function(sp){var o=document.createElement('option');o.value=sp;o.textContent='"'+sp+'"';sepSel.appendChild(o);});
  sepSel.value=state.sl.sep;
  sepSel.addEventListener('change',function(){state.sl.sep=this.value;edited();});
  var barSel=$('#c_slbar');
  Object.keys(SL_BARSETS).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k+'  '+SL_BARSETS[k][0]+SL_BARSETS[k][0]+SL_BARSETS[k][1];barSel.appendChild(o);});
  barSel.value=state.sl.bar;
  barSel.addEventListener('change',function(){state.sl.bar=this.value;edited();});
  $('#c_slctx').value=state.sl.ctxFmt;
  $('#c_slctx').addEventListener('change',function(){state.sl.ctxFmt=this.value;edited();});
  $('#c_slbasis').value=state.sl.ctxBasis;
  $('#c_slbasis').addEventListener('change',function(){state.sl.ctxBasis=this.value;edited();});
  $('#c_slem').checked=state.sl.em;
  $('#c_slem').addEventListener('change',function(){state.sl.em=this.checked;edited();});
  var stSel=$('#c_status');
  STATUS_COLORS.forEach(function(x){var o=document.createElement('option');o.value=x;o.textContent=x;stSel.appendChild(o);});
  stSel.value=state.s;
  stSel.addEventListener('change',function(){state.s=this.value;edited();});
}
function paintSwatches(){
  var host=$('#c_swatches');host.innerHTML='';
  PAL_KEYS.forEach(function(k){
    var lab=document.createElement('label');lab.className='sw';
    var inp=document.createElement('input');inp.type='color';inp.value=hx(state.p[k[0]]);
    inp.addEventListener('input',function(){state.p[k[0]]=toRGBarr(this.value);resyncColorModes();edited();});
    var sp=document.createElement('span');sp.textContent=k[1];
    lab.appendChild(inp);lab.appendChild(sp);host.appendChild(lab);
  });
}
// Status-line segments: reorder by dragging, or with the arrow buttons.
//
// Pointer Events rather than HTML5 drag-and-drop, because dragstart/dragover never
// fire for touch on iOS Safari and the user asked for this on a phone specifically.
// touch-action:none lives on the HANDLE only, so a swipe anywhere else on the row
// still scrolls the page.
//
// The drag reorders DOM siblings and commits to state.sl.seg once on release.
// Re-rendering on every pointermove would destroy the element the pointer has
// captured and the drag would die on the first move.
var _segDrag=null;
function segRowsEnabled(host){
  return Array.prototype.filter.call(host.children,function(el){
    return el.getAttribute('data-on')==='1';
  });
}
function startSegDrag(e,row,host){
  if(e.button!==undefined&&e.button>0)return;
  e.preventDefault();
  var handle=e.currentTarget;
  try{handle.setPointerCapture(e.pointerId);}catch(_){}
  _segDrag={row:row,host:host,handle:handle,pointerId:e.pointerId};
  row.classList.add('dragging');
}
function moveSegDrag(e){
  if(!_segDrag||e.pointerId!==_segDrag.pointerId)return;
  e.preventDefault();
  var host=_segDrag.host,row=_segDrag.row,y=e.clientY;
  var others=segRowsEnabled(host).filter(function(r){return r!==row;});
  for(var i=0;i<others.length;i++){
    var r=others[i].getBoundingClientRect();
    if(y<r.top+r.height/2){host.insertBefore(row,others[i]);return;}
  }
  // Past the last enabled row: park it at the end of the ENABLED block, never
  // inside the disabled rows below — those are not part of the order.
  if(others.length)host.insertBefore(row,others[others.length-1].nextSibling);
}
function endSegDrag(e){
  if(!_segDrag||(e&&e.pointerId!==undefined&&e.pointerId!==_segDrag.pointerId))return;
  var d=_segDrag;_segDrag=null;
  try{d.handle.releasePointerCapture(d.pointerId);}catch(_){}
  d.row.classList.remove('dragging');
  var order=segRowsEnabled(d.host).map(function(r){return r.getAttribute('data-id');});
  var changed=order.join(',')!==state.sl.seg.join(',');
  state.sl.seg=order;
  paintSegs();
  if(changed)edited();
}
document.addEventListener('pointermove',moveSegDrag,{passive:false});
document.addEventListener('pointerup',endSegDrag);
document.addEventListener('pointercancel',endSegDrag);

function moveSeg(id,delta){
  var ix=state.sl.seg.indexOf(id);
  var to=ix+delta;
  if(ix<0||to<0||to>=state.sl.seg.length)return;
  state.sl.seg.splice(ix,1);
  state.sl.seg.splice(to,0,id);
  paintSegs();edited();
}

function paintSegs(){
  var host=$('#c_segs');host.innerHTML='';
  var enabled=state.sl.seg;
  var ordered=enabled.slice();
  SL_SEG_META.forEach(function(sm){if(ordered.indexOf(sm.id)<0)ordered.push(sm.id);});
  ordered.forEach(function(id){
    var meta=null;SL_SEG_META.forEach(function(sm){if(sm.id===id)meta=sm;});
    if(!meta)return;
    var on=enabled.indexOf(id)>=0;
    var row=document.createElement('div');
    row.className='segrow'+(on?' on':'');
    row.setAttribute('data-id',id);
    row.setAttribute('data-on',on?'1':'0');

    if(on){
      var h=document.createElement('span');
      h.className='seghandle';h.setAttribute('data-drag','');
      h.setAttribute('role','button');h.setAttribute('tabindex','-1');
      h.setAttribute('aria-label','Drag to reorder '+meta.name);
      h.textContent='\u283F';
      h.addEventListener('pointerdown',function(ev){startSegDrag(ev,row,host);});
      row.appendChild(h);
    }else{
      // Keeps the checkboxes of disabled rows aligned with the enabled ones.
      var sp=document.createElement('span');sp.className='seghandle ghosthandle';
      sp.setAttribute('aria-hidden','true');row.appendChild(sp);
    }

    var cb=document.createElement('input');cb.type='checkbox';cb.checked=on;
    cb.setAttribute('aria-label',meta.name);
    cb.addEventListener('change',function(){
      var ix=state.sl.seg.indexOf(id);
      if(this.checked&&ix<0)state.sl.seg.push(id);
      if(!this.checked&&ix>=0)state.sl.seg.splice(ix,1);
      paintSegs();edited();
    });
    var nm=document.createElement('span');nm.className='nm';nm.textContent=meta.name;
    row.appendChild(cb);row.appendChild(nm);
    // Each segment explains itself; "Lines +/-" and "Output style" are not self-evident.
    var ib=document.createElement('span');ib.innerHTML=ihtml('seg_'+id);row.appendChild(ib.firstChild);
    if(on){
      // Kept alongside the drag handle: this is the keyboard path, and dragging is
      // not reachable from a keyboard.
      var up=document.createElement('button');up.type='button';up.textContent='\u25B2';
      up.setAttribute('aria-label','Move '+meta.name+' earlier');
      var dn=document.createElement('button');dn.type='button';dn.textContent='\u25BC';
      dn.setAttribute('aria-label','Move '+meta.name+' later');
      up.addEventListener('click',function(){moveSeg(id,-1);});
      dn.addEventListener('click',function(){moveSeg(id,1);});
      row.appendChild(up);row.appendChild(dn);
    }
    host.appendChild(row);
  });
}

// boot: priority ?c= payload > ?from= preset > saved draft > defaults
(function(){
  state=defaultState();
  try{
    var q=new URLSearchParams(location.search);
    var c=q.get('c'),from=q.get('from');
    if(c){state=stateFromPayload(b64d(c));}
    else if(from){var pe=null;PRESETS.forEach(function(x){if(x.id===from)pe=x;});if(pe)state=stateFromPreset(pe);}
    else{var draft=localStorage.getItem('scc_draft');if(draft)state=stateFromPayload(JSON.parse(draft));}
  }catch(e){state=defaultState();}
})();
buildTerms();
buildControls();
refreshAfter();
// BEFORE/AFTER switch (phones only; on desktop both panes are visible and the
// switch is display:none, so this listener simply never fires).
//
// The hidden pane is only hidden with CSS — both terminals stay live and keep
// receiving model updates, so switching is instant and never shows a stale pane.
(function(){
  var sw=$('[data-pane-toggle]'); if(!sw)return;
  var terms=$('.terms');
  sw.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('.pswbtn'):null;
    if(!b)return;
    var want=b.getAttribute('data-pane');
    terms.setAttribute('data-pane',want);
    Array.prototype.forEach.call(sw.querySelectorAll('.pswbtn'),function(x){
      var on=x.getAttribute('data-pane')===want;
      x.classList.toggle('on',on);
      x.setAttribute('aria-selected',on?'true':'false');
    });
  });
})();
Array.prototype.forEach.call(document.querySelectorAll('[data-msg]'),function(b){
  b.addEventListener('click',function(){sendBoth(this.getAttribute('data-msg'),+this.getAttribute('data-ri'));});
});
// Guard jointly: replaying only one pane while the other is mid-response would leave
// the two transcripts permanently out of step.
$('#c_replay').addEventListener('click',function(){
  if(termA.busy||termB.busy){toast('Hold on — still responding…');return;}
  termB.replay();termA.replay();
});
$('#c_copy').addEventListener('click',function(){copyText($('#cmdtext').textContent);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy install command';},1600);});
$('#c_share').addEventListener('click',function(){var link=ORIGIN+'/customize?c='+encodeURIComponent(b64e(payload()));copyText(link);toast('Shareable studio link copied — anyone who opens it can preview & install your setup');});
$('#c_publish').addEventListener('click',function(){var cs=customs_get();var pl=payload();cs=cs.filter(function(x){return x.id!==pl.id;});cs.push(pl);customs_set(cs);toast('Published “'+pl.n+'” to your homepage ⭐');});
$('#c_reset').addEventListener('click',function(){
  state=defaultState();allowDraft=false;
  try{localStorage.removeItem('scc_draft');}catch(e){}
  buildControls();refreshAfter();
  // refreshAfter schedules a debounced URL write; cancel it so the address bar stays
  // a bare /customize instead of being re-stamped with the default-state payload.
  clearTimeout(_urlT);
  history.replaceState(null,'','/customize');
  var tc=$('#tocmux'); if(tc)tc.href='/cmux';
  toast('Reset to defaults');
});
// Pinned by default here: the Studio's whole premise is that you change a control and
// watch the AFTER terminal answer, which only works if it is still on screen. The
// toggle exists because that stops being true once you are reading rather than tweaking.
//
// <body> ships with class="pinned" to match, so the terminals do not start unpinned and
// visibly jump when this runs. Keep the two in step: the markup states the default, this
// states it again for the case where localStorage overrides it.
installPreviewDock({dock:'.terms',grip:'#dockgrip',pin:'#pinbtn',
  term:'.tcol .xterm',key:'studio',pinDefault:true});
installNav();
`;

function renderCustomize(DATA, baseCss, clientLib, favicon, ghSvg, ghUrl) {
  const presets = DATA.presets.map(p => studioPreset(DATA, p));
  const payload = JSON.stringify(presets).replace(/</g, '\\u003c');
  const { STARTERS } = require('./_theme.js');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Customize · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}</style></head><body class="pinned">
${topBar('studio', ghSvg)}
<header style="padding-bottom:2px"><h1 style="font-size:32px">🎛 The Studio</h1>
<p class="sub" style="margin-top:8px">Your terminal, <b>before</b> and <b>after</b> — both are real, scrollable Claude Code sessions. <b>Type a message into either one</b> (or fire a sample) and watch both respond in their own style. Tweak everything below; the AFTER side updates live.</p></header>
<div class="swrap">
  <div class="switchrow">
    <div class="paneswitch" data-pane-toggle role="tablist" aria-label="Which terminal to show">
      <button type="button" class="pswbtn" data-pane="before" role="tab" aria-selected="false">Before</button>
      <button type="button" class="pswbtn on" data-pane="after" role="tab" aria-selected="true">After</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn" aria-pressed="true"
      title="Keep the terminals on screen while you scroll through the controls">
      <span class="pico">📌</span><span class="ptxt">Preview pinned</span></button>
  </div>
  <div class="terms" data-pane="after">
    <div class="tcol tcol-before"><div class="tbadge"><span class="pill">before</span><b>Your current setup</b><span>— pick what you run today</span></div><div id="termB"></div></div>
    <div class="tcol tcol-after"><div class="tbadge"><span class="pill aft">after</span><b>Your custom setup</b><span>— live preview</span></div><div id="termA"></div></div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the terminals. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the terminals · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>
  <div class="toolrow" id="chipbar">
    <span class="lbl">Try it:</span>
    <button class="chipbtn" data-msg="fix the failing checkout test" data-ri="0">💬 fix the failing checkout test</button>
    <button class="chipbtn" data-msg="give me a quick map of this repo" data-ri="1">💬 map this repo</button>
    <button class="chipbtn" data-msg="run the linter" data-ri="2">💬 run the linter</button>
    <button class="chipbtn" id="c_replay">▶ replay the demo session</button>
  </div>
  <div class="panels" id="controls"></div>
</div>
<div class="barbot">
  <div class="cmd"><span class="dollar">$</span><span id="cmdtext"></span></div>
  <button id="c_copy">Copy install command</button>
  <button id="c_share">🔗 Share</button>
  <button id="c_publish">⭐ Publish</button>
  <button id="c_reset" class="ghost" style="font-weight:500">Reset</button>
  <div class="minilinks">peek under the hood: <a id="lnkCfg" href="#" target="_blank" rel="noreferrer">tweakcc config</a> · <a id="lnkSl" href="#" target="_blank" rel="noreferrer">status-line script</a> — the install command applies via <span class="mono">npx tweakcc</span>, re-run it after Claude Code updates</div>
</div>
<div style="height:110px"></div>
<style>@media(max-width:980px){body{padding-bottom:110px;}}</style>
<div id="toast"></div>
<script>var PRESETS=${payload};
var NAV=${navPayload('studio')};
var STARTERS=${JSON.stringify(STARTERS)};
${clientLib}
${TERM_SRC}
${STUDIO_JS}
</script></body></html>`;
}

// STUDIO_CSS is exported because /cmux reuses the same control primitives
// (.panel/.ctl/.stychip/.i/.tip/.paneswitch/.barbot). Two copies of that CSS would
// drift, and the two pages are meant to look like one product.
module.exports = { renderCustomize, STUDIO_CSS };
