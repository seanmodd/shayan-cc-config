// shayan-cc-config — single stateless handler (Vercel Node function).
// Homepage, customizer studio, per-preset + custom(palette-encoded) config & installer,
// generated status-line script, the `shayan` terminal helper, and a plain-text setup list.
const DATA = require('./_data.js');
const { renderPage } = require('./_render.js');
const { renderCustomize } = require('./_customize.js');
const { expandPalette } = require('./_theme.js');
const {
  sanitizeSL, buildUMD, buildInputBox, buildStatuslineScript,
  cleanText, cleanTerm, cleanName, cleanFormat, sanePalette, clampInt,
} = require('./_term.js');
const { CLIENT_LIB, CSS, FAVICON, GH_SVG, GITHUB_URL } = require('./_render.js');

const presetById = id => DATA.presets.find(p => p.id === id);
const dark = DATA.defaultThemes.find(t => t.id === 'dark');
const light = DATA.defaultThemes.find(t => t.id === 'light');

const STATUS_COLORS = ['gray', 'orange', 'blue', 'teal', 'green', 'lavender', 'rose', 'gold', 'slate', 'cyan'];
const statusColorOf = pl => (STATUS_COLORS.includes(pl.s) ? pl.s : 'blue');
const nameOf = pl => cleanName(pl.n, 60) || 'Custom';

function buildPresetSettings(preset) {
  const themes = preset.theme
    ? [preset.theme, ...DATA.defaultThemes.filter(t => t.id !== preset.theme.id)]
    : DATA.defaultThemes;
  return {
    themes,
    thinkingVerbs: preset.thinkingVerbs,
    thinkingStyle: preset.thinkingStyle,
    userMessageDisplay: preset.userMessageDisplay,
  };
}

function decodeCustom(c) {
  let s = String(c).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return JSON.parse(Buffer.from(s, 'base64').toString('utf8'));
}

function buildCustomSettings(pl) {
  const theme = { name: nameOf(pl), id: 'custom', colors: expandPalette(sanePalette(pl.p)) };
  // Verbs and spinner phases are rendered to the victim's terminal on every frame and
  // are patched into the Claude Code bundle as string literals, so control sequences
  // (ESC, OSC, bidi) must never survive \u2014 cleanTerm strips them.
  const verbs = (Array.isArray(pl.vv) ? pl.vv : []).map(v => cleanTerm(v, 32)).filter(Boolean).slice(0, 40);
  const phases = (Array.isArray(pl.ph) ? pl.ph : []).map(v => cleanTerm(v, 4)).filter(Boolean).slice(0, 24);
  const vf = cleanFormat(pl.vf, 24, '{}\u2026 ');
  const settings = {
    themes: [theme, dark, light].filter(Boolean),
    thinkingVerbs: { format: vf, verbs: verbs.length ? verbs : ['Working'] },
    thinkingStyle: {
      reverseMirror: pl.rm !== false,
      updateInterval: clampInt(pl.iv, 40, 1000, 120),
      phases: phases.length ? phases : ['\u00b7', '\u2736', '\u2733', '\u2736', '\u273b', '\u273d'],
    },
    userMessageDisplay: buildUMD(pl),
  };
  const inputBox = buildInputBox(pl);
  if (inputBox) settings.inputBox = inputBox;
  return settings;
}

function presetApplyScript(origin, p) {
  const name = cleanName(p.name, 60);
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — apply "${name}"
ORIGIN="${origin}"
echo "▸ Applying '${name}' to Claude Code via tweakcc…"
npx -y tweakcc@latest --apply --config-url "$ORIGIN/config/${p.id}.json"
${activationBlock(p.activeThemeId, p.statuslineColor)}
echo ""
echo "✓ '${name}' applied. Start a new claude session to see it."
echo "  Switch anytime at $ORIGIN"
`;
}

function customApplyScript(origin, rawC, pl) {
  const name = nameOf(pl);
  const cfgUrl = `${origin}/config.json?c=${encodeURIComponent(rawC)}`;
  const slSan = sanitizeSL(pl.sl);
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — apply custom setup "${name}"
echo "▸ Applying your custom setup '${name}' via tweakcc…"
npx -y tweakcc@latest --apply --config-url "${cfgUrl}"
${activationBlock('custom', statusColorOf(pl))}
${slSan ? statuslineBlock(buildStatuslineScript(slSan, pl.p)) : ''}
echo ""
echo "✓ '${name}' applied. Start a new claude session to see it."
echo "  Build another at ${origin}/customize"
`;
}

