#!/bin/sh
# Lance toute la batterie de vérification ; s'arrête au premier échec. À lancer depuis zeste_projet/.
# Prérequis : Node, Playwright (npm) et Chromium ; Python ≥ 3.12 avec playwright pour fuzz.py ;
# pour WebKit (Ubuntu) : apt-get install webkit2gtk-driver xvfb
set -e
PY=${PY:-python3}
export NODE_PATH=${NODE_PATH:-$(npm root -g)}
sh build.sh
echo "— données";      node tests/v.js | tail -1; node tests/validate.js
echo "— IBA";          node tests/ibacmp.js | head -1
echo "— cohérence";    node tests/audit2.js | tail -1
echo "— prédiction";   node tests/m3.js | tail -3; node tests/m5.js | tail -1; SEED=1 node tests/m6.js
echo "— Chromium";     node tests/smoke.js | tail -2
echo "— contraste";    node tests/contrast.js | grep -c "0 problème" | sed 's/$/ vues sans problème de contraste sur 12/'
echo "— VoiceOver";    node tests/a11y.js | grep -c '"sansNom":{}' | sed 's/$/ vues sans élément muet sur 6/'
if command -v WebKitWebDriver >/dev/null 2>&1; then echo "— WebKit"; node tests/webkit.js | tail -1; else echo "— WebKit : non installé, test sauté"; fi
echo "— fuzz";         $PY tests/fuzz.py | tr -d '\n '; echo
cp dist/zeste.html ../index.html
echo "Tout est passé. ../index.html est à jour."
