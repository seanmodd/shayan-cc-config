// Read Ghostty theme files out of the installed cmux bundle and emit the palette
// data api/_cmux_presets.js needs.
//
// Why a script and not hand-transcribed values: each theme is 19 hex colours, the
// preview has to match what the terminal will actually render, and a single wrong
// digit is invisible in review. Run it, paste the output, and the numbers are the
// machine's rather than anyone's memory.
//
//   node tools/extract-ghostty-themes.js                 # the shipped preset list
//   node tools/extract-ghostty-themes.js Dracula Nord     # arbitrary theme names
//   node tools/extract-ghostty-themes.js --list           # every theme available
//
// The theme file format (Ghostty's own):
//   palette = 0=#21222c   … through 15
//   background = #282a36
//   foreground = #f8f8f2
//   selection-background = #44475a

const fs = require('fs');
const path = require('path');

const DIRS = [
  '/Applications/cmux.app/Contents/Resources/ghostty/themes',
  '/Applications/Ghostty.app/Contents/Resources/ghostty/themes',
];

// The themes shipped as community presets. Names are the exact filenames.
const SHIPPED = [
  'Dracula', 'Nord', 'TokyoNight Storm', 'Catppuccin Mocha', 'Gruvbox Dark Hard',
  'Rose Pine', 'Everforest Dark Hard', 'Kanagawa Wave', 'Atom One Dark',
  'Solarized Dark Patched', 'Ayu Mirage', 'GitHub Dark Default', 'Monokai Pro',
  'Oxocarbon', 'Melange Dark', 'Iceberg Dark', 'Flexoki Dark', 'Andromeda',
];

function themesDir() {
  const d = DIRS.find(x => { try { return fs.statSync(x).isDirectory(); } catch (e) { return false; } });
  if (!d) {
    console.error('No Ghostty themes directory found. Looked in:\n  ' + DIRS.join('\n  '));
    process.exit(1);
  }
  return d;
}

const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => '#' + c.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');

