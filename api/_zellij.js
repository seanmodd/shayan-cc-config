// Zellij configuration — the server half.
//
// Zellij keeps its config in ONE file, in KDL:
//
//   ~/.config/zellij/config.kdl
//
// That path is not a guess and not XDG. Zellij's search order is: --config-dir, then
// $ZELLIJ_CONFIG_DIR, then $HOME/.config/zellij, then the macOS Application Support
// directory, then /etc/zellij — first one that EXISTS wins, and they are not merged.
// $XDG_CONFIG_HOME is IGNORED entirely (verified against the 0.44.3 binary with
// XDG_CONFIG_HOME pointed elsewhere). So ~/.config/zellij wins unconditionally, and
// that is what the installer targets.
//
// THE THING THAT SHAPES THIS WHOLE MODULE: Zellij silently accepts and ignores unknown
// top-level option keys. `zellij setup --check` returns success on `banana "split"`.
// So a typo here produces a config that looks fine, validates clean, and does nothing.
// Every key below was executed against a real zellij 0.44.3 binary, and the published
// documentation is wrong about several of them — each is called out where it bites.
//
// Enum VALUES, by contrast, are strictly validated and a bad one is a hard startup
// error, so the sanitizer's fallbacks are what keep a share link from bricking a config.

const { clampInt } = require('./_term.js');

// All 41 built-in themes, taken from the theme name inside each shipped .kdl rather than
// from the docs, which list three of them under the wrong names (ayu_dark instead of
// ayu-dark, and so on) and omit four entirely.
const ZJ_THEMES = [
  'ansi', 'ao', 'atelier-sulphurpool', 'ayu-dark', 'ayu-light', 'ayu-mirage',
  'blade-runner', 'catppuccin-frappe', 'catppuccin-latte', 'catppuccin-macchiato',
  'catppuccin-mocha', 'cyber-noir', 'dayfox', 'dracula', 'everforest-dark',
  'everforest-light', 'flexoki-dark', 'gruber-darker', 'gruvbox-dark', 'gruvbox-light',
  'iceberg-dark', 'iceberg-light', 'kanagawa', 'lucario', 'menace', 'molokai-dark',
  'night-owl', 'nightfox', 'nord', 'one-half-dark', 'onedark', 'pencil-light',
  'retro-wave', 'solarized-dark', 'solarized-light', 'terafox', 'tokyo-night-dark',
  'tokyo-night-light', 'tokyo-night-storm', 'tokyo-night', 'vesper',
];

// 14 modes. `prompt` is undocumented but accepted; bogus names are rejected outright.
const ZJ_MODES = ['normal', 'locked', 'resize', 'pane', 'tab', 'scroll', 'search',
  'entersearch', 'renametab', 'renamepane', 'session', 'move', 'prompt', 'tmux'];
const ZJ_LAYOUTS = ['default', 'compact', 'strider', 'welcome'];
// Case-SENSITIVE, unlike most enums here: "Detach" is a hard error.
const ON_FORCE_CLOSE = ['detach', 'quit'];
const COPY_CLIPBOARD = ['system', 'primary'];
const WEB_SHARING = ['on', 'off', 'disabled'];
const COPY_COMMANDS = ['', 'pbcopy', 'wl-copy', 'xclip -selection clipboard', 'xsel -ib'];

const ZELLIJ_DEFAULTS = {
  theme: 'catppuccin-mocha',
  themeSplit: false,
  themeLight: 'catppuccin-latte',
  defaultLayout: 'compact',
  defaultMode: 'normal',
  defaultShell: '',
  paneFrames: true,
  roundedCorners: true,
  hideSessionName: false,
  simplifiedUi: false,
  styledUnderlines: true,
  autoLayout: true,
  stackedResize: true,
  mouseMode: true,
  advancedMouseActions: true,
  mouseHoverEffects: true,
  focusFollowsMouse: false,
  mouseClickThrough: false,
  copyCommand: 'pbcopy',
  copyClipboard: 'system',
  copyOnSelect: true,
  osc8Hyperlinks: true,
  scrollbackEditor: '',
  scrollBufferSize: 10000,
  sessionSerialization: true,
  serializePaneViewport: false,
  serializationInterval: 60,
  onForceClose: 'detach',
  attachToSession: false,
  showStartupTips: true,
  showReleaseNotes: true,
  webServer: false,
  webSharing: 'off',
  webServerPort: 8082,
  agentLayout: true,
  plugins: [],
};

