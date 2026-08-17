// shayan-cc-config — single stateless handler (Vercel Node function).
// Homepage, customizer studio, per-preset + custom(palette-encoded) config & installer,
// generated status-line script, the `shayan` terminal helper, and a plain-text setup list.
const DATA = require('./_data.js');
const { renderPage } = require('./_render.js');
const { renderCustomize } = require('./_customize.js');
const { expandPalette } = require('./_theme.js');
const { sanitizeCmux, buildGhosttyLines, buildCmuxJson, cmuxApplyBlock } = require('./_cmux.js');
const { renderCmux } = require('./_cmux_page.js');
const { sanitizeHerdr, buildHerdrToml, herdrApplyBlock } = require('./_herdr.js');
const { renderHerdr } = require('./_herdr_page.js');
const { sanitizeZellij, buildZellijKdl, buildAgentLayout, zellijApplyBlock } = require('./_zellij.js');
const { renderZellij } = require('./_zellij_page.js');
const { sanitizeWarp, buildWarpTheme, buildWarpTabConfig, buildWarpSettingsSnippet, warpApplyBlock } = require('./_warp.js');
const { renderWarp } = require('./_warp_page.js');
const { sanitizeCodex, buildCodexTomlLines, buildCodexRootLines, buildCodexTmTheme, customStem, codexApplyBlock } = require('./_codex.js');
const { sanitizeMoshi, buildMoshiThemeJson, moshiDeepLink, moshiClipboard, moshiApplyScript } = require('./_moshi.js');
const { renderMoshi } = require('./_moshi_page.js');
const { renderCodex } = require('./_codex_page.js');
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

// tweakcc locates Claude Code by looking for `claude` on PATH. Inside cmux, some
// VS Code tasks and other agent harnesses, the first `claude` on PATH is a tiny
// wrapper shim in a temp directory; tweakcc reads the shim, sees a text file with
// no version string in it, and stops with "No VERSION strings found in JS file".
// So resolve the real installation here and put it first on PATH. Emitted into
// both installers, because either one hits the same wall.
function claudePathBlock() {
  return `# --- locate the real Claude Code (not a wrapper shim) -----------------------
CC_REAL=""
_scc_is_shim() {
  case "$1" in
    *-shims/*|*cmux*|/tmp/*|/private/var/folders/*|/var/folders/*) return 0 ;;
    *) return 1 ;;
  esac
}
for _c in "$HOME/.local/bin/claude" "$HOME/.claude/local/claude"; do
  if [ -e "$_c" ]; then CC_REAL="$_c"; break; fi
done
if [ -z "$CC_REAL" ]; then
  _root="$(npm root -g 2>/dev/null || true)"
  if [ -n "$_root" ] && [ -f "$_root/@anthropic-ai/claude-code/cli.js" ]; then
    CC_REAL="$_root/@anthropic-ai/claude-code/cli.js"
  fi
fi
if [ -z "$CC_REAL" ]; then
  _p="$(command -v claude 2>/dev/null || true)"
  if [ -n "$_p" ] && ! _scc_is_shim "$_p"; then CC_REAL="$_p"; fi
fi
SCC_TMPBIN=""
if [ -n "$CC_REAL" ]; then
  SCC_TMPBIN="$(mktemp -d)"
  ln -sf "$CC_REAL" "$SCC_TMPBIN/claude"
  PATH="$SCC_TMPBIN:$PATH"
  export PATH
  echo "  Claude Code: $CC_REAL"
else
  echo "  note: no Claude Code install found in the usual places — letting tweakcc look"
fi
_scc_cleanup() { if [ -n "\${SCC_TMPBIN:-}" ]; then rm -rf "$SCC_TMPBIN"; fi; }
trap _scc_cleanup EXIT
`;
}

