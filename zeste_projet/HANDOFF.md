# Passation du projet Zeste — pour Claude Code

Tu reprends **Zeste**, une app web de bar à cocktails pour iPhone, développée en conversation avec Claude (claude.ai). Ce document contient tout ce qu’il faut pour continuer le travail. Lis-le entièrement avant de toucher au code.

## 1. Le propriétaire et ses exigences

- **Yannick Wahler** (« YaYa »), étudiant en génie mécanique en Suisse. Il parle **français** : réponds et écris l’interface en français.
- Il utilise l’app sur **iPhone (Safari)**. Beaucoup de bugs n’apparaissent que dans Safari/WebKit : c’est la cible réelle.
- **Priorité absolue : la véracité.** Pour toute information ajoutée ou modifiée (recettes, proportions, techniques, verrerie, glace, garnitures, dilution, conseils, UX, modèles de recommandation), vérifie avec des sources reconnues, plusieurs si besoin. N’invente jamais une recette ou une technique. Si une information fait débat, présente l’incertitude honnêtement.
- **Conserver ce qui marche** : analyser le code avant de modifier, ne pas réécrire inutilement, garder l’architecture et le design.
- **Numérotation des versions** : la version actuelle est **1.42**. Chaque mise à jour livrée incrémente : 1.21 → 1.42… La constante est `APP_VERSION` dans `src/v117.js`. Le copyright (`COPYRIGHT`, même fichier) affiche déjà l'année en cours automatiquement (`new Date().getFullYear()`) : rien à changer chaque nouvelle année.
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
core.js icons.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js v122.js v123.js v124.js v125.js v127.js v137.js v138.js v139.js v140.js v141.js v142.js ui_final.js v126.js v130.js
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
- **Modules suivants** : chaque version a ajouté un fichier (`ui10`, `labo2`, `trophies`, `explore`, `chal`, `sound`, `v117`…`v127`). **Convention importante** : ils modifient le comportement en **redéfinissant ou enveloppant** des fonctions existantes.
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
13. **Ne jamais recréer un `<input>` pendant qu’on y tape** (corrigé en 1.24) : les trois champs de recherche (`#cq` cocktails, `#aq` bar, `#pq` labo) régénéraient tout leur conteneur (`renderView`/`paintSheet`) à chaque frappe, puis refocalisaient l’élément à la main. Sur iOS Safari, détruire/recréer le champ focalisé pendant la saisie désynchronise le clavier et fait sauter des lettres à frappe rapide. Le bon principe : le champ de recherche ne doit **jamais** être régénéré une fois affiché ; seul le conteneur de résultats à côté (`#cx-res`, `#aq-res`, `#pq-res`) est repeint à chaque frappe (`element.innerHTML=...`, sans toucher au `<input>` ni au focus). `revealIn()` (apparition au défilement) a dû être mis à jour car il ciblait `.content > .group` : ces lignes sont maintenant sous `#cx-res`.

14. **Classes CSS partagées par accident** (corrigé en 1.28) : `toast(…,{trophy:1})` ajoutait la classe `.trophy` à la notification, qui héritait alors des styles des tuiles du profil (`display:flex;flex-direction:column`, fond, taille de médaille) : icône au-dessus du texte. Renommée `.t-tro`. Avant d'ajouter une classe à un élément global (`#toast`, `#overlay`…), chercher si elle existe déjà dans `style.css`.
15. **Code mort par hissage** : une `function f(){}` redéclarée plus loin rend la précédente inutile (seule la dernière existe). 1.28 en a retiré 17 Ko (`tests/deadcode.js` les détecte, `--write` les retire ; il s’appuie sur le compilateur TypeScript installé globalement). Préférer désormais la réassignation (`f=function(){…}`) ou l'enveloppe, et ne pas laisser l'ancienne version.
16. **`tests/all.sh` ne vérifiait pas le fuzz** : le JSON d'erreurs était affiché mais jamais contrôlé (« Tout est passé » malgré une erreur). Corrigé : la moindre entrée non vide fait échouer la suite. Les tests de fonctionnalités (`tests/features/*.js`) sont aussi lancés et bloquants.
17. **Test de persistance et rechargement immédiat** : dans Chromium automatisé, recharger la page quelques millisecondes après une écriture `localStorage` peut relire l'ancienne valeur (course du navigateur de test, reproduite puis écartée : aucune écriture de données périmées dans l'app). `tests/features/persist.js` attend 400 ms avant de recharger.

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

### Fait en 1.26 (améliore la 1.25)

- **Sexe biologique, en plus du poids** (`src/v124.js`) : ligne « Sexe » dans Paramètres > Toi (segment Non précisé/Homme/Femme, `S.settings.sex`, fonction `widmarkR()` : 0,68 homme, 0,55 femme, 0,66 si non précisé — inchangé pour qui ne le renseigne pas). Vérifié par test dédié : à consommation et poids égaux, Homme < Non précisé < Femme, dans le bon sens physiologique.
- **UI retravaillée** : la bulle affiche désormais un anneau de progression (même langage visuel que les préparations et le minuteur du mode barman) qui se vide au fil du retour à zéro, un bouton « + » distinct (plutôt qu'un lien texte) pour ajouter une boisson, et toucher la bulle ouvre une **fiche détail** (`bacDetailSheet`) : grand anneau, liste de ce qui compte dans l'estimation (cocktails de l'historique + boissons ajoutées, chacune avec son heure), et un bouton pour retirer une boisson ajoutée par erreur (les cocktails de l'historique, eux, ne se suppriment pas ici).
- Mise à jour en direct simplifiée : tant que le taux est actif, l'intervalle de 60 s relance simplement `renderView("today")` (le garde-fou `HERO_LAST` évite de rejouer l'animation du verre) ; au passage à zéro, la bulle se referme en douceur (`.bac-gone`) avant d'être retirée.
- Testé (Chromium/Playwright) : le sexe change bien le calcul et dans le bon sens, le réglage s'enregistre depuis les Paramètres et le segment reflète la sélection, la fiche détail liste bien le cocktail ET la boisson ajoutée, et les retirer réduit bien les événements comptés. Contraste et noms accessibles vérifiés sur la bulle et la fiche détail avec la méthodologie de `tests/a11y.js`/`tests/contrast.js` (aucun problème).

### Fait en 1.25

