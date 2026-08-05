// shayan-cc-config — single stateless handler (Vercel Node function).
// Homepage, customizer, per-preset + custom(palette-encoded) config & installer,
// the `shayan` terminal helper, and a plain-text setup list.
const DATA = require('./_data.js');
const { renderPage, renderCustomize } = require('./_render.js');
const { expandPalette } = require('./_theme.js');

const presetById = id => DATA.presets.find(p => p.id === id);
const dark = DATA.defaultThemes.find(t => t.id === 'dark');
const light = DATA.defaultThemes.find(t => t.id === 'light');

const DEFAULT_UMD = {
  format: ' > {} ', styling: [], foregroundColor: 'default', backgroundColor: null,
  borderStyle: 'none', borderColor: 'rgb(255,255,255)', paddingX: 0, paddingY: 0, fitBoxToContent: false,
};

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
  const theme = { name: pl.n || 'Custom', id: 'custom', colors: expandPalette(pl.p) };
  const hasB = pl.ub && pl.ub !== 'none';
  const umd = hasB
    ? { ...DEFAULT_UMD, format: ' {} ', borderStyle: pl.ub, borderColor: pl.uc || 'rgb(122,162,247)', paddingX: 1, fitBoxToContent: true }
    : { ...DEFAULT_UMD };
  return {
    themes: [theme, dark, light].filter(Boolean),
    thinkingVerbs: { format: pl.vf || '{}\u2026 ', verbs: (pl.vv && pl.vv.length ? pl.vv : ['Working']) },
    thinkingStyle: { reverseMirror: pl.rm !== false, updateInterval: 120, phases: (pl.ph && pl.ph.length ? pl.ph : ['\u00b7', '\u2736', '\u2733', '\u2736', '\u273b', '\u273d']) },
    userMessageDisplay: umd,
  };
}

function presetApplyScript(origin, p) {
  const name = p.name.replace(/'/g, '');
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
  const name = String(pl.n || 'Custom').replace(/'/g, '');
  const cfgUrl = `${origin}/config.json?c=${encodeURIComponent(rawC)}`;
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — apply custom setup "${name}"
echo "▸ Applying your custom setup '${name}' via tweakcc…"
npx -y tweakcc@latest --apply --config-url "${cfgUrl}"
${activationBlock('custom', pl.s || 'blue')}
echo ""
echo "✓ '${name}' applied. Start a new claude session to see it."
echo "  Build another at ${origin}/customize"
`;
}

function activationBlock(themeId, statusColor) {
  return `echo "▸ Activating theme '${themeId}' in ~/.claude.json…"
node -e 'const fs=require("fs"),os=require("os");const f=os.homedir()+"/.claude.json";try{const j=JSON.parse(fs.readFileSync(f,"utf8"));j.theme=${JSON.stringify(themeId)};fs.writeFileSync(f,JSON.stringify(j,null,2));}catch(e){console.log("  (skipped ~/.claude.json:",e.message,")");}'
CB="$HOME/.claude/scripts/context-bar.sh"
if [ -f "$CB" ]; then
  if [ "$(uname)" = "Darwin" ]; then sed -i '' 's/^COLOR=.*/COLOR="${statusColor}"/' "$CB";
  else sed -i 's/^COLOR=.*/COLOR="${statusColor}"/' "$CB"; fi
  echo "▸ Status line accent → ${statusColor}"
fi`;
}

function shayanInstaller(origin) {
  return `#!/bin/bash
# shayan-cc-config — installs the \`shayan\` command for one-word setup switching.
set -euo pipefail
ORIGIN="${origin}"
BIN="$HOME/.local/bin"; mkdir -p "$BIN"
cat > "$BIN/shayan" <<SHAYAN
#!/bin/bash
# shayan — pick or apply a Claude Code setup from shayan-cc-config
BASE="${origin}"
if [ -n "\\\${1:-}" ]; then curl -fsSL "\\\$BASE/apply/\\\$1.sh" | bash; exit \\\$?; fi
echo "shayan-cc-config — choose a setup:"; echo
IDS=(); NAMES=()
while IFS=\$'\\t' read -r id name; do IDS+=("\\\$id"); NAMES+=("\\\$name"); done < <(curl -fsSL "\\\$BASE/list.txt")
i=1; for n in "\\\${NAMES[@]}"; do printf "  %2d) %s\\n" "\\\$i" "\\\$n"; i=\$((i+1)); done
echo; printf "Number (or q to quit): "; read -r choice
[ "\\\$choice" = "q" ] && exit 0
idx=\$((choice-1))
[ "\\\$idx" -ge 0 ] 2>/dev/null && [ -n "\\\${IDS[\\\$idx]:-}" ] || { echo "Invalid choice"; exit 1; }
curl -fsSL "\\\$BASE/apply/\\\${IDS[\\\$idx]}.sh" | bash
SHAYAN
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

module.exports = (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
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
  if (path === '/customize' || path === '/customize/') return sendHTML(renderCustomize(DATA));

  if (path === '/api/presets') return sendJSON({ presets: DATA.presets });
  if (path === '/list.txt') return sendText(DATA.presets.map(p => `${p.id}\t${p.name}`).join('\n') + '\n');
  if (path === '/shayan.sh') return sendText(shayanInstaller(origin), 'text/x-shellscript; charset=utf-8');

  // Custom (palette-encoded) config + installer
  if (path === '/config.json') {
    const c = u.searchParams.get('c');
    if (!c) return sendJSON({ error: 'missing c param' }, 400);
    try { return sendJSON(buildCustomSettings(decodeCustom(c))); }
    catch (e) { return sendJSON({ error: 'bad custom payload: ' + e.message }, 400); }
  }
  if (path === '/apply.sh') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('echo "missing ?c= payload"; exit 1', 'text/x-shellscript; charset=utf-8', 400);
    try { return sendText(customApplyScript(origin, c, decodeCustom(c)), 'text/x-shellscript; charset=utf-8'); }
    catch (e) { return sendText(`echo "bad payload: ${String(e.message).replace(/"/g, '')}"; exit 1`, 'text/x-shellscript; charset=utf-8', 400); }
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
