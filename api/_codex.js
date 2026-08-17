// Codex CLI configuration — the server half.
//
// Codex keeps everything in ONE file: ~/.codex/config.toml ($CODEX_HOME/config.toml).
// The same file holds the user's model, MCP servers, plugins and approval policy, so
// unlike the Zellij layer this one must NEVER replace the file — it rebuilds only the
// [tui] table, key-surgically, through the Python merge in codexApplyBlock.
//
// Every key and value below was verified three ways against Codex CLI 0.147.0: the
// serde field tables inside the shipped native binary, live probes of `codex
// app-server config/read` under a throwaway CODEX_HOME, and the openai/codex source
// at tag rust-v0.147.0 — because there is no schema to validate against and no
// `codex config` subcommand to write through. Keys the binary lists but whose
// semantics could not be pinned (keymap, notifications — the latter an untagged
// serde enum that hard-errors on a wrong shape) are NOT managed here: a config this
// page writes must never be the reason codex fails to start.
//
// tui.theme is a SYNTAX-highlighting theme (a .tmTheme name), not a UI palette: the
// Codex TUI inherits the terminal's colours and the theme paints code blocks. Unset,
// codex adapts to the terminal background (catppuccin-latte on light, catppuccin-mocha
// on dark) — which is why '' here means "adaptive" and emits no line at all.

const { CODEX_SYNTAX } = require('./_codex_themes.js');

// The 27 names the /theme picker offers, in the binary's own order (a contiguous
// string table at offset 6513442). Plain 'monokai-extended' and a few bat extras also
// exist in the binary and may be accepted, but only these 27 are the documented-by-
// the-picker contract, so only these are offered and accepted here.
const CODEX_THEMES = [
  'base16', 'base16-eighties-dark', 'base16-mocha-dark', 'base16-ocean-dark',
  'base16-ocean-light', 'base16-256', 'catppuccin-frappe', 'catppuccin-latte',
  'catppuccin-macchiato', 'catppuccin-mocha', 'coldark-cold', 'coldark-dark',
  'dark-neon', 'dracula', 'github', 'gruvbox-dark', 'gruvbox-light',
  'inspired-github', 'monokai-extended-bright', 'monokai-extended-light',
  'monokai-extended-origin', 'one-half-dark', 'one-half-light', 'solarized-dark',
  'solarized-light', 'sublime-snazzy', 'zenburn',
];

// The status-line item ids, with the label the picker shows and a sample value for
// the mock — samples modelled on the example row baked into the binary
// ("gpt-5.2-codex medium", "~/my-project/subdir", "PR #123", "+12 -3", …).
const STATUS_ITEMS = [
  { id: 'model-with-reasoning', label: 'Model + effort', sample: 'gpt-5.2-codex medium' },
  { id: 'model', label: 'Model', sample: 'gpt-5.2-codex' },
  { id: 'reasoning', label: 'Reasoning effort', sample: 'medium' },
  { id: 'current-dir', label: 'Directory', sample: '~/my-project' },
  { id: 'project-name', label: 'Project', sample: 'my-project' },
  { id: 'git-branch', label: 'Git branch', sample: 'feat/awesome-feature' },
  { id: 'pull-request-number', label: 'Open PR', sample: 'PR #123' },
  { id: 'branch-changes', label: 'Branch changes', sample: '+12 -3' },
  { id: 'run-state', label: 'Run state', sample: 'Working' },
  { id: 'permissions', label: 'Permissions', sample: 'workspace' },
  { id: 'approval-mode', label: 'Approval mode', sample: 'on-request' },
  { id: 'context-remaining', label: 'Context left', sample: '47% context left' },
  { id: 'context-used', label: 'Context used', sample: '53% context used' },
  { id: 'context-window-size', label: 'Context window', sample: '272k window' },
  { id: 'used-tokens', label: 'Tokens used', sample: '18.4k used' },
  { id: 'total-input-tokens', label: 'Input tokens', sample: '15.1k in' },
  { id: 'total-output-tokens', label: 'Output tokens', sample: '3.3k out' },
  { id: 'task-progress', label: 'Task progress', sample: 'Tasks 2/5' },
  { id: 'thread-title', label: 'Thread title', sample: 'checkout fix' },
  { id: 'thread-id', label: 'Thread id', sample: '550e8400' },
  { id: 'fast-mode', label: 'Fast mode', sample: 'Fast on' },
  { id: 'codex-version', label: 'Codex version', sample: '0.147.0' },
  { id: 'five-hour-limit', label: '5-hour limit', sample: '5h 62% left' },
  { id: 'weekly-limit', label: 'Weekly limit', sample: 'weekly 71% left' },
  { id: 'daily-limit', label: 'Daily limit', sample: 'daily 84% left' },
  { id: 'monthly-limit', label: 'Monthly limit', sample: 'monthly 66% left' },
  { id: 'annual-limit', label: 'Annual limit', sample: 'annual 91% left' },
  { id: 'usage-limit', label: 'Primary limit', sample: 'primary 38% left' },
  { id: 'secondary-usage-limit', label: 'Secondary limit', sample: 'secondary 90% left' },
];