function activationBlock(themeId, statusColor) {
  const color = STATUS_COLORS.includes(statusColor) ? statusColor : 'blue';
  return `echo "▸ Activating theme '${themeId}' in ~/.claude.json…"
node -e 'const fs=require("fs"),os=require("os");const f=os.homedir()+"/.claude.json";try{const j=JSON.parse(fs.readFileSync(f,"utf8"));j.theme=${JSON.stringify(themeId)};fs.writeFileSync(f,JSON.stringify(j,null,2));}catch(e){console.log("  (skipped ~/.claude.json:",e.message,")");}'
CB="$HOME/.claude/scripts/context-bar.sh"
if [ -f "$CB" ]; then
  if [ "$(uname)" = "Darwin" ]; then sed -i '' 's/^COLOR=.*/COLOR="${color}"/' "$CB";
  else sed -i 's/^COLOR=.*/COLOR="${color}"/' "$CB"; fi
  echo "▸ Status line accent → ${color}"
fi`;
}

// Install the generated status-line script and register it in ~/.claude/settings.json.
// The script body is server-generated; user-influenced values live inside it only as base64.
function statuslineBlock(script) {
  return `echo "▸ Installing your custom status line…"
mkdir -p "$HOME/.claude"
cat > "$HOME/.claude/statusline-shayan.js" <<'SHAYAN_SL_EOF'
${script}SHAYAN_SL_EOF
chmod +x "$HOME/.claude/statusline-shayan.js"
node -e 'const fs=require("fs"),os=require("os");const f=os.homedir()+"/.claude/settings.json";let j={};try{j=JSON.parse(fs.readFileSync(f,"utf8"));}catch(e){}j.statusLine={type:"command",command:os.homedir()+"/.claude/statusline-shayan.js",padding:0};fs.writeFileSync(f,JSON.stringify(j,null,2));console.log("  status line registered in ~/.claude/settings.json");'`;
}

function shayanInstaller(origin) {
  return `#!/bin/bash
# shayan-cc-config — installs the \`shayan\` command for one-word setup switching.
set -euo pipefail
BIN="$HOME/.local/bin"; mkdir -p "$BIN"
# QUOTED delimiter: the installing shell performs no expansion on the body, so the
# inner script lands verbatim. The origin is patched in afterwards rather than being
# interpolated into the heredoc, which keeps the body escaping-free.
cat > "$BIN/shayan" <<'SHAYAN_CLI_EOF'
#!/bin/bash
# shayan — pick or apply a Claude Code setup from shayan-cc-config
set -uo pipefail
BASE="__SHAYAN_ORIGIN__"
if [ -n "\${1:-}" ]; then curl -fsSL "$BASE/apply/$1.sh" | bash; exit $?; fi
echo "shayan-cc-config — choose a setup:"; echo
IDS=(); NAMES=()
while IFS=$'\\t' read -r id name; do IDS+=("$id"); NAMES+=("$name"); done < <(curl -fsSL "$BASE/list.txt")
i=1; for n in "\${NAMES[@]}"; do printf "  %2d) %s\\n" "$i" "$n"; i=$((i+1)); done
echo; printf "Number (or q to quit): "; read -r choice
[ "$choice" = "q" ] && exit 0
case "$choice" in ''|*[!0-9]*) echo "Invalid choice"; exit 1;; esac
idx=$((choice-1))
[ -n "\${IDS[$idx]:-}" ] || { echo "Invalid choice"; exit 1; }
curl -fsSL "$BASE/apply/\${IDS[$idx]}.sh" | bash
SHAYAN_CLI_EOF
node -e 'const fs=require("fs");const f=process.argv[1];fs.writeFileSync(f,fs.readFileSync(f,"utf8").split("__SHAYAN_ORIGIN__").join(${JSON.stringify(origin)}));' "$BIN/shayan"
chmod +x "$BIN/shayan"

# Ensure ~/.local/bin is on PATH in the user's shell rc.
add_path() { local rc="\$1"; [ -f "\$rc" ] || return 0; grep -q 'shayan-cc-config PATH' "\$rc" 2>/dev/null && return 0; printf '\\n# shayan-cc-config PATH\\nexport PATH="\$HOME/.local/bin:\$PATH"\\n' >> "\$rc"; }
add_path "$HOME/.zshrc"; add_path "$HOME/.bashrc"
export PATH="$HOME/.local/bin:$PATH"
echo ""
echo "✓ Installed 'shayan'. Open a new terminal (or run: export PATH=\\"\$HOME/.local/bin:\\$PATH\\")"
echo "  Then:  shayan            # interactive picker"
echo "         shayan dracula    # apply a setup directly"
`;
}

