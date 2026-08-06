// cmux configuration — the server half.
//
// cmux keeps its settings in TWO places, and the docs are explicit about which is
// which (https://cmux.com/docs/configuration):
//
//   ~/.config/ghostty/config   terminal rendering. cmux is built on Ghostty and
//                              reads Ghostty's own config: font, sizes, theme,
//                              scrollback, the split divider colour, background
//                              opacity and blur.
//   ~/.config/cmux/cmux.json   everything cmux owns itself: the sidebar, workspace
//                              colours, pane borders, app appearance, terminal
//                              behaviour, notifications, shortcuts, actions.
//
// So a "cmux config" is a pair of files in two different formats, and this module
// builds both from one sanitized payload. Anything a stranger can put in a share
// link reaches a file on disk, so every value is validated against the published
// schema's own enums and ranges before it gets near either builder.
//
// Deliberately NOT exposed: commands, newWorkspaceCommand, actions, vault,
// agentChat, automation, ui and shortcuts. Those either execute shell commands or
// can rebind/remove the keys and UI a user needs to recover, which is not something
// a link from the internet gets to do.

const { clampInt, cleanText } = require('./_term.js');

// ── the option space, straight from cmux.schema.json ────────────────────────────
// Every enum and range here is copied from the published schema rather than
// guessed, and the defaults are the schema's stated defaults so that BEFORE is
// genuinely stock cmux.
const GHOSTTY_FONTS = ['', 'SF Mono', 'Menlo', 'Monaco', 'JetBrains Mono', 'Fira Code',
  'IBM Plex Mono', 'Cascadia Code', 'Hack', 'Source Code Pro', 'Berkeley Mono'];
// Where to actually get each font, so "not installed" is actionable rather than a
// dead end. Cask names were verified against the local Homebrew (brew info --cask);
// homepages were verified to resolve. Menlo and Monaco have no cask because they ship
// with macOS, and Berkeley Mono has none because it is a paid commercial typeface —
// saying "free download" there would be wrong.
const FONT_SOURCES = {
  'SF Mono':         { url: 'https://developer.apple.com/fonts/',                     cask: 'font-sf-mono',         cost: 'free' },
  'Menlo':           { url: '',                                                       cask: '',                     cost: 'macos' },
  'Monaco':          { url: '',                                                       cask: '',                     cost: 'macos' },
  'JetBrains Mono':  { url: 'https://www.jetbrains.com/lp/mono/',                     cask: 'font-jetbrains-mono',  cost: 'free' },
  'Fira Code':       { url: 'https://github.com/tonsky/FiraCode',                     cask: 'font-fira-code',       cost: 'free' },
  'IBM Plex Mono':   { url: 'https://github.com/IBM/plex',                            cask: 'font-ibm-plex-mono',   cost: 'free' },
  'Cascadia Code':   { url: 'https://github.com/microsoft/cascadia-code',             cask: 'font-cascadia-code',   cost: 'free' },
  'Hack':            { url: 'https://sourcefoundry.org/hack/',                        cask: 'font-hack',            cost: 'free' },
  'Source Code Pro': { url: 'https://github.com/adobe-fonts/source-code-pro',         cask: 'font-source-code-pro', cost: 'free' },
  'Berkeley Mono':   { url: 'https://berkeleygraphics.com/typefaces/berkeley-mono/',  cask: '',                     cost: 'paid' },
};

const APPEARANCES = ['system', 'light', 'dark'];
const PLACEMENTS = ['top', 'afterCurrent', 'end'];
const ALIGNMENTS = ['left', 'center', 'right'];
const BRANCH_LAYOUTS = ['vertical', 'inline'];
// Verified against the schema the installer itself points at, and against cmux
// 0.64.22's own binary. Note 'typography', not 'typographic', and there is no
// 'none' — an out-of-enum value here writes a cmux.json the app will not honour,
// and `cmux config validate` will not catch it (it checks JSONC syntax only).
const INDICATOR_STYLES = ['leftRail', 'solidFill', 'rail', 'border', 'wash', 'lift',
  'typography', 'washRail', 'blueWashColorRail'];

