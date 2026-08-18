// The /herdr page — a standalone editor for herdr's looks and behaviour.
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
  HERDR_DEFAULTS, HERDR_THEMES, BIN_VERIFIED_THEMES, THEME_SIBLINGS, THEME_SLOTS,
  HERDR_PLUGINS, SHELL_MODES, NEW_CWD, COLLAPSED_MODES, HOST_CURSORS, TAB_POSITIONS,
  AGENT_SORTS, TOAST_DELIVERY, TOAST_POSITIONS, CLIP_POSITIONS, UPDATE_CHANNELS,
  PREFIXES, SOUND_AGENTS, SOUND_MODES, PANE_SPLITS, QA_TYPES, HP_LIMITS,
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
  .hpair{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
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
    color:var(--hd-tabdim);padding:5px 9px 3px;}
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
  .hdot.idle{background:var(--hd-idle);opacity:.55;}
  .hstate{margin-left:auto;font-size:8px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--hd-statecol);}
  .hpanes{flex:1;display:flex;flex-direction:column;min-width:0;}
  .htabs{display:flex;gap:2px;padding:4px 6px 0;background:var(--hd-panel);font-size:9.5px;}
  .htabs.bottom{order:2;padding:0 6px 4px;}
  .htab{padding:3px 9px;border-radius:5px 5px 0 0;color:var(--hd-tabdim);white-space:nowrap;}
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
    background:var(--hd-scroll);}
  /* The toast, when notifications are on — it is the one setting whose effect is
     invisible unless the mock draws it. */
  .htoast{position:absolute;font-size:8.5px;background:var(--hd-panel);color:var(--hd-text);
    border:1px solid var(--hd-accent);border-radius:6px;padding:4px 7px;max-width:62%;
    box-shadow:0 6px 16px rgba(0,0,0,.5);}
  .htoast.bottom-right{right:7px;bottom:7px;} .htoast.bottom-left{left:7px;bottom:7px;}
  .htoast.top-right{right:7px;top:7px;} .htoast.top-left{left:7px;top:7px;}
  .htoast.top-center{left:50%;transform:translateX(-50%);top:7px;}
  .htoast.bottom-center{left:50%;transform:translateX(-50%);bottom:7px;}
  /* The clipboard toast is herdr's own copy-confirmation bubble, drawn dimmer so it
     reads as a different thing from a notification toast. */
  .htoast.clip{border-color:var(--hd-chrome);color:var(--hd-dim);}
  .hbadge{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin-bottom:7px;}
  .hbadge b{color:var(--text);letter-spacing:.02em;}
  .hbadge .pill{border:1px solid var(--border);border-radius:20px;padding:2px 9px;
    font-size:10.5px;letter-spacing:.04em;}
  .hbadge .pill.aft{border-color:var(--accent);color:var(--accent);}
  .hbadge .pill.plus{border-color:var(--gold);color:var(--gold);}

  /* ── the herdr-plus preview mode ──────────────────────────────────────────
     A third pane: what the plus builders below BUILD, rendered the way herdr-plus
     shows it — the project browser in the sidebar (named groups sorted
     case-insensitively, group-less under Ungrouped), the active project's tabs and
     panes in the window, the quick-action launcher floating on top, and worktree
     layouts as status chips (they only fire on herdr's own worktree events, so a
     chip plus a tip is the honest rendering). One column at every width, so the
     switch — hidden on desktop elsewhere — is always visible on this page. */
  .paneswitch{display:flex;gap:8px;}
  .hpair .hcol-plus{display:none;grid-column:1/-1;}
  .hpair[data-pane="plus"] .hcol-plus{display:block;}
  .hpair[data-pane="plus"] .hcol-before,.hpair[data-pane="plus"] .hcol-after{display:none;}
  .hplpick{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 7px;}
  .hplpick button{cursor:pointer;font-family:inherit;font-size:10.5px;
    border:1px solid var(--border);background:#10141b;color:var(--dim);
    border-radius:14px;padding:3px 10px;max-width:180px;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap;}
  .hplpick button.on{border-color:var(--accent);color:var(--accent);}
  .hplitem{padding:3px 9px 4px;}
  .hplitem[data-pp]{cursor:pointer;}
  .hplitem .hplname{font-size:var(--hd-sidefont);color:var(--hd-dim);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .hplitem .hpldim{font-size:8.5px;color:var(--hd-tabdim);
    white-space:normal;overflow:hidden;}
  .hplitem.on{background:var(--hd-selwash);box-shadow:inset 2px 0 0 var(--hd-accent);}
  .hplitem.on .hplname{color:var(--hd-text);}
  .hplwsp{display:flex;align-items:baseline;gap:6px;padding:5px 8px 0;
    background:var(--hd-panel);font-size:8px;letter-spacing:.1em;
    text-transform:uppercase;color:var(--hd-tabdim);white-space:nowrap;overflow:hidden;}
  .hplwsp b{color:var(--hd-text);font-size:9.5px;letter-spacing:.02em;
    overflow:hidden;text-overflow:ellipsis;}
  .htab[data-pt]{cursor:pointer;}
  .hplsplit{display:flex;min-width:0;gap:var(--hd-gap);padding:var(--hd-gap);
    height:var(--dock-h,min(30dvh,230px));}
  .hplbox{flex:1;display:flex;min-width:0;min-height:0;gap:var(--hd-gap);}
  .hplbox.v{flex-direction:column;}
  .hplpane{flex:1;min-width:0;min-height:0;overflow:hidden;padding:6px 8px;
    background:var(--hd-bg);border:var(--hd-bw) solid var(--hd-pane);border-radius:5px;}
  .hplcmd{font-size:10px;line-height:1.5;color:var(--hd-text);
    white-space:pre-wrap;word-break:break-word;}
  .hplcmd .hplps{color:var(--hd-accent);}
  .hplcmd.hplsh{color:var(--hd-tabdim);}
  .hpllaunch{position:absolute;left:50%;top:9%;transform:translateX(-50%);z-index:3;
    width:min(320px,88%);max-height:84%;overflow:hidden;font-size:10px;
    background:var(--hd-panel);border:1px solid var(--hd-accent);border-radius:8px;
    box-shadow:0 14px 34px rgba(0,0,0,.55);}
  .hpllaunch .hplq{padding:6px 9px;border-bottom:1px solid var(--hd-chrome);
    color:var(--hd-tabdim);}
  .hplact{padding:5px 9px;}
  .hplact.on{background:var(--hd-selwash);box-shadow:inset 2px 0 0 var(--hd-accent);}
  .hplact .hplan{color:var(--hd-text);}
  .hplact .hplad{color:var(--hd-tabdim);margin-left:6px;}
  .hpltag{font-size:7.5px;letter-spacing:.07em;text-transform:uppercase;
    border:1px solid var(--hd-chrome);border-radius:4px;padding:0 4px;
    color:var(--hd-tabdim);margin-left:6px;}
  .hplopt{display:flex;gap:6px;padding:2px 9px 2px 20px;color:var(--hd-dim);min-width:0;}
  .hplopt span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .hplopt .hplod{color:var(--hd-tabdim);}
  /* A separator is unselectable: dim, no wash, uppercase when it is a heading. */
  .hplopt.hplsep{color:var(--hd-tabdim);font-size:8px;letter-spacing:.09em;
    text-transform:uppercase;padding-top:5px;cursor:default;}
  .hplopt.hplspacer{height:7px;padding:0;}
  .hplform{margin:2px 9px 7px 20px;}
  .hplform .hplfp{color:var(--hd-dim);margin-bottom:3px;}
  .hplform .hplfi{border:1px solid var(--hd-chrome);border-radius:4px;padding:3px 6px;
    color:var(--hd-tabdim);background:var(--hd-bg);}
  .hplstatus{display:flex;gap:5px;flex-wrap:wrap;align-items:center;padding:5px 8px 6px;
    background:var(--hd-panel);border-top:1px solid var(--hd-chrome);
    font-size:8.5px;color:var(--hd-dim);}
  .hplchip{border:1px solid var(--hd-chrome);border-radius:9px;padding:1px 7px;
    max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .hplchip b{color:var(--hd-text);}
  .hplstatus .hpltip{flex:1 1 100%;color:var(--hd-tabdim);}
  .hplempty{padding:30px 16px;text-align:center;font-size:11px;line-height:1.8;
    color:var(--hd-tabdim);}
  /* ── the plus-mode first-run guide ────────────────────────────────────────
     Shown inside the preview window while herdr-plus has nothing to render: what
     the plugin is, what each of its three artifacts does, and buttons that jump to
     (and briefly flash) the builder panel that makes each one. Painted with the
     same --hd-* vars as the rest of the window, so themes restyle it too. */
  .hplguide{padding:15px 16px 14px;background:var(--hd-bg);}
  .hplghead{font-size:12px;line-height:1.65;color:var(--hd-text);max-width:680px;
    margin:0 0 11px;}
  .hplghead b{color:var(--gold);letter-spacing:.03em;}
  .hplgcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
    gap:9px;margin-bottom:11px;}
  .hplgcard{border:1px solid var(--hd-chrome);border-radius:8px;background:var(--hd-panel);
    padding:9px 10px 8px;display:flex;flex-direction:column;gap:5px;min-width:0;}
  .hplgname{font-size:11px;font-weight:600;color:var(--hd-text);letter-spacing:.04em;}
  .hplgwhat{font-size:10px;line-height:1.55;color:var(--hd-tabdim);flex:1;}
  .hplgbtn{cursor:pointer;font-family:inherit;font-size:10.5px;align-self:flex-start;
    border:1px solid var(--hd-accent);background:transparent;color:var(--hd-accent);
    border-radius:6px;padding:4px 10px;}
  .hplgbtn:hover{background:var(--hd-selwash);}
  .hplgex{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
  .hplgex .hplgbtn{border-color:var(--gold);color:var(--gold);}
  .hplgex span{font-size:10px;color:var(--hd-tabdim);}
  /* The jump buttons' landing flash: a gold ring that fades, then cleans up. */
  .hpflash{animation:hpflashk 1.2s ease-out;}
  @keyframes hpflashk{
    0%,45%{box-shadow:0 0 0 3px var(--gold),0 10px 30px rgba(229,192,123,.25);}
    100%{box-shadow:0 0 0 3px rgba(229,192,123,0);}}
  /* The full-width group header above the herdr-plus builder panels. */
  .hpheadrow{margin:26px 0 0;padding-top:18px;border-top:1px solid var(--border);}
  .hpheadrow h2{margin:0 0 7px;font-size:17px;text-transform:uppercase;
    letter-spacing:.13em;color:var(--gold);display:flex;align-items:center;gap:9px;}
  .hpheadrow p{margin:0;font-size:12px;line-height:1.6;color:var(--dim);max-width:880px;}
  /* The plus-mode hint chip beside the pane switch: only while the plus preview is
     showing rendered entries, so nobody hunts for edit controls inside the mock. */
  .paneswitch{flex-wrap:wrap;}
  .hplhintchip{display:none;align-items:center;cursor:pointer;font-family:inherit;
    font-size:10.5px;color:var(--faint);border:1px dashed var(--border);
    background:transparent;border-radius:14px;padding:3px 11px;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis;max-width:100%;min-width:0;}
  .hplhintchip:hover{color:var(--dim);border-color:var(--dim);}
  .hplhintchip.show{display:inline-flex;}

  /* ── saved setups ─────────────────────────────────────────────────────────── */
  .svrow{display:flex;flex-direction:column;gap:7px;}
  .svchip{display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;
    font-family:inherit;border:1px solid var(--border);background:#10141b;
    border-radius:10px;padding:8px 11px;color:var(--dim);width:100%;}
  .svchip:hover{border-color:var(--accent);}
  .svchip.savecard{border-style:dashed;}
  .svsw{display:flex;gap:4px;flex:none;}
  .svsw i{width:10px;height:10px;border-radius:50%;}
  .svbody{flex:1;min-width:0;}
  .svname{font-size:12.5px;font-weight:600;color:var(--text);overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap;}
  .svmeta{font-size:10.5px;color:var(--faint);margin-top:1px;}
  .svacts{display:flex;gap:9px;flex:none;font-size:10.5px;}
  .svact{color:var(--faint);text-decoration:underline;text-underline-offset:2px;padding:6px 2px;}
  .svact:hover{color:var(--accent);}

  /* Pinned: the mock rides the top with the controls sliding under it, offset by the
     sticky switch row above. The terminal takes a fixed height while pinned so the
     window stops growing with its content, and a dragged height overrides that through
     the var's fallback. */
  body.pinned .hpair{position:sticky;top:var(--switch-h,46px);z-index:45;background:var(--bg);
    padding-bottom:12px;box-shadow:0 16px 20px -14px rgba(0,0,0,.75);}
  body.pinned .hterm{height:var(--dock-h,min(26dvh,200px));flex:none;overflow:hidden;}
  body.docked .hterm{height:var(--dock-h);flex:none;overflow:hidden;}

  @media(max-width:1100px){.hpair{grid-template-columns:1fr 1fr;}
}
  .hpanels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;
    align-items:start;}
  /* Grid items refuse to shrink below their content's min width by default, and the
     .hfiles boxes hold preformatted TOML — without this the files panels forced the
     whole page wider than a phone, instead of scrolling inside their own boxes. */
  .hpanels>.panel{min-width:0;}
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
  .hfilename{font-size:10.5px;letter-spacing:.05em;color:var(--gold);margin:10px 0 4px;
    font-family:ui-monospace,Menlo,monospace;}

  /* "no visual change" badge — the honest label for a key the mock cannot show. */
  .nov{margin-left:7px;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--faint);border:1px solid var(--border);border-radius:5px;padding:1px 5px;
    white-space:nowrap;}

  /* Theme-chip corner tag for names whose only evidence is the 0.8.0 binary. */
  .hcbadge{font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);
    padding:0 9px 6px;}

  /* ── the 16 [theme.custom] tokens ─────────────────────────────────────────── */
  #tokGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:7px;}
  .tokrow{display:flex;align-items:center;gap:7px;border:1px solid var(--border);
    border-radius:8px;padding:6px 8px;background:#10141b;overflow:hidden;}
  .tokrow .tokname{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--dim);
    width:86px;flex:none;overflow:hidden;text-overflow:ellipsis;}
  .tokrow.set{border-color:var(--accent);}
  .tokrow .stychip{padding:3px 8px;font-size:10.5px;flex:none;}
  .tokrow input[type=color]{width:30px;height:22px;border:1px solid var(--border);
    border-radius:5px;background:#0b0e14;padding:1px;cursor:pointer;flex:none;}
  .tokrow .tokfile{font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;
    color:var(--faint);margin-left:auto;white-space:nowrap;min-width:0;
    overflow:hidden;text-overflow:ellipsis;}

  /* ── herdr-plus builders ──────────────────────────────────────────────────── */
  .hpcard{border:1px solid var(--border);border-radius:10px;background:#10141b;
    padding:9px 10px;margin-bottom:9px;}
  .hpcard .hprow{display:flex;gap:7px;align-items:center;margin-bottom:6px;flex-wrap:wrap;}
  .hpcard input[type=text],.hpcard select{background:#0b0e14;border:1px solid var(--border);
    border-radius:7px;color:var(--text);font-family:inherit;font-size:12px;
    padding:5px 8px;min-width:0;}
  .hpcard input.grow{flex:1;}
  .hpcard input.hpmono{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;}
  .hptab{border:1px dashed var(--border);border-radius:8px;padding:7px 8px;margin:6px 0;}
  .hptab .hptabhead{display:flex;gap:7px;align-items:center;margin-bottom:5px;flex-wrap:wrap;}
  .hpdel{cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--faint);
    border-radius:6px;font-family:inherit;font-size:11px;padding:4px 8px;flex:none;}
  .hpdel:hover{border-color:var(--red,#f7768e);color:var(--red,#f7768e);}
  .hpadd{cursor:pointer;border:1px dashed var(--border);background:transparent;color:var(--dim);
    border-radius:7px;font-family:inherit;font-size:11.5px;padding:5px 10px;margin:2px 6px 2px 0;}
  .hpadd:hover{border-color:var(--accent);color:var(--accent);}
  .hpaneline{display:flex;gap:6px;align-items:center;margin:4px 0;}
  .hphint{font-size:10.5px;color:var(--faint);margin:4px 0 0;line-height:1.5;}
  .hpwarn{font-size:10.5px;color:var(--gold);margin:4px 0 0;}
  .hpsep{border-top:1px dashed var(--border);margin:8px 0;}

  .hhead{padding-bottom:2px;}
  .hhead h1{font-size:32px;}

  @media(max-width:700px),(max-height:520px){
    .hwrap{padding:0 12px 40px;}
    .hpair{grid-template-columns:1fr;gap:0;}
    .hpair[data-pane="before"] .hcol-after{display:none;}
    .hpair[data-pane="after"] .hcol-before{display:none;}
    .hhead h1{font-size:25px;margin-bottom:2px;}
    .hhead .sub{font-size:12.5px;line-height:1.5;}
    .hterm{height:min(30dvh,200px);flex:none;font-size:calc(var(--hd-font) * .9);}
    .hpanels{grid-template-columns:1fr;}
    .hbadge span:last-child{display:none;}
    /* Three switch buttons share the row; the studio's 1fr 1fr grid was for two. */
    .pswbtn{flex:1 1 0;min-width:0;padding:0 6px;}
    /* On a phone the buttons fill the row, so the hint chip wraps under them. */
    .hplhintchip.show{flex:1 1 100%;justify-content:center;}
    .hplsplit{height:var(--dock-h,min(26dvh,190px));}
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
    themes: HERDR_THEMES, binVerified: BIN_VERIFIED_THEMES, siblings: THEME_SIBLINGS,
    slots: THEME_SLOTS, shellModes: SHELL_MODES, newCwd: NEW_CWD,
    collapsed: COLLAPSED_MODES, cursors: HOST_CURSORS, tabPositions: TAB_POSITIONS,
    sorts: AGENT_SORTS, toastDelivery: TOAST_DELIVERY, toastPositions: TOAST_POSITIONS,
    clipPositions: CLIP_POSITIONS, channels: UPDATE_CHANNELS, prefixes: PREFIXES,
    soundAgents: SOUND_AGENTS, soundModes: SOUND_MODES, splits: PANE_SPLITS,
    qaTypes: QA_TYPES, limits: HP_LIMITS,
  });
  const themePreview = JSON.stringify(THEME_PREVIEW);
  const plugins = JSON.stringify(HERDR_PLUGINS);
  const lines = JSON.stringify(LINES);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>herdr · shayan-cc-config</title>${favicon}<style>${baseCss}${TERM_CSS}${STUDIO_CSS}${COMPARE_CSS}${HERDR_CSS}</style></head><body class="pinned">
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
      <button type="button" class="pswbtn" data-pane="plus" role="tab" aria-selected="false">＋ herdr plus</button>
      <button type="button" class="hplhintchip" id="hplHint"
        title="Jump to the HERDR PLUS builder panels">editing happens in the HERDR PLUS panels below ↓</button>
    </div>
    <button type="button" id="pinbtn" class="pinbtn on" aria-pressed="true"
      title="Keep the preview on screen while you scroll through the controls">
      <span class="pico">\u{1F4CC}</span><span class="ptxt">Preview pinned</span></button>
  </div>
  <div class="hpair" data-pane="after" id="pair">
    <div class="hcol hcol-before">
      <div class="hbadge"><span class="pill">before</span><b>Stock herdr</b><span>— every default, straight from 0.8.0</span></div>
      <div id="winBefore"></div>
    </div>
    <div class="hcol hcol-after">
      <div class="hbadge"><span class="pill aft">after</span><b>Your herdr</b><span>— herding a sample agent</span></div>
      <div id="winAfter"></div>
    </div>
    <div class="hcol hcol-plus">
      <div class="hbadge"><span class="pill plus">plus</span><b>herdr-plus</b><span>— what the builders below make, rendered live</span></div>
      <div id="winPlus"></div>
    </div>
    <div class="dockgrip" id="dockgrip" role="separator" aria-orientation="horizontal" tabindex="0"
      aria-label="Resize the preview. Arrow keys adjust the height, Home resets it."
      title="Drag to resize the preview · double-click to reset">
      <span class="gbar"></span><span class="gtxt">drag to resize</span><span class="gbar"></span>
    </div>
  </div>

  <div class="panel" style="margin-bottom:14px"><h3>\u{1F3A8} Theme</h3>
    <p class="phint">herdr ships 18 built-in themes. Pick one and the whole window follows —
    sidebar, panes, state dots. <b>terminal</b> is the odd one out: it follows your terminal's
    own ANSI palette instead of setting colours. The light variants tagged
    <span class="mono">binary-verified</span> exist as names in the 0.8.0 binary but the docs
    never enumerate them; a wrong name falls back quietly, it never breaks.</p>
    <div id="hthemeGrid"></div>
    <div id="hthemeNote" class="pnote"></div>
    <div class="hpsep"></div>
    <label class="ctl2"><input type="checkbox" id="t_autoSwitch"><span>Follow the terminal's
      light/dark appearance (<span class="mono">theme.auto_switch</span>)</span></label>
    <div class="hprow" id="autoRow" style="display:flex;gap:10px;flex-wrap:wrap">
      <label class="ctl" style="margin-bottom:0"><span class="cap">Light theme</span><select id="t_lightName"></select></label>
      <label class="ctl" style="margin-bottom:0"><span class="cap">Dark theme</span><select id="t_darkName"></select></label>
    </div>
    <p class="phint" id="autoHint" style="margin-top:7px">Left unset, herdr picks each theme's own
    sibling (e.g. catppuccin ↔ catppuccin-latte). The names are only written to the file while
    auto-switch is on.</p>
  </div>

  <div class="panel" style="margin-bottom:14px"><h3>\u{1F58C} Custom colours — all 16 tokens</h3>
    <p class="phint"><span class="mono">[theme.custom]</span> layers per-token overrides on top of
    whichever base theme is active — all 16 slots the 0.8.0 binary accepts, each Default or a hex
    colour of yours (<span class="mono">panel_bg</span> also takes <b>reset</b> = your terminal's own
    background). Only the tokens you set are written; set none and the section is omitted entirely.</p>
    <div id="tokGrid"></div>
    <p class="phint" style="margin-top:9px">Honesty note: the preview maps
    <span class="mono">panel_bg</span>→sidebar/panel, <span class="mono">text</span>→text,
    <span class="mono">accent</span>→accent + selection, <span class="mono">green/yellow/red/blue</span>→state
    dots, and the surface/overlay tokens→borders, scrollbars and dimmed chrome — an
    <b>approximate</b> mapping, since the real UI uses them in more places than this mock draws.
    <span class="mono">mauve/teal/peach</span> have no surface in the mock at all; they land in the
    file only.</p>
  </div>

  <div class="hpanels" id="herdrControls"></div>

  <div class="panel" style="margin-top:16px"><h3>\u{1F9E9} Plugins</h3>
    <p class="phint">A herdr plugin is any executable plus a manifest — Bash, JS, Lua, a Rust
    binary. These are real listings from the marketplace, ordered by stars. Tick any and the
    install command below adds <span class="mono">herdr plugin install</span> lines for them.</p>
    <div class="plugrid" id="pluginGrid"></div>
    <div class="plucmds" id="pluCmds"></div>
    <p class="pluwarn"><b>Worth knowing before you tick one.</b> The marketplace is an
    <i>automatic</i> index of public repos tagged <span class="mono">herdr-plugin</span>, refreshed
    every 30 minutes — herdr validates a plugin's manifest but does <b>not</b> review or sandbox
    what it does, and there is no plugin update command in v1. Installing one runs somebody
    else's code on your machine with your permissions. Read the repo first.</p>
  </div>

  <div class="hpheadrow" id="hp-build">
    <h2>＋ HERDR PLUS — build here</h2>
    <p>Everything the <b>＋ herdr plus</b> preview up top can show is built in the panels below:
    projects that open whole workspaces, quick actions for the launcher, and worktree layouts.
    herdr-plus itself is a free, MIT-licensed plugin — the installer can add it for you; just
    tick the box in the next panel.</p>
  </div>

  <div class="panel" style="margin-top:16px"><h3>➕ herdr-plus</h3>
    <p class="phint"><b>herdr-plus</b> is a free, MIT-licensed herdr plugin by Cloudmanic Labs
    (<a href="https://github.com/cloudmanic/herdr-plus" target="_blank" rel="noreferrer" style="color:var(--accent)">cloudmanic/herdr-plus</a>)
    that adds a project browser, quick actions and per-repo worktree layouts. There is no central
    config: <b>every entry is its own TOML file</b>. Build them below; the installer writes each one
    as <span class="mono">scc-&lt;name&gt;.toml</span> into the plugin's config directory — and only
    ever touches <span class="mono">scc-*.toml</span> files, never your own.</p>
    <label class="ctl2"><input type="checkbox" id="hp_install"><span>Install the plugin
      (<span class="mono">herdr plugin install cloudmanic/herdr-plus</span>) — runs its code, like any plugin</span></label>
    <p class="phint" style="margin-top:6px">Commands run via <span class="mono">sh -c</span> when
    <i>you</i> trigger them, and they are Go templates: <span class="mono">{{.Value}}</span> is the
    picked option / typed form value, and every field is also in the environment as
    <span class="mono">HERDR_PLUS_*</span> (VALUE, WORKDIR, SESSION_TITLE, …). If you remove every
    entry later, also delete the old <span class="mono">scc-*.toml</span> files by hand — the
    installer only rewrites them while at least one entry exists.</p>
  </div>

  <div class="hpanels" style="margin-top:14px">
    <div class="panel" id="hp-projects"><h3>\u{1F4C1} Projects</h3>
      <p class="phint">One workspace per file: a name, an optional group for the browser, a
      working directory (~ and $VARS expand), and 1+ tabs — each tab either runs a command or
      splits into up to 4 panes (never both; that is a load error upstream). Entries missing a
      name or a named tab are left out of the files below.</p>
      <div id="hpProjects"></div>
    </div>
    <div class="panel" id="hp-actions"><h3>⚡ Quick actions</h3>
      <p class="phint">Launcher entries: <b>command</b> just runs; <b>select</b> offers options
      (label shown, value substituted at <span class="mono">{{.Value}}</span> or appended
      shell-quoted; a row with no label is a separator — give it a heading for a group title);
      <b>form</b> asks for a value first. A select needs at least one labelled option or it is
      left out.</p>
      <div id="hpActions"></div>
    </div>
    <div class="panel" id="hp-trees"><h3>\u{1F33F} Worktree layouts</h3>
      <p class="phint">Fires when herdr opens a worktree whose repo basename matches
      <span class="mono">repo</span> (case-insensitive; optional exact branch narrows it) — the
      tabs/panes shape is identical to projects. Only herdr's own worktree events trigger it,
      not a plain <span class="mono">git worktree add</span>.</p>
      <div id="hpTrees"></div>
    </div>
  </div>

  <div class="hpanels" style="margin-top:16px">
    <div class="panel"><h3>\u{1F4C4} config.toml</h3>
      <p class="phint">The keys this page manages, exactly as the installer writes them into
      <span class="mono">~/.config/herdr/config.toml</span>. The installer <b>merges</b>, it does not
      replace: it backs your file up, parses it (and <b>aborts if it doesn't parse</b>), keeps every
      key and table it doesn't manage — <span class="mono">onboarding</span>, your
      <span class="mono">[[keys.command]]</span> bindings, sound file paths, all of it — and
      validates the result before writing a byte. Kept keys survive as values; their comments and
      ordering may move.</p>
      <div class="hfiles" id="tomlOut"></div>
    </div>
    <div class="panel"><h3>\u{1F9E9} herdr-plus files</h3>
      <p class="phint">One file per entry, verbatim — these exact bytes land as
      <span class="mono">scc-*.toml</span> under
      <span class="mono">herdr plugin config-dir cloudmanic.herdr-plus</span>
      (falling back to <span class="mono">~/.config/herdr-plus</span>).</p>
      <div class="hfiles" id="plusFiles"></div>
    </div>
    <div class="panel"><h3>\u{1F4E6} Getting herdr</h3>
      <p class="phint">The installer skips the herdr layer if the binary is missing, so it is
      safe to run either way — but nothing will happen until herdr is on the machine.</p>
      <div class="hfiles">curl -fsSL https://herdr.dev/install.sh | sh
<span style="color:#5b6470"># or</span>
brew install herdr</div>
      <p class="phint" style="margin-top:11px">This page configures <b>herdr and nothing else</b>: the installer
      writes only herdr's own config. Per-agent integrations (conversation resume) are herdr's own
      <span class="mono">herdr integration install</span> command — run it yourself if you want it; nothing here
      touches any other tool's files.</p>
    </div>
  </div>

  <div class="panel" style="margin-top:16px"><h3>\u{1F9EA} How this was verified — and what is deliberately missing</h3>
    <p class="phint">Every config key, enum and default on this page was read from herdr 0.8.0's own
    <span class="mono">herdr --default-config</span> (the authoritative 324-line commented schema) and
    its binary's serde tables, cross-checked against the published docs — nothing is guessed. The 16
    <span class="mono">[theme.custom]</span> slots are the binary's exact
    <span class="mono">CustomThemeColors</span> field list (<span class="mono">sidebar_bg</span> exists
    only on master, so it is deliberately not offered). The six light-variant theme names carry a
    <b>binary-verified</b> badge because the docs never enumerate them. The herdr-plus schemas —
    projects, quick actions, worktree layouts, the 4-pane cap, the command/panes exclusivity, the
    separator rules — are from herdrplus.com's docs, read in full.</p>
    <p class="phint"><b>herdr-plus has no colour surface of its own.</b> Its docs define no theme, no
    colours, no fonts, no styling keys at all — every colour lives in herdr's own
    <span class="mono">[theme]</span> above. Anything promising otherwise would be invented.</p>
    <p class="phint"><b>Deliberately skipped:</b> <span class="mono">[[keys.command]]</span> (a share
    link must not bind shell to a keypress), <span class="mono">ui.sound.path</span> and friends (file
    paths this page cannot validate), <span class="mono">remote.*</span>, the per-token sidebar row
    styling DSL (<span class="mono">{ token, fg, bold, dim }</span> — a deep grammar the preview could
    not show honestly; the two row presets here emit only verified tokens), and the
    <span class="mono">[experimental]</span> CJK/IME keys (experimental and unstable upstream). The
    per-agent sound list offers a fixed subset of herdr's agent ids; the merge keeps any others you
    set by hand — as it keeps every key this page does not manage.</p>
  </div>

${compareBlock('herdr')}
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
var state=null;

function defaultHerdr(){var d=copyObj(HD_DEFAULTS);d.plugins=[];d.on=true;return d;}
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
// herdr-plus text: printable only (control chars, zero-width and bidi controls out),
// capped. Free text is fine HERE because it only ever lands in value="" attributes via
// esc() and in the server-built TOML via its own escaper — never in style or class.
var HP_CTRL=/[\\x00-\\x1f\\x7f-\\x9f\\u200b-\\u200f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069]/g;
function hpText(v,max){return typeof v==='string'?v.replace(HP_CTRL,'').slice(0,max).replace(/^ +| +$/g,''):'';}
function hpWorkdir(v){
  if(typeof v!=='string')return '';
  var s=v.replace(/^ +| +$/g,'');
  if(!s||s.length>120)return '';
  if(!/^[~$A-Za-z0-9._\\/ -]+$/.test(s))return '';
  if(s.indexOf('..')>=0)return '';
  return s;
}
function saneTabs(list){
  if(Object.prototype.toString.call(list)!=='[object Array]')return [];
  var out=[];
  for(var i=0;i<list.length&&i<HD_OPTS.limits.tabs;i++){
    var t=list[i];
    if(!t||typeof t!=='object')continue;
    var panes=[];
    if(Object.prototype.toString.call(t.panes)==='[object Array]'){
      for(var j=0;j<t.panes.length&&j<HD_OPTS.limits.panes;j++){
        var p=t.panes[j];
        if(!p||typeof p!=='object')continue;
        panes.push({command:hpText(p.command,200),split:hPick(p.split,HD_OPTS.splits,'down')});
      }
    }
    out.push({name:hpText(t.name,40),command:panes.length?'':hpText(t.command,200),panes:panes});
  }
  return out;
}
// Shapes only — validity (required fields) is the server builder's call, so a
// half-typed entry survives a reload instead of vanishing.
function sanePlus(pl){
  var out={install:false,projects:[],quickActions:[],worktrees:[]};
  if(!pl||typeof pl!=='object')return out;
  out.install=pl.install===true;
  var i,e;
  if(Object.prototype.toString.call(pl.projects)==='[object Array]'){
    for(i=0;i<pl.projects.length&&i<HD_OPTS.limits.projects;i++){
      e=pl.projects[i];
      if(!e||typeof e!=='object')continue;
      out.projects.push({name:hpText(e.name,60),description:hpText(e.description,120),
        group:hpText(e.group,60),workingDir:hpWorkdir(e.workingDir),tabs:saneTabs(e.tabs)});
    }
  }
  if(Object.prototype.toString.call(pl.quickActions)==='[object Array]'){
    for(i=0;i<pl.quickActions.length&&i<HD_OPTS.limits.quickActions;i++){
      e=pl.quickActions[i];
      if(!e||typeof e!=='object')continue;
      var opts=[];
      if(Object.prototype.toString.call(e.options)==='[object Array]'){
        for(var j=0;j<e.options.length&&j<HD_OPTS.limits.options;j++){
          var o=e.options[j];
          if(!o||typeof o!=='object')continue;
          opts.push({label:hpText(o.label,60),value:hpText(o.value,200),
            description:hpText(o.description,120),heading:hpText(o.heading,60),sep:o.sep===true});
        }
      }
      var form=(e.form&&typeof e.form==='object')
        ?{prompt:hpText(e.form.prompt,80),placeholder:hpText(e.form.placeholder,80)}
        :{prompt:'',placeholder:''};
      out.quickActions.push({name:hpText(e.name,60),description:hpText(e.description,120),
        type:hPick(e.type,HD_OPTS.qaTypes,'command'),command:hpText(e.command,200),
        options:opts,form:form});
    }
  }
  if(Object.prototype.toString.call(pl.worktrees)==='[object Array]'){
    for(i=0;i<pl.worktrees.length&&i<HD_OPTS.limits.worktrees;i++){
      e=pl.worktrees[i];
      if(!e||typeof e!=='object')continue;
      out.worktrees.push({repo:hpText(e.repo,60),branch:hpText(e.branch,60),tabs:saneTabs(e.tabs)});
    }
  }
  return out;
}
function saneHerdr(o){
  var d=defaultHerdr();
  if(!o||typeof o!=='object')return d;
  var ids=HD_PLUGINS.map(function(p){return p.id;});
  // [theme.custom]: hex-or-drop per slot; panel_bg also accepts the "reset" alias.
  var tokens={};
  var tsrc=(o.tokens&&typeof o.tokens==='object')?o.tokens:{};
  for(var ti=0;ti<HD_OPTS.slots.length;ti++){
    var slot=HD_OPTS.slots[ti];
    var tv=hHex(tsrc[slot],null);
    if(tv)tokens[slot]=tv;
    else if(slot==='panel_bg'&&tsrc[slot]==='reset')tokens[slot]='reset';
  }
  // Older links carried customAccent/accentColor; fold them into the accent token.
  if(!tokens.accent&&o.customAccent===true){
    var legacy=hHex(o.accentColor,null);
    if(legacy)tokens.accent=legacy;
  }
  var soundAgents={};
  var sag=(o.soundAgents&&typeof o.soundAgents==='object')?o.soundAgents:{};
  for(var si=0;si<HD_OPTS.soundAgents.length;si++){
    var ag=HD_OPTS.soundAgents[si];
    if(sag[ag]==='on'||sag[ag]==='off')soundAgents[ag]=sag[ag];
  }
  var sbMin=hNum(o.sidebarMinWidth,10,36,d.sidebarMinWidth);
  var sbMax=hNum(o.sidebarMaxWidth,20,80,d.sidebarMaxWidth);
  if(sbMax<sbMin)sbMax=sbMin;
  var sbW=hNum(o.sidebarWidth,18,36,d.sidebarWidth);
  sbW=Math.max(sbMin,Math.min(sbMax,sbW));
  return {
    theme:hPick(o.theme,HD_OPTS.themes,d.theme),
    autoSwitch:hBool(o.autoSwitch,d.autoSwitch),
    lightName:hPick(o.lightName,HD_OPTS.themes,d.lightName),
    darkName:hPick(o.darkName,HD_OPTS.themes,d.darkName),
    tokens:tokens,
    defaultShell:hpText(o.defaultShell,200),
    shellMode:hPick(o.shellMode,HD_OPTS.shellModes,d.shellMode),
    newCwd:hPick(o.newCwd,HD_OPTS.newCwd,d.newCwd),
    prefix:hPick(o.prefix,HD_OPTS.prefixes,d.prefix),
    sidebarWidth:sbW,
    sidebarMinWidth:sbMin,
    sidebarMaxWidth:sbMax,
    mobileWidthThreshold:hNum(o.mobileWidthThreshold,20,200,d.mobileWidthThreshold),
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
    promptNewTabName:hBool(o.promptNewTabName,d.promptNewTabName),
    promptNewWorkspaceName:hBool(o.promptNewWorkspaceName,d.promptNewWorkspaceName),
    toastDelivery:hPick(o.toastDelivery,HD_OPTS.toastDelivery,d.toastDelivery),
    toastDelaySeconds:hNum(o.toastDelaySeconds,0,3600,d.toastDelaySeconds),
    toastPosition:hPick(o.toastPosition,HD_OPTS.toastPositions,d.toastPosition),
    clipToastEnabled:hBool(o.clipToastEnabled,d.clipToastEnabled),
    clipToastPosition:hPick(o.clipToastPosition,HD_OPTS.clipPositions,d.clipToastPosition),
    soundEnabled:hBool(o.soundEnabled,d.soundEnabled),
    soundAgents:soundAgents,
    resumeAgents:hBool(o.resumeAgents,d.resumeAgents),
    scrollbackBytes:hNum(o.scrollbackBytes,1000000,200000000,d.scrollbackBytes),
    worktreeDir:hPath(o.worktreeDir,d.worktreeDir),
    updateChannel:hPick(o.updateChannel,HD_OPTS.channels,d.updateChannel),
    versionCheck:hBool(o.versionCheck,d.versionCheck),
    manifestCheck:hBool(o.manifestCheck,d.manifestCheck),
    paneHistory:hBool(o.paneHistory,d.paneHistory),
    allowNested:hBool(o.allowNested,d.allowNested),
    kittyGraphics:hBool(o.kittyGraphics,d.kittyGraphics),
    plugins:(Object.prototype.toString.call(o.plugins)==='[object Array]'
      ? o.plugins.filter(function(x){return ids.indexOf(x)>=0;}) : []),
    plus:sanePlus(o.plus),
    on:true
  };
}

// The fixed palette the sample agent session paints with. This page is standalone:
// a fixed sample in these colours, not a payload from anywhere.
var DEFAULT_PAL={bg:[26,27,38],raised:[41,46,66],text:[192,202,245],
  comment:[86,95,137],subtle:[48,52,70],accent:[122,162,247],accent2:[187,154,247],
  cyan:[125,207,255],green:[158,206,106],red:[247,118,142],orange:[255,158,100],
  yellow:[224,175,104],pink:[187,154,247],blue:[122,162,247]};

// ── the window mock ───────────────────────────────────────────────────────────
// Four agents in three workspaces, chosen so every documented state is on screen at
// once: that is the whole pitch, and a mock showing four idle panes would not make it.
var AGENTS=[
  {ws:'api',    tab:'agent',   agent:'agent',  state:'blocked', sub:'needs approval'},
  {ws:'api',    tab:'tests',   agent:'agent',  state:'working', sub:'running suite'},
  {ws:'web',    tab:'agent',   agent:'agent',  state:'done',    sub:'ready to read'},
  {ws:'infra',  tab:'shell',   agent:'',       state:'idle',    sub:''}
];

function themeOf(name){return HD_THEMES[name]||HD_THEMES['tokyo-night'];}

function winHTML(s,mode){
  var t=themeOf(s.theme);
  // [theme.custom] tokens override the base palette where the mock has a surface for
  // them. Approximate on purpose (and said so in the tip): panel_bg → panel/sidebar,
  // text → text, subtext0 → dim text, accent → accent + selection, green/yellow/red →
  // the matching state dots, blue → the idle dot, surface0/1/dim → chrome, pane borders
  // and scrollbars, overlay0/1 → inactive tabs and state text. mauve/teal/peach have no
  // surface here and only reach the file. Every value is sanitizer-vetted (#rrggbb or
  // panel_bg="reset"), so nothing here can break out of the style attribute.
  var tok=s.tokens||{};
  var accent=tok.accent||t.accent;
  var panel=tok.panel_bg?(tok.panel_bg==='reset'?t.bg:tok.panel_bg):t.panel;
  var text=tok.text||t.text;
  var dim=tok.subtext0||t.dim;
  var chrome=tok.surface0||t.panel;
  var paneEdge=tok.surface1||t.panel;
  var vars=[
    '--hd-bg:'+t.bg,'--hd-panel:'+panel,'--hd-text:'+text,'--hd-dim:'+dim,
    '--hd-accent:'+accent,'--hd-green:'+(tok.green||t.green),
    '--hd-yellow:'+(tok.yellow||t.yellow),'--hd-red:'+(tok.red||t.red),
    '--hd-idle:'+(tok.blue||dim),
    '--hd-chrome:'+chrome,'--hd-pane:'+(s.paneBorders?paneEdge:'transparent'),
    '--hd-scroll:'+(tok.surface_dim||chrome),
    '--hd-tabdim:'+(tok.overlay0||dim),'--hd-statecol:'+(tok.overlay1||dim),
    '--hd-selwash:'+hexA(accent,0.14),
    '--hd-font:'+11+'px','--hd-sidefont:'+10+'px',
    '--hd-gap:'+(s.paneGaps?'5px':'0px'),'--hd-bw:'+(s.paneBorders?'1px':'0px')
  ].join(';');

  // Sidebar width is in COLUMNS in the config; the mock scales it to pixels so dragging
  // the number visibly moves the divider instead of doing nothing.
  var sidePx=Math.round(s.sidebarWidth*4.6)+'px';
  // The plus mode reuses the exact same window vars, so a theme or token change
  // restyles this view too — it is the same window, showing herdr-plus instead.
  if(mode==='plus')return plusWin(s,vars,sidePx);
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
    +((s.hideTabBarWhenSingle)?'<div class="htab on">agent</div>':
      '<div class="htab on">agent</div><div class="htab">tests</div><div class="htab">shell</div>')
    +'</div>';

  // AFTER shows herdr doing what herdr is for: herding an agent. The session is a
  // fixed sample painted with DEFAULT_PAL — no other page's payload is read. BEFORE
  // shows an ordinary shell so the state-tracking chrome is the visible difference.
  var cc=(mode==='agent')?ccColors():null;
  var body='';
  if(mode==='agent'){
    for(var j=0;j<LINES.length;j++){
      var kind=LINES[j][0],txt=LINES[j][1];
      if(kind==='nl'){body+='</div><div class="l">';continue;}
      var col=kind==='accent'?cc.accent:kind==='green'?cc.green:kind==='dim'?cc.dim:cc.text;
      var st='color:'+col;
      if(kind==='prompt')st+=';background:'+hexA(cc.accent,0.16);
      body+='<span style="'+st+'">'+esc(txt)+'</span>';
    }
  }else{
    body='<span style="color:'+t.dim+'">$ npm test</span></div><div class="l">'
      +'<span style="color:'+t.green+'">12 passing</span>'
      +'<span style="color:'+t.dim+'"> (0.9s)</span></div><div class="l">'
      +'<span style="color:'+t.dim+'">$ </span>'
      +'<span style="color:'+t.text+'">\u2588</span>';
  }

  var paneBg=(mode==='agent')?(' style="background:'+cc.bg+'"'):'';
  var pane1='<div class="hpane active"'+paneBg+'>'
    +(s.agentLabelsOnBorders?'<div class="hlabel">agent · blocked</div>':'')
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
      s.toastDelivery==='terminal'?'terminal bell + title':'agent is blocked';
    toast='<div class="htoast '+where+'">'+esc(what)+'</div>';
  }
  // The clipboard toast is herdr's own copy bubble ([ui.toast.clipboard], on by
  // default). Drawn in the AFTER window only — it is a transient event, and the mock
  // shows the moment right after a copy. Position class is sanitizer-vetted.
  var clip='';
  if(mode==='agent'&&s.clipToastEnabled){
    clip='<div class="htoast clip '+s.clipToastPosition+'">copied ✓</div>';
  }

  var panes='<div class="hpanes" style="position:relative">'
    +(s.tabBarPosition==='bottom'?('<div class="hsplit">'+pane1+pane2+'</div>'+tabs)
      :(tabs+'<div class="hsplit">'+pane1+pane2+'</div>'))
    +toast+clip+'</div>';

  return '<div class="hwin" style="'+vars+'"><div class="hbody">'+side+panes+'</div></div>';
}

// ── the herdr-plus window ─────────────────────────────────────────────────────
// Renders what the plus builders BUILD, as herdr-plus shows it: the project browser
// in the sidebar, the active project's tabs and panes in the window, the quick-action
// launcher floating on top, and worktree layouts as status chips — chips, because a
// layout has no static screen upstream: it fires on herdr's own worktree events, so
// the strip says when it applies instead of pretending it is a thing you can see.
// Only entries that would reach a file render — the same validity rules as the server
// builder (name + a named tab; name + command, select needs a labelled option; repo +
// a named tab), so this view and the files box always agree.
//
// plusSel is which project/tab the mock LOOKS at, not payload: it never travels.
var plusSel={proj:0,tab:0};
function hpNamedTabs(tabs){
  var out=[];
  for(var i=0;i<tabs.length;i++){if(tabs[i].name)out.push(tabs[i]);}
  return out;
}
function hpLiveProjects(){
  return state.plus.projects.filter(function(p){return p.name&&hpNamedTabs(p.tabs).length;});
}
function hpLiveActions(){
  return state.plus.quickActions.filter(function(a){
    if(!a.name||!a.command)return false;
    if(a.type==='select')return a.options.some(function(o){return o.label;});
    return true;
  });
}
function hpLiveTrees(){
  return state.plus.worktrees.filter(function(w){return w.repo&&hpNamedTabs(w.tabs).length;});
}
// The browser's grouping rule, from the docs: named groups first, sorted
// case-insensitively; group-less projects under "Ungrouped". A linear scan instead of
// an object keyed on free text, so a group named "constructor" stays just a name.
function plusGroups(projs){
  var groups=[];
  for(var i=0;i<projs.length;i++){
    var p=projs[i],title=p.group||'Ungrouped',named=!!p.group,g=null;
    for(var j=0;j<groups.length;j++){
      if(groups[j].named===named&&groups[j].title===title){g=groups[j];break;}
    }
    if(!g){g={title:title,named:named,items:[]};groups.push(g);}
    g.items.push({p:p,ix:i});
  }
  groups.sort(function(a,b){
    if(a.named!==b.named)return a.named?-1:1;
    var x=a.title.toLowerCase(),y=b.title.toLowerCase();
    return x<y?-1:(x>y?1:0);
  });
  return groups;
}
function plusPane(cmd){
  return '<div class="hplpane">'+(cmd
    ?('<div class="hplcmd"><span class="hplps">$ </span>'+esc(cmd)+'</div>')
    :'<div class="hplcmd hplsh">shell</div>')+'</div>';
}
// Pane i and the remainder share a box: the NEXT pane's split says whether the rest
// lands below (down = a column) or beside (right = a row). The first pane is the tab
// root and its own split is ignored — exactly the docs' rule.
function plusTree(panes,i){
  if(i>=panes.length-1)return plusPane(panes[i].command);
  return '<div class="hplbox'+(panes[i+1].split==='right'?'':' v')+'">'
    +plusPane(panes[i].command)+plusTree(panes,i+1)+'</div>';
}
// The first-run guide: static strings only, so building it with innerHTML is safe.
// Each card names one herdr-plus artifact for a newcomer and jumps to its builder.
function hpGuideCard(icon,name,what,target){
  return '<div class="hplgcard"><div class="hplgname">'+icon+' '+name+'</div>'
    +'<div class="hplgwhat">'+what+'</div>'
    +'<button type="button" class="hplgbtn" data-hpgo="'+target+'">build one ↓</button></div>';
}
function plusWin(s,vars,sidePx){
  var projs=hpLiveProjects(),acts=hpLiveActions(),trees=hpLiveTrees();
  if(!projs.length&&!acts.length&&!trees.length){
    return '<div class="hwin" style="'+vars+'"><div class="hplguide">'
      +'<div class="hplghead"><b>herdr plus</b> — a free plugin that gives herdr'
      +' projects, quick actions and worktree layouts. Nothing is built yet: make an'
      +' entry in the gold HERDR PLUS panels further down this page and it renders'
      +' here, live.</div>'
      +'<div class="hplgcards">'
      +hpGuideCard('📁','Projects',
        'one file that opens a whole workspace: tabs, panes, commands','hp-projects')
      +hpGuideCard('⚡','Quick actions',
        'your own launcher palette entries — plain commands, pick-lists, or ask-me forms','hp-actions')
      +hpGuideCard('🌿','Worktree layouts',
        'tabs/panes applied automatically when herdr opens a worktree','hp-trees')
      +'</div>'
      +'<div class="hplgex"><button type="button" class="hplgbtn" data-hpex="1">load an'
      +' example setup</button><span>fills the builders with a complete, editable example'
      +' — installs nothing</span></div>'
      +'</div></div>';
  }
  var pi=plusSel.proj;
  if(pi>=projs.length)pi=projs.length-1;
  if(pi<0)pi=0;
  // More than one project: small chips above the window pick which one is "open".
  var pick='';
  if(projs.length>1){
    pick='<div class="hplpick">';
    for(var c=0;c<projs.length;c++){
      pick+='<button type="button" data-pp="'+c+'"'+(c===pi?' class="on"':'')+'>'
        +esc(projs[c].name)+'</button>';
    }
    pick+='</div>';
  }
  // The sidebar is the project browser: group heading, then each project's name with
  // its description shown dim under it. Rows pick too.
  var side='<div class="hside" style="width:'+sidePx+'">';
  if(projs.length){
    plusGroups(projs).forEach(function(g){
      side+='<div class="hgroup">'+esc(g.title)+'</div>';
      g.items.forEach(function(it){
        side+='<div class="hplitem'+(it.ix===pi?' on':'')+'" data-pp="'+it.ix+'">'
          +'<div class="hplname">'+esc(it.p.name)+'</div>'
          +(it.p.description?('<div class="hpldim">'+esc(it.p.description)+'</div>'):'')
          +'</div>';
      });
    });
  }else{
    side+='<div class="hgroup">Projects</div>'
      +'<div class="hplitem"><div class="hpldim">none yet — opening one builds'
      +' a workspace from its tabs</div></div>';
  }
  side+='</div>';

  var mid='';
  if(projs.length){
    var proj=projs[pi],ptabs=hpNamedTabs(proj.tabs);
    var tix=plusSel.tab;
    if(tix>=ptabs.length)tix=ptabs.length-1;
    if(tix<0)tix=0;
    var t=ptabs[tix];
    // Opening a project makes a workspace named after it; the tabs land in file order.
    mid='<div class="hplwsp">workspace<b>'+esc(proj.name)+'</b></div><div class="htabs">';
    for(var k=0;k<ptabs.length;k++){
      mid+='<div class="htab'+(k===tix?' on':'')+'" data-pt="'+k+'">'+esc(ptabs[k].name)+'</div>';
    }
    mid+='</div><div class="hplsplit">'
      +(t.panes.length?plusTree(t.panes,0):plusPane(t.command))+'</div>';
  }else{
    mid='<div class="hplempty">no projects yet — a finished one opens here as a workspace</div>';
  }

  // The launcher palette, floated over the window the way the real one is. Each row
  // renders what the file will make herdr-plus do: a labelled option is selectable, a
  // label-less one is a separator — a heading makes it a dim group title, none makes a
  // spacer — and a form asks with its prompt (default "Enter a value") over its
  // placeholder (default "Type a value…").
  var pal='';
  if(acts.length){
    pal='<div class="hpllaunch"><div class="hplq">quick actions — type to filter</div>';
    for(var q=0;q<acts.length;q++){
      var a=acts[q];
      pal+='<div class="hplact'+(q===0?' on':'')+'"><span class="hplan">'+esc(a.name)+'</span>'
        +(a.type!=='command'?('<span class="hpltag">'+esc(a.type)+'</span>'):'')
        +(a.description?('<span class="hplad">'+esc(a.description)+'</span>'):'')+'</div>';
      if(a.type==='select'){
        for(var v=0;v<a.options.length;v++){
          var o=a.options[v];
          if(o.label){
            pal+='<div class="hplopt"><span>'+esc(o.label)+'</span>'
              +(o.description?('<span class="hplod">'+esc(o.description)+'</span>'):'')+'</div>';
          }else if(o.heading){
            pal+='<div class="hplopt hplsep">'+esc(o.heading)+'</div>';
          }else{
            pal+='<div class="hplopt hplspacer"></div>';
          }
        }
      }
      if(a.type==='form'){
        pal+='<div class="hplform"><div class="hplfp">'+esc(a.form.prompt||'Enter a value')+'</div>'
          +'<div class="hplfi">'+esc(a.form.placeholder||'Type a value…')+'</div></div>';
      }
    }
    pal+='</div>';
  }

  // Worktree layouts: one chip each, and the tip that says when they fire.
  var status='';
  if(trees.length){
    status='<div class="hplstatus">';
    trees.forEach(function(w){
      var n=hpNamedTabs(w.tabs).length;
      status+='<span class="hplchip">worktree layout: <b>'+esc(w.repo)
        +(w.branch?('@'+esc(w.branch)):'')+'</b> → '+n+' tab'+(n===1?'':'s')+'</span>';
    });
    status+='<span class="hpltip">applies when herdr creates or opens a matching'
      +' worktree — not on a plain git worktree add</span></div>';
  }

  return pick+'<div class="hwin" style="'+vars+'">'
    +'<div class="hbody" style="position:relative">'+side
    +'<div class="hpanes">'+mid+'</div>'+pal+'</div>'+status+'</div>';
}

// Jump from the guide (or the hint chip) to a builder panel. While the preview is
// pinned it is sticky, so a plain scroll-to-top would park the panel underneath it;
// scroll-margin-top is set to the live sticky height so the panel lands right below
// the mock instead — you watch the preview react while you type. Unpinned, the panel
// goes to the top of the viewport. A brief gold flash marks the landing.
function hpJump(id){
  var el=document.getElementById(id);
  if(!el)return;
  var off=10;
  if(document.body.classList.contains('pinned')){
    var row=document.querySelector('.switchrow'),pair=$('#pair');
    if(row)off+=Math.round(row.getBoundingClientRect().height);
    if(pair)off+=Math.round(pair.getBoundingClientRect().height);
  }
  el.style.scrollMarginTop=off+'px';
  el.scrollIntoView({behavior:'smooth',block:'start'});
  el.classList.remove('hpflash');
  void el.offsetWidth; // restart the animation when the same panel is hit twice
  el.classList.add('hpflash');
  clearTimeout(el._hpf);
  el._hpf=setTimeout(function(){el.classList.remove('hpflash');},1250);
}
// One click seeds a complete, working example of all three artifacts — through the
// exact state shapes sanePlus()/paintPlus() use, so the builders, the mock and the
// files box all render it instantly and every field stays editable. It never flips
// the install toggle and never touches entries that already exist (with entries the
// guide is not shown, but a stale click must still be harmless).
function hpExample(){
  var pl=state.plus;
  if(pl.projects.length||pl.quickActions.length||pl.worktrees.length){
    toast('You already have entries — edit them in the HERDR PLUS panels below');
    hpJump('hp-projects');
    return;
  }
  pl.projects.push({name:'My App',description:'an editable example',group:'work',
    workingDir:'~/code/my-app',tabs:[
      {name:'dev',command:'npm run dev',panes:[]},
      {name:'agent',command:'',panes:[
        {command:'top',split:'down'},
        {command:'',split:'right'}
      ]}
    ]});
  pl.quickActions.push({name:'Servers',description:'ssh to a box',type:'select',
    command:'ssh {{.Value}}',options:[
      {label:'',value:'',description:'',heading:'production',sep:true},
      {label:'web-1',value:'web1.internal',description:'',heading:'',sep:false},
      {label:'db-1',value:'db1.internal',description:'',heading:'',sep:false}
    ],form:{prompt:'',placeholder:''}});
  pl.quickActions.push({name:'Search logs',description:'',type:'form',
    command:'grep {{.Value}} logs/',options:[],
    form:{prompt:'What to find?',placeholder:''}});
  pl.worktrees.push({repo:'my-app',branch:'',tabs:[
    {name:'dev',command:'npm test',panes:[]}
  ]});
  plusSel.proj=0;plusSel.tab=0;
  paintPlus();
  refresh();
  toast('Example loaded — every entry is editable in the HERDR PLUS panels below');
}
// The hint chip beside the pane switch: visible only while the plus pane is showing
// rendered entries, so nobody tries to edit inside the mock. With no live entries the
// guide in the window already says where to go, and the chip stays out of the way.
function syncPlusHint(){
  var chip=$('#hplHint');if(!chip)return;
  var pair=$('#pair');
  var on=!!pair&&pair.getAttribute('data-pane')==='plus'
    &&!!(hpLiveProjects().length||hpLiveActions().length||hpLiveTrees().length);
  chip.classList.toggle('show',on);
}

// #rrggbb + alpha -> rgba(), so a wash can be derived from whichever accent is live.
function hexA(hex,a){
  var m=/^#([0-9a-fA-F]{6})$/.exec(String(hex));
  if(!m)return 'rgba(122,162,247,'+a+')';
  var n=parseInt(m[1],16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
}

// The sample agent session's colours — fixed literals from DEFAULT_PAL.
function ccColors(){
  var p=DEFAULT_PAL;
  return {
    bg:palHex(p.bg,'#1a1b26'), text:palHex(p.text,'#c0caf5'),
    dim:palHex(p.comment,'#565f89'), accent:palHex(p.accent,'#7aa2f7'),
    green:palHex(p.green,'#9ece6a')
  };
}
function palHex(t,fb){
  if(Object.prototype.toString.call(t)!=='[object Array]'||t.length!==3)return fb;
  return '#'+t.map(function(n){
    n=Math.max(0,Math.min(255,Math.round(n)));
    return (n<16?'0':'')+n.toString(16);
  }).join('');
}
function drawWindows(){
  $('#winBefore').innerHTML=winHTML(defaultHerdr(),'plain');
  $('#winAfter').innerHTML=winHTML(state,'agent');
  // The plus window redraws on the same path, so every builder edit below — a rename,
  // a new pane, an option flipped to separator — lands in the mock on the keystroke.
  var wp=$('#winPlus');
  if(wp)wp.innerHTML=winHTML(state,'plus');
  syncPlusHint();
}

// ── controls ──────────────────────────────────────────────────────────────────
var TIPS={
  saved:{t:'Saved setups',d:'The whole page under one name: theme, window layout, sidebar, input, notifications, session settings, plugins. Saved in THIS browser (localStorage \\u2014 this site has no server storage). Share copies a link that opens the setup here; the install command on that link applies it.'},
  prefix:{t:'Prefix key',d:'The key you press before a herdr shortcut, tmux-style. Default ctrl+b. herdr is mouse-first, so you can ignore the prefix entirely — but if ctrl+b clashes with your editor, move it here.'},
  sidebarWidth:{t:'Sidebar width',d:'In terminal COLUMNS, not pixels (18\\u201336). The preview scales it so you can see the effect.'},
  agentPanelSort:{t:'Sidebar order',d:'spaces groups by workspace. priority floats the agents that need you \\u2014 blocked first, then done \\u2014 which is the ordering that makes a wall of agents readable.'},
  toastDelivery:{t:'Notifications',d:'OFF by default in herdr, which surprises people. herdr draws its own toast in the terminal; terminal uses the bell and title (works over SSH); system uses the OS notifier.'},
  paneHistory:{t:'Pane history replay',d:'Restores what was ON SCREEN after a server restart, not just the pane. Off by default upstream for a real reason: the stored output can contain secrets and tokens, and it lands in session-history.json in plain text.'},
  resumeAgents:{t:'Resume conversations',d:'After a server restart, reopen supported agents into their native conversation rather than a fresh pane. Whether an agent supports this depends on its own herdr integration (herdr integration install <agent> \\u2014 a herdr feature this page deliberately does not run for you).'},
  scrollbackBytes:{t:'Scrollback limit',d:'A BYTE budget, not a line count, despite the legacy alias being named scrollback_lines. 10 MB is the default.'},
  allowNested:{t:'Allow nesting',d:'Lets you launch herdr inside a herdr pane. Off by default, and worth leaving off: agent-state detection reads the live screen, and a nested multiplexer redrawing over it breaks that reading.'},
  worktreeDir:{t:'Worktree directory',d:'Where herdr puts per-branch git checkouts when you run several agents on different branches. Default ~/.herdr/worktrees.'},
  newCwd:{t:'New pane directory',d:'follow inherits the current pane\\u2019s directory, home always starts at ~, current uses the directory herdr was started in.'},
  hostCursor:{t:'Cursor',d:'auto lets herdr decide, native leaves your terminal\\u2019s own cursor alone, drawn makes herdr paint it (useful when the native one lands in the wrong pane).'},
  sidebarMinMax:{t:'Sidebar min/max',d:'The band the sidebar can be dragged within, in COLUMNS (stock 18\\u201336). Real 0.8.0 keys; the width above is kept inside this band.'},
  mobileWidth:{t:'Mobile threshold',d:'Below this many terminal columns herdr switches to its narrow one-pane layout. Stock 64. The mock has a fixed size, so this only reaches the file.'},
  promptNames:{t:'Name prompts',d:'Whether herdr asks for a name when you open a new tab / workspace (stock: tabs yes, workspaces no). A dialog the mock cannot show.'},
  clipToast:{t:'Clipboard toast',d:'herdr\\u2019s own \\u201ccopied\\u201d bubble when copy-on-select or a copy action fires \\u2014 on by default, position bottom-center. Separate from notification delivery.'},
  soundAgents:{t:'Per-agent sound',d:'Overrides the completion sound per agent id: on / off, or default (the agent\\u2019s own setting \\u2014 note droid ships muted by default, so \\u201cdefault\\u201d keeps droid silent). A fixed subset of herdr\\u2019s agent ids is offered here; ids you add to config.toml by hand survive the merge.'},
  updateChecks:{t:'Update checks',d:'version_check pings for new releases; manifest_check refreshes the plugin marketplace index. Both on by default; both real 0.8.0 keys.'},
  defaultShell:{t:'Default shell',d:'Command herdr starts in new panes. Empty (stock) means $SHELL, then /bin/sh. Free text, control characters stripped, TOML-escaped \\u2014 it runs on your machine only when herdr opens a pane.'},
};
function ihtml(k){return TIPS[k]?'<button type="button" class="i" data-tip="'+k+'" aria-label="What is this?">i</button>':'';}
function sel(id,list,cur){
  var h='<select id="'+id+'">';
  for(var i=0;i<list.length;i++){
    h+='<option value="'+esc(list[i])+'"'+(list[i]===cur?' selected':'')+'>'+esc(list[i])+'</option>';
  }
  return h+'</select>';
}
function chk(id,label,on,tip,nov){
  return '<label class="ctl2"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+esc(label)
    +(nov?'<span class="nov">no visual change</span>':'')+(tip?ihtml(tip):'')+'</span></label>';
}
function panel(title,inner){return '<div class="panel"><h3>'+title+'</h3>'+inner+'</div>';}

// ── saved setups ──────────────────────────────────────────────────────────────
// Same convention as every other saved thing on this site: this browser's
// localStorage, an array of named payloads, nothing on a server. A setup leaves
// this machine only when its share link is copied.
function svGet(){
  try{
    var a=JSON.parse(localStorage.getItem('scc_herdr_saved')||'[]');
    return Object.prototype.toString.call(a)==='[object Array]'?a:[];
  }catch(e){return [];}
}
function svSet(a){try{localStorage.setItem('scc_herdr_saved',JSON.stringify(a.slice(0,40)));}catch(e){}}

function saveHerdrSetup(){
  var name=(prompt('Name this setup:','My herdr setup')||'').replace(/^ +| +$/g,'').slice(0,40);
  if(!name)return;
  var all=svGet().filter(function(x){return x.name!==name;});
  all.push({name:name,savedAt:new Date().toISOString().slice(0,10),payload:payload()});
  svSet(all);
  paintSaved();
  toast('Saved “'+name+'”');
}

// The swatch shows the colours the setup would actually render with: its theme's
// preview palette with any custom tokens riding on top (legacy customAccent payloads
// still count), and the sample session's palette when the theme is unknown.
function svHexOk(v){return typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);}
function svTokCount(hd){
  var n=0,tok=(hd&&hd.tokens&&typeof hd.tokens==='object')?hd.tokens:{};
  for(var k in tok){if(ownKey(tok,k)&&(svHexOk(tok[k])||(k==='panel_bg'&&tok[k]==='reset')))n++;}
  return n;
}
function svPalOf(hd){
  var t=(hd&&typeof hd.theme==='string'&&ownKey(HD_THEMES,hd.theme))?HD_THEMES[hd.theme]:null;
  var tok=(hd&&hd.tokens&&typeof hd.tokens==='object')?hd.tokens:{};
  var acc=svHexOk(tok.accent)?tok.accent
    :((hd&&hd.customAccent&&svHexOk(hd.accentColor))?hd.accentColor:null);
  if(t)return {accent:acc||t.accent,
    green:svHexOk(tok.green)?tok.green:t.green,
    yellow:svHexOk(tok.yellow)?tok.yellow:t.yellow,
    red:svHexOk(tok.red)?tok.red:t.red};
  return {
    accent:acc||palHex(DEFAULT_PAL.accent,'#7aa2f7'),
    green:palHex(DEFAULT_PAL.green,'#9ece6a'),
    yellow:palHex(DEFAULT_PAL.yellow,'#e0af68'),
    red:palHex(DEFAULT_PAL.red,'#f7768e')
  };
}
function paintSaved(){
  var row=$('#svRow'); if(!row)return;
  row.innerHTML='';
  var save=document.createElement('button');
  save.type='button';save.className='svchip savecard';
  save.innerHTML='<span class="svsw"><i style="background:var(--accent)"></i></span>'
    +'<span class="svbody"><span class="svname">＋ Save this setup</span>'
    +'<span class="svmeta" style="display:block">keeps every control on this page</span></span>';
  save.addEventListener('click',saveHerdrSetup);
  row.appendChild(save);
  svGet().forEach(function(item){
    var hd=(item.payload&&item.payload.hd)||{};
    var pal=svPalOf(hd);
    var b=document.createElement('button');
    b.type='button';b.className='svchip';
    var sw=document.createElement('span');sw.className='svsw';
    ['accent','green','yellow','red'].forEach(function(k){
      var d=document.createElement('i');d.style.background=pal[k]||'#888';sw.appendChild(d);
    });
    var body=document.createElement('span');body.className='svbody';
    var nm=document.createElement('span');nm.className='svname';nm.textContent=item.name;
    var mt=document.createElement('span');mt.className='svmeta';
    var ntok=svTokCount(hd);
    mt.textContent=(hd.theme||'catppuccin')
      +(ntok?(' · '+ntok+' custom colour'+(ntok>1?'s':''))
        :(hd.customAccent?' · custom accent':''))
      +' · saved '+(item.savedAt||'');
    body.appendChild(nm);body.appendChild(mt);
    var acts=document.createElement('span');acts.className='svacts';
    function act(label,fn){
      var a=document.createElement('span');a.className='svact';a.textContent=label;
      a.addEventListener('click',function(e){e.stopPropagation();fn();});
      return a;
    }
    acts.appendChild(act('share',function(){
      copyText(ORIGIN+'/herdr?c='+encodeURIComponent(b64e(item.payload)));
      toast('Link to “'+item.name+'” copied');
    }));
    acts.appendChild(act('update',function(){
      svSet(svGet().map(function(x){
        return x.name===item.name
          ?{name:item.name,savedAt:new Date().toISOString().slice(0,10),payload:payload()}
          :x;
      }));
      paintSaved();toast('Updated “'+item.name+'” from the current controls');
    }));
    acts.appendChild(act('rename',function(){
      var n=(prompt('New name:',item.name)||'').trim().slice(0,40);
      if(!n)return;
      var out=[];
      svGet().forEach(function(x){
        if(x.name===item.name){x.name=n;out.push(x);}
        else if(x.name!==n)out.push(x);
      });
      svSet(out);
      paintSaved();toast('Renamed to “'+n+'”');
    }));
    acts.appendChild(act('delete',function(){
      svSet(svGet().filter(function(x){return x.name!==item.name;}));
      paintSaved();toast('Removed “'+item.name+'”');
    }));
    b.appendChild(sw);b.appendChild(body);b.appendChild(acts);
    b.addEventListener('click',function(){
      state=saneHerdr(copyObj(hd));
      paintAll();
      toast('Loaded “'+item.name+'”');
    });
    row.appendChild(b);
  });
}

function buildControls(){
  var s=state,h='';
  h+=panel('\\u{1F4BE} Saved setups'+ihtml('saved'),
    '<p class="phint">Everything on this page under one name \\u2014 theme, window, sidebar,'
    +' input, notifications, plugins. Saved in this browser; the share link on each one is'
    +' how a setup travels.</p>'
    +'<div class="svrow" id="svRow"></div>');
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
    +'<label class="ctl"><span class="cap">Min width'+ihtml('sidebarMinMax')+'<span class="nov">no visual change</span></span>'
    +'<input type="number" id="f_sidebarMinWidth" min="10" max="36" value="'+s.sidebarMinWidth+'"></label>'
    +'<label class="ctl"><span class="cap">Max width'+ihtml('sidebarMinMax')+'<span class="nov">no visual change</span></span>'
    +'<input type="number" id="f_sidebarMaxWidth" min="20" max="80" value="'+s.sidebarMaxWidth+'"></label>'
    +'<label class="ctl"><span class="cap">Mobile layout below (columns)'+ihtml('mobileWidth')+'<span class="nov">no visual change</span></span>'
    +'<input type="number" id="f_mobileWidthThreshold" min="20" max="200" value="'+s.mobileWidthThreshold+'"></label>'
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
    +chk('f_confirmClose','Confirm before closing a pane',s.confirmClose)
    +chk('f_promptNewTabName','Ask for a name on new tab',s.promptNewTabName,'promptNames',1)
    +chk('f_promptNewWorkspaceName','Ask for a name on new workspace',s.promptNewWorkspaceName,'promptNames',1));

  h+=panel('\\u{1F514} Notifications',
    '<label class="ctl"><span class="cap">Delivery'+ihtml('toastDelivery')+'</span>'+sel('f_toastDelivery',HD_OPTS.toastDelivery,s.toastDelivery)+'</label>'
    +'<label class="ctl"><span class="cap">Toast position <span class="hint">(herdr delivery only)</span></span>'+sel('f_toastPosition',HD_OPTS.toastPositions,s.toastPosition)+'</label>'
    +'<label class="ctl"><span class="cap">Delay before notifying (seconds)</span>'
    +'<input type="number" id="f_toastDelaySeconds" min="0" max="3600" value="'+s.toastDelaySeconds+'"></label>'
    +chk('f_clipToastEnabled','Clipboard \\u201ccopied\\u201d toast',s.clipToastEnabled,'clipToast')
    +'<label class="ctl"><span class="cap">Clipboard toast position</span>'+sel('f_clipToastPosition',HD_OPTS.clipPositions,s.clipToastPosition)+'</label>'
    +chk('f_soundEnabled','Sound',s.soundEnabled)
    +'<div class="cap" style="margin:2px 0 6px;font-size:12.5px;color:var(--dim)">Per-agent sound'+ihtml('soundAgents')+'<span class="nov">no visual change</span></div>'
    +HD_OPTS.soundAgents.map(function(a){
      return '<label class="ctl" style="flex-direction:row;align-items:center;gap:8px;margin-bottom:6px">'
        +'<span class="cap" style="width:84px;flex:none;font-family:ui-monospace,Menlo,monospace">'+esc(a)+'</span>'
        +'<select class="hsag" data-agent="'+esc(a)+'">'
        +HD_OPTS.soundModes.map(function(m){
          var cur=s.soundAgents[a]||'default';
          return '<option value="'+m+'"'+(m===cur?' selected':'')+'>'+m+'</option>';
        }).join('')
        +'</select></label>';
    }).join(''));

  h+=panel('\\u{1F4BE} Session &amp; storage',
    chk('f_resumeAgents','Resume agent conversations after a restart',s.resumeAgents,'resumeAgents')
    +'<label class="ctl"><span class="cap">Scrollback limit (bytes)'+ihtml('scrollbackBytes')+'</span>'
    +'<input type="number" id="f_scrollbackBytes" min="1000000" max="200000000" step="1000000" value="'+s.scrollbackBytes+'"></label>'
    +'<label class="ctl"><span class="cap">Worktree directory'+ihtml('worktreeDir')+'</span>'
    +'<input type="text" id="f_worktreeDir" value="'+esc(s.worktreeDir)+'"></label>'
    +'<label class="ctl"><span class="cap">Update channel</span>'+sel('f_updateChannel',HD_OPTS.channels,s.updateChannel)+'</label>'
    +chk('f_versionCheck','Check for new herdr releases',s.versionCheck,'updateChecks',1)
    +chk('f_manifestCheck','Refresh the plugin marketplace index',s.manifestCheck,'updateChecks',1));

  h+=panel('\\u{1F9EA} Shell &amp; experimental',
    '<label class="ctl"><span class="cap">Default shell'+ihtml('defaultShell')+'<span class="nov">no visual change</span></span>'
    +'<input type="text" id="f_defaultShell" value="'+esc(s.defaultShell)+'" placeholder="(empty = $SHELL, then /bin/sh)"></label>'
    +'<label class="ctl"><span class="cap">Shell mode</span>'+sel('f_shellMode',HD_OPTS.shellModes,s.shellMode)+'</label>'
    +'<label class="ctl"><span class="cap">New pane directory'+ihtml('newCwd')+'</span>'+sel('f_newCwd',HD_OPTS.newCwd,s.newCwd)+'</label>'
    +chk('f_paneHistory','Replay pane screen history after a restart',s.paneHistory,'paneHistory')
    +chk('f_allowNested','Allow herdr inside herdr',s.allowNested,'allowNested')
    +chk('f_kittyGraphics','Kitty graphics protocol',s.kittyGraphics));

  $('#herdrControls').innerHTML=h;
  wire();
  paintSaved();
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
  // Per-agent sound selects write into the soundAgents map instead of a flat key;
  // "default" removes the entry so stock agents emit no line at all.
  Array.prototype.forEach.call(host.querySelectorAll('.hsag'),function(el){
    el.addEventListener('change',function(){
      var a=el.getAttribute('data-agent');
      if(el.value==='default')delete state.soundAgents[a];
      else state.soundAgents[a]=el.value;
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
    // The six light variants exist only as strings in the 0.8.0 binary; the docs never
    // enumerate them. The badge says which claim each chip is resting on.
    if(HD_OPTS.binVerified.indexOf(name)>=0){
      var bd=document.createElement('div');bd.className='hcbadge';
      bd.textContent='binary-verified';
      b.appendChild(bd);
    }
    // A theme change re-seeds the unset token pickers and the sibling hint too.
    b.addEventListener('click',function(){state.theme=name;paintThemes();paintTokens();syncAuto();refresh();});
    g.appendChild(b);
  });
  var note=$('#hthemeNote');
  note.textContent=state.theme==='terminal'
    ? 'terminal follows your own terminal\\u2019s ANSI palette \\u2014 herdr sets no colours, so the preview here is a stand-in.'
    : 'Built into herdr 0.8.0, applied by name. The preview uses this scheme\\u2019s published colours.';
}

// ── the 16 [theme.custom] tokens ──────────────────────────────────────────────
// Where each token lands in the mock — the row says it, so nobody wonders why mauve
// changed nothing on screen. Approximate on purpose; the page copy above the grid
// owns up to that.
var TOK_SURFACE={accent:'accent + selection',panel_bg:'sidebar / panel',
  surface0:'window chrome',surface1:'pane borders',surface_dim:'scrollbars',
  overlay0:'inactive tabs',overlay1:'state text',text:'text',subtext0:'dim text',
  green:'done dot',yellow:'working dot',red:'blocked dot',blue:'idle dot',
  mauve:'file only',teal:'file only',peach:'file only'};
// Seed an unset picker with the base theme's own published colour where the mock knows
// one, so opening "custom" starts from what is on screen instead of black.
function tokSeed(slot){
  var t=themeOf(state.theme);
  var m={accent:t.accent,panel_bg:t.panel,surface0:t.panel,surface1:t.panel,
    surface_dim:t.panel,overlay0:t.dim,overlay1:t.dim,text:t.text,subtext0:t.dim,
    green:t.green,yellow:t.yellow,red:t.red,blue:t.accent};
  var v=m[slot]||'#888888';
  return /^#[0-9a-fA-F]{6}$/.test(v)?v:'#888888';
}
function paintTokens(){
  var g=$('#tokGrid');if(!g)return;
  g.innerHTML='';
  HD_OPTS.slots.forEach(function(slot){
    var cur=state.tokens[slot]||null;
    var row=document.createElement('div');
    row.className='tokrow'+(cur?' set':'');
    var nm=document.createElement('span');nm.className='tokname';nm.textContent=slot;
    row.appendChild(nm);
    function chip(label,on,fn){
      var c=document.createElement('span');
      c.className='stychip'+(on?' on':'');
      c.textContent=label;
      c.addEventListener('click',function(){fn();paintTokens();refresh();});
      return c;
    }
    row.appendChild(chip('default',!cur,function(){delete state.tokens[slot];}));
    row.appendChild(chip('custom',!!cur&&cur!=='reset',function(){
      state.tokens[slot]=pickEl.value.toLowerCase();
    }));
    // panel_bg's documented third value: "reset" = the terminal's own background.
    if(slot==='panel_bg'){
      row.appendChild(chip('reset',cur==='reset',function(){state.tokens[slot]='reset';}));
    }
    var pickEl=document.createElement('input');pickEl.type='color';
    pickEl.value=(cur&&cur!=='reset')?cur:tokSeed(slot);
    pickEl.setAttribute('aria-label','Custom colour for '+slot);
    // Dragging the picker IS choosing custom — nobody picks a colour to keep default.
    // No repaint mid-drag: the chips are flipped in place so the picker keeps focus.
    pickEl.addEventListener('input',function(){
      state.tokens[slot]=pickEl.value.toLowerCase();
      row.className='tokrow set';
      var chips=row.querySelectorAll('.stychip');
      for(var i=0;i<chips.length;i++){
        chips[i].className='stychip'+(chips[i].textContent==='custom'?' on':'');
      }
      refresh();
    });
    row.appendChild(pickEl);
    var note=document.createElement('span');note.className='tokfile';
    note.textContent=TOK_SURFACE[slot]||'';
    row.appendChild(note);
    g.appendChild(row);
  });
}

// ── theme.auto_switch + the light/dark pair ───────────────────────────────────
// These controls live in the static page markup (not rebuilt by buildControls), so
// they are wired exactly once and re-synced from state whenever state is replaced
// wholesale (boot from a link, loading a saved setup, reset).
function fillThemeSel(el,cur){
  el.innerHTML='';
  var sib=HD_OPTS.siblings[state.theme]||'';
  var auto=document.createElement('option');
  auto.value='';
  auto.textContent='(unset \\u2014 herdr decides'+(sib?': '+state.theme+' \\u2194 '+sib:'')+')';
  el.appendChild(auto);
  HD_OPTS.themes.forEach(function(n){
    var o=document.createElement('option');o.value=n;o.textContent=n;
    if(n===cur)o.selected=true;
    el.appendChild(o);
  });
  if(!cur)auto.selected=true;
}
function syncAuto(){
  $('#t_autoSwitch').checked=state.autoSwitch;
  fillThemeSel($('#t_lightName'),state.lightName);
  fillThemeSel($('#t_darkName'),state.darkName);
  $('#autoRow').style.display=state.autoSwitch?'flex':'none';
}
function syncStatic(){
  syncAuto();
  $('#hp_install').checked=state.plus.install;
}
function wireStatic(){
  $('#t_autoSwitch').addEventListener('change',function(){
    state.autoSwitch=this.checked;
    $('#autoRow').style.display=state.autoSwitch?'flex':'none';
    refresh();
  });
  $('#t_lightName').addEventListener('change',function(){state.lightName=this.value;refresh();});
  $('#t_darkName').addEventListener('change',function(){state.darkName=this.value;refresh();});
  $('#hp_install').addEventListener('change',function(){state.plus.install=this.checked;refresh();});
}

// ── herdr-plus builders ───────────────────────────────────────────────────────
// DOM-built like paintPlugins: every value lands via textContent/value setters, never
// innerHTML, so free text stays free. Text edits mutate state and refresh() without a
// rebuild (a rebuild mid-keystroke would eat the focus); structural changes (add or
// remove an entry, a tab, a pane, an option; a type flip) rebuild the panel.
function hpInp(val,ph,cls,set){
  var i=document.createElement('input');i.type='text';
  if(cls)i.className=cls;
  i.value=val||'';i.placeholder=ph;
  i.addEventListener('input',function(){set(i.value);refresh();});
  return i;
}
function hpBtn(label,cls,fn){
  var b=document.createElement('button');b.type='button';b.className=cls;
  b.textContent=label;
  b.addEventListener('click',fn);
  return b;
}
function hpSelEl(list,cur,set){
  var s=document.createElement('select');
  list.forEach(function(v){
    var o=document.createElement('option');o.value=v;o.textContent=v;
    if(v===cur)o.selected=true;
    s.appendChild(o);
  });
  s.addEventListener('change',function(){set(s.value);refresh();});
  return s;
}
function hpWarnLine(host,msg){
  var w=document.createElement('p');w.className='hpwarn';w.textContent=msg;
  host.appendChild(w);
}
// Tabs are shared between projects and worktree layouts: a name, then a command OR up
// to 4 panes — never both (the docs make that a load error, so the UI cannot say it).
function tabsUI(host,tabs){
  tabs.forEach(function(t,ti){
    var box=document.createElement('div');box.className='hptab';
    var head=document.createElement('div');head.className='hptabhead';
    head.appendChild(hpInp(t.name,'tab name (required)','grow',function(v){t.name=v;}));
    head.appendChild(hpBtn('remove tab','hpdel',function(){tabs.splice(ti,1);paintPlus();refresh();}));
    box.appendChild(head);
    if(t.panes.length){
      t.panes.forEach(function(p,pi){
        var line=document.createElement('div');line.className='hpaneline';
        line.appendChild(hpInp(p.command,'pane command (empty = a shell)','grow hpmono',function(v){p.command=v;}));
        line.appendChild(hpSelEl(HD_OPTS.splits,p.split,function(v){p.split=v;}));
        line.appendChild(hpBtn('\\u00d7','hpdel',function(){t.panes.splice(pi,1);paintPlus();refresh();}));
        box.appendChild(line);
      });
    }else{
      var cl=document.createElement('div');cl.className='hpaneline';
      cl.appendChild(hpInp(t.command,'command (empty = a shell)','grow hpmono',function(v){t.command=v;}));
      box.appendChild(cl);
    }
    if(t.panes.length<HD_OPTS.limits.panes){
      box.appendChild(hpBtn(t.panes.length?'+ pane':'split into panes','hpadd',function(){
        if(!t.panes.length){
          // The first split carries the tab's command into pane 1, since a tab cannot
          // keep both.
          t.panes.push({command:t.command||'',split:'down'});
          t.command='';
          t.panes.push({command:'',split:'right'});
        }else{
          t.panes.push({command:'',split:'down'});
        }
        paintPlus();refresh();
      }));
    }
    host.appendChild(box);
  });
}
function paintPlus(){
  var pj=$('#hpProjects');if(!pj)return;
  var qa=$('#hpActions'),wt=$('#hpTrees');
  pj.innerHTML='';qa.innerHTML='';wt.innerHTML='';

  state.plus.projects.forEach(function(p,i){
    var card=document.createElement('div');card.className='hpcard';
    var r1=document.createElement('div');r1.className='hprow';
    r1.appendChild(hpInp(p.name,'name (required)','grow',function(v){p.name=v;}));
    r1.appendChild(hpInp(p.group,'group (optional)','',function(v){p.group=v;}));
    r1.appendChild(hpBtn('remove','hpdel',function(){state.plus.projects.splice(i,1);paintPlus();refresh();}));
    card.appendChild(r1);
    var r2=document.createElement('div');r2.className='hprow';
    r2.appendChild(hpInp(p.description,'description (optional)','grow',function(v){p.description=v;}));
    r2.appendChild(hpInp(p.workingDir,'working dir, e.g. ~/code/app','grow hpmono',function(v){p.workingDir=v;}));
    card.appendChild(r2);
    tabsUI(card,p.tabs);
    if(p.tabs.length<HD_OPTS.limits.tabs){
      card.appendChild(hpBtn('+ tab','hpadd',function(){p.tabs.push({name:'',command:'',panes:[]});paintPlus();refresh();}));
    }
    if(!p.name||!p.tabs.some(function(t){return t.name;})){
      hpWarnLine(card,'needs a name and at least one named tab before it reaches a file');
    }
    pj.appendChild(card);
  });
  if(state.plus.projects.length<HD_OPTS.limits.projects){
    pj.appendChild(hpBtn('+ add project','hpadd',function(){
      state.plus.projects.push({name:'',description:'',group:'',workingDir:'',tabs:[{name:'main',command:'',panes:[]}]});
      paintPlus();refresh();
    }));
  }

  state.plus.quickActions.forEach(function(a,i){
    var card=document.createElement('div');card.className='hpcard';
    var r1=document.createElement('div');r1.className='hprow';
    r1.appendChild(hpInp(a.name,'name (required)','grow',function(v){a.name=v;}));
    r1.appendChild(hpSelEl(HD_OPTS.qaTypes,a.type,function(v){a.type=v;paintPlus();}));
    r1.appendChild(hpBtn('remove','hpdel',function(){state.plus.quickActions.splice(i,1);paintPlus();refresh();}));
    card.appendChild(r1);
    var r2=document.createElement('div');r2.className='hprow';
    r2.appendChild(hpInp(a.description,'description (optional)','grow',function(v){a.description=v;}));
    card.appendChild(r2);
    var r3=document.createElement('div');r3.className='hprow';
    r3.appendChild(hpInp(a.command,'command (required) \\u2014 {{.Value}} = the picked / typed value','grow hpmono',function(v){a.command=v;}));
    card.appendChild(r3);
    if(a.type==='select'){
      a.options.forEach(function(o,oi){
        var line=document.createElement('div');line.className='hprow';
        line.appendChild(hpSelEl(['option','separator'],o.sep?'separator':'option',function(v){
          o.sep=(v==='separator');
          // A separator is an option with no label; clearing the fields keeps the
          // payload honest instead of hiding values that would still be sent.
          if(o.sep){o.label='';o.value='';o.description='';}
          paintPlus();
        }));
        if(o.sep){
          line.appendChild(hpInp(o.heading,'heading (optional group title)','grow',function(v){o.heading=v;}));
        }else{
          line.appendChild(hpInp(o.label,'label (required)','grow',function(v){o.label=v;}));
          line.appendChild(hpInp(o.value,'value','grow hpmono',function(v){o.value=v;}));
          line.appendChild(hpInp(o.description,'description','grow',function(v){o.description=v;}));
        }
        line.appendChild(hpBtn('\\u00d7','hpdel',function(){a.options.splice(oi,1);paintPlus();refresh();}));
        card.appendChild(line);
      });
      if(a.options.length<HD_OPTS.limits.options){
        card.appendChild(hpBtn('+ option','hpadd',function(){
          a.options.push({label:'',value:'',description:'',heading:'',sep:false});
          paintPlus();refresh();
        }));
      }
    }
    if(a.type==='form'){
      var rf=document.createElement('div');rf.className='hprow';
      rf.appendChild(hpInp(a.form.prompt,'form prompt','grow',function(v){a.form.prompt=v;}));
      rf.appendChild(hpInp(a.form.placeholder,'placeholder','grow',function(v){a.form.placeholder=v;}));
      card.appendChild(rf);
    }
    if(!a.name||!a.command){
      hpWarnLine(card,'needs a name and a command before it reaches a file');
    }else if(a.type==='select'&&!a.options.some(function(o){return o.label;})){
      hpWarnLine(card,'a select needs at least one labelled option before it reaches a file');
    }
    qa.appendChild(card);
  });
  if(state.plus.quickActions.length<HD_OPTS.limits.quickActions){
    qa.appendChild(hpBtn('+ add quick action','hpadd',function(){
      state.plus.quickActions.push({name:'',description:'',type:'command',command:'',options:[],form:{prompt:'',placeholder:''}});
      paintPlus();refresh();
    }));
  }

  state.plus.worktrees.forEach(function(w,i){
    var card=document.createElement('div');card.className='hpcard';
    var r1=document.createElement('div');r1.className='hprow';
    r1.appendChild(hpInp(w.repo,'repo basename (required)','grow hpmono',function(v){w.repo=v;}));
    r1.appendChild(hpInp(w.branch,'branch (optional, exact)','hpmono',function(v){w.branch=v;}));
    r1.appendChild(hpBtn('remove','hpdel',function(){state.plus.worktrees.splice(i,1);paintPlus();refresh();}));
    card.appendChild(r1);
    tabsUI(card,w.tabs);
    if(w.tabs.length<HD_OPTS.limits.tabs){
      card.appendChild(hpBtn('+ tab','hpadd',function(){w.tabs.push({name:'',command:'',panes:[]});paintPlus();refresh();}));
    }
    if(!w.repo||!w.tabs.some(function(t){return t.name;})){
      hpWarnLine(card,'needs a repo and at least one named tab before it reaches a file');
    }
    wt.appendChild(card);
  });
  if(state.plus.worktrees.length<HD_OPTS.limits.worktrees){
    wt.appendChild(hpBtn('+ add worktree layout','hpadd',function(){
      state.plus.worktrees.push({repo:'',branch:'',tabs:[{name:'main',command:'',panes:[]}]});
      paintPlus();refresh();
    }));
  }
}

// Everything that renders from state, in one place: called at boot and whenever state
// is replaced wholesale (a saved setup, reset).
function paintAll(){
  buildControls();
  paintThemes();
  paintPlugins();
  paintTokens();
  paintPlus();
  syncStatic();
  refresh();
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
    // The single command for this one plugin, so you can take one without the rest.
    var run=document.createElement('div');run.className='plurun';
    var code=document.createElement('code');code.textContent=pluCmd(p);
    var cpy=document.createElement('button');cpy.type='button';cpy.textContent='copy';
    cpy.setAttribute('aria-label','Copy the install command for '+p.name);
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

// ── payload + output ──────────────────────────────────────────────────────────
function pluCmd(p){return 'herdr plugin install '+p.repo;}

// Ticking a box rewrites the install command at the bottom of the page. That was
// invisible, so this says it out loud and lists the exact lines that will run.
function paintPluCmds(){
  var host=$('#pluCmds');if(!host)return;
  var chosen=HD_PLUGINS.filter(function(p){return state.plugins.indexOf(p.id)>=0;});
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
      copyText(chosen.map(pluCmd).join('\\n'));
      cpy.textContent='Copied \u2713';
      setTimeout(function(){cpy.textContent='Copy these lines';},1600);
    });
    head.appendChild(cpy);
    var note=document.createElement('span');note.className='pcnote';
    note.innerHTML='These run as part of the <b>install command at the bottom of this page</b> \u2014 '
      +'you do not need to run them separately. They are here so you can see what it will do, '
      +'or take one on its own.';
    head.appendChild(note);
    pre.textContent=chosen.map(pluCmd).join('\\n');
  }else{
    pre.textContent='Nothing selected, so the install command touches no plugins. Tick one above and the exact command appears here.';
  }
  host.appendChild(head);host.appendChild(pre);
}

