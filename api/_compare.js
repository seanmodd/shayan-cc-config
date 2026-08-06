// "Which of these do I actually want?" — the block that sits under the preview on
// every terminal page.
//
// Everything here is sourced from the four projects' own documentation, read on
// 2026-08-06, and each claim links to the page it came from. Where the docs do not
// answer a question, the cell says so instead of guessing: a comparison table that
// quietly fills its gaps is worse than one with holes in it, because you cannot tell
// which cells to trust.
//
// Two corrections this block exists to make, because both are easy to get wrong:
//   1. cmux is TWO products. The macOS app is a terminal EMULATOR; cmux TUI is a
//      cross-platform multiplexer. They are not interchangeable.
//   2. An emulator and a multiplexer compose — but nesting a multiplexer inside the
//      cmux app hides the per-pane tracking that is the reason to run cmux at all.

const TOOLS = [
  {
    id: 'claude',
    name: 'Claude Code',
    kind: 'the agent itself',
    icon: '✴',
    what: 'The agentic coding tool. It reads your codebase, edits files and runs commands — in any terminal, with no configuration.',
    bestFor: [
      'A single focused session where you want the agent and nothing else.',
      'Piping and CI — <span class="mono">claude -p</span> takes a prompt and stdin.',
      'Parallel work without a multiplexer: background sessions keep running with no terminal attached.',
      'Picking work back up — <span class="mono">--continue</span> resumes the last conversation, <span class="mono">--resume</span> takes a session id.',
    ],
    notFor: [
      'Watching several sessions as live panes at once — the agent view is a status screen, not simultaneous terminals.',
      'Surviving a closed terminal in an ordinary interactive session. The transcript is resumable; the process is not.',
      'Mouse interaction, unless you turn on fullscreen rendering mode.',
    ],
    docs: 'https://code.claude.com/docs/en/overview',
  },
  {
    id: 'cmux',
    name: 'cmux',
    kind: 'macOS terminal app',
    icon: '\u{1FA9F}',
    what: 'A native macOS terminal built on Ghostty, aimed squarely at people running a lot of agents: sidebar workspaces, split panes, surface tabs, an embedded browser.',
    bestFor: [
      'Running many agents on a Mac and telling them apart — the sidebar carries branch, directory, ports and notification state.',
      'Claude Code agent teams: <span class="mono">cmux claude-teams</span> makes spawned teammates appear as native splits.',
      'Finding the stuck one — Task Manager attributes CPU and memory per pane and per agent process.',
      'Getting conversations back after a reboot: cmux stores agent session ids from integration hooks and resumes them.',
    ],
    notFor: [
      'Anything that is not macOS 14+.',
      'Processes that must survive quitting the app — cmux is explicit that it does not checkpoint live process state.',
      'A plugin ecosystem. There is a socket API, custom commands and notification hooks, but no plugin system.',
    ],
    docs: 'https://cmux.com/docs/getting-started',
  },
  {
    id: 'zellij',
    name: 'Zellij',
    kind: 'multiplexer',
    icon: '\u{1F9E9}',
    what: 'A Rust terminal multiplexer — "terminal workspace with batteries included". Runs inside whatever terminal you already use.',
    bestFor: [
      'Workspace setups you check into the repo — layouts describe panes, tabs, commands and plugins up front.',
      'Surviving more than a disconnect: sessions are serialized and can be resurrected after a crash or an intentional quit.',
      'Scripting a terminal from outside it — <span class="mono">zellij action</span> can write keys, dump screens and open panes.',
      'Pairing and remote viewing, including a built-in web server and a read-only <span class="mono">zellij watch</span>.',
    ],
    notFor: [
      'Knowing anything about your agent. Panes are panes — there is no agent concept anywhere in Zellij.',
      'Writing plugins in a familiar language today: the system is WASM, and Rust is the only officially supported one.',
      'Avoiding a config dialect — everything is KDL.',
    ],
    docs: 'https://zellij.dev/documentation/',
  },
  {
    id: 'herdr',
    name: 'herdr',
    kind: 'agent multiplexer',
    icon: '\u{1F9AC}',
    what: 'A mouse-first multiplexer built around AI agents. It classifies each agent pane as working, blocked, done or idle, and rolls that state up through tabs and workspaces.',
    bestFor: [
      'Running several agents and seeing at a glance which one is <b>blocked on you</b> rather than still working.',
      'Claude Code specifically — <span class="mono">herdr integration install claude</span> adds lifecycle hooks and native conversation resume.',
      'Long unattended runs: detaching leaves the server up, so the original processes never stop.',
      'Agents driving agents — the CLI and socket API can list, prompt, wait on and attach to agents.',
      'Parallel branches, with git worktrees created per branch under <span class="mono">~/.herdr/worktrees</span>.',
    ],
    notFor: [
      'Windows, if it has to be solid — Linux and macOS are the stable targets, Windows is preview-only beta.',
      'Scrollback you can count on: pane history replay is off by default, because stored output can contain secrets.',
      'A curated plugin ecosystem. The marketplace auto-indexes any repo tagged herdr-plugin — discovery, not review.',
    ],
    docs: 'https://herdr.dev/docs/',
  },
];