// Nine third-party plugins, every one verified to exist through the GitHub API with its
// real release asset name. These are .wasm files fetched from GitHub releases, so the
// list is an allowlist — the payload picks ids, never URLs.
const ZJ_PLUGINS = [
  { id: 'zjstatus', repo: 'dj95/zjstatus', asset: 'zjstatus.wasm', tag: 'v0.24.0', stars: 1023,
    name: 'zjstatus', bind: '', blurb: 'A fully configurable status bar — replaces the stock one from inside a layout.' },
  { id: 'room', repo: 'rvcas/room', asset: 'room.wasm', tag: 'v1.2.1', stars: 291,
    name: 'room', bind: 'Ctrl y', blurb: 'Fuzzy tab search and switch.' },
  { id: 'zellij-forgot', repo: 'karimould/zellij-forgot', asset: 'zellij_forgot.wasm', tag: '0.4.2', stars: 256,
    name: 'zellij-forgot', bind: 'Alt i', blurb: 'A searchable cheatsheet for the shortcut you just forgot.' },
  { id: 'harpoon', repo: 'Nacho114/harpoon', asset: 'harpoon.wasm', tag: 'v0.3.0', stars: 202,
    name: 'harpoon', bind: 'Ctrl p', blurb: 'Bookmark panes and jump straight back to them.' },
  { id: 'monocle', repo: 'imsnif/monocle', asset: 'monocle.wasm', tag: 'v0.100.2', stars: 190,
    name: 'monocle', bind: 'Alt m', blurb: 'Fuzzy find across file names AND file contents.' },
  { id: 'vim-nav', repo: 'hiasr/vim-zellij-navigator', asset: 'vim-zellij-navigator.wasm', tag: '0.3.0', stars: 178,
    name: 'vim-zellij-navigator', bind: '', blurb: 'One set of hjkl keys that moves between Zellij panes and vim splits.' },
  { id: 'multitask', repo: 'leakec/multitask', asset: 'multitask.wasm', tag: 'v0.44.3_hotfix', stars: 152,
    name: 'multitask', bind: '', blurb: 'Run a command across many panes at once.' },
  { id: 'zj-docker', repo: 'dj95/zj-docker', asset: 'zj-docker.wasm', tag: 'v0.4.0', stars: 42,
    name: 'zj-docker', bind: 'Alt d', blurb: 'Browse and manage Docker containers in a pane.' },
  { id: 'zj-quit', repo: 'cristiand391/zj-quit', asset: 'zj-quit.wasm', tag: '0.3.1', stars: 45,
    name: 'zj-quit', bind: 'Ctrl q', archived: true, blurb: 'A confirm prompt before quitting. Repo is archived — still works, no longer maintained.' },
];

const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
const bool = (v, dflt) => (typeof v === 'boolean' ? v : dflt);

// Anything that lands inside a KDL double-quoted string. Shell paths and commands are
// restricted to a conservative charset rather than escaped: this file is read by a
// program that will execute copy_command, so a quote or a backtick surviving into it is
// not something to be clever about.
function safeCmd(v, list, dflt) {
  if (list.includes(v)) return v;
  return dflt;
}
function safeShell(v, dflt) {
  if (typeof v !== 'string') return dflt;
  const s = v.trim();
  if (!s) return dflt;
  if (s.length > 80) return dflt;
  if (!/^[A-Za-z0-9._\/-]+$/.test(s)) return dflt;
  if (s.includes('..')) return dflt;
  return s;
}

