# Passation du projet Zeste — pour Claude Code

Tu reprends **Zeste**, une app web de bar à cocktails pour iPhone, développée en conversation avec Claude (claude.ai). Ce document contient tout ce qu’il faut pour continuer le travail. Lis-le entièrement avant de toucher au code.

## 1. Le propriétaire et ses exigences

- **Yannick Wahler** (« YaYa »), étudiant en génie mécanique en Suisse. Il parle **français** : réponds et écris l’interface en français.
- Il utilise l’app sur **iPhone (Safari)**. Beaucoup de bugs n’apparaissent que dans Safari/WebKit : c’est la cible réelle.
- **Priorité absolue : la véracité.** Pour toute information ajoutée ou modifiée (recettes, proportions, techniques, verrerie, glace, garnitures, dilution, conseils, UX, modèles de recommandation), vérifie avec des sources reconnues, plusieurs si besoin. N’invente jamais une recette ou une technique. Si une information fait débat, présente l’incertitude honnêtement.
- **Conserver ce qui marche** : analyser le code avant de modifier, ne pas réécrire inutilement, garder l’architecture et le design.
- **Numérotation des versions** : la version actuelle est **1.20**. Chaque mise à jour livrée incrémente : 1.21, 1.22… La constante est `APP_VERSION` dans `src/v117.js`.
- Copyright affiché dans « À propos » : `© <année> Yannick Wahler. Tous droits réservés.` (constante `COPYRIGHT`, même fichier).
- Style de travail apprécié : tester réellement (captures, mesures), annoncer honnêtement ce qui a été vérifié et ce qui ne l’a pas été, expliquer les bugs trouvés.

## 2. Démarrage rapide

```sh
sh build.sh                 # assemble dist/zeste.html (fichier unique, ~660 Ko)
node tests/v.js             # validation des données (doit afficher « aucune erreur »)
python3 tests/fuzz.py       # batterie complète dans Chromium (Playwright) : fiches, clics, labo, sauvegardes
node tests/m3.js            # simulateur du moteur de recommandation (avec notes)
node tests/m5.js            # simulateur du quiz initial (démarrage à froid)
python3 tests/perf.py       # mesures de performance (processeur ralenti ×4)
```

Tous les scripts se lancent **depuis la racine du projet**. Playwright (Chromium) est requis pour les `.py` (`pip install playwright && playwright install chromium`). **Installe aussi WebKit** (`playwright install webkit`) et teste dans WebKit : c’était impossible dans l’environnement précédent, et plusieurs bugs n’existaient que dans Safari.

## 3. Architecture

**Un seul fichier HTML**, sans dépendance ni framework : HTML + CSS + JS vanilla assemblés par `build.sh`. L’ordre de concaténation est important :

```
style.css
data_ing.js data_rec.js data_lab.js data_more.js data_more2.js data_na.js data_food.js data_final.js data_118.js data_world.js
core.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js ui_final.js
```

- **Données** (`data_*.js`) : `ING_RAW` (ingrédients) et `REC_RAW` (recettes) sont des tableaux ; les fichiers suivants font des `push`. `buildRecipes()` compile en `RECS` (liste) et `RMAP` (dictionnaire par id).
  - Format d’une recette : `[id, nom, famille, méthode, verre, glace, couleur, [[ingrédient, quantité, unité?, rôle?], …], garniture, {options}]`.
  - Unités : `ml` (par défaut), `d` (trait), `f` (feuille), `u` (unité). Rôles : `top` (compléter), `float`, `rinse`, `opt` (facultatif).
  - Méthodes : `shake`, `stir`, `build`, `mbuild` (piler puis construire), `mshake`, `hot`, `louche`.
  - Verres : `coupe`, `martini`, `rocks`, `highball`, `flute`, `vin`, `mug`, `tasse`, `shot`.
  - Glace : `none`, `cubes`, `big`, `pilee`.
  - Options : `c` (classique), `s` (suisse), `cr` (création maison **non testée**), `na` (sans alcool), `se` (mois de saison), `v` (variantes), `h` (histoire), `n` (conseil).