// The payload carries ONLY the herdr layer: this page is a standalone editor, not a
// recipe. The command is the herdr-only installer.
function payload(){var pl={hd:copyObj(state)};pl.hd.on=true;return pl;}
function refresh(){
  drawWindows();
  paintPluCmds();
  var c=encodeURIComponent(b64e(payload()));
  $('#cmdtext').textContent='curl -fsSL "'+ORIGIN+'/herdr-apply.sh?c='+c+'" | bash';
  window.__sccPayloadC=c;
  // The file preview is rendered server-side truth, fetched rather than reimplemented:
  // a second TOML builder in the browser is a second thing to drift. One response
  // carries config.toml plus every herdr-plus file, split on the '@@PLUS@@<rel>'
  // marker lines the server guarantees start a line.
  fetch('/herdr-files.txt?c='+c).then(function(r){return r.text();}).then(function(t){
    var seg=t.split('\\n@@PLUS@@');
    $('#tomlOut').textContent=seg[0]+(seg.length>1?'\\n':'');
    var pf=$('#plusFiles');if(!pf)return;
    pf.innerHTML='';
    if(seg.length<2){
      pf.textContent='(no herdr-plus entries yet \\u2014 complete one above and its exact file appears here)';
      return;
    }
    for(var i=1;i<seg.length;i++){
      var nl=seg[i].indexOf('\\n');
      var head=document.createElement('div');head.className='hfilename';
      head.textContent=seg[i].slice(0,nl);
      var body=document.createElement('div');
      body.textContent=seg[i].slice(nl+1);
      pf.appendChild(head);pf.appendChild(body);
    }
  }).catch(function(){});
  clearTimeout(refresh._t);
  refresh._t=setTimeout(function(){
    try{history.replaceState(null,'','/herdr?c='+c);}catch(e){}
    try{localStorage.setItem('scc_herdr',JSON.stringify(state));}catch(e){}
  },400);
}