// The terminal title accepts the same ids plus two of its own — 'activity' and
// 'app-name' are in its verified default and the binary's title id table.
const TITLE_ITEMS = [
  { id: 'activity', label: 'Activity', sample: '✶' },
  { id: 'app-name', label: 'App name', sample: 'codex' },
].concat(STATUS_ITEMS);

// The 8 terminal pets, names and blurbs verbatim from the binary's pet catalog.
// Sprites are animated webp the real terminal draws over the composer; the mock shows
// a stand-in glyph and says so.
const CODEX_PETS = [
  { id: 'codex', name: 'Codex', blurb: 'The original Codex companion', glyph: '▚' },
  { id: 'dewey', name: 'Dewey', blurb: 'A tidy duck for calm workspace days', glyph: '🦆' },
  { id: 'fireball', name: 'Fireball', blurb: 'Hot path energy for fast iteration', glyph: '🔥' },
  { id: 'rocky', name: 'Rocky', blurb: 'A steady rock when the diff gets large', glyph: '🪨' },
  { id: 'seedy', name: 'Seedy', blurb: 'Small green shoots for new ideas', glyph: '🌱' },
  { id: 'stacky', name: 'Stacky', blurb: 'A balanced stack for deep work', glyph: '🥞' },
  { id: 'bsod', name: 'BSOD', blurb: 'A tiny blue-screen gremlin', glyph: '👾' },
  { id: 'null-signal', name: 'Null Signal', blurb: 'Quiet signal from the void', glyph: '📡' },
];

const PET_ANCHORS = ['composer', 'screen-bottom'];
const PICKER_VIEWS = ['dense', 'comfortable'];

// Stock codex 0.147.0, from live config/read probes: status line and title have
// effective defaults even though the keys are unset, theme adapts to the terminal,
// no pet.
// resume_cwd: '' = unset (codex prompts when the session's directory differs from the
// current one); the enum ResumeCwdMode is verified in the binary.
const RESUME_CWDS = ['', 'current', 'session'];

const CODEX_DEFAULTS = {
  theme: '',
  statusLine: ['model-with-reasoning', 'current-dir'],
  slColors: true,
  terminalTitle: ['activity', 'project-name'],
  pet: '',
  petAnchor: 'composer',
  animations: true,
  tooltips: true,
  pickerView: 'dense',
  rawOutput: false,
  resumeCwd: '',
  // The custom colour set. When on, the installer writes a real .tmTheme into
  // $CODEX_HOME/themes/ and points tui.theme at it — which is also how you recolour
  // the STATUS LINE, because status_line_use_colors takes its colours from the
  // active theme. Defaults are a readable dark set so switching Custom on shows
  // something sane before a single picker is touched.
  custom: {
    on: false,
    name: 'My Codex Colors',
    fg: '#c0caf5', com: '#565f89', kw: '#bb9af7', kw2: '#f7768e',
    str: '#9ece6a', fn: '#7aa2f7', num: '#ff9e64',
  },
};