- **`core.js`** : moteur (calcul d’équilibre `calc`, profils `profileR`, dessin SVG `glassSVG`/`garnishSVG`/`bottleSVG`, modèle de recommandation `getModel`/`predict`/`tonight`, quiz `QUIZ`/`quizPrior`, coût).
- **`ui.js`** : interface de base (5 onglets : Aujourd’hui, Cocktails, Bar, Labo, Profil ; feuilles modales ; mode barman ; roulette).
- **Modules suivants** : chaque version a ajouté un fichier (`ui10`, `labo2`, `trophies`, `explore`, `chal`, `sound`, `v117`, `v118`, `v120`). **Convention importante** : ils modifient le comportement en **redéfinissant ou enveloppant** des fonctions existantes.
  - Une déclaration `function f()` ultérieure remplace l’antérieure (hissage JS).
  - Les enveloppes réassignent : `const _f=f; f=function(){ … _f() … }`.
  - Les actions se complètent via `Object.assign(ACT,{…})`.
  - Avant de modifier une fonction, cherche **toutes** ses redéfinitions et enveloppes dans les modules suivants.
- **`ui_final.js`** se termine par `fixState(); applyTheme(); init(); applyFx();` : c’est le démarrage de l’app. Rien ne doit s’exécuter avant la fin du chargement de tous les modules.
- **Actions** : tout élément avec `data-a="nom"` déclenche `ACT.nom(dataset, élément)` par délégation d’événements.
- **État** : objet global `S`, sauvegardé dans `localStorage` (clé `zeste.v1`) par `save()`, et synchronisé avec le compte via la capacité `db` quand elle existe. Champs principaux :
  - bar et notes : `stock` (niveau 0–4 des bouteilles suivies), `ratings`, `rt` (dates des notes), `hist` (cocktails préparés `{id,t}`), `fav`, `custom` (créations) ;
  - personnalisation : `adj` (recettes ajustées), `price`, `opened` (dates de débouchage des bouteilles gazeuses), `quiz` ;
  - progression : `tro` et `troT` (trophées et dates), `chal` (défis), `mix` (état du labo) ;
  - `settings` : unit, cur, theme, fx, sound, vol, home, barView, glasses, wake, remind, untested, explore, ctx, na, ambiance, moment…
- **Rendu** : `renderView(onglet)` régénère le HTML d’un onglet. `changed()` sauvegarde et redessine l’onglet visible, sauf s’il est couvert par une feuille : il sera alors redessiné à la fermeture. `paintSheet`/`refreshSheets` gèrent les feuilles.

### Environnement d’exécution (claude.ai)

L’app est publiée comme artifact sur claude.ai : `https://claude.ai/artifact/S4FstFgJfmaipC6JGEtoiw`. Le code utilise `window.claude.use("downloads")` pour l’export de sauvegarde et l’image du Rewind, et une synchronisation via la capacité `db` et l’identifiant utilisateur (`user`). **Ces API n’existent pas hors de claude.ai.** Le code a des replis : feuille de texte, partage natif, image affichée à enregistrer d’un appui long. Pour republier, YaYa devra recoller `dist/zeste.html` dans claude.ai (ou l’héberger ailleurs : les replis prendront le relais).

## 4. Pièges connus (tous déjà rencontrés)

1. **Safari et les animations CSS dans un SVG** : si un conteneur est en train de faire une transition ou une animation (fondu, zoom), Safari peut relancer en boucle les animations CSS des éléments internes au SVG. Pour tout mouvement de liquide ou de reflet, utiliser **SMIL** (`<animateTransform … begin="indefinite">` puis `beginElement()`), comme dans le labo et l’étagère.
2. **`confirm()`/`alert()` bloqués** dans le cadre sécurisé de claude.ai : utiliser `confirmSheet({title,html,ok,onOk,danger})` (dans `v120.js`).
3. **Import de fichier sur iOS** : le `<input type="file">` doit être attaché au DOM (voir `importData`).
4. **Audio sur iOS** : le déblocage ne fonctionne qu’à la **fin** d’un geste (`touchend`/`click`), pas sur `pointerdown`. Les sons sont synthétisés (Web Audio, `sound.js`) ; en mode silencieux de l’iPhone, ils restent coupés, et c’est voulu. Le jingle de lancement ne peut pas jouer avant un premier toucher : c’est une règle d’iOS.
5. **Conflits de noms de classes CSS** : `.empty` existait déjà et a écrasé une étiquette de l’étagère. Préfixer les nouvelles classes.
6. **Heures** : toujours passer par `momentForHour(h)` (heure locale via `Date#getHours`). Un bug classait minuit–4 h en « après-midi ».
7. **Harnais Node** (`tests/*.js`) : ils évaluent le bundle avec un faux DOM. Si tu ajoutes du code qui s’exécute au chargement (`window.addEventListener`, `document.createElement`…), complète les bouchons en tête de fichier.
8. **Performances** : la liste des cocktails s’affiche par paquets (bouton « Afficher plus ») ; les dessins de verres sont mis en cache (`GFULL`, `THUMB`) et invalidés dans `buildRecipes`. Toute nouvelle vue lourde doit suivre le même principe.