const CMUX_DEFAULTS = {
  // A starting-point preset: a community Ghostty theme or one of this site's own.
  // Empty means no preset, which is the stock-cmux BEFORE state.
  preset: '',
  // Ghostty side
  fontFamily: '',
  fontSize: 13,
  sidebarFontSize: 13,
  tabBarFontSize: 11,
  theme: '',
  scrollback: 10000000,
  bgOpacity: 1,
  bgBlur: 0,
  dividerFromPalette: true,
  dividerColor: '#3e4451',
  // cmux.json side
  appearance: 'system',
  minimalMode: false,
  placement: 'afterCurrent',
  titleTemplate: '',
  paneBorderFromPalette: true,
  paneBorder: '#2a3446',
  activePaneBorderFromPalette: true,
  activePaneBorder: '#7aa2f7',
  tintFromPalette: true,
  tintColor: '#000000',
  tintOpacity: 0.03,
  matchTerminalBg: false,
  indicatorStyle: 'leftRail',
  selectionFromPalette: true,
  selectionColor: '#7aa2f7',
  showScrollBar: true,
  copyOnSelect: false,
  scrollSpeed: 1,
  contentAlignment: 'center',
  sidebarHideDetails: false,
  sidebarDescription: true,
  sidebarPullRequests: true,
  sidebarGitStatus: true,
  branchLayout: 'vertical',
};

// Presets live in their own module so this one stays a pure sanitizer/builder pair.
// Required lazily inside the functions that need it, because _cmux_presets.js does not
// depend on anything here and a top-level cycle would be easy to introduce later.
function presets() { return require('./_cmux_presets.js'); }

const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
const bool = (v, dflt) => (typeof v === 'boolean' ? v : dflt);
const hex6 = (v, dflt) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : dflt);

/** A number in [lo,hi] with `step` decimal places, or the default. */
function num(v, lo, hi, dflt, places = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  const clamped = Math.max(lo, Math.min(hi, n));
  return places ? Math.round(clamped * 10 ** places) / 10 ** places : Math.round(clamped);
}

/**
 * Validate a cmux payload. Returns null when the page has cmux switched off, so
 * callers can skip the whole layer rather than write a file full of defaults.
 */
