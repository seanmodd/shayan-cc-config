// Smoke tests for shayan-cc-config — run with: node test.js
//
// Exercises every route through the real handler, syntax-checks the client JS the
// browser actually receives, bash -n's (and in places runs) the generated shell
// scripts against a sandboxed HOME, and executes the generated status-line script
// against fake transcripts. The "regression fixes" section pins the security and
// preview/install-parity bugs found in review so they cannot come back.
//
// Every payload marked EVIL/hostile stands in for an attacker-supplied share link:
// ?c= and ?shared= are fully user-controlled.
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = __dirname;
const handler = require(path.join(ROOT, 'api/index.js'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'scc-smoke-'));

let failures = 0;
const ok = (cond, label, extra) => {
  if (cond) console.log('  ✓ ' + label);
  else { failures++; console.log('  ✗ ' + label + (extra ? ' — ' + extra : '')); }
};

function call(url) {
  return new Promise(resolve => {
    const req = { url, headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' } };
    let body = '';
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(b) { body = b || ''; resolve({ status: this.statusCode, headers: this.headers, body: String(body) }); },
    };
    handler(req, res);
  });
}

const b64e = o => Buffer.from(JSON.stringify(o), 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const PALETTE = {
  bg: [26, 27, 38], raised: [41, 46, 66], text: [192, 202, 245], comment: [86, 95, 137],
  subtle: [48, 52, 70], accent: [122, 162, 247], accent2: [187, 154, 247], cyan: [125, 207, 255],
  green: [158, 206, 106], red: [247, 118, 142], orange: [255, 158, 100], yellow: [224, 175, 104],
  pink: [187, 154, 247], blue: [122, 162, 247],
};
const LEGACY = { n: 'Legacy One', s: 'teal', p: PALETTE, vf: '{}… ', vv: ['Zooming'], ph: ['·', '✶'], rm: true, ub: 'round', uc: 'rgb(122,162,247)', id: 'abc' };
const V2 = {
  ...LEGACY, n: 'V2 Setup', iv: 90,
  um: { f: ' ❯ {} ', st: ['bold', 'italic', 'nonsense'], fg: '#ff0000', bg: '', px: 2, py: 1, fit: true },
  ib: { rb: true, ch: 'planMode' },
  sl: { on: true, seg: ['model', 'dir', 'git', 'ctx', 'cost', 'lines', 'clock', 'text', 'bogus'], sep: ' · ', em: true, bar: 'shade', ctxFmt: 'tokens', text: 'hi there' },
};
const EVIL = {
  n: "evil'\n\"; rm -rf ~; echo `pwn` $(x) \\ <script>alert(1)</script>", s: 'red; rm -rf /',
  p: PALETTE, vv: ["ok'\nSHAYAN_SL_EOF\n"], ph: ['·'], ub: 'round', uc: 'red;"></span><img src=x onerror=alert(1)>',
  um: { f: 'no placeholder', st: ['bold'], fg: 'javascript:alert(1)', bg: '#zzzzzz', px: 99, py: -5 },
  sl: { on: true, seg: ['model', 'text'], sep: '"; rm -rf ~; "', em: true, bar: 'x', ctxFmt: 'x', text: "pwn'\nSHAYAN_SL_EOF\nrm -rf ~" },
};

function extractScripts(html) {
  const out = [];
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}
function nodeCheck(src, label) {
  const f = path.join(TMP, label.replace(/[^a-z0-9]/gi, '_') + '.js');
  fs.writeFileSync(f, src);
  const r = cp.spawnSync('node', ['--check', f], { encoding: 'utf8' });
  ok(r.status === 0, 'js syntax: ' + label, r.stderr && r.stderr.split('\n').slice(0, 3).join(' '));
}
function bashCheck(src, label) {
  const f = path.join(TMP, label.replace(/[^a-z0-9]/gi, '_') + '.sh');
  fs.writeFileSync(f, src);
  const r = cp.spawnSync('bash', ['-n', f], { encoding: 'utf8' });
  ok(r.status === 0, 'bash -n: ' + label, r.stderr && r.stderr.split('\n').slice(0, 3).join(' '));
}

(async () => {
  console.log('— pages —');
  for (const p of ['/', '/customize']) {
    const r = await call(p);
    ok(r.status === 200, 'GET ' + p + ' → 200');
    ok(!r.body.includes('${'), p + ' has no unresolved ${} leftovers');
    extractScripts(r.body).forEach((s, i) => nodeCheck(s, p + '_script' + i));
  }

  console.log('— json/config —');
  let r = await call('/api/presets');
  ok(r.status === 200 && JSON.parse(r.body).presets.length === 11, '/api/presets 11 presets');
  r = await call('/config/tokyo-night.json');
  ok(r.status === 200 && JSON.parse(r.body).themes.length >= 1, '/config/tokyo-night.json');
  r = await call('/list.txt');
  ok(r.status === 200 && r.body.trim().split('\n').length === 11, '/list.txt');

  r = await call('/config.json?c=' + encodeURIComponent(b64e(LEGACY)));
  let j = JSON.parse(r.body);
  ok(r.status === 200, 'legacy config.json 200');
  ok(j.userMessageDisplay.borderStyle === 'round' && j.userMessageDisplay.format === ' {} ' && j.userMessageDisplay.fitBoxToContent === true, 'legacy umd matches old behavior', JSON.stringify(j.userMessageDisplay));
  ok(j.thinkingStyle.updateInterval === 120, 'legacy interval default 120');
  ok(!('inputBox' in j), 'legacy has no inputBox key');

  r = await call('/config.json?c=' + encodeURIComponent(b64e(V2)));
  j = JSON.parse(r.body);
  ok(j.userMessageDisplay.format === ' ❯ {} ', 'v2 umd format');
  ok(JSON.stringify(j.userMessageDisplay.styling) === '["bold","italic"]', 'v2 styling whitelisted', JSON.stringify(j.userMessageDisplay.styling));
  ok(j.userMessageDisplay.foregroundColor === 'rgb(255,0,0)', 'v2 fg hex→rgb');
  ok(j.userMessageDisplay.backgroundColor === null, 'v2 empty bg → null');
  ok(j.userMessageDisplay.paddingX === 2 && j.userMessageDisplay.paddingY === 1, 'v2 padding');
  ok(j.thinkingStyle.updateInterval === 90, 'v2 interval');
  ok(j.inputBox && j.inputBox.removeBorder === true && j.inputBox.chevronIdleThemeColor === 'planMode', 'v2 inputBox', JSON.stringify(j.inputBox));

  r = await call('/config.json?c=' + encodeURIComponent(b64e(EVIL)));
  j = JSON.parse(r.body);
  ok(j.userMessageDisplay.format === ' {} ', 'evil umd format falls back');
  ok(j.userMessageDisplay.foregroundColor === 'default', 'evil fg rejected');
  ok(j.userMessageDisplay.paddingX <= 4 && j.userMessageDisplay.paddingY >= 0, 'evil padding clamped');
  ok(/^[\p{L}\p{N}\p{Emoji_Presentation} ._,:!?+()#@\u00d7\u2013\u2014-]*$/u.test(j.themes[0].name) && !/[;<>`$'"\\]/.test(j.themes[0].name), 'evil theme name cleaned', JSON.stringify(j.themes[0].name));

  console.log('— apply scripts —');
  r = await call('/apply/tokyo-night.sh');
  ok(r.status === 200, 'preset apply 200');
  bashCheck(r.body, 'preset_apply');

  r = await call('/apply.sh?c=' + encodeURIComponent(b64e(V2)));
  ok(r.status === 200, 'custom v2 apply 200');
  ok(r.body.includes('statusline-shayan.js'), 'v2 apply installs statusline');
  bashCheck(r.body, 'v2_apply');

  r = await call('/apply.sh?c=' + encodeURIComponent(b64e(LEGACY)));
  ok(!r.body.includes('statusline-shayan.js'), 'legacy apply has no statusline block');
  bashCheck(r.body, 'legacy_apply');

  r = await call('/apply.sh?c=' + encodeURIComponent(b64e(EVIL)));
  ok(r.status === 200, 'evil apply 200');
  const { cleanName } = require(path.join(ROOT, 'api/_term.js'));
  const cn = cleanName(EVIL.n, 60);
  ok(!/[`;<>|&$'"\\\n\r]/.test(cn), 'evil name sanitized to shell-inert text', JSON.stringify(cn));
  ok(r.body.includes(cn), 'evil apply embeds only the sanitized name');
  ok(!r.body.includes('`pwn`') && !r.body.includes('$(x)'), 'evil apply: no command substitution survives');
  bashCheck(r.body, 'evil_apply');
  // heredoc integrity: the statusline heredoc must contain exactly one terminator line
  const marks = r.body.split('\n').filter(l => l.trim() === 'SHAYAN_SL_EOF').length;
  ok(marks === (r.body.includes('SHAYAN_SL_EOF') ? 1 : 0) || marks === 1, 'evil apply: single heredoc terminator', 'found ' + marks);

  console.log('— statusline script —');
  r = await call('/statusline.js?c=' + encodeURIComponent(b64e(V2)));
  ok(r.status === 200, 'statusline.js 200');
  const slFile = path.join(TMP, 'sl.js');
  fs.writeFileSync(slFile, r.body);
  nodeCheck(r.body, 'statusline_script');

  // fake transcript with usage
  const tr = path.join(TMP, 'transcript.jsonl');
  fs.writeFileSync(tr, [
    JSON.stringify({ type: 'user', message: { content: 'hi' } }),
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1200, cache_read_input_tokens: 38000, cache_creation_input_tokens: 900, output_tokens: 450 } } }),
  ].join('\n') + '\n');
  const stdinJSON = JSON.stringify({
    session_id: 'x', transcript_path: tr, cwd: ROOT,
    model: { id: 'claude-opus-5', display_name: 'Opus 5' },
    workspace: { current_dir: ROOT, project_dir: ROOT },
    version: '2.1.12', output_style: { name: 'default' },
    cost: { total_cost_usd: 0.4321, total_duration_ms: 2280000, total_lines_added: 214, total_lines_removed: 58 },
  });
  const run = cp.spawnSync('node', [slFile], { input: stdinJSON, encoding: 'utf8', timeout: 5000 });
  ok(run.status === 0, 'statusline runs', run.stderr);
  const plain = (run.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  console.log('    output: ' + JSON.stringify(run.stdout && run.stdout.slice(0, 160)));
  console.log('    plain : ' + plain);
  ok(plain.includes('Opus 5'), 'sl: model name');
  ok(plain.includes('shayan-cc-config'), 'sl: dir');
  const curBranch = cp.execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  ok(plain.includes(curBranch), 'sl: git branch (' + curBranch + ')', plain);
  ok(/\d+k\/200k/.test(plain), 'sl: tokens fmt');
  ok(plain.includes('$0.43'), 'sl: cost');
  ok(plain.includes('+214/-58'), 'sl: lines');
  ok(plain.includes('hi there'), 'sl: custom text');

  // statusline with missing/empty inputs should not crash
  const run2 = cp.spawnSync('node', [slFile], { input: '{}', encoding: 'utf8', timeout: 5000 });
  ok(run2.status === 0, 'statusline tolerates empty json', run2.stderr);
  const run3 = cp.spawnSync('node', [slFile], { input: 'not json', encoding: 'utf8', timeout: 5000 });
  ok(run3.status === 0, 'statusline tolerates garbage stdin', run3.stderr);

  // evil payload statusline still safe + syntactically valid
  r = await call('/statusline.js?c=' + encodeURIComponent(b64e(EVIL)));
  ok(r.status === 200, 'evil statusline.js 200');
  nodeCheck(r.body, 'evil_statusline');
  ok(!r.body.includes('rm -rf'), 'evil statusline has no injection text');

  console.log('— regression fixes —');
  // XSS: hostile palette must never reach a style attribute
  const XSSPAL = { ...PALETTE, text: ['0)"><img src=x onerror="window.__X=1"><span data-z="', 0, 0], accent: 'rgb(1,2,3);evil' };
  const home = (await call('/')).body;
  const { sanePalette, cleanTerm, cleanFormat } = require(path.join(ROOT, 'api/_term.js'));
  const sp = sanePalette(XSSPAL);
  ok(Array.isArray(sp.text) && sp.text.every(n => typeof n === 'number'), 'sanePalette coerces hostile triple', JSON.stringify(sp.text));
  ok(Array.isArray(sp.accent) && sp.accent.length === 3, 'sanePalette replaces non-array entry', JSON.stringify(sp.accent));
  ok(home.includes('function sanePal('), 'homepage ships client palette sanitizer');
  ok(home.includes('expandPalette(sanePal(pl.p))'), 'customToModel sanitizes palette before expanding');
  ok(/mapPreview[\s\S]{0,400}okColor/.test(home), 'mapPreview coerces colors through okColor');
  // Exercise the real client library (the exact source the browser receives) against
  // the hostile payload. CLIENT_LIB is pure function declarations, so evaluating it
  // standalone is safe; the page's boot code (HOME_JS) is deliberately excluded.
  const { CLIENT_LIB } = require(path.join(ROOT, 'api/_render.js'));
  ok(home.includes(CLIENT_LIB), 'rendered homepage embeds CLIENT_LIB verbatim');
  const sandbox = { location: { origin: 'http://x' }, localStorage: { getItem: () => null, setItem() {} }, document: { querySelector: () => null } };
  const lib = new Function('window', 'location', 'localStorage', 'document',
    CLIENT_LIB + '\n;return {customToModel:customToModel, mapPreview:mapPreview, sanePal:sanePal};')(
    sandbox, sandbox.location, sandbox.localStorage, sandbox.document);
  const model = lib.customToModel({ n: 'x', p: XSSPAL, vv: ['a'], ph: ['.'], uc: 'red;"><img src=y>' });
  const badColor = Object.entries(model.colors).find(([, v]) => /[<>"']/.test(String(v)));
  ok(!badColor, 'no preview color can escape a style attribute', badColor && JSON.stringify(badColor));
  ok(!/[<>"']/.test(model.umd.borderColor), 'borderColor validated', model.umd.borderColor);

  // sl.bar prototype-key bypass
  const PROTO = { ...LEGACY, sl: { on: true, seg: ['ctx', 'model'], bar: 'constructor', ctxFmt: 'pct', sep: ' | ', em: true, text: '' } };
  r = await call('/statusline.js?c=' + encodeURIComponent(b64e(PROTO)));
  ok(r.status === 200, 'proto-key statusline 200');
  const protoFile = path.join(TMP, 'proto-sl.js');
  fs.writeFileSync(protoFile, r.body);
  const cfgB64 = /Buffer\.from\('([A-Za-z0-9+/=]+)'/.exec(r.body);
  const protoCfg = JSON.parse(Buffer.from(cfgB64[1], 'base64').toString('utf8'));
  ok(Array.isArray(protoCfg.barChars) && protoCfg.barChars.length === 2, 'proto-key falls back to real barChars', JSON.stringify(protoCfg.barChars));
  const protoRun = cp.spawnSync('node', [protoFile], { input: stdinJSON, encoding: 'utf8', timeout: 5000 });
  const protoPlain = (protoRun.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  ok(!protoPlain.includes('statusline error'), 'proto-key statusline renders without error', protoPlain);
  ok(/[▮▯]/.test(protoPlain), 'proto-key statusline draws a bar', protoPlain);

  // terminal-control injection into verbs/phases/formats
  const ESCP = { ...LEGACY, vf: '{}\x1b[2J', vv: ['\x1b]0;PWNED', '\x1b[31mred', 'ok'], ph: ['\x1b[5m', 'a'], um: { f: ' {} \x1b[7m' } };
  r = await call('/config.json?c=' + encodeURIComponent(b64e(ESCP)));
  j = JSON.parse(r.body);
  const allStrings = JSON.stringify([j.thinkingVerbs, j.thinkingStyle.phases, j.userMessageDisplay.format]);
  ok(!/\\u001b|\x1b/.test(allStrings), 'no ESC survives into config', allStrings.slice(0, 160));
  ok(j.thinkingVerbs.format.includes('{}'), 'verb format keeps placeholder');
  ok(j.userMessageDisplay.format.includes('{}'), 'umd format keeps placeholder');
  ok(cleanTerm('ab‮c', 40) === 'abc', 'cleanTerm strips C1 + bidi', JSON.stringify(cleanTerm('ab‮c', 40)));
  ok(cleanFormat('x'.repeat(39) + '{}', 40, 'FB') === 'FB', 'format truncation cannot orphan the placeholder');

  // origin header validation — hostile, malformed and legitimate-but-unusual hosts
  const hostCase = h => {
    let body = '', status = 0, threw = null;
    try {
      handler({ url: '/shayan.sh', headers: { host: h } },
        { statusCode: 200, setHeader() {}, end(b) { body = String(b); status = this.statusCode; } });
    } catch (e) { threw = e; }
    return { body, status, threw, origin: (body.match(/^ORIGIN="(.*)"$/m) || [])[1] };
  };
  const evil = hostCase('x.com" ; rm -rf ~ ; echo "');
  ok(!evil.threw && !evil.body.includes('rm -rf'), 'hostile Host header rejected', evil.origin);
  bashCheck(evil.body, 'evil_host_apply');
  // new URL() throws above port 65535 — an unguarded handler took the process down.
  for (const h of ['localhost:99999', 'localhost:65536', 'localhost:0', 'a'.repeat(300)]) {
    const c = hostCase(h);
    ok(!c.threw && c.status === 200 && c.origin === 'https://shayan-cc-config.vercel.app',
      `Host ${JSON.stringify(h.slice(0, 20))} falls back instead of throwing`, c.threw ? String(c.threw.message) : c.origin);
  }
  for (const h of ['[::1]:3177', 'my_host.local:3177', 'localhost:65535']) {
    const c = hostCase(h);
    ok(!c.threw && c.origin === 'https://' + h, `Host ${JSON.stringify(h)} preserved for self-hosting`, c.origin);
  }

  // paletteSeedHex must agree with the rendered terminal background
  const DATA = require(path.join(ROOT, 'api/_data.js'));
  const { paletteSeedHex, previewColors: pc } = require(path.join(ROOT, 'api/_term.js'));
  const mismatches = DATA.presets.map(p => {
    const th = p.theme || DATA.defaultThemes.find(t => t.id === 'dark');
    const seedBg = paletteSeedHex(th.colors).bg;
    const prevBg = pc(th.colors).bg;
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(prevBg);
    const prevHex = m ? '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('') : prevBg;
    return seedBg === prevHex ? null : `${p.id}: seed ${seedBg} vs preview ${prevHex}`;
  }).filter(Boolean);
  ok(mismatches.length === 0, 'every preset seeds the bg the preview paints', mismatches.join('; '));

  // /apply.sh and /config.json must agree about what they accept
  for (const junk of ['just a string', 42, [1, 2, 3], null]) {
    const enc = encodeURIComponent(b64e(junk));
    const ap = await call('/apply.sh?c=' + enc);
    const cf = await call('/config.json?c=' + enc);
    ok(ap.status === 400 && cf.status === 400, `both routes reject ${JSON.stringify(junk)}`,
      `apply=${ap.status} config=${cf.status}`);
  }

  // Studio page: structural checks only. Behavioral preview-vs-install parity is
  // covered by test-parity.js, which runs the real client functions — substring greps
  // here would pass on a buggy build and silently rot when the code moves.
  const cust = (await call('/customize')).body;
  ok(cust.includes('if(allowDraft)'), 'studio guards the saved draft');
  ok(cust.includes('ownKey(SL_BARSETS,sl.bar)'), 'studio uses own-property bar check');
  ok(cust.includes('slwarn'), 'studio warns when no segments are selected');
  ok(/c_reset[\s\S]{0,400}clearTimeout\(_urlT\)/.test(cust), 'reset cancels the pending URL write');
  extractScripts(cust).forEach((s, i) => nodeCheck(s, 'customize_fixed_script' + i));

  // usage beyond the assumed window: full bar, count alone, no impossible fraction
  const bigTr = path.join(TMP, 'big.jsonl');
  fs.writeFileSync(bigTr, JSON.stringify({ message: { usage: { input_tokens: 640000, output_tokens: 1000 } } }) + '\n');
  const bigRun = cp.spawnSync('node', [slFile], {
    input: JSON.stringify({ transcript_path: bigTr, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'Fable 5' } }),
    encoding: 'utf8', timeout: 5000,
  });
  const bigPlain = (bigRun.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  ok(bigRun.status === 0, 'statusline handles >200k usage', bigRun.stderr);
  ok(bigPlain.includes('641k') && !/641k\/200k/.test(bigPlain), 'no impossible fraction past the window', bigPlain);

  // after compaction, usage from before the boundary must not be reported
  const cTr = path.join(TMP, 'compact.jsonl');
  const slCtx = path.join(TMP, 'sl-ctx.js');
  r = await call('/statusline.js?c=' + encodeURIComponent(b64e({ ...LEGACY, sl: { on: true, seg: ['model', 'ctx'], sep: ' | ', em: false, bar: 'blocks', ctxFmt: 'pct-of', text: '' } })));
  fs.writeFileSync(slCtx, r.body);
  const ctxRun = trPath => {
    const out = cp.spawnSync('node', [slCtx], {
      input: JSON.stringify({ transcript_path: trPath, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'Fable 5' } }),
      encoding: 'utf8', timeout: 5000,
    });
    return (out.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  };
  fs.writeFileSync(cTr, [
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 168820, output_tokens: 0 } } }),
    JSON.stringify({ type: 'system', subtype: 'compact_boundary' }),
    JSON.stringify({ type: 'user', isCompactSummary: true, message: { content: 's' } }),
  ].join('\n') + '\n');
  const postCompact = ctxRun(cTr);
  ok(!/%/.test(postCompact), 'ctx hides stale pre-compaction usage', postCompact);
  fs.appendFileSync(cTr, JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 65000, output_tokens: 400 } } }) + '\n');
  const afterTurn = ctxRun(cTr);
  ok(/33%/.test(afterTurn), 'ctx returns with post-compaction usage', afterTurn);
  const plainTr = path.join(TMP, 'plain.jsonl');
  fs.writeFileSync(plainTr, JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 40000, output_tokens: 1000 } } }) + '\n');
  ok(/21%/.test(ctxRun(plainTr)), 'ctx unaffected in a normal session', ctxRun(plainTr));

  console.log('— statusline robustness —');
  // A generated script runs on every prompt render, so degenerate status JSON must
  // never crash it, print NaN, add a line, or blank the whole status line.
  const slAll = path.join(TMP, 'sl-all.js');
  r = await call('/statusline.js?c=' + encodeURIComponent(b64e({
    ...LEGACY,
    sl: { on: true, seg: ['model', 'dir', 'git', 'ctx', 'cost', 'dur', 'lines', 'style', 'ver', 'clock', 'text'], sep: ' | ', em: false, bar: 'blocks', ctxFmt: 'pct-of', text: 'tail' },
  })));
  fs.writeFileSync(slAll, r.body);
  const runSl = stdin => {
    const out = cp.spawnSync('node', [slAll], { input: typeof stdin === 'string' ? stdin : JSON.stringify(stdin), encoding: 'utf8', timeout: 5000 });
    return { code: out.status, plain: (out.stdout || '').replace(/\x1b\[[0-9;]*m/g, ''), err: out.stderr || '' };
  };
  const mkTr = (obj, name) => { const p = path.join(TMP, name); fs.writeFileSync(p, JSON.stringify(obj) + '\n'); return p; };

  // the 100% -> 40% collapse: output_tokens pushing the sum past 200k must not retier
  const nearFull = mkTr({ message: { usage: { input_tokens: 198000, output_tokens: 500 } } }, 'near.jsonl');
  const justOver = mkTr({ message: { usage: { input_tokens: 198000, output_tokens: 4000 } } }, 'over.jsonl');
  const a = runSl({ transcript_path: nearFull, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'M' } });
  const b = runSl({ transcript_path: justOver, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'M' } });
  const pctOf = s => { const m = /(\d+)%/.exec(s); return m ? +m[1] : null; };
  ok(pctOf(a.plain) === 99 && pctOf(b.plain) === 100,
    'gauge rises to 100% instead of collapsing when 200k fills', `${pctOf(a.plain)}% then ${pctOf(b.plain)}%`);
  ok(/of 200k/.test(b.plain), 'window stays 200k rather than inventing a larger tier', b.plain);
  const oneM = runSl({ transcript_path: justOver, cwd: ROOT, model: { id: 'claude-sonnet-5[1m]', display_name: 'M' } });
  ok(/of 1000k/.test(oneM.plain), '1m marker still selects the 1m window', oneM.plain);

  // non-numeric fields must degrade, never print NaN
  const badTok = mkTr({ message: { usage: { input_tokens: 'lots', output_tokens: 5 } } }, 'badtok.jsonl');
  const bad = runSl({ transcript_path: badTok, cwd: ROOT, model: { id: 'm', display_name: 'M' }, cost: { total_duration_ms: 'abc', total_lines_added: 'abc', total_lines_removed: {} }, output_style: { name: 'x' }, version: '1' });
  ok(bad.code === 0 && !/NaN/.test(bad.plain), 'non-numeric tokens/duration/lines never print NaN', bad.plain);

  // control characters in echoed strings must not add lines or retitle the terminal
  const ctrl = runSl({ cwd: ROOT, model: { display_name: 'M\nEVIL' }, output_style: { name: 'a]0;pwnedb' }, version: '1\n2' });
  ok(ctrl.code === 0 && !ctrl.plain.includes('\n') && !ctrl.plain.includes(']'),
    'echoed strings are stripped of control sequences', JSON.stringify(ctrl.plain));

  // degenerate stdin and paths
  for (const [label, stdin] of [['literal null', 'null'], ['array', '[1,2,3]'], ['number', '42'], ['garbage', 'nope'], ['empty', '']]) {
    const res2 = runSl(stdin);
    ok(res2.code === 0 && !/statusline error/.test(res2.plain), `stdin ${label} handled`, res2.plain.slice(0, 60));
  }
  const nonStr = runSl({ transcript_path: 12345, cwd: ROOT, model: { display_name: 'M' } });
  ok(nonStr.code === 0 && !/Deprecation|DEP0187/.test(nonStr.err), 'non-string transcript_path emits no deprecation warning', nonStr.err.slice(0, 80));
  const badWs = runSl({ workspace: { current_dir: 42 }, model: { display_name: 'M' } });
  ok(badWs.code === 0 && !/statusline error/.test(badWs.plain), 'non-string current_dir handled', badWs.plain.slice(0, 60));

  // a truncated install must still render rather than crash with a stack
  const truncated = path.join(TMP, 'sl-trunc.js');
  fs.writeFileSync(truncated, r.body.replace(/Buffer\.from\('[A-Za-z0-9+/=]+'/, "Buffer.from('bm90LWJhc2U2NC0='"));
  const tr2 = cp.spawnSync('node', [truncated], { input: JSON.stringify({ cwd: ROOT, model: { display_name: 'M' } }), encoding: 'utf8', timeout: 5000 });
  ok(tr2.status === 0 && !/at Object|Error:/.test(tr2.stderr), 'corrupted embedded config degrades instead of crashing', (tr2.stderr || '').slice(0, 80));

  console.log('— shayan installer —');
  // A real listening server in a SEPARATE process: the installed picker fetches
  // /list.txt with curl, and spawnSync below would block this process's event loop,
  // so an in-process server could never answer.
  const srvScript = path.join(TMP, 'srv.js');
  fs.writeFileSync(srvScript, [
    "const http=require('http');",
    `const h=require(${JSON.stringify(path.join(ROOT, 'api/index.js'))});`,
    'const s=http.createServer((rq,rs)=>{try{h(rq,rs);}catch(e){rs.statusCode=500;rs.end("err");}});',
    "s.listen(0,'127.0.0.1',()=>console.log(s.address().port));",
  ].join('\n'));
  const srvProc = cp.spawn('node', [srvScript], { stdio: ['ignore', 'pipe', 'pipe'] });
  const srvPort = await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('server did not start')), 10000);
    srvProc.stdout.on('data', d => { buf += d; const m = /(\d+)/.exec(buf); if (m) { clearTimeout(t); resolve(+m[1]); } });
    srvProc.on('error', reject);
  });
  const srvHost = '127.0.0.1:' + srvPort;
  // x-forwarded-proto is set explicitly because the handler defaults to https (right
  // for production behind Vercel, wrong for a plain-HTTP test server).
  const curl = p => cp.spawnSync('curl', ['-fsS', '-H', 'x-forwarded-proto: http', 'http://' + srvHost + p],
    { encoding: 'utf8', timeout: 10000 }).stdout || '';
  const shBody = curl('/shayan.sh');
  ok(shBody.includes(srvHost), 'installer targets the live test server', (shBody.match(/^ORIGIN=.*$/m) || [])[0]);
  r = { body: shBody };
  bashCheck(r.body, 'shayan_installer');
  // bash -n alone passed on the version that installed 0 bytes (it failed at RUNTIME
  // under set -u), so the installer has to actually run here.
  const instSh = path.join(TMP, 'inst.sh');
  fs.writeFileSync(instSh, r.body);
  const fakeHome = fs.mkdtempSync(path.join(TMP, 'home-'));
  // A PATH without node: the installer must not depend on it.
  const noNode = cp.spawnSync('bash', [instSh], { env: { HOME: fakeHome, PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 20000 });
  const cli = path.join(fakeHome, '.local/bin/shayan');
  ok(noNode.status === 0, 'installer succeeds without node on PATH', noNode.stderr);
  ok(fs.existsSync(cli) && fs.statSync(cli).size > 200, 'installed CLI is non-empty',
    fs.existsSync(cli) ? fs.statSync(cli).size + ' bytes' : 'missing');
  ok(fs.existsSync(cli) && (fs.statSync(cli).mode & 0o111) !== 0, 'installed CLI is executable');
  const cliBody = fs.existsSync(cli) ? fs.readFileSync(cli, 'utf8') : '';
  ok(!cliBody.includes('__SHAYAN_ORIGIN__'), 'no unsubstituted placeholder remains');
  ok(/^BASE="https?:\/\/[^"]+"$/m.test(cliBody), 'origin substituted into BASE', (cliBody.match(/^BASE=.*$/m) || [])[0]);
  bashCheck(cliBody, 'installed_cli');
  // The picker's arithmetic must not be frozen at install time, and 010 must not be octal.
  ok(cliBody.includes('i=$((i+1))'), 'loop counter is evaluated at run time, not baked in');
  ok(cliBody.includes("sed 's/^0*//'"), 'leading zeros stripped so 010 is not octal 8');
  ok(/\$\{#IDS\[@\]\}/.test(cliBody), 'empty-array guard present for bash 3.2');
  // The picker must list all 11 presets, correctly numbered.
  const listRun = cp.spawnSync('bash', [cli], { input: 'q\n', env: { HOME: fakeHome, PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 20000 });
  ok(listRun.status === 0, 'q quits cleanly', (listRun.stdout + listRun.stderr).trim().split('\n').pop());
  ok(/ 1\) Tokyo Night/.test(listRun.stdout) && / 11\) Anthropic Stock/.test(listRun.stdout),
    'picker numbers all 11 entries', JSON.stringify(listRun.stdout.slice(0, 120)));
  // Valid choices must resolve to the entry the user actually saw. 010/08 are the
  // interesting ones: bash arithmetic would read them as octal without the strip.
  const stubBin = fs.mkdtempSync(path.join(TMP, 'bin-'));
  fs.writeFileSync(path.join(stubBin, 'npx'), '#!/bin/sh\necho "stub npx $*"\n', { mode: 0o755 });
  const nodeDir = path.dirname(cp.spawnSync('bash', ['-lc', 'command -v node'], { encoding: 'utf8' }).stdout.trim() || '/usr/bin/node');
  const applyPath = `${stubBin}:${nodeDir}:/usr/bin:/bin`;
  for (const [choice, want] of [['8', 'winter'], ['08', 'winter'], ['10', 'monochrome'], ['010', 'monochrome']]) {
    const run = cp.spawnSync('bash', [cli], { input: choice + '\n', env: { HOME: fakeHome, PATH: applyPath }, encoding: 'utf8', timeout: 30000 });
    const both = run.stdout + run.stderr;
    ok(both.includes('/config/' + want + '.json'), `choice ${JSON.stringify(choice)} applies ${want}`,
      (both.match(/\/config\/[a-z-]+\.json/) || ['no config fetch'])[0]);
  }
  // Invalid choices must exit non-zero with a clean message and no raw bash errors.
  for (const choice of ['0', 'abc', '', '99']) {
    const run = cp.spawnSync('bash', [cli], { input: choice + '\n', env: { HOME: fakeHome, PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 20000 });
    const both = run.stdout + run.stderr;
    const noisy = /unbound variable|bad array subscript|value too great|syntax error/.test(both);
    ok(run.status === 1 && !noisy && /Invalid choice/.test(both), `choice ${JSON.stringify(choice)} rejected cleanly`,
      'status ' + run.status + ' :: ' + both.trim().split('\n').pop());
  }
  // An unreachable server must say so rather than emit a bash internal error.
  const downCli = path.join(TMP, 'shayan-down');
  fs.writeFileSync(downCli, cliBody.replace(srvHost, '127.0.0.1:1'), { mode: 0o755 });
  const downRun = cp.spawnSync('bash', [downCli], { input: '1\n', env: { HOME: fakeHome, PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 20000 });
  const downBoth = downRun.stdout + downRun.stderr;
  ok(downRun.status === 1 && /Could not reach/.test(downBoth) && !/unbound variable/.test(downBoth),
    'unreachable server reports a friendly error', downBoth.trim().split('\n').pop());
  srvProc.kill();

  // ── the cmux layer ────────────────────────────────────────
  // /cmux writes two files that are not ours: a Ghostty config that may already hold
  // hand-written settings, and a JSONC cmux.json that may hold keys we know nothing
  // about. Clobbering either is the failure mode that matters, so the merge, the
  // backup, the idempotency and the refuse-to-guess path all get asserted here.
  console.log('— cmux —');
  const CM = require('./api/_cmux.js');
  const bash = (file, home) => cp.spawnSync('bash', [file],
    { encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home }) });

  const cmDef = CM.sanitizeCmux({ on: true });
  ok(cmDef && Object.keys(cmDef).length > 30,
    'sanitizeCmux returns the full settings object', cmDef ? Object.keys(cmDef).length + ' keys' : 'null');
  ok(CM.sanitizeCmux({ on: false }) === null, 'cmux off yields no layer');
  ok(CM.sanitizeCmux(null) === null && CM.sanitizeCmux([]) === null && CM.sanitizeCmux('x') === null,
    'garbage payloads yield no layer');

  // Share links are strangers' input and every value below lands in a config file or
  // a shell script, so each one has to come back neutered.
  const hostile = CM.sanitizeCmux({
    on: true,
    fontFamily: 'x"; rm -rf /',
    theme: 'One Dark\nfont-size = 99',
    titleTemplate: 'a\nbc]0;pwned',
    paneBorder: 'red;"><img src=y>',
    indicatorStyle: 'constructor', appearance: '__proto__', branchLayout: 'toString',
    fontSize: 1e9, bgOpacity: -5, tintOpacity: 'abc', scrollSpeed: 99, scrollback: -1,
  });
  ok(!/["';]/.test(hostile.fontFamily), 'hostile font-family sanitized', JSON.stringify(hostile.fontFamily));
  ok(!/[\n]/.test(hostile.theme + hostile.titleTemplate),
    'newline injection into the config files is blocked',
    JSON.stringify([hostile.theme, hostile.titleTemplate]));
  ok(/^#[0-9a-f]{6}$/i.test(hostile.paneBorder), 'a non-colour is rejected', hostile.paneBorder);
  ok(CM.INDICATOR_STYLES.indexOf(hostile.indicatorStyle) >= 0
    && CM.APPEARANCES.indexOf(hostile.appearance) >= 0
    && CM.BRANCH_LAYOUTS.indexOf(hostile.branchLayout) >= 0,
    'prototype-chain names do not pass the enum check',
    [hostile.indicatorStyle, hostile.appearance, hostile.branchLayout].join(','));
  ok(hostile.fontSize <= 32 && hostile.bgOpacity >= 0 && hostile.bgOpacity <= 1
    && hostile.tintOpacity >= 0 && hostile.scrollSpeed <= 3 && hostile.scrollback > 0,
    'out-of-range numbers are clamped',
    JSON.stringify([hostile.fontSize, hostile.bgOpacity, hostile.tintOpacity, hostile.scrollSpeed]));

  // The colours the user did not pin come from the Claude Code palette. That layering
  // is the whole reason this page exists, so it is asserted rather than eyeballed.
  const nord = { subtle: [67, 76, 94], accent: [136, 192, 208], bg: [46, 52, 64] };
  const layered = CM.resolveCmuxColors(cmDef, nord);
  ok(layered.paneBorder === '#434c5e' && layered.activePaneBorder === '#88c0d0'
    && layered.tint === '#2e3440' && layered.selection === '#88c0d0',
    'unpinned cmux colours derive from the Claude Code palette', JSON.stringify(layered));

  const cmFile = path.join(TMP, 'cmux.sh');
  const cmBlock = CM.cmuxApplyBlock(hostile, nord);
  fs.writeFileSync(cmFile, '#!/bin/bash\nset -euo pipefail\n' + cmBlock);
  ok(cp.spawnSync('bash', ['-n', cmFile], { encoding: 'utf8' }).status === 0, 'bash -n: cmux layer');
  ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(cmBlock), 'no control characters reach the generated script');

  // A real user's HOME: hand-written Ghostty settings, and a cmux.json carrying
  // comments, a trailing comma and keys we must not touch.
  const cmHome = path.join(TMP, 'cmuxhome');
  fs.mkdirSync(path.join(cmHome, '.config', 'ghostty'), { recursive: true });
  fs.mkdirSync(path.join(cmHome, '.config', 'cmux'), { recursive: true });
  const gPath = path.join(cmHome, '.config', 'ghostty', 'config');
  const jPath = path.join(cmHome, '.config', 'cmux', 'cmux.json');
  fs.writeFileSync(gPath, 'font-thicken = true\nkeybind = cmd+k=clear_screen\n');
  fs.writeFileSync(jPath, '{\n  // a comment, which cmux.json allows\n  "schemaVersion": 1,\n'
    + '  "myUnmanagedKey": "keep me",\n  "sidebar": { "somethingElseOfMine": 42 },\n}\n');

  const cmRun = bash(cmFile, cmHome);
  ok(cmRun.status === 0, 'cmux layer applies cleanly', (cmRun.stderr || '').trim().slice(0, 120));
  const gAfter = fs.readFileSync(gPath, 'utf8');
  ok(/font-thicken = true/.test(gAfter) && /keybind = cmd[+]k/.test(gAfter),
    'hand-written ghostty settings survive');
  ok(/>>> shayan-cc-config [(]cmux[)] >>>/.test(gAfter), 'the ghostty block is marked for later replacement');
  let jAfter = JSON.parse(fs.readFileSync(jPath, 'utf8'));
  ok(jAfter.myUnmanagedKey === 'keep me' && jAfter.sidebar.somethingElseOfMine === 42,
    'unmanaged cmux.json keys survive the merge', JSON.stringify(Object.keys(jAfter)));
  ok(jAfter.schemaVersion === 1, 'schemaVersion is left at 1', String(jAfter.schemaVersion));
  ok(fs.readdirSync(path.dirname(jPath)).some(f => /cmux[.]json[.]backup-/.test(f))
    && fs.readdirSync(path.dirname(gPath)).some(f => /config[.]backup-/.test(f)),
    'both files were backed up before being touched');

  bash(cmFile, cmHome);
  ok((fs.readFileSync(gPath, 'utf8').match(/>>> shayan-cc-config [(]cmux[)] >>>/g) || []).length === 1,
    're-running does not stack a second ghostty block');
  ok(JSON.parse(fs.readFileSync(jPath, 'utf8')).myUnmanagedKey === 'keep me',
    'unmanaged keys survive a second run too');

  // An unparseable cmux.json is a file we do not understand. Guessing would destroy
  // someone's config, so the installer stops and says so.
  const badHome = path.join(TMP, 'cmuxbad');
  fs.mkdirSync(path.join(badHome, '.config', 'cmux'), { recursive: true });
  const badPath = path.join(badHome, '.config', 'cmux', 'cmux.json');
  fs.writeFileSync(badPath, 'not json at all {{{\n');
  const badRun = bash(cmFile, badHome);
  ok(badRun.status === 1, 'an unparseable cmux.json aborts rather than guessing', 'exit ' + badRun.status);
  ok(fs.readFileSync(badPath, 'utf8') === 'not json at all {{{\n',
    'the file it could not parse is left untouched');

  const newHome = path.join(TMP, 'cmuxnew');
  fs.mkdirSync(newHome, { recursive: true });
  ok(bash(cmFile, newHome).status === 0, 'cmux layer works on a machine with no config yet');
  ok(JSON.parse(fs.readFileSync(path.join(newHome, '.config/cmux/cmux.json'), 'utf8')).schemaVersion === 1,
    'a freshly created cmux.json is valid JSON');

  // Every key and every value we can write, checked against cmux's own schema.
  // This exists because the indicatorStyle enum shipped wrong once — 'typographic'
  // for 'typography', plus a 'none' that is not a cmux value — and nothing caught
  // it: `cmux config validate` checks JSONC syntax only and exits 0 on out-of-enum
  // values. The schema is the only thing that discriminates.
  const cmSchema = require('./test/fixtures/cmux.schema.json');
  function schemaProblems(node, sch, at) {
    const bad = [];
    if (!sch) return [at + ' is not in the schema'];
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const k of Object.keys(node)) {
        const child = (sch.properties || {})[k];
        const where = at ? at + '.' + k : k;
        if (!child) {
          if (sch.additionalProperties === false) bad.push(where + ' is rejected (additionalProperties:false)');
          continue;
        }
        bad.push(...schemaProblems(node[k], child, where));
      }
      return bad;
    }
    if (sch.enum && sch.enum.indexOf(node) < 0) {
      bad.push(at + ' = ' + JSON.stringify(node) + ' is not in [' + sch.enum.join(', ') + ']');
    }
    if (sch.type === 'number' || sch.type === 'integer') {
      if (typeof sch.minimum === 'number' && node < sch.minimum) bad.push(at + ' = ' + node + ' below minimum ' + sch.minimum);
      if (typeof sch.maximum === 'number' && node > sch.maximum) bad.push(at + ' = ' + node + ' above maximum ' + sch.maximum);
    } else if (sch.type) {
      const t = Array.isArray(node) ? 'array' : typeof node;
      if (t !== sch.type) bad.push(at + ' is ' + t + ', schema wants ' + sch.type);
    }
    return bad;
  }
  const stripOurs = o => { const c = JSON.parse(JSON.stringify(o)); delete c['$schema']; return c; };

  const defProblems = schemaProblems(stripOurs(CM.buildCmuxJson(cmDef, nord)), cmSchema, '');
  ok(defProblems.length === 0, 'the default cmux.json validates against the schema', defProblems.slice(0, 3).join('; '));

  // Every value the page can offer, not just the defaults: an enum this UI lists but
  // cmux does not accept is a config the app silently ignores.
  const enumSets = [
    ['indicatorStyle', CM.INDICATOR_STYLES],
    ['appearance', CM.APPEARANCES],
    ['placement', CM.PLACEMENTS],
    ['contentAlignment', CM.ALIGNMENTS],
    ['branchLayout', CM.BRANCH_LAYOUTS],
  ];
  const enumProblems = [];
  for (const [key, values] of enumSets) {
    for (const v of values) {
      const patch = { on: true }; patch[key] = v;
      const written = CM.buildCmuxJson(CM.sanitizeCmux(patch), nord);
      const p2 = schemaProblems(stripOurs(written), cmSchema, '');
      if (p2.length) enumProblems.push(key + '=' + v + ': ' + p2[0]);
    }
  }
  ok(enumProblems.length === 0,
    'every enum value the page offers is one cmux accepts', enumProblems.slice(0, 3).join('; '));

  // And the reverse: a value cmux supports but the page hides is a missing feature,
  // which is how 'washRail' and 'blueWashColorRail' went absent for a while.
  const schemaInd = cmSchema.properties.workspaceColors.properties.indicatorStyle.enum;
  ok(schemaInd.every(v => CM.INDICATOR_STYLES.indexOf(v) >= 0),
    'the page offers every indicator style cmux supports',
    schemaInd.filter(v => CM.INDICATOR_STYLES.indexOf(v) < 0).join(', '));

  // Stale share links carrying a retired value must fall back, never pass through.
  ok(CM.sanitizeCmux({ on: true, indicatorStyle: 'typographic' }).indicatorStyle === 'leftRail'
    && CM.sanitizeCmux({ on: true, indicatorStyle: 'none' }).indicatorStyle === 'leftRail',
    'a share link with a retired indicator style falls back to the default');

  // ── the theme presets ─────────────────────────────────────────────────────
  // A preset makes two claims that can rot silently: that a named Ghostty theme
  // exists on the machine, and that its palette matches what that theme actually
  // renders. Both are checked against the installed bundle when it is present.
  const PRE = require('./api/_cmux_presets.js');
  const clientPresets = PRE.presetsForClient();
  ok(clientPresets.length >= 12, 'presets are defined', clientPresets.length + ' presets');

  const PAL_KEYS = ['bg', 'raised', 'text', 'comment', 'subtle', 'accent', 'accent2',
    'cyan', 'green', 'red', 'orange', 'yellow', 'pink', 'blue'];
  const presetProblems = [];
  const seenIds = new Set();
  for (const pr of clientPresets) {
    if (seenIds.has(pr.id)) presetProblems.push(pr.id + ': duplicate id');
    seenIds.add(pr.id);
    if (!/^[a-z0-9-]+$/.test(pr.id)) presetProblems.push(pr.id + ': id is not kebab-case');
    if (pr.kind !== 'community' && pr.kind !== 'example') presetProblems.push(pr.id + ': unknown kind ' + pr.kind);
    // The whole point of the labelling is that one claim is checkable and the other
    // is authored here, so a community preset without evidence is not shippable.
    if (pr.kind === 'community' && !pr.evidence) presetProblems.push(pr.id + ': community preset with no evidence');
    if (pr.kind === 'community' && !pr.credit) presetProblems.push(pr.id + ': community preset with no credit');
    if (pr.kind === 'community' && !pr.theme) presetProblems.push(pr.id + ': community preset names no Ghostty theme');
    if (!pr.blurb) presetProblems.push(pr.id + ': no blurb');
    if (!pr.pal) { presetProblems.push(pr.id + ': no palette'); continue; }
    for (const k of PAL_KEYS) {
      const v = pr.pal[k];
      if (!Array.isArray(v) || v.length !== 3
        || v.some(n => !Number.isInteger(n) || n < 0 || n > 255)) {
        presetProblems.push(pr.id + ': palette key ' + k + ' is not an rgb triple');
      }
    }
  }
  ok(presetProblems.length === 0, 'every preset is well-formed and labelled',
    presetProblems.slice(0, 4).join('; '));

  // A preset's cm overrides must be real settings at legal values, or picking one
  // would silently write a setting cmux ignores.
  const overProblems = [];
  for (const pr of clientPresets) {
    for (const k of Object.keys(pr.cm || {})) {
      if (!Object.prototype.hasOwnProperty.call(CM.CMUX_DEFAULTS, k)) {
        overProblems.push(pr.id + ': overrides unknown setting ' + k);
        continue;
      }
      const applied = CM.sanitizeCmux(Object.assign({ on: true }, pr.cm));
      if (JSON.stringify(applied[k]) !== JSON.stringify(pr.cm[k])) {
        overProblems.push(pr.id + ': ' + k + '=' + JSON.stringify(pr.cm[k])
          + ' does not survive the sanitizer (got ' + JSON.stringify(applied[k]) + ')');
      }
    }
  }
  ok(overProblems.length === 0, 'preset setting overrides are all real and legal',
    overProblems.slice(0, 4).join('; '));

  // Selecting a preset must change the two files, and the chrome must follow the
  // preset's palette rather than the Claude Code one.
  const ccPal = { bg: [26, 27, 38], subtle: [48, 52, 70], accent: [122, 162, 247] };
  const layerProblems = [];
  for (const pr of clientPresets) {
    const san = CM.sanitizeCmux({ on: true, preset: pr.id });
    if (san.preset !== pr.id) { layerProblems.push(pr.id + ': id did not survive the sanitizer'); continue; }
    const lines = CM.buildGhosttyLines(san, ccPal);
    const kv = Object.fromEntries(lines);
    if (pr.theme && kv.theme !== pr.theme) layerProblems.push(pr.id + ': theme line is ' + kv.theme);
    if (!pr.theme && !kv.background) layerProblems.push(pr.id + ': example preset wrote no background');
    const json = CM.buildCmuxJson(san, ccPal);
    const expect = '#' + pr.pal.subtle.map(n => n.toString(16).padStart(2, '0')).join('');
    if (json.paneBorderColor !== expect) {
      layerProblems.push(pr.id + ': pane border ' + json.paneBorderColor + ' should be ' + expect);
    }
  }
  ok(layerProblems.length === 0,
    'each preset drives the ghostty colour lines and the cmux chrome from its own palette',
    layerProblems.slice(0, 4).join('; '));

  // Against the real installed bundle, when there is one: the named theme file must
  // exist, and the stored palette must equal what the extraction tool derives from it.
  const THEMES_DIR = '/Applications/cmux.app/Contents/Resources/ghostty/themes';
  let bundle = false;
  try { bundle = fs.statSync(THEMES_DIR).isDirectory(); } catch (e) { bundle = false; }
  if (!bundle) {
    console.log('  – skipped: no installed cmux bundle to check theme files against');
  } else {
    const tool = require('./tools/extract-ghostty-themes.js');
    const have = new Set(fs.readdirSync(THEMES_DIR));
    const named = clientPresets.filter(pr => pr.theme);
    const gone = named.filter(pr => !have.has(pr.theme)).map(pr => pr.theme);
    ok(gone.length === 0, 'every named theme exists in the installed cmux bundle', gone.join(', '));

    const drifted = [];
    for (const pr of named) {
      if (!have.has(pr.theme)) continue;
      const derived = tool.toSitePalette(tool.parseTheme(path.join(THEMES_DIR, pr.theme)), pr.theme);
      for (const k of PAL_KEYS) {
        const a = pr.pal[k].join(',');
        const b = derived[k].map(n => Math.max(0, Math.min(255, Math.round(n)))).join(',');
        if (a !== b) { drifted.push(pr.theme + '.' + k + ': stored ' + a + ' vs file ' + b); break; }
      }
    }
    ok(drifted.length === 0,
      'stored palettes still match the theme files they were generated from',
      drifted.slice(0, 3).join('; ') + (drifted.length ? '  — rerun tools/extract-ghostty-themes.js' : ''));
  }

  // The page and its routes.
  r = await call('/cmux');
  ok(r.status === 200 && /id="winBefore"/.test(r.body) && /id="cmuxControls"/.test(r.body),
    '/cmux renders', 'status ' + r.status);
  const cmPayload = Buffer.from(JSON.stringify({
    n: 'T', p: { bg: [46, 52, 64], subtle: [67, 76, 94], accent: [136, 192, 208] },
    cm: { on: true, fontSize: 16, indicatorStyle: 'border' },
  })).toString('base64url');
  r = await call('/cmux-files.txt?c=' + cmPayload);
  ok(r.status === 200 && /font-size = 16/.test(r.body) && /"indicatorStyle": "border"/.test(r.body)
    && /#88c0d0/.test(r.body),
    '/cmux-files.txt shows both files, layered on the palette', 'status ' + r.status);
  r = await call('/apply.sh?c=' + cmPayload);
  ok(r.status === 200 && /shayan-cc-config [(]cmux[)]/.test(r.body) && /Claude Code [+] cmux/.test(r.body),
    'one install command carries both the Claude Code and the cmux halves');

  console.log('— misc —');
  r = await call('/nope');
  ok(r.status === 404, '404 fallback');

  console.log('');
  console.log(failures ? '✗ ' + failures + ' FAILURE(S)' : '✓ all smoke tests passed');
  process.exit(failures ? 1 : 0);
})();
