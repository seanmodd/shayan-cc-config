// herdr configuration — the server half.
//
// herdr keeps everything in ONE file, unlike cmux's Ghostty-plus-JSON pair:
//
//   ~/.config/herdr/config.toml      (Linux + macOS; %APPDATA%\herdr\config.toml on Windows)
//
// Read against herdr 0.8.0 docs on 2026-08-06, re-verified against the local 0.8.0
// binary's own `--default-config` and its serde field tables on 2026-08-17. The full
// surface is ~150 keys across 13 sections; this module exposes the ones a person would
// actually set from a web page and leaves the rest to `herdr --default-config`.
//
// Deliberately NOT exposed: [[keys.command]] (runs arbitrary shell on a keypress),
// ui.sound.path and friends (a file path we cannot validate), remote.*, the CJK/IME
// [experimental] keys (experimental and unstable upstream), and the per-token sidebar
// row styling DSL ({ token, fg, bold, dim } inline tables — a deep grammar this page
// cannot preview honestly). The plugin install list is kept separate from the config
// file because installing a plugin runs somebody's code. A link from the internet does
// not get to do any of that.
//
// Everything a stranger can put in a share link ends up in a file on disk, so every
// value is checked against the documented enums and ranges before it reaches the builder.
// herdr-plus commands are the one deliberate exception: they are free shell text BY
// DESIGN (they run via sh -c when the user themselves triggers them — same trust as
// typing into a terminal), but they are still control-char-stripped, length-capped and
// TOML-string-escaped so a stranger's link cannot break out of the string it lands in.

const { clampInt } = require('./_term.js');

// ── the option space ────────────────────────────────────────────────────────────
// Built-in theme names, in the order herdr lists them. The 11 dark/base names are in the
// 0.8.0 default-config comment (doc-verified); catppuccin-latte appears in the docs'
// auto_switch example; the other six light variants exist only as strings in the 0.8.0
// binary (the enum blob 'catppuccin…vesper'), so the page badges them "binary-verified".
// If a name here stops existing, herdr falls back to a default and logs a warning rather
// than failing, so a stale entry degrades quietly rather than breaking.
const HERDR_THEMES = [
  'catppuccin', 'catppuccin-latte', 'terminal', 'tokyo-night', 'tokyo-night-day',
  'dracula', 'nord', 'gruvbox', 'gruvbox-light', 'one-dark', 'one-light',
  'solarized', 'solarized-light', 'kanagawa', 'kanagawa-lotus',
  'rose-pine', 'rose-pine-dawn', 'vesper',
];
// Light variants whose only evidence is the 0.8.0 binary's strings (the docs never
// enumerate the full theme.name enum). catppuccin-latte is doc-verified and not listed.
const BIN_VERIFIED_THEMES = ['tokyo-night-day', 'gruvbox-light', 'one-light',
  'solarized-light', 'kanagawa-lotus', 'rose-pine-dawn'];
// Which built-in pairs with which. herdr picks the sibling itself when light_name and
// dark_name are omitted; the page uses this table only to suggest a sensible pick.
const THEME_SIBLINGS = {
  'catppuccin': 'catppuccin-latte', 'tokyo-night': 'tokyo-night-day',
  'gruvbox': 'gruvbox-light', 'one-dark': 'one-light', 'solarized': 'solarized-light',
  'kanagawa': 'kanagawa-lotus', 'rose-pine': 'rose-pine-dawn',
};
// The 16 slots [theme.custom] accepts at 0.8.0, in the binary's own serde order
// (struct CustomThemeColors). sidebar_bg exists on master and is deliberately absent —
// emitting it against 0.8.0 would be an unknown key. Values here are page-restricted to
// #rrggbb (herdr also accepts named colours and rgb(); a colour picker emits hex, so the
// sanitizer is hex-or-drop). panel_bg additionally accepts "reset" = the terminal's own
// background — doc-verified: 'or panel_bg = "reset"'.
const THEME_SLOTS = ['accent', 'panel_bg', 'surface0', 'surface1', 'surface_dim',
  'overlay0', 'overlay1', 'text', 'subtext0', 'mauve', 'green', 'yellow', 'red',
  'blue', 'teal', 'peach'];

const SHELL_MODES = ['auto', 'login', 'non_login'];
const NEW_CWD = ['follow', 'home', 'current'];
const COLLAPSED_MODES = ['compact', 'hidden'];
const HOST_CURSORS = ['auto', 'native', 'drawn'];
const TAB_POSITIONS = ['top', 'bottom'];
const AGENT_SORTS = ['spaces', 'priority'];
const TOAST_DELIVERY = ['off', 'herdr', 'terminal', 'system'];
const TOAST_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const CLIP_POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const UPDATE_CHANNELS = ['stable', 'preview'];
const CJK_CURSORS = ['block', 'steady_block', 'underline', 'steady_underline', 'bar', 'steady_bar'];

// Sidebar row tokens, per section. Agents and Spaces accept different sets.
const AGENT_TOKENS = ['state_icon', 'state_text', 'workspace', 'tab', 'pane', 'agent',
  'terminal_title', 'terminal_title_stripped'];
const SPACE_TOKENS = ['state_icon', 'state_text', 'workspace', 'branch', 'git_status'];

// [ui.sound.agents] is keyed by herdr's canonical agent ids (the 0.8.0 default-config
// names them; droid ships muted by default, so "default" for droid means off). This is
// the subset offered here; any id herdr knows can be set by hand and the merge keeps it.
const SOUND_AGENTS = ['codex', 'gemini', 'cursor', 'copilot', 'opencode', 'amp', 'cline', 'droid'];
const SOUND_MODES = ['default', 'on', 'off'];

// The prefix-key families herdr's docs vet as safe, plus the ones they name as
// conflicting. Offering a free-text key field would let a share link bind something that
// eats the user's typing, so the page picks from this list instead.
const PREFIXES = ['ctrl+b', 'ctrl+a', 'ctrl+space', 'ctrl+g', 'f12', 'none'];

