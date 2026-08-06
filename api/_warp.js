// Warp configuration — the server half.
//
// Warp spreads its configuration across four places in ~/.warp, and they are NOT equal:
//
//   ~/.warp/themes/<name>.yaml            a theme. ADDITIVE — a new file, nothing else
//                                         touched. Safe to write.
//   ~/.warp/launch_configurations/*.yaml  a saved window/tab/pane layout. Also ADDITIVE.
//   ~/.warp/keybindings.yaml              overrides only; Warp keeps its defaults for
//                                         anything absent. Small and user-owned.
//   ~/.warp/settings.toml                 everything the Settings UI writes. Warp OWNS
//                                         this file and rewrites it whenever you change
//                                         a setting in the app.
//
// That last distinction decides the shape of this module. Schemas below were taken from
// a real Warp install on 2026-08-06 — actual files on disk, not documentation — so the
// theme and launch-config formats here are exactly what Warp itself writes.
//
// WHY settings.toml IS NOT WRITTEN. It is a single ~7KB file holding notification
// preferences, global hotkeys, agent execution profiles with command allow/deny lists,
// and account state. Replacing it wholesale to change a font size would throw all of
// that away, and Warp rewrites the file from the GUI anyway, so an external write can be
// clobbered on the next settings change. There is no stdlib TOML *writer* in Python to
// do a surgical merge with either. So the page generates the appearance keys as a
// snippet you can paste, and the installer does not touch the file. Refusing to write it
// is the honest option; silently overwriting somebody's agent denylist is not.

const { clampInt } = require('./_term.js');

// ── theme ───────────────────────────────────────────────────────────────────────
// Verified against a real ~/.warp/themes/*.yaml. Every key below appears in a file Warp
// wrote itself.
//   background, accent, foreground   #rrggbb
//   details                          "darker" | "lighter"  (how Warp shades its chrome)
//   terminal_colors.normal / .bright the 8 ANSI names each
//   background_image                 optional { path, opacity }
//   name                             the label shown in the theme picker
const DETAILS = ['darker', 'lighter'];
const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// A pane in a launch configuration may carry a colour; these are the values Warp itself
// writes. Kept to the set seen in real files rather than an invented palette.
const PANE_COLORS = ['', 'blue', 'green', 'yellow', 'red', 'magenta', 'cyan'];

const WARP_DEFAULTS = {
  // theme
  themeName: 'Claude Code',
  fromPalette: true,          // derive the theme from the Claude Code palette
  background: '#1a1b26',
  foreground: '#c0caf5',
  accent: '#7aa2f7',
  details: 'darker',
  // launch configuration
  launchConfig: true,
  lcName: 'claude-code',
  lcTitle: 'Claude Code',
  lcSplit: 'horizontal',
  lcColor: 'magenta',
  lcGitPane: true,
  lcAgentCommand: 'claude',
  // keybindings
  keybindings: false,
  kbCompletion: 'ctrl-space',
  kbAutosuggest: 'tab',
  // the settings.toml snippet (shown, never written — see the note at the top)
  fontName: 'Hack Nerd Font',
  fontSize: 13,
  cursorType: 'bar',
  inputMode: 'pinned_to_bottom',
  spacing: 'compact',
  opacity: 100,
  blur: 0,
  showBlockDividers: true,
  dimInactivePanes: true,
};

// Only values seen written by Warp itself. Anything not on these lists would be a guess,
// and an out-of-enum value in settings.toml is exactly the kind of thing that fails
// quietly.
const CURSOR_TYPES = ['bar', 'block', 'underline'];
const INPUT_MODES = ['pinned_to_bottom', 'classic'];
const SPACINGS = ['compact', 'standard', 'comfortable'];
const SPLITS = ['horizontal', 'vertical'];

const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
const bool = (v, dflt) => (typeof v === 'boolean' ? v : dflt);
const hex6 = (v, dflt) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : dflt);

// A theme name becomes a FILENAME under ~/.warp/themes, so it is restricted hard: no
// slashes, no dots, no quotes, nothing that could climb out of the directory or break
// out of the YAML string it is also written into.
function safeName(v, dflt, max) {
  if (typeof v !== 'string') return dflt;
  const s = v.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  return s || dflt;
}
// The agent command is executed by Warp when the launch configuration opens. It is
// therefore an allowlist of known agent CLIs, not free text — a share link does not get
// to choose what runs on somebody's machine.
const AGENT_COMMANDS = ['claude', 'claude --continue', 'codex', 'gemini', 'opencode', 'zsh'];

