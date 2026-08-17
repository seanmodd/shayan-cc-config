// Extract preview palettes for every syntax theme Codex CLI ships — deterministically.
//
// Codex's /theme picker offers 27 syntax-highlighting themes (tui.theme). The preview
// on /codex needs each theme's token colours, and hand-typing 27 palettes is exactly
// how the cmux page's first palette drifted. So nothing here is typed by hand:
//
//   - 22 themes are rendered through `bat`, which embeds the SAME theme set Codex
//     does (both take it from the two-face crate — bat's themes as a library). A
//     sample file with one uniquely-named token per colour role is rendered with
//     COLORTERM=truecolor, and the 24-bit ANSI codes are parsed off each token.
//   - The other 5 are syntect's built-in defaults, which two-face re-exports from
//     the canonical upstream .tmTheme files. Those are fetched from their upstream
//     repos and parsed as XML plists.
//
// Output: api/_codex_themes.js (committed, so this tool only runs when the theme set
// changes). Run with: node tools/extract-codex-syntax-themes.js
//
// A theme is classified light/dark from its plain-foreground luminance: a theme whose
// ordinary text is dark is made for a light terminal.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// One line per colour role, each with a token whose text appears nowhere else.
const SAMPLE = `// commenttok here
const stringvar = "stringtok";
function fntok(argtok) {
  return argtok + 4271;
}
`;

// codex `tui.theme` id  →  bat theme name (null = not in bat; fetched instead).
const BAT_NAMES = {
  'base16': 'base16',
  'base16-256': 'base16-256',
  'base16-eighties-dark': null,
  'base16-mocha-dark': null,
  'base16-ocean-dark': null,
  'base16-ocean-light': null,
  'catppuccin-frappe': 'Catppuccin Frappe',
  'catppuccin-latte': 'Catppuccin Latte',
  'catppuccin-macchiato': 'Catppuccin Macchiato',
  'catppuccin-mocha': 'Catppuccin Mocha',
  'coldark-cold': 'Coldark-Cold',
  'coldark-dark': 'Coldark-Dark',
  'dark-neon': 'DarkNeon',
  'dracula': 'Dracula',
  'github': 'GitHub',
  'gruvbox-dark': 'gruvbox-dark',
  'gruvbox-light': 'gruvbox-light',
  'inspired-github': null,
  'monokai-extended-bright': 'Monokai Extended Bright',
  'monokai-extended-light': 'Monokai Extended Light',
  'monokai-extended-origin': 'Monokai Extended Origin',
  'monokai-extended': 'Monokai Extended',
  'one-half-dark': 'OneHalfDark',
  'one-half-light': 'OneHalfLight',
  'solarized-dark': 'Solarized (dark)',
  'solarized-light': 'Solarized (light)',
  'sublime-snazzy': 'Sublime Snazzy',
  'zenburn': 'zenburn',
};

// The 5 syntect built-ins, from the EXACT submodule commits syntect pins (so these
// are byte-identical to what two-face re-exports and Codex embeds). The base16 four
// live in kkga/spacegray, renamed to SublimeText/Spacegray; syntect pins 2703e93.
const SPACEGRAY = 'https://raw.githubusercontent.com/SublimeText/Spacegray/2703e93f559e212ef3895edd10d861a4383ce93d/';
const TM_URLS = {
  'base16-eighties-dark': SPACEGRAY + 'base16-eighties.dark.tmTheme',
  'base16-mocha-dark': SPACEGRAY + 'base16-mocha.dark.tmTheme',
  'base16-ocean-dark': SPACEGRAY + 'base16-ocean.dark.tmTheme',
  'base16-ocean-light': SPACEGRAY + 'base16-ocean.light.tmTheme',
  'inspired-github': 'https://raw.githubusercontent.com/sethlopezme/InspiredGitHub.tmtheme/master/InspiredGitHub.tmTheme',
};

// Whether a theme is built for a light terminal. Foreground luminance misfires on
// muted dark themes (catppuccin's text is a soft grey-blue), so this is stated per
// theme, from each theme's own name and its published intent — and main() asserts the
// table covers every extracted theme, so a new theme fails the build instead of
// getting a silent guess.
const LIGHT_THEMES = new Set([
  'base16-ocean-light', 'catppuccin-latte', 'coldark-cold', 'github', 'gruvbox-light',
  'inspired-github', 'monokai-extended-light', 'one-half-light', 'solarized-light',
]);

