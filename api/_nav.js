// The site's page list, and the chrome that renders it.
//
// This used to be three separate hardcoded lists: the links in each page's top bar,
// and the "Pages" section inside installMobileNav(). Adding a page meant editing all
// of them and noticing that you had, which is exactly the kind of thing that quietly
// falls out of step. Now there is one array — add an entry and the top bar, the
// desktop dropdown and the phone sheet all pick it up.
//
// Keep `sub` short and honest: it is the one line a person reads when deciding which
// of these pages they actually want, and it shows in the menu on every screen size.

const PAGES = [
  {
    id: 'home', path: '/', icon: '▦', label: 'Gallery', short: 'Home',
    sub: 'pick a ready-made setup',
  },
  {
    id: 'studio', path: '/customize', icon: '\u{1F39B}', label: 'The Studio', short: 'Studio',
    sub: 'build your own, before / after',
  },
  {
    id: 'cmux', path: '/cmux', icon: '\u{1FA9F}', label: 'cmux', short: 'cmux',
    sub: 'the macOS terminal around Claude Code',
  },
  {
    id: 'herdr', path: '/herdr', icon: '\u{1F9AC}', label: 'herdr', short: 'herdr',
    sub: 'the multiplexer that tracks agent state',
  },
  {
    id: 'zellij', path: '/zellij', icon: '\u{1F9E9}', label: 'Zellij', short: 'Zellij',
    sub: 'layouts you commit, sessions that survive',
  },
  {
    id: 'warp', path: '/warp', icon: '\u{1F300}', label: 'Warp', short: 'Warp',
    sub: 'blocks, themes and launch configurations',
  },
];

const GITHUB_URL = 'https://github.com/seanmodd/shayan-cc-config';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// The top bar. `currentId` marks the page you are on so the menu can say so, and the
// brand is a link everywhere except the gallery, where it would link to itself.
//
// Only GitHub and the menu button live in the bar now. Five pages of named links do
// not fit a laptop width beside the brand, and picking which two to show would just be
// the same drift in a new place — so the bar holds the constant things and the menu
// holds the pages.
function topBar(currentId, ghSvg) {
  const brand = currentId === 'home'
    ? '<span class="brand">shayan-cc-config</span>'
    : '<a class="brand" href="/" style="text-decoration:none">← shayan-cc-config</a>';
  return `<div class="top">${brand}<span class="spacer"></span>`
    + `<a class="iconbtn" href="${GITHUB_URL}" target="_blank" rel="noreferrer">${ghSvg}GitHub</a>`
    + `<button type="button" class="iconbtn navbtn" id="navbtn" aria-expanded="false"`
    + ` aria-controls="nav" aria-haspopup="menu">`
    + `<span class="navbars" aria-hidden="true">☰</span><span class="navword">Menu</span></button>`
    + `</div>`;
}

// Serialized for the client, which builds the menu itself so the same markup serves
// the dropdown and the sheet.
function navPayload(currentId) {
  return JSON.stringify({ pages: PAGES, current: currentId, gh: GITHUB_URL });
}

module.exports = { PAGES, GITHUB_URL, topBar, navPayload, esc };
