// Differential test: what the STUDIO client computes for a payload vs what the
// server actually installs for the same payload. Evaluates the real rendered client
// functions (stateFromPayload/afterModel) in Node with the DOM parts stubbed out.
const path = require('path');
const ROOT = __dirname;
const handler = require(path.join(ROOT, 'api/index.js'));
const { CLIENT_LIB } = require(path.join(ROOT, 'api/_render.js'));
const { TERM_SRC } = require(path.join(ROOT, 'api/_term.js'));
const { STARTERS } = require(path.join(ROOT, 'api/_theme.js'));

// Pull the studio's pure state functions out of the rendered page (no DOM needed).
const page = (() => {
  let out = '';
  handler({ url: '/customize', headers: { host: 'x' } }, { statusCode: 200, setHeader() {}, end(b) { out = String(b); } });
  return out;
})();
const studioSrc = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const slice = name => {
  const start = studioSrc.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('missing ' + name);
  // walk braces to the end of the function
  let i = studioSrc.indexOf('{', start), depth = 0;
  for (; i < studioSrc.length; i++) {
    if (studioSrc[i] === '{') depth++;
    else if (studioSrc[i] === '}') { depth--; if (!depth) return studioSrc.slice(start, i + 1); }
  }
  throw new Error('unbalanced ' + name);
};

// Only the STUDIO's own functions are sliced out; the shared helpers (sanePal,
// mapPreview, expandPalette) are passed in from CLIENT_LIB so they keep their
// own closure state (PAL_FALLBACK etc.).
const PURE = ['defaultState', 'stateFromPayload', 'afterModel', 'payload', 'shortId', 'hx', 'toRGBarr', 'hexToRgbStr', 'okHex', 'copyObj'];
const bodies = PURE.map(n => slice(n));
const consts = studioSrc.match(/var STATUS_COLORS=[\s\S]*?var state=null;/)[0];

// SL_SEG_META / SL_SEPLIST / SL_BARSETS / ownKey live in TERM_SRC; grab them the same way.
const termEnv = new Function(`${TERM_SRC.match(/var SL_SEG_META=[\s\S]*?function barsOf\(k\)\{[^}]*\}/)[0]}
  return { SL_SEG_META, SL_SEPLIST, SL_BARSETS, ownKey };`)();

const libEnv = new Function('window', 'location', 'localStorage', 'document', CLIENT_LIB + '\n;return {sanePal, mapPreview, expandPalette};')(
  {}, { origin: 'http://x' }, { getItem: () => null, setItem() {} }, { querySelector: () => null });

// Re-declare the studio functions with the library helpers in scope.
const studio = new Function('STARTERS', 'SL_SEG_META', 'SL_SEPLIST', 'SL_BARSETS', 'ownKey', 'sanePal', 'mapPreview', 'expandPalette', `
  ${consts}
  ${bodies.join('\n')}
  return { defaultState: defaultState, fromPayload: stateFromPayload, render: function(st){ state = st; return { after: afterModel(), out: payload() }; } };
`)(STARTERS, termEnv.SL_SEG_META, termEnv.SL_SEPLIST, termEnv.SL_BARSETS, termEnv.ownKey, libEnv.sanePal, libEnv.mapPreview, libEnv.expandPalette);

const b64e = o => Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const serverConfig = pl => {
  let out = '';
  handler({ url: '/config.json?c=' + encodeURIComponent(b64e(pl)), headers: { host: 'x' } },
    { statusCode: 200, setHeader() {}, end(b) { out = String(b); } });
  return JSON.parse(out);
};
const serverHasStatusline = pl => {
  let out = '';
  handler({ url: '/apply.sh?c=' + encodeURIComponent(b64e(pl)), headers: { host: 'x' } },
    { statusCode: 200, setHeader() {}, end(b) { out = String(b); } });
  return out.includes('statusline-shayan.js');
};

const PAL = JSON.parse(JSON.stringify(STARTERS['tokyo-night']));
const BORDERS = ['none', 'single', 'round', 'double', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'topBottomSingle', 'topBottomDouble', 'topBottomBold'];
const STYLES = ['bold', 'italic', 'underline', 'strikethrough', 'inverse'];

// Deterministic pseudo-random so failures are reproducible.
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];

