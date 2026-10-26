# Passation du projet Zeste — pour Claude Code

Tu reprends **Zeste**, une app web de bar à cocktails pour iPhone, développée en conversation avec Claude (claude.ai). Ce document contient tout ce qu’il faut pour continuer le travail. Lis-le entièrement avant de toucher au code.

## 1. Le propriétaire et ses exigences

- **Yannick Wahler** (« YaYa »), étudiant en génie mécanique en Suisse. Il parle **français** : réponds et écris l’interface en français.
- Il utilise l’app sur **iPhone (Safari)**. Beaucoup de bugs n’apparaissent que dans Safari/WebKit : c’est la cible réelle.
- **Priorité absolue : la véracité.** Pour toute information ajoutée ou modifiée (recettes, proportions, techniques, verrerie, glace, garnitures, dilution, conseils, UX, modèles de recommandation), vérifie avec des sources reconnues, plusieurs si besoin. N’invente jamais une recette ou une technique. Si une information fait débat, présente l’incertitude honnêtement.
- **Conserver ce qui marche** : analyser le code avant de modifier, ne pas réécrire inutilement, garder l’architecture et le design.
- **Numérotation des versions** : la version actuelle est **1.72**. Chaque mise à jour livrée incrémente : 1.21 → 1.72… La constante est `APP_VERSION` dans `src/v117.js`. À chaque livraison, incrémenter aussi `CACHE` dans `sw.js` (`zeste-v30` à la 1.72) pour que le service worker recharge son cache. Le copyright (`COPYRIGHT`, même fichier que la version) affiche l’année en cours automatiquement.
- Copyright affiché dans « À propos » : `© <année> Yannick Wahler. Tous droits réservés.`
- Style de travail apprécié : tester réellement (captures, mesures), annoncer honnêtement ce qui a été vérifié et ce qui ne l’a pas été, expliquer les bugs trouvés. Réponses courtes quand il le demande (souvent « 3-4 lignes »), grep ciblé plutôt que relecture du projet.

## 2. Démarrage rapide

```sh
sh tests/all.sh           # TOUT : build, données, IBA, prédiction, Chromium, contraste, VoiceOver, WebKit, fonctionnalités, fuzz ; s’arrête au premier échec ; copie dist vers ../index.html
sh build.sh                 # assemble dist/zeste.html (fichier unique, ~1 Mo)
node tests/v.js             # validation des données (doit afficher « aucune erreur »)
node tests/validate.js      # validation stricte : unités, rôles, verres, doublons
node tests/ibacmp.js        # comparaison avec les recettes officielles de l’IBA (102 conformes)
NODE_PATH=$(npm root -g) node tests/smoke.js   # ouvre les 366 fiches dans Chromium
python3 tests/fuzz.py       # (Python ≥ 3.12) batterie complète dans Chromium (Playwright)
node tests/m3.js / m5.js / m6.js   # simulateurs du moteur de recommandation et du quiz (SEED=…)
node tests/m9.js                    # score du Labo : 20 mauvais mélanges, IBA, recettes dégradées, aléatoires (SEED=1 puis 2)
node tests/m10.js                   # conseils du Labo (jamais une baisse de note) et continuité de la note
```

Tous les scripts se lancent **depuis la racine du projet** (`zeste_projet/`). Playwright (Chromium) est requis ; WebKit est testé via WebKitGTK (`tests/webkit.js`, `apt-get install webkit2gtk-driver xvfb`). Si WebKit échoue au démarrage du pilote (« fetch failed »), relancer `node tests/webkit.js` seul. Tests de fonctionnalités : `tests/features/*.js` (33 fichiers, bloquants dans `all.sh`). Autres outils : `tests/contrast.js` (WCAG, clair et sombre), `tests/a11y.js` (VoiceOver, cibles tactiles), `tests/audit2.js` ; hors suite : `tests/m7.js`, `m8.js` (moteur), `audit.js` et `txt.js` (relecture des données et des textes), `deadcode.js`, `sounds.js`, `perf.py`. Un `README.md` à la racine du dépôt résume le tout pour un humain.

## 3. Architecture

**Un seul fichier HTML**, sans dépendance ni framework : HTML + CSS + JS vanilla assemblés par `build.sh` (63 modules JS et `style.css` dans `src/`). L’ordre de concaténation est important :

```
style.css
data_ing.js data_rec.js data_lab.js data_more.js data_more2.js data_na.js data_food.js data_final.js data_118.js data_world.js data_iba.js data_softs.js data_drinks.js
core.js icons.js ui.js ui10.js labo2.js trophies.js explore.js chal.js sound.js v117.js v118.js v120.js v122.js v123.js v124.js v125.js v127.js v137.js v138.js v139.js v140.js v141.js v142.js v143.js v144.js v146.js v147.js v148.js v149.js v150.js v151.js v152.js v154.js v155.js v156.js v157.js v158.js v159.js v160.js v161.js v162.js v163.js v164.js v165.js v166.js v167.js v168.js v169.js v170.js v171.js v172.js v173.js v174.js ui_final.js v126.js v130.js
```
(Pas de `v145.js` ni de `v153.js` : la 1.45 n’a touché que le CSS, la 1.53 a enrichi `v152.js`.)

- **Données** (`data_*.js`) : `ING_RAW` (164 ingrédients) et `REC_RAW` (369 recettes, dont 31 sans alcool, et les 102 de la liste IBA dans `data_iba.js` et les fichiers d’origine) ; les fichiers suivants font des `push`. `buildRecipes()` compile en `RECS` (liste) et `RMAP` (dictionnaire par id).
  - Format d’une recette : `[id, nom, famille, méthode, verre, glace, couleur, [[ingrédient, quantité, unité?, rôle?], …], garniture, {options}]`.
  - Unités : `ml` (par défaut), `d` (trait), `f` (feuille), `u` (unité), `bs`, `br`, `gt`. Rôles : `top` (compléter), `float`, `rinse`, `opt` (facultatif).
  - Méthodes : `shake`, `stir`, `build`, `mbuild` (piler puis construire), `mshake`, `hot`, `louche`.
  - Verres : `coupe`, `martini`, `rocks`, `highball`, `flute`, `vin`, `mug`, `tasse`, `shot`. Glace : `none`, `cubes`, `big`, `pilee`.
  - Options : `c` (classique), `s` (suisse), `cr` (création maison **non testée**), `na` (sans alcool), `se` (mois de saison), `v` (variantes), `h` (histoire), `n` (conseil).
  - Basiques toujours disponibles : `BASICS` (`data_more.js`, eau gazeuse comprise depuis 1.42), désactivables dans la feuille des basiques.