// herdr-plus (cloudmanic/herdr-plus): a free, MIT-licensed herdr plugin by Cloudmanic
// Labs — Projects, Quick Actions and Worktree Layouts, each a TOML file per entry.
// Schemas below are from herdrplus.com docs (llms-full.txt, read in full 2026-08-17).
const PANE_SPLITS = ['down', 'right'];
const QA_TYPES = ['command', 'select', 'form'];
const HP_LIMITS = { projects: 8, quickActions: 12, worktrees: 8, tabs: 8, panes: 4, options: 16 };

// Every default below is herdr 0.8.0's own stated default, so BEFORE is genuinely stock.
const HERDR_DEFAULTS = {
  preset: '',
  // theme
  theme: 'catppuccin',
  autoSwitch: false,
  lightName: '',
  darkName: '',
  tokens: {},
  // terminal
  defaultShell: '',
  shellMode: 'auto',
  newCwd: 'follow',
  // keys
  prefix: 'ctrl+b',
  // ui — sidebar
  sidebarWidth: 26,
  sidebarMinWidth: 18,
  sidebarMaxWidth: 36,
  mobileWidthThreshold: 64,
  sidebarStartCollapsed: false,
  sidebarCollapsedMode: 'compact',
  agentPanelSort: 'spaces',
  agentRowsStyle: 'default',
  // ui — panes
  paneBorders: true,
  paneScrollbars: true,
  paneGaps: true,
  agentLabelsOnBorders: false,
  // ui — tabs
  tabBarPosition: 'top',
  hideTabBarWhenSingle: false,
  // ui — input
  mouseCapture: true,
  copyOnSelect: true,
  mouseScrollLines: 3,
  hostCursor: 'auto',
  confirmClose: true,
  promptNewTabName: true,
  promptNewWorkspaceName: false,
  // notifications — delivery is genuinely 'off' out of the box, which surprises people
  toastDelivery: 'off',
  toastDelaySeconds: 1,
  toastPosition: 'bottom-right',
  clipToastEnabled: true,
  clipToastPosition: 'bottom-center',
  soundEnabled: true,
  soundAgents: {},
  // session / storage
  resumeAgents: true,
  scrollbackBytes: 10000000,
  worktreeDir: '~/.herdr/worktrees',
  // updates
  updateChannel: 'stable',
  versionCheck: true,
  manifestCheck: true,
  // experimental
  paneHistory: false,
  allowNested: false,
  kittyGraphics: false,
  // integration + plugins
  plugins: [],
  plus: { install: false, projects: [], quickActions: [], worktrees: [] },
};

// Real, verified marketplace entries (GitHub topic `herdr-plugin`, checked 2026-08-06).
// The marketplace is an automatic index, not a reviewed one, and installing a plugin runs
// its code — so this is an explicit allowlist of specific repos rather than anything the
// payload can name freely.
const HERDR_PLUGINS = [
  { id: 'crabbox', repo: 'openclaw/crabbox', name: 'crabbox', stars: 1264,
    blurb: 'Sandboxed scratch environments for agents to run in.' },
  { id: 'file-viewer', repo: 'smarzban/herdr-file-viewer', name: 'File viewer', stars: 351,
    blurb: 'Browse and preview files without leaving the multiplexer.' },
  { id: 'reviewr', repo: 'persiyanov/herdr-reviewr', name: 'reviewr', stars: 346,
    blurb: 'Review an agent’s diff in a pane before you let it land.' },
  { id: 'agentbox', repo: 'madarco/agentbox', name: 'agentbox', stars: 336,
    blurb: 'Per-agent isolated boxes with their own state.' },
  { id: 'browser', repo: 'ogulcancelik/herdr-browser', name: 'Browser', stars: 261,
    blurb: 'A browser surface inside herdr, for the localhost your agent just started.' },
  { id: 'collie', repo: 'AltanS/collie', name: 'collie', stars: 261,
    blurb: 'Herds the herd — batch actions across every agent at once.' },
  { id: 'herdr-plus', repo: 'cloudmanic/herdr-plus', name: 'herdr-plus', stars: 207,
    blurb: 'An assortment of quality-of-life additions.' },
  { id: 'remote', repo: 'dcolinmorgan/herdr-remote', name: 'Remote', stars: 191,
    blurb: 'Extra remote/SSH conveniences on top of the built-in support.' },
  { id: 'mirror', repo: 'nikok6/herdr-mirror', name: 'Mirror', stars: 101,
    blurb: 'Mirror a pane somewhere else — handy for watching a run on a second screen.' },
  { id: 'command-palette', repo: 'JanTvrdik/herdr-command-palette', name: 'Command palette', stars: 24,
    blurb: 'Fuzzy command palette for herdr actions.' },
];

const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
const bool = (v, dflt) => (typeof v === 'boolean' ? v : dflt);
const hex6 = (v, dflt) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : dflt);

// A worktree directory lands in a TOML string that herdr will mkdir. Anything with a
// quote, a backslash, a newline or a shell metacharacter in it is refused outright rather
// than escaped, because there is no legitimate reason for one to appear in a path here.
function safePath(v, dflt) {
  if (typeof v !== 'string') return dflt;
  const s = v.trim();
  if (!s || s.length > 120) return dflt;
  if (!/^[~A-Za-z0-9._\/-]+$/.test(s)) return dflt;
  if (s.includes('..')) return dflt;
  return s;
}

// ── herdr-plus text sanitizers ──────────────────────────────────────────────────
// Control characters that must never reach a config file: C0, DEL, C1 (8-bit CSI/OSC),
// zero-width and bidi controls, line/paragraph separators. Same set _term.js strips.
const HP_CTRL = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;
// Names, descriptions, groups, labels: printable text, capped. Quotes and backslashes
// are ALLOWED — they are TOML-escaped on emit by tS(), never trusted raw.
const hpText = (v, max) => (typeof v === 'string' ? v.replace(HP_CTRL, '').slice(0, max).trim() : '');
// Commands: real shell text by design (the user runs it themselves), but never control
// chars or newlines, and never more than 200 chars. TOML-escaped on emit.
const hpCmd = v => hpText(v, 200);
// working_dir: path-ish only. ~ and $VARS expand in herdr-plus, so both are allowed;
// quotes/backslashes are not — there is no legitimate working directory that needs them.
function hpWorkdir(v) {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s || s.length > 120) return '';
  if (!/^[~$A-Za-z0-9._\/ -]+$/.test(s)) return '';
  if (s.includes('..')) return '';
  return s;
}

