#!/usr/bin/env python3
"""Build presets.json for shayan-cc-config.

11 curated Claude Code setups: 6 community themes (credited) + 4 hand-crafted
palettes + 1 stock/revert. Each preset = full tweakcc theme (61 color keys) +
themed thinking verbs + spinner phases + user-message display + a matching
context-bar.sh statusline accent color.
"""
import json, re

DEFAULTS = json.load(open('/root/picker/default_settings.json'))
DEFAULT_THEMES = DEFAULTS['themes']

def rgb(t): return f'rgb({t[0]},{t[1]},{t[2]})'
def parse(s):
    m = re.match(r'rgb\((\d+),(\d+),(\d+)\)', s)
    return tuple(int(x) for x in m.groups())
def lighten(c, t): return tuple(min(255, round(ch + (255 - ch) * t)) for ch in c)
def scale(c, f): return tuple(min(255, round(ch * f)) for ch in c)
def blend(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def expand(p):
    """Expand a base palette dict into the full 61-key tweakcc color set."""
    bg, raised, text = p['bg'], p['raised'], p['text']
    comment, subtle = p['comment'], p['subtle']
    accent, accent2 = p['accent'], p['accent2']
    cyan, green, red = p['cyan'], p['green'], p['red']
    orange, yellow, pink, blue = p['orange'], p['yellow'], p['pink'], p['blue']
    gray60 = (60, 60, 60)
    return {
        'autoAccept': rgb(green),
        'bashBorder': rgb(comment),
        'claude': rgb(accent),
        'claudeShimmer': rgb(lighten(accent, 0.3)),
        'claudeBlue_FOR_SYSTEM_SPINNER': rgb(accent),
        'claudeBlueShimmer_FOR_SYSTEM_SPINNER': rgb(lighten(accent, 0.3)),
        'permission': rgb(orange),
        'permissionShimmer': rgb(lighten(orange, 0.35)),
        'planMode': rgb(cyan),
        'ide': rgb(blue),
        'promptBorder': rgb(comment),
        'promptBorderShimmer': rgb(lighten(comment, 0.3)),
        'text': rgb(text),
        'inverseText': rgb(bg),
        'inactive': rgb(comment),
        'subtle': rgb(subtle),
        'suggestion': rgb(cyan),
        'remember': rgb(yellow),
        'background': rgb(bg),
        'success': rgb(green),
        'error': rgb(red),
        'warning': rgb(orange),
        'warningShimmer': rgb(lighten(orange, 0.35)),
        'diffAdded': rgb(scale(green, 0.32)),
        'diffRemoved': rgb(scale(red, 0.4)),
        'diffAddedDimmed': rgb(blend(scale(green, 0.32), gray60, 0.35)),
        'diffRemovedDimmed': rgb(blend(scale(red, 0.4), gray60, 0.3)),
        'diffAddedWord': rgb(green),
        'diffRemovedWord': rgb(red),
        'diffAddedWordDimmed': rgb(scale(green, 0.64)),
        'diffRemovedWordDimmed': rgb(scale(red, 0.7)),
        'red_FOR_SUBAGENTS_ONLY': rgb(red),
        'blue_FOR_SUBAGENTS_ONLY': rgb(blue),
        'green_FOR_SUBAGENTS_ONLY': rgb(green),
        'yellow_FOR_SUBAGENTS_ONLY': rgb(yellow),
        'purple_FOR_SUBAGENTS_ONLY': rgb(accent2),
        'orange_FOR_SUBAGENTS_ONLY': rgb(orange),
        'pink_FOR_SUBAGENTS_ONLY': rgb(pink),
        'cyan_FOR_SUBAGENTS_ONLY': rgb(cyan),
        'professionalBlue': rgb(blue),
        'rainbow_red': rgb(red),
        'rainbow_orange': rgb(orange),
        'rainbow_yellow': rgb(yellow),
        'rainbow_green': rgb(green),
        'rainbow_blue': rgb(cyan),
        'rainbow_indigo': rgb(accent2),
        'rainbow_violet': rgb(pink),
        'rainbow_red_shimmer': rgb(lighten(red, 0.3)),
        'rainbow_orange_shimmer': rgb(lighten(orange, 0.3)),
        'rainbow_yellow_shimmer': rgb(lighten(yellow, 0.3)),
        'rainbow_green_shimmer': rgb(lighten(green, 0.3)),
        'rainbow_blue_shimmer': rgb(lighten(cyan, 0.3)),
        'rainbow_indigo_shimmer': rgb(lighten(accent2, 0.3)),
        'rainbow_violet_shimmer': rgb(lighten(pink, 0.3)),
        'clawd_body': rgb(pink),
        'clawd_background': rgb(bg),
        'userMessageBackground': rgb(raised),
        'bashMessageBackgroundColor': rgb(blend(bg, raised, 0.6)),
        'memoryBackgroundColor': rgb(blend(bg, raised, 0.75)),
        'rate_limit_fill': rgb(accent),
        'rate_limit_empty': rgb(raised),
    }

PALETTES = {
    'tokyo-night': dict(
        bg=(26,27,38), raised=(41,46,66), text=(192,202,245), comment=(86,95,137),
        subtle=(48,52,70), accent=(122,162,247), accent2=(187,154,247), cyan=(125,207,255),
        green=(158,206,106), red=(247,118,142), orange=(255,158,100), yellow=(224,175,104),
        pink=(187,154,247), blue=(122,162,247)),
    'catppuccin-mocha': dict(
        bg=(30,30,46), raised=(49,50,68), text=(205,214,244), comment=(108,112,134),
        subtle=(49,50,68), accent=(203,166,247), accent2=(180,190,254), cyan=(148,226,213),
        green=(166,227,161), red=(243,139,168), orange=(250,179,135), yellow=(249,226,175),
        pink=(245,194,231), blue=(137,180,250)),
    'nord': dict(
        bg=(46,52,64), raised=(59,66,82), text=(216,222,233), comment=(97,110,136),
        subtle=(67,76,94), accent=(136,192,208), accent2=(180,142,173), cyan=(143,188,187),
        green=(163,190,140), red=(191,97,106), orange=(208,135,112), yellow=(235,203,139),
        pink=(180,142,173), blue=(129,161,193)),
    'solarized-dark': dict(
        bg=(0,43,54), raised=(7,54,66), text=(147,161,161), comment=(88,110,117),
        subtle=(7,54,66), accent=(38,139,210), accent2=(108,113,196), cyan=(42,161,152),
        green=(133,153,0), red=(220,50,47), orange=(203,75,22), yellow=(181,137,0),
        pink=(211,54,130), blue=(38,139,210)),
}

HANDCRAFTED_NAMES = {
    'tokyo-night': 'Tokyo Night',
    'catppuccin-mocha': 'Catppuccin Mocha',
    'nord': 'Nord',
    'solarized-dark': 'Solarized Dark',
}

VERBS = {
    'dracula': ['Summoning','Transfixing','Mesmerizing','Enthralling','Conjuring','Bewitching',
        'Transmuting','Necromancing','Brooding','Lurking','Shapeshifting','Hypnotizing','Awakening',
        'Nightcrawling','Cloaking','Materializing','Haunting','Spellbinding','Batting','Fanging'],
    'tokyo-night': ['Neonizing','Synthwaving','Gliding','Pulsing','Raining','Glowing','Drifting',
        'Flickering','Nightriding','Vaporizing','Synthesizing','Cityscaping','Beaming','Shimmering',
        'Turbocharging','Downtowning','Skylining','Circuit-surfing','Midnighting','Hologramming'],
    'catppuccin-mocha': ['Brewing','Frothing','Steaming','Whisking','Caramelizing','Purring',
        'Kneading','Latte-arting','Percolating','Simmering','Toasting','Cozying','Mochafying',
        'Sweetening','Dolloping','Snuggling','Stirring','Roasting','Foaming','Cat-napping'],
    'nord': ['Glaciating','Snowdrifting','Auroraing','Frosting','Crystallizing','Fjording',
        'Icebreaking','Polarizing','Mushing','Hibernating','Northening','Shimmering','Drifting',
        'Glinting','Freezing','Sledging','Echoing','Stargazing','Winterizing','Longshipping'],
    'solarized-dark': ['Annotating','Studying','Indexing','Cross-referencing','Footnoting',
        'Typesetting','Proofreading','Archiving','Cataloguing','Illuminating','Transcribing',
        'Researching','Deliberating','Calibrating','Measuring','Deducing','Theorizing','Verifying',
        'Referencing','Scholarizing'],
    'green-phosphor': ['Bootstrapping','Compiling','Modulating','Demodulating','Buffering',
        'Tokenizing','Grepping','Piping','Forking','Daemonizing','Interrupting','Polling','Paging',
        'Swapping','Blinking','Dialing','Handshaking','Uplinking','Rebooting','Defragmenting'],
    'pixel-arcade': ['Respawning','Leveling-up','Power-upping','Combo-ing','Speedrunning',
        'Bossfighting','Coin-collecting','Warp-piping','Buttonmashing','Cheatcoding','Highscoring',
        'Continuing','Pixelating','Glitching','Save-stating','Grinding','Looting','Questing',
        'Multiballing','Insert-coining'],
    'sweet-theme': ['Sugarcoating','Sprinkling','Glazing','Frosting','Whipping','Taffy-pulling',
        'Candying','Marshmallowing','Bubblegumming','Jellybeaning','Swirling','Lollipopping',
        'Caramelizing','Gumdropping','Sherbeting','Fizzing','Popping','Twirling','Sparkling',
        'Cupcaking'],
    'winter': ['Snowballing','Sledding','Icicling','Blizzarding','Powdering','Snowshoeing',
        'Wintering','Chilling','Cocoa-sipping','Evergreening','Frostbiting','Flurrying','Skating',
        'Aurora-watching','Mittening','Shivering','Snowflaking','Glistening','Hushing','Drifting'],
    'monochrome': ['Reducing','Distilling','Simplifying','Essentializing','Grayscaling',
        'Minimizing','Decluttering','Zenning','Balancing','Contemplating','Muting','Focusing',
        'Refining','Clarifying','Composing','Centering','Aligning','Breathing','Sharpening',
        'Stilling'],
}

SPINNERS = {
    'dracula':          ['·','⋆','✦','✧','✦','⋆'],
    'tokyo-night':      ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'],
    'catppuccin-mocha': ['◐','◓','◑','◒'],
    'nord':             ['·','✢','❅','✶','❆','✽'],
    'solarized-dark':   ['◜','◠','◝','◞','◡','◟'],
    'green-phosphor':   ['|','/','-','\\'],
    'pixel-arcade':     ['▁','▂','▃','▄','▅','▆','▇','█','▇','▆','▅','▄','▃','▂'],
    'sweet-theme':      ['·','∘','✿','❀','✿','∘'],
    'winter':           ['·','❅','❆','✻','❆','❅'],
    'monochrome':       ['·','∙','●','∙'],
}

META = {
    'dracula':          dict(name='Dracula', tagline='Bite the darkness.', statusline='lavender'),
    'tokyo-night':      dict(name='Tokyo Night', tagline='Neon rain on midnight streets.', statusline='blue'),
    'catppuccin-mocha': dict(name='Catppuccin Mocha', tagline='Warm pastels, cozy café energy.', statusline='rose'),
    'nord':             dict(name='Nord', tagline='Arctic, north-bluish calm.', statusline='cyan'),
    'solarized-dark':   dict(name='Solarized Dark', tagline='The 2011 classic, precision-tuned.', statusline='teal'),
    'green-phosphor':   dict(name='Green Phosphor', tagline='1979 CRT terminal energy.', statusline='green'),
    'pixel-arcade':     dict(name='Pixel Arcade', tagline='Insert coin to continue.', statusline='gold'),
    'sweet-theme':      dict(name='Sweet Theme', tagline='Candy for your terminal.', statusline='rose'),
    'winter':           dict(name='Winter', tagline='Crisp, icy, quiet.', statusline='slate'),
    'monochrome':       dict(name='Monochrome', tagline='No color. All focus.', statusline='gray'),
    'stock':            dict(name='Anthropic Stock', tagline='Factory reset — the out-of-the-box look.', statusline='blue'),
}

DEFAULT_UMD = dict(DEFAULTS['userMessageDisplay'])
def umd(border=None, color=None):
    d = dict(DEFAULT_UMD)
    if border:
        d.update(format=' {} ', borderStyle=border, borderColor=color,
                 paddingX=1, fitBoxToContent=True)
    return d

USER_MSG = {
    'dracula':          umd('round',  'rgb(189,147,249)'),
    'pixel-arcade':     umd('classic','rgb(255,204,0)'),
    'sweet-theme':      umd('round',  'rgb(255,121,198)'),
    'green-phosphor':   umd('topBottomSingle', 'rgb(51,255,51)'),
    'catppuccin-mocha': umd('round',  'rgb(203,166,247)'),
}

VERB_FORMAT = {
    'green-phosphor': '[{}] ',
    'pixel-arcade':   '▶ {}… ',
}

COMMUNITY = ['dracula', 'green-phosphor', 'pixel-arcade', 'sweet-theme', 'winter', 'monochrome']
ORDER = ['tokyo-night','dracula','catppuccin-mocha','nord','green-phosphor','pixel-arcade',
         'solarized-dark','winter','sweet-theme','monochrome','stock']

presets = []
for pid in ORDER:
    meta = META[pid]
    if pid == 'stock':
        theme = None
        author = 'Anthropic'
        verbs = DEFAULTS['thinkingVerbs']
        style = {'reverseMirror': True, 'updateInterval': 120,
                 'phases': ['·','✢','✳','✶','✻','✽']}  # darwin stock
        user_msg = dict(DEFAULT_UMD)
        active_theme = 'dark'
    elif pid in COMMUNITY:
        data = json.load(open(f'/root/picker/themes/{pid}.json'))
        author = data.pop('author', 'community')
        theme = {'name': data['name'], 'id': data['id'], 'colors': data['colors']}
        verbs = {'format': VERB_FORMAT.get(pid, '{}… '), 'verbs': VERBS[pid]}
        style = {'reverseMirror': True, 'updateInterval': 120, 'phases': SPINNERS[pid]}
        user_msg = USER_MSG.get(pid, dict(DEFAULT_UMD))
        active_theme = data['id']
    else:
        author = 'Sean × Claude'
        theme = {'name': meta['name'], 'id': pid, 'colors': expand(PALETTES[pid])}
        verbs = {'format': VERB_FORMAT.get(pid, '{}… '), 'verbs': VERBS[pid]}
        style = {'reverseMirror': True, 'updateInterval': 120, 'phases': SPINNERS[pid]}
        user_msg = USER_MSG.get(pid, dict(DEFAULT_UMD))
        active_theme = pid

    presets.append({
        'id': pid,
        'name': meta['name'],
        'author': author,
        'tagline': meta['tagline'],
        'statuslineColor': meta['statusline'],
        'activeThemeId': active_theme,
        'theme': theme,                # None for stock
        'thinkingVerbs': verbs,
        'thinkingStyle': style,
        'userMessageDisplay': user_msg,
    })

out = {'presets': presets, 'defaultThemes': DEFAULT_THEMES}
with open('/root/shayan-cc-config/src/presets.json', 'w') as f:
    json.dump(out, f, indent=1)
size = len(json.dumps(out))
print(f'{len(presets)} presets written, {size/1024:.0f} KB total')
for p in presets:
    print(f"  {p['id']:18} {p['name']:18} statusline={p['statuslineColor']:8} verbs={len(p['thinkingVerbs']['verbs'])}")