const STATUS_IDS = STATUS_ITEMS.map(i => i.id);
const TITLE_IDS = TITLE_ITEMS.map(i => i.id);

// ── the sanitizer ────────────────────────────────────────────────────────────
// A ?c= payload is a stranger's. Everything here is enum-or-boolean by design — no
// free text from the payload ever reaches config.toml — so sanitizing is picking
// from known lists and dropping the rest.
function sanitizeCodex(cx) {
  if (!cx || typeof cx !== 'object' || cx.on !== true) return null;
  const d = CODEX_DEFAULTS;
  const pick = (v, list, fb) => (list.includes(v) ? v : fb);
  const bool = (v, fb) => (typeof v === 'boolean' ? v : fb);
  const idList = (v, valid, fb) => {
    if (!Array.isArray(v)) return fb.slice();
    const seen = [];
    for (const x of v) {
      if (valid.includes(x) && !seen.includes(x)) seen.push(x);
      if (seen.length >= 10) break;   // the real status line truncates; ten is plenty
    }
    return seen;                       // empty is legal: it clears the line/title
  };
  // The custom name reaches a FILENAME and the theme value; the colours reach an XML
  // file and style attributes. Name: strict character allowlist; colours: hex or bust.
  const hex = (v, fb) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fb);
  const name = (v, fb) => {
    if (typeof v !== 'string') return fb;
    const t = v.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return t || fb;
  };
  const cu = (cx.custom && typeof cx.custom === 'object') ? cx.custom : {};
  return {
    theme: cx.theme === '' ? '' : pick(cx.theme, CODEX_THEMES, d.theme),
    statusLine: idList(cx.statusLine, STATUS_IDS, d.statusLine),
    slColors: bool(cx.slColors, d.slColors),
    terminalTitle: idList(cx.terminalTitle, TITLE_IDS, d.terminalTitle),
    pet: cx.pet === '' ? '' : pick(cx.pet, CODEX_PETS.map(p => p.id), d.pet),
    petAnchor: pick(cx.petAnchor, PET_ANCHORS, d.petAnchor),
    animations: bool(cx.animations, d.animations),
    tooltips: bool(cx.tooltips, d.tooltips),
    pickerView: pick(cx.pickerView, PICKER_VIEWS, d.pickerView),
    rawOutput: bool(cx.rawOutput, d.rawOutput),
    resumeCwd: pick(cx.resumeCwd, RESUME_CWDS, d.resumeCwd),
    custom: {
      on: bool(cu.on, false),
      name: name(cu.name, d.custom.name),
      fg: hex(cu.fg, d.custom.fg), com: hex(cu.com, d.custom.com),
      kw: hex(cu.kw, d.custom.kw), kw2: hex(cu.kw2, d.custom.kw2),
      str: hex(cu.str, d.custom.str), fn: hex(cu.fn, d.custom.fn),
      num: hex(cu.num, d.custom.num),
    },
    on: true,
  };
}

// The identifier a custom theme is known by: the file stem. Derived from the display
// name so the two can never disagree.
function customStem(s) {
  return s.custom.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-codex-colors';
}