function presetApplyScript(origin, p) {
  const name = cleanName(p.name, 60);
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — apply "${name}"
ORIGIN="${origin}"
echo "▸ Applying '${name}' to Claude Code via tweakcc…"
${claudePathBlock()}
npx -y tweakcc@latest --apply --yes --config-url "$ORIGIN/config/${p.id}.json"
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
  // The cmux layer rides along in the same payload, so one pasted command sets up
  // Claude Code AND the terminal it runs in. Absent or off, nothing is emitted.
  const cmSan = sanitizeCmux(pl.cm);
  const hdSan = sanitizeHerdr(pl.hd);
  const zjSan = sanitizeZellij(pl.zj);
  const wpSan = sanitizeWarp(pl.wp);
  const cxSan = sanitizeCodex(pl.cx);
  // Each terminal layer is independent and additive: a payload can carry none, one, or
  // both, and the summary line names whichever actually ran.
  const layers = ['Claude Code'].concat(cmSan ? ['cmux'] : [])
    .concat(cxSan ? ['Codex CLI'] : [])
    .concat(hdSan ? ['herdr'] : []).concat(zjSan ? ['Zellij'] : [])
    .concat(wpSan ? ['Warp'] : []);
  return `#!/bin/bash
set -euo pipefail
# shayan-cc-config — apply custom setup "${name}"
echo "▸ Applying your custom setup '${name}' via tweakcc…"
${claudePathBlock()}
npx -y tweakcc@latest --apply --yes --config-url "${cfgUrl}"
${activationBlock('custom', statusColorOf(pl))}
${slSan ? statuslineBlock(buildStatuslineScript(slSan, pl.p)) : ''}
${cmSan ? cmuxApplyBlock(cmSan, pl.p) : ''}
${hdSan ? herdrApplyBlock(hdSan) : ''}
${zjSan ? zellijApplyBlock(zjSan) : ''}
${wpSan ? warpApplyBlock(wpSan, pl.p) : ''}
${cxSan ? codexApplyBlock(cxSan) : ''}
echo ""
echo "✓ '${name}' applied — ${layers.join(' + ')}. Start a new claude session to see it."
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
set -eu
ORIGIN="${origin}"
BIN="$HOME/.local/bin"; mkdir -p "$BIN"
# Two heredocs, so the body needs no escaping and the install needs nothing but
# bash + curl: the first is UNQUOTED purely to expand $ORIGIN (already whitelisted
# server-side), the second is QUOTED so the shell touches nothing in the script.
cat > "$BIN/shayan" <<SHAYAN_CLI_HEAD
#!/bin/bash
# shayan — pick or apply a Claude Code setup from shayan-cc-config
set -u
BASE="$ORIGIN"
SHAYAN_CLI_HEAD
cat >> "$BIN/shayan" <<'SHAYAN_CLI_BODY'
if [ -n "\${1:-}" ]; then curl -fsSL "$BASE/apply/$1.sh" | bash; exit $?; fi
echo "shayan-cc-config — choose a setup:"; echo
IDS=(); NAMES=()
while IFS=$'\\t' read -r id name; do IDS+=("$id"); NAMES+=("$name"); done < <(curl -fsSL "$BASE/list.txt" || true)
# bash 3.2 (macOS) treats an empty array's [@] as unset under set -u, so count first.
if [ "\${#IDS[@]}" -eq 0 ]; then echo "Could not reach $BASE — check your connection."; exit 1; fi
i=1; for n in "\${NAMES[@]}"; do printf "  %2d) %s\\n" "$i" "$n"; i=$((i+1)); done
echo; printf "Number (or q to quit): "; read -r choice
[ "$choice" = "q" ] && exit 0
# Reject non-digits, then strip leading zeros so 010 is not read as octal 8.
case "$choice" in ''|*[!0-9]*) echo "Invalid choice"; exit 1;; esac
choice="$(printf '%s' "$choice" | sed 's/^0*//')"
[ -n "$choice" ] || { echo "Invalid choice"; exit 1; }
idx=$((choice-1))
[ "$idx" -ge 0 ] && [ "$idx" -lt "\${#IDS[@]}" ] || { echo "Invalid choice"; exit 1; }
curl -fsSL "$BASE/apply/\${IDS[$idx]}.sh" | bash
SHAYAN_CLI_BODY
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
// shell scripts we hand out, so both are whitelisted before use. Underscores and
// bracketed IPv6 literals are allowed so self-hosting on either still works; the
// port must be a real port, since new URL() throws above 65535.
function safeHost(h) {
  if (typeof h !== 'string' || h.length > 260) return null;
  const m = /^(\[[0-9a-f:.]{2,45}\]|[a-z0-9._-]+)(?::(\d{1,5}))?$/i.exec(h);
  if (!m) return null;
  if (m[2] !== undefined) { const p = +m[2]; if (!p || p > 65535) return null; }
  return h;
}

module.exports = (req, res) => {
  try { return route(req, res); }
  catch (e) {
    // A malformed request must never take the process down.
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'request failed', detail: cleanText(e && e.message, 120) }));
  }
};

function route(req, res) {
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
    try {
      const pl = decodeCustom(c);
      // Same guard as /apply.sh, so a payload is never accepted by one route and
      // rejected by the other.
      if (!pl || typeof pl !== 'object' || Array.isArray(pl)) throw new Error('payload must be an object');
      return sendJSON(buildCustomSettings(pl));
    }
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
  if (path === '/cmux' || path === '/cmux/') {
    return sendHTML(renderCmux(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  if (path === '/herdr' || path === '/herdr/') {
    return sendHTML(renderHerdr(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  if (path === '/zellij' || path === '/zellij/') {
    return sendHTML(renderZellij(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  if (path === '/warp' || path === '/warp/') {
    return sendHTML(renderWarp(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  if (path === '/codex' || path === '/codex/') {
    return sendHTML(renderCodex(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  if (path === '/moshi' || path === '/moshi/') {
    return sendHTML(renderMoshi(DATA, CSS, CLIENT_LIB, FAVICON, GH_SVG, GITHUB_URL));
  }
  // Moshi has no host-side theme file: the app imports the theme itself. These routes
  // hand the theme over in the app's own wire formats (all verified against the app
  // bundle and the live gallery — see _moshi.js).
  if (path === '/moshi-theme.json') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const ms = sanitizeMoshi(decodeCustom(c).ms);
      if (!ms) return sendText('this link has no Moshi theme in it', 'text/plain; charset=utf-8', 404);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      // The filename lands in the phone's Files app; the name is sanitizer-restricted
      // to [A-Za-z0-9 _-] so it is header-safe as-is.
      res.setHeader('Content-Disposition', 'attachment; filename="' + ms.name.replace(/ /g, '-') + '.moshi-theme.json"');
      return res.end(buildMoshiThemeJson(ms));
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  if (path === '/moshi-qr.svg') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const ms = sanitizeMoshi(decodeCustom(c).ms);
      if (!ms) return sendText('this link has no Moshi theme in it', 'text/plain; charset=utf-8', 404);
      const { qrSvg } = require('./_qr.js');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(qrSvg(moshiDeepLink(ms), { dark: '#111318', light: '#ffffff', scale: 8 }));
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  if (path === '/moshi-apply.sh') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('echo "missing ?c= payload"; exit 1', 'text/x-shellscript; charset=utf-8', 400);
    try {
      const ms = sanitizeMoshi(decodeCustom(c).ms);
      if (!ms) return sendText('echo "this link has no Moshi layer enabled"; exit 1', 'text/x-shellscript; charset=utf-8', 404);
      const body = moshiApplyScript(origin, ms)
        || '#!/bin/bash\necho "Nothing to change: every moshi-hook setting in this link is stock."\necho "The theme itself installs on the phone — see ' + origin + '/moshi"\n';
      return sendText(body, 'text/x-shellscript; charset=utf-8');
    } catch (e) { return sendText(`echo "bad payload: ${cleanText(e.message, 120)}"; exit 1`, 'text/x-shellscript; charset=utf-8', 400); }
  }
  // Standalone per-terminal installers. Every terminal page is its own editor now —
  // fully separated from the Claude Code side — so each page's command applies its
  // layer and nothing else. (A studio payload carrying these layers still applies
  // them through the combined /apply.sh; these routes are the pages' own.)
  const STANDALONE = {
    '/cmux-apply.sh': { key: 'cm', label: 'cmux', page: '/cmux',
      block: pl => { const s = sanitizeCmux(pl.cm); return s && cmuxApplyBlock(s, pl.p || null); },
      done: 'Reload cmux with Cmd+Shift+, (or run: cmux reload-config).' },
    '/herdr-apply.sh': { key: 'hd', label: 'herdr', page: '/herdr',
      block: pl => { const s = sanitizeHerdr(pl.hd); return s && herdrApplyBlock(s); },
      done: 'Restart herdr to see it.' },
    '/zellij-apply.sh': { key: 'zj', label: 'Zellij', page: '/zellij',
      block: pl => { const s = sanitizeZellij(pl.zj); return s && zellijApplyBlock(s); },
      done: 'Start a new Zellij session to see it.' },
    '/warp-apply.sh': { key: 'wp', label: 'Warp', page: '/warp',
      block: pl => { const s = sanitizeWarp(pl.wp); return s && warpApplyBlock(s, pl.p || null); },
      done: 'Open Warp settings > Appearance > Themes to activate it.' },
  };
  if (STANDALONE[path]) {
    const t = STANDALONE[path];
    const c = u.searchParams.get('c');
    if (!c) return sendText('echo "missing ?c= payload"; exit 1', 'text/x-shellscript; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const block = t.block(pl);
      if (!block) return sendText(`echo "this link has no ${t.label} layer enabled"; exit 1`, 'text/x-shellscript; charset=utf-8', 404);
      const body = `#!/bin/bash
set -euo pipefail
# shayan-cc-config — ${t.label} setup (standalone)
echo "▸ Applying your ${t.label} setup…"
${block}
echo ""
echo "✓ ${t.label} configured. ${t.done}"
echo "  Adjust anytime at ${origin}${t.page}"
`;
      return sendText(body, 'text/x-shellscript; charset=utf-8');
    } catch (e) { return sendText(`echo "bad payload: ${cleanText(e.message, 120)}"; exit 1`, 'text/x-shellscript; charset=utf-8', 400); }
  }
  // The standalone Codex installer: ONLY the codex layer. The /codex page is not a
  // recipe page — codex and Claude Code are separate agents — so its command applies
  // codex and nothing else. (A studio payload carrying a cx layer still applies it
  // through the combined /apply.sh; this route is the page's own.)
  if (path === '/codex-apply.sh') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('echo "missing ?c= payload"; exit 1', 'text/x-shellscript; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const cxSan = sanitizeCodex(pl.cx);
      if (!cxSan) return sendText('echo "this link has no Codex layer enabled"; exit 1', 'text/x-shellscript; charset=utf-8', 404);
      const body = `#!/bin/bash
set -euo pipefail
# shayan-cc-config — Codex CLI setup (standalone)
echo "▸ Applying your Codex CLI setup…"
${codexApplyBlock(cxSan)}
echo ""
echo "✓ Codex CLI configured. Start a new codex session to see it."
echo "  Adjust anytime at ${origin}/codex"
`;
      return sendText(body, 'text/x-shellscript; charset=utf-8');
    } catch (e) { return sendText(`echo "bad payload: ${cleanText(e.message, 120)}"; exit 1`, 'text/x-shellscript; charset=utf-8', 400); }
  }
  // The [tui] block the Codex layer merges, verbatim. The page fetches this rather than
  // building TOML in the browser — one builder, so the preview cannot drift from what
  // the installer actually writes.
  if (path === '/codex-files.txt') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const cxSan = sanitizeCodex(pl.cx);
      if (!cxSan) return sendText('this setup has no Codex layer enabled', 'text/plain; charset=utf-8', 404);
      const lines = buildCodexTomlLines(cxSan).map(([k, v]) => `${k} = ${v}`).join('\n');
      const rootLines = buildCodexRootLines(cxSan).map(([k, v]) => `${k} = ${v}`).join('\n');
      const body = lines + '\n'
        + (rootLines ? '@@ROOT@@' + rootLines + '\n' : '')
        + (cxSan.custom.on ? '@@TMTHEME@@' + customStem(cxSan) + '.tmTheme@@' + buildCodexTmTheme(cxSan) : '');
      return sendText(body, 'text/plain; charset=utf-8');
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  // The theme, the launch configuration, and the settings snippet the installer will NOT
  // write. Split on a marker so the page makes one request; built here so there is one
  // YAML builder rather than a second one in the browser that can drift.
  if (path === '/warp-files.txt') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const wpSan = sanitizeWarp(pl.wp);
      if (!wpSan) return sendText('this setup has no Warp layer enabled', 'text/plain; charset=utf-8', 404);
      const body = buildWarpTheme(wpSan, pl.p)
        + '@@SPLIT@@' + (wpSan.launchConfig ? buildWarpTabConfig(wpSan) : '')
        + '@@SPLIT@@' + buildWarpSettingsSnippet(wpSan);
      return sendText(body, 'text/plain; charset=utf-8');
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  // Both files the Zellij layer writes. The page splits on the marker rather than making
  // two requests, and rebuilds neither in the browser — one KDL builder, so the preview
  // is the installer's own output.
  if (path === '/zellij-files.txt') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const zjSan = sanitizeZellij(pl.zj);
      if (!zjSan) return sendText('this setup has no Zellij layer enabled', 'text/plain; charset=utf-8', 404);
      const body = buildZellijKdl(zjSan)
        + '@@LAYOUT@@' + (zjSan.agentLayout ? buildAgentLayout(zjSan) : '');
      return sendText(body, 'text/plain; charset=utf-8');
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  // The single file the herdr layer writes, verbatim. The page fetches this rather than
  // building TOML in the browser too — one builder, so the preview cannot drift from
  // what the installer actually writes.
  if (path === '/herdr-files.txt') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const hdSan = sanitizeHerdr(pl.hd);
  const zjSan = sanitizeZellij(pl.zj);
      if (!hdSan) return sendText('this setup has no herdr layer enabled', 'text/plain; charset=utf-8', 404);
      return sendText(buildHerdrToml(hdSan), 'text/plain; charset=utf-8');
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
  }
  // The two files the cmux layer writes, verbatim. Linked from the page as "peek
  // under the hood", and what the parity test compares the preview against.
  if (path === '/cmux-files.txt') {
    const c = u.searchParams.get('c');
    if (!c) return sendText('missing ?c= payload', 'text/plain; charset=utf-8', 400);
    try {
      const pl = decodeCustom(c);
      const cmSan = sanitizeCmux(pl.cm);
      if (!cmSan) return sendText('this setup has no cmux layer enabled', 'text/plain; charset=utf-8', 404);
      const lines = buildGhosttyLines(cmSan, pl.p).map(([k, v]) => `${k} = ${v}`).join('\n');
      const body = `# ~/.config/ghostty/config  (managed block)\n${lines}\n\n`
        + `# ~/.config/cmux/cmux.json  (deep-merged into your file)\n`
        + JSON.stringify(buildCmuxJson(cmSan, pl.p), null, 2) + '\n';
      return sendText(body, 'text/plain; charset=utf-8');
    } catch (e) { return sendText('bad payload: ' + cleanText(e.message, 120), 'text/plain; charset=utf-8', 400); }
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
}