const cases = [];
// legacy payloads (no um/ib/sl/iv at all) for every border style
for (const ub of BORDERS) cases.push({ label: 'legacy ub=' + ub, pl: { n: 'L', s: 'blue', p: PAL, vf: '{}… ', vv: ['A'], ph: ['.'], rm: true, ub, uc: 'rgb(1,2,3)', id: 'x' } });
// randomized v2 payloads
for (let i = 0; i < 24; i++) {
  const ub = pick(BORDERS);
  const st = STYLES.filter(() => rnd() < 0.35);
  const segAll = termEnv.SL_SEG_META.map(s => s.id);
  const seg = segAll.filter(() => rnd() < 0.45);
  cases.push({
    label: 'rand#' + i + ' ub=' + ub + ' seg=' + seg.length,
    pl: {
      n: 'R' + i, s: 'blue', p: PAL,
      vf: rnd() < 0.2 ? 'no-placeholder' : '{}… ',
      vv: rnd() < 0.15 ? [] : ['A', 'B'],
      ph: rnd() < 0.15 ? [] : ['.', 'o'],
      rm: rnd() < 0.5, iv: Math.floor(40 + rnd() * 400),
      ub, uc: 'rgb(9,9,9)',
      um: {
        f: rnd() < 0.2 ? 'bad' : ' > {} ', st,
        fg: rnd() < 0.4 ? '#ff0000' : (rnd() < 0.5 ? 'notahex' : ''),
        bg: rnd() < 0.3 ? '#00ff00' : '',
        px: Math.floor(rnd() * 7) - 1, py: Math.floor(rnd() * 4) - 1,
        fit: rnd() < 0.5,
      },
      ib: { rb: rnd() < 0.5, ch: pick(['', 'planMode', 'bogus', 'constructor']) },
      sl: { on: rnd() < 0.8, seg, sep: pick(termEnv.SL_SEPLIST.concat(['bogus'])), em: rnd() < 0.5, bar: pick(['blocks', 'shade', 'constructor', '__proto__']), ctxFmt: pick(['pct', 'pct-of', 'tokens', 'bad']), text: rnd() < 0.3 ? 'hi' : '' },
      id: 'r' + i,
    },
  });
}

let bad = 0;
for (const c of cases) {
  const st = studio.fromPayload(c.pl);
  const { after, out } = studio.render(st);
  const cfg = serverConfig(out);          // server sees what the studio would hand out
  const cfgDirect = serverConfig(c.pl);   // server sees the original link
  const problems = [];

  const eq = (what, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`${what}:\n      A ${JSON.stringify(a)}\n      B ${JSON.stringify(b)}`); };
  eq('umd.format', after.umd.format, cfg.userMessageDisplay.format);
  eq('umd.paddingX', after.umd.paddingX, cfg.userMessageDisplay.paddingX);
  eq('umd.paddingY', after.umd.paddingY, cfg.userMessageDisplay.paddingY);
  eq('umd.fit', after.umd.fitBoxToContent, cfg.userMessageDisplay.fitBoxToContent);
  eq('umd.border', after.umd.borderStyle, cfg.userMessageDisplay.borderStyle);
  eq('umd.styling', after.umd.styling, cfg.userMessageDisplay.styling);
  eq('umd.fg', after.umd.foregroundColor, cfg.userMessageDisplay.foregroundColor);
  eq('umd.bg', after.umd.backgroundColor, cfg.userMessageDisplay.backgroundColor);
  eq('verbs', after.verbs, cfg.thinkingVerbs.verbs);
  eq('verbFormat', after.verbFormat, cfg.thinkingVerbs.format);
  eq('phases', after.phases, cfg.thinkingStyle.phases);
  eq('interval', after.interval, cfg.thinkingStyle.updateInterval);
  eq('reverseMirror', after.reverseMirror, cfg.thinkingStyle.reverseMirror);
  const wantIB = after.ib.rb || after.ib.ch;
  eq('inputBox present', !!wantIB, 'inputBox' in cfg);
  // status line: preview shows it exactly when the installer writes one
  eq('statusline installed', after.sl.on, serverHasStatusline(out));
  // and the original link must agree with the re-emitted payload (round-trip stable)
  eq('roundtrip umd', cfgDirect.userMessageDisplay, cfg.userMessageDisplay);
  eq('roundtrip verbs', cfgDirect.thinkingVerbs, cfg.thinkingVerbs);
  eq('roundtrip style', cfgDirect.thinkingStyle, cfg.thinkingStyle);

  if (problems.length) { bad++; console.log('\n✗ ' + c.label); problems.forEach(p => console.log('    ' + p)); }
}
console.log('\n' + (bad ? `✗ ${bad}/${cases.length} cases diverge` : `✓ all ${cases.length} cases: preview matches install`));
process.exit(bad ? 1 : 0);