## 5. Ce qui existe (résumé)

- **Bar** : 358 recettes, 138 ingrédients, stock par niveaux, étagère visuelle, onglet « Presque vides », achats malins, prix et coût par verre, bouteilles gazeuses débouchées suivies automatiquement.
- **Suggestions** : modèle hybride (voisins pondérés par similarité, ingrédients, familles et alcools, direction du profil de goût) avec poids adaptatifs, contexte horaire et saisonnier, diversification, créneau de découverte et démarrage à froid par la notoriété.
- **Quiz initial** : 9 questions, dont 8 cocktails à évaluer, choisis par popularité × information d’après Rashid et al., IUI 2002. Les réponses deviennent des pseudo-notes, avec un poids de 0,35 réglé puis validé par simulation.
- **Labo** : jeu du barman avec verre, contenance, glace, décor (bonus, hors note), objectifs, fenêtre de service animée, conseils cliquables et défis hebdomadaires.
- **Explorer** : carte du monde (plein écran, glisser et pincer), lignées vérifiées, radar inversé.
- **Plaisir d’usage** : Rewind annuel en décembre et récaps mensuels (dans « Pour toi »), 50 trophées dont 8 cachés, sons, ambiance horaire, accords mets et cocktails, mode sans alcool, réglages, sauvegarde et import robustes.

## 6. Travail en cours : vérification des recettes (À TERMINER EN PRIORITÉ)

**Source de référence** : les recettes officielles de l’IBA, extraites d’iba-world.com en août 2025 (dépôt GitHub `kolaente/iba-cocktails-list`), dans `data/iba.json` : 102 cocktails avec doses en ml, méthode, garniture et URL officielle.

**Outils** :
- `tests/ibamap.js` apparie les cocktails de l’IBA avec ceux de Zeste (→ `data/ibapairs.json`). Ajouter manuellement la paire `["South Side","southside"]`, déjà gérée dans `ibacmp.js`.
- `tests/ibacmp.js` compare ingrédients, doses (tolérance 5 ml ou 20 %), verre et méthode, et écrit `data/ibareport.json`.

**État** : 92 cocktails comparés, 32 conformes, 60 à examiner. Une partie des écarts sont des **faux positifs du comparateur**, à corriger dans les règles :
- « stir gently » dans le verre veut dire « construit », pas « verre à mélange » ;
- « tall tumbler » veut dire highball ;
- certains noms d’ingrédients sont encore mal reliés : « White Cuban Ron », « Bénédictine » avec accent, lignes avec « pcs », « Donn’s Mix »…

**Politique décidée avec YaYa** :
- pour un cocktail de la liste IBA, aligner ingrédients, doses, verre, méthode et garniture sur la recette officielle ;
- si l’IBA autorise plusieurs verres, garder le choix actuel s’il est autorisé ;
- une variante très répandue et **documentée** peut être mentionnée dans la note `n`, jamais présentée comme officielle ;
- une variante historique différente, portant un nom distinct, peut rester, par exemple l’Alexander au gin (Zeste a déjà la Brandy Alexander, qui correspond à l’« Alexander » de l’IBA).

**Écarts réels relevés** (Zeste → IBA), à corriger après relecture de `data/iba.json` :

