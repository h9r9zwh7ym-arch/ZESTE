#!/bin/sh
# Assemble Zeste en un seul fichier HTML : dist/zeste.html. À lancer depuis la racine du projet.
cd "$(dirname "$0")"
mkdir -p dist
{
echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="theme-color" content="#F2F2F7" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)"><title>Zeste</title><style>'
cat src/style.css
echo '</style></head><body><div id="app"><div class="view" id="v-today"></div><div class="view" id="v-cocktails"></div><div class="view" id="v-bar"></div><div class="view" id="v-labo"></div><div class="view" id="v-profil"></div></div><nav class="tabbar" aria-label="Onglets"></nav><div id="sheets"></div><div id="overlay" role="dialog"></div><div id="toast" role="status" aria-live="polite"></div><script>'
cd src; cat data_ing.js data_rec.js data_lab.js data_more.js data_more2.js data_na.js data_food.js data_final.js data_118.js data_world.js core.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js ui_final.js; cd ..
echo '</script></body></html>'
} > dist/zeste.html
echo "dist/zeste.html : $(wc -c < dist/zeste.html) octets"