// Host/proto come from client-controllable headers and are interpolated into the
// shell scripts we hand out, so both are whitelisted before use.
const safeHost = h => (typeof h === 'string' && /^[a-z0-9.-]+(:\d{1,5})?$/i.test(h)) ? h : null;

module.exports = (req, res) => {
  const host = safeHost(req.headers['x-forwarded-host']) || safeHost(req.headers.host) || 'shayan-cc-config.vercel.app';
  const rawProto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const proto = (rawProto === 'http' || rawProto === 'https') ? rawProto : 'https';
  const origin = `${proto}://${host}`;
  const u = new URL(req.url || '/', origin);
  const path = u.pathname;

  const sendJSON = (obj, status = 200) => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('access-control-allow-origin', '*');
    res.end(JSON.stringify(obj, null, 1));
  };
  const sendText = (body, ct = 'text/plain; charset=utf-8', status = 200) => {
    res.statusCode = status;
    res.setHeader('content-type', ct);
    res.setHeader('access-control-allow-origin', '*');
    res.end(body);
  };
  const sendHTML = body => { res.statusCode = 200; res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(body); };

  if (path === '/' || path === '/index.html') return sendHTML(renderPage(DATA));
  if (path === '/customize' || path === '/customize/') {
    return sendHTML(renderCustomize(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }

  if (path === '/api/presets') return sendJSON({ presets: DATA.presets });
  if (path === '/list.txt') return sendText(DATA.presets.map(p => `${p.id}\t${p.name}`).join('\n') + '\n');
  if (path === '/shayan.sh') return sendText(shayanInstaller(origin), 'text/x-shellscript; charset=utf-8');

  // Custom (palette-encoded) config + installer + status-line script
  if (path === '/config.json') {
    const c = u.searchParams.get('c');
    if (!c) return sendJSON({ error: 'missing c param' }, 400);
    try { return sendJSON(buildCustomSettings(decodeCustom(c))); }
    catch (e) { return sendJSON({ error: 'bad custom payload: ' + e.message }, 400); }
  }
  if (path === '/apply.sh') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('echo "missing ?c= payload"; exit 1', 'text/x-shellscript; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      if (!pl || typeof pl !== 'object' || Array.isArray(pl)) throw new Error('payload must be an object');
      buildCustomSettings(pl); // fail here rather than handing out an installer that 400s mid-run
      return sendText(customApplyScript(origin, c, pl), 'text/x-shellscript; charset=utf-8');
    }
    catch (e) { return sendText(`echo "bad payload: ${cleanText(e.message, 120)}"; exit 1`, 'text/x-shellscript; charset=utf-8', 400); }
  }
  if (path === '/statusline.js') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('// missing ?c= payload', 'text/javascript; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const slSan = sanitizeSL(pl.sl);
      if (!slSan) return sendText('// this setup has no custom status line enabled', 'text/javascript; charset=utf-8', 404);
      return sendText(buildStatuslineScript(slSan, pl.p), 'text/javascript; charset=utf-8');
    } catch (e) { return sendText('// bad payload: ' + cleanText(e.message, 120), 'text/javascript; charset=utf-8', 400); }
  }

  // Preset config + installer
  let m = path.match(/^\/config\/([a-z0-9-]+)\.json$/) || path.match(/^\/api\/config\/([a-z0-9-]+)$/);
  if (m) {
    const p = presetById(m[1]);
    if (!p) return sendJSON({ error: `unknown preset: ${m[1]}` }, 404);
    return sendJSON(buildPresetSettings(p));
  }
  m = path.match(/^\/apply\/([a-z0-9-]+)\.sh$/);
  if (m) {
    const p = presetById(m[1]);
    if (!p) return sendText(`echo "unknown preset: ${m[1]}"; exit 1`, 'text/x-shellscript; charset=utf-8', 404);
    return sendText(presetApplyScript(origin, p), 'text/x-shellscript; charset=utf-8');
  }

  return sendJSON({ error: 'not found', path }, 404);
};
