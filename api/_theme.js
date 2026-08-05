// Single source of truth for expanding a 14-color base palette into tweakcc's
// full 61-key theme. Used server-side (require) AND embedded verbatim into the
// customizer page so the live preview matches the deployed config exactly.

const EXPAND_SRC = `
function _rgb(t){return 'rgb('+t[0]+','+t[1]+','+t[2]+')';}
function _li(c,t){return [Math.min(255,Math.round(c[0]+(255-c[0])*t)),Math.min(255,Math.round(c[1]+(255-c[1])*t)),Math.min(255,Math.round(c[2]+(255-c[2])*t))];}
function _sc(c,f){return [Math.min(255,Math.round(c[0]*f)),Math.min(255,Math.round(c[1]*f)),Math.min(255,Math.round(c[2]*f))];}
function _bl(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];}
function expandPalette(p){
  var bg=p.bg,raised=p.raised,text=p.text,comment=p.comment,subtle=p.subtle,accent=p.accent,accent2=p.accent2,cyan=p.cyan,green=p.green,red=p.red,orange=p.orange,yellow=p.yellow,pink=p.pink,blue=p.blue;
  var g60=[60,60,60];
  return {
    autoAccept:_rgb(green), bashBorder:_rgb(comment), claude:_rgb(accent), claudeShimmer:_rgb(_li(accent,0.3)),
    claudeBlue_FOR_SYSTEM_SPINNER:_rgb(accent), claudeBlueShimmer_FOR_SYSTEM_SPINNER:_rgb(_li(accent,0.3)),
    permission:_rgb(orange), permissionShimmer:_rgb(_li(orange,0.35)), planMode:_rgb(cyan), ide:_rgb(blue),
    promptBorder:_rgb(comment), promptBorderShimmer:_rgb(_li(comment,0.3)), text:_rgb(text), inverseText:_rgb(bg),
    inactive:_rgb(comment), subtle:_rgb(subtle), suggestion:_rgb(cyan), remember:_rgb(yellow), background:_rgb(bg),
    success:_rgb(green), error:_rgb(red), warning:_rgb(orange), warningShimmer:_rgb(_li(orange,0.35)),
    diffAdded:_rgb(_sc(green,0.32)), diffRemoved:_rgb(_sc(red,0.4)),
    diffAddedDimmed:_rgb(_bl(_sc(green,0.32),g60,0.35)), diffRemovedDimmed:_rgb(_bl(_sc(red,0.4),g60,0.3)),
    diffAddedWord:_rgb(green), diffRemovedWord:_rgb(red), diffAddedWordDimmed:_rgb(_sc(green,0.64)), diffRemovedWordDimmed:_rgb(_sc(red,0.7)),
    red_FOR_SUBAGENTS_ONLY:_rgb(red), blue_FOR_SUBAGENTS_ONLY:_rgb(blue), green_FOR_SUBAGENTS_ONLY:_rgb(green),
    yellow_FOR_SUBAGENTS_ONLY:_rgb(yellow), purple_FOR_SUBAGENTS_ONLY:_rgb(accent2), orange_FOR_SUBAGENTS_ONLY:_rgb(orange),
    pink_FOR_SUBAGENTS_ONLY:_rgb(pink), cyan_FOR_SUBAGENTS_ONLY:_rgb(cyan), professionalBlue:_rgb(blue),
    rainbow_red:_rgb(red), rainbow_orange:_rgb(orange), rainbow_yellow:_rgb(yellow), rainbow_green:_rgb(green),
    rainbow_blue:_rgb(cyan), rainbow_indigo:_rgb(accent2), rainbow_violet:_rgb(pink),
    rainbow_red_shimmer:_rgb(_li(red,0.3)), rainbow_orange_shimmer:_rgb(_li(orange,0.3)), rainbow_yellow_shimmer:_rgb(_li(yellow,0.3)),
    rainbow_green_shimmer:_rgb(_li(green,0.3)), rainbow_blue_shimmer:_rgb(_li(cyan,0.3)), rainbow_indigo_shimmer:_rgb(_li(accent2,0.3)),
    rainbow_violet_shimmer:_rgb(_li(pink,0.3)), clawd_body:_rgb(pink), clawd_background:_rgb(bg),
    userMessageBackground:_rgb(raised), bashMessageBackgroundColor:_rgb(_bl(bg,raised,0.6)), memoryBackgroundColor:_rgb(_bl(bg,raised,0.75)),
    rate_limit_fill:_rgb(accent), rate_limit_empty:_rgb(raised)
  };
}
`;

// Starter palettes offered in the customizer (hex, converted to [r,g,b] on load).
const STARTERS = {
  'tokyo-night':      { bg:[26,27,38], raised:[41,46,66], text:[192,202,245], comment:[86,95,137], subtle:[48,52,70], accent:[122,162,247], accent2:[187,154,247], cyan:[125,207,255], green:[158,206,106], red:[247,118,142], orange:[255,158,100], yellow:[224,175,104], pink:[187,154,247], blue:[122,162,247] },
  'catppuccin-mocha': { bg:[30,30,46], raised:[49,50,68], text:[205,214,244], comment:[108,112,134], subtle:[49,50,68], accent:[203,166,247], accent2:[180,190,254], cyan:[148,226,213], green:[166,227,161], red:[243,139,168], orange:[250,179,135], yellow:[249,226,175], pink:[245,194,231], blue:[137,180,250] },
  'nord':             { bg:[46,52,64], raised:[59,66,82], text:[216,222,233], comment:[97,110,136], subtle:[67,76,94], accent:[136,192,208], accent2:[180,142,173], cyan:[143,188,187], green:[163,190,140], red:[191,97,106], orange:[208,135,112], yellow:[235,203,139], pink:[180,142,173], blue:[129,161,193] },
  'solarized-dark':   { bg:[0,43,54], raised:[7,54,66], text:[147,161,161], comment:[88,110,117], subtle:[7,54,66], accent:[38,139,210], accent2:[108,113,196], cyan:[42,161,152], green:[133,153,0], red:[220,50,47], orange:[203,75,22], yellow:[181,137,0], pink:[211,54,130], blue:[38,139,210] },
  'sunset':           { bg:[28,20,28], raised:[48,32,44], text:[245,230,235], comment:[130,100,120], subtle:[52,36,48], accent:[255,120,120], accent2:[255,160,90], cyan:[120,200,200], green:[160,210,120], red:[255,95,95], orange:[255,160,80], yellow:[255,210,120], pink:[255,140,180], blue:[150,170,255] },
  'matrix':           { bg:[6,14,8], raised:[14,28,16], text:[180,255,190], comment:[70,120,80], subtle:[16,32,20], accent:[57,255,120], accent2:[120,255,180], cyan:[80,255,200], green:[57,255,90], red:[255,90,90], orange:[210,255,120], yellow:[200,255,120], pink:[140,255,190], blue:[90,220,160] },
};

module.exports = {
  EXPAND_SRC,
  expandPalette: new Function(EXPAND_SRC + '; return expandPalette;')(),
  STARTERS,
};
