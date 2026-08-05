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

  // origin header validation
  const evilHostReq = { url: '/apply/tokyo-night.sh', headers: { host: 'x.com" ; rm -rf ~ ; echo "' } };
  let evilBody = '';
  handler(evilHostReq, { statusCode: 200, setHeader() {}, end(b) { evilBody = String(b); } });
  ok(!evilBody.includes('rm -rf'), 'hostile Host header rejected', evilBody.split('\n').find(l => l.includes('ORIGIN')));
  bashCheck(evilBody, 'evil_host_apply');

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

  // /apply.sh rejects payloads /config.json rejects
  r = await call('/apply.sh?c=' + encodeURIComponent(b64e('just a string')));
  ok(r.status === 400, '/apply.sh 400s on non-object payload', 'status ' + r.status);

  // studio client: legacy padding + empty arrays honoured
  const cust = (await call('/customize')).body;
  ok(cust.includes('st.um.px=1'), 'studio mirrors server paddingX=1 for legacy border payloads');
  ok(cust.includes('if(Array.isArray(pl.vv))st.vv='), 'studio honours empty verb arrays');
  ok(cust.includes('if(allowDraft)'), 'studio guards the saved draft');
  ok(cust.includes('ownKey(SL_BARSETS,sl.bar)'), 'studio uses own-property bar check');
  ok(cust.includes('slwarn'), 'studio warns when no segments are selected');
  extractScripts(cust).forEach((s, i) => nodeCheck(s, 'customize_fixed_script' + i));

  // context window no longer pins at 99
  const bigTr = path.join(TMP, 'big.jsonl');
  fs.writeFileSync(bigTr, JSON.stringify({ message: { usage: { input_tokens: 640000, output_tokens: 1000 } } }) + '\n');
  const bigRun = cp.spawnSync('node', [slFile], {
    input: JSON.stringify({ transcript_path: bigTr, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'Fable 5' } }),
    encoding: 'utf8', timeout: 5000,
  });
  const bigPlain = (bigRun.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  ok(bigRun.status === 0, 'statusline handles >200k usage', bigRun.stderr);
  ok(/641k\/1000k|64%/.test(bigPlain), 'window grows past 200k instead of pinning', bigPlain);

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

  console.log('— misc —');
  r = await call('/shayan.sh');
  bashCheck(r.body, 'shayan_installer');
  r = await call('/nope');
  ok(r.status === 404, '404 fallback');

  console.log('');
  console.log(failures ? '✗ ' + failures + ' FAILURE(S)' : '✓ all smoke tests passed');
  process.exit(failures ? 1 : 0);
})();