function sanitizeCmux(cm) {
  if (!cm || typeof cm !== 'object' || Array.isArray(cm)) return null;
  if (cm.on === false) return null;
  const d = CMUX_DEFAULTS;
  return {
    on: true,
    // -- Ghostty ---------------------------------------------------------------
    fontFamily: GHOSTTY_FONTS.includes(cm.fontFamily) ? cm.fontFamily : d.fontFamily,
    fontSize: num(cm.fontSize, 8, 32, d.fontSize),
    sidebarFontSize: num(cm.sidebarFontSize, 8, 24, d.sidebarFontSize),
    tabBarFontSize: num(cm.tabBarFontSize, 8, 20, d.tabBarFontSize),
    // A named Ghostty theme, or empty to leave the user's terminal theme alone.
    // Restricted to the characters a theme name can contain so it cannot smuggle
    // a newline into the config file and forge another directive.
    theme: (typeof cm.theme === 'string' && /^[A-Za-z0-9 ._+-]{0,40}$/.test(cm.theme))
      ? cm.theme.trim() : d.theme,
    // A preset id, never the preset's contents. Colours therefore come from this
    // server's own table rather than from the link, so a share link can name a look
    // but cannot invent one — it has no way to push arbitrary hex into a config file
    // through this field. An unknown id falls back to no preset.
    preset: presets().isPresetId(cm.preset) ? String(cm.preset) : '',
    scrollback: num(cm.scrollback, 1000, 100000000, d.scrollback),
    bgOpacity: num(cm.bgOpacity, 0.3, 1, d.bgOpacity, 2),
    bgBlur: num(cm.bgBlur, 0, 64, d.bgBlur),
    dividerFromPalette: bool(cm.dividerFromPalette, d.dividerFromPalette),
    dividerColor: hex6(cm.dividerColor, d.dividerColor),
    // -- cmux.json -------------------------------------------------------------
    appearance: pick(cm.appearance, APPEARANCES, d.appearance),
    minimalMode: bool(cm.minimalMode, d.minimalMode),
    placement: pick(cm.placement, PLACEMENTS, d.placement),
    // cleanText, not a hand-rolled character class: it is the sanitizer the rest of
    // the site uses and it already strips C0, DEL, C1 (which carries 8-bit OSC) and
    // bidi overrides — a window title is rendered by the OS, so an escape sequence
    // smuggled through here would be a real problem.
    titleTemplate: cleanText(cm.titleTemplate, 60),
    paneBorderFromPalette: bool(cm.paneBorderFromPalette, d.paneBorderFromPalette),
    paneBorder: hex6(cm.paneBorder, d.paneBorder),
    activePaneBorderFromPalette: bool(cm.activePaneBorderFromPalette, d.activePaneBorderFromPalette),
    activePaneBorder: hex6(cm.activePaneBorder, d.activePaneBorder),
    tintFromPalette: bool(cm.tintFromPalette, d.tintFromPalette),
    tintColor: hex6(cm.tintColor, d.tintColor),
    tintOpacity: num(cm.tintOpacity, 0, 1, d.tintOpacity, 2),
    matchTerminalBg: bool(cm.matchTerminalBg, d.matchTerminalBg),
    indicatorStyle: pick(cm.indicatorStyle, INDICATOR_STYLES, d.indicatorStyle),
    selectionFromPalette: bool(cm.selectionFromPalette, d.selectionFromPalette),
    selectionColor: hex6(cm.selectionColor, d.selectionColor),
    showScrollBar: bool(cm.showScrollBar, d.showScrollBar),
    copyOnSelect: bool(cm.copyOnSelect, d.copyOnSelect),
    scrollSpeed: num(cm.scrollSpeed, 0.25, 3, d.scrollSpeed, 2),
    contentAlignment: pick(cm.contentAlignment, ALIGNMENTS, d.contentAlignment),
    sidebarHideDetails: bool(cm.sidebarHideDetails, d.sidebarHideDetails),
    sidebarDescription: bool(cm.sidebarDescription, d.sidebarDescription),
    sidebarPullRequests: bool(cm.sidebarPullRequests, d.sidebarPullRequests),
    sidebarGitStatus: bool(cm.sidebarGitStatus, d.sidebarGitStatus),
    branchLayout: pick(cm.branchLayout, BRANCH_LAYOUTS, d.branchLayout),
  };
}

/** rgb triple -> #rrggbb, for pulling colours out of the Claude Code palette. */
function palHex(triple, fallback) {
  if (!Array.isArray(triple) || triple.length !== 3) return fallback;
  const c = triple.map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));
  return '#' + c.map(n => n.toString(16).padStart(2, '0')).join('');
}

/**
 * The colours cmux should use, resolved against the Claude Code palette.
 *
 * This is the "on top of" part: by default the pane borders, sidebar tint and
 * workspace selection take their colour from the Claude Code theme the user picked,
 * so cmux's chrome and Claude Code's output are visibly the same setup rather than
 * two unrelated colour schemes sharing a window.
 */
function resolveCmuxColors(s, palette) {
  // When a preset is active it also sets the terminal's own background and
  // foreground, so the chrome has to be derived from THAT palette — deriving it from
  // the Claude Code theme instead would draw Tokyo Night borders around a Gruvbox
  // terminal. With no preset, the Claude Code palette is the only thing we know about
  // the window and stays the source.
  const pre = s.preset ? presets().presetPalette(s.preset) : null;
  const p = pre || (palette && typeof palette === 'object' ? palette : {});
  return {
    divider: s.dividerFromPalette ? palHex(p.subtle, s.dividerColor) : s.dividerColor,
    paneBorder: s.paneBorderFromPalette ? palHex(p.subtle, s.paneBorder) : s.paneBorder,
    activePaneBorder: s.activePaneBorderFromPalette ? palHex(p.accent, s.activePaneBorder) : s.activePaneBorder,
    tint: s.tintFromPalette ? palHex(p.bg, s.tintColor) : s.tintColor,
    selection: s.selectionFromPalette ? palHex(p.accent, s.selectionColor) : s.selectionColor,
  };
}