/** sRGB relative luminance, per WCAG. */
function lum(rgb) {
  const [r, g, b] = rgb.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function parseTheme(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const out = { palette: [] };
  for (const raw of txt.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key === 'palette') {
      const m = /^(\d+)\s*=\s*(#?[0-9a-fA-F]{6})$/.exec(val);
      if (m) out.palette[Number(m[1])] = '#' + m[2].replace('#', '').toLowerCase();
    } else {
      out[key] = val.startsWith('#') ? val.toLowerCase() : val;
    }
  }
  return out;
}

/**
 * Map a Ghostty theme onto the 14 palette keys the rest of the site uses.
 *
 * Fixed rules, applied to every theme identically, so no theme gets hand-tuned
 * special treatment that the next one silently misses:
 *   subtle  = ANSI 0. It draws pane borders and dividers, so it has to be visible
 *             against the background; when ANSI 0 IS effectively the background
 *             (several themes do this) it gets nudged toward the foreground until
 *             it clears a 1.25:1 contrast ratio, or the borders vanish.
 *   comment = ANSI 8, the conventional "dimmed text" slot.
 *   raised  = selection-background when there is one, else ANSI 0 lifted 18%
 *             toward the foreground.
 *   accent  = ANSI 4 unless ACCENT_OVERRIDE names the hue the theme is known for.
 */
// Which ANSI slot is the colour a person would name if asked "what colour IS this
// theme". Checked against each theme's own published identity, not guessed from the
// numbers: Dracula's is the purple at slot 4, not the pink at 5; Gruvbox's is the
// warm yellow; Everforest's is the green in its name.
const ACCENT_OVERRIDE = {
  Dracula: 4,                  // #bd93f9, the purple
  'Gruvbox Dark Hard': 3,      // the warm yellow, not the blue
  'Gruvbox Light Hard': 3,
  'Rose Pine': 5,              // rose
  'Rose Pine Dawn': 5,
  'Rose Pine Moon': 5,
  'Everforest Dark Hard': 2,   // green, it is in the name
  'Everforest Light Med': 2,
  'Monokai Pro': 5,            // magenta
  Andromeda: 6,                // cyan
  'Melange Dark': 3,           // warm sand
  'Melange Light': 3,
  'Flexoki Dark': 3,           // ochre
  'Flexoki Light': 3,
};

/** Hue in degrees, 0 = red, 120 = green, 240 = blue. */
function hue(rgb) {
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const sat = rgb => {
  const m = Math.max(...rgb) / 255, n = Math.min(...rgb) / 255;
  return m === 0 ? 0 : (m - n) / m;
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Rotate a colour's hue toward `targetHue` and add `dSat` saturation, keeping its
 * lightness. Used to derive an orange from a theme's own yellow, so the result still
 * belongs to the theme instead of being a constant pasted in.
 */
function rotateToward(rgb, targetHue, dSat) {
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const s2 = Math.max(0, Math.min(1, s + dSat));
  const h = targetHue / 360;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s2 === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s2) : l + s2 - l * s2;
  const pp = 2 * l - q;
  return [hue2rgb(pp, q, h + 1 / 3), hue2rgb(pp, q, h), hue2rgb(pp, q, h - 1 / 3)]
    .map(v => v * 255);
}

function toSitePalette(t, name) {
  const P = i => hex2rgb(t.palette[i] || '#808080');
  const bg = hex2rgb(t.background || '#000000');
  const text = hex2rgb(t.foreground || '#ffffff');

  // ANSI 0 is the border colour. Several themes set it to the background, which
  // would make every pane border invisible, so lift it until it is actually a line.
  let subtle = P(0);
  for (let i = 0; i < 24 && contrast(subtle, bg) < 1.25; i++) subtle = mix(subtle, text, 0.12);

  const accentIdx = Object.prototype.hasOwnProperty.call(ACCENT_OVERRIDE, name)
    ? ACCENT_OVERRIDE[name] : 4;
  const accent = P(accentIdx);

  // accent2 must not duplicate accent, or the two "signature" colours on the page
  // render identically and the palette looks broken. Walk the candidates in order of
  // how well they read as a secondary accent.
  let accent2 = [5, 13, 6, 4, 12].map(P).find(c => !same(c, accent)) || P(5);

  // Orange is not an ANSI slot, and most of these themes genuinely have no orange in
  // their 16: their real orange (TokyoNight's #ff9e64, Catppuccin's peach) lives in an
  // extended palette Ghostty theme files do not carry. Taking whichever slot is
  // "closest to orange" therefore lands on the yellow in 8 of 10 cases, and shipping
  // yellow twice makes the palette look broken.
  //
  // So derive it: rotate the theme's own yellow toward red and lift the chroma a
  // little. The result is orange, is distinct from the yellow it came from, and is
  // still made of the theme's own colour rather than a constant bolted on.
  const yellow = P(3);
  const orange = [9, 11].map(P).find(c => sat(c) > 0.3 && hue(c) >= 18 && hue(c) <= 38 && !same(c, yellow))
    || rotateToward(yellow, 26, 0.08);

  return {
    bg,
    raised: t['selection-background'] ? hex2rgb(t['selection-background']) : mix(P(0), text, 0.18),
    text,
    comment: P(8),
    subtle,
    accent,
    accent2,
    cyan: P(6),
    green: P(2),
    red: P(1),
    orange,
    yellow,
    pink: P(13),
    blue: P(4),
  };
}

const KEYS = ['bg', 'raised', 'text', 'comment', 'subtle', 'accent', 'accent2',
  'cyan', 'green', 'red', 'orange', 'yellow', 'pink', 'blue'];

function main() {
  const dir = themesDir();
  const args = process.argv.slice(2);

  if (args[0] === '--list') {
    console.log(fs.readdirSync(dir).sort().join('\n'));
    return;
  }

  const names = args.length ? args : SHIPPED;
  const available = new Set(fs.readdirSync(dir));
  const rows = [];

  for (const name of names) {
    if (!available.has(name)) {
      console.error('MISSING: ' + name + '   (not in ' + dir + ')');
      continue;
    }
    const t = parseTheme(path.join(dir, name));
    const pal = toSitePalette(t, name);
    const missing = KEYS.filter(k => !Array.isArray(pal[k]) || pal[k].length !== 3);
    if (missing.length) { console.error('INCOMPLETE: ' + name + ' missing ' + missing.join(',')); continue; }

    const rounded = {};
    for (const k of KEYS) rounded[k] = pal[k].map(n => Math.max(0, Math.min(255, Math.round(n))));

    rows.push({
      name,
      dark: lum(rounded.bg) < 0.5,
      contrastText: contrast(rounded.text, rounded.bg),
      contrastComment: contrast(rounded.comment, rounded.bg),
      contrastBorder: contrast(rounded.subtle, rounded.bg),
      pal: rounded,
      ansi: t.palette.slice(0, 16),
      bgHex: rgb2hex(rounded.bg),
      fgHex: rgb2hex(rounded.text),
    });
  }

  if (process.env.SCC_FORMAT === 'report') {
    console.log('theme                       dark   text    comment  border');
    for (const r of rows) {
      console.log(r.name.padEnd(26)
        + ' ' + (r.dark ? 'dark ' : 'light')
        + '  ' + r.contrastText.toFixed(2).padStart(5) + ':1'
        + '  ' + r.contrastComment.toFixed(2).padStart(5) + ':1'
        + '  ' + r.contrastBorder.toFixed(2).padStart(5) + ':1'
        + (r.contrastText < 4.5 ? '   <- text under 4.5' : '')
        + (r.contrastComment < 3 ? '   <- comment under 3' : ''));
    }
    return;
  }

  // Pasteable into api/_cmux_presets.js.
  for (const r of rows) {
    const pal = KEYS.map(k => k + ':[' + r.pal[k].join(',') + ']').join(', ');
    console.log('  // ' + r.name + ' — ' + (r.dark ? 'dark' : 'light')
      + ', text ' + r.contrastText.toFixed(1) + ':1, comment ' + r.contrastComment.toFixed(1) + ':1');
    console.log('  ' + JSON.stringify(r.name) + ': { ' + pal + ' },');
  }
}

// Only when run as a script: test.js requires this module for its palette-drift
// check, and printing the whole table into the test output made it unreadable.
if (require.main === module) main();

module.exports = { parseTheme, toSitePalette, contrast, lum, KEYS, SHIPPED };