function hex(r, g, b) {
  return '#' + [r, g, b].map(n => (n < 16 ? '0' : '') + Number(n).toString(16)).join('');
}
function relLum(h) {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// ── bat path: parse (colour, text) spans out of truecolor ANSI ────────────────
function spansOf(ansi) {
  const spans = [];
  let color = null;
  // 38;2;R;G;B sets a truecolor fg; 0 resets. Anything printable in between is a span.
  const re = /\x1b\[([0-9;]*)m|([^\x1b]+)/g;
  let m;
  while ((m = re.exec(ansi))) {
    if (m[2] !== undefined) { spans.push({ color, text: m[2] }); continue; }
    const p = m[1].split(';').map(Number);
    if (p[0] === 38 && p[1] === 2) color = hex(p[2], p[3], p[4]);
    else if (p[0] === 0 || m[1] === '') color = null;
  }
  return spans;
}
function fromBat(batName, sampleFile, plainFile) {
  const run = (file, lang) => execFileSync('bat',
    ['--theme=' + batName, '--color=always', '--style=plain', '--language=' + lang, file],
    { encoding: 'utf8', env: { ...process.env, COLORTERM: 'truecolor' } });
  const spans = spansOf(run(sampleFile, 'js'));
  const find = tok => {
    const s = spans.find(x => x.text.includes(tok));
    return s ? s.color : null;
  };
  // Plain text carries no scope, so bat renders it in the theme's global foreground.
  // Punctuation in the JS render is NOT that colour in every theme (catppuccin paints
  // it a muted overlay grey), which is why fg gets its own render.
  const plain = spansOf(run(plainFile, 'txt')).find(x => /\w/.test(x.text));
  return {
    fg: (plain && plain.color) || find(';') || find('{'),
    com: find('commenttok'),
    kw: find('function'),
    kw2: find('return'),
    str: find('stringtok'),
    fn: find('fntok'),
    num: find('4271'),
  };
}

// ── tmTheme path: minimal XML plist reader (dicts, arrays, strings only) ──────
function parsePlist(xml) {
  // Strip prologue and comments, then walk the tags with a cursor.
  const s = xml.replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!DOCTYPE[\s\S]*?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  let i = 0;
  function tag() {
    const m = /<(\/?)([a-z]+)([^>]*)>/.exec(s.slice(i));
    if (!m) return null;
    return { close: !!m[1], name: m[2], selfClose: /\/\s*$/.test(m[3]), at: i + m.index, len: m[0].length };
  }
  function skipTo(t) { i = t.at + t.len; }
  function text(until) {
    const j = s.indexOf(until, i);
    const t = s.slice(i, j);
    i = j + until.length;
    return t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }
  function value() {
    for (;;) {
      const t = tag();
      if (!t) return null;
      skipTo(t);
      if (t.name === 'dict') {
        if (t.selfClose) return {};
        const d = {};
        for (;;) {
          const k = tag();
          if (!k || (k.close && k.name === 'dict')) { if (k) skipTo(k); return d; }
          if (k.name !== 'key') { skipTo(k); continue; }
          skipTo(k);
          const keyName = text('</key>');
          d[keyName] = value();
        }
      }
      if (t.name === 'array') {
        if (t.selfClose) return [];
        const a = [];
        for (;;) {
          const n = tag();
          if (!n || (n.close && n.name === 'array')) { if (n) skipTo(n); return a; }
          a.push(value());
        }
      }
      if (t.name === 'string') return t.selfClose ? '' : text('</string>');
      if (t.name === 'plist') continue;      // unwrap
      // ignore anything else (real tmThemes hold only dict/array/string)
    }
  }
  return value();
}
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'user-agent': 'shayan-cc-config-tools' } }, res => {
      if (res.statusCode !== 200) { reject(new Error(url + ' -> ' + res.statusCode)); return; }
      let b = '';
      res.on('data', c => { b += c; });
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}
function fromTmTheme(xml) {
  const plist = parsePlist(xml);
  const entries = plist.settings || [];
  const global = (entries.find(e => e && e.settings && !e.scope) || {}).settings || {};
  const scopeColor = (...wants) => {
    for (const want of wants) {
      for (const e of entries) {
        if (!e || !e.scope || !e.settings || !e.settings.foreground) continue;
        const scopes = String(e.scope).split(',').map(x => x.trim());
        if (scopes.some(sc => sc === want || sc.startsWith(want + '.') || sc.startsWith(want + ' '))) {
          return e.settings.foreground.toLowerCase().slice(0, 7);
        }
      }
    }
    return null;
  };
  const fg = (global.foreground || '#888888').toLowerCase().slice(0, 7);
  return {
    fg,
    com: scopeColor('comment'),
    kw: scopeColor('storage.type', 'storage', 'keyword'),
    kw2: scopeColor('keyword.control', 'keyword'),
    str: scopeColor('string'),
    fn: scopeColor('entity.name.function', 'entity.name', 'entity'),
    num: scopeColor('constant.numeric', 'constant'),
  };
}