// Tabs are shared between projects and worktree layouts: name (required by the docs),
// then either a command OR up to 4 panes — the docs make command+panes a load error and
// >4 panes a load error, so the sanitizer enforces both (panes win when both arrive).
function hpTabs(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, HP_LIMITS.tabs).map(t => {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
    const panes = Array.isArray(t.panes)
      ? t.panes.slice(0, HP_LIMITS.panes).map(p => {
          if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
          return { command: hpCmd(p.command), split: pick(p.split, PANE_SPLITS, 'down') };
        }).filter(Boolean)
      : [];
    return {
      name: hpText(t.name, 40),
      command: panes.length ? '' : hpCmd(t.command),
      panes,
    };
  }).filter(Boolean);
}

// Shapes are normalized here; VALIDITY (required fields, select needs a labeled option)
// is judged once, in buildHerdrPlusFiles — an incomplete entry round-trips through a
// share link intact but never reaches a file.
function sanitizePlus(pl) {
  const out = { install: false, projects: [], quickActions: [], worktrees: [] };
  if (!pl || typeof pl !== 'object' || Array.isArray(pl)) return out;
  out.install = pl.install === true;
  if (Array.isArray(pl.projects)) {
    out.projects = pl.projects.slice(0, HP_LIMITS.projects).map(p => {
      if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
      return {
        name: hpText(p.name, 60),
        description: hpText(p.description, 120),
        group: hpText(p.group, 60),
        workingDir: hpWorkdir(p.workingDir),
        tabs: hpTabs(p.tabs),
      };
    }).filter(Boolean);
  }
  if (Array.isArray(pl.quickActions)) {
    out.quickActions = pl.quickActions.slice(0, HP_LIMITS.quickActions).map(a => {
      if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
      const options = Array.isArray(a.options)
        ? a.options.slice(0, HP_LIMITS.options).map(o => {
            if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
            return { label: hpText(o.label, 60), value: hpCmd(o.value),
              description: hpText(o.description, 120), heading: hpText(o.heading, 60) };
          }).filter(Boolean)
        : [];
      const form = (a.form && typeof a.form === 'object' && !Array.isArray(a.form))
        ? { prompt: hpText(a.form.prompt, 80), placeholder: hpText(a.form.placeholder, 80) }
        : { prompt: '', placeholder: '' };
      return {
        name: hpText(a.name, 60),
        description: hpText(a.description, 120),
        type: pick(a.type, QA_TYPES, 'command'),
        command: hpCmd(a.command),
        options, form,
      };
    }).filter(Boolean);
  }
  if (Array.isArray(pl.worktrees)) {
    out.worktrees = pl.worktrees.slice(0, HP_LIMITS.worktrees).map(w => {
      if (!w || typeof w !== 'object' || Array.isArray(w)) return null;
      return { repo: hpText(w.repo, 60), branch: hpText(w.branch, 60), tabs: hpTabs(w.tabs) };
    }).filter(Boolean);
  }
  return out;
}

