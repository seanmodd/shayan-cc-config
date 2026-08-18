// herdr configuration — the server half.
//
// herdr keeps everything in ONE file, unlike cmux's Ghostty-plus-JSON pair:
//
//   ~/.config/herdr/config.toml      (Linux + macOS; %APPDATA%\herdr\config.toml on Windows)
//
// Read against herdr 0.8.0 docs on 2026-08-06. The full surface is ~150 keys across 13
// sections; this module exposes the ones a person would actually set from a web page and
// leaves the rest to `herdr --default-config`.
//
// Deliberately NOT exposed: [[keys.command]] (runs arbitrary shell on a keypress),
// ui.sound.path and friends (a file path we cannot validate), remote.*, and the plugin
// install list is kept separate from the config file because installing a plugin runs
// somebody's code. A link from the internet does not get to do any of that.
//
// Everything a stranger can put in a share link ends up in a file on disk, so every
// value is checked against the documented enums and ranges before it reaches the builder.

const { clampInt, cleanText } = require('./_term.js');

// ── the option space ────────────────────────────────────────────────────────────
// Built-in theme names, in the order herdr lists them. The docs claim the config
// reference enumerates these; it does not — it types theme.name as a bare string. This
// list is therefore taken from herdr's own THEME_NAMES, verified identical at tag v0.8.0
// and at master. If a name here stops existing, herdr falls back to a default and logs a
// warning rather than failing, so a stale entry degrades quietly rather than breaking.
const HERDR_THEMES = [
  'catppuccin', 'catppuccin-latte', 'terminal', 'tokyo-night', 'tokyo-night-day',
  'dracula', 'nord', 'gruvbox', 'gruvbox-light', 'one-dark', 'one-light',
  'solarized', 'solarized-light', 'kanagawa', 'kanagawa-lotus',
  'rose-pine', 'rose-pine-dawn', 'vesper',
];
// Which built-in pairs with which, for auto_switch. herdr picks the sibling itself when
// light_name/dark_name are omitted, but writing them out makes the file self-explaining.
const THEME_SIBLINGS = {
  'catppuccin': 'catppuccin-latte', 'tokyo-night': 'tokyo-night-day',
  'gruvbox': 'gruvbox-light', 'one-dark': 'one-light', 'solarized': 'solarized-light',
  'kanagawa': 'kanagawa-lotus', 'rose-pine': 'rose-pine-dawn',
};
// The 16 slots theme.custom accepts at 0.8.0. sidebar_bg exists on master and is
// deliberately absent — emitting it against 0.8.0 would be an unknown key.
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

// The prefix-key families herdr's docs vet as safe, plus the ones they name as
// conflicting. Offering a free-text key field would let a share link bind something that
// eats the user's typing, so the page picks from this list instead.
const PREFIXES = ['ctrl+b', 'ctrl+a', 'ctrl+space', 'ctrl+g', 'f12', 'none'];