async function main() {
  const sampleFile = path.join(require('os').tmpdir(), 'scc-codex-sample.js');
  const plainFile = path.join(require('os').tmpdir(), 'scc-codex-sample.txt');
  fs.writeFileSync(sampleFile, SAMPLE);
  fs.writeFileSync(plainFile, 'plaintext sample line\n');
  const themes = {};
  const problems = [];
  for (const [id, batName] of Object.entries(BAT_NAMES)) {
    let pal = null;
    try {
      pal = batName ? fromBat(batName, sampleFile, plainFile) : fromTmTheme(await fetchText(TM_URLS[id]));
    } catch (e) {
      problems.push(id + ': ' + e.message);
      continue;
    }
    // A role bat rendered in the terminal's default colour has no ANSI code; fall back
    // to the theme's plain fg so the preview never shows a hole.
    const fg = pal.fg || '#c0c0c0';
    for (const k of ['com', 'kw', 'kw2', 'str', 'fn', 'num']) if (!pal[k]) pal[k] = fg;
    pal.fg = fg;
    pal.light = LIGHT_THEMES.has(id);
    // Guard against a silently wrong classification, with a band for muted themes:
    // measured, light themes' text sits at 0.01-0.19 luminance and dark themes' at
    // 0.28+ (solarized-dark's #839496 is the darkest dark-theme text in the set).
    const lum = relLum(fg);
    if ((pal.light && lum > 0.25) || (!pal.light && lum < 0.25)) {
      problems.push(id + ': light=' + pal.light + ' but fg ' + fg + ' (lum ' + lum.toFixed(2) + ') says otherwise');
    }
    themes[id] = pal;
  }
  if (problems.length) {
    console.error('extraction problems:\n  ' + problems.join('\n  '));
  }
  const ids = Object.keys(themes).sort();
  const body = ids.map(id => `  '${id}': ${JSON.stringify(themes[id])},`).join('\n');
  const out = `// GENERATED by tools/extract-codex-syntax-themes.js — do not edit by hand.
//
// Token colours for every syntax theme Codex CLI 0.147.0 ships (tui.theme). The 22
// bat-overlapping themes were rendered through bat with COLORTERM=truecolor and the
// colours parsed off the ANSI output; the 5 syntect built-ins were parsed from their
// canonical upstream .tmTheme files. Both bat and Codex embed this theme set from the
// two-face crate, so these are the colours Codex actually renders.
//
// fg    plain text          com  comments            kw   storage keywords (function/const)
// kw2   control keywords    str  strings             fn   function names
// num   numbers             light  made for a light terminal (fg is dark)

const CODEX_SYNTAX = {
${body}
};

module.exports = { CODEX_SYNTAX };
`;
  fs.writeFileSync(path.join(__dirname, '..', 'api', '_codex_themes.js'), out);
  console.log('wrote api/_codex_themes.js with ' + ids.length + ' themes'
    + (problems.length ? ' (' + problems.length + ' failed)' : ''));
}

if (require.main === module) main();