function sanitizeHerdr(hd) {
  if (!hd || typeof hd !== 'object' || Array.isArray(hd)) return null;
  if (hd.on !== true) return null;
  const d = HERDR_DEFAULTS;
  const ids = HERDR_PLUGINS.map(p => p.id);
  const plugins = Array.isArray(hd.plugins)
    ? hd.plugins.filter(p => ids.includes(p)).slice(0, HERDR_PLUGINS.length)
    : [];
  // [theme.custom] tokens: hex-or-drop, plus panel_bg = "reset" (terminal background).
  const tokens = {};
  const tsrc = (hd.tokens && typeof hd.tokens === 'object' && !Array.isArray(hd.tokens)) ? hd.tokens : {};
  for (const slot of THEME_SLOTS) {
    const v = hex6(tsrc[slot], null);
    if (v) tokens[slot] = v;
    else if (slot === 'panel_bg' && tsrc[slot] === 'reset') tokens[slot] = 'reset';
  }
  // Older links and drafts carried customAccent/accentColor; fold them into the accent
  // token so a saved setup from before this page grew the full surface still applies.
  if (!tokens.accent && hd.customAccent === true) {
    const legacy = hex6(hd.accentColor, null);
    if (legacy) tokens.accent = legacy;
  }
  const soundAgents = {};
  const sagents = (hd.soundAgents && typeof hd.soundAgents === 'object' && !Array.isArray(hd.soundAgents))
    ? hd.soundAgents : {};
  for (const a of SOUND_AGENTS) {
    if (sagents[a] === 'on' || sagents[a] === 'off') soundAgents[a] = sagents[a];
  }
  // Sidebar min/max are real 0.8.0 keys with defaults 18/36; keep min ≤ max, and keep
  // the width inside whatever band survives, since herdr clamps the same way at runtime.
  const sidebarMinWidth = clampInt(hd.sidebarMinWidth, 10, 36, d.sidebarMinWidth);
  let sidebarMaxWidth = clampInt(hd.sidebarMaxWidth, 20, 80, d.sidebarMaxWidth);
  if (sidebarMaxWidth < sidebarMinWidth) sidebarMaxWidth = sidebarMinWidth;
  let sidebarWidth = clampInt(hd.sidebarWidth, 18, 36, d.sidebarWidth);
  sidebarWidth = Math.max(sidebarMinWidth, Math.min(sidebarMaxWidth, sidebarWidth));
  return {
    theme: pick(hd.theme, HERDR_THEMES, d.theme),
    autoSwitch: bool(hd.autoSwitch, d.autoSwitch),
    lightName: pick(hd.lightName, HERDR_THEMES, d.lightName),
    darkName: pick(hd.darkName, HERDR_THEMES, d.darkName),
    tokens,
    defaultShell: hpCmd(hd.defaultShell),
    shellMode: pick(hd.shellMode, SHELL_MODES, d.shellMode),
    newCwd: pick(hd.newCwd, NEW_CWD, d.newCwd),
    prefix: pick(hd.prefix, PREFIXES, d.prefix),
    sidebarWidth,
    sidebarMinWidth,
    sidebarMaxWidth,
    mobileWidthThreshold: clampInt(hd.mobileWidthThreshold, 20, 200, d.mobileWidthThreshold),
    sidebarStartCollapsed: bool(hd.sidebarStartCollapsed, d.sidebarStartCollapsed),
    sidebarCollapsedMode: pick(hd.sidebarCollapsedMode, COLLAPSED_MODES, d.sidebarCollapsedMode),
    agentPanelSort: pick(hd.agentPanelSort, AGENT_SORTS, d.agentPanelSort),
    agentRowsStyle: pick(hd.agentRowsStyle, ['default', 'compact', 'verbose'], d.agentRowsStyle),
    paneBorders: bool(hd.paneBorders, d.paneBorders),
    paneScrollbars: bool(hd.paneScrollbars, d.paneScrollbars),
    paneGaps: bool(hd.paneGaps, d.paneGaps),
    agentLabelsOnBorders: bool(hd.agentLabelsOnBorders, d.agentLabelsOnBorders),
    tabBarPosition: pick(hd.tabBarPosition, TAB_POSITIONS, d.tabBarPosition),
    hideTabBarWhenSingle: bool(hd.hideTabBarWhenSingle, d.hideTabBarWhenSingle),
    mouseCapture: bool(hd.mouseCapture, d.mouseCapture),
    copyOnSelect: bool(hd.copyOnSelect, d.copyOnSelect),
    mouseScrollLines: clampInt(hd.mouseScrollLines, 1, 20, d.mouseScrollLines),
    hostCursor: pick(hd.hostCursor, HOST_CURSORS, d.hostCursor),
    confirmClose: bool(hd.confirmClose, d.confirmClose),
    promptNewTabName: bool(hd.promptNewTabName, d.promptNewTabName),
    promptNewWorkspaceName: bool(hd.promptNewWorkspaceName, d.promptNewWorkspaceName),
    toastDelivery: pick(hd.toastDelivery, TOAST_DELIVERY, d.toastDelivery),
    toastDelaySeconds: clampInt(hd.toastDelaySeconds, 0, 3600, d.toastDelaySeconds),
    toastPosition: pick(hd.toastPosition, TOAST_POSITIONS, d.toastPosition),
    clipToastEnabled: bool(hd.clipToastEnabled, d.clipToastEnabled),
    clipToastPosition: pick(hd.clipToastPosition, CLIP_POSITIONS, d.clipToastPosition),
    soundEnabled: bool(hd.soundEnabled, d.soundEnabled),
    soundAgents,
    resumeAgents: bool(hd.resumeAgents, d.resumeAgents),
    // The floor is 1 MB: herdr counts BYTES here despite the legacy alias being called
    // scrollback_lines, and a few hundred "lines" worth of bytes would silently throw
    // away most of a transcript.
    scrollbackBytes: clampInt(hd.scrollbackBytes, 1000000, 200000000, d.scrollbackBytes),
    worktreeDir: safePath(hd.worktreeDir, d.worktreeDir),
    updateChannel: pick(hd.updateChannel, UPDATE_CHANNELS, d.updateChannel),
    versionCheck: bool(hd.versionCheck, d.versionCheck),
    manifestCheck: bool(hd.manifestCheck, d.manifestCheck),
    paneHistory: bool(hd.paneHistory, d.paneHistory),
    allowNested: bool(hd.allowNested, d.allowNested),
    kittyGraphics: bool(hd.kittyGraphics, d.kittyGraphics),
    plugins,
    plus: sanitizePlus(hd.plus),
  };
}

// ── TOML ────────────────────────────────────────────────────────────────────────
// Hand-rolled rather than a dependency. Most values reaching here are bools, clamped
// integers or strings from fixed lists; herdr-plus names/commands are free text, so tS
// is the security boundary for them: backslash and double-quote are escaped, and the
// sanitizers above have already removed every control character (a TOML basic string
// may not contain unescaped control chars, and nothing here needs them).
const tS = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const tB = v => (v ? 'true' : 'false');

// Every dotted key path this page can EVER write into config.toml. The installer's
// merge treats these as owned — replaced (or removed) on every apply — and preserves
// every other key and table in the user's file. Returning a control to stock therefore
// really removes the line a previous run wrote.
const HERDR_MANAGED_PATHS = [
  'theme.name', 'theme.auto_switch', 'theme.dark_name', 'theme.light_name',
  ...THEME_SLOTS.map(t => 'theme.custom.' + t),
  'terminal.default_shell', 'terminal.shell_mode', 'terminal.new_cwd',
  'keys.prefix',
  'ui.sidebar_width', 'ui.sidebar_min_width', 'ui.sidebar_max_width',
  'ui.sidebar_start_collapsed', 'ui.sidebar_collapsed_mode', 'ui.agent_panel_sort',
  'ui.mobile_width_threshold',
  'ui.pane_borders', 'ui.pane_scrollbars', 'ui.pane_gaps',
  'ui.show_agent_labels_on_pane_borders', 'ui.tab_bar_position',
  'ui.hide_tab_bar_when_single_tab', 'ui.mouse_capture', 'ui.copy_on_select',
  'ui.mouse_scroll_lines', 'ui.host_cursor', 'ui.confirm_close',
  'ui.prompt_new_tab_name', 'ui.prompt_new_workspace_name', 'ui.accent',
  'ui.sidebar.agents.rows',
  'ui.toast.delivery', 'ui.toast.delay_seconds', 'ui.toast.herdr.position',
  'ui.toast.clipboard.enabled', 'ui.toast.clipboard.position',
  'ui.sound.enabled', ...SOUND_AGENTS.map(a => 'ui.sound.agents.' + a),
  'session.resume_agents_on_restore',
  'worktrees.directory',
  'advanced.scrollback_limit_bytes',
  'update.channel', 'update.version_check', 'update.manifest_check',
  'experimental.pane_history', 'experimental.allow_nested', 'experimental.kitty_graphics',
];

