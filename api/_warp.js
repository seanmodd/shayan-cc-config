// Warp configuration — the server half.
//
// Warp spreads its configuration across several places in ~/.warp, and they are NOT
// equal in how safe they are to write:
//
//   ~/.warp/themes/<name>.yaml       a theme. ADDITIVE — a new file, nothing else
//                                    touched. Safe to write.
//   ~/.warp/tab_configs/<name>.toml  a saved pane layout. Also ADDITIVE, and the current
//                                    format: Warp has deprecated launch_configurations
//                                    in favour of these, so nothing here writes the old
//                                    directory.
//   ~/.warp/keybindings.yaml         overrides only; Warp keeps its defaults for anything
//                                    absent. Small, user-owned, may already exist.
//   ~/.warp/settings.toml            everything the Settings UI writes — one file, 200-odd
//                                    keys, hot-reloading and bidirectional with the GUI.
//
// Schemas here came from a real Warp install on 2026-08-06 — the files it had already
// written, plus its own bundled contract at
// /Applications/Warp.app/Contents/Resources/settings_schema.json. That schema is what the
// app validates against, which matters because a wrong enum value does not error: Warp
// falls back to the default and shows a dismissible banner.
//
// WHY settings.toml IS NOT WRITTEN. Not because editing it is wrong — it is explicitly
// designed to be hand-edited, hot-reloads on save, and is meant to live in a dotfiles
// repo. The problem is REPLACING it. It is one file that also holds notification
// preferences, global hotkeys and agent execution profiles including command allow and
// deny lists, so overwriting it to change a font size would take all of that with it.
// A surgical merge would need a TOML writer, which the Python available in the installer
// does not have (tomllib reads only). So the page generates the keys as a snippet to
// paste — real key names, your values — and the installer leaves the file alone.

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
  themeName: 'My Warp Theme',
  fromPalette: true,          // derive the theme from the built-in base palette
  background: '#1a1b26',
  foreground: '#c0caf5',
  accent: '#7aa2f7',
  details: 'darker',
  // launch configuration
  launchConfig: true,
  lcName: 'agent_dev',
  lcTitle: 'My Warp Theme',
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
  spacing: 'normal',
  inputBoxType: 'classic',
  opacity: 100,
  blur: 0,
  showBlockDividers: true,
  dimInactivePanes: true,
};

