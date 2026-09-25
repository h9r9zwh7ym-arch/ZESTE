# Passation du projet Zeste — pour Claude Code

Tu reprends **Zeste**, une app web de bar à cocktails pour iPhone, développée en conversation avec Claude (claude.ai). Ce document contient tout ce qu’il faut pour continuer le travail. Lis-le entièrement avant de toucher au code.

## 1. Le propriétaire et ses exigences

- **Yannick Wahler** (« YaYa »), étudiant en génie mécanique en Suisse. Il parle **français** : réponds et écris l’interface en français.
- Il utilise l’app sur **iPhone (Safari)**. Beaucoup de bugs n’apparaissent que dans Safari/WebKit : c’est la cible réelle.
- **Priorité absolue : la véracité.** Pour toute information ajoutée ou modifiée (recettes, proportions, techniques, verrerie, glace, garnitures, dilution, conseils, UX, modèles de recommandation), vérifie avec des sources reconnues, plusieurs si besoin. N’invente jamais une recette ou une technique. Si une information fait débat, présente l’incertitude honnêtement.
- **Conserver ce qui marche** : analyser le code avant de modifier, ne pas réécrire inutilement, garder l’architecture et le design.
- **Numérotation des versions** : la version actuelle est **1.23**. Chaque mise à jour livrée incrémente : 1.21, 1.22, 1.23… La constante est `APP_VERSION` dans `src/v117.js`.
- Copyright affiché dans « À propos » : `© <année> Yannick Wahler. Tous droits réservés.` (constante `COPYRIGHT`, même fichier).
- Style de travail apprécié : tester réellement (captures, mesures), annoncer honnêtement ce qui a été vérifié et ce qui ne l’a pas été, expliquer les bugs trouvés.

## 2. Démarrage rapide

```sh
sh tests/all.sh           # TOUT : build, données, IBA, prédiction, Chromium, contraste, VoiceOver, WebKit, fuzz ; s’arrête au premier échec
sh build.sh                 # assemble dist/zeste.html (fichier unique, ~660 Ko)
node tests/v.js             # validation des données (doit afficher « aucune erreur »)
node tests/validate.js      # validation stricte : unités, rôles, verres, doublons
node tests/ibacmp.js        # comparaison avec les recettes officielles de l’IBA (-v : tableau méthode/verre)
NODE_PATH=$(npm root -g) node tests/smoke.js   # ouvre les 368 fiches dans Chromium
python3 tests/fuzz.py       # (Python ≥ 3.12) batterie complète dans Chromium (Playwright) : fiches, clics, labo, sauvegardes
node tests/m3.js            # simulateur du moteur de recommandation (avec notes)
node tests/m5.js            # simulateur du quiz initial (démarrage à froid)
python3 tests/perf.py       # mesures de performance (processeur ralenti ×4)
```

Tous les scripts se lancent **depuis la racine du projet**. Playwright (Chromium) est requis pour les `.py` (`pip install playwright && playwright install chromium`). **Installe aussi WebKit** (`playwright install webkit`) et teste dans WebKit : c’était impossible dans l’environnement précédent, et plusieurs bugs n’existaient que dans Safari.

Autres outils (1.22) : `tests/m6.js` (simulateur réaliste des recommandations, `SEED=`), `tests/contrast.js` (WCAG 2.2, clair et sombre), `tests/a11y.js` (VoiceOver, cibles tactiles), `tests/sounds.js` (crête et intensité de chaque son, rendu hors ligne), `tests/audit2.js` (doublons, glace, contenance), `tests/webkit.js` (WebKit via WebKitGTK : `apt-get install webkit2gtk-driver xvfb`, car le WebKit de Playwright ne se télécharge pas ici).

## 3. Architecture

**Un seul fichier HTML**, sans dépendance ni framework : HTML + CSS + JS vanilla assemblés par `build.sh`. L’ordre de concaténation est important :

