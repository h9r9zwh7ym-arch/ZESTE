#!/bin/sh
# Assemble Zeste en un seul fichier HTML : dist/zeste.html. À lancer depuis la racine du projet.
cd "$(dirname "$0")"
mkdir -p dist
# icônes (logo Zeste) incluses dans le fichier : l'app reste autonome, où qu'elle soit hébergée
ICON=$(base64 -w0 assets/apple-touch-icon.png); FAV=$(base64 -w0 assets/favicon-32.png)
# polices de la marque (OFL, voir assets/fonts) : Fraunces figée en version « soft », Figtree ; sous-ensemble latin, incluses aussi
FSERIF=$(base64 -w0 assets/fonts/fraunces-soft.woff2); FSANS=$(base64 -w0 assets/fonts/figtree.woff2)
{
echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Zeste"><meta name="application-name" content="Zeste"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="theme-color" content="#F7F1E3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0E1410" media="(prefers-color-scheme: dark)"><meta name="description" content="Ton bar, tes cocktails : recettes vérifiées, suggestions selon tes goûts et ce que tu as chez toi.">'
echo "<link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"data:image/png;base64,$ICON\"><link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"data:image/png;base64,$FAV\">"
echo '<title>Zeste</title><style>'
echo "@font-face{font-family:ZesteSerif;src:url(data:font/woff2;base64,$FSERIF) format('woff2');font-weight:500 700;font-display:swap}@font-face{font-family:ZesteSans;src:url(data:font/woff2;base64,$FSANS) format('woff2');font-weight:400 800;font-display:swap}"
cat src/style.css
echo '</style></head><body><div id="app"><div class="view" id="v-today"></div><div class="view" id="v-cocktails"></div><div class="view" id="v-bar"></div><div class="view" id="v-labo"></div><div class="view" id="v-profil"></div></div><nav class="tabbar" aria-label="Onglets"></nav><div id="sheets"></div><div id="overlay" role="dialog"></div><div id="toast" role="status" aria-live="polite"></div><script>'
cd src; cat data_ing.js data_rec.js data_lab.js data_more.js data_more2.js data_na.js data_food.js data_final.js data_118.js data_world.js data_iba.js core.js icons.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js v122.js v123.js v124.js v125.js v127.js ui_final.js v126.js v130.js; cd ..
echo '</script></body></html>'
} > dist/zeste.html
echo "dist/zeste.html : $(wc -c < dist/zeste.html) octets"