function sanitizeWarp(wp) {
  if (!wp || typeof wp !== 'object' || Array.isArray(wp)) return null;
  if (wp.on !== true) return null;
  const d = WARP_DEFAULTS;
  return {
    themeName: safeName(wp.themeName, d.themeName, 40),
    fromPalette: bool(wp.fromPalette, d.fromPalette),
    background: hex6(wp.background, d.background),
    foreground: hex6(wp.foreground, d.foreground),
    accent: hex6(wp.accent, d.accent),
    details: pick(wp.details, DETAILS, d.details),
    launchConfig: bool(wp.launchConfig, d.launchConfig),
    lcName: safeName(wp.lcName, d.lcName, 40),
    lcTitle: safeName(wp.lcTitle, d.lcTitle, 40),
    lcSplit: pick(wp.lcSplit, SPLITS, d.lcSplit),
    lcColor: pick(wp.lcColor, PANE_COLORS, d.lcColor),
    lcGitPane: bool(wp.lcGitPane, d.lcGitPane),
    lcAgentCommand: pick(wp.lcAgentCommand, AGENT_COMMANDS, d.lcAgentCommand),
    keybindings: bool(wp.keybindings, d.keybindings),
    fontName: safeName(wp.fontName, d.fontName, 40),
    fontSize: clampInt(wp.fontSize, 8, 32, d.fontSize),
    cursorType: pick(wp.cursorType, CURSOR_TYPES, d.cursorType),
    inputMode: pick(wp.inputMode, INPUT_MODES, d.inputMode),
    spacing: pick(wp.spacing, SPACINGS, d.spacing),
    opacity: clampInt(wp.opacity, 20, 100, d.opacity),
    blur: clampInt(wp.blur, 0, 30, d.blur),
    showBlockDividers: bool(wp.showBlockDividers, d.showBlockDividers),
    dimInactivePanes: bool(wp.dimInactivePanes, d.dimInactivePanes),
  };
}

// ── palette → theme ─────────────────────────────────────────────────────────────
const palHex = (t, fb) => (Array.isArray(t) && t.length === 3
  ? '#' + t.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')
  : fb);

// Lighten toward white, for the bright ANSI row. Warp expects both rows filled, and
// deriving bright from normal keeps the two coherent instead of pairing a themed normal
// row with eight stock brights.
function lighten(hex, amt) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const mix = n => Math.round(n + (255 - n) * amt);
  return '#' + [1, 2, 3].map(i => mix(parseInt(m[i], 16)).toString(16).padStart(2, '0')).join('');
}

function warpColors(s, palette) {
  const p = palette || {};
  if (!s.fromPalette) {
    return { background: s.background, foreground: s.foreground, accent: s.accent };
  }
  return {
    background: palHex(p.bg, s.background),
    foreground: palHex(p.text, s.foreground),
    accent: palHex(p.accent, s.accent),
  };
}

function buildWarpTheme(s, palette) {
  const p = palette || {};
  const c = warpColors(s, palette);
  const normal = {
    black: palHex(p.subtle, '#32344a'),
    red: palHex(p.red, '#f7768e'),
    green: palHex(p.green, '#9ece6a'),
    yellow: palHex(p.yellow, '#e0af68'),
    blue: palHex(p.blue, '#7aa2f7'),
    magenta: palHex(p.accent2, '#ad8ee6'),
    cyan: palHex(p.cyan, '#449dab'),
    white: palHex(p.text, '#787c99'),
  };
  const L = [];
  L.push('---');
  L.push('# ~/.warp/themes/' + s.themeName + '.yaml');
  L.push('# written by shayan-cc-config');
  L.push('background: "' + c.background + '"');
  L.push('accent: "' + c.accent + '"');
  L.push('foreground: "' + c.foreground + '"');
  L.push('details: ' + s.details);
  L.push('terminal_colors:');
  L.push('  normal:');
  for (const k of ANSI) L.push('    ' + k + ': "' + normal[k] + '"');
  L.push('  bright:');
  // 0.28 keeps the bright row visibly distinct without washing dark palettes out.
  for (const k of ANSI) L.push('    ' + k + ': "' + lighten(normal[k], 0.28) + '"');
  L.push('name: ' + s.themeName);
  return L.join('\n') + '\n';
}

// ── launch configuration ────────────────────────────────────────────────────────
// Shape verified against real ~/.warp/launch_configurations/*.yaml files.
//
// FLAT on purpose. Two shapes are attested on disk: a single-pane tab, where `layout`
// carries cwd/is_focused directly, and a split, where `layout` carries `split_direction`
// plus a flat `panes` list. Nesting a split inside a pane is NOT attested anywhere, and
// this file is read by Warp — so the panes go side by side in one split rather than
// shipping a guessed structure.
//
// cwd is omitted deliberately: the panes then open wherever you launch the configuration
// from, instead of baking in a path belonging to whoever generated the link.
function buildWarpLaunch(s) {
  const L = [];
  L.push('---');
  L.push('# ~/.warp/launch_configurations/' + s.lcName + '.yaml');
  L.push('# Open it from the command palette: "Launch Configuration".');
  L.push('# Docs: https://docs.warp.dev/features/sessions/launch-configurations');
  L.push('name: ' + s.lcName);
  L.push('active_window_index: 0');
  L.push('windows:');
  L.push('  - active_tab_index: 0');
  L.push('    tabs:');
  L.push('      - title: ' + s.lcTitle);
  L.push('        layout:');
  L.push('          split_direction: ' + s.lcSplit);
  L.push('          panes:');
  L.push('            - is_focused: true');
  L.push('              commands:');
  L.push('                - exec: ' + s.lcAgentCommand);
  L.push('            - {}');
  if (s.lcGitPane) {
    L.push('            - commands:');
    L.push('                - exec: git status');
  }
  if (s.lcColor) L.push('        color: ' + s.lcColor);
  return L.join('\n') + '\n';
}

