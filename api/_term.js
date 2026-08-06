// Shared terminal-simulator + status-line machinery.
//  - TERM_SRC:  client-side interactive Claude Code terminal preview (embedded in pages;
//               written ES5-style, NO backticks / NO ${} — it lives inside template literals).
//  - server helpers: previewColors, paletteSeedHex, sanitizeSL, buildUMD, buildInputBox,
//               buildStatuslineScript (generates the installable Node status-line script).

// ── server-side constants / sanitizers ──────────────────────────────────────

const SL_SEG_IDS = ['model', 'effort', 'dir', 'git', 'ctx', 'cost', 'dur', 'lines', 'style', 'ver', 'clock', 'text'];
const SL_SEPS = [' | ', ' \u00b7 ', '  ', ' \u2014 ', ' \u203a '];
const SL_BARS = {
  blocks: ['\u25ae', '\u25af'],
  shade: ['\u2588', '\u2591'],
  dots: ['\u25cf', '\u25cb'],
  braille: ['\u28ff', '\u28c0'],
};
const SL_CTX_FMTS = ['pct', 'pct-of', 'tokens'];
// What the context gauge is a fraction OF.
//   window      — the model's real context window, read from
//                 context_window.context_window_size in the status-line payload
//   autocompact — the point this session will actually compact at, which is the number
//                 that decides when you get interrupted. Claude Code exposes the window
//                 but NOT the compaction threshold, so the script resolves the
//                 autoCompactWindow setting itself; see compactWindow() below.
const SL_CTX_BASIS = ['window', 'autocompact'];
const UMD_STYLES = ['bold', 'italic', 'underline', 'strikethrough', 'inverse'];
const UMD_BORDERS = ['none', 'single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle',
  'classic', 'topBottomSingle', 'topBottomDouble', 'topBottomBold'];
const IB_CHEVRON_KEYS = ['claude', 'planMode', 'success', 'warning', 'error', 'ide', 'remember', 'permission'];

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};

const RGB_RE = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
function toRgbStr(v, fallback) {
  if (typeof v === 'string' && RGB_RE.test(v)) return v.replace(/\s+/g, '');
  if (typeof v === 'string' && HEX_RE.test(v)) {
    const h = v.slice(1);
    return `rgb(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)})`;
  }
  return fallback;
}

// Control characters that must never reach a terminal or a patched bundle:
// C0, DEL, C1 (U+0080–U+009F includes 8-bit CSI/OSC), and bidi overrides.
const CTRL_RE = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;