/**
 * The colour directives a preset contributes to the Ghostty config, if any.
 *
 * Two kinds of preset, and the difference is the honest one:
 *   - a community preset names a theme Ghostty already ships, so one `theme =` line
 *     does the whole job and the user's own installed theme file is the source;
 *   - an original preset has no theme file to point at, so it writes its colours out
 *     literally — background, foreground and all sixteen ANSI slots. That is a real
 *     colour scheme rather than a reskin of somebody else's.
 *
 * `theme` is deliberately emitted BEFORE the literal colours: in Ghostty a later
 * directive wins, so a preset that sets both would have its own colours survive. Only
 * one is ever set today, but the ordering makes the intent unambiguous if that changes.
 */
function schemeLines(s) {
  const pre = s.preset ? presets().presetById(s.preset) : null;
  const out = [];
  // A named Ghostty theme: the preset's, else whatever the user typed.
  const themeName = (pre && pre.theme) || s.theme;
  if (themeName) out.push(['theme', themeName]);
  if (pre && pre.scheme) {
    const sc = pre.scheme;
    if (sc.bg) out.push(['background', sc.bg]);
    if (sc.fg) out.push(['foreground', sc.fg]);
    if (Array.isArray(sc.ansi)) {
      sc.ansi.slice(0, 16).forEach((hex, i) => {
        // The table is ours, but it is still data feeding a config file — a bad entry
        // should drop out rather than emit a malformed directive.
        if (/^#[0-9a-f]{6}$/i.test(hex)) out.push(['palette', i + '=' + hex.toLowerCase()]);
      });
    }
  }
  return out;
}

/** The managed block for ~/.config/ghostty/config, as `key = value` lines. */
function buildGhosttyLines(s, palette) {
  const c = resolveCmuxColors(s, palette);
  const out = [];
  if (s.fontFamily) out.push(['font-family', s.fontFamily]);
  out.push(['font-size', String(s.fontSize)]);
  out.push(['sidebar-font-size', String(s.sidebarFontSize)]);
  out.push(['surface-tab-bar-font-size', String(s.tabBarFontSize)]);
  out.push(...schemeLines(s));
  out.push(['scrollback-limit', String(s.scrollback)]);
  out.push(['split-divider-color', c.divider]);
  // Only emit transparency when it is actually asked for: background-opacity 1 and
  // background-blur 0 are the defaults, and writing them needlessly would override
  // a user who set them in a file we do not manage.
  if (s.bgOpacity < 1) out.push(['background-opacity', String(s.bgOpacity)]);
  if (s.bgBlur > 0) out.push(['background-blur', String(s.bgBlur)]);
  return out;
}

/** The object to deep-merge into ~/.config/cmux/cmux.json. */
function buildCmuxJson(s, palette) {
  const c = resolveCmuxColors(s, palette);
  const json = {
    // Kept at 1 per the docs: "keep schemaVersion at 1 for now. Future cmux
    // versions will use that field for upgrades."
    schemaVersion: 1,
    paneBorderColor: c.paneBorder,
    activePaneBorderColor: c.activePaneBorder,
    app: {
      appearance: s.appearance,
      minimalMode: s.minimalMode,
      newWorkspacePlacement: s.placement,
    },
    terminal: {
      showScrollBar: s.showScrollBar,
      copyOnSelect: s.copyOnSelect,
      scrollSpeed: s.scrollSpeed,
      sessionContentAlignment: s.contentAlignment,
    },
    sidebar: {
      hideAllDetails: s.sidebarHideDetails,
      showWorkspaceDescription: s.sidebarDescription,
      showPullRequests: s.sidebarPullRequests,
      watchGitStatus: s.sidebarGitStatus,
      branchLayout: s.branchLayout,
    },
    sidebarAppearance: {
      matchTerminalBackground: s.matchTerminalBg,
      tintColor: c.tint,
      tintOpacity: s.tintOpacity,
    },
    workspaceColors: {
      indicatorStyle: s.indicatorStyle,
      selectionColor: c.selection,
    },
  };
  // windowTitleTemplate defaults to '' and writing an empty string is a no-op that
  // would still overwrite whatever the user had.
  if (s.titleTemplate) json.app.windowTitleTemplate = s.titleTemplate;
  return json;
}

// ── the installer ──────────────────────────────────────────────────────────────

/**
 * The shell fragment that applies the cmux layer.
 *
 * Both files belong to the user, so neither is ever rewritten wholesale:
 *
 *  - ghostty/config is a line format, so the managed keys go inside a marked block
 *    appended at the end. Ghostty takes the last value for a key, so the block wins
 *    without deleting anything the user wrote above it, and re-running replaces just
 *    that block.
 *  - cmux.json is deep-merged key by key. The docs say the file "accepts JSON with
 *    comments and trailing commas", which json.load cannot parse, so comments and
 *    trailing commas are stripped before parsing. If it still will not parse, the
 *    script stops rather than guess — an unparseable config is the user's file to
 *    fix, not ours to replace.
 *
 * Both files are backed up before the first write of each run.
 */
function cmuxApplyBlock(s, palette) {
  const lines = buildGhosttyLines(s, palette);
  const ghosttyBlock = lines.map(([k, v]) => `${k} = ${v}`).join('\n');
  const cmuxJson = JSON.stringify(buildCmuxJson(s, palette), null, 2);
  return `
echo ""
echo "▸ Applying the cmux layer…"

CMUX_STAMP="$(date +%Y%m%d-%H%M%S)"

# ---- 1. Ghostty config (terminal rendering) --------------------------------
# Ghostty reads TWO config files on macOS, in this order:
#
#   1. $XDG_CONFIG_HOME/ghostty/config   (i.e. ~/.config/ghostty/config)
#   2. ~/Library/Application Support/com.mitchellh.ghostty/config
#
# and the second one wins, because a later directive overrides an earlier one. That
# second path is the one Ghostty's own macOS UI writes to, so it is where most people's
# real config actually lives — and writing only to ~/.config left our colours silently
# losing to it. Verified: with background set in ~/.config and a different background in
# Application Support, ghostty +show-config reports the Application Support value.
#
# So the block goes into every config Ghostty will read. Both are marker-fenced and
# backed up, so this stays idempotent and reversible either way.
GHOSTTY_XDG="\${XDG_CONFIG_HOME:-$HOME/.config}/ghostty/config"
GHOSTTY_MAC="$HOME/Library/Application Support/com.mitchellh.ghostty/config"

# The XDG one always: it is what the cmux docs point at, and it is created if absent.
mkdir -p "$(dirname "$GHOSTTY_XDG")"
[ -f "$GHOSTTY_XDG" ] || : > "$GHOSTTY_XDG"

# A plain for-loop rather than a pipe, so there is no subshell to lose state in. The
# macOS file is written ONLY if it already exists: creating one would be worse than
# leaving it alone, because Ghostty treats its presence as meaningful and a brand-new
# file there would start overriding an XDG config the user may be managing deliberately.
for GHOSTTY_CFG in "$GHOSTTY_XDG" "$GHOSTTY_MAC"; do
  [ -f "$GHOSTTY_CFG" ] || continue
  cp "$GHOSTTY_CFG" "$GHOSTTY_CFG.backup-$CMUX_STAMP" 2>/dev/null || true

python3 - "$GHOSTTY_CFG" <<'SCC_GHOSTTY_PY'
import sys
path = sys.argv[1]
START = "# >>> shayan-cc-config (cmux) >>>"
END   = "# <<< shayan-cc-config (cmux) <<<"
block = START + "\\n" + """${ghosttyBlock}""" + "\\n" + END + "\\n"
try:
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
except FileNotFoundError:
    text = ""
if START in text and END in text:
    head, rest = text.split(START, 1)
    _, tail = rest.split(END, 1)
    out = head + block + tail.lstrip("\\n")
else:
    out = text
    if out and not out.endswith("\\n"):
        out += "\\n"
    if out:
        out += "\\n"
    out += block
with open(path, "w", encoding="utf-8") as f:
    f.write(out)
print("  ghostty config  " + path)
SCC_GHOSTTY_PY

done

# ---- 2. cmux.json (everything cmux owns) -----------------------------------
CMUX_DIR="$HOME/.config/cmux"
CMUX_CFG="$CMUX_DIR/cmux.json"
mkdir -p "$CMUX_DIR"
[ -f "$CMUX_CFG" ] && cp "$CMUX_CFG" "$CMUX_CFG.backup-$CMUX_STAMP" 2>/dev/null || true

python3 - "$CMUX_CFG" <<'SCC_CMUX_PY'
import json, re, sys, os
path = sys.argv[1]
incoming = json.loads(r'''${cmuxJson}''')

def strip_jsonc(t):
    # cmux.json "accepts JSON with comments and trailing commas" per the docs, so
    # those have to come out before json.loads sees it. String-aware: a // or /*
    # inside a string literal is data, not a comment.
    out, i, n = [], 0, len(t)
    while i < n:
        ch = t[i]
        if ch == '"':
            j = i + 1
            while j < n:
                if t[j] == '\\\\':
                    j += 2
                    continue
                if t[j] == '"':
                    break
                j += 1
            out.append(t[i:j + 1]); i = j + 1; continue
        if ch == '/' and i + 1 < n and t[i + 1] == '/':
            while i < n and t[i] != '\\n':
                i += 1
            continue
        if ch == '/' and i + 1 < n and t[i + 1] == '*':
            k = t.find('*/', i + 2)
            i = n if k < 0 else k + 2
            continue
        out.append(ch); i += 1
    s = ''.join(out)
    return re.sub(r',(\\s*[}\\]])', r'\\1', s)

existing = {}
if os.path.exists(path):
    raw = open(path, encoding='utf-8').read()
    if raw.strip():
        try:
            existing = json.loads(strip_jsonc(raw))
        except Exception as e:
            print("  ! " + path + " could not be parsed (" + str(e) + ").")
            print("    Your file was left untouched; a backup of it sits beside it.")
            print("    Fix or move it, then re-run this command.")
            sys.exit(1)
        if not isinstance(existing, dict):
            print("  ! " + path + " is not a JSON object; leaving it untouched.")
            sys.exit(1)

def merge(dst, src):
    # Only the keys we manage are touched; anything else in the user's file — and
    # any sibling key inside a section we partly manage — is preserved.
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            merge(dst[k], v)
        else:
            dst[k] = v
    return dst

merged = merge(existing, incoming)
merged.setdefault("$schema", "https://raw.githubusercontent.com/manaflow-ai/cmux/main/web/data/cmux.schema.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)
    f.write("\\n")
print("  cmux.json       " + path)
SCC_CMUX_PY

# ---- 3. Tell cmux to re-read it -------------------------------------------
# Per the docs the config reloads without a restart: "edit the file, then use
# Cmd+Shift+, or cmux reload-config".
if command -v cmux >/dev/null 2>&1; then
  cmux reload-config >/dev/null 2>&1 && echo "  reloaded via: cmux reload-config" \\
    || echo "  press Cmd+Shift+, in cmux to reload"
else
  echo "  press Cmd+Shift+, in cmux to reload (the cmux CLI is not on PATH)"
fi
`;
}

module.exports = {
  FONT_SOURCES,
  schemeLines,
  sanitizeCmux,
  buildGhosttyLines,
  buildCmuxJson,
  resolveCmuxColors,
  cmuxApplyBlock,
  CMUX_DEFAULTS,
  GHOSTTY_FONTS,
  APPEARANCES,
  PLACEMENTS,
  ALIGNMENTS,
  BRANCH_LAYOUTS,
  INDICATOR_STYLES,
};