| Cocktail | Correction à faire |
|---|---|
| Boulevardier | verre à cocktail (coupe) sans glace, au lieu de rocks avec gros glaçon |
| Cardinale | gin 40, vermouth dry 20, Campari 10 ; verre à cocktail |
| Corpse Reviver n° 2 | 30/30/30/30 (gin, Cointreau, Lillet blanc, citron) et 1 trait d’absinthe **dans** le cocktail, pas en rinçage |
| Negroni | construit directement dans un verre old fashioned sur glace (méthode `build`) |
| Old Fashioned | 45 ml de whiskey, 1 morceau de sucre, quelques traits d’Angostura et quelques traits d’eau, piler, glace, remuer ; garniture orange et cerise |
| Dry Martini | 60/10 ; les orange bitters ne sont pas dans la recette IBA (les passer en `opt` ou les retirer) |
| Manhattan | rye 50, vermouth 20, 1 trait d’Angostura ; garniture cerise |
| Whiskey Sour | bourbon 45, citron 25, sirop 20, blanc d’œuf facultatif |
| Espresso Martini | Kahlúa 30 au lieu de 20 |
| Mojito | 2 cuillères à café de sucre de canne blanc (et non 20 ml de sirop), citron vert 20, rhum 45, eau gazeuse ; garniture menthe et rondelle de citron vert |
| Paloma | 50 ml de tequila, 5 ml de citron vert, une pincée de sel, 100 ml de soda au pamplemousse rose (il faut l’ingrédient « soda au pamplemousse ») |
| Paper Plane | 30/30/30/30 |
| Penicillin | scotch blend 60, Islay 7,5 flotté, citron 22,5, sirop de miel 22,5, 2–3 tranches de gingembre frais pilées. Vérifier que Zeste utilise le gingembre frais ou documenter l’écart (Zeste utilise un sirop gingembre-miel, une pratique courante mais pas celle de l’IBA) |
| Pisco Sour | **citron jaune** 30 (pas citron vert), sirop 20, blanc d’œuf ; quelques traits d’amargo bitters **en garniture** sur la mousse |
| Planter’s Punch | version IBA minimaliste : rhum jamaïcain 45, citron vert 15, jus de canne 30, construit ; il faut un ingrédient « jus de canne ». Les versions aux jus d’orange et d’ananas peuvent être mentionnées comme variante courante |
| Porn Star Martini | vodka vanille 50, liqueur de fruit de la passion 20, purée de passion 50, 2 cuillères de sucre vanillé ; 50 ml de champagne servis à côté ; pas de citron vert |
| Sazerac | **cognac** 50 (IBA), absinthe 10 ml en rinçage, 1 sucre, 2 traits de Peychaud’s. La version au rye est aussi historique et très répandue : garder l’une et expliquer, ou proposer les deux |
| Vieux Carré | 30/30/30, 1 cuillère de bar de Bénédictine, 2 traits de Peychaud’s (pas d’Angostura dans la version IBA), verre à cocktail |
| Irish Coffee | whiskey 50, café chaud 120, crème froide 50, 1 cuillère à café de sucre |
| Moscow Mule | vodka 45, ginger beer 120, citron vert 10 ; mug ou rocks |
| Mai Tai | rhum jamaïcain ambré 30, rhum de mélasse de Martinique 30, curaçao orange 15, orgeat 15, citron vert 30 (Zeste : 25), sirop 7,5 |
| Gin Fizz | servi **sans glace** dans un tumbler fin (Zeste : highball sans glace, à confirmer) |
| Gin Basil Smash | l’IBA le sert dans un verre à cocktail refroidi, sans glace (Zeste : rocks avec glaçons) |
| Zombie | 45 rhum jamaïcain foncé, 45 rhum doré de Porto Rico, 30 rhum demerara, citron vert 20, falernum 15, Donn’s Mix 15 (2 parts de pamplemousse pour 1 de sirop de cannelle), 1 cuillère à café de grenadine, 1 trait d’Angostura, 6 gouttes de Pernod ; mixé avec 170 g de glace concassée |
| South Side | **citron jaune** 30 (pas citron vert), gin 60, sirop 15, 5–6 feuilles de menthe, blanc d’œuf facultatif ; double filtrage dans un verre à cocktail |
| Tommy’s Margarita | tequila 60, citron vert 30, nectar d’agave 30 (Zeste : 15) |
| Lemon Drop Martini | vodka 30, triple sec 20, citron 15, sans sirop |
| Long Island Iced Tea | sirop 30 au lieu de 15 |
| French Martini | ananas 15 au lieu de 45 |
| French Connection | 35/35 |
| Grasshopper | 20/20/20 (cacao blanc, menthe verte, crème) |
| Hemingway Special | rhum 60, pamplemousse 40, marasquin 15, citron vert 15 |
| Bee’s Knees | gin 52,5, 2 cuillères à café de sirop de miel, citron 22,5, **orange 22,5** (spécificité IBA ; la version gin-citron-miel est aussi très répandue : le mentionner) |
| Autres | Canchánchara, Champagne Cocktail, Dark ’n’ Stormy (pas de citron vert dans la recette IBA), John Collins (IBA : **gin**, pas bourbon), Martinez (orange bitters), Monkey Gland, Rabo de Galo (Cynar), Ramos (crème 60, vanille), Remember the Maine, Sea Breeze, Sherry Cobbler, Stinger (remué), Suffering Bastard, Three Dots and a Dash, Tuxedo, Pisco Punch, Missionary’s Downfall : relire ligne par ligne dans `data/ibareport.json` |