- **`core.js`** : moteur (équilibre `calc`, profils `profileR`, dessin SVG `glassSVG`/`garnishSVG`/`bottleSVG`, glace `bigIceSVG`/`crushedIceSVG`, recommandation `getModel`/`predict`/`tonight`, quiz `QUIZ`/`quizPrior`, coût). **`icons.js`** : `lu(nom)` (Lucide, trait 1,75) et `IC`.
- **`ui.js`** : interface de base (5 onglets : Aujourd’hui, Cocktails, Bar, Labo, Profil ; feuilles modales ; mode barman ; roulette). **`labo2.js`** : le Labo (`vCompose`, `labGlass`, `labFits`, `labTry`, `analyze`, `labScore`).
- **Modules suivants** : chaque version a ajouté un fichier. **Convention importante** : ils modifient le comportement en **redéfinissant ou enveloppant** des fonctions existantes.
  - Une déclaration `function f()` ultérieure remplace l’antérieure (hissage JS).
  - Les enveloppes réassignent : `const _f=f; f=function(){ … _f() … }`, souvent en post-traitant le HTML rendu (regex / `indexOf`).
  - Les actions se complètent via `Object.assign(ACT,{…})`.
  - `NEXT_SHEET_XFORM` (v140) transforme une feuille avant sa première peinture.
  - Avant de modifier une fonction, cherche **toutes** ses redéfinitions et enveloppes dans les modules suivants (`vCompose`, `vBar`, `stockRow`, `renderView`, `settingsSheet` en ont beaucoup).
- **`ui_final.js`** se termine par `fixState(); applyTheme(); init(); applyFx();` : c’est le démarrage. Un module qui doit agir dès le premier rendu se place **avant** `ui_final.js`. `v126.js` et `v130.js` (service worker) restent après.
- **Actions** : tout élément avec `data-a="nom"` déclenche `ACT.nom(dataset, élément, événement)` par délégation (`ui.js`, écouteur `click` sur `document`). Exception : les `label.hap` (voir « Haptique »).
- **État** : objet global `S`, sauvegardé dans `localStorage` (clé `zeste.v1`) par `save()`, **uniquement sur l'appareil** (1.65 : plus de synchronisation claude.ai, `initRemote` est vide), avec une copie de secours compressée dans IndexedDB (`v169.js`, voir § 9 quater). Champs principaux :
  - bar et notes : `stock` (niveau 0–4 des bouteilles suivies, 0/1 pour les softs), `ratings`, `rt`, `hist` (`{id,t}`), `fav`, `custom` ;
  - personnalisation : `adj`, `price`, `opened`, `quiz` ;
  - progression : `tro` et `troT`, `chal`, `mix` (état du labo : `items[{id,q}]`, `m`, `g`, `gUser`, `ice`, `gar`, `t`) ;
  - `settings` : unit, cur, theme, fx, sound, vol, home, glasses, wake, remind, untested, explore, ctx, na, ambiance, moment, barFold, hintSwipe…
  - `healState()` (`ui_final.js`) répare tout champ de mauvais type au chargement et après synchronisation.
- **Rendu** : `renderView(onglet)` régénère le HTML d’un onglet. `changed()` sauvegarde et redessine l’onglet visible (ou à la fermeture de la feuille qui le couvre). `paintSheet`/`refreshSheets` gèrent les feuilles ; `subSheet(titre, corps)` ouvre une sous-feuille avec « ‹ Paramètres ».

### Environnement d’exécution (claude.ai)

L’app est publiée comme artifact sur claude.ai : `https://claude.ai/artifact/S4FstFgJfmaipC6JGEtoiw`. Le code utilise seulement `window.claude.use("downloads")` pour l’export de sauvegarde et l’image du Rewind ; plus aucune synchronisation (capacités `db` et `user` retirées en 1.65). **Ces API n’existent pas hors de claude.ai** : replis (feuille de texte, partage natif, image à enregistrer d’un appui long). Le service worker (`sw.js`, `v130.js`) n’est inscrit qu’en https ou localhost, jamais sur claude.ai.

## 4. Pièges connus (tous déjà rencontrés)