// Every default below is herdr 0.8.0's own stated default, so BEFORE is genuinely stock.
const HERDR_DEFAULTS = {
  preset: '',
  // theme
  theme: 'catppuccin',
  autoSwitch: false,
  customAccent: false,
  accentColor: '#7aa2f7',
  // terminal
  shellMode: 'auto',
  newCwd: 'follow',
  // keys
  prefix: 'ctrl+b',
  // ui — sidebar
  sidebarWidth: 26,
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
  // notifications — delivery is genuinely 'off' out of the box, which surprises people
  toastDelivery: 'off',
  toastDelaySeconds: 1,
  toastPosition: 'bottom-right',
  soundEnabled: true,
  // session / storage
  resumeAgents: true,
  scrollbackBytes: 10000000,
  worktreeDir: '~/.herdr/worktrees',
  // updates
  updateChannel: 'stable',
  // experimental
  paneHistory: false,
  allowNested: false,
  kittyGraphics: false,
  // integration + plugins
  plugins: [],
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

function sanitizeHerdr(hd) {
  if (!hd || typeof hd !== 'object' || Array.isArray(hd)) return null;
  if (hd.on !== true) return null;
  const d = HERDR_DEFAULTS;
  const ids = HERDR_PLUGINS.map(p => p.id);
  const plugins = Array.isArray(hd.plugins)
    ? hd.plugins.filter(p => ids.includes(p)).slice(0, HERDR_PLUGINS.length)
    : [];
  return {
    theme: pick(hd.theme, HERDR_THEMES, d.theme),
    autoSwitch: bool(hd.autoSwitch, d.autoSwitch),
    customAccent: bool(hd.customAccent, d.customAccent),
    accentColor: hex6(hd.accentColor, d.accentColor),
    shellMode: pick(hd.shellMode, SHELL_MODES, d.shellMode),
    newCwd: pick(hd.newCwd, NEW_CWD, d.newCwd),
    prefix: pick(hd.prefix, PREFIXES, d.prefix),
    sidebarWidth: clampInt(hd.sidebarWidth, 18, 36, d.sidebarWidth),
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
    toastDelivery: pick(hd.toastDelivery, TOAST_DELIVERY, d.toastDelivery),
    toastDelaySeconds: clampInt(hd.toastDelaySeconds, 0, 3600, d.toastDelaySeconds),
    toastPosition: pick(hd.toastPosition, TOAST_POSITIONS, d.toastPosition),
    soundEnabled: bool(hd.soundEnabled, d.soundEnabled),
    resumeAgents: bool(hd.resumeAgents, d.resumeAgents),
    // The floor is 1 MB: herdr counts BYTES here despite the legacy alias being called
    // scrollback_lines, and a few hundred "lines" worth of bytes would silently throw
    // away most of a transcript.
    scrollbackBytes: clampInt(hd.scrollbackBytes, 1000000, 200000000, d.scrollbackBytes),
    worktreeDir: safePath(hd.worktreeDir, d.worktreeDir),
    updateChannel: pick(hd.updateChannel, UPDATE_CHANNELS, d.updateChannel),
    paneHistory: bool(hd.paneHistory, d.paneHistory),
    allowNested: bool(hd.allowNested, d.allowNested),
    kittyGraphics: bool(hd.kittyGraphics, d.kittyGraphics),
    plugins,
  };
}

// ── TOML ────────────────────────────────────────────────────────────────────────
// Hand-rolled rather than a dependency: every value reaching here has already been
// constrained to a bool, a clamped integer, or a string from a fixed list, so the only
// quoting case left is the basic string.
const tS = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const tB = v => (v ? 'true' : 'false');

function buildHerdrToml(s) {
  const L = [];
  L.push('# ~/.config/herdr/config.toml');
  L.push('# written by shayan-cc-config — keys verified against herdr 0.8.0');
  L.push('# reload without restarting: herdr server reload-config');
  L.push('');
  L.push('[theme]');
  L.push('name = ' + tS(s.theme));
  if (s.autoSwitch) {
    const sib = THEME_SIBLINGS[s.theme];
    L.push('auto_switch = true');
    // Only write the pair when there IS a documented sibling. Naming a light variant that
    // does not exist would land on herdr's silent-fallback path.
    if (sib) { L.push('dark_name = ' + tS(s.theme)); L.push('light_name = ' + tS(sib)); }
  }
  if (s.customAccent) { L.push(''); L.push('[theme.custom]'); L.push('accent = ' + tS(s.accentColor)); }
  L.push('');
  L.push('[terminal]');
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
  L.push('sidebar_start_collapsed = ' + tB(s.sidebarStartCollapsed));
  L.push('sidebar_collapsed_mode = ' + tS(s.sidebarCollapsedMode));
  L.push('agent_panel_sort = ' + tS(s.agentPanelSort));
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
  if (s.customAccent) L.push('accent = ' + tS(s.accentColor));
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
  L.push('[ui.sound]');
  L.push('enabled = ' + tB(s.soundEnabled));
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

// ── the installer ───────────────────────────────────────────────────────────────
function herdrApplyBlock(s) {
  const toml = buildHerdrToml(s);
  const chosen = HERDR_PLUGINS.filter(p => s.plugins.includes(p.id));
  const pluginLines = chosen.map(p =>
    `  echo "  → ${p.repo}"\n  herdr plugin install ${p.repo} --yes || echo "    (skipped: ${p.repo})"`
  ).join('\n');
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
  # Whole-file, because TOML has no comment-fenced-block convention the way the Ghostty
  # config does and a half-merged TOML table is worse than a replaced file. The backup is
  # the undo, and it is printed so it is findable.
  if [ -f "$HERDR_CFG" ]; then
    cp "$HERDR_CFG" "$HERDR_CFG.backup-$HERDR_STAMP"
    echo "  backed up your old config → $HERDR_CFG.backup-$HERDR_STAMP"
  fi
  cat > "$HERDR_CFG" <<'SCC_HERDR_TOML'
${toml}SCC_HERDR_TOML
  echo "  wrote $HERDR_CFG"
${chosen.length ? `
  echo "  installing ${chosen.length} plugin${chosen.length > 1 ? 's' : ''}…"
${pluginLines}` : ''}
  # Applies most UI settings without restarting panes; startup-only keys still need a
  # restart. Fails harmlessly when no server is running yet.
  herdr server reload-config >/dev/null 2>&1 && echo "  reloaded the running herdr server" || true
fi`;
}

module.exports = {
  HERDR_DEFAULTS, HERDR_THEMES, THEME_SIBLINGS, THEME_SLOTS, HERDR_PLUGINS,
  SHELL_MODES, NEW_CWD, COLLAPSED_MODES, HOST_CURSORS, TAB_POSITIONS, AGENT_SORTS,
  TOAST_DELIVERY, TOAST_POSITIONS, CLIP_POSITIONS, UPDATE_CHANNELS, CJK_CURSORS,
  AGENT_TOKENS, SPACE_TOKENS, PREFIXES,
  sanitizeHerdr, buildHerdrToml, herdrApplyBlock,
};
