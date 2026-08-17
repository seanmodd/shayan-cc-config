// Moshi theming — the server half.
//
// Moshi (getmoshi.app) is the iOS/Android companion app for coding agents: it
// renders your Claude Code / Codex sessions on the phone, and its LOOK is driven by
// one theme that styles the terminal AND the whole app (the app derives its UI
// palette from the terminal colours, contrast-checked).
//
// Unlike every other page on this site there is NO host-side file to install: the
// app imports a theme via mechanisms verified in the app bundle (v3.12.3) and the
// live gallery:
//   - a deep link  moshi://theme?d=<base64 theme JSON>   (bundle regex
//     ^moshi:\/\/theme\?(?:.*&)?d=([^&\s]+); gallery pages embed exactly this)
//   - a QR code of that link (the in-app importer scans it)
//   - a clipboard string  moshi-theme:<base64 theme JSON>
//   - a plain .json file through the in-app file picker
// The base64 is the STANDARD alphabet with padding stripped — verified by decoding
// a live gallery link and re-encoding byte-identically. For the byte alphabet our
// compact JSON can emit, standard base64 never produces '+' or '/' at all (test.js
// proves this exhaustively over every 3-byte window), so the value is URL-safe as-is.
//
// The theme JSON schema, from the gallery's own files (e.g. /themes/dracula.json):
//   { "v":1, "name":"<=40 chars", "mode":"dark"|"light", "colors":{ background,
//     foreground [required]; cursor, selectionBackground, selectionForeground,
//     black..white, brightBlack..brightWhite [optional] } }
//
// The only host-side surface is behavioural: ~/.config/moshi/config.toml holds a
// single [gateway] table, and the sanctioned writer is moshi-hook's own
// `moshi-hook set` command ("Editing config.toml by hand does the same thing; this
// just saves you finding the file. Comments and other keys are preserved.") — so
// the generated script uses the CLI and never touches the file.

// Terminal colour roles, in the gallery's key order. background/foreground are
// required by the schema; the rest are optional but every gallery theme ships them.
const MOSHI_COLOR_KEYS = [
  'background', 'foreground', 'cursor',
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
  'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  'selectionBackground',
];

const MOSHI_MODES = ['dark', 'light'];

// A readable dark default (the site's house tokyo-night flavour) so the page shows
// something sane before a single picker is touched.
const MOSHI_DEFAULTS = {
  name: 'My Moshi Theme',
  mode: 'dark',
  colors: {
    background: '#1a1b26', foreground: '#c0caf5', cursor: '#c0caf5',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a',
    brightYellow: '#e0af68', brightBlue: '#7aa2f7', brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff', brightWhite: '#c0caf5',
    selectionBackground: '#33467c',
  },
  // The [gateway] behaviour keys — moshi-hook 0.2.85's complete config surface,
  // verified from the binary and `moshi-hook set`. '' for scanPorts means leave it.
  gw: {
    discovery: true, usage: true, suppressNested: false, suppressUnlocked: false,
    scanPorts: '',
  },
};