1. **Safari et les animations CSS dans un SVG** : si un conteneur est en train de faire une transition ou une animation (fondu, zoom), Safari peut relancer en boucle les animations CSS des éléments internes au SVG. Pour tout mouvement de liquide ou de reflet, utiliser **SMIL** (`<animateTransform … begin="indefinite">` puis `beginElement()`), comme dans le labo.
2. **`confirm()`/`alert()` bloqués** dans le cadre sécurisé de claude.ai : utiliser `confirmSheet({title,html,ok,onOk,danger})` (dans `v120.js`) ou une confirmation en deux touchers (« Recommencer à zéro », v146).
3. **Import de fichier sur iOS** : le `<input type="file">` doit être attaché au DOM (voir `importData`).
4. **Audio sur iOS** : le déblocage ne fonctionne qu’à la **fin** d’un geste (`touchend`/`click`), pas sur `pointerdown`. Les sons sont synthétisés (Web Audio, `sound.js`) ; en mode silencieux de l’iPhone, ils restent coupés, et c’est voulu. Le jingle de lancement ne peut pas jouer avant un premier toucher.
5. **Conflits de noms de classes CSS** : `.empty` existait déjà et a écrasé une étiquette. Préfixer les nouvelles classes.
6. **Heures** : toujours passer par `momentForHour(h)` (heure locale via `Date#getHours`). Un bug classait minuit–4 h en « après-midi ».
7. **Harnais Node** (`tests/*.js`) : ils évaluent le bundle avec un faux DOM. Tout code exécuté au chargement doit tolérer l’absence d’API (ex. `if(typeof MutationObserver!=="undefined")` dans `v144.js`), ou il faut compléter les bouchons en tête des tests.
8. **Performances** : la liste des cocktails s’affiche par paquets ; les dessins de verres sont mis en cache (`GFULL`, `THUMB`) et invalidés dans `buildRecipes`. Toute nouvelle vue lourde doit suivre le même principe.
9. **Animations CSS dans les SVG = coût permanent** : elles tournent sur le fil principal. Les limiter à quelques cycles et les relancer au toucher (`reanimate`, `v122.js`) ; une animation terminée ne redémarre qu’en changeant de nom (`wave`/`wave_b`).
10. **Web Audio** : un gain vaut 1 par défaut ; toujours l’initialiser au silence (`g.gain.value=0.0001`) avant de programmer l’enveloppe, sinon les premiers échantillons claquent.
11. **Tailles de police en `rem`** (1 rem = 17 px à la taille standard) : la racine suit Dynamic Type ou le réglage « Taille du texte ». Ne plus écrire de `font-size` en px ; prévoir des libellés sur deux lignes.
12. **Tubes shell** : `node tests/v.js | tail -1` masque un échec ; utiliser `tests/all.sh` (`set -e`) ou `set -o pipefail`.
13. **Ne jamais recréer un `<input>` pendant qu’on y tape** : sur iOS Safari, détruire/recréer le champ focalisé désynchronise le clavier et fait sauter des lettres. Seul le conteneur de résultats (`#cx-res`, `#aq-res`, `#pq-res`) est repeint à chaque frappe.
14. **Classes CSS partagées par accident** : `toast(…,{trophy:1})` ajoutait `.trophy`, qui héritait des styles des tuiles du profil (renommée `.t-tro`). Avant d’ajouter une classe à un élément global (`#toast`, `#overlay`…), chercher si elle existe dans `style.css`.
15. **Code mort par hissage** : une `function f(){}` redéclarée plus loin rend la précédente inutile (`tests/deadcode.js` les détecte). Préférer la réassignation ou l’enveloppe.
16. **`tests/all.sh` et le fuzz** : la moindre entrée non vide du JSON d’erreurs du fuzz fait échouer la suite ; les tests de fonctionnalités sont bloquants aussi.
17. **Test de persistance et rechargement immédiat** : dans Chromium automatisé, recharger quelques millisecondes après une écriture `localStorage` peut relire l’ancienne valeur. `tests/features/persist.js` attend 400 ms.
18. **Contenu d’un `<details>` fermé** : Chromium lui donne quand même une taille (`getBoundingClientRect` non nul). Un test qui compte « ce qui est à l’écran » doit exclure `details:not([open])` hors `summary` (corrigé dans `hick_test.js` en 1.50).
19. **Ordre des enveloppes de `vCompose`** (v137 → v141 → v142 → v146 → v149 → v150) : chacune transforme le HTML de la précédente. Une regex qui délimite une zone doit s’arrêter au bon endroit : en 1.46, la carte « Personnaliser » englobait tout jusqu’au titre suivant et avalait le bouton Servir quand « Conseils » était absent (corrigé en 1.48).
20. **Boutons devenus `label.hap`** (depuis 1.44) : un sélecteur CSS ou JS écrit `.x button` ne les trouve plus. Cibler `.x>*`, `.x [data-a]` ou ajouter le pendant `label.hap` (la feuille de niveau a perdu sa mise en page de 1.44 à 1.47 pour cette raison).
21. **`S.settings.moment` remis à « auto » au chargement** (`v120.js`) : pour forcer un moment (nuit…) dans un test ou une capture, le régler **après** le chargement, puis `applyAmbient()`.
22. **Tout versement du Labo passe par `labPour`** (`v164.js`) : tuile, « + » du stepper, conseil, ajout direct, « Autre » (`ACT.mixadd`, oublié jusqu'à la 1.63) et saisie au clavier versent min(dose, place) au 0,05 cl ; refus seulement verre plein, un seul message. Un nouveau chemin d'ajout doit l'utiliser (sinon : « soft refusé sous 10 cl »). `labfill_test.js` parcourt tous les chemins.
23. **Bancs Node et ordre du bundle** : `v126.js` et `v130.js` viennent *après* `init();`. Un banc qui coupe le bundle à `init();` perd `TIER_TROPHIES` et `moveTabInd` : `vProfil` y plantait en silence jusqu'à la 1.64. Ne retirer que la ligne de démarrage (`init(); applyFx();`) et bouchonner `addEventListener`. `all.sh` échoue désormais si `v.js` signale une vue en erreur.
24. **Score « sans note »** : `labScore` renvoie `{none:true, score:null}` quand le mélange n'a pas deux rôles différents. Tout affichage ou toute logique qui lit `SC.score` doit tester `SC.none` (service bloqué, défis refusés, sous-scores masqués).
25. **Code évalué dans la portée de l'app** (`m9.js`, bancs) : un `const score=…` entre en collision avec la fonction `score(r)` de l'app ; envelopper le code du banc dans un bloc `{ … }`.
26. **Ne jamais réécrire entièrement une fonction ou une action déjà enveloppée** (`f=function(){…}` sans appeler la version précédente) : l’ajout de l’enveloppe plus ancienne disparaît en silence (1.59 → 1.70 : filtre « créations à tester », sons). Envelopper (`const _f=f; f=function(){ … _f() … }`) ; `tests/wrappers.js` échoue sinon, sauf exception listée avec sa raison.

## 5. Règles en vigueur

- **Rôle de chaque onglet** (1.38) : **Aujourd’hui** = que boire maintenant · **Cocktails** = chercher · **Bar** = ce que j’ai · **Labo** = créer et fabriquer · **Profil** = moi (goûts, historique, trophées, récaps). Une information à un seul endroit.
- **Loi de Hick** (1.37) : avant d’ajouter un bouton, se demander ce qu’il remplace ; un réglage rare va dans un groupe des Paramètres, une liste longue derrière « Voir les N autres » (`moreBtn`, `MORE_OPEN`, `foldRows`). Budgets de choix tenus par `tests/features/hick_test.js` : **accueil 36, bar 45, labo 58, profil 32, réglages 12** (accueil relevé de 32 à 36 en 1.43 : le carrousel « Sans alcool » apparaît depuis que l’eau gazeuse est un basique).
- **Trois niveaux par écran** (1.39) : un point focal ; des sections principales (titre `h2.sh`, 22 px, contenu en carte) ; le reste en petits en-têtes de liste (`.list-h`, `.cat-h`, `.lab-sub`) et lignes qui ouvrent une feuille. Une seule carte verte (profil de goût) ; bouteilles et trophées en cartes blanches.
- **Échelle de texte** : 11 · 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 28 · 34 (+ grands chiffres) ; un style par rôle typographique (vérifié par `levels_test.js`) ; la police Fraunces seulement pour titres de page, noms de cocktail et citations. **Rayons par rôle** : `--r-ctl` 10, `--r-tile` 14, `--r-card` 18, `--r-hero` 24. Nouveaux écrans : jetons `--z-*` (voir « Cap design »).
- **`SREV`** : compteur incrémenté par `save()` et `fixState()` ; modèle, comptes et recettes distinctes sont mis en cache par `SREV`. Toute nouvelle écriture de `S` hors `save()` doit faire `SREV++`.
- **Ordre de chargement** : un nouveau module va **avant `ui_final.js`** (et après le module qu’il enveloppe) ; l’ajouter dans `build.sh` et dans la liste du §3.

## 6. Historique jusqu’à la 1.43 (une ligne par version)

- **1.21** : les 102 cocktails IBA alignés (`data/iba.json`, `data_iba.js`), 10 ajoutés ; écarts assumés listés dans `ALT`/`EXC` de `tests/ibacmp.js`.
- **1.22** : recettes populaires hors IBA vérifiées ; doublons fusionnés (`ID_ALIAS`, `migrateIds`) ; accessibilité (contraste, Dynamic Type, VoiceOver).
- **1.23** : suggestions par occasion (`v123.js`).
- **1.24** : champs de recherche jamais recréés pendant la frappe (piège 13).
- **1.25 à 1.27** : alcoolémie indicative, Widmark (`v124.js`), poids et sexe obligatoires, unité « kg ».
- **1.28** : audit complet, écran de premier lancement (`v127.js`), code mort retiré.
- **1.29** : identité « Écorce », logo « le ruban » (`zesteMark`).
- **1.30** : système d’icônes Lucide (`icons.js`), plus aucun emoji.
- **1.31** : service worker et annonce de mise à jour (`sw.js`, `v130.js`).
- **1.32** : plats incohérents retirés des accords mets (`data_food.js`).
- **1.33** : son relancé après un passage en arrière-plan (`sound.js`).
- **1.34 à 1.36** : robustesse (`healState`), pas de zoom au double tap, champs ≥ 16 px, fluidité, barre d’onglets sans débordement.
- **1.37** : loi de Hick, harmonisation (échelle de texte, rayons), feuille de niveau, Paramètres en groupes (`v137.js` : `SET_GROUPS`, `subSheet`, `levelSheet`, `moreBtn`).
- **1.38** : un rôle par onglet, sans alcool en filtre, « Fait maison » au Labo, récaps au Profil (`v138.js`).
- **1.39** : hiérarchie en trois niveaux, Profil en 5 sections (`v139.js`).
- **1.40** : carte verte unique, compteurs, animations signées, `NEXT_SHEET_XFORM` (`v140.js`).
- **1.41** : glace choisie sous le verre et qui tombe, verre automatique adapté à la glace (`ICE_GLASS`), une ligne par bouteille au bar (`v141.js`).
- **1.42** : étagère supprimée ; en-tête du bar réduit à « N cocktails faisables » + « presque vides » ; basiques et achats malins dans `details.bar-more` ; eau gazeuse en basique ; gros glaçon et glace pilée réalistes (`core.js`) ; pictos des ingrédients frais ; Paramètres épurés et « À propos » (`aboutBody`) ; nuit (lune, 18 étoiles) (`v142.js`).
- **1.43** : glisser une bouteille vers la gauche ouvre « Finie » (grand glissé = finie d’un coup, avec Annuler) ; indice du geste montré une fois (`S.settings.hintSwipe`) ; catégories repliables au-delà de 15 bouteilles (`S.settings.barFold`) (`v143.js`).

## 7. Depuis la 1.43

- **1.44 — Haptique** (`v144.js`) : voir « Haptique » ; `USE_LEGACY_VIBRATE=false` (`ui.js`).
- **1.45 — Barre d’onglets** : rebond des icônes, CSS seul (keyframe `tb`, 220 ms).
- **1.46 — Labo** (`v146.js`, `vCompose`) : jetons `--z-*` ; `.lab-auto` ; `details.lab-perso` ; Servir collé (`.lab-servebar`) ; `details.lab-chal`.
- **1.47 — Bar** (`v147.js`) : la fraction est le bouton de niveau (`.lvl.one .lvl-txt`) ; ajout en gros seulement si le bar est vide ; « presque vide » = ¼ ou ½ (`lowCount`).
- **1.48 — Labo** : Personnaliser s’arrête avant Servir ; versement adapté à la place restante (`v148.js`, `ACT.mixpour`, `POUR_STEP` 2,5 ml, `labFitsWith`, `labNope`).
- **1.49 — Labo** (`v149.js`) : conseils en une ligne (`.tip-one`) ; décor en rangée ; segments iOS ; barre Servir floutée.
- **1.50 — Labo** (`v150.js`) : un seul message de débordement (`ACT.mixice`) ; tous les décors ; toasts au-dessus de Servir (`liftToast`).
- **1.51 — Profil** (`v151.js`, `vProfil`) : plus de ligne « Paramètres » ; textes raccourcis ; Historique en nombre (`v139.js`).
- **1.52 — Fiche recette** (`v152.js`) : `recPolish` composé avec `recOpen` via `NEXT_SHEET_XFORM` (bannière de manque retirée, `.badge.warn`, « % pour toi » dans le bandeau, sans `ing-sec`, « Modifier dans le labo » dans `.card.adj`) ; titre réduit `recTitle` (`aria-hidden` tant qu’il est caché).
- **1.53 — Fiche recette (2)** (`recPolish` + CSS) : étoiles sans libellé ; `.adj-same` ; histoire au format des étapes ; ampoule (`lightbulb` dans `LU`) ; un terme souligné une fois.
- **1.54 — Labo, Bar, feuille d’ajout** (`v154.js` + CSS) : conseils (« ! » pour `mixfix`, sinon ampoule) ; « 4 feuilles » (`fmtQ`) ; `details.bar-more` au format de Personnaliser ; points de catégorie retirés (règles dans « Cap design »).
- **1.55 — Softs suisses** (`data_softs.js`, sources en tête) : Crodino, Sanbitter, Elmer Citro, Gazosa, Schorle, Rivella bleu ; `subs` limonade et Rivella ; 3 recettes sans alcool ; `ROLE`, `PAIR.amer_na`, `SPIRIT_GROUP` ; `v155.js` enveloppe `pairings` (sans alcool : jamais d’alcool proposé). **Piège** : `tests/load.js` coupe au premier `ING_RAW.forEach(` : utiliser `for…of` dans les données.
- **1.56 — Labo + design global** : contenance réglable (`v156.js`, `S.settings.glassCap`) ; accent réservé, Profil (`v157.js`) ; Bar et feuilles (`v158.js`) ; jetons `--z-*` et marge de 20 px.
- **1.57 — Audit mesurable** (CSS) : zones 44 px, `--z-ic`, marge de 20 px partout.
- **1.58 — Décisions de l'audit** (`v159.js`) : « Ta version » en piste ; pictos ≥ 3:1 (`picCol`) ; textes ≥ 13 px ; espacements en jetons. **Piège** : un `var(--…)` écrit dans une regex doit avoir ses parenthèses échappées.
- **1.59 — Lot A→H** (`v160.js`, `v161.js`) : pastille d'onglet (`v130.js`) ; Aujourd'hui épuré ; profil de goût d'une seule source (`tasteAxes`) ; « Conseillé » = Auto (`labGlass`) ; moteur (§ 9 bis).
- **1.60 — Finitions + intelligence** : onglets 1/5 (`v130.js`), radar, Lignées, segments et ciel sombre (`v162.js`) ; duels, signaux implicites, recherche en langage courant, précision mesurée (`v163.js`, § 9 bis). **Piège** : la zone `::after` de `label.search` intercepte les clics de Playwright : `focus()` dans les tests.
- **1.61 — Labo** : versement adapté à la place par tous les chemins (`v164.js`, `labPour`, `labFitsStrict`) ; score continu (`v165.js`) ; point de statut seulement vert (`statusDot`).
- **1.62 — Score du Labo v3** (`v166.js`, § 9 ter) ; affichage : mots, écran de service chiffré, score en direct, seuils (`v167.js`).
- **1.63 — Labo** (`v168.js`) : « Autre » versait la dose entière (soft refusé sous 10 cl) ; « + » sans son ; quantité saisissable au clavier (`mixqedit`, champ 16 px jamais recréé pendant la frappe).
- **1.64 — Robustesse et nettoyage** : sous-scores masqués sans note ; bancs Node complets (`v.js`, `audit.js`, `pick.js`, `txt.js`) ; règle « sans alcool » de `audit.js` alignée sur `na:1` ; fichiers inutilisés retirés (`data/bad|good|other.json`) ; `README.md`.
- **1.65 — Données locales** (`v169.js`) : synchro claude.ai retirée, copie de secours IndexedDB, sauvegardes et écran de stockage (§ 9 quater) ; textes d'« À propos » raccourcis.
- **1.66 — Mes créations** (`v170.js`) : section du Profil, avant « Ton carnet », listant tous les cocktails créés dans le Labo (plus récents d’abord, 3 puis « Voir les N autres », via `recRow` et `foldRows`) ; liste vide : « Crée ton premier cocktail » ouvre le Labo en Composer (`ACT.gocreate`). Test `mine_test.js`.
- **1.67 — Conseils et prédiction** (`v171.js`) : conseils du Labo vérifiés par la note (§ 9 ter, `m10.js`, `labtips_test.js`) ; plafonds d'équilibre adoucis ; une création enregistrée non notée devient un signal de goût (v 1,0, poids 0,5, réglé avec `m7.js CREA=1` : NDCG à 3 notes 0,776 → 0,831 en validation) et a un plancher de prédiction de 3,6.
- **1.68 — Recettes vérifiées, nouvelles boissons** (`data_drinks.js`, `v172.js`) : 64 recettes non classiques vérifiées (§ 10, `data/verif.json`), audit `recaudit.js` ; 17 boissons (5 tonics aromatisés, limonade sicilienne, kombucha, gin / prosecco / bière sans alcool, vin rosé, saké, bière blanche, IPA, poiré, tequila reposado, gin rosé ; sucres sourcés en tête du fichier) et 13 recettes ; substituts dans les deux sens (tonic ↔ tonics aromatisés…) ; `ING_KIN` : une variante compte comme son ingrédient de base pour le modèle de goût ; m9 tire ses mélanges au hasard dans le catalogue d'avant la 1.68 (`NEW168`). Test `drinks_test.js`.
- **1.69 — Conseil de méthode** (`v173.js`) : `labMethodAdvice` (règles de bar : bulles → construit ; agrume, jus, œuf, crème, café → shaker ; alcools seuls → verre à mélange ; admis : construit pour shot, apéritif au vin, long drink simple, crème posée ; verre à mélange avec tomate) ; une ligne « … : au shaker / remue-le / construis-le » + « Appliquer » (`ACT.mm`) en tête des conseils, seulement si la méthode choisie n’est pas admise et si la bonne méthode ne fait pas baisser la note. Accord avec 364/369 recettes (écarts de tradition : Vesper, Angel Face, Saketini secoués ; Brandy Crusta, Bellini). m10 étendu ; test `labmethod_test.js`. Constat : sur 466 cas de mauvaise méthode, 60 sont retenus parce que le barème récompense la mauvaise technique (Blood and Sand remué 97, secoué 64) — à corriger dans le barème.
- **1.70 — Audit complet** : (1) **dilution du shaker** : `core.js` reprenait la formule de *Liquid Intelligence* avec l’erreur de signe du livre (+1,567·A²) ; corrigée en −1,567·A² (50–60 % de dilution comme annoncé par le livre ; relevé par Mike McDonald) — les cocktails secoués étaient trop dilués (volume, degré, faux débordements : 81 → 65) ; (2) **style du Labo** tiré de la composition, plus de la méthode (`styleOf` : un Blood and Sand remué ou secoué reste le même cocktail) ; (3) **highballs et spritz secs** (Whisky highball, Gin rickey, Ranch water, Gespritzter) : le manque de sucre n’est plus un déséquilibre (`v166.js`, `dryLong`) ; (4) **enveloppes perdues** (`v174.js`) : réglage « Inclure les créations à tester » sans effet depuis la 1.59, explication « Pour finir ton … ouvert » perdue, sons perdus (Ajuster au verre, réglage d’une animation, conseil appliqué, fermeture de la carte) ; (5) ESLint : icône et clé en double, branche morte, tableaux à trous. Nouveaux tests : `tests/formulas.js` (valeurs de référence + cohérence de toutes les recettes et de 2 000 mélanges), `tests/wrappers.js` (enveloppes perdues, exceptions documentées), `features/textscan_test.js` (aucun NaN/undefined affiché), ESLint dans `all.sh`. m9 : AUC 0,717 → 0,722, IBA ≥ 90 : 78 → 84 % ; plancher « dégradées » 59 → 60 % (mesuré avec la dilution fausse). Prédiction : m3/m5 identiques, m6 +0,004 à +0,009.
- **1.71 — « Mon bar » plus utile** (`v175.js`) : (1) **À finir** : ligne en tête et feuille (cocktails faisables, triés selon tes goûts, sans doublon) pour les bouteilles ouvertes qui s'abîment ; durées prudentes au frais dans `KEEP` (bulles 3 j, bière 1 j, vin 4 j, saké et xérès 14 j, vermouths, Lillet et porto 30 j), montrées tout de suite si ≤ 4 j, sinon dans le dernier quart ; la date d'ouverture est désormais suivie aussi hors bulles (pleine → entamée ; effacée si rachetée, vide ou retirée) ; (2) **Le meilleur achat** : carte sous l'en-tête (1er de `bottleRecs`), la ligne « Achats malins » quitte le repli ; (3) **« N cocktails »** faisables sous chaque bouteille (`makeCount`, mémoïsé) — classe `bar-n` sans `s`, car `ui.js` écrit le niveau dans le premier `.s` de la ligne ; (4) **fiche bouteille** : « Ce qu'elle t'apporte » (faisables, à une bouteille près, ≈ verres restants via `glassesLeft`), ce qu'on perdrait sans elle (ou son substitut présent), jours restants si ouverte, 3 cocktails « À une bouteille près ». Test `features/bar_test.js` ; `hick_test` compte désormais le seul groupe « Utilisé dans » (bar : 37 choix sur 45).
- **1.72 — Carte recette à partager** (`v176.js`) : bouton « Partager en image » en haut à gauche de la fiche (en miroir de « Fermer » ; la barre du bas est pleine, et « Modifier dans le labo » vit dans la carte « Ta version » depuis la 1.50). `recCardSVG(id)` dessine une carte 1080 × 1350 (verre sur la couleur du cocktail, « LA RECETTE » ou « MA CRÉATION », nom à taille adaptée, étoiles si notée, méthode · verre · degré ou « sans alcool », jusqu'à 9 ingrédients avec doses `fmtQ` dans l'unité choisie, marque) ; `recCardBlob` la passe en PNG par la même chaîne que le Rewind ; `shareCard` : partage du téléphone (fichier), sinon `downloads` de claude.ai, sinon image à enregistrer d'un appui long (`img.card-img`). Test `features/share_test.js`.

## 8. Haptique

- **Motif** (`src/v144.js`) : Safari iOS ignore `navigator.vibrate`, mais toucher **directement du doigt** un `<label>` qui contient un vrai `<input type="checkbox" switch>` fait vibrer, même si le switch est invisible (opacité 0, 1 px, jamais `display:none`). Un `.click()` lancé par JavaScript ne vibre pas.
  - `hapt()` convertit chaque `button[data-a]` dont l’action est dans `HAPTIC` en `<label class="… hap" role="button" tabindex="0">` (attributs et enfants conservés) avec `<input type="checkbox" switch class="hap-sw" tabindex="-1" aria-hidden="true">`. Un `MutationObserver` sur le document le fait à chaque insertion : les gabarits HTML ne changent pas.
  - L’action ne part que sur **`change`** du switch (`ACT[l.dataset.a](l.dataset, l, e)`). Le distributeur de `ui.js` ignore tout clic dans `label.hap` (pas de double déclenchement), mais les écouteurs en capture (ex. `SW_EAT`, qui avale le clic après un glissé) voient toujours le clic.
  - Clavier : Entrée ou Espace sur le label appelle `input.click()` (action sans vibration).
  - CSS : `label.hap`, `label.hap>.hap-sw` (fin de `style.css`), pendants `.stars label.hap` et `.lvl-big>label.hap`.
- **Où, et d’où part le déclenchement** :
  - toucher direct du switch : `lvlset` (feuille de niveau), `toggle` (soft en stock ou non), `addtoggle` (ajouter ou retirer depuis la feuille d’ajout), `refill` (« Racheté »), `rmstock` (« Retirer de mon bar »), `rate` (étoiles), `made` (« Préparé »), `mixserve` (Servir du Labo), `finish` (bouton « Finie » révélé par le glissé) ;
  - geste, donc sans haptique : `finish` par un grand glissé (appel direct de `ACT.finish`, `v143.js`).
- **Règle** : un seul tac par action voulue ; jamais sur la navigation (onglets, feuilles), la fermeture, ni les événements automatiques (trophée débloqué, fin du minuteur, toast).
- **Réglage « Retour haptique »** : réglage non trouvé dans le code à la 1.50 (recherche `haptiq|hapt|vibr|retour` dans `src/`, valeurs par défaut de `S.settings`, `healState`, groupe « Sons et animations »).

## 9. Cap design

- Sobre, proche d'Apple ; ni consigne ni information répétée.
- **Accent** (`--z-accent` : vert en clair, jaune en sombre) réservé à l'action principale et à l'état actif ; texte posé dessus en `--on-tint`. **Vert** = validation, **orange ou rouge** = alerte (point de 8 px ; « ! » pour un manque, ampoule pour un conseil). Secondaire en gris (`--label2`, `--z-ic`).
- **Trois tailles** (`--z-fs-h` 22, `--z-fs-b` 16, `--z-fs-l` 13), plus les titres de page (34) et les grands chiffres ; rien sous 12 px (vérifié par `hick_test`). **Grille de 8 px** (`--z-s1…s4`, 4 px toléré entre icône et libellé). **Marge latérale de 20 px** (`--z-side`) sur tous les écrans ; titre → contenu 24 px. Contraste texte ≥ 4,5:1, icônes ≥ 3:1 ; zones tactiles ≥ 44 px par `::after` (visuel inchangé).
- **Onglets** : 5 colonnes égales, pastille = colonne − 8 px, libellés de 12 px. **Segments** : piste opaque et neutre (`--z-seg-track`), pastille `--z-seg-on` sans ombre, identiques partout. **Chips et tuiles** sélectionnées : bordure d'accent 2 px (+ fond `--z-accent-bg` pour tuiles et préréglages) ; jamais de fond plein. Chevron ⌄ / ⌃. Pas de swipe entre onglets.
- **Ambiance** : en sombre, fond uni et au plus un léger dégradé au-dessus du titre (pas de soleil ni de tache) ; particules seulement au-dessus du premier texte ; halo d'une boisson ≤ 15 %.
- **Jetons** (`:root`, bloc « 1.46 » et « 1.49 » de `style.css`), clair / sombre :

| Jeton | Clair | Sombre |
|---|---|---|
| `--z-accent` (= `--tint`) | #1F5A3D | #F5C518 |
| `--z-accent-bg` (= `--tint-bg`) | rgba(31,90,61,.10) | rgba(245,197,24,.14) |
| `--z-ok` (= `--green`) | #1E7B34 | #30D158 |
| `--z-warn` (= `--orange`) | #B25000 | #FF9F0A |
| `--z-err` (= `--red`) | #D70015 | #FF453A |
| `--z-seg-on` / `--z-seg-track` | #FFFFFF / 9 % de `--label` sur `--bg2` | #4A524C / idem |
| `--z-fs-h` / `--z-fs-b` / `--z-fs-l` | 22 / 16 / 13 px (en rem) | idem |
| `--z-s1…s4` | 8 / 16 / 24 / 32 px | idem |
| `--z-side` | 20 px | idem |
| `--z-r-s` / `--z-r-m` / `--z-r-l` | 10 / 14 / 20 px | idem |
| `--z-ic` (icône neutre) | rgba(79,70,52,.68) | rgba(242,237,224,.5) |

## 9 bis. Moteur de recommandation

- **Modèle** (`core.js` `getModel`/`trainSet`, `v161.js` `predict`) : voisins + ingrédients + familles + axes de goût + ridge sur le profil. Signaux : notes (note − 3, vieillissement doux), verre refait (v 1 + 0,25/fois), favori, fiche ouverte, « Ta version » (`S.adj` : 0,05 par cran sur `DIR`), quiz. Biais utilisateur : + ½ (moyenne rétrécie de ses notes − 3) (Koren 2009).
- **« N % pour toi »** = `likeProb` : P(≥ 4 étoiles) logistique (Platt 1999) sur la prédiction, réglée par simulation ; plafond 95 % sous 15 notes, jamais 100 %.
- **Listes** (`tonightRaw`) : faisables, MMR λ 0,75 (Carbonell & Goldstein 1998) sur `recSim` (ingrédients, famille, base), 3 derniers préparés pénalisés ; découverte = incertitude × P(aimer). « Surprends-moi » : top 15, jamais noté ≤ 2.
- **Achats malins** : gain attendu Σ P(aimer)². **Autonomie** : ≈ N verres = niveau × contenance ÷ dose moyenne (`glassesLeft`), tri par urgence. **Explications** : contribution réelle la plus forte, sinon rien.
- **Duels** (`v163.js`, « Affiner mon goût » dans Ton carnet, `S.duels`) : préférence par paires dans `trainSet` (gagnant +0,8, perdant −0,8, poids 0,5) ; paire = incertitude + densité + couverture + différence (Settles & Craven 2008), jamais notée ; 10 par série ; choix en `label.hap` (action `duel`).
- **Signaux implicites** (`S.sig`) : fiche ouverte puis Préparer (+0,6), Surprends-moi écarté en < 10 s (−0,4) ; fatigue du héros dégressive (demi-vie 2 j). Explication : le voisin dominant dit sa source (note, duel, Préparer, refait, favori).
- **Recherche en langage courant** (`nlParse`, enveloppe de `filtered`) : axes de goût, sans alcool, faisable, avec / sans X, moments, Levenshtein ; puces retirables (`nlrm`) ; un nom ou un spiritueux seul garde la recherche classique.
- **Précision mesurée** (À propos, ≥ 10 notes) : validation croisée en laissant une note de côté (`looAccuracy`), différée, mise en cache par `SREV`.
- **Tests** : `m3`, `m5` (froid), `m6` (NDCG@10), `m7` (signaux, MAE, Brier/ECE, liste, achats), `m8` (duels contre paires et notes au hasard). **Règle** : régler sur `SEED=1`, valider sur `SEED=2`, ne garder que ce qui améliore la validation sans dégrader `m5` ; variantes via `EXP=fichier`, `RECO='{…}'` ou `RECO2='{…}'`. Non retenus : centrage, IDF, ridge ingrédients.

## 9 ter. Score du Labo v3 (1.62)

- **Formule** (`v166.js`, `labScore`) : Q = 100·(0,6·Équilibre + 0,4·Force) ; facteur technique T = (0,8 + 0,2·Remplissage)·(0,75 + 0,25·Glace), entre 0,6 et 1 ; score = Q·T ; 100 seulement à partir de 98 brut. Décor = bonus affiché, hors note. Mots (`labGrade`, `v167.js`) : Déséquilibré < 40, Buvable 40-69, Réussi 70-84, Excellent ≥ 85.
- **Rôles** (`labRole`, `labRoles`) : base, acide, sucre, mélangeur (compte à partir de 15 % du volume), amer, liqueur ; sans spiritueux, l'alcool le plus abondant tient lieu de base (Kir, Panaché). Moins de deux rôles : pas de note (« Ajoute un second ingrédient »).
- **Équilibre** : distance hors des plages du style (P10–P90 des recettes de l'app préparées comme « Modifier dans le labo », `labRef`/`labRef3`) pour le sucre, l'acidité, le sucre attendu (régression sur acidité, amertume, degré), le degré, la part d'amers, et une combinaison de rôles jamais vue dans ce style ; exp(−½·d²/1,1²) après 0,25 de tolérance (à 3 écarts : 0,044).
- **Force** : plage du degré du style et éthanol pur par verre (`ETH_IBA` : médiane 23,7 ml, P95 32,6 ml sur 101 IBA, recalculés et vérifiés par `m9`).
- **Plafonds** : 39 si volume > 135 % de la contenance effective ou éthanol > 48,9 ml (net) ; selon l'Équilibre (1.67, `v171.js`, adoucis) : 39 sous 0,27, de 39 à 70 entre 0,27 et 0,33, 70 jusqu'à 0,55, puis sans plafond à 0,65.
- **Cohérence** : jauge de remplissage colorée par le sous-score Remplissage (≥ 0,70 / ≥ 0,40 / < 0,40) ; « À améliorer » = sous-scores < 70 ; seuils des défis 95 / 97 / 100, « Chef de bar » 97, confettis 97.
- **m9** (bloquant) : 20 mauvais mélanges écrits à la main sous 40 ou sans note ; IBA ≥ 85 pour 90 % ; médianes IBA ≥ 90 et recettes ≥ 85. Non tenables sans pénaliser des recettes réelles (planchers de non-régression) : AUC ≥ 0,95, dégradées < 5 %, aléatoires médiane ≤ 45 / P90 < 80 / ≤ 1 % à 90 : les recettes de l'app occupent les mêmes zones de sucre, d'acidité et d'alcool que ces mélanges. IBA sous 85 assumés : Zombie, IBA Tiki (débordement, éthanol), Trinidad Sour (amers), Monkey Gland, Mary Pickford, Porto Flip, Bloody Mary, Old Fashioned, Pisco Sour, Casino.
- **Conseils du barman** (1.67, `v171.js`) : les boutons « + » / « − » ne viennent plus de l'ancien analyseur (zones) mais de `labBestFixes` : ajouter 0,5 à 2 cl d'acide ou de sucre, 1 à 2 cl de la base, de l'allongeur (styles longs), ou réduire un ingrédient à 75 % / 50 % ; chaque candidat est noté par `labScore`, on garde les 2 meilleurs gains ≥ 3 points (mémo par mélange). Une réduction passe par `mixfix` avec une quantité négative (« Réduire le … à … »). Même règle pour la fiche Équilibre/Force (`goalAdvice`).
- **m10** (bloquant) : aucun conseil chiffré ne fait baisser la note (1.66 : 19 % des recettes, 7,5 % des dégradées, 18,5 % des aléatoires, pire −100) ; ≥ 60 % des notes < 85 ont un conseil chiffré (1.67 : 76 à 92 %) ; sauts ≥ 20 points à ±5 ml dans le verre ≤ 0,5 % (0,6 → 0,4 %).

## 9 quater. Données et stockage (1.65, inspiré d'ASCEN)

- **Tout reste sur l'appareil** : `save()` (`v169.js`) écrit `localStorage` puis une copie **gzip dans IndexedDB** (`zeste`/`state`, au plus toutes les 3 s, immédiatement à `pagehide` et quand l'app passe en arrière-plan). Au lancement, `zidbRecover` reprend la copie si `localStorage` est vide ou plus ancien (plein, vidé) ; sinon il la crée. Stockage plein : un seul toast.
- **Données illisibles** : `loadLocal` (`ui.js`) les met de côté (`zeste.v1.illisible.<date>`) au lieu de les écraser.
- **Stockage protégé** : `navigator.storage.persist()` demandé au lancement (accordé surtout à l'app installée ; Safari efface un site non installé après 7 jours sans visite).
- **Sauvegardes** : `exportData` → `downloads` sur claude.ai, sinon partage de fichier (Fichiers, iCloud), sinon téléchargement, sinon texte ; date dans `S.backupT` (« jamais » en orange dès 5 notes ou verres, et après 21 jours).
- **Écrans** : Paramètres › Données et sauvegarde (Faire / Restaurer / Espace de stockage / Tout réinitialiser) ; « Espace de stockage » : taille sur ~5 Mo, copie de secours, total de l'appareil (`storage.estimate`), protection. Test : `storage_test.js`.

## 10. Vérification des recettes, reste à faire

1. **Recettes non classiques (hors `c:1`) : vérifiées en 1.68.** Les 64 recettes ont chacune une source et un verdict dans `data/verif.json` : 40 conformes (≤ 25 % d'écart avec au moins une source), 6 corrigées (Cadillac Margarita, Cardinal, Bay Breeze, Spritz passion, Colada au Malibu, « Chindon » introuvable → « Suze pamplemousse »), 18 boissons maison plausibles sans recette de référence unique. Les 13 recettes ajoutées en 1.68 y sont aussi, avec leur source ; l'Oaxaca Old Fashioned est repassé à la tequila reposado de la recette de Phil Ward.
2. Les 33 créations suisses (`cr:1`) restent « à tester » : ne jamais les présenter comme traditionnelles.
3. **Audit automatique** (`tests/recaudit.js`, dans `all.sh`) : liens de variantes, ingrédients, doublons, unités, quantités, drapeau sans alcool (bloquants) ; débordement du verre et note du Labo < 70 (listés). Exception justifiée : les 45 ml d'Angostura du Trinidad Sour.
4. **Limites connues du Labo**, listées par l'audit et non corrigées :
   - environ 80 recettes « débordent » de 1 à 15 % : marge du modèle de glace et de dilution (Gin tonic : 107 %) ;
   - les tiki sur glace pilée (Zombie, Painkiller…) et les shots qui se boivent en plusieurs verres (Kamikaze, Pickleback) dépassent nettement, faute de grand mug tiki dans les verres du Labo ;
   - les highballs secs, sans sucre (Whisky highball, Gin rickey, Ranch water), sont notés 39 : les plages du style « long » viennent de recettes surtout sucrées. À reprendre dans un prochain lot.

## 11. Autres chantiers proposés

1. **Tests sur un vrai iPhone** (WebKitGTK n’est pas iOS Safari) : haptique, glissé « Finie », barre Servir collante, segments.
2. **Migrer les autres écrans** (Aujourd’hui, Cocktails, Profil, feuilles) vers les jetons `--z-*` et le cap design.
3. **Liste de courses** exportable : bouteilles vides et achats malins.
4. **Carte recette à partager** (image), en réutilisant le principe du Rewind (SVG vers canvas vers PNG).
5. Essai réel avec VoiceOver sur iPhone.

## 12. Méthode de travail attendue

- Lire le code concerné, **y compris les redéfinitions** dans les modules suivants, avant de modifier.
- Faire un changement à la fois, reconstruire (`sh build.sh`), lancer `node tests/v.js` et `python3 tests/fuzz.py`, puis vérifier visuellement avec Playwright (captures).
- Pour toute donnée de cocktail : citer la source (IBA de préférence) dans ton compte rendu à YaYa.
- Pour tout changement du modèle de recommandation : mesurer avec `tests/m3.js` et `tests/m5.js`, puis régler sur une graine et valider sur une autre (`SEED=…`) pour éviter le sur-ajustement.
- À la fin de chaque livraison : incrémenter `APP_VERSION` et `CACHE` (`sw.js`), lancer `sh tests/all.sh`, commit sur la branche de travail, fusion dans `main`, republication de l’artefact, et expliquer à YaYa ce qui a changé, ce qui a été vérifié, et les limites.