// Strip anything that could break out of generated scripts / JSON contexts.
const cleanText = (s, max) => String(s == null ? '' : s)
  .replace(CTRL_RE, '').replace(/['"\\`$]/g, '').slice(0, max);

// Strings that Claude Code renders to the terminal (verbs, spinner phases, formats).
// Quotes survive (they are JSON-encoded downstream) but control sequences never do.
const cleanTerm = (s, max) => String(s == null ? '' : s).replace(CTRL_RE, '').slice(0, max);

// Display names get a strict whitelist (they are echoed inside generated shell scripts).
const cleanName = (s, max) => String(s == null ? '' : s)
  .replace(/[^\p{L}\p{N}\p{Emoji_Presentation} ._,:!?+()#@\u00d7\u2013\u2014-]/gu, '')
  .replace(/\s+/g, ' ').slice(0, max).trim();

// Truncate a "{}"-placeholder format safely: slice FIRST, then require the
// placeholder — otherwise a "{}" straddling the cut survives the check but not the cut.
function cleanFormat(s, max, fallback) {
  if (typeof s !== 'string') return fallback;
  const out = cleanTerm(s, max);
  return out.includes('{}') ? out : fallback;
}

const has = (obj, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(obj, k);

// The 14 palette keys, clamped to integer RGB triples. Palettes arrive from
// attacker-controlled share links and flow into style attributes and themes,
// so every component must be a number in 0–255 before it is used anywhere.
const PALETTE_KEYS = ['bg', 'raised', 'text', 'comment', 'subtle', 'accent', 'accent2',
  'cyan', 'green', 'red', 'orange', 'yellow', 'pink', 'blue'];
const PALETTE_FALLBACK = {
  bg: [26, 27, 38], raised: [41, 46, 66], text: [192, 202, 245], comment: [86, 95, 137],
  subtle: [48, 52, 70], accent: [122, 162, 247], accent2: [187, 154, 247], cyan: [125, 207, 255],
  green: [158, 206, 106], red: [247, 118, 142], orange: [255, 158, 100], yellow: [224, 175, 104],
  pink: [187, 154, 247], blue: [122, 162, 247],
};
function sanePalette(p) {
  const src = (p && typeof p === 'object') ? p : {};
  const out = {};
  for (const k of PALETTE_KEYS) {
    const v = src[k];
    out[k] = (Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n)))
      ? v.map(n => Math.max(0, Math.min(255, Math.round(n))))
      : PALETTE_FALLBACK[k].slice();
  }
  return out;
}

// Sanitize a status-line payload (pl.sl). Returns null when disabled/empty.
function sanitizeSL(sl) {
  if (!sl || typeof sl !== 'object' || !sl.on) return null;
  const seg = (Array.isArray(sl.seg) ? sl.seg : [])
    .filter((s, i, a) => SL_SEG_IDS.includes(s) && a.indexOf(s) === i).slice(0, SL_SEG_IDS.length);
  if (!seg.length) return null;
  return {
    on: true,
    seg,
    sep: SL_SEPS.includes(sl.sep) ? sl.sep : ' | ',
    em: sl.em !== false,
    bar: has(SL_BARS, sl.bar) ? sl.bar : 'blocks',
    ctxFmt: SL_CTX_FMTS.includes(sl.ctxFmt) ? sl.ctxFmt : 'pct-of',
    ctxBasis: SL_CTX_BASIS.includes(sl.ctxBasis) ? sl.ctxBasis : 'window',
    text: cleanText(sl.text, 24),
  };
}

// Combine legacy (ub/uc) + v2 (um) payload fields into a full tweakcc userMessageDisplay.
function buildUMD(pl) {
  const um = (pl.um && typeof pl.um === 'object') ? pl.um : {};
  const border = UMD_BORDERS.includes(pl.ub) ? pl.ub : 'none';
  const hasB = border !== 'none';
  const fmt = cleanFormat(um.f, 40, hasB ? ' {} ' : ' > {} ');
  const fit = (um.fit === undefined) ? hasB : !!um.fit;
  return {
    format: fmt,
    styling: (Array.isArray(um.st) ? um.st : []).filter(s => UMD_STYLES.includes(s)),
    foregroundColor: toRgbStr(um.fg, 'default'),
    backgroundColor: um.bg ? toRgbStr(um.bg, null) : null,
    borderStyle: border,
    borderColor: toRgbStr(pl.uc, 'rgb(122,162,247)'),
    paddingX: clampInt(um.px, 0, 4, hasB ? 1 : 0),
    paddingY: clampInt(um.py, 0, 2, 0),
    fitBoxToContent: fit,
  };
}

// tweakcc inputBox config from payload (pl.ib). Returns null when untouched.
function buildInputBox(pl) {
  const ib = (pl.ib && typeof pl.ib === 'object') ? pl.ib : null;
  if (!ib) return null;
  const ch = IB_CHEVRON_KEYS.includes(ib.ch) ? ib.ch : null;
  if (!ib.rb && !ch) return null;
  return { removeBorder: !!ib.rb, chevronIdleThemeColor: ch };
}

// Map a full 61-key theme into the compact color set the client preview uses.
function previewColors(c) {
  return {
    bg: termBgOf(c), text: c.text, accent: c.claude, shimmer: c.claudeShimmer,
    success: c.success, error: c.error, warning: c.warning, permission: c.permission,
    inactive: c.inactive, subtle: c.subtle, planMode: c.planMode, ide: c.ide,
    remember: c.remember, userMsgBg: c.userMessageBackground, promptBorder: c.promptBorder,
    diffAdded: c.diffAdded, diffRemoved: c.diffRemoved,
    diffAddedWord: c.diffAddedWord, diffRemovedWord: c.diffRemovedWord,
  };
}
function termBgOf(colors) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(colors.inverseText || '');
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    if (0.299 * r + 0.587 * g + 0.114 * b < 150) return `rgb(${r},${g},${b})`;
  }
  return '#12141a';
}

// Reverse-map a full theme into the 14 hex swatches the customizer edits.
function paletteSeedHex(colors) {
  const pick = (k, fb) => {
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec((colors && colors[k]) || '');
    return m ? [+m[1], +m[2], +m[3]] : fb;
  };
  const hex = t => '#' + t.map(v => v.toString(16).padStart(2, '0')).join('');
  // Seed bg from the SAME value the terminal preview paints (termBgOf), not from
  // colors.background — several community themes use background as a placeholder
  // and would seed a bright swatch under near-invisible text.
  const bgHex = () => {
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(termBgOf(colors || {}));
    return m ? hex([+m[1], +m[2], +m[3]]) : '#12141a';
  };
  return {
    bg: bgHex(),
    raised: hex(pick('userMessageBackground', [41, 46, 66])),
    text: hex(pick('text', [192, 202, 245])),
    comment: hex(pick('inactive', [86, 95, 137])),
    subtle: hex(pick('subtle', [48, 52, 70])),
    accent: hex(pick('claude', [122, 162, 247])),
    accent2: hex(pick('purple_FOR_SUBAGENTS_ONLY', [187, 154, 247])),
    cyan: hex(pick('planMode', [125, 207, 255])),
    green: hex(pick('success', [158, 206, 106])),
    red: hex(pick('error', [247, 118, 142])),
    orange: hex(pick('warning', [255, 158, 100])),
    yellow: hex(pick('remember', [224, 175, 104])),
    pink: hex(pick('pink_FOR_SUBAGENTS_ONLY', [187, 154, 247])),
    blue: hex(pick('ide', [122, 162, 247])),
  };
}

// ── generated status-line script ────────────────────────────────────────────
// A self-contained Node script installed at ~/.claude/statusline-shayan.js and
// registered via settings.json { statusLine: { type:'command', command:<path> } }.
// User-influenced config is embedded ONLY as base64 (cannot break the heredoc/script).

function buildStatuslineScript(slSan, palette) {
  const p = sanePalette(palette);
  const cfg = {
    seg: slSan.seg, sep: slSan.sep, em: slSan.em, ctxFmt: slSan.ctxFmt,
    ctxBasis: slSan.ctxBasis, text: slSan.text,
    barChars: has(SL_BARS, slSan.bar) ? SL_BARS[slSan.bar] : SL_BARS.blocks,
    colors: {
      accent: p.accent, dim: p.comment, text: p.text,
      green: p.green, red: p.red, subtle: p.subtle,
    },
  };
  const b64 = Buffer.from(JSON.stringify(cfg), 'utf8').toString('base64');
  const L = [];
  L.push('#!/usr/bin/env node');
  L.push('// shayan-cc-config status line (generated) \u2014 reads Claude Code status JSON on stdin,');
  L.push('// prints one ANSI-colored line. Rebuild yours at https://shayan-cc-config.vercel.app/customize');
  // os is for compactWindow(), which reads ~/.claude/settings.json to find the
  // autoCompactWindow this session will actually compact at.
  L.push("const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');");
  // The embedded config is the one thing a truncated or hand-edited install would
  // break, so its parse is guarded like everything else rather than crashing at load.
  L.push('const FALLBACK_CFG = ' + JSON.stringify({ seg: ['model', 'dir'], sep: ' | ', em: false, ctxFmt: 'pct', ctxBasis: 'window', text: '', barChars: SL_BARS.blocks, colors: cfg.colors }) + ';');
  L.push('let CFG = FALLBACK_CFG;');
  L.push("try { CFG = JSON.parse(Buffer.from('" + b64 + "', 'base64').toString('utf8')); } catch (e) {}");
  L.push('const ESC = String.fromCharCode(27), RST = ESC + "[0m";');
  L.push('const fg = c => ESC + "[38;2;" + c.join(";") + "m";');
  // Values echoed from the status JSON reach the terminal every render, so control
  // sequences (which could retitle the terminal or add lines) are stripped first.
  L.push('const CTRL = /[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069]/g;');
  L.push("const txt = (v, max) => (typeof v === 'string' ? v : '').replace(CTRL, '').slice(0, max || 60);");
  L.push('const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };');
  L.push("let raw = '';");
  L.push("process.stdin.on('data', d => raw += d);");
  L.push("process.stdin.on('end', () => { let j = null; try { j = JSON.parse(raw); } catch (e) {} if (!j || typeof j !== 'object' || Array.isArray(j)) j = {}; try { main(j); } catch (e) { process.stdout.write('statusline error: ' + e.message); } });");
  L.push('function main(j) {');
  L.push('  const C = CFG.colors || FALLBACK_CFG.colors;');
  L.push('  const k = { A: fg(C.accent), D: fg(C.dim), T: fg(C.text), G: fg(C.green), R: fg(C.red), S: fg(C.subtle), em: CFG.em };');
  L.push("  const ws = (j.workspace && typeof j.workspace === 'object') ? j.workspace : {};");
  L.push("  const cwd = (typeof ws.current_dir === 'string' && ws.current_dir) || (typeof j.cwd === 'string' && j.cwd) || process.cwd();");
  L.push('  const parts = [];');
  L.push('  const segs = Array.isArray(CFG.seg) ? CFG.seg : FALLBACK_CFG.seg;');
  L.push('  for (const id of segs) { const s = seg(id, j, cwd, k); if (s) parts.push(s); }');
  L.push("  process.stdout.write(parts.join(k.D + txt(CFG.sep, 8)) + RST);");
  L.push('}');
  L.push('function seg(id, j, cwd, k) {');
  L.push('  switch (id) {');
  L.push("    case 'model': { const n = txt(j.model && j.model.display_name, 40); return n ? k.A + n : ''; }");
  // effort.level is absent whenever the current model has no reasoning-effort
  // parameter, so this segment renders nothing rather than a blank separator.
  L.push("    case 'effort': { const e = txt(j.effort && j.effort.level, 8); return e ? k.A + (k.em ? '\\u{1F9E0}' : '') + e : ''; }");
  L.push("    case 'dir': return k.T + (k.em ? '\\u{1F4C1}' : '') + txt(path.basename(cwd), 40);");
  L.push("    case 'git': return gitSeg(cwd, k);");
  L.push("    case 'ctx': return ctxSeg(j, k);");
  L.push("    case 'cost': { const c = num(j.cost && j.cost.total_cost_usd); return c == null ? '' : k.T + (k.em ? '\\u{1F4B0}' : '') + '$' + c.toFixed(2); }");
  L.push("    case 'dur': { const ms = num(j.cost && j.cost.total_duration_ms); if (!ms) return ''; const m = Math.round(ms / 60000); return k.T + (k.em ? '\\u23F1 ' : '') + (m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm'); }");
  L.push("    case 'lines': { const c = j.cost || {}; const a = num(c.total_lines_added), d = num(c.total_lines_removed); if (a == null && d == null) return ''; return k.G + '+' + (a || 0) + k.D + '/' + k.R + '-' + (d || 0); }");
  L.push("    case 'style': { const s = txt(j.output_style && j.output_style.name, 24); return s ? k.T + (k.em ? '\\u{1F3A8}' : '') + s : ''; }");
  L.push("    case 'ver': { const v = txt(j.version, 16); return v ? k.D + 'v' + v : ''; }");
  L.push("    case 'clock': { const d = new Date(); const pad = n => String(n).padStart(2, '0'); return k.T + (k.em ? '\\u{1F550}' : '') + pad(d.getHours()) + ':' + pad(d.getMinutes()); }");
  L.push("    case 'text': { const t = txt(CFG.text, 24); return t ? k.D + t : ''; }");
  L.push('  }');
  L.push("  return '';");
  L.push('}');
  L.push('function gitSeg(cwd, k) {');
  L.push('  try {');
  L.push("    const o = { cwd, timeout: 900, stdio: ['ignore', 'pipe', 'ignore'] };");
  L.push("    const br = cp.execSync('git rev-parse --abbrev-ref HEAD', o).toString().trim();");
  L.push("    if (!br) return '';");
  L.push("    let dirty = '';");
  L.push("    try { dirty = cp.execSync('git status --porcelain -uno', o).toString().trim() ? '\\u2717' : ''; } catch (e) {}");
  L.push("    return k.T + (k.em ? '\\u{1F500}' : String.fromCharCode(0x2387) + ' ') + br + (dirty ? ' ' + k.R + dirty : '');");
  L.push('  } catch (e) { return \'\'; }');
  L.push('}');
  L.push('function ctxSeg(j, k) {');
  L.push('  const used = usedTokens(j);');
  L.push("  if (used == null) return '';");
  // Which denominator the gauge is against — the model's window, or the point this
  // session will actually compact at.
  L.push("  const win = CFG.ctxBasis === 'autocompact' ? compactWindow(j) : contextWindow(j);");
  L.push('  const pct = Math.max(0, Math.min(100, Math.round(used / win * 100)));');
  L.push('  const cells = 8, fill = Math.max(0, Math.min(cells, Math.round(pct / 100 * cells)));');
  L.push('  const B = (Array.isArray(CFG.barChars) && CFG.barChars.length === 2) ? CFG.barChars : ["\\u25ae", "\\u25af"];');
  L.push('  const bar = k.A + B[0].repeat(fill) + k.S + B[1].repeat(cells - fill);');
  L.push("  const kk = n => n >= 1000000 ? (Math.round(n / 100000) / 10) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);");
  // Past the assumed window our guess is wrong, so print the count alone rather than
  // an impossible fraction like 641k/200k.
  L.push("  if (CFG.ctxFmt === 'tokens') return bar + ' ' + k.T + kk(used) + (used > win ? '' : k.D + '/' + kk(win));");
  L.push("  if (CFG.ctxFmt === 'pct') return bar + ' ' + k.T + pct + '%';");
  L.push("  return bar + ' ' + k.T + pct + '% ' + k.D + 'of ' + kk(win);");
  L.push('}');
  L.push('// The real window, straight from the payload when Claude Code sends it — that is');
  L.push('// authoritative and covers 1M models without pattern-matching a model id. Older');
  L.push('// builds omit context_window, so the id guess stays as the fallback.');
  L.push('//');
  L.push('// It must NOT be inferred from observed usage: tiering up the moment usage crosses');
  L.push('// 200k made the gauge jump from full down to ~40% exactly when the context filled,');
  L.push('// which is when it matters most.');
  L.push('function contextWindow(j) {');
  L.push('  const cw = j.context_window;');
  L.push("  if (cw && typeof cw === 'object') {");
  L.push('    const n = num(cw.context_window_size);');
  L.push('    if (n && n > 0) return n;');
  L.push('  }');
  L.push("  const mid = String((j.model && typeof j.model === 'object' && j.model.id) || '');");
  L.push('  return /1m|\\[1m\\]/i.test(mid) ? 1000000 : 200000;');
  L.push('}');
  L.push('// The point THIS session compacts at, which is the number that decides when you');
  L.push('// get interrupted — usually well below the window.');
  L.push('//');
  L.push('// Claude Code does not put it in the status-line payload, so it is resolved the');
  L.push('// same way Claude Code resolves it: the env override first, then autoCompactWindow');
  L.push('// from the settings files, nearest scope first. If auto-compaction is switched off');
  L.push('// there is no threshold to show, and if nothing sets a window Claude Code picks one');
  L.push('// "tuned for your model" that it does not publish — either way we fall back to the');
  L.push('// real window rather than inventing a number.');
  L.push('function compactWindow(j) {');
  L.push('  const win = contextWindow(j);');
  L.push('  const envv = num(process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW);');
  L.push('  if (envv && envv > 0) return clampWin(envv, win);');
  L.push("  if (String(process.env.DISABLE_AUTO_COMPACT || '') === '1') return win;");
  L.push('  const files = [');
  L.push("    path.join(cwdSafe(), '.claude', 'settings.local.json'),");
  L.push("    path.join(cwdSafe(), '.claude', 'settings.json'),");
  L.push("    path.join(os.homedir(), '.claude', 'settings.json'),");
  L.push('  ];');
  L.push('  for (const f of files) {');
  L.push('    try {');
  L.push('      if (!fs.existsSync(f)) continue;');
  L.push("      const s = JSON.parse(fs.readFileSync(f, 'utf8'));");
  L.push('      if (s.autoCompactEnabled === false) return win;');
  L.push('      const n = num(s.autoCompactWindow);');
  L.push('      if (n && n > 0) return clampWin(n, win);');
  L.push('    } catch (e) {}');
  L.push('  }');
  L.push('  return win;');
  L.push('}');
  L.push('// The setting is documented as 100k–1M, and it can never exceed the real window.');
  L.push('function clampWin(n, win) { return Math.max(100000, Math.min(win, Math.round(n))); }');
  L.push('function cwdSafe() { try { return process.cwd(); } catch (e) { return os.homedir(); } }');
  L.push('function usedTokens(j) {');
  L.push('  try {');
  L.push('    const tp = j.transcript_path;');
  L.push("    if (typeof tp !== 'string' || !tp || !fs.existsSync(tp)) return null;");
  L.push('    const size = fs.statSync(tp).size;');
  L.push('    if (!size) return null;');
  L.push('    const take = Math.min(size, 262144);');
  L.push("    const fd = fs.openSync(tp, 'r');");
  L.push('    const buf = Buffer.alloc(take);');
  L.push('    fs.readSync(fd, buf, 0, take, size - take);');
  L.push('    fs.closeSync(fd);');
  L.push("    const lines = buf.toString('utf8').split('\\n');");
  L.push('    for (let i = lines.length - 1; i >= 0; i--) {');
  L.push('      const Lx = lines[i];');
  L.push('      // Usage recorded before a compaction describes a context that no longer');
  L.push('      // exists, so stop here rather than reporting a stale (much larger) total.');
  L.push('      // The gauge reappears as soon as the next assistant turn records usage.');
  L.push('      if (Lx.indexOf(\'"compact_boundary"\') >= 0 || Lx.indexOf(\'"isCompactSummary":true\') >= 0) return null;');
  L.push('      if (Lx.indexOf(\'"usage"\') < 0) continue;');
  L.push('      try {');
  L.push('        const m = JSON.parse(Lx);');
  L.push('        const u = (m.message && m.message.usage) || m.usage;');
  L.push("        if (u && typeof u === 'object' && u.input_tokens != null) {");
  L.push("          const t = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens', 'output_tokens']");
  L.push('            .reduce((sum, key) => sum + (num(u[key]) || 0), 0);');
  L.push('          if (Number.isFinite(t) && t >= 0) return t;');
  L.push('        }');
  L.push('      } catch (e) {}');
  L.push('    }');
  L.push('    return null;');
  L.push('  } catch (e) { return null; }');
  L.push('}');
  return L.join('\n') + '\n';
}

// ── client-side terminal simulator (embedded into pages) ────────────────────
// ES5-flavoured; MUST NOT contain backticks or "$"+"{" sequences.
const TERM_SRC = `
var SL_SEG_META=[
 {id:'model',name:'Model name'},
 {id:'effort',name:'Reasoning effort'},
 {id:'dir',name:'Folder'},
 {id:'git',name:'Git branch'},
 {id:'ctx',name:'Context bar'},
 {id:'cost',name:'Session cost'},
 {id:'dur',name:'Duration'},
 {id:'lines',name:'Lines +/\u2212'},
 {id:'style',name:'Output style'},
 {id:'ver',name:'CC version'},
 {id:'clock',name:'Clock'},
 {id:'text',name:'Custom text'}
];
var SL_BARSETS={blocks:['\u25ae','\u25af'],shade:['\u2588','\u2591'],dots:['\u25cf','\u25cb'],braille:['\u28ff','\u28c0']};
var SL_SEPLIST=[' | ',' \u00b7 ','  ',' \u2014 ',' \u203a '];
// own-property test: SL_BARSETS['constructor'] etc. are truthy but not real bar styles
function ownKey(o,k){return typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);}
function barsOf(k){return ownKey(SL_BARSETS,k)?SL_BARSETS[k]:SL_BARSETS.blocks;}
// Quotes are escaped too, so this stays interchangeable with esc() in _render.js.
// Every current call site is text-node position, where quotes are inert — but the two
// helpers look alike, and a future edit that moves output into an attribute should not
// have to know which one it picked.
function eH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function mdI(s){
  var h=eH(s);
  h=h.replace(/\\*\\*([^*]+)\\*\\*/g,'<b>$1</b>');
  h=h.replace(/\u2039([^\u203a]+)\u203a/g,'<span class="xcode">$1</span>');
  return h;
}
var CHEV_MAP={claude:'accent',planMode:'planMode',success:'success',warning:'warning',error:'error',ide:'ide',remember:'remember',permission:'permission'};

// demo values that feed the status-line preview
function slDemo(T){
  var d=new Date();var pad=function(n){return ('0'+n).slice(-2);};
  return {model:'Opus 5',dir:'senpex-frontend',branch:'main',dirty:T.sends>0,pct:T.pct,
    used:T.pct*2000,win:200000,compact:140000,effort:'high',
    cost:0.42+T.sends*0.07,dur:38+T.sends*2,add:214+T.sends*6,del:58+T.sends,
    style:'default',ver:'2.1.12',time:pad(d.getHours())+':'+pad(d.getMinutes())};
}
function kk(n){return n>=1000000?(Math.round(n/100000)/10)+'M':n>=1000?Math.round(n/1000)+'k':String(n);}
function slHTML(m,T){
  var sl=m.sl;if(!sl||!sl.on)return '';
  var c=m.colors,d=slDemo(T),em=sl.em!==false;
  var B=barsOf(sl.bar);
  var span=function(col,txt){return '<span style="color:'+col+'">'+txt+'</span>';};
  var parts=[];
  for(var i=0;i<sl.seg.length;i++){
    var id=sl.seg[i],h='';
    if(id==='model')h=span(c.accent,eH(d.model));
    else if(id==='dir')h=span(c.text,(em?'\u{1F4C1}':'')+eH(d.dir));
    else if(id==='git')h=span(c.text,(em?'\u{1F500}':'\u2387 ')+eH(d.branch))+(d.dirty?' '+span(c.error,'\u2717'):'');
    else if(id==='ctx'){
      // Same denominator choice the installed script makes: against the model's window,
      // or against the point this session actually compacts at. The percentage has to be
      // recomputed from it, or the bar would say 42% of two different numbers.
      var basis=(sl.ctxBasis==='autocompact')?d.compact:d.win;
      var bpct=Math.max(0,Math.min(100,Math.round(d.used/basis*100)));
      var fill=Math.max(0,Math.min(8,Math.round(bpct/100*8)));
      var bar=span(c.accent,Array(fill+1).join(B[0]))+span(c.subtle,Array(8-fill+1).join(B[1]));
      if(sl.ctxFmt==='tokens')h=bar+' '+span(c.text,kk(d.used))+(d.used>basis?'':span(c.inactive,'/'+kk(basis)));
      else if(sl.ctxFmt==='pct')h=bar+' '+span(c.text,bpct+'%');
      else h=bar+' '+span(c.text,bpct+'% ')+span(c.inactive,'of '+kk(basis));
    }
    else if(id==='effort')h=span(c.accent,(em?'\u{1F9E0}':'')+eH(d.effort));
    else if(id==='cost')h=span(c.text,(em?'\u{1F4B0}':'')+'$'+d.cost.toFixed(2));
    else if(id==='dur')h=span(c.text,(em?'\u23F1 ':'')+d.dur+'m');
    else if(id==='lines')h=span(c.success,'+'+d.add)+span(c.inactive,'/')+span(c.error,'-'+d.del);
    else if(id==='style')h=span(c.text,(em?'\u{1F3A8}':'')+eH(d.style));
    else if(id==='ver')h=span(c.inactive,'v'+d.ver);
    else if(id==='clock')h=span(c.text,(em?'\u{1F550}':'')+d.time);
    else if(id==='text'&&sl.text)h=span(c.inactive,eH(sl.text));
    if(h)parts.push(h);
  }
  return parts.join(span(c.inactive,eH(sl.sep).replace(/ /g,'&nbsp;')));
}

// user-message row per userMessageDisplay config
function userRowHTML(m,text){
  var u=m.umd||{},c=m.colors;
  var fmt=(u.format&&u.format.indexOf('{}')>=0)?u.format:' > {} ';
  var i=fmt.indexOf('{}');
  var pre=eH(fmt.slice(0,i)),post=eH(fmt.slice(i+2));
  var st=(Object.prototype.toString.call(u.styling)==='[object Array]')?u.styling:[];
  var fgc=okColor(u.foregroundColor)||c.text;
  var bgc=okColor(u.backgroundColor)||c.userMsgBg;
  if(st.indexOf('inverse')>=0){var t2=fgc;fgc=bgc;bgc=t2;}
  var css='color:'+fgc+';background:'+bgc+';';
  if(st.indexOf('bold')>=0)css+='font-weight:700;';
  if(st.indexOf('italic')>=0)css+='font-style:italic;';
  var deco=[];
  if(st.indexOf('underline')>=0)deco.push('underline');
  if(st.indexOf('strikethrough')>=0)deco.push('line-through');
  if(deco.length)css+='text-decoration:'+deco.join(' ')+';';
  var bs=String(u.borderStyle||'none'),bc=okColor(u.borderColor)||c.promptBorder;
  var px=(u.paddingX||0),py=(u.paddingY||0);
  css+='padding:0 '+(px?px:0)+'ch;';
  css+='display:inline-block;';

  var box=BOX_CHARS[bs];
  if(!box){
    // borderStyle none: just the message, which is the only case with no border rows.
    css+=(u.fitBoxToContent?'max-width:100%;':'display:block;padding:0 '+(px||0)+'ch;');
    return '<div class="xrow xu"><span style="'+css+'">'+pre+eH(text)+post+'</span></div>';
  }
  return boxedUserRows(box,bc,css,pre+eH(text)+post,px,py,!!u.fitBoxToContent,cellsOf(text)+2*px);
}

/**
 * Ink's border characters, lifted verbatim from the cli-boxes table inside the Claude
 * Code bundle that renders them — not from memory, because getting one corner wrong
 * would make the preview quietly disagree with the terminal.
 *
 * The topBottom* three are not cli-boxes entries at all: tweakcc synthesises them as
 * a custom style object with spaces for the sides and corners, so they draw two
 * full-width rules and nothing else.
 */
var BOX_CHARS={
  single:       {tl:'\u250c',t:'\u2500',tr:'\u2510',l:'\u2502',r:'\u2502',bl:'\u2514',b:'\u2500',br:'\u2518'},
  double:       {tl:'\u2554',t:'\u2550',tr:'\u2557',l:'\u2551',r:'\u2551',bl:'\u255a',b:'\u2550',br:'\u255d'},
  round:        {tl:'\u256d',t:'\u2500',tr:'\u256e',l:'\u2502',r:'\u2502',bl:'\u2570',b:'\u2500',br:'\u256f'},
  bold:         {tl:'\u250f',t:'\u2501',tr:'\u2513',l:'\u2503',r:'\u2503',bl:'\u2517',b:'\u2501',br:'\u251b'},
  singleDouble: {tl:'\u2553',t:'\u2500',tr:'\u2556',l:'\u2551',r:'\u2551',bl:'\u2559',b:'\u2500',br:'\u255c'},
  doubleSingle: {tl:'\u2552',t:'\u2550',tr:'\u2555',l:'\u2502',r:'\u2502',bl:'\u2558',b:'\u2550',br:'\u255b'},
  classic:      {tl:'+',t:'-',tr:'+',l:'|',r:'|',bl:'+',b:'-',br:'+'},
  topBottomSingle:{tl:' ',t:'\u2500',tr:' ',l:' ',r:' ',bl:' ',b:'\u2500',br:' '},
  topBottomDouble:{tl:' ',t:'\u2550',tr:' ',l:' ',r:' ',bl:' ',b:'\u2550',br:' '},
  topBottomBold:  {tl:' ',t:'\u2501',tr:' ',l:' ',r:' ',bl:' ',b:'\u2501',br:' '}
};

/** Terminal cells a string occupies. Astral characters count as one cell here. */
function cellsOf(s){
  var n=0;
  for(var i=0;i<String(s).length;i++){
    var cp=String(s).codePointAt(i);
    if(cp>0xffff)i++;
    n++;
  }
  return n;
}

/**
 * A user message inside an Ink bordered Box, drawn the way the terminal actually
 * draws it: the border is TEXT, so it costs a whole row above and a whole row below,
 * and it is not part of the message's background strip.
 *
 * The previous version drew a 1px CSS hairline on the strip itself, which made a
 * three-row full-width rule look like a thin outline hugging the text — a real
 * surprise once installed, and the reason this got rewritten.
 *
 * Width: without fitBoxToContent an Ink Box fills its parent, so the middle of each
 * border row is a flex cell that repeats the character and clips, which puts the
 * corners exactly on the edges at any pane width without measuring anything. With
 * fitBoxToContent (alignSelf:flex-start in the patch) the box shrinks to the content,
 * so the repeat count is known and used literally.
 */
function boxedUserRows(box,bc,innerCss,inner,px,py,fit,contentCells){
  var bstyle='color:'+bc+';';
  function edge(cl,mid,cr){
    if(fit){
      return '<div class="xrow xu xbord" style="'+bstyle+'">'
        +eH(cl)+eH(repeatCh(mid,contentCells))+eH(cr)+'</div>';
    }
    // flex so the middle fills and clips; the corners stay pinned to the two edges.
    return '<div class="xrow xu xbord" style="'+bstyle+'display:flex;">'
      +'<span>'+eH(cl)+'</span>'
      +'<span class="xbfill">'+eH(repeatCh(mid,400))+'</span>'
      +'<span>'+eH(cr)+'</span></div>';
  }
  function blank(){
    return '<div class="xrow xu xbord" style="'+bstyle+(fit?'':'display:flex;')+'">'
      +'<span>'+eH(box.l)+'</span>'
      +(fit?'<span>'+eH(repeatCh(' ',contentCells))+'</span>'
          :'<span class="xbfill">'+eH(repeatCh(' ',400))+'</span>')
      +'<span>'+eH(box.r)+'</span></div>';
  }
  var out=edge(box.tl,box.t,box.tr);
  for(var i=0;i<py;i++)out+=blank();
  out+='<div class="xrow xu" style="'+(fit?'':'display:flex;')+'">'
    +'<span style="'+bstyle+'">'+eH(box.l)+'</span>'
    +'<span style="'+innerCss+(fit?'':'flex:1;min-width:0;')+'">'+inner+'</span>'
    +'<span style="'+bstyle+'">'+eH(box.r)+'</span></div>';
  for(var i2=0;i2<py;i2++)out+=blank();
  out+=edge(box.bl,box.b,box.br);
  return out;
}
function repeatCh(ch,n){
  var s='';
  for(var i=0;i<n;i++)s+=ch;
  return s;
}

// transcript event -> row HTML
function rowHTML(m,ev){
  var c=m.colors;
  if(ev.t==='user')return userRowHTML(m,ev.text);
  if(ev.t==='sys')return '<div class="xrow" style="color:'+c.inactive+'">'+eH(ev.text)+'</div>';
  if(ev.t==='ts')return '<div class="xrow" style="color:'+c.inactive+'">'+eH(ev.text||'')+'</div>';
  if(ev.t==='a'){
    var out='';
    for(var i=0;i<ev.lines.length;i++){
      var pre=i===0?'<span style="color:'+c.text+'">\u25cf</span> ':'&nbsp;&nbsp;';
      out+='<div class="xrow" style="color:'+c.text+'">'+pre+mdI(ev.lines[i])+'</div>';
    }
    return out;
  }
  if(ev.t==='tool'){
    var h='<div class="xrow"><span style="color:'+c.success+'">\u23fa</span> <span style="color:'+c.text+'"><b>'+eH(ev.name)+'</b>('+eH(ev.arg)+')</span></div>';
    if(ev.res)h+='<div class="xrow" style="color:'+c.inactive+'">&nbsp;&nbsp;\u23bf&nbsp; '+mdI(ev.res)+'</div>';
    return h;
  }
  if(ev.t==='diff'){
    var out2='';
    for(var j=0;j<ev.rows.length;j++){
      var r=ev.rows[j],bg='',col=c.text,sign=r.k===' '?'&nbsp;':eH(r.k);
      if(r.k==='+'){bg=c.diffAdded;col=c.diffAddedWord;}
      if(r.k==='-'){bg=c.diffRemoved;col=c.diffRemovedWord;}
      out2+='<div class="xrow" style="background:'+bg+'"><span style="color:'+c.inactive+'">&nbsp;&nbsp;&nbsp;'+r.n+' </span><span style="color:'+col+'">'+sign+' '+eH(r.s)+'</span></div>';
    }
    return out2;
  }
  if(ev.t==='err')return '<div class="xrow" style="color:'+c.error+'">\u23fa '+eH(ev.text)+'</div>';
  if(ev.t==='link')return '<div class="xrow"><span style="color:'+c.inactive+'">&nbsp;&nbsp;\u23bf&nbsp; </span><span style="color:'+c.planMode+';text-decoration:underline">'+eH(ev.text)+'</span></div>';
  return '';
}

var TERM_SEED=[
 {t:'sys',text:'~/projects/senpex-frontend'},
 {t:'user',text:'hey claude \u2014 the login redirect drops the ?next param after OAuth'},
 {t:'a',lines:['I\\u2019ll trace the redirect through the auth flow.']},
 {t:'tool',name:'Search',arg:'pattern: "redirect", glob: "src/auth/**"',res:'Found 6 matches'},
 {t:'tool',name:'Read',arg:'src/auth/callback.ts',res:'Read 148 lines'},
 {t:'a',lines:['Found it \u2014 **callback.ts** rebuilds the URL and drops the query string. Two-line fix:']},
 {t:'tool',name:'Update',arg:'src/auth/callback.ts',res:'Updated 2 lines'},
 {t:'diff',rows:[
   {n:142,k:' ',s:'const dest = new URL(target, origin)'},
   {n:143,k:'-',s:'return res.redirect(dest.pathname)'},
   {n:143,k:'+',s:'if (next) dest.searchParams.set("next", next)'},
   {n:144,k:'+',s:'return res.redirect(dest.pathname + dest.search)'}]},
 {t:'tool',name:'Bash',arg:'npm test -- auth',res:'34 passing (2.1s)'},
 {t:'a',lines:['Done \u2014 the \u2039?next\u203a param now survives the OAuth round-trip:','\u2022 **callback.ts** preserves the query string','\u2022 added a regression test in \u2039auth.spec.ts\u203a','All 34 tests pass \u2713']},
 {t:'user',text:'nice \u2014 commit it and open a PR please'},
 {t:'tool',name:'Bash',arg:'git commit -m "fix: preserve ?next through OAuth"',res:'[main 3f2c1d9] 2 files changed'},
 {t:'tool',name:'Bash',arg:'gh pr create --fill'},
 {t:'link',text:'https://github.com/senpex/frontend/pull/512'},
 {t:'a',lines:['**PR #512** is up \u2014 preserving \u2039?next\u203a through the OAuth callback, with a regression test.']},
 {t:'err',text:'API Error: Connection closed mid-response. The response above may be incomplete.'},
 {t:'user',text:'try again'},
 {t:'a',lines:['Retried \u2014 the PR body is complete now. Anything else?']}
];

var TERM_REPLIES=[
 [
  {t:'a',lines:['On it \u2014 checking the failing spec first.']},
  {t:'tool',name:'Bash',arg:'npm test -- checkout',res:'1 failing: total rounds to 2 decimals'},
  {t:'tool',name:'Update',arg:'src/cart/total.ts',res:'Updated 1 line'},
  {t:'diff',rows:[{n:57,k:'-',s:'return (sum * tax).toFixed(1)'},{n:57,k:'+',s:'return (sum * tax).toFixed(2)'}]},
  {t:'tool',name:'Bash',arg:'npm test -- checkout',res:'12 passing (0.9s)'},
  {t:'a',lines:['Fixed \u2014 totals round to **2 decimals** and the suite is green \u2713']}
 ],
 [
  {t:'tool',name:'Search',arg:'glob: "src/**"',res:'Scanned 214 files'},
  {t:'a',lines:['Quick map of the repo:','\u2022 \u2039src/api\u203a \u2014 route handlers (Express)','\u2022 \u2039src/cart\u203a \u2014 pricing + totals','\u2022 \u2039src/auth\u203a \u2014 OAuth callback flow','Hotspot: **cart/total.ts** \u2014 6 of the last 10 bugfixes touched it.']}
 ],
 [
  {t:'tool',name:'Read',arg:'package.json',res:'Read 42 lines'},
  {t:'tool',name:'Bash',arg:'npm run lint --silent',res:'0 errors, 3 warnings'},
  {t:'a',lines:['Lint is clean apart from 3 \u2039no-unused-vars\u203a warnings in tests \u2014 want me to fix those too?']}
 ]
];

function spinSeq(m){var ph=m.phases&&m.phases.length?m.phases:['\u00b7'];return (m.reverseMirror&&ph.length>2)?ph.concat(ph.slice(1,-1).reverse()):ph;}

// makeTerm(host, model, opts) -> handle
// model: {name,colors,umd,verbs,verbFormat,phases,reverseMirror,interval,ib,sl}
// opts:  {label, sub, onSend(text), onInput(text), height}
function makeTerm(host,model,opts){
  opts=opts||{};
  var T={model:model,events:TERM_SEED.slice(),pct:42,sends:0,busy:false,spinning:false,spinStart:0};
  host.innerHTML='';
  var root=document.createElement('div');root.className='xterm';
  root.innerHTML=
    '<div class="xtbar"><div class="xdots"><span class="xdot" style="background:#ff5f57"></span><span class="xdot" style="background:#febc2e"></span><span class="xdot" style="background:#28c840"></span></div>'+
    '<span class="xlabel"></span><span class="xsub"></span><span class="xslot"></span></div>'+
    '<div class="xbody"><div class="xrows"></div><div class="xspin xrow"></div></div>'+
    '<div class="xfoot"><div class="xinbox"><span class="xchev">&gt;</span><input class="xinput" spellcheck="false" autocomplete="off" placeholder="type a message and press enter\u2026"><span class="xtag"></span></div>'+
    '<div class="xstatus"></div><div class="xmode"></div></div>';
  if(opts.height)root.style.height=opts.height;
  host.appendChild(root);
  var q=function(s){return root.querySelector(s);};
  var body=q('.xbody'),rows=q('.xrows'),spinRow=q('.xspin'),input=q('.xinput'),chev=q('.xchev'),
      inbox=q('.xinbox'),status=q('.xstatus'),modeEl=q('.xmode'),label=q('.xlabel'),sub=q('.xsub');
  label.textContent=opts.label||'';
  T.slot=q('.xslot');
  T.input=input;
  root.addEventListener('mousedown',function(e){if(e.target===root||e.target===body)input.focus();});

  function pinned(){return body.scrollHeight-body.scrollTop-body.clientHeight<44;}
  function toBottom(){body.scrollTop=body.scrollHeight;}

  function renderRows(){
    var m=T.model,html='';
    for(var i=0;i<T.events.length;i++)html+=rowHTML(m,T.events[i]);
    rows.innerHTML=html;
  }
  function renderSpin(){
    var m=T.model,c=m.colors;
    var seq=spinSeq(m);
    var ph=seq[T.si%seq.length];
    var verbs=m.verbs&&m.verbs.length?m.verbs:['Working'];
    var v=(m.verbFormat||'{}\u2026 ').split('{}').join(verbs[T.vi%verbs.length]);
    var extra='';
    if(T.spinning){
      var secs=Math.max(1,Math.round((Date.now()-T.spinStart)/1000));
      extra=' \u00b7 '+secs+'s \u00b7 \u2191 '+(secs*137)+' tokens';
    }
    spinRow.innerHTML='<span style="color:'+c.accent+'">'+eH(ph)+' '+eH(v)+'</span><span style="color:'+c.inactive+'">(esc to interrupt'+extra+')</span>';
  }
  function renderChrome(){
    var m=T.model,c=m.colors;
    root.style.background=c.bg;
    root.style.color=c.text;
    sub.textContent=opts.sub||'';
    sub.style.color=c.inactive;
    label.style.color=c.text;
    var ib=m.ib||{};
    if(ib.rb){inbox.style.border='none';inbox.style.padding='2px 4px';}
    else{inbox.style.border='1px solid '+(c.promptBorder||c.inactive);inbox.style.padding='5px 9px';inbox.style.borderRadius='6px';}
    var chevCol=ownKey(CHEV_MAP,ib.ch)?c[CHEV_MAP[ib.ch]]:c.inactive;
    chev.style.color=okColor(chevCol)||c.inactive;
    input.style.color=c.text;
    input.style.caretColor=c.accent;
    var tag=q('.xtag');tag.textContent=m.name||'';tag.style.color=c.inactive;tag.style.borderColor=c.promptBorder||c.inactive;
    status.innerHTML=slHTML(m,T);
    status.style.display=(m.sl&&m.sl.on)?'block':'none';
    modeEl.innerHTML='<span style="color:'+c.permission+'">\u23f5\u23f5 bypass permissions on</span> <span style="color:'+c.inactive+'">(shift+tab to cycle)</span>';
  }
  T.si=0;T.vi=0;
  function restartTimers(){
    if(T._t1)clearInterval(T._t1);
    if(T._t2)clearInterval(T._t2);
    var iv=Math.max(40,Math.min(1000,T.model.interval||120));
    T._t1=setInterval(function(){T.si++;renderSpin();},iv);
    T._t2=setInterval(function(){T.vi++;renderSpin();},2200);
  }
  T.setModel=function(m){T.model=m;renderChrome();renderRows();renderSpin();restartTimers();};
  T.refreshStatus=function(){status.innerHTML=slHTML(T.model,T);};

  function appendEv(ev){var was=pinned();T.events.push(ev);var d=document.createElement('div');d.innerHTML=rowHTML(T.model,ev);while(d.firstChild)rows.appendChild(d.firstChild);if(was)toBottom();}

  T.send=function(text,ri){
    if(T.busy)return false;
    T.busy=true;T.spinning=true;T.spinStart=Date.now();
    appendEv({t:'user',text:text});
    toBottom();renderSpin();
    var reply=TERM_REPLIES[(ri==null?T.sends:ri)%TERM_REPLIES.length];
    var delay=1500+Math.random()*900;
    setTimeout(function(){
      var i=0;
      var step=function(){
        if(i<reply.length){appendEv(reply[i]);i++;setTimeout(step,150+Math.random()*140);}
        else{
          T.spinning=false;T.sends++;T.pct=Math.min(97,T.pct+3);
          T.refreshStatus();renderSpin();T.busy=false;
          if(T._afterSend)T._afterSend();
        }
      };
      step();
    },delay);
    return true;
  };
  T.replay=function(){
    if(T.busy)return false;
    T.busy=true;T.events=[];renderRows();
    T.spinning=false;
    var i=0;
    var step=function(){
      if(i<TERM_SEED.length){
        var ev=TERM_SEED[i];i++;
        appendEv(ev);toBottom();
        setTimeout(step,ev.t==='user'?520:170);
      } else {T.busy=false;}
    };
    step();
  };
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      var t=input.value.trim();
      if(!t)return;
      // Clear the input only once the send is accepted — a refused send (both panes
      // still responding) must leave the user's typed message intact.
      var accepted=opts.onSend?(opts.onSend(t)!==false):(T.send(t)!==false);
      if(accepted){input.value='';if(opts.onInput)opts.onInput('');}
    }
  });
  input.addEventListener('input',function(){if(opts.onInput)opts.onInput(input.value);});
  T.setInput=function(v){input.value=v;};
  T.setSub=function(s){opts.sub=s;sub.textContent=s;};
  T.setModel(model);
  toBottom();
  setTimeout(toBottom,30);
  return T;
}
`;

const TERM_CSS = `
  .xterm{display:flex;flex-direction:column;height:100%;min-height:300px;border-radius:12px;border:1px solid rgba(255,255,255,.08);overflow:hidden;font-family:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;box-shadow:0 14px 44px rgba(0,0,0,.5);}
  .xtbar{display:flex;align-items:center;gap:9px;padding:8px 12px;background:rgba(255,255,255,.055);font-size:12px;flex:none;}
  .xdots{display:flex;gap:6px;}
  .xdot{width:11px;height:11px;border-radius:50%;}
  .xlabel{font-weight:700;letter-spacing:.02em;}
  .xsub{font-size:11px;}
  .xslot{margin-left:auto;display:flex;align-items:center;gap:6px;}
  .xbody{flex:1;overflow-y:auto;overflow-x:hidden;padding:12px 14px 8px;font-size:12.5px;line-height:1.8;scrollbar-width:thin;}
  .xrow{white-space:pre-wrap;word-break:break-word;}
  /* A border row is one terminal row: it must never wrap, and the repeating middle
     has to clip at the pane edge rather than widen the transcript. */
  .xrow.xbord{white-space:pre;overflow:hidden;}
  .xrow.xbord .xbfill{overflow:hidden;flex:1;min-width:0;white-space:pre;}
  .xu{margin:7px 0;}
  .xcode{background:rgba(255,255,255,.09);border-radius:4px;padding:0 5px;}
  .xspin{padding-top:4px;}
  .xfoot{flex:none;padding:6px 12px 9px;}
  .xinbox{display:flex;align-items:center;gap:8px;font-size:12.5px;position:relative;}
  .xchev{flex:none;}
  .xinput{flex:1;background:transparent;border:none;outline:none;font:inherit;font-size:12.5px;padding:2px 0;min-width:0;}
  .xtag{flex:none;font-size:10px;border:1px solid;border-radius:4px;padding:0 6px;opacity:.75;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .xstatus{font-size:11px;padding:7px 2px 0;white-space:nowrap;overflow-x:auto;scrollbar-width:none;}
  .xmode{font-size:11px;padding-top:3px;}
`;

module.exports = {
  TERM_SRC, TERM_CSS,
  SL_SEG_IDS, SL_SEPS, SL_BARS, SL_CTX_FMTS, SL_CTX_BASIS, UMD_STYLES, UMD_BORDERS, IB_CHEVRON_KEYS,
  sanitizeSL, buildUMD, buildInputBox, buildStatuslineScript,
  previewColors, paletteSeedHex, sanePalette, PALETTE_KEYS,
  cleanText, cleanTerm, cleanName, cleanFormat, toRgbStr, clampInt,
};