// ── boot ──────────────────────────────────────────────────────────────────────
(function(){
  state=defaultHerdr();
  try{
    var q=new URLSearchParams(location.search),c=q.get('c');
    if(c){
      var pl=b64d(c);
      // Through saneHerdr, never merged raw: the link is a stranger's.
      if(pl&&typeof pl==='object'&&pl.hd&&typeof pl.hd==='object')state=saneHerdr(pl.hd);
    }else{
      // localStorage is this browser's own, but it was written from a payload that may
      // not have been, so it gets the same treatment.
      var draft=localStorage.getItem('scc_herdr');
      if(draft)state=saneHerdr(JSON.parse(draft));
    }
  }catch(e){state=defaultHerdr();}
})();
wireStatic();
paintAll();

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
  paintAll();
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
    syncPlusHint();
  });
})();

// The hint chip is itself a shortcut to the builder section it points at.
(function(){
  var chip=$('#hplHint');if(!chip)return;
  chip.addEventListener('click',function(){hpJump('hp-build');});
})();

// Picking a project (a chip above the plus window or a browser row) or a tab: one
// delegated listener, because the window's markup is rebuilt on every refresh.
// The first-run guide's buttons ride the same listener — its markup is rebuilt on
// every refresh too, so per-node handlers would be lost on the next keystroke.
(function(){
  var wp=$('#winPlus');if(!wp)return;
  wp.addEventListener('click',function(e){
    var g=e.target&&e.target.closest?e.target.closest('[data-hpgo],[data-hpex]'):null;
    if(g){
      if(g.hasAttribute('data-hpgo'))hpJump(g.getAttribute('data-hpgo'));
      else hpExample();
      return;
    }
    var el=e.target&&e.target.closest?e.target.closest('[data-pp],[data-pt]'):null;
    if(!el)return;
    if(el.hasAttribute('data-pp')){
      plusSel.proj=Number(el.getAttribute('data-pp'))||0;
      plusSel.tab=0;
    }else{
      plusSel.tab=Number(el.getAttribute('data-pt'))||0;
    }
    drawWindows();
  });
})();

installPreviewDock({dock:'#pair',grip:'#dockgrip',pin:'#pinbtn',
  term:'.hterm',key:'herdr',pinDefault:true});
installNav();
`;

module.exports = { renderHerdr, HERDR_CSS, THEME_PREVIEW };
