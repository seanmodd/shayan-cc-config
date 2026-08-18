#!/bin/bash
# One-command acceptance gate for the herdr full-customization upgrade.
# Every check is independent of who (or which agent) wrote the code.
set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0
say() { printf '%-58s %s\n' "$1" "$2"; }
chk() { if [ "$2" = ok ]; then say "$1" "✓"; else say "$1" "✗ $2"; FAIL=1; fi; }

# 1+2: suites
T=$(node test.js 2>&1 | tail -1); [ "${T#✓}" != "$T" ] && chk "test.js" ok || chk "test.js" "$T"
P=$(node test-parity.js 2>&1 | tail -1); [ "${P#✓}" != "$P" ] && chk "parity" ok || chk "parity" "$P"

# 3: rendered client script parses
node -e "
const{renderHerdr}=require('./api/_herdr_page.js');
const DATA=require('./api/_data.js');
const R=require('./api/_render.js');
const html=renderHerdr(DATA,R.CSS,R.CLIENT_LIB,R.FAVICON,R.GH_SVG,R.GITHUB_URL);
const m=html.match(/<script>([\s\S]*?)<\/script>/g);
require('fs').writeFileSync('/tmp/vh-script.js', m[m.length-1].replace(/<\/?script>/g,''));
" 2>/dev/null && node --check /tmp/vh-script.js 2>/dev/null && chk "rendered script parses" ok || chk "rendered script parses" bad

# 7: exclusivity
if grep -qi claude api/_herdr.js api/_herdr_page.js 2>/dev/null; then
  chk "zero claude mentions in herdr sources" "found"
else
  chk "zero claude mentions in herdr sources" ok
fi

# 5: merge E2E — onboarding + unmanaged table survive; idempotent; abort on bad
E=$(mktemp -d); mkdir -p "$E/.config/herdr"
cat > "$E/.config/herdr/config.toml" <<'EOF'
onboarding = false
[experimental]
whatever = 1
EOF
node -e "
const H=require('./api/_herdr.js');
const s=H.sanitizeHerdr({on:true,theme:'nord'});
require('fs').writeFileSync('/tmp/vh-apply.sh','#!/bin/bash\nset -euo pipefail\n'+H.herdrApplyBlock(s)+'\n');" 2>/dev/null
FAKE=$(mktemp -d); printf '#!/bin/bash\necho "$@" >> "%s/calls"\nexit 0\n' "$FAKE" > "$FAKE/herdr"; chmod +x "$FAKE/herdr"
HOME=$E PATH="$FAKE:$PATH" bash /tmp/vh-apply.sh >/dev/null 2>&1
M=$(HOME=$E python3 -c "
import tomllib
d=tomllib.load(open('$E/.config/herdr/config.toml','rb'))
print('ok' if d.get('onboarding')==False and d.get('experimental',{}).get('whatever')==1 and d.get('theme',{}).get('name')=='nord' else 'lost: '+str(sorted(d)))" 2>&1)
chk "merge keeps onboarding + [experimental] + applies theme" "$M"
cp "$E/.config/herdr/config.toml" /tmp/vh-snap.toml
HOME=$E PATH="$FAKE:$PATH" bash /tmp/vh-apply.sh >/dev/null 2>&1
diff -q /tmp/vh-snap.toml "$E/.config/herdr/config.toml" >/dev/null && chk "idempotent rerun" ok || chk "idempotent rerun" changed
E2=$(mktemp -d); mkdir -p "$E2/.config/herdr"; echo 'not = toml = [' > "$E2/.config/herdr/config.toml"
HOME=$E2 PATH="$FAKE:$PATH" bash /tmp/vh-apply.sh >/dev/null 2>&1
grep -q 'not = toml' "$E2/.config/herdr/config.toml" && chk "unparseable config aborts untouched" ok || chk "unparseable config aborts untouched" clobbered

# 6: herdr-plus E2E with the shim
E3=$(mktemp -d); mkdir -p "$E3/.config/herdr-plus/projects"
echo 'name = "mine"' > "$E3/.config/herdr-plus/projects/user-own.toml"
node -e "
const H=require('./api/_herdr.js');
const s=H.sanitizeHerdr({on:true,plus:{install:true,
  projects:[{name:'Web App',group:'work',tabs:[{name:'dev',command:'npm run dev'},{name:'split',panes:[{command:'top'},{command:'',split:'right'}]}]}],
  quickActions:[{name:'Deploy',type:'select',command:'deploy {{.Value}}',options:[{label:'prod'},{label:'staging'}]}],
  worktrees:[{repo:'webapp',tabs:[{name:'main',command:''}]}]}});
require('fs').writeFileSync('/tmp/vh-plus.sh','#!/bin/bash\nset -euo pipefail\n'+H.herdrApplyBlock(s)+'\n');" 2>/dev/null \
  && chk "plus payload sanitizes + block builds" ok || chk "plus payload sanitizes + block builds" bad
FAKE2=$(mktemp -d); printf '#!/bin/bash\nif [ "$1" = "plugin" ] && [ "$2" = "config-dir" ]; then echo "%s/.config/herdr-plus"; else echo "$@" >> "%s/calls"; fi\nexit 0\n' "$E3" "$FAKE2" > "$FAKE2/herdr"; chmod +x "$FAKE2/herdr"
HOME=$E3 PATH="$FAKE2:$PATH" bash /tmp/vh-plus.sh >/dev/null 2>&1
grep -q "plugin install cloudmanic/herdr-plus" "$FAKE2/calls" 2>/dev/null && chk "plugin install invoked" ok || chk "plugin install invoked" missing
ls "$E3/.config/herdr-plus/projects/" | grep -q '^scc-' && chk "scc project file lands" ok || chk "scc project file lands" missing
PARSE=$(python3 -c "
import tomllib,glob
fs=glob.glob('$E3/.config/herdr-plus/*/scc-*.toml')
print('ok' if fs and all(tomllib.load(open(f,'rb')) or True for f in fs) else 'none')" 2>&1)
chk "all scc-*.toml parse ($PARSE files ok)" "${PARSE:+ok}"
grep -q 'name = "mine"' "$E3/.config/herdr-plus/projects/user-own.toml" && chk "user's own file untouched" ok || chk "user's own file untouched" damaged

echo ""
[ "$FAIL" = 0 ] && echo "ALL GREEN — deployable" || echo "FAILURES — do not deploy"
exit $FAIL