// The config.toml this page manages — pure TOML, no markers. This is what the installer
// merges and what a fresh machine ends up with byte-for-byte.
function buildHerdrConfigToml(s) {
  const L = [];
  L.push('# ~/.config/herdr/config.toml');
  L.push('# written by shayan-cc-config — keys verified against herdr 0.8.0');
  L.push('# reload without restarting: herdr server reload-config');
  L.push('');
  L.push('[theme]');
  L.push('name = ' + tS(s.theme));
  if (s.autoSwitch) {
    L.push('auto_switch = true');
    // Only written when chosen: herdr picks the sibling itself when these are unset,
    // and naming a variant that does not exist would land on the silent-fallback path.
    if (s.darkName) L.push('dark_name = ' + tS(s.darkName));
    if (s.lightName) L.push('light_name = ' + tS(s.lightName));
  }
  const setSlots = THEME_SLOTS.filter(k => s.tokens[k]);
  if (setSlots.length) {
    L.push('');
    L.push('[theme.custom]');
    L.push('# per-token overrides on top of the base theme; delete a line to fall back');
    for (const k of setSlots) L.push(k + ' = ' + tS(s.tokens[k]));
  }
  L.push('');
  L.push('[terminal]');
  // default_shell: '' is herdr's own default ($SHELL, then /bin/sh) — omitted when unset
  // so the file does not pin an empty string over the environment.
  if (s.defaultShell) L.push('default_shell = ' + tS(s.defaultShell));
  L.push('shell_mode = ' + tS(s.shellMode));
  L.push('new_cwd = ' + tS(s.newCwd));
  L.push('');
  L.push('[keys]');
  if (s.prefix === 'none') {
    // There is no documented way to spell "no prefix", so the honest thing is to leave
    // the key at its default and say so rather than invent a value.
    L.push('# prefix left at the default ctrl+b — herdr has no documented "no prefix" value.');
    L.push('# For a prefix-free setup, bind ctrl+alt+* chords directly instead.');
    L.push('prefix = "ctrl+b"');
  } else {
    L.push('prefix = ' + tS(s.prefix));
  }
  L.push('');
  L.push('[ui]');
  L.push('sidebar_width = ' + s.sidebarWidth);
  L.push('sidebar_min_width = ' + s.sidebarMinWidth);
  L.push('sidebar_max_width = ' + s.sidebarMaxWidth);
  L.push('sidebar_start_collapsed = ' + tB(s.sidebarStartCollapsed));
  L.push('sidebar_collapsed_mode = ' + tS(s.sidebarCollapsedMode));
  L.push('agent_panel_sort = ' + tS(s.agentPanelSort));
  L.push('mobile_width_threshold = ' + s.mobileWidthThreshold);
  L.push('pane_borders = ' + tB(s.paneBorders));
  L.push('pane_scrollbars = ' + tB(s.paneScrollbars));
  L.push('pane_gaps = ' + tB(s.paneGaps));
  L.push('show_agent_labels_on_pane_borders = ' + tB(s.agentLabelsOnBorders));
  L.push('tab_bar_position = ' + tS(s.tabBarPosition));
  L.push('hide_tab_bar_when_single_tab = ' + tB(s.hideTabBarWhenSingle));
  L.push('mouse_capture = ' + tB(s.mouseCapture));
  L.push('copy_on_select = ' + tB(s.copyOnSelect));
  L.push('mouse_scroll_lines = ' + s.mouseScrollLines);
  L.push('host_cursor = ' + tS(s.hostCursor));
  L.push('confirm_close = ' + tB(s.confirmClose));
  L.push('prompt_new_tab_name = ' + tB(s.promptNewTabName));
  L.push('prompt_new_workspace_name = ' + tB(s.promptNewWorkspaceName));
  // ui.accent takes the same formats as theme.custom.accent and drives highlights,
  // borders and navigation; the accent token sets both so the whole UI follows.
  if (s.tokens.accent) L.push('accent = ' + tS(s.tokens.accent));
  if (s.agentRowsStyle !== 'default') {
    L.push('');
    L.push('[ui.sidebar.agents]');
    L.push(s.agentRowsStyle === 'compact'
      ? 'rows = [["state_icon", "agent", "workspace"]]'
      : 'rows = [["state_icon", "state_text", "workspace", "tab"], ["agent", "terminal_title_stripped"]]');
  }
  L.push('');
  L.push('[ui.toast]');
  L.push('delivery = ' + tS(s.toastDelivery));
  L.push('delay_seconds = ' + s.toastDelaySeconds);
  if (s.toastDelivery === 'herdr') {
    L.push('');
    L.push('[ui.toast.herdr]');
    L.push('position = ' + tS(s.toastPosition));
  }
  L.push('');
  L.push('[ui.toast.clipboard]');
  L.push('enabled = ' + tB(s.clipToastEnabled));
  L.push('position = ' + tS(s.clipToastPosition));
  L.push('');
  L.push('[ui.sound]');
  L.push('enabled = ' + tB(s.soundEnabled));
  const saSet = SOUND_AGENTS.filter(a => s.soundAgents[a]);
  if (saSet.length) {
    L.push('');
    L.push('[ui.sound.agents]');
    L.push('# per-agent override: "on" / "off" (unlisted agents keep their own default)');
    for (const a of saSet) L.push(a + ' = ' + tS(s.soundAgents[a]));
  }
  L.push('');
  L.push('[session]');
  L.push('resume_agents_on_restore = ' + tB(s.resumeAgents));
  L.push('');
  L.push('[worktrees]');
  L.push('directory = ' + tS(s.worktreeDir));
  L.push('');
  L.push('[advanced]');
  L.push('scrollback_limit_bytes = ' + s.scrollbackBytes);
  L.push('');
  L.push('[update]');
  L.push('channel = ' + tS(s.updateChannel));
  L.push('version_check = ' + tB(s.versionCheck));
  L.push('manifest_check = ' + tB(s.manifestCheck));
  L.push('');
  L.push('[experimental]');
  if (s.paneHistory) {
    L.push('# Off by default upstream because stored screen output can contain secrets.');
    L.push('# You turned this on deliberately; it writes session-history.json beside session.json.');
  }
  L.push('pane_history = ' + tB(s.paneHistory));
  L.push('allow_nested = ' + tB(s.allowNested));
  L.push('kitty_graphics = ' + tB(s.kittyGraphics));
  return L.join('\n') + '\n';
}