```
style.css
data_ing.js data_rec.js data_lab.js data_more.js data_more2.js data_na.js data_food.js data_final.js data_118.js data_world.js data_iba.js
core.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js v122.js v123.js ui_final.js
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
- **Modules suivants** : chaque version a ajouté un fichier (`ui10`, `labo2`, `trophies`, `explore`, `chal`, `sound`, `v117`, `v118`, `v120`, `v122`, `v123`). **Convention importante** : ils modifient le comportement en **redéfinissant ou enveloppant** des fonctions existantes.
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
9. **Animations CSS dans les SVG = coût permanent** : elles tournent sur le fil principal et forcent un recalcul complet 60 fois par seconde. Les limiter à quelques cycles (`animation-iteration-count`) et les relancer au toucher (`reanimate` dans `v122.js`) ; mettre en pause ce qui est invisible. Une animation CSS terminée ne redémarre qu’en changeant de nom (d’où `wave`/`wave_b`).
10. **Web Audio** : un gain vaut 1 par défaut ; toujours l’initialiser au silence (`g.gain.value=0.0001`) avant de programmer l’enveloppe, sinon les premiers échantillons claquent.
11. **Tailles de police en `rem`** (1 rem = 17 px à la taille standard) : la racine suit Dynamic Type ou le réglage « Taille du texte ». Ne plus écrire de `font-size` en px ; prévoir que les libellés peuvent passer sur deux lignes (`.txt-big`).
12. **Tubes shell** : `node tests/v.js | tail -1` masque un échec ; utiliser `tests/all.sh` (`set -e`) ou `set -o pipefail`.
8. **Performances** : la liste des cocktails s’affiche par paquets (bouton « Afficher plus ») ; les dessins de verres sont mis en cache (`GFULL`, `THUMB`) et invalidés dans `buildRecipes`. Toute nouvelle vue lourde doit suivre le même principe.

## 5. Ce qui existe (résumé)

- **Bar** : 366 recettes, 158 ingrédients, stock par niveaux, étagère visuelle, onglet « Presque vides », achats malins, prix et coût par verre, bouteilles gazeuses débouchées suivies automatiquement.
- **Suggestions** : modèle hybride (voisins pondérés par similarité, ingrédients, familles et alcools, direction du profil de goût) avec poids adaptatifs, contexte horaire et saisonnier, diversification, créneau de découverte et démarrage à froid par la notoriété.
- **Quiz initial** : 9 questions, dont 8 cocktails à évaluer, choisis par popularité × information d’après Rashid et al., IUI 2002. Les réponses deviennent des pseudo-notes, avec un poids de 0,35 réglé puis validé par simulation.
- **Labo** : jeu du barman avec verre, contenance, glace, décor (bonus, hors note), objectifs, fenêtre de service animée, conseils cliquables et défis hebdomadaires.
- **Explorer** : carte du monde (plein écran, glisser et pincer), lignées vérifiées, radar inversé.
- **Plaisir d’usage** : Rewind annuel en décembre et récaps mensuels (dans « Pour toi »), 50 trophées dont 8 cachés, sons, ambiance horaire, accords mets et cocktails, mode sans alcool, réglages, sauvegarde et import robustes.

## 6. Vérification des recettes

### Fait en 1.21 (liste IBA)
- Les 102 cocktails de l’IBA (`data/iba.json`, relevé d’iba-world.com du 16 août 2025) sont alignés : ingrédients, doses, méthode, verre, garniture. `node tests/ibacmp.js` donne **102 conformes, 0 à examiner**.
- Les 10 cocktails absents ont été ajoutés (Angel Face, Casino, Don’s Special Daiquiri, Grand Margarita, IBA Tiki, Illegal, Paradise, Russian Spring Punch, Spicy Fifty, Ve.N.To), avec 20 ingrédients nouveaux. Tout est dans `src/data_iba.js`, sauf les recettes existantes corrigées sur place dans leur fichier d’origine.
- Substitutions et écarts assumés : listés dans `ALT` et `EXC` de `tests/ibacmp.js`, et toujours expliqués dans la note `n` de la fiche (curaçao → triple sec, rhums Havana Club → rhum ambré, amargo → Angostura, champagne servi à côté du Porn Star Martini…).
- « Quelques gouttes de blanc d’œuf » (IBA) est traduit par 15 ml ; un « top » de champagne sans dose par 90 ml.
- Nouveaux mécanismes : unités `br` (brin) et `gt` (goutte) ; clé de recette `st` (étapes propres, qui remplacent les étapes générées : sucre en morceau, mixeur…) ; côté ingrédient, `u` (unité par défaut), `uL` (libellé de l’unité), `yml` (jus libéré par fruit) et `bsml` (volume d’une cuillère de sucre).
- `data/ibapairs.json` ne contient plus que les appariements que le nom ne permet pas de trouver ; `tests/ibamap.js` est supprimé.

### Fait en 1.22
- Recettes populaires hors IBA vérifiées (Difford’s Guide, PUNCH, sites des marques, créateurs) : Amaretto Sour (Morgenthaler), Painkiller (4-1-1 de Pusser’s), Hurricane (recette d’origine), Death in the Afternoon (dose d’Hemingway), Campari et Limoncello Spritz (3-2-1), Hugo (Roland Gruber), Kir royal, Chrysanthemum (Savoy 2:1). Les autres classiques ont été relus et correspondent aux références connues.
- Doublons fusionnés : `airmail` → `air_mail`, `harvey_wallbanger` → `harvey` ; `ID_ALIAS` et `migrateIds()` (dans `ui_final.js`) reportent notes, historique, favoris et réglages.
- Ingrédients « formes » (`al:` dans `data_iba.js`) : citron vert en quartiers, jaune d’œuf, etc. suivent leur produit et sont masqués des listes.

### Reste à faire
1. Recettes non classiques (hors `c:1`) : pas encore vérifiées une à une.
2. Les 32 créations suisses (`cr:1`) restent « à tester » : ne jamais les présenter comme traditionnelles.

### Fait en 1.23

- **Suggestions par occasion** (`src/v123.js`) : une carte apparaît à l'accueil (section « Occasions à venir », activable/désactivable comme les autres) à l'approche de la Saint-Valentin, Pâques (date calculée, algorithme de Gauss), la Fête nationale suisse, Halloween, Noël et le Réveillon. Elle s'affiche entre `lead` jours avant et le jour même (`OCCASIONS[].lead`), puis disparaît d'elle-même le lendemain — aucun nettoyage manuel nécessaire, tout est recalculé à partir de la date du jour à chaque rendu. La feuille ouverte au toucher (`occasionSheet`) liste les recettes proposées pour l'occasion et les ingrédients qui manquent encore, pour laisser le temps de les acheter.
- Recettes choisies avec des IDs déjà vérifiés/existants dans le jeu de données (pas de nouvelle recette ajoutée). Couleurs de dégradé propres à chaque occasion, dans le même esprit que la carte « Zeste Rewind » (`.rw-card`) — réutilisée telle quelle, sans nouveau CSS.
- Testé avec un script ad hoc (Chromium/Playwright, horloge simulée à J-2 puis au lendemain de chacune des 6 occasions) : section d'accueil correcte, feuille correcte, disparition confirmée le lendemain, aucune erreur JS. Le contraste du texte blanc sur ces dégradés n'est pas vérifié par `tests/contrast.js` (qui exempte volontairement tout fond `background-image`, comme pour `.rw-card` déjà en place) ; les couleurs choisies restent dans la fourchette déjà utilisée par `.rw-card`/`.rw-card.month`.

## 7. Autres chantiers proposés (après la vérification)

1. ~~**Accessibilité**~~ : fait en 1.22 (contraste conforme en clair et en sombre, Dynamic Type, VoiceOver, zones de toucher). Reste : essai réel avec VoiceOver sur iPhone.
   Ancien détail :
   - libellés VoiceOver pour les verres, médailles, graphiques et radar ;
   - taille de texte qui suit les réglages du système (unités relatives) ;
   - contraste des textes gris.
2. **Audit d’ergonomie de la navigation** : l’app est très riche, regrouper ce qui peut l’être.
3. **Liste de courses** exportable : bouteilles vides et achats malins.
4. **Carte recette à partager** (image), en réutilisant le principe du Rewind (SVG vers canvas vers PNG).
5. **Tests sur un vrai iPhone** (WebKitGTK est testé depuis 1.22, mais ce n’est pas iOS Safari), et correction de ce qui ne marche que dans Chromium.

## 8. Méthode de travail attendue

- Lire le code concerné, **y compris les redéfinitions** dans les modules suivants, avant de modifier.
- Faire un changement à la fois, reconstruire (`sh build.sh`), lancer `node tests/v.js` et `python3 tests/fuzz.py`, puis vérifier visuellement avec Playwright (captures).
- Pour toute donnée de cocktail : citer la source (IBA de préférence) dans ton compte rendu à YaYa.
- Pour tout changement du modèle de recommandation : mesurer avec `tests/m3.js` et `tests/m5.js`, puis régler sur une graine et valider sur une autre (`SEED=…`) pour éviter le sur-ajustement.
- À la fin de chaque livraison : incrémenter `APP_VERSION` et expliquer à YaYa ce qui a changé, ce qui a été vérifié, et les limites.