// A real .tmTheme (XML plist) for the custom colour set — the same format the 27
// built-ins use, covering the scopes the highlighter actually reads: comments,
// strings, keywords (storage + control), function names, numbers, plus the global
// foreground. Every value here has been through the sanitizer: the name is
// [A-Za-z0-9 _-] and the colours are #rrggbb, so no XML escaping can be needed.
function buildCodexTmTheme(s) {
  const c = s.custom;
  const stem = customStem(s);
  const rule = (label, scope, color) => `    <dict>
      <key>name</key><string>${label}</string>
      <key>scope</key><string>${scope}</string>
      <key>settings</key><dict><key>foreground</key><string>${color}</string></dict>
    </dict>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>name</key><string>${stem}</string>
  <key>settings</key>
  <array>
    <dict>
      <key>settings</key><dict><key>foreground</key><string>${c.fg}</string></dict>
    </dict>
${rule('Comments', 'comment, punctuation.definition.comment', c.com)}
${rule('Strings', 'string', c.str)}
${rule('Storage keywords', 'storage, storage.type, keyword.other', c.kw)}
${rule('Control keywords', 'keyword, keyword.control, keyword.operator', c.kw2)}
${rule('Functions', 'entity.name.function, support.function', c.fn)}
${rule('Numbers and constants', 'constant.numeric, constant.language, constant', c.num)}
  </array>
</dict>
</plist>
`;
}

// ── the generated [tui] lines ────────────────────────────────────────────────
// Returned as [key, value] pairs so the page can render keys and values in different
// colours; join with ' = ' for the real file. The preview and the installer must be
// byte-identical — test.js holds that line.
function buildCodexTomlLines(s) {
  const str = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const arr = v => '[' + v.map(str).join(', ') + ']';
  const lines = [];
  // Custom colours win: the theme value is the stem of the generated .tmTheme the
  // installer writes alongside. Otherwise '' means adaptive: codex picks
  // catppuccin-latte or -mocha from the terminal background, and writing either
  // name would pin it — so no line at all.
  if (s.custom.on) lines.push(['theme', str(customStem(s))]);
  else if (s.theme) lines.push(['theme', str(s.theme)]);
  lines.push(['status_line', arr(s.statusLine)]);
  lines.push(['status_line_use_colors', s.slColors ? 'true' : 'false']);
  lines.push(['terminal_title', arr(s.terminalTitle)]);
  if (s.pet) {
    lines.push(['pet', str(s.pet)]);
    lines.push(['pet_anchor', str(s.petAnchor)]);
  }
  lines.push(['animations', s.animations ? 'true' : 'false']);
  lines.push(['show_tooltips', s.tooltips ? 'true' : 'false']);
  lines.push(['session_picker_view', str(s.pickerView)]);
  lines.push(['raw_output_mode', s.rawOutput ? 'true' : 'false']);
  // '' = unset: codex asks which directory to resume into when they differ.
  if (s.resumeCwd) lines.push(['resume_cwd', str(s.resumeCwd)]);
  return lines;
}

// Every key this page owns — the merge drops ALL of these from an existing [tui]
// before adding the generated lines, so turning the pet (or a pinned theme) OFF here
// actually removes the key a previous run wrote.
const MANAGED_KEYS = ['theme', 'status_line', 'status_line_use_colors',
  'terminal_title', 'pet', 'pet_anchor', 'animations', 'show_tooltips',
  'session_picker_view', 'raw_output_mode', 'resume_cwd'];

