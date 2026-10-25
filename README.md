# Zeste

Zeste est une app web de bar à cocktails pour iPhone, en français : elle propose quoi boire selon ce qu'on a au bar,
garde les notes et les goûts (tout reste sur l’appareil, rien n’est envoyé), et contient un Labo pour composer et noter ses propres cocktails.
Version **1.70** · © Yannick Wahler.

- **Ouvrir l'app** : `index.html` (fichier unique, fonctionne hors ligne une fois installé sur l'écran d'accueil),
  ou l'artifact claude.ai `https://claude.ai/artifact/S4FstFgJfmaipC6JGEtoiw`.
- **Reprendre le développement** : lire d'abord [`zeste_projet/HANDOFF.md`](zeste_projet/HANDOFF.md) (architecture, pièges, règles, historique).

## Contenu du dépôt

| Chemin | Rôle |
|---|---|
| `index.html`, `sw.js`, `apple-touch-icon.png` | version déployée (copiée par `tests/all.sh` depuis `zeste_projet/`) |
| `zeste_projet/src/` | sources : `style.css`, données (`data_*.js`), moteur (`core.js`), interface (`ui.js`, `labo2.js`…), un module par version (`v117.js` → `v174.js`) |
| `zeste_projet/build.sh` | assemble `zeste_projet/dist/zeste.html` (HTML, CSS, JS, polices et icônes dans un seul fichier, ~1 Mo) |
| `zeste_projet/sw.js` | service worker : cache d'abord, mise à jour en arrière-plan |
| `zeste_projet/assets/` | icônes, logo, polices (Fraunces, Figtree ; licences OFL) et licence des icônes Lucide |
| `zeste_projet/data/` | références de vérification : recettes officielles IBA (`iba.json`), appariements (`ibapairs.json`), rapport (`ibareport.json`) |
| `zeste_projet/tests/` | banc de tests (voir ci-dessous) |

## Construire et tester

Depuis `zeste_projet/` :

```sh
sh build.sh                         # → dist/zeste.html
NODE_PATH=$(npm root -g) sh tests/all.sh   # tout, s'arrête au premier échec ; copie dist vers ../index.html
```

Prérequis : Node ≥ 18 avec Playwright (Chromium) installé globalement ; Python ≥ 3.12 avec `playwright` pour `tests/fuzz.py` ;
WebKit testé si `WebKitWebDriver` est présent (`apt-get install webkit2gtk-driver xvfb`).

`tests/all.sh` lance : validation des données (`v.js`, `validate.js`), comparaison IBA (`ibacmp.js`), cohérence (`audit2.js`),
simulateurs du moteur de recommandation (`m3`, `m5`, `m6`), score du Labo (`m9`, graines 1 et 2), ouverture de toutes les fiches
(`smoke.js`), contraste WCAG (`contrast.js`), VoiceOver et cibles tactiles (`a11y.js`), WebKit, les tests de fonctionnalités
(`tests/features/*.js`) et le fuzz. Outils hors suite : `m7.js`, `m8.js` (moteur), `audit.js`, `txt.js` (relecture des données et
des textes), `deadcode.js`, `sounds.js`, `perf.py`.

## Livrer une version

1. Incrémenter `APP_VERSION` (`src/v117.js`) et `CACHE` (`sw.js`) : sans nouveau `CACHE`, les iPhone gardent l'ancienne version.
2. `sh tests/all.sh` doit passer.
3. Commit sur la branche de travail, fusion dans `main`, republication de l'artifact.