// Only values seen written by Warp itself. Anything not on these lists would be a guess,
// and an out-of-enum value in settings.toml is exactly the kind of thing that fails
// quietly.
// Read out of Warp's own bundled contract at
// /Applications/Warp.app/Contents/Resources/settings_schema.json, which is the exact
// schema the app validates against — not from the docs, and not guessed. An earlier
// version of this file offered spacing values ("standard", "comfortable") and an
// input_mode value ("classic") that do not exist; Warp falls back to the default and
// shows a banner rather than telling you the value was nonsense, so a wrong enum here
// is close to invisible.
const CURSOR_TYPES = ['bar', 'block', 'underline'];
const INPUT_MODES = ['pinned_to_bottom', 'pinned_to_top', 'waterfall'];
const SPACINGS = ['normal', 'compact'];
// terminal.input.input_box_type_setting — a DIFFERENT setting from input_mode, and the
// one people actually mean by "classic".
const INPUT_BOX_TYPES = ['universal', 'classic'];
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
    inputBoxType: pick(wp.inputBoxType, INPUT_BOX_TYPES, d.inputBoxType),
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
// A TAB CONFIG, not a launch configuration. Warp deprecated launch configurations in
// favour of these: "Existing Launch Configurations continue to work, but new features
// are not being added. For new setups, use Tab Configs." Tab configs also have the
// things launch configs lack — agent panes, per-pane shell, and parameters.
//
// Two constraints shape what is emitted:
//
//  1. The pane structs use serde's deny_unknown_fields, so an unrecognised key is a HARD
//     parse error rather than a shrug. Only the documented keys appear below.
//  2. `commands` run sequentially and each waits for the last, so a long-running or
//     interactive command never returns and anything after it never runs. Each pane
//     therefore gets at most one command, and the agent is alone in its pane.
//
// `directory` is omitted so the panes open wherever you open the tab from, rather than
// baking in a path belonging to whoever generated the link. (Unlike a launch config's
// `cwd`, which had to be absolute or the file would not show up at all, `directory` is
// genuinely optional here.)
function buildWarpTabConfig(s) {
  const L = [];
  L.push('# ~/.warp/tab_configs/' + s.lcName + '.toml');
  L.push('# Opens from the + menu, or: open "warp://tab_config/' + s.lcName + '"');
  L.push('# Docs: https://docs.warp.dev/terminal/sessions/tab-configs');
  L.push('name = "' + s.lcTitle + '"');
  L.push('title = "' + s.lcTitle + '"');
  if (s.lcColor) L.push('color = "' + s.lcColor + '"');
  L.push('');
  // The first [[panes]] entry is the root. A node with split+children is a split;
  // anything else is a leaf.
  L.push('# The first entry is the root of the layout.');
  L.push('[[panes]]');
  L.push('id = "root"');
  L.push('split = "' + s.lcSplit + '"');
  L.push('children = ["agent", ' + (s.lcGitPane ? '"side"' : '"shell"') + ']');
  L.push('');
  L.push('[[panes]]');
  L.push('id = "agent"');
  L.push('type = "terminal"');
  L.push('commands = ["' + s.lcAgentCommand + '"]');
  L.push('is_focused = true');
  if (s.lcGitPane) {
    L.push('');
    L.push('[[panes]]');
    L.push('id = "side"');
    L.push('split = "' + (s.lcSplit === 'horizontal' ? 'vertical' : 'horizontal') + '"');
    L.push('children = ["shell", "git"]');
  }
  L.push('');
  L.push('[[panes]]');
  L.push('id = "shell"');
  L.push('type = "terminal"');
  if (s.lcGitPane) {
    L.push('');
    L.push('[[panes]]');
    L.push('id = "git"');
    L.push('type = "terminal"');
    L.push('commands = ["git status"]');
  }
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
    '[terminal.input]',
    'input_box_type_setting = "' + s.inputBoxType + '"',
    '',
    '# A CUSTOM theme is not a bare string — that form is only for Warp’s built-ins.',
    '# It is a table naming the theme and the file, and both are required.',
    '[appearance.themes]',
    'theme = { custom = { name = "' + s.themeName + '", '
      + 'path = "~/.warp/themes/' + s.themeName + '.yaml" } }',
  ].join('\n') + '\n';
}

// ── the installer ───────────────────────────────────────────────────────────────
function warpApplyBlock(s, palette) {
  const theme = buildWarpTheme(s, palette);
  const tabcfg = buildWarpTabConfig(s);
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
mkdir -p "$WARP_DIR/themes" "$WARP_DIR/tab_configs"

# 1. The theme. A new file, so nothing existing is touched — this is why the theme is the
# part the installer is happy to write.
cat > "$WARP_DIR/themes/${s.themeName}.yaml" <<'SCC_WARP_THEME'
${theme}SCC_WARP_THEME
echo "  wrote $WARP_DIR/themes/${s.themeName}.yaml"
${s.launchConfig ? `
# 2. The tab config. Also a new file. Tab configs replaced launch configurations; the
# old directory is left alone entirely.
cat > "$WARP_DIR/tab_configs/${s.lcName}.toml" <<'SCC_WARP_TABCFG'
${tabcfg}SCC_WARP_TABCFG
echo "  wrote $WARP_DIR/tab_configs/${s.lcName}.toml"` : ''}
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
  SPLITS, AGENT_COMMANDS, INPUT_BOX_TYPES,
  sanitizeWarp, warpColors, buildWarpTheme, buildWarpTabConfig, buildWarpKeybindings,
  buildWarpSettingsSnippet, warpApplyBlock,
};