// ── herdr-plus files ────────────────────────────────────────────────────────────
// One TOML file per entry — the docs are explicit that there is no central config —
// each named scc-<slug>.toml so the installer can tell its own files from the user's.
function hpSlug(base, fallback, used) {
  let s = String(base || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '').slice(0, 40).replace(/-+$/, '');
  if (!s) s = fallback;
  let out = s, n = 2;
  while (used.has(out)) { out = s + '-' + n; n += 1; }
  used.add(out);
  return out;
}

function hpTabLines(t) {
  const L = ['', '[[tabs]]', 'name = ' + tS(t.name)];
  if (t.panes.length) {
    // command and panes are mutually exclusive by the docs (a load error); the
    // sanitizer already dropped the command when panes exist.
    for (const p of t.panes) {
      L.push('', '[[tabs.panes]]');
      if (p.command) L.push('command = ' + tS(p.command));
      L.push('split = ' + tS(p.split));
    }
  } else if (t.command) {
    L.push('command = ' + tS(t.command));
  }
  return L;
}

// Returns [{ rel, body }] — rel is the path under the herdr-plus config dir, body is
// the exact bytes the installer writes (and the preview shows, verbatim).
function buildHerdrPlusFiles(s) {
  const files = [];
  const plus = s.plus;
  const manifest = rel =>
    '# ' + rel + ' — written by shayan-cc-config (herdr-plus; regenerated on each apply)';

  const usedP = new Set();
  plus.projects.forEach((p, i) => {
    const tabs = p.tabs.filter(t => t.name);
    // The docs require a name and at least one tab; an incomplete entry is left out.
    if (!p.name || !tabs.length) return;
    const rel = 'projects/scc-' + hpSlug(p.name, 'project-' + (i + 1), usedP) + '.toml';
    const L = [manifest(rel), 'name = ' + tS(p.name)];
    if (p.description) L.push('description = ' + tS(p.description));
    if (p.group) L.push('group = ' + tS(p.group));
    if (p.workingDir) L.push('working_dir = ' + tS(p.workingDir));
    tabs.forEach(t => L.push(...hpTabLines(t)));
    files.push({ rel, body: L.join('\n') + '\n' });
  });

  const usedA = new Set();
  plus.quickActions.forEach((a, i) => {
    // The docs: name and a non-empty command are required; a select needs at least one
    // labeled option or the whole directory fails to load — so it never gets written.
    if (!a.name || !a.command) return;
    if (a.type === 'select' && !a.options.some(o => o.label)) return;
    const rel = 'quick-actions/scc-' + hpSlug(a.name, 'action-' + (i + 1), usedA) + '.toml';
    const L = [manifest(rel), 'name = ' + tS(a.name)];
    if (a.description) L.push('description = ' + tS(a.description));
    if (a.type !== 'command') L.push('type = ' + tS(a.type));
    L.push('command = ' + tS(a.command));
    if (a.type === 'select') {
      for (const o of a.options) {
        L.push('', '[[options]]');
        if (o.label) {
          L.push('label = ' + tS(o.label));
          if (o.value) L.push('value = ' + tS(o.value));
          if (o.description) L.push('description = ' + tS(o.description));
        } else if (o.heading) {
          // No label = separator; a heading makes it a dim group title, none a spacer.
          L.push('heading = ' + tS(o.heading));
        }
      }
    }
    if (a.type === 'form' && (a.form.prompt || a.form.placeholder)) {
      L.push('', '[form]');
      if (a.form.prompt) L.push('prompt = ' + tS(a.form.prompt));
      if (a.form.placeholder) L.push('placeholder = ' + tS(a.form.placeholder));
    }
    files.push({ rel, body: L.join('\n') + '\n' });
  });

  const usedW = new Set();
  plus.worktrees.forEach((w, i) => {
    const tabs = w.tabs.filter(t => t.name);
    if (!w.repo || !tabs.length) return;
    const rel = 'worktrees/scc-' + hpSlug(w.repo + (w.branch ? '-' + w.branch : ''), 'layout-' + (i + 1), usedW) + '.toml';
    const L = [manifest(rel), 'repo = ' + tS(w.repo)];
    if (w.branch) L.push('branch = ' + tS(w.branch));
    tabs.forEach(t => L.push(...hpTabLines(t)));
    files.push({ rel, body: L.join('\n') + '\n' });
  });

  return files;
}

// The single string /herdr-files.txt serves: the managed config.toml, then one
// '@@PLUS@@<rel>' marker line per herdr-plus artifact followed by that file's exact
// bytes. Marker lines always start a line, and no builder output line can start with
// '@@PLUS@@' (every line starts with a key, '#', '[' or is empty), so the page's split
// is unambiguous even when a command *contains* the marker text.
function buildHerdrToml(s) {
  let out = buildHerdrConfigToml(s);
  for (const f of buildHerdrPlusFiles(s)) out += '@@PLUS@@' + f.rel + '\n' + f.body;
  return out;
}