function buildWarpKeybindings(s) {
  return ['---',
    '# ~/.warp/keybindings.yaml',
    '# Overrides only — Warp keeps its own default for every action not named here.',
    '"input:open_completion_suggestions": ' + WARP_DEFAULTS.kbCompletion,
    '"editor_view:insert_autosuggestion": ' + WARP_DEFAULTS.kbAutosuggest,
  ].join('\n') + '\n';
}

// The settings.toml keys this page can set, as a snippet to paste. Real key names and
// real nesting, taken from a live settings.toml — but see the note at the top of this
// file for why the installer will not write it for you.
function buildWarpSettingsSnippet(s) {
  return ['# Paste into ~/.warp/settings.toml, or set these in Warp’s own Settings UI.',
    '# Not written by the installer on purpose: Warp owns this file and rewrites it',
    '# whenever you change a setting in the app.',
    '',
    '[appearance]',
    'spacing = "' + s.spacing + '"',
    '',
    '[appearance.text]',
    'font_name = "' + s.fontName + '"',
    'font_size = ' + s.fontSize + '.0',
    '',
    '[appearance.window]',
    'override_opacity = ' + s.opacity,
    'override_blur = ' + s.blur,
    '',
    '[appearance.blocks]',
    'show_block_dividers = ' + (s.showBlockDividers ? 'true' : 'false'),
    '',
    '[appearance.panes]',
    'should_dim_inactive_panes = ' + (s.dimInactivePanes ? 'true' : 'false'),
    '',
    '[appearance.cursor]',
    'cursor_display_type = "' + s.cursorType + '"',
    '',
    '[appearance.input]',
    'input_mode = "' + s.inputMode + '"',
    '',
    '[appearance.themes]',
    'theme = "' + s.themeName + '"',
  ].join('\n') + '\n';
}

// ── the installer ───────────────────────────────────────────────────────────────
function warpApplyBlock(s, palette) {
  const theme = buildWarpTheme(s, palette);
  const launch = buildWarpLaunch(s);
  const keys = buildWarpKeybindings(s);
  return `
echo ""
echo "▸ Applying the Warp layer…"

if [ ! -d "/Applications/Warp.app" ] && ! command -v warp-cli >/dev/null 2>&1; then
  echo "  Warp does not appear to be installed. Get it with:"
  echo "    brew install --cask warp"
  echo "  Writing the files anyway — Warp will pick them up when you install it."
fi

WARP_STAMP="$(date +%Y%m%d-%H%M%S)"
WARP_DIR="$HOME/.warp"
mkdir -p "$WARP_DIR/themes" "$WARP_DIR/launch_configurations"

# 1. The theme. A new file, so nothing existing is touched — this is why the theme is the
# part the installer is happy to write.
cat > "$WARP_DIR/themes/${s.themeName}.yaml" <<'SCC_WARP_THEME'
${theme}SCC_WARP_THEME
echo "  wrote $WARP_DIR/themes/${s.themeName}.yaml"
${s.launchConfig ? `
# 2. The launch configuration. Also a new file.
cat > "$WARP_DIR/launch_configurations/${s.lcName}.yaml" <<'SCC_WARP_LAUNCH'
${launch}SCC_WARP_LAUNCH
echo "  wrote $WARP_DIR/launch_configurations/${s.lcName}.yaml"` : ''}
${s.keybindings ? `
# 3. Keybindings. This one CAN already exist and is yours, so it is backed up first.
if [ -f "$WARP_DIR/keybindings.yaml" ]; then
  cp "$WARP_DIR/keybindings.yaml" "$WARP_DIR/keybindings.yaml.backup-$WARP_STAMP"
  echo "  backed up your keybindings → keybindings.yaml.backup-$WARP_STAMP"
fi
cat > "$WARP_DIR/keybindings.yaml" <<'SCC_WARP_KEYS'
${keys}SCC_WARP_KEYS
echo "  wrote $WARP_DIR/keybindings.yaml"` : ''}

# settings.toml is deliberately NOT written. Warp owns that file, rewrites it from the
# Settings UI, and it holds notification preferences, global hotkeys and agent execution
# profiles including command allow/deny lists. Replacing it to change a font size would
# throw all of that away.
echo ""
echo "  One manual step: open Warp → Settings → Appearance → Themes and pick"
echo "  \\"${s.themeName}\\". Warp picks up new theme files without a restart."
echo "  The appearance settings to match are printed on the /warp page."`;
}

module.exports = {
  WARP_DEFAULTS, DETAILS, ANSI, PANE_COLORS, CURSOR_TYPES, INPUT_MODES, SPACINGS,
  SPLITS, AGENT_COMMANDS,
  sanitizeWarp, warpColors, buildWarpTheme, buildWarpLaunch, buildWarpKeybindings,
  buildWarpSettingsSnippet, warpApplyBlock,
};