function sanitizeZellij(zj) {
  if (!zj || typeof zj !== 'object' || Array.isArray(zj)) return null;
  if (zj.on !== true) return null;
  const d = ZELLIJ_DEFAULTS;
  const ids = ZJ_PLUGINS.map(p => p.id);
  const plugins = Array.isArray(zj.plugins)
    ? zj.plugins.filter(p => ids.includes(p)).slice(0, ZJ_PLUGINS.length) : [];
  return {
    theme: pick(zj.theme, ZJ_THEMES, d.theme),
    themeSplit: bool(zj.themeSplit, d.themeSplit),
    themeLight: pick(zj.themeLight, ZJ_THEMES, d.themeLight),
    defaultLayout: pick(zj.defaultLayout, ZJ_LAYOUTS, d.defaultLayout),
    defaultMode: pick(zj.defaultMode, ZJ_MODES, d.defaultMode),
    defaultShell: safeShell(zj.defaultShell, d.defaultShell),
    paneFrames: bool(zj.paneFrames, d.paneFrames),
    roundedCorners: bool(zj.roundedCorners, d.roundedCorners),
    hideSessionName: bool(zj.hideSessionName, d.hideSessionName),
    simplifiedUi: bool(zj.simplifiedUi, d.simplifiedUi),
    styledUnderlines: bool(zj.styledUnderlines, d.styledUnderlines),
    autoLayout: bool(zj.autoLayout, d.autoLayout),
    stackedResize: bool(zj.stackedResize, d.stackedResize),
    mouseMode: bool(zj.mouseMode, d.mouseMode),
    advancedMouseActions: bool(zj.advancedMouseActions, d.advancedMouseActions),
    mouseHoverEffects: bool(zj.mouseHoverEffects, d.mouseHoverEffects),
    focusFollowsMouse: bool(zj.focusFollowsMouse, d.focusFollowsMouse),
    mouseClickThrough: bool(zj.mouseClickThrough, d.mouseClickThrough),
    copyCommand: safeCmd(zj.copyCommand, COPY_COMMANDS, d.copyCommand),
    copyClipboard: pick(zj.copyClipboard, COPY_CLIPBOARD, d.copyClipboard),
    copyOnSelect: bool(zj.copyOnSelect, d.copyOnSelect),
    osc8Hyperlinks: bool(zj.osc8Hyperlinks, d.osc8Hyperlinks),
    scrollbackEditor: safeShell(zj.scrollbackEditor, d.scrollbackEditor),
    scrollBufferSize: clampInt(zj.scrollBufferSize, 1000, 1000000, d.scrollBufferSize),
    sessionSerialization: bool(zj.sessionSerialization, d.sessionSerialization),
    serializePaneViewport: bool(zj.serializePaneViewport, d.serializePaneViewport),
    serializationInterval: clampInt(zj.serializationInterval, 5, 3600, d.serializationInterval),
    onForceClose: pick(zj.onForceClose, ON_FORCE_CLOSE, d.onForceClose),
    attachToSession: bool(zj.attachToSession, d.attachToSession),
    showStartupTips: bool(zj.showStartupTips, d.showStartupTips),
    showReleaseNotes: bool(zj.showReleaseNotes, d.showReleaseNotes),
    webServer: bool(zj.webServer, d.webServer),
    webSharing: pick(zj.webSharing, WEB_SHARING, d.webSharing),
    webServerPort: clampInt(zj.webServerPort, 1024, 65535, d.webServerPort),
    agentLayout: bool(zj.agentLayout, d.agentLayout),
    plugins,
  };
}

const kS = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const kB = v => (v ? 'true' : 'false');