// Rows are only worth a table when every tool has a real answer. "unclear from docs" is
// a legitimate answer and appears verbatim where that is the honest one.
const MATRIX = {
  cols: ['Claude Code', 'cmux (app)', 'cmux TUI', 'Zellij', 'herdr'],
  rows: [
    ['Platforms', 'macOS, Linux, WSL, Windows', 'macOS 14+ only', 'macOS, Linux, Windows', 'Linux, macOS, Windows', 'Linux + macOS stable; Windows beta'],
    ['Survives disconnect', 'background sessions only', 'no — layout and agent ids only', 'yes, headless server', 'yes, plus crash resurrection', 'yes — processes never stop'],
    ['Restores the conversation', 'yes, <span class="mono">--resume</span>', 'yes, via integration hooks', 'unclear from docs', 'no — reruns the command', 'yes, on by default'],
    ['Knows the agent is blocked', 'n/a', 'notification rings', 'unclear from docs', 'no agent concept', 'yes — a first-class state'],
    ['Mouse', 'fullscreen mode only', 'native macOS GUI', 'unclear from docs', 'yes, on by default', 'yes — the headline feature'],
    ['Config format', 'JSON + <span class="mono">CLAUDE.md</span>', 'JSONC + Ghostty config', 'JSON', 'KDL', 'TOML'],
    ['Plugins', 'plugins, skills, hooks, MCP', 'none — socket API instead', 'none — socket API instead', 'WASM (Rust today)', 'any executable + manifest'],
  ],
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// The copy above is authored here and deliberately contains a little inline markup
// (<b>, <span class="mono">), so it is trusted and NOT escaped. Nothing user-supplied
// reaches this module — if that ever changes, escape at the call site.
function raw(s) { return String(s); }

function card(t, currentId) {
  const here = t.id === currentId;
  return `<article class="cmpcard${here ? ' here' : ''}">
  <h4><span class="cmpico" aria-hidden="true">${t.icon}</span>${esc(t.name)}
    <span class="cmpkind">${esc(t.kind)}</span>
    ${here ? '<span class="cmphere">you are here</span>' : ''}</h4>
  <p class="cmpwhat">${raw(t.what)}</p>
  <div class="cmplist good"><h5>Best for</h5><ul>${t.bestFor.map(x => `<li>${raw(x)}</li>`).join('')}</ul></div>
  <div class="cmplist bad"><h5>Not the pick when</h5><ul>${t.notFor.map(x => `<li>${raw(x)}</li>`).join('')}</ul></div>
  <a class="cmpdocs" href="${esc(t.docs)}" target="_blank" rel="noreferrer">docs →</a>
</article>`;
}

// `currentId` is one of claude | cmux | zellij | herdr, and marks the card for the page
// you are on so the block reads as "here is where this one sits" rather than as a
// generic listicle bolted to three different pages.
function compareBlock(currentId) {
  return `<section class="cmpwrap" id="compare">
  <h3 class="cmphead">\u{1F9ED} Which one do you actually want?</h3>
  <p class="cmpintro">These are not four versions of the same thing. <b>Claude Code</b> is the agent.
  <b>cmux</b> is a macOS terminal you run it in. <b>Zellij</b> and <b>herdr</b> are multiplexers that
  run <i>inside</i> a terminal and keep sessions alive when you disconnect. Everything below comes
  from each project's own documentation — where the docs do not answer, the table says so.</p>
  <div class="cmpgrid">${TOOLS.map(t => card(t, currentId)).join('')}</div>

  <div class="cmptablewrap">
    <table class="cmptable">
      <thead><tr><th></th>${MATRIX.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${MATRIX.rows.map(r =>
    `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${raw(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>

  <div class="cmpnote">
    <h5>They compose — but not in every order</h5>
    <p>Claude Code runs inside any of them; it is just a program in a pane. A multiplexer runs
    inside a terminal emulator, so Zellij or herdr <i>can</i> run inside the cmux app — but doing it
    routinely throws away the reason to use cmux. cmux tracks state <b>per surface</b>: sidebar
    metadata, Task Manager attribution, notification rings, agent resume tokens. A multiplexer
    occupying one surface collapses everything inside it into a single pane, so cmux sees one
    process instead of four agents, and notifications fired as escape sequences get swallowed on
    the way out. cmux says as much itself: unsupported terminal apps "reopen as normal terminals".</p>
    <p>The combination that <i>is</i> worth it: you are on a Mac, you need a session to survive
    closing the lid or dropping SSH, and the cmux app cannot do that locally. Then you are trading
    the sidebar's intelligence for process durability, on purpose. Otherwise keep it flat — one
    emulator, one multiplexer, agents directly in the panes.</p>
    <p class="cmpsmall">herdr refuses to nest inside itself by default
    (<span class="mono">experimental.allow_nested</span>), and its agent-state detection reads the
    live screen — which a nested multiplexer's redraw breaks. Read on 2026-08-06 against
    herdr 0.8.0; no project here publishes benchmarks, so nothing above is a performance claim.</p>
  </div>
</section>`;
}

const COMPARE_CSS = `
  .cmpwrap{margin:26px 0 6px;}
  .cmphead{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);
    margin:0 0 9px;display:flex;align-items:center;gap:7px;}
  .cmpintro{margin:0 0 15px;font-size:13px;line-height:1.6;color:var(--dim);max-width:88ch;}
  .cmpintro b{color:var(--text);}
  .cmpgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:13px;
    align-items:start;}
  .cmpcard{background:var(--panel);border:1px solid var(--border);border-radius:13px;
    padding:14px 15px 13px;min-width:0;}
  /* The page you are on gets the accent, so the block reads as placing THIS tool among
     the others rather than as the same listicle pasted onto three pages. */
  .cmpcard.here{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}
  .cmpcard h4{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;font-size:15px;
    color:var(--text);margin:0 0 7px;}
  .cmpico{font-size:15px;}
  .cmpkind{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);
    border:1px solid var(--border);border-radius:20px;padding:2px 8px;font-weight:400;}
  .cmphere{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);
    border:1px solid var(--accent);border-radius:20px;padding:2px 7px;font-weight:400;}
  .cmpwhat{font-size:12.5px;line-height:1.55;color:var(--dim);margin:0 0 11px;}
  .cmplist h5{font-size:10px;letter-spacing:.09em;text-transform:uppercase;margin:0 0 5px;
    font-weight:600;}
  .cmplist.good h5{color:var(--ok);}
  .cmplist.bad h5{color:var(--faint);}
  .cmplist ul{list-style:none;margin:0 0 10px;padding:0;}
  .cmplist li{position:relative;padding-left:14px;font-size:12px;line-height:1.5;
    color:var(--dim);margin-bottom:5px;}
  .cmplist li::before{position:absolute;left:0;top:0;}
  .cmplist.good li::before{content:"\\2713";color:var(--ok);}
  .cmplist.bad li::before{content:"\\2022";color:var(--faint);}
  .cmplist li b{color:var(--text);}
  .cmpdocs{font-size:11.5px;color:var(--accent);text-decoration:none;
    border-bottom:1px solid transparent;}
  .cmpdocs:hover{border-bottom-color:var(--accent);}
  /* The table is the widest thing on these pages. It scrolls inside its own box rather
     than pushing the whole document sideways. */
  .cmptablewrap{margin-top:16px;overflow-x:auto;border:1px solid var(--border);
    border-radius:12px;background:var(--panel);}
  .cmptable{border-collapse:collapse;width:100%;min-width:720px;font-size:12px;}
  .cmptable th,.cmptable td{text-align:left;padding:9px 12px;
    border-bottom:1px solid var(--border);vertical-align:top;line-height:1.45;}
  .cmptable thead th{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;
    color:var(--gold);white-space:nowrap;background:#0b0e14;position:sticky;top:0;}
  .cmptable tbody th{color:var(--text);font-weight:600;white-space:nowrap;}
  .cmptable td{color:var(--dim);}
  .cmptable tbody tr:last-child th,.cmptable tbody tr:last-child td{border-bottom:none;}
  .cmpnote{margin-top:15px;border-left:2px solid var(--border);padding:2px 0 2px 13px;}
  .cmpnote h5{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;
    color:var(--gold);margin:0 0 7px;}
  .cmpnote p{font-size:12.5px;line-height:1.6;color:var(--dim);margin:0 0 9px;max-width:92ch;}
  .cmpnote b{color:var(--text);}
  .cmpsmall{font-size:11.5px !important;color:var(--faint) !important;}
  @media(max-width:700px),(max-height:520px){
    .cmpgrid{grid-template-columns:1fr;}
    .cmptable{min-width:640px;font-size:11.5px;}
    .cmpintro{font-size:12.5px;}
  }
`;

module.exports = { TOOLS, MATRIX, compareBlock, COMPARE_CSS };