**Ensuite** :
1. **Relancer le comparateur** jusqu’à obtenir 0 écart réel. Mettre à jour `h` (histoire) et `n` (conseil) si une correction les contredit, et relancer `node tests/v.js`, `python3 tests/fuzz.py` et les simulateurs (`m3`, `m5`), puisque les profils de goût changent.
2. **Ajouter les 10 cocktails de l’IBA absents** de Zeste, avec leur recette officielle : Angel Face, Casino, Don’s Special Daiquiri, Grand Margarita, IBA Tiki, Illegal, Paradise, Russian Spring Punch, Spicy Fifty, Ve.N.To. Ajouter les ingrédients manquants.
3. **Vérifier les recettes populaires hors IBA**, en commençant par la liste `POPULAR` dans `ui.js` : Gin tonic, Aperol Spritz (vérifier la version IBA « Spritz »), Moscow Mule, Hugo, Negroni Sbagliato, Garibaldi, Limoncello Spritz, etc. Utiliser des sources reconnues (Difford’s Guide, PUNCH, sites des marques pour leurs cocktails signature) et croiser au moins deux sources.
4. **Les 32 créations suisses** (`cr:1`) ne sont pas des recettes établies : elles sont marquées « à tester ». Ne jamais les présenter comme traditionnelles.

## 7. Autres chantiers proposés (après la vérification)

1. **Accessibilité** (recommandations d’Apple, WCAG 2.2) :
   - libellés VoiceOver pour les verres, médailles, graphiques et radar ;
   - taille de texte qui suit les réglages du système (unités relatives) ;
   - contraste des textes gris.
2. **Audit d’ergonomie de la navigation** : l’app est très riche, regrouper ce qui peut l’être.
3. **Liste de courses** exportable : bouteilles vides et achats malins.
4. **Carte recette à partager** (image), en réutilisant le principe du Rewind (SVG vers canvas vers PNG).
5. **Tests sur un vrai iPhone ou dans WebKit**, et correction de ce qui ne marche que dans Chromium.

## 8. Méthode de travail attendue

- Lire le code concerné, **y compris les redéfinitions** dans les modules suivants, avant de modifier.
- Faire un changement à la fois, reconstruire (`sh build.sh`), lancer `node tests/v.js` et `python3 tests/fuzz.py`, puis vérifier visuellement avec Playwright (captures).
- Pour toute donnée de cocktail : citer la source (IBA de préférence) dans ton compte rendu à YaYa.
- Pour tout changement du modèle de recommandation : mesurer avec `tests/m3.js` et `tests/m5.js`, puis régler sur une graine et valider sur une autre (`SEED=…`) pour éviter le sur-ajustement.
- À la fin de chaque livraison : incrémenter `APP_VERSION` et expliquer à YaYa ce qui a changé, ce qui a été vérifié, et les limites.