// ── the installer block ──────────────────────────────────────────────────────
// Contract, same as the cmux layer: parse first and ABORT if the user's file does not
// parse; back up before touching; rebuild only [tui], preserving its unmanaged keys
// and every other byte of the file; validate the result before writing; idempotent.
function codexApplyBlock(s) {
  const lines = buildCodexTomlLines(s).map(kv => kv[0] + ' = ' + kv[1]).join('\n');
  // The custom theme file, written before the config merge so the theme value never
  // points at a file that does not exist yet. Content is fully sanitized upstream
  // (see buildCodexTmTheme) and carries no shell-active characters beyond the XML.
  const themeFile = s.custom.on ? `
CODEX_THEMES_DIR="$CODEX_DIR/themes"
mkdir -p "$CODEX_THEMES_DIR"
CODEX_THEME_FILE="$CODEX_THEMES_DIR/${customStem(s)}.tmTheme"
if [ -f "$CODEX_THEME_FILE" ]; then
  cp "$CODEX_THEME_FILE" "$CODEX_THEME_FILE.backup-$CODEX_STAMP"
fi
cat > "$CODEX_THEME_FILE" <<'SCC_CODEX_TMTHEME'
${buildCodexTmTheme(s)}SCC_CODEX_TMTHEME
echo "  wrote your colour theme → $CODEX_THEME_FILE"` : '';
  return `
echo ""
echo "▸ Applying the Codex CLI layer…"

CODEX_DIR="\${CODEX_HOME:-$HOME/.codex}"
CODEX_CFG="$CODEX_DIR/config.toml"
mkdir -p "$CODEX_DIR"
CODEX_STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -f "$CODEX_CFG" ]; then
  cp "$CODEX_CFG" "$CODEX_CFG.backup-$CODEX_STAMP"
  echo "  backed up your old config → $CODEX_CFG.backup-$CODEX_STAMP"
fi
${themeFile}
CODEX_TUI="$(mktemp)"
cat > "$CODEX_TUI" <<'SCC_CODEX_TUI'
${lines}
SCC_CODEX_TUI
# The merge needs tomllib (python 3.11+). macOS's own /usr/bin/python3 is 3.9, so
# finding A python3 is not enough — find one that can actually do the job. The
# capability check lives HERE so that when the python script exits 0 it means
# "merged", not "shrugged".
CODEX_PY=""
for CODEX_CAND in python3 python3.13 python3.12 python3.11 \
    /opt/homebrew/bin/python3 /usr/local/bin/python3; do
  if command -v "$CODEX_CAND" >/dev/null 2>&1 \
     && "$CODEX_CAND" -c 'import tomllib' >/dev/null 2>&1; then
    CODEX_PY="$CODEX_CAND"; break
  fi
done
if [ -z "$CODEX_PY" ]; then
  rm -f "$CODEX_TUI"
  echo "  ✗ the Codex layer needs python 3.11+ (for tomllib) to merge config.toml safely,"
  echo "    and none was found. Nothing was changed. Install one and rerun:"
  echo "      brew install python3"
elif "$CODEX_PY" - "$CODEX_CFG" "$CODEX_TUI" "${MANAGED_KEYS.join(',')}" <<'SCC_CODEX_PY'
import sys, io, os, re
import tomllib
path, managed_path, managed_csv = sys.argv[1], sys.argv[2], sys.argv[3]
managed_src = io.open(managed_path, encoding='utf-8').read()
tomllib.loads(managed_src)                       # our own lines must parse
managed_keys = set(managed_csv.split(','))
# newline='' or universal-newline mode flattens CRLF before the eol detection below
# ever sees it, and the file would come back rewritten in LF.
src = io.open(path, encoding='utf-8', newline='').read() if os.path.exists(path) else ''
try:
    data = tomllib.loads(src)
except Exception as e:
    print('  your config.toml does not parse (' + str(e)[:120] + ')')
    print('  refusing to guess; fix it and rerun. Nothing was changed.')
    sys.exit(1)
tui = data.get('tui', {})
if not isinstance(tui, dict):
    # [[tui]] array-of-tables. Codex itself cannot deserialize that shape, but it is
    # not this installer's place to destroy it while "fixing" it.
    print('  your config.toml defines [[tui]] as an array of tables; refusing to touch it.')
    print('  make [tui] a plain table and rerun. Nothing was changed.')
    sys.exit(1)
def bare(k):
    return k if re.fullmatch(r'[A-Za-z0-9_-]+', k) else ser(k)
def ser(v):
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, str):
        return '"' + v.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"').replace('\\n', '\\\\n').replace('\\t', '\\\\t') + '"'
    if isinstance(v, list): return '[' + ', '.join(ser(x) for x in v) + ']'
    if isinstance(v, dict): return '{ ' + ', '.join(bare(k) + ' = ' + ser(x) for k, x in v.items()) + ' }'
    raise ValueError('cannot serialize ' + type(v).__name__)
# CRLF files stay CRLF: splitlines() eats both endings, the join puts back what the
# file used.
eol = '\\r\\n' if '\\r\\n' in src else '\\n'
lines = src.splitlines()
HEADER = re.compile(r'^\\s*\\[\\[?\\s*([^]]+?)\\s*\\]?\\]\\s*(#.*)?$')
def looks_like_header(line):
    m = HEADER.match(line)
    return m.group(1).strip() if m else None
# A line that LOOKS like [tui] can sit inside a multi-line string or array, where it
# is data, not structure. The real parser is the only trustworthy judge: a header
# candidate is real only if everything before it parses as COMPLETE toml - mid-string
# or mid-array, it will not. O(n^2) over a config file is nothing.
def is_real_header(i):
    prefix = eol.join(lines[:i])
    try:
        tomllib.loads(prefix)
        return True
    except Exception:
        return False
headers = []
for i, ln in enumerate(lines):
    h = looks_like_header(ln)
    if h is not None and is_real_header(i):
        headers.append((i, h))
sub_headers = set(h for _, h in headers if h == 'tui' or h.startswith('tui.'))
kept = []
for k, v in tui.items():
    if k in managed_keys:
        continue
    if isinstance(v, dict) and ('tui.' + k) in sub_headers:
        continue
    try:
        kept.append(bare(k) + ' = ' + ser(v))
    except ValueError:
        print('  cannot carry tui.' + k + ' across the merge; leaving the file alone')
        sys.exit(1)
managed_lines = [l for l in managed_src.splitlines() if l.strip()]
new_section = ['[tui]'] + managed_lines + kept
start = end = None
for i, h in headers:
    if h == 'tui' and start is None:
        start = i
        continue
    if start is not None:
        end = i
        break
if start is not None:
    if end is None: end = len(lines)
    out = lines[:start] + new_section + lines[end:]
else:
    first_sub = None
    for i, h in headers:
        if h.startswith('tui.'):
            first_sub = i
            break
    if first_sub is not None:
        out = lines[:first_sub] + new_section + [''] + lines[first_sub:]
    else:
        out = lines + ([''] if lines and lines[-1].strip() else []) + new_section
text = eol.join(out)
if not text.endswith(eol):
    text = text + eol
try:
    round2 = tomllib.loads(text)
except Exception as e:
    print('  merge produced an invalid file (' + str(e)[:120] + '); nothing was changed')
    sys.exit(1)
# The merged parse must agree with the intent: every non-tui table identical, and
# [tui] = managed lines + kept keys. A mismatch means a boundary was misjudged -
# abort rather than write.
expect = dict(data)
merged_tui = dict(tomllib.loads(managed_src))
for k, v in tui.items():
    if k not in managed_keys and k not in merged_tui:
        merged_tui[k] = v
expect['tui'] = merged_tui
if round2 != expect:
    print('  merge verification failed (the result does not match the intent); nothing was changed')
    sys.exit(1)
io.open(path, 'w', encoding='utf-8', newline='') .write(text)
print('  merged the [tui] block into ' + path)
SCC_CODEX_PY
then
  rm -f "$CODEX_TUI"
  if command -v codex >/dev/null 2>&1; then
    echo "  restart codex to see it (the config is read at startup)."
  else
    echo "  note: codex is not on PATH here — the config is ready for when it is."
    echo "    npm install -g @openai/codex   (or: brew install codex)"
  fi
else
  # A command inside an if-condition does not trip set -e, so this message can run;
  # the trailing false re-raises the failure so the whole install exits non-zero.
  rm -f "$CODEX_TUI"
  echo "  the Codex layer did not apply — everything above it still did."
  false
fi`;
}

module.exports = {
  CODEX_THEMES, CODEX_SYNTAX, STATUS_ITEMS, TITLE_ITEMS, CODEX_PETS, PET_ANCHORS,
  PICKER_VIEWS, RESUME_CWDS, CODEX_DEFAULTS, MANAGED_KEYS,
  sanitizeCodex, buildCodexTomlLines, buildCodexTmTheme, customStem, codexApplyBlock,
};