// ── the installer ───────────────────────────────────────────────────────────────
// Contract, same as the codex layer: parse the user's config.toml first and ABORT if it
// does not parse; back up before touching; replace only the keys this page manages
// (HERDR_MANAGED_PATHS) and keep every other key, table and top-level value — a live
// config's `onboarding = false` used to be clobbered by the old whole-file write, which
// re-showed first-run onboarding; the merge is the fix. Validate the merged result
// parses AND matches the intent before writing a byte. Idempotent by construction: on a
// file this page wrote, every key is managed, so the output is the managed file again.
function herdrApplyBlock(s) {
  const toml = buildHerdrConfigToml(s);
  const plusFiles = buildHerdrPlusFiles(s);
  // The herdr-plus panel installs cloudmanic/herdr-plus itself; don't install it twice
  // when the marketplace card is also ticked.
  const chosen = HERDR_PLUGINS.filter(p => s.plugins.includes(p.id))
    .filter(p => !(s.plus.install && p.id === 'herdr-plus'));
  const pluginLines = chosen.map(p =>
    `  echo "  → ${p.repo}"\n  herdr plugin install ${p.repo} --yes || echo "    (skipped: ${p.repo})"`
  ).join('\n');
  const plusActive = s.plus.install || plusFiles.length > 0;
  const plusBlock = !plusActive ? '' : `
  echo "  herdr-plus (free, MIT — cloudmanic/herdr-plus)…"${s.plus.install ? `
  herdr plugin install cloudmanic/herdr-plus --yes || echo "    (plugin install skipped — run: herdr plugin install cloudmanic/herdr-plus)"` : ''}${plusFiles.length ? `
  # Where herdr-plus reads its per-entry TOML files. The plugin's own config-dir wins;
  # the documented standalone fallback is ~/.config/herdr-plus.
  HP_DIR="$(herdr plugin config-dir cloudmanic.herdr-plus 2>/dev/null || echo "$HOME/.config/herdr-plus")"
  [ -n "$HP_DIR" ] || HP_DIR="$HOME/.config/herdr-plus"
  mkdir -p "$HP_DIR/projects" "$HP_DIR/quick-actions" "$HP_DIR/worktrees"
  # Only files this site wrote (scc-*.toml) are ever removed or replaced. Your own
  # files in these directories are never touched.
  rm -f "$HP_DIR"/projects/scc-*.toml "$HP_DIR"/quick-actions/scc-*.toml "$HP_DIR"/worktrees/scc-*.toml
${plusFiles.map((f, i) => `  cat > "$HP_DIR/${f.rel}" <<'SCC_HP_${i + 1}'
${f.body}SCC_HP_${i + 1}
  echo "  wrote $HP_DIR/${f.rel}"`).join('\n')}` : ''}`;
  return `
echo ""
echo "▸ Applying the herdr layer…"

if ! command -v herdr >/dev/null 2>&1; then
  echo "  herdr is not installed. Get it with:"
  echo "    curl -fsSL https://herdr.dev/install.sh | sh"
  echo "    (or: brew install herdr)"
  echo "  Skipping the herdr layer."
else
  HERDR_STAMP="$(date +%Y%m%d-%H%M%S)"
  # $HOME/.config literally, not \$XDG_CONFIG_HOME/…: herdr documents this path and
  # HERDR_CONFIG_PATH as the override, and says nothing about honouring XDG. Guessing
  # XDG would write the file somewhere herdr never reads on any machine that sets it.
  HERDR_CFG="\${HERDR_CONFIG_PATH:-$HOME/.config/herdr/config.toml}"
  mkdir -p "$(dirname "$HERDR_CFG")"
  if [ -f "$HERDR_CFG" ]; then
    cp "$HERDR_CFG" "$HERDR_CFG.backup-$HERDR_STAMP"
    echo "  backed up your old config → $HERDR_CFG.backup-$HERDR_STAMP"
  fi
  HERDR_NEW="$(mktemp)"
  cat > "$HERDR_NEW" <<'SCC_HERDR_TOML'
${toml}SCC_HERDR_TOML
  # The merge needs tomllib (python 3.11+). macOS's own /usr/bin/python3 is 3.9, so
  # finding A python3 is not enough — find one that can actually do the job. The
  # capability check lives HERE so that when the python script exits 0 it means
  # "merged", not "shrugged".
  HERDR_PY=""
  for HERDR_CAND in python3 python3.13 python3.12 python3.11 \\
      /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if command -v "$HERDR_CAND" >/dev/null 2>&1 \\
       && "$HERDR_CAND" -c 'import tomllib' >/dev/null 2>&1; then
      HERDR_PY="$HERDR_CAND"; break
    fi
  done
  if [ -z "$HERDR_PY" ]; then
    rm -f "$HERDR_NEW"
    echo "  ✗ the herdr layer needs python 3.11+ (for tomllib) to merge config.toml safely,"
    echo "    and none was found. Nothing was changed. Install one and rerun:"
    echo "      brew install python3"
  elif "$HERDR_PY" - "$HERDR_CFG" "$HERDR_NEW" "${HERDR_MANAGED_PATHS.join(',')}" <<'SCC_HERDR_PY'
import sys, io, os, copy, datetime
import tomllib
path, new_path, paths_csv = sys.argv[1], sys.argv[2], sys.argv[3]
new_src = io.open(new_path, encoding='utf-8').read()
new_data = tomllib.loads(new_src)                 # our own file must parse
managed = set(paths_csv.split(','))
src = io.open(path, encoding='utf-8').read() if os.path.exists(path) else ''
try:
    old = tomllib.loads(src)
except Exception as e:
    print('  your config.toml does not parse (' + str(e)[:120] + ')')
    print('  refusing to guess; fix it and rerun. Nothing was changed.')
    sys.exit(1)

def bare(k):
    ok = len(k) > 0
    for c in k:
        if not (('a' <= c <= 'z') or ('A' <= c <= 'Z') or ('0' <= c <= '9') or c in '-_'):
            ok = False
    return k if ok else ser(k)

def ser(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
        return v.isoformat()
    if isinstance(v, str):
        out = ''
        for c in v:
            if c == '\\\\':
                out = out + '\\\\\\\\'
            elif c == '"':
                out = out + '\\\\"'
            elif c == '\\n':
                out = out + '\\\\n'
            elif c == '\\r':
                out = out + '\\\\r'
            elif c == '\\t':
                out = out + '\\\\t'
            elif ord(c) < 32 or ord(c) == 127:
                out = out + '\\\\u%04X' % ord(c)
            else:
                out = out + c
        return '"' + out + '"'
    if isinstance(v, list):
        return '[' + ', '.join(ser(x) for x in v) + ']'
    if isinstance(v, dict):
        return '{ ' + ', '.join(bare(k) + ' = ' + ser(x) for k, x in v.items()) + ' }'
    raise ValueError('cannot serialize ' + type(v).__name__)

# Flatten the user's file into (path-tuple, value) leaves in document order. A non-empty
# dict recurses; lists (arrays-of-tables included) and empty tables are leaves.
def leaves(d, base):
    out = []
    for k, v in d.items():
        p = base + (k,)
        if isinstance(v, dict) and v:
            out.extend(leaves(v, p))
        else:
            out.append((p, v))
    return out

keep = []
for p, v in leaves(old, ()):
    if '.'.join(p) not in managed:
        keep.append((p, v))

def tables(d, base):
    out = []
    for k, v in d.items():
        if isinstance(v, dict):
            p = base + (k,)
            out.append('.'.join(p))
            out.extend(tables(v, p))
    return out
new_tables = set(tables(new_data, ()))

# Bucket every kept key: top-level scalars go before the first section; keys whose table
# exists in the managed file are inserted into that section; everything else becomes its
# own section appended at the end (TOML does not require tables to be grouped).
root_keep = []
sect_keep = {}
tail = []
tail_ix = {}
for p, v in keep:
    tbl = '.'.join(p[:-1])
    if len(p) == 1:
        root_keep.append((p[-1], v))
    elif tbl in new_tables:
        sect_keep.setdefault(tbl, []).append((p[-1], v))
    else:
        if tbl not in tail_ix:
            tail_ix[tbl] = len(tail)
            tail.append([p[:-1], []])
        tail[tail_ix[tbl]][1].append((p[-1], v))

lines = new_src.split('\\n')
headers = []
for i in range(len(lines)):
    if lines[i].startswith('[') and lines[i].endswith(']'):
        headers.append(i)
hdr_pos = {}
for i in headers:
    hdr_pos[lines[i][1:-1]] = i

ins = []
if root_keep:
    first_hdr = headers[0] if headers else len(lines)
    block = ['# kept from your existing config (keys this page does not manage)']
    for k, v in root_keep:
        block.append(bare(k) + ' = ' + ser(v))
    block.append('')
    ins.append((first_hdr, block))
for tbl in sect_keep:
    h = hdr_pos[tbl]
    end = len(lines)
    for j in range(h + 1, len(lines)):
        if lines[j].startswith('[') and lines[j].endswith(']'):
            end = j
            break
    last = h
    for j in range(h, end):
        if lines[j].strip():
            last = j
    block = []
    for k, v in sect_keep[tbl]:
        block.append(bare(k) + ' = ' + ser(v) + '  # kept (unmanaged)')
    ins.append((last + 1, block))

out_lines = lines[:]
for pos, block in sorted(ins, key=lambda t: t[0], reverse=True):
    out_lines[pos:pos] = block
if tail:
    if out_lines and out_lines[-1].strip():
        out_lines.append('')
    out_lines.append('# kept from your existing config (sections this page does not manage)')
    for parts, kvs in tail:
        out_lines.append('[' + '.'.join(bare(x) for x in parts) + ']')
        for k, v in kvs:
            out_lines.append(bare(k) + ' = ' + ser(v))
        out_lines.append('')

text = '\\n'.join(out_lines)
if not text.endswith('\\n'):
    text = text + '\\n'
try:
    round2 = tomllib.loads(text)
except Exception as e:
    print('  merge produced an invalid file (' + str(e)[:120] + '); nothing was changed')
    sys.exit(1)

# The merged parse must agree with the intent: managed data exactly as generated, plus
# every kept key at its old path. A mismatch means a boundary was misjudged - abort
# rather than write.
def set_path(d, parts, v):
    cur = d
    for s in parts[:-1]:
        nxt = cur.get(s)
        if nxt is None:
            nxt = {}
            cur[s] = nxt
        if not isinstance(nxt, dict):
            raise ValueError(s)
        cur = nxt
    cur[parts[-1]] = v

expected = copy.deepcopy(new_data)
try:
    for p, v in keep:
        set_path(expected, p, v)
except ValueError:
    print('  cannot merge: one of your keys collides with a managed table; nothing was changed')
    sys.exit(1)
if round2 != expected:
    print('  merge verification failed (the result does not match the intent); nothing was changed')
    sys.exit(1)
io.open(path, 'w', encoding='utf-8').write(text)
print('  merged into ' + path + ' (your unmanaged keys were kept)')
SCC_HERDR_PY
  then
    rm -f "$HERDR_NEW"
    echo "  wrote $HERDR_CFG"
${chosen.length ? `
  echo "  installing ${chosen.length} plugin${chosen.length > 1 ? 's' : ''}…"
${pluginLines}` : ''}${plusBlock}
    # Applies most UI settings without restarting panes; startup-only keys still need a
    # restart. Fails harmlessly when no server is running yet.
    herdr server reload-config >/dev/null 2>&1 && echo "  reloaded the running herdr server" || true
  else
    # A command inside an if-condition does not trip set -e, so this message can run;
    # the trailing false re-raises the failure so the whole install exits non-zero.
    rm -f "$HERDR_NEW"
    echo "  the herdr layer did not apply — nothing of yours was changed."
    false
  fi
fi`;
}

module.exports = {
  HERDR_DEFAULTS, HERDR_THEMES, BIN_VERIFIED_THEMES, THEME_SIBLINGS, THEME_SLOTS,
  HERDR_PLUGINS, SHELL_MODES, NEW_CWD, COLLAPSED_MODES, HOST_CURSORS, TAB_POSITIONS,
  AGENT_SORTS, TOAST_DELIVERY, TOAST_POSITIONS, CLIP_POSITIONS, UPDATE_CHANNELS,
  CJK_CURSORS, AGENT_TOKENS, SPACE_TOKENS, PREFIXES, SOUND_AGENTS, SOUND_MODES,
  PANE_SPLITS, QA_TYPES, HP_LIMITS, HERDR_MANAGED_PATHS,
  sanitizeHerdr, buildHerdrToml, buildHerdrConfigToml, buildHerdrPlusFiles, herdrApplyBlock,
};