- **Taux d'alcoolémie, à titre indicatif** (`src/v124.js`) : une petite bulle discrète apparaît sur « Aujourd'hui » dès qu'un cocktail est préparé (`S.hist`) ou qu'une autre boisson est ajoutée manuellement (`S.drinks` : bière/vin/fort, degré et quantité). Formule de Widmark simplifiée à dessein (`BAC_R=0.66` sans distinction homme/femme, `BAC_BETA=0.15` ‰/h) sur une fenêtre glissante de 30 h. La bulle affiche le taux et l'heure de retour à zéro, se met à jour toutes les minutes, et disparaît d'elle-même (transition `max-height`, classe `.bac-gone`) une fois à zéro — sans confirmation ni bouton à fermer.
- Nécessite le poids (`S.settings.weightKg`), demandé une seule fois (ligne « Poids » dans Paramètres > Toi, à côté du prénom) ; tant qu'il n'est pas renseigné, la bulle invite à le faire au lieu d'afficher un chiffre. Volontairement **pas de sexe biologique demandé** (garde `r` unique) ni de gros avertissement sur la bulle elle-même : juste « Estimation, pas une mesure exacte. » en petit dessous, à la demande du propriétaire (« discret, pas le but de l'app »). La phrase plus explicite (« ne t'y fie jamais pour prendre le volant ») est reléguée dans Paramètres > À propos, pas sur la bulle.
- `settingsSheet` est entièrement redéfini par assignation (`settingsSheet=function(){…}`, même technique que `trophyGrid` en 1.20) pour ajouter la ligne Poids et la phrase d'À propos — **attention si `ui_final.js` change `settingsSheet`** : reporter le changement dans les deux endroits, ou fusionner cette redéfinition dans `ui_final.js` à l'occasion.
- Piège rencontré : `ICS`, `srow`, `sic`, `sw`, `sseg` sont des `const` déclarés dans `ui_final.js`, qui charge *après* `v124.js` (obligatoire pour que l'accroche de `vToday` s'applique dès le premier rendu, avant `init()`). Une référence à `ICS.xxx=...` au niveau racine du fichier plante donc (`ReferenceError: Cannot access 'ICS' before initialization`, zone morte temporelle) : l'ajout à `ICS` doit se faire à l'intérieur d'une fonction appelée plus tard (ici, au tout début de `settingsSheet`), jamais au chargement du script.
- Testé (Chromium/Playwright) : rien n'apparaît sans historique ; l'invite au poids apparaît après un cocktail sans poids renseigné ; le calcul correspond à la formule attendue à 0,02 ‰ près ; ajouter une bière augmente bien le taux ; après une horloge avancée de 8 h, le taux est à zéro et la bulle a disparu du DOM. Contraste vérifié (clair et sombre) sur `.bac-card`.

### Fait en 1.27 (six demandes du propriétaire en une passe)

- **Sexe obligatoire, comme le poids** (`src/v124.js`) : le choix « Non précisé » a été retiré (`sseg("sex", …, [["h","Homme"],["f","Femme"]])`) ; la bulle attend maintenant `S.settings.weightKg` **et** `S.settings.sex` avant d'afficher un chiffre (`bacState()`). `widmarkR()` garde un repli à 0,66 pour ne jamais planter, mais il n'est plus atteignable depuis l'UI.
- **Unité « kg »** à côté du champ Poids, dans Paramètres (span `.muted` après l'`<input>`, même motif que le prix des bouteilles avec « CHF »).
- **Bouton + à gauche** dans la bulle d'alcoolémie (`bacCard()`) : il est maintenant le premier enfant de `.bac-row`, avant l'anneau et le texte.
- **Étagère du bar** (`src/v125.js`, redéfinit `shelfView` de `v118.js` par simple redéclaration — elle charge après, donc gagne au hissage, pas besoin de réassignation) : puces de raccourci par rayon en haut (`.b2-jump`, `data-a="shelfjump"`, scroll vers `#b2-sg-<rayon>`), dégradé de bord sur chaque rangée pour indiquer qu'il y a plus à faire défiler (`.b2-shelf::after`), et une étiquette de statut claire (« En stock » / « À racheter ») même pour les softs non suivis en niveaux, qui n'en avaient aucune avant.
  - **Piège trouvé en le testant** : les couleurs des étiquettes de statut (`#30A14E`, `#E09A1A`, `#E0602A`, `#E03A3A`, et le badge `#FF453A`) étaient sous les 4,5:1 requis en texte blanc (jusqu'à 2,38:1 pour l'orange !) — invisible dans `tests/contrast.js` car ce test ne bascule jamais `S.settings.barView` sur `"shelf"`, donc n'a jamais audité cette vue. Assombries à `#288742`/`#9E6C12`/`#C9501D`/`#DF3333`/`#D6291E` (≥4,5:1 vérifié par calcul). **Si tu ajoutes une nouvelle vue conditionnée par un réglage (comme `barView`), pense à l'auditer toi-même : les scripts de test existants ne la visitent pas forcément.**
- **Trophées à paliers** (`src/v126.js`, chargé **après** `ui_final.js` exprès — c'est le seul module dans ce cas, voir plus bas) : 4 badges (`TIER_TROPHIES`) qui montent en grade bronze→argent→or→platine dans une seule tuile au lieu de plusieurs trophées séparés (verres préparés, recettes différentes, notes données, bouteilles au bar). Les paliers du haut sont volontairement plus longs qu'avant : « Palais averti » allait jusqu'à 60 notes (platine), va maintenant jusqu'à 100 ; « Cave bien garnie » de 30 à 50 bouteilles. Un palier franchi ouvre un `toast()` (pas l'animation plein écran, réservée aux trophées classiques). Les anciens trophées séparés (`first/ten/fifty/hundred`, `d10/d30/d50/d100`, `critic/palate/palate60`, `bar15/bar30`) restent dans `TROPHIES` tels quels — ne pas les retirer sans y penser à deux fois, l'idée est d'ajouter une vue « paliers » en plus, pas de casser l'existant.
  - **Piège de chargement** : `trophyGrid` et `checkTrophies` sont déjà réassignés par `ui_final.js` (section trophées cachées de la 1.20). Un module placé *avant* `ui_final.js`, quelle que soit la technique (déclaration ou réassignation), se ferait donc écraser. `v126.js` est le seul module du projet chargé après `ui_final.js` : c'est voulu, et sûr, car rien dans `ui_final.js` n'appelle `trophyGrid`/`checkTrophies` pendant `init()` (ils ne s'exécutent que plus tard, sur interaction ou via le `setTimeout` déjà en place).
- **Accueil du matin sans « Aussi pour toi »** (`src/v125.js`) : `HOME_SEC.suggest` retourne `""` quand `ctxInfo().moment==="matin"`, sinon se comporte comme avant (y compris l'ajout des cartes Rewind du mois, greffé par-dessus dans `ui_final.js`). Le reste de l'accueil (héros, rappels, préparations qui périment, mets…) n'est pas touché.
- Testé (Chromium/Playwright) : les 6 points un par un (segment à 2 options, unité kg visible, ordre des enfants de la bulle, puces + étiquette « En stock » dans l'étagère, bon libellé de palier après 12 verres et palier max effectivement plus dur qu'avant, section masquée le matin mais toujours là le soir). Contraste et accessibilité de l'étagère et des paliers vérifiés en clair et en sombre (plus aucun problème après la correction des couleurs).

### Fait en 1.28 (audit complet, identité visuelle)

- **Logo** (remplacé en 1.29 par « le ruban », voir plus bas) : une coupe dont le verre est une demi-rondelle d'agrume (le « zeste »), crème et jaune sur un dégradé ambré tiré de la teinte de l'app. Source : `assets/zeste-logo.svg` ; générateur en code : `zesteMark({round,label,cls,sheen})` dans `src/v127.js` (ids de dégradés uniques via `GID`). Utilisé dans : l'écran de lancement (le logo se construit : tuile, bord, agrume, pied, puis le nom), les réglages, « À propos », l'accueil du premier lancement et la carte Rewind partagée. **Icône d'écran d'accueil** : `assets/apple-touch-icon.png` (180 px) et `assets/favicon-32.png`, incluses en base64 dans l'en-tête par `build.sh` (l'app reste un fichier unique, où qu'elle soit hébergée) ; copie aussi à la racine du dépôt (`apple-touch-icon.png`). Balises `apple-mobile-web-app-title`, `application-name`, `description`.
- **Premier lancement** : écran d'accueil avant le quiz (logo, trois promesses, « Faire connaissance », « 9 questions, environ une minute »). `openQuiz`/`paintQuiz` enveloppés dans `v127.js` (`QZ.i=-1`), drapeau `S.quizIntro`.
- **Accueil du matin** : plus aucun cocktail mis en avant. Le héros devient « Le bar se repose » avec le nombre de cocktails faisables et deux raccourcis ; « Aussi pour toi » et « Sans alcool » sont masqués le matin.
- **Trophées** : les anciens trophées séparés couverts par les paliers (`first`, `ten`, `fifty`, `hundred`, `d10`…`d100`, `critic`, `palate`, `palate60`, `bar15`, `bar30`) sont retirés de `TROPHIES` (`TIER_SUBSUMED`) : un seul badge par progression, plus de doublon. Grille unifiée (paliers d'abord, avec 4 points de progression ; une seule tuile « N secrets »), compteurs cohérents (chaque palier compte 4 niveaux). Fiche palier détaillée (4 étapes, % vers la suivante). Anciennes clés redirigées vers le palier correspondant (`TIER_OF_OLD`). **Annonces** : seul l'or et le platine ouvrent l'écran plein écran, un à la fois ; le reste passe en notification, qui attend que l'écran soit libre (`troToast`). Au lancement (7 s), les trophées rattrapés sont résumés en une ligne. « Vitrine pleine » compte les paliers.
- **Incohérences corrigées** : grammaire de « Le saviez-vous ? » (`maskName` : « du Negroni » → « de ce cocktail », « Camillo Negroni » → « Camillo N. », vérifié sur les 245 histoires) ; « 39 possibles » (liste du soir) contre « 44 faisables » (bar) — un seul compte affiché ; étagère « 14 bouteilles » contre « 11 ouvertes » ; libellés de rayons (« & » partout, comme `SEGS`) ; « verre old fashioned » contre « Tumbler » (→ « un tumbler », ajout du verre à shot) ; fiche alcoolémie titrée « Ce soir » le matin (→ « Dernières heures ») et unité ‰ dans le grand anneau ; icône « Sexe » neutre ; noms coupés (« Pomme d’a… ») sur deux lignes ; « Heure du téléphone » qui faisait passer une ligne des réglages sur deux ; « 1 cocktails préparés ».
- **Fiabilité** : `sanitizeBackup` conserve `tierSeen` (et `drinks` depuis 1.25) ; le rafraîchissement de la bulle d'alcoolémie ne tourne plus quand l'app est en arrière-plan ou couverte par une fiche.
- **Performances** : 17 Ko de fonctions mortes retirés. Mesures (processeur ralenti ×4) : lancement ~550 ms, rendu d'un onglet 17–67 ms, fiche cocktail ~73 ms (essentiellement mise en page), recherche ~10 ms par frappe ; aucun travail de rendu au repos sur les quatre onglets.
- Vérifié visuellement (clair et sombre, iPhone SE, iPhone standard, grand iPhone, iPad) et par les tests : suite complète + `tests/features/*` (occasions, recherche, alcoolémie, sexe, 6 points de la 1.27, sauvegarde/rechargement/annonces).

### Fait en 1.29 (nouvelle identité visuelle, direction « Écorce », logo « le ruban »)

Choisie par le propriétaire parmi trois directions présentées sur un canevas (organique, étincelle, typographique), puis affinée à sa demande (« plus travaillé, moins évident »).
- **Logo** : un ruban d'écorce qui dessine un Z. Il se vrille aux deux angles et montre sa face intérieure citron ; un liseré citron sous les barres rappelle l'épaisseur du zeste. Trois tracés en courbes de Bézier (`ZR.top`, `ZR.dia`, `ZR.bot` dans `src/v127.js`, viewBox 0 0 100 100). `zesteRibbon(barre, diagonale, liseré)` dessine le ruban seul ; `zesteMark({label,cls,round,bare,pith})` l'icône (carré vert arrondi) ou, avec `bare:true`, le ruban seul. Retirer le liseré (`pith:false`) sous 48 px. Fichiers : `assets/zeste-logo.svg` (icône), `assets/zeste-ruban.svg` (ruban seul, fond clair), `assets/zeste-icon-512.png`, `assets/apple-touch-icon.png` (180 px, carré plein, iOS arrondit lui-même), `assets/favicon-32.png` (sans liseré).
- **Écran de lancement** : fond vert de la marque ; la barre du haut se déroule (`clip-path`), la diagonale se retourne, la barre du bas se pose, puis « zeste » en minuscules (logotype). 2 s, touchable pour passer, désactivé si « réduire les animations ».
- **Palette** (jetons dans `:root` de `style.css`) : clair — fond crème `#F7F1E3`, cartes `#FFFDF8`, texte encre `#1F2A22`, teinte feuille `#1F5A3D` (texte sur teinte `#FBF6EC`) ; sombre — fond vert nuit `#0E1410`, cartes `#18211B`, texte `#F2EDE0`, teinte citron `#F5C518` (texte sur teinte `#14231A`). Nouveau jeton `--zest` (citron) pour un accent ponctuel. Vert/rouge/orange sémantiques inchangés. `theme-color` accordé (build.sh). Ciel d'ambiance selon l'heure conservé, teintes adoucies et fondues vers la crème / le vert nuit.
- **Typographie** : titres en Fraunces (axe « Soft » figé au maximum, graisses 500–700, tailles optiques 14–72), texte et chiffres en Figtree (400–800). Sous-ensemble latin, WOFF2 dans `assets/fonts/` (licence OFL jointe), incluses en base64 par `build.sh` sous les noms `ZesteSerif` / `ZesteSans` (≈ 70 Ko en tout) : l'app reste un fichier unique qui marche hors ligne. Repli sur les polices système.
- Carte Rewind : logotype « zeste » en minuscules.
- Vérifié : rendu réel Chromium clair/sombre (iPhone 390 px et ordinateur 1280 px), animation de lancement image par image, icônes en 180/32/16 px, suite complète verte (contraste 12/12 vues, VoiceOver, WebKit, fonctionnalités, fuzz).

### Fait en 1.30 (système d'icônes, plus aucun emoji)

- **Plus un seul emoji dans l'app** (vérifié sur `dist/zeste.html` : 55 remplacés). Les caractères typographiques (→, ©) restent ; la coche ✓ du minuteur et des étapes cochées est devenue une icône.
- **`src/icons.js`** (chargé juste après `core.js`) : `LU` (tracés) et `lu(nom, classe)` → SVG 24×24, `currentColor`, trait 1,75 arrondi. Fonctionnelles : sous-ensemble **Lucide** extrait de `lucide-static` (licence ISC dans `assets/icons/LICENSE-lucide.txt`), seuls les tracés utilisés sont inclus, aucune dépendance au lancement. Culinaires et garnitures absentes de Lucide dessinées au même trait : cheese, raclette, taco, sushi, pepper, pasta, olive, chocolate, pretzel, twist, peel, lemon, orange-slice, mint, cucumber, raspberry, pineapple, straw, cinnamon, rim-salt, rim-sugar, barspoon, shaker, pumpkin. Pour en ajouter une : une entrée dans `LU` (grille 24, traits seulement).
- **`IC` passe à Lucide** (mêmes clés, `Object.assign` dans `icons.js`) : barre d'onglets (le premier tracé porte `fillme`), chevrons, étoiles, cœur, recherche, filtres, partage, etc. **Réglages** (`ICS`, fin du bloc dans `ui_final.js`) : icônes Lucide sur une pastille teintée de la marque (`--tint-bg` / `--tint`), la suppression en rouge. **Icônes du moment** (`MO_IC`, `ui10.js`) : sunrise/sun/sunset/moon/moon-star, rayons et étoile toujours animés.
- **Données** : les plats (`DISHES`, `data_food.js` et `v118.js`) et les occasions (`OCCASIONS`, `v123.js`) ont un champ `ic` (nom d'icône) au lieu de `e` (emoji) ; les garnitures (`LGAR`, `labo2.js`) ont un nom d'icône en 2e position ; `labGrade` renvoie un nom d'icône. Rendus : tuile de plat (icône 30 px teintée), fiche plat/occasion (pastille ronde 88 px), carte d'occasion (icône blanche en ligne), garnitures, verdict et fenêtre de service du labo, bouton « Secouer/Remuer/Servir ».
- Vérifié : captures iPhone clair/sombre (accueil, À table, fiche plat, Noël, garnitures, service, verdict, réglages), suite complète verte (WebKit relancé seul : l'échec « fetch failed » venait du pilote au démarrage).

### Fait en 1.31 (vérification des mises à jour, reprise d'ASCEN)

- **`sw.js`** (source dans `zeste_projet/sw.js`, copié à la racine du dépôt à côté d'`index.html` par `tests/all.sh` ; **à publier avec index.html**) : même stratégie qu'ASCEN, « cache d'abord, mise à jour en arrière-plan ». L'app s'ouvre depuis la copie locale, avec ou sans réseau ; la dernière version est téléchargée discrètement, et si son empreinte (ETag, sinon Last-Modified, sinon taille) a changé, le service worker envoie `zeste-updated` à la page. Hors réseau, tout échoue en silence. Cache `zeste-v1`.
- **`src/v130.js`** (chargé en dernier) : inscrit le service worker (seulement en https ou localhost, jamais sur claude.ai ni en fichier local), affiche « Nouvelle version de Zeste prête » avec **Recharger** quand l'écran est libre (une seule fois par session), et **revérifie au retour au premier plan** (au plus toutes les 30 min, seulement en ligne) : utile pour l'app installée sur l'écran d'accueil, qui reste ouverte des jours. `toast()` accepte `ms` (durée).
- Corrigé au passage : le bouton des notifications (« Annuler », « Ajuster », « Recharger ») était vert foncé sur la bulle sombre depuis la palette 1.29 ; il est citron (9,1:1) en clair et vert feuille en sombre.
- Test : `tests/features/update_test.js` (serveur local, publication simulée, coupure réseau, retour au premier plan).

### Fait en 1.32 (accords mets : plats incohérents retirés)

- Retirés de « À table » (`DISHES`, `data_food.js`) à la demande du propriétaire : **fondue**, **raclette** (qui se boivent au vin blanc, pas en cocktail) et **plateau de fromages** (vin, porto), même logique. Supprimés avec eux : l'exception « kirsch » de `dishPicks` (`core.js`), `PAIR_WHY.trad`, et les icônes `cooking-pot`, `raclette`, `cheese`. Restent 13 plats (12 depuis 1.35, asiatique retiré).
- `dishSheet` ignore un identifiant inconnu (ancien lien) ; le trophée « Fin gourmet » (6 accords) reste atteignable, les accords déjà vus restent comptés. Le fuzz ouvre désormais la fiche de chaque plat.

### Fait en 1.33 (son muet après un passage en arrière-plan)

- **Cause** : en quittant l'app, iOS met l'`AudioContext` dans l'état `interrupted` (propre à Safari). `ac()` ne relançait que depuis `suspended`, et `unlock()` ne s'exécutait qu'une fois par session (`unlocked=true`) : plus aucun son au retour. Les sons demandés pendant la pause étaient en plus mis en file et partaient en rafale au redémarrage.
- **Correctif** (`src/sound.js`) : relance depuis tout état autre que `running` ; contexte `closed` recréé ; `unlocked` remis à zéro au retour (`visibilitychange`, `pageshow`, `focus`), donc le premier geste redébloque ; si le contexte reste coincé après deux gestes, il est fermé et remplacé par un neuf ; `osc`, `noise` et `pour` passent par `live()` et ne jouent rien tant que l'audio ne tourne pas (plus de rafale). `SND._ctx()` expose le contexte aux tests.
- Test : `tests/features/sound_test.js` (pause simulée, aucun son en file, contexte fermé, contexte coincé) ; il échoue sur l'ancien code. L'état `interrupted` lui-même n'existe pas dans Chromium : à confirmer sur iPhone.

### Fait en 1.34 (passe finale : robustesse, débogage, optimisation, ergonomie)

- **Robustesse des données** : `healState()` (`ui_final.js`, appelée au début de `fixState`, donc au chargement local comme après une synchronisation distante) vérifie chaque champ : type faux → remis à zéro ; stock borné 0–4 et limité aux ingrédients connus ; notes 1–5 ; historique et favoris limités aux recettes existantes (dates valides) ; créations dont un ingrédient n'existe plus retirées ; boissons ajoutées, préparations, labo et réglages (poids 30–250, sexe h/f, taille du texte, unité, volume) validés. Avant, une donnée d'un mauvais type faisait planter l'app **à chaque lancement**. Corrigé aussi : `sanitizeBackup` jetait `heroLog` (c'est une liste, pas un objet).
- **Sécurité des saisies** : vérifié que prénom, création, note et préparation contenant du HTML s'affichent comme du texte.
- **Nouveaux tests** : `tests/features/robust_test.js` (JSON illisible, tableau, null, types faux, identifiants inconnus, état ancien, stockage qui refuse d'écrire, longue session : minuteurs stables) et `tests/features/inject_test.js`.
- **Code mort** : 4 déclarations jamais utilisées (`almost`, `mixGlass`, `splashPick`, `TERMRE`) et 50 sélecteurs CSS + 12 animations de l'ancien lancement, de l'ancienne étagère et de l'ancien arbre des lignées (−6 Ko de CSS).
- **Ergonomie** : zones de toucher d'au moins 44 pt pour « Tout voir », les petits boutons et le champ de recherche (sans changer l'apparence) ; fiche ingrédient : « Contenance » ne chevauche plus son sélecteur sur petit écran (il passe à la ligne) et le prix affiche la devise choisie (€ au lieu de « CHF » en dur) ; en très grand texte, le texte des sélecteurs segmentés est plafonné pour que les options ne se touchent plus.
- **Identité** : cartes Rewind (année et mois) aux couleurs de Zeste au lieu de l'ancien dégradé orange-violet (contraste du petit texte ≥ 5:1) ; restes ambrés remplacés (anneau des lignées, lueur du héros vide, confettis, couleur de secours de Rewind).
- **Mesures** (processeur ralenti ×4) : démarrage ~1 s (≈ 590 ms de lecture du fichier, ≈ 250 ms de premier rendu), onglets 60–140 ms, fiche ~90 ms, frappe de recherche 2 ms. Pas de minification : aucun outil installé et gain faible. Aucun avertissement ni erreur console sur SE, standard, Max et très grand texte.
- **Audit de cohérence (`tests/audit2.js`, 10 points) : particularités réelles, acceptées** : Gibson = Martini à l'oignon ; Ti' Punch sans glace (tradition) ; tiki (Painkiller, Zombie, Navy Grog, Fog Cutter, Scorpion, Rum Swizzle, Tiki IBA) servis dans de grands verres de glace pilée, au-delà de la contenance nominale du modèle ; Kamikaze partagé en plusieurs shots.

### Fait en 1.35 (double tap, plat retiré, deuxième passe robustesse/optimisation/ergonomie)

- **Pas de zoom au double tap** : `touch-action:manipulation` sur `html,body` (le pincement reste possible, pour l'accessibilité). Commandes (boutons, onglets, puces, tuiles, illustrations) : ni sélection de texte ni menu d'appui long.
- **Zoom automatique d'iOS sur les champs** : avec une petite taille de texte système, Zeste descend à 88 % et la recherche passait à ~15 px, ce qui fait zoomer iOS. Tous les champs restent ≥ 16 px. Champs de recherche : touche « Rechercher », sans correction ni majuscule automatique ; « Entrée » referme le clavier.
- **Plat retiré** : « Wok et asiatique » (et l'icône `soup`). Restent 12 plats.
- **Filet de sécurité** (`v130.js`) : `renderView` et `paintSheet` enveloppés ; en cas d'erreur, l'écran ou la fiche affiche « Cet écran n'a pas pu s'afficher » + **Réessayer** (`retryview`, `retrysheet`) au lieu de rester vide. L'erreur est relancée à part (`setTimeout`) : elle reste visible en console et pour les tests.
- **Performances avec beaucoup de données** (3 000 verres, 300 notes, 40 créations, bar plein) : `getModel` recalculait à chaque appel une clé en sérialisant toutes les notes (une fois par cocktail affiché), `madeCount` et `distinct` reparcouraient tout l'historique. Nouveau compteur `SREV` (incrémenté par `save()` et `fixState()`) : modèle, comptes et recettes distinctes réutilisés tant qu'il ne bouge pas (et que `S` et la longueur de l'historique sont les mêmes). Processeur ÷4 : cocktails 313 → 169 ms, bar 403 → 240 ms, accueil 217 → 73 ms, « Je l'ai fait » 393 → 217 ms ; prédictions strictement identiques (tests de prédiction inchangés). **Si une modification de notes, favoris ou historique n'appelle pas `save()`, appeler `SREV++`** (ou `MODEL=null`).
- Vérifié : double appui sur une ligne → une seule fiche ; double appui sur « Je l'ai fait » → un seul verre.
- Tests : `tests/features/safety_test.js` (secours + réparation, double tap, champs ≥ 16 px en petit texte, Entrée). `sound_test.js` rendu déterministe (la relance sans geste est refusée pendant la pause, comme sur iOS ; Chromium l'accepte, d'où un échec aléatoire).

### Fait en 1.36 (version finale : audit complet)

Audit mené comme une recette avant mise en production. Mesures sous Chromium (Playwright), iPhone 390 × 844, processeur ÷4 sauf mention.

- **Fluidité** : ~60 i/s partout au processeur ×1 (défilement, fiches, transitions d'onglets, labo, service). Seule longue image : le premier rendu à l'ouverture d'un onglet ou d'une fiche (137–155 ms au processeur ÷4, ~35 ms sur un vrai iPhone). Long Animation Frames : aucune saccade pendant les animations.
- **Barre d'onglets** : en mode mobile, l'écran qui arrive en glissant débordait de `#app`, la page s'élargissait (390 → 425 px) et la pastille dérivait de 10 à 31 px vers la droite. Corrigé : `overflow:clip` sur `html`, `#app`, `#ambient` ; `moveTabInd` recalcule la position depuis les rectangles réels, après la transition et à chaque redimensionnement. Décalage mesuré : 0 px.
- **« Réduire les animations »** : les animations des pseudo-éléments (flottement de l'accueil, taches du service) tournaient encore → coupées. Le résultat du labo restait invisible ~5 s → le service saute directement à l'état final (`svSkip`).
- **Typographie française** (`v130.js`, `frTypo`) : espace fine insécable avant `? ! ;` et dans « », insécable avant `:` et `%` et entre un nombre et son unité (cl, ml, min, ‰, CHF, verres…). Appliquée à tout texte affiché (observateur de mutations), jamais aux champs de saisie. 552 nœuds corrigés au premier affichage, 0 restant. Coût : dans le bruit de mesure. Attention : `innerText` de Chromium convertit les insécables en espaces ; vérifier via `node.data`.
- **Textes et infos** : correcteur orthographique français sur les 2 037 mots de l'interface : aucune faute (les inconnus sont du jargon de bar et des noms propres). Corrigés : « qu'à » (apostrophe typographique), « resecoue » → « secoue à nouveau », double ponctuation dans la phrase du profil. Faits vérifiés par sondage : interdiction de l'absinthe en Suisse 1910–2005, Moscow Mule 1941 au Cock 'n' Bull, Hanky Panky d'Ada Coleman, Cosmopolitan de Toby Cecchini (1988), film Blood and Sand 1922, Swizzle Inn depuis 1932, Paper Plane de Sam Ross. Liste IBA : 102/102 conformes.
- **Parcours nouvel utilisateur** : quiz complet (9 questions, trophée), états vides clairs (« Ton bar est vide » + Ajout rapide, « Bienvenue au bar » + Remplir mon bar), profil de goût dès la fin du quiz. Aucune erreur.
- **Dates limites** (fuseau Europe/Zurich, horloge simulée, app ouverte 3 min à chaque fois) : Nouvel An, passages à l'heure d'hiver et d'été, 29 février, fin de mois, Noël, Pâques 2027 (28 mars), 1er Août, Saint-Valentin. Aucune erreur ; alcoolémie et heure du retour à zéro justes à travers le changement d'heure.
- **Mémoire** : 160 cycles (onglets, fiches, réglages, labo, service, toasts) : nœuds DOM 6 646 → 6 649, écouteurs 44 → 44, tas JS 3,4 → 4,2 Mo stable. Aucune fuite.
- **Données lourdes** (3 000 verres) : démarrage ~0,8 s, onglets 130–270 ms, « Je l'ai fait » ~250–340 ms au processeur ÷4 (mesures bruitées d'environ ±80 ms d'un passage à l'autre).
- **Hors ligne / mise à jour** : service worker vérifié par `update_test.js` (ouverture hors réseau, notification de mise à jour, silence sans changement).
- Tests ajoutés : `tests/features/reduced_test.js` (rien ne bouge, rien ne reste caché, résultat du labo immédiat), `tests/features/tabbar_test.js` (375 et 430 px : page jamais élargie, pastille centrée à 1 px près). Suite complète verte (le test WebKit peut échouer au démarrage du pilote, « fetch failed » : le relancer seul, il passe).

### Fait en 1.37 (loi de Hick, harmonisation, lecture, hiérarchie — même design)

Demande de YaYa : appliquer les règles de la refonte d'ASCEN (loi de Hick, harmonisation, facilité de lecture, hiérarchie visuelle) **sans refaire le design**. Mesure avant/après (`scratchpad/ux_audit.js`, utilisateur réaliste : 19 bouteilles, 34 verres, 8 notes ; nombre de boutons, interrupteurs et champs d'un écran entier, défilement compris) :

| Écran | Choix avant → après | Hauteur avant → après |
|---|---|---|
| Profil | 62 → 30 | 5 377 → 3 251 px |
| Bar | 80 → 43 | 2 306 → 2 056 px |
| Labo | 68 → 57 | 2 130 → 1 972 px |
| Accueil | 34 → 31 | — |
| Paramètres | 44 → 11 | 3 240 → 1 258 px |
| Fiche ingrédient | 42 → 18 | 3 153 → 1 387 px |

Rien n'est supprimé : tout reste à un toucher. Code dans **`src/v137.js`**, chargé **avant `ui_final.js`** (c'est `ui_final.js` qui appelle `init()` et fait le premier rendu : un module chargé après ne s'appliquerait qu'au deuxième rendu). Styles dans le bloc « 1.37 » en fin de `style.css`.

- **Défauts corrigés** :
  - **verres vides** : `glassSVG` et `glassThumb` mettaient en cache le SVG avec ses identifiants (`g12k`…). Un même cocktail affiché sur deux écrans renvoyait vers la découpe de l'écran masqué (`display:none`) et s'affichait vide (Tes mieux notés, Derniers verres, fiches de plats : 66 verres touchés). `reidSVG` (core.js) donne des identifiants neufs à chaque insertion ;
  - **carrousels** : avec l'aimantation `mandatory`, la première carte collait au bord de l'écran au lieu de la marge. `scroll-padding-inline:16px` sur `.scroller`.
- **Loi de Hick** (`foldRows`, `moreBtn`, action `more`, `MORE_OPEN`) :
  - **Profil** : nouvel ordre (goût, prochain coup de cœur, trophées, mieux notés, derniers verres, familles, spiritueux, ce qui guide les suggestions). **Trophées en résumé** : 3 derniers gagnés et prochains à portée (6 au plus), ligne « Tous les trophées » → feuille avec toute la collection (`allTrophiesSheet`). Mieux notés et Derniers verres : 3, puis « Voir les N autres ». « Ce qui guide tes suggestions » : la phrase et la barre, le détail sous « Voir le détail ». `vProfil` est enveloppé (sections réordonnées d'après leurs titres `h2.sh`) ;
  - **Bar** : la jauge de niveau était 4 boutons de 13 × 32 px par bouteille (trop petits pour un doigt). C'est maintenant **un seul bouton de 44 px** (`lvlCtl`, action `lvlpick`) qui ouvre le choix du niveau en grand (`levelSheet`, comme la fiche) ; même comportement qu'avant (bouteille vide → « à racheter » avec Annuler). Les filtres par catégorie ne s'affichent qu'à partir de 24 bouteilles (les sections suffisent en dessous). Les basiques en une ligne (« Citron jaune, Citron vert… et 17 autres ») au lieu d'un nuage d'étiquettes ;
  - **Labo** : 6 décors à la fois (choisis, conseillés, puis les plus courants), « Plus de décors (N) » ;
  - **Accueil** : « Aussi pour toi » montre 8 idées (avant 11), « Tout voir » mène au reste ;
  - **Fiche ingrédient** : « Utilisé dans N recettes » montre 5 recettes, les faisables et les mieux notées d'abord, puis « Voir les N autres » (toutes, avant : 30 au plus) ;
  - **Paramètres** : « Toi » (prénom, poids, sexe, quiz) reste sur place ; Apparence, Sons et animations, Suggestions, Bar et recettes, Accueil et « Sauvegarde et réinitialisation » deviennent des lignes avec leur valeur, qui ouvrent une feuille avec **« ‹ Paramètres »** (`SET_GROUPS`, `subSheet`). Les actions de réglage sont inchangées (`refreshSheets` repeint aussi la feuille parente).
- **Harmonisation** :
  - **échelle de texte unique** : 11 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 28 · 34 (+ grands chiffres d'affichage). 48 tailles hors échelle ramenées (12,5 → 13, 11,5 → 12, 10,5 → 11, 15,5 → 15, 16,5 → 17, 18 → 17, 19 → 20, 21 → 22, 24 → 22, 25 et 30 → 28, 32 et 36 → 34). Graisse 800 → 700 (19 endroits) ;
  - **rayons par rôle** (`--r-ctl` 10, `--r-tile` 14, `--r-card` 18, `--r-hero` 24) : avant, 20 valeurs différentes, et des tuiles voisines à 14, 16 et 17 px dans le Labo ;
  - **espacements** sur la grille de 4 : titres de section 28/12, sous-titres −8/12, en-têtes et pieds de groupe 24/8 ; l'astuce du Bar alignée sur les titres.
- **Lecture** : plus aucun texte sous 11 px (légendes du radar 9,5 → 11, en police Zeste ; trophées et familles 11 → 12, noms des trophées 12,5 → 13).
- **Hiérarchie** : un seul bouton plein par écran (vérifié), la répétition « 43 trophées » / « 6 sur 55 » évitée, les listes longues derrière un bouton discret (`.more-btn`, teinte de l'accent, sans fond dans un groupe).
- **Règle pour la suite** (reprise d'ASCEN) : avant d'ajouter un bouton à un écran, se demander ce qu'il remplace ; un réglage rare va dans un groupe des Paramètres, une liste longue derrière « Voir les N autres ». Le budget du test doit rester tenu.
- Test : `tests/features/hick_test.js` (budgets de choix accueil 32, bar 45, labo 58, profil 32, réglages 14 ; listes qui se déplient ; jauge ≥ 44 px et niveau appliqué ; groupe Apparence, Retour et valeur affichée ; zéro identifiant SVG en double ; carrousel sur la marge ; aucun texte < 11 px).

### Fait en 1.38 (chaque chose à sa place — même design)

Demande de YaYa : vérifier la cohérence des pages, leur utilité, les doublons et leur place ; raccourcir les textes inutiles ; rendre l'app plus logique. Méthode : carte de toute l'app (chaque onglet, sous-vue et fiche avec ses titres, textes et actions, `scratchpad/ia_map.js`), puis **un rôle par onglet** :
**Aujourd'hui** = que boire maintenant · **Cocktails** = chercher · **Bar** = ce que j'ai · **Labo** = créer et fabriquer · **Profil** = moi (goûts, historique, trophées, récaps). Une information à un seul endroit.

Code dans **`src/v138.js`** (chargé après v137, avant `ui_final.js`), plus quelques retouches directes :
- **Aujourd'hui** : le récap du mois (glissé dans « Aussi pour toi ») et le Rewind de décembre passent au Profil ; l'achat malin (doublon du premier « Achat malin » du Bar) quitte l'accueil : « Surprends-moi » devient une ligne pleine largeur. La carte du soir ne répète plus « Pour ce soir » sous le titre « Ce soir ».
- **Cocktails** : la puce « 0 % » (exclusive avec Faisables, donc impossible de chercher « faisable et sans alcool ») est remplacée par le filtre **Style › Sans alcool**, combinable ; « Sans alcool » de l'accueil y mène (`nafilter`). Dans les filtres, « Type de cocktail » devient « Style » et la section Famille ne répète plus Spritz, Chauds et Shots (`FAM_AS_TYPE` : une famille de ce genre touchée depuis le Profil ouvre le style correspondant). Textes de Radar, Lignées et Monde raccourcis.
- **Bar** : deux façons de voir le bar (Liste, Étagère). « Presque vides » n'était pas une vue mais un filtre : c'est une ligne avec le nombre, qui ouvre la liste en feuille (`lowsheet`). L'astuce permanente sur les prix est retirée (la fiche de la bouteille l'explique déjà), ainsi que la phrase d'aide de l'étagère.
- **Labo** : « Techniques » et « Préparations » fusionnent en **« Fait maison »** (`homemadeView`) : En cours (préparations, avec la règle de sécurité), À faire soi-même (recettes qui lancent une préparation), Gestes de bar (dry shake, glace limpide), puis « Noter une autre préparation ». `LT` « tech » ou « prep » (anciens liens, tests) ouvre « Fait maison ». Les **défis de la semaine** passent sous l'atelier : le labo s'ouvre sur le verre.
- **Profil** : « Ce qui guide tes suggestions » part dans **Paramètres › Suggestions** (`guideHTML()` dans ui.js), à côté des réglages qu'il explique. Nouvelle section **« Tes récaps »** (`recapCards` : le mois en cours, ou le mois écoulé, et le Rewind de l'année). Sous-titre des familles retiré (les tuiles disent déjà « préparée » ou « À découvrir »).
- **Paramètres** : « Contenu additionnel » n'est plus réglable à deux endroits (il reste dans le Bar, section Additionnel). Textes d'Apparence et de Suggestions raccourcis.
- **Fiche recette**, dans l'ordre d'usage : ingrédients, préparation, conseil, puis **« Ton avis »** (les étoiles et la note perso, réunies), « Ta version », histoire, « Profil de goût » (renommé : « Profil » se confondait avec l'onglet), bouteilles, variantes, labo. La ligne « Garniture : … » n'est plus affichée quand la dernière étape « Décore : … » la donne déjà ; l'aide « Touche une étape pour la cocher… » est retirée.
- **Textes raccourcis** : « Faisables avec ton bar », « Le bon cocktail pour ton plat », « Toujours considérés comme disponibles », « Point vert : faisable maintenant », « Les quantités suivent, et l'app s'en souvient. », « Les bouteilles à moitié pleines ou moins. » (le tri de cette liste est alphabétique par niveau : ne pas écrire « les plus utiles d'abord »).
- Test : `tests/features/ia_test.js` (accueil sans récap ni achat ; pas de « 0 % », sans alcool en filtre combinable ; filtres sans famille en double ; Bar Liste/Étagère + Presque vides ; Labo Composer/Fait maison et défis sous l'atelier ; récaps au Profil, explication dans Suggestions, pas de « Contenu additionnel » dans les réglages ; ordre de la fiche recette et garniture non répétée). `hick_test.js` adapté.

### Fait en 1.39 (hiérarchie visuelle — même design)

Retour de YaYa : « on est noyé sous plein d'infos, tout a l'air d'avoir la même importance » (Labo, Bar, Profil). Diagnostic sur captures pleine hauteur : le Profil alignait 10 sections avec le même titre de 22 px et la même carte blanche, et les deux grandes cartes vertes des récaps étaient les éléments les plus lourds de l'écran ; dans le Bar, les catégories (Spiritueux…) avaient le même titre que les vraies sections ; dans le Labo, les 5 étapes pesaient pareil alors que seuls les ingrédients sont indispensables (verre, style et méthode ont une valeur automatique), et « Pars d'un classique » était tout en bas.

**Règle** (`src/v139.js`, bloc CSS « 1.39 ») : trois niveaux par écran, pas plus.
1. **Un point focal** : le verre du soir, le verre du labo, les compteurs du bar, le profil de goût.
2. **Sections principales** : titre de 22 px (`h2.sh`) et contenu en carte.
3. **Le reste** : petits en-têtes de liste (`.list-h`, `.cat-h`, `.lab-sub`, 15 px demi-gras, gris), lignes qui ouvrent une feuille (`prow`). Jamais de grande carte pour une information secondaire.

- **Profil** (3 149 → 1 774 px, 5 sections) : profil de goût, prochain coup de cœur, trophées (**3 médailles**, compteurs par métal dans la collection), **Tes récaps en lignes** (`recapRows`, plus de grandes cartes vertes), **Ton carnet** = Tes mieux notés, Historique (60 derniers verres), Familles explorées, Tes spiritueux, chacun en feuille (`carnetSheet`, `profPart` réutilise le rendu d'origine). Une famille touchée dans la feuille ferme la feuille et ouvre Cocktails.
- **Bar** : les catégories et « À racheter » deviennent des en-têtes de liste ; « Additionnel » tient en une ligne (« Basiques toujours disponibles », 21, ouvre le réglage) ; le compteur « cocktails faisables › » mène à la liste des faisables (`gofaisables`). « Achats malins » : « D'après tes goûts ».
- **Labo** (Composer) : le verre ; s'il est vide, « Ou pars d'un classique » juste en dessous ; **Les ingrédients** (seule étape en titre principal) ; puis **Le service** avec quatre sous-réglages : Verre, Glace et décor, Méthode, Style (les numéros 1 à 5 disparaissent). Indication du verre vide : « Verse tes ingrédients : le verre et le style se règlent tout seuls. » (vrai : verre choisi par le barman, style deviné).
- **Accueil** : les accords mets tiennent sur une rangée qui défile (avant : deux rangées de 6).
- Tests : `tests/features/hier_test.js` (profil ≤ 6 sections, pas de grande carte de récap, 3 médailles, carnet et ses feuilles ; bar sans titre de section pour les catégories ; « cocktails faisables » mène à la liste ; labo sans numéros, classiques avant les ingrédients, ingrédients avant le service, ordre des sous-réglages ; accords mets sur une rangée). `hick_test.js` adapté (Profil : 13 choix).

### Fait en 1.40 (hiérarchie « app pro », typographie unique, animations signées — même design)

Objectif de YaYa : une app qui ressemble à une belle app faite par des pros, vendable sur l'App Store. Ses consignes : garder les cartes blanches pour ce qui compte (bouteilles, trophées), la carte verte seulement là où elle rend bien (jamais derrière une illustration colorée comme le verre du labo), pas de nombre de niveaux imposé, uniformiser la typographie sans toucher aux grands titres de page, et quelques animations sympas jamais cheap. Pistes comparées sur le canevas « Zeste — pistes sans conteneurs » (rangée « Retenu en 1.40 » = captures réelles).

**Repères (apps de référence)** : les compteurs sont des chiffres posés sur le fond (Untappd, Apple Forme) ; ce qu'on possède reste en cartes (Vivino, Cartes) ; un grand visuel focal puis des listes, l'annexe en liens (Musique, Airbnb) ; un seul bloc de couleur pour un résumé personnel (Apple Forme).

Code dans **`src/v140.js`** (après v139, avant `ui_final.js`), bloc CSS « 1.40 » en fin de `style.css` :
- **Bar** : compteurs posés sur le fond (`.bar-head` : « 10 bouteilles ouvertes » en grand, « 19 cocktails faisables › » en vert qui mène aux faisables) ; les bouteilles restent en cartes blanches ; sous les listes, trois liens (`.open-links`) : presque vides (`lowsheet`), « Achats malins : Vermouth dry (+5) et N autres » (nouvelle feuille `buySheet`), « + 21 basiques toujours disponibles · Modifier ». Les `id` `st-b` / `st-m` sont gardés (`updateBarStats`).
- **Profil** : **carte verte** `.focal-card` = « Ton profil de goût » (style en Fraunces, radar en jaune, phrase) avec les 3 compteurs en pied de carte (`focalTaste`). Les variables de couleur sont redéfinies dans la carte (`--label`, `--sep`, `--tint`…), donc le radar s'y adapte sans code. Contrastes : crème 7,9:1, vert pâle 5,9:1, jaune 6:1. Trophées : médailles et « Tous les trophées » dans une seule carte blanche (`.tro-card`).
- **Labo** : la scène du verre reste claire ; tuiles du service sans ombre (sauf sélection et suggestion) ; Enregistrer et Prompt IA en liens (`.lab-links`).
- **Accueil** : « Le saviez-vous » en citation posée sur le fond (le retournement marche toujours) ; « De saison » : texte sur le fond, ses cocktails en tuiles ; « Personnaliser l'accueil » en lien.
- **Fiche recette** : Histoire, Profil de goût et Quelle bouteille posés sur le fond (`.card.open`, `.group.open`). La retouche passe par `NEXT_SHEET_XFORM` (enveloppe d'`openSheet`) **avant le premier dessin** : un second `paintSheet` couperait l'animation du verre qui se remplit (vérifié : même SVG, classe `pour`).
- **Typographie, une règle par rôle** : Fraunces réservée aux titres de page (34/700, inchangés), aux noms de cocktail (34, 28, 17, 16 en 600) et aux citations (17/400). En-têtes de liste 15/600 gris partout (Cocktails compris) ; titres de carte et de défi en Figtree 17/600 (avant : Fraunces 17/700, Figtree 16/700…) ; états vides 20/700 ; valeur à droite 17 ; boutons segmentés 14 ; noms de petites tuiles 13/600.
- **Animations** (langage existant, `transform`/`opacity` seulement, coupées par « Réduire les animations » et par « Apparition au défilement » `FX("reveal")`, pas de nouveau réglage) :
  - les chiffres défilent jusqu'à leur valeur (`countUps`, attribut `data-ck`, une fois par valeur) ;
  - le radar se déploie dans la carte verte, une fois par visite du Profil (Web Animations, pas de CSS dans le SVG à cause du piège Safari) ;
  - les nouveaux blocs entrent dans la cascade existante (`revealIn` étendu) ;
  - une médaille gagnée depuis la dernière visite rebondit (`zeste.troSeen` en local) ;
  - la jauge et le liquide des bouteilles gardent leur transition.
- Fluidité (Chromium, processeur ×1) : Profil 60 i/s, Bar 59, Labo 56, aucune saccade de plus de 50 ms à l'ouverture des onglets. Fiche recette : équivalente à la 1.39 (mesures alternées).
- Tests : `tests/features/levels_test.js`, en clair et en sombre :
  - une seule carte verte, et jamais sur le verre ;
  - contraste ≥ 4,5:1 dans la carte ;
  - compteurs du bar hors carte et justes ;
  - bouteilles et trophées en cartes blanches avec ombre ;
  - « Achats malins » ouvre sa feuille ;
  - un style par rôle typographique, et Fraunces seulement à sa place ;
  - en mode réduit, les chiffres ne défilent pas.

  Tests adaptés : `hier_test.js` (lien basiques) et `v127_test.js`. Ce dernier cherche le palier « Habitué de bar » aussi dans « Tous les trophées » : lancé la nuit, il débloque des trophées horaires qui prennent les 3 places du résumé.

### Fait en 1.41 (glace du labo, bar plus simple)

Retour de YaYa : des bugs avec l'ajout et l'affichage des glaçons dans le labo, ce n'est pas naturel d'y jouer, et le bar n'est pas lisible d'un coup d'œil (appliquer plus la loi de Hick).

Bugs reproduits avec de vrais touchers (`scratchpad/ice2.js`) :
1. le choix de la glace était à ~700 px sous le verre : on ne voyait pas les glaçons arriver ;
2. en verre « choisi par le barman », mettre des glaçons gardait la coupe (18 cl, 11,7 cl une fois la glace déduite), donc des glaçons dans une coupe ;
3. du coup le 3ᵉ ingrédient d'un sour était **refusé** (« Plus de place dans ce verre ! ») et disparaissait du mélange ;
4. « Avec cette glace, ça déborde un peu » restait affiché après être repassé à « Sans ».

Code dans **`src/v141.js`** (après v140, avant `ui_final.js`) :
- **`labGlass` enveloppé** : tant que le verre n'a pas été choisi à la main (`M.g` vide), le barman prend un verre qui accepte la glace (jamais coupe, martini ou flûte avec des glaçons) et qui contient le mélange, en montant d'un cran si besoin (`ICE_GLASS` : sour et stirred → tumbler puis highball ; long → highball puis verre à vin ; spritz → verre à vin puis highball). Ces verres sont tous « bons » pour le style dans `labScore`. Un verre choisi à la main n'est jamais changé : le refus « Plus de place » et « Ajuster » restent valables pour lui.
- **La glace juste sous le verre** (`.lab-icerow`, « Sans glace · Glaçons · Gros glaçon · Pilée » sur toute la largeur) ; « Glace et décor » devient « Décor » dans « Le service ».
- **Les glaçons tombent** dans le verre quand on les choisit (`ICE_DROP`, classe `icedrop`, animation `drop` existante, coupée par « Verres vivants » et « Réduire les animations »).
- **Messages à jour** : `hideToast()` après un changement de glace ou un versement réussi ; `ACT.mixice` réécrit (le son reste).
- **Bar (loi de Hick)** : plus de bascule Liste/Étagère au milieu de l'écran, l'étagère est à un toucher via l'icône en haut à droite (`barview`) ; chaque bouteille tient sur **une ligne** (`stockRow` réécrit : nom, niveau en clair « ¾ » à droite en 17 px comme toute valeur à droite, jauge). Le niveau garde la classe `.s` que `patchStock` met à jour.
- Test : `tests/features/ice_test.js` (glace à moins de 220 px du verre et libellés sur une ligne ; les glaçons tombent ; pas de verre à pied avec des glaçons en automatique ; 3 versements acceptés ; plus de message périmé ; bar une ligne par bouteille, bascule en haut à droite qui ouvre l'étagère). `ia_test`, `hier_test`, `levels_test` adaptés.

### Fait en 1.42 (bar épuré, glace réaliste, pictos, Paramètres et À propos, nuit)

Retour de YaYa : les bouteilles ouvertes n'ont pas besoin d'être en haut du bar ; supprimer l'étagère ; basiques et achats malins dans une petite section déroulante ; l'eau gazeuse toujours disponible ; le gros glaçon et la glace pilée s'affichent mal ; des pictos (pas des pastilles) pour citron, citron vert, menthe, blanc d'œuf ; Paramètres plus simples, textes inutiles à la poubelle, le reste dans un À propos ; la nuit fait cheap.

- **Étagère supprimée** : `shelfView`, `ACT.shelfjump` (v125), `barview` (explore), la bascule et ses icônes (v141), la branche de `vBar` (ui.js), les styles `.bar2`/`.b2-*`. Un ancien `barView:"shelf"` est ramené à « list » (v142).
- **Bar** (`src/v142.js`, enveloppe de `vBar`) : en tête, seulement « **N** cocktails faisables › » puis, s'il y en a, la ligne orange « N bouteilles presque vides › » (`lowsheet`). Le compteur « bouteilles ouvertes » disparaît (les bouteilles se voient dans la liste). En bas, avant « Ajouter des ingrédients », un `<details class="bar-more">` fermé par défaut, « Basiques et idées d'achat » : « Basiques toujours disponibles » (`basics`, avec le nombre) et « Achats malins » (`buysheet`). L'état ouvert est gardé pendant la session (`BAR_MORE_OPEN`).
- **Eau gazeuse** : ajoutée à `BASICS` (`data_more.js`), donc `has()` vrai sans stock, absente des listes et des achats malins, désactivable dans la feuille des basiques.
- **Glace réaliste** (`core.js`, `glassSVGRaw`) : `bigIceSVG` dessine un bloc posé au fond (≈ 74 % de la largeur intérieure du tumbler, une « lance » haute dans le highball) ou une **sphère** dans les verres à pied (coupe, martini, flûte, vin) ; `crushedIceSVG` dessine un amas d'éclats irréguliers (≈ 150 polygones déterministes via `hrand`) calculé dans la forme du verre (`glassHalfW`, `GLASS_BOTW`), avec un voile givré. Animations : le gros glaçon ne flotte plus, la pilée tombe d'un bloc ; tout est coupé par « Réduire les animations ».
- **Verre automatique** (v141, `ICE_GLASS`) : seulement des verres que `labScore` juge bons pour le style (stirred, sour et crémeux → tumbler).
- **Pictos du labo** (enveloppe de `vCompose`, `ING_PICTO`) : citron `lemon`, citron vert `citrus`, menthe `mint`, blanc d'œuf et œuf `egg`, concombre, basilic, café ; teinte de l'ingrédient assombrie. Les sirops prennent leur bouteille (`bottleSVG`).
- **Paramètres** : sans la carte logo du haut ni le pied « Version / Recettes » ; textes retirés (ciel, mode silencieux, explication des styles, intro des « Réglages détaillés », phrase de synchro) ; une ligne « À propos ›».
- **À propos** (`aboutBody`, `ACT.about`, `subSheet`) : logo, version, nombre de recettes ; « Comment Zeste te conseille » (`guideHTML`, quitte Suggestions) ; alcoolémie (Widmark, jamais une mesure) ; tes données (synchro sur claude.ai via `initRemote`, sinon locales + export) ; recettes (102 IBA vérifiées, `tests/ibacmp.js`) ; copyright et modération.
- **Nuit** (enveloppe de `applyAmbient`, CSS 1.42) : un croissant de lune net (SVG, 28 px, halo doux) à la place de la tache floue ; 18 étoiles au lieu de 46, seulement au-dessus du titre (masque dégradé), scintillement lent sur l'opacité ; plus d'étoile filante.
- Test : `tests/features/v142_test.js`. Adaptés : `v127_test` (point 4 : statut du soft dans la liste), `ice_test`, `ia_test` (explication des suggestions dans À propos), `hier_test`, `levels_test` (compteur `#st-m`).

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