// ── the sanitizer ────────────────────────────────────────────────────────────
// A ?c= payload is a stranger's. The name reaches JSON, a URL and an SVG-adjacent
// context; colours reach JSON and style attributes; scanPorts reaches a SHELL
// command line. Everything is allowlisted.
function sanitizeMoshi(ms) {
  if (!ms || typeof ms !== 'object' || ms.on !== true) return null;
  const d = MOSHI_DEFAULTS;
  const bool = (v, fb) => (typeof v === 'boolean' ? v : fb);
  const hex = (v, fb) => {
    if (typeof v !== 'string') return fb;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      return '#' + v.slice(1).split('').map(c => c + c).join('').toLowerCase();
    }
    return fb;
  };
  const name = (() => {
    if (typeof ms.name !== 'string') return d.name;
    const t = ms.name.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return t || d.name;
  })();
  const colors = {};
  for (const k of MOSHI_COLOR_KEYS) {
    colors[k] = hex((ms.colors || {})[k], d.colors[k]);
  }
  const gwIn = (ms.gw && typeof ms.gw === 'object') ? ms.gw : {};
  const scanPorts = (() => {
    const v = gwIn.scanPorts;
    if (v === 'all' || v === 'none') return v;
    if (typeof v === 'string' && /^\d{1,5}(,\d{1,5}){0,19}$/.test(v)) {
      const ports = v.split(',').map(Number);
      if (ports.every(p => p >= 1 && p <= 65535)) return ports.join(',');
    }
    return '';
  })();
  return {
    name,
    mode: MOSHI_MODES.includes(ms.mode) ? ms.mode : d.mode,
    colors,
    gw: {
      discovery: bool(gwIn.discovery, d.gw.discovery),
      usage: bool(gwIn.usage, d.gw.usage),
      suppressNested: bool(gwIn.suppressNested, d.gw.suppressNested),
      suppressUnlocked: bool(gwIn.suppressUnlocked, d.gw.suppressUnlocked),
      scanPorts,
    },
    on: true,
  };
}

// ── the theme, in the app's own wire formats ─────────────────────────────────
function buildMoshiThemeJson(s) {
  // Compact, key order matching the gallery's files. Every byte this emits is in
  // the set proven base64-special-free by the exhaustive test.
  return JSON.stringify({ v: 1, name: s.name, mode: s.mode, colors: s.colors });
}
function moshiThemeB64(s) {
  // Standard alphabet, padding stripped — byte-identical to the gallery's encoding.
  return Buffer.from(buildMoshiThemeJson(s), 'utf8').toString('base64').replace(/=+$/, '');
}
function moshiDeepLink(s) {
  return 'moshi://theme?d=' + moshiThemeB64(s);
}
function moshiClipboard(s) {
  return 'moshi-theme:' + moshiThemeB64(s);
}

// ── the behaviour script ─────────────────────────────────────────────────────
// Emitted only for keys that differ from stock, through moshi-hook's own set
// command. scanPorts values are sanitizer-proven to be 'all', 'none' or a comma
// list of integers, so nothing shell-active can reach the command line.
function moshiGwCommands(s) {
  const g = s.gw, d = MOSHI_DEFAULTS.gw;
  const cmds = [];
  if (g.discovery !== d.discovery) cmds.push('moshi-hook set always-on-discovery ' + (g.discovery ? 'on' : 'off'));
  if (g.usage !== d.usage) cmds.push('moshi-hook set usage-collection ' + (g.usage ? 'on' : 'off'));
  if (g.suppressNested !== d.suppressNested) cmds.push('moshi-hook set suppress-nested-agent-push ' + (g.suppressNested ? 'on' : 'off'));
  if (g.suppressUnlocked !== d.suppressUnlocked) cmds.push('moshi-hook set suppress-push-while-unlocked ' + (g.suppressUnlocked ? 'on' : 'off'));
  if (g.scanPorts) cmds.push('moshi-hook set scan-ports ' + g.scanPorts);
  return cmds;
}
function moshiApplyScript(origin, s) {
  const cmds = moshiGwCommands(s);
  if (!cmds.length) return null;
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — moshi-hook gateway settings (standalone)
if ! command -v moshi-hook >/dev/null 2>&1; then
  echo "moshi-hook is not installed. Get it with:"
  echo "  brew install rjyo/moshi/moshi-hook"
  exit 1
fi
echo "▸ Applying your moshi-hook settings…"
${cmds.join('\n')}
echo ""
echo "✓ Done. Boolean changes take effect after the daemon restarts"
echo "  (moshi-hook set prints the exact hint); scan-ports applies on the next refresh."
echo "  Your theme installs on the PHONE — scan the QR at ${origin}/moshi"
`;
}

module.exports = {
  MOSHI_COLOR_KEYS, MOSHI_MODES, MOSHI_DEFAULTS,
  sanitizeMoshi, buildMoshiThemeJson, moshiThemeB64, moshiDeepLink, moshiClipboard,
  moshiGwCommands, moshiApplyScript,
};