function buildZellijKdl(s) {
  const L = [];
  L.push('// ~/.config/zellij/config.kdl');
  L.push('// written by shayan-cc-config — every key executed against zellij 0.44.3');
  L.push('//');
  L.push('// Zellij silently ignores unknown option keys, so a typo here would validate');
  L.push('// clean and do nothing. Check with: zellij setup --check');
  L.push('');
  if (s.themeSplit) {
    // theme_dark / theme_light are 0.44.3+ and let the terminal's own light/dark
    // preference pick. theme is still written as the fallback for older builds.
    L.push('theme ' + kS(s.theme));
    L.push('theme_dark ' + kS(s.theme));
    L.push('theme_light ' + kS(s.themeLight));
  } else {
    L.push('theme ' + kS(s.theme));
  }
  L.push('default_layout ' + kS(s.agentLayout ? 'ai-agent' : s.defaultLayout));
  L.push('default_mode ' + kS(s.defaultMode));
  if (s.defaultShell) L.push('default_shell ' + kS(s.defaultShell));
  L.push('');
  L.push('// Appearance');
  L.push('pane_frames ' + kB(s.paneFrames));
  L.push('simplified_ui ' + kB(s.simplifiedUi));
  L.push('styled_underlines ' + kB(s.styledUnderlines));
  L.push('auto_layout ' + kB(s.autoLayout));
  L.push('stacked_resize ' + kB(s.stackedResize));
  L.push('');
  L.push('// Mouse');
  L.push('mouse_mode ' + kB(s.mouseMode));
  L.push('advanced_mouse_actions ' + kB(s.advancedMouseActions));
  L.push('mouse_hover_effects ' + kB(s.mouseHoverEffects));
  L.push('focus_follows_mouse ' + kB(s.focusFollowsMouse));
  L.push('mouse_click_through ' + kB(s.mouseClickThrough));
  L.push('');
  L.push('// Copy / clipboard');
  if (s.copyCommand) L.push('copy_command ' + kS(s.copyCommand));
  L.push('copy_clipboard ' + kS(s.copyClipboard));
  L.push('copy_on_select ' + kB(s.copyOnSelect));
  // Documented default is false; the binary's is true (unwrap_or(true)). Written
  // explicitly so the file means what it says either way.
  L.push('osc8_hyperlinks ' + kB(s.osc8Hyperlinks));
  L.push('');
  L.push('// Scrollback');
  L.push('scroll_buffer_size ' + s.scrollBufferSize);
  if (s.scrollbackEditor) L.push('scrollback_editor ' + kS(s.scrollbackEditor));
  L.push('');
  L.push('// Session');
  L.push('session_serialization ' + kB(s.sessionSerialization));
  // NOT pane_viewport_serialization, which is what the docs call it and which zellij
  // silently ignores.
  L.push('serialize_pane_viewport ' + kB(s.serializePaneViewport));
  L.push('serialization_interval ' + s.serializationInterval + '   // seconds');
  L.push('on_force_close ' + kS(s.onForceClose) + '   // lowercase; this enum is case-sensitive');
  L.push('attach_to_session ' + kB(s.attachToSession));
  L.push('show_startup_tips ' + kB(s.showStartupTips));
  L.push('show_release_notes ' + kB(s.showReleaseNotes));
  if (s.webServer || s.webSharing !== 'off') {
    L.push('');
    L.push('// Web client. Serves sessions in a browser — leave the IP on loopback');
    L.push('// unless you know what you are exposing.');
    L.push('web_server ' + kB(s.webServer));
    L.push('web_sharing ' + kS(s.webSharing));
    L.push('web_server_port ' + s.webServerPort);
  }
  // rounded_corners and hide_session_name ONLY work nested here. Written at the top
  // level they are silently ignored, which is a favourite way to lose an afternoon.
  L.push('');
  L.push('ui {');
  L.push('    pane_frames {');
  L.push('        rounded_corners ' + kB(s.roundedCorners));
  L.push('        hide_session_name ' + kB(s.hideSessionName));
  L.push('    }');
  L.push('}');

  const chosen = ZJ_PLUGINS.filter(p => s.plugins.includes(p.id));
  if (chosen.length) {
    L.push('');
    L.push('// Third-party plugins. The ten built-in aliases have to stay — removing them');
    L.push('// stops Zellij working as expected — so these are added alongside.');
    L.push('plugins {');
    L.push('    tab-bar         location="zellij:tab-bar"');
    L.push('    status-bar      location="zellij:status-bar"');
    L.push('    strider         location="zellij:strider"');
    L.push('    compact-bar     location="zellij:compact-bar"');
    L.push('    session-manager location="zellij:session-manager"');
    L.push('    welcome-screen  location="zellij:session-manager" {');
    L.push('        welcome_screen true');
    L.push('    }');
    L.push('    filepicker      location="zellij:strider" {');
    L.push('        cwd "/"');
    L.push('    }');
    L.push('    configuration   location="zellij:configuration"');
    L.push('    plugin-manager  location="zellij:plugin-manager"');
    L.push('    about           location="zellij:about"');
    for (const p of chosen) {
      L.push('    ' + p.id + ' location="file:~/.config/zellij/plugins/' + p.asset + '"');
    }
    L.push('}');
    const bindable = chosen.filter(p => p.bind);
    if (bindable.length) {
      L.push('');
      L.push('keybinds {');
      L.push('    shared_except "locked" {');
      for (const p of bindable) {
        L.push('        bind ' + kS(p.bind) + ' {');
        L.push('            LaunchOrFocusPlugin ' + kS(p.id) + ' {');
        L.push('                floating true');
        L.push('                move_to_focused_tab true');
        L.push('            }');
        L.push('        }');
      }
      L.push('    }');
      L.push('}');
    }
  }
  return L.join('\n') + '\n';
}

// A layout is where Zellij actually earns its keep for agent work: one command opens the
// agent, a shell and a git pane in a shape you chose. Validated against 0.44.3.
//
// start_suspended on the agent and git panes is deliberate — opening the layout should
// not immediately spawn an AI session or shell out to git; you press Enter when ready.
function buildAgentLayout(s) {
  return `// ~/.config/zellij/layouts/ai-agent.kdl
// Open it with:  zellij --layout ai-agent
layout {
    default_tab_template {
        pane size=1 borderless=true {
            plugin location="zellij:tab-bar"
        }
        children
        pane size=2 borderless=true {
            plugin location="zellij:status-bar"
        }
    }

    tab name="agent" focus=true split_direction="vertical" {
        // The agent gets the room; press Enter in the pane to start it.
        pane size="60%" name="claude" focus=true {
            command "claude"
            start_suspended true
        }
        pane size="40%" split_direction="horizontal" {
            pane name="shell"
            pane name="git" size="45%" {
                command "git"
                args "status"
                start_suspended true
            }
        }
    }

    tab name="files" {
        pane split_direction="vertical" {
            pane size="25%" borderless=true {
                plugin location="zellij:strider"
            }
            pane
        }
    }

    // Alt [ and Alt ] cycle these alternatives.
    swap_tiled_layout name="wide" {
        tab max_panes=2 {
            pane split_direction="vertical" {
                pane
                pane
            }
        }
    }
}
`;
}

function zellijApplyBlock(s) {
  const kdl = buildZellijKdl(s);
  const chosen = ZJ_PLUGINS.filter(p => s.plugins.includes(p.id));
  const dl = chosen.map(p =>
    `  echo "  → ${p.name}"\n  curl -fsSL -o "$ZJ_PLUGDIR/${p.asset}" \\\n    "https://github.com/${p.repo}/releases/download/${p.tag}/${p.asset}" \\\n    || echo "    (download failed: ${p.repo})"`
  ).join('\n');
  return `
echo ""
echo "▸ Applying the Zellij layer…"

if ! command -v zellij >/dev/null 2>&1; then
  echo "  Zellij is not installed. Get it with:"
  echo "    brew install zellij"
  echo "    (or: cargo install --locked zellij)"
  echo "  Skipping the Zellij layer."
else
  ZJ_STAMP="$(date +%Y%m%d-%H%M%S)"
  # $HOME/.config/zellij literally. Zellij's search order puts this first among the
  # directories that exist, and it does NOT read $XDG_CONFIG_HOME — verified against the
  # 0.44.3 binary. Writing anywhere else risks landing in a directory it never opens.
  ZJ_DIR="$HOME/.config/zellij"
  mkdir -p "$ZJ_DIR/layouts" "$ZJ_DIR/plugins"
  ZJ_PLUGDIR="$ZJ_DIR/plugins"
  if [ -f "$ZJ_DIR/config.kdl" ]; then
    cp "$ZJ_DIR/config.kdl" "$ZJ_DIR/config.kdl.backup-$ZJ_STAMP"
    echo "  backed up your old config → $ZJ_DIR/config.kdl.backup-$ZJ_STAMP"
  fi
  cat > "$ZJ_DIR/config.kdl" <<'SCC_ZJ_KDL'
${kdl}SCC_ZJ_KDL
  echo "  wrote $ZJ_DIR/config.kdl"
${s.agentLayout ? `
  cat > "$ZJ_DIR/layouts/ai-agent.kdl" <<'SCC_ZJ_LAYOUT'
${buildAgentLayout(s)}SCC_ZJ_LAYOUT
  echo "  wrote $ZJ_DIR/layouts/ai-agent.kdl (open it with: zellij --layout ai-agent)"` : ''}
${chosen.length ? `
  echo "  downloading ${chosen.length} plugin${chosen.length > 1 ? 's' : ''} into $ZJ_PLUGDIR…"
${dl}` : ''}
  # setup --check parses the file and reports problems. It cannot catch a misspelled
  # option name — Zellij ignores those silently — but it will catch a bad enum value,
  # which is the failure that would otherwise stop Zellij starting.
  if zellij setup --check >/dev/null 2>&1; then
    echo "  zellij setup --check: clean"
  else
    echo "  ⚠ zellij setup --check reported a problem:"
    zellij setup --check 2>&1 | sed 's/^/      /' | head -20
    echo "      your previous config is at $ZJ_DIR/config.kdl.backup-$ZJ_STAMP"
  fi
fi`;
}

module.exports = {
  ZELLIJ_DEFAULTS, ZJ_THEMES, ZJ_MODES, ZJ_LAYOUTS, ON_FORCE_CLOSE, COPY_CLIPBOARD,
  WEB_SHARING, COPY_COMMANDS, ZJ_PLUGINS,
  sanitizeZellij, buildZellijKdl, buildAgentLayout, zellijApplyBlock,
};
