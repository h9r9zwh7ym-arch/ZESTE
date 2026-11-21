# Review complète de Zeste — phases 1 et 2 (cartographie et audit)

- **Branche** : `review-complete` · **point de retour** : tag `avant-review` (commit `cd79588`, version **1.86**).
- **Consigne** : [`PROMPT-REVIEW.md`](PROMPT-REVIEW.md).
- **Cette session** : phases 1 et 2 seulement. **Aucun fichier de l'app n'a été modifié.** Les mesures ont été prises sur une copie du projet (dossier temporaire).
- **Ajouté au dépôt** : ce rapport ; `review/captures/avant/` (96 captures, état actuel) ; `review/mesures_avant_*` (mesures brutes) ; `review/outils/` (scripts d'audit, pour refaire exactement les mêmes mesures « après » en phase 4).

## Résumé

Zeste est solide : la suite de tests existante passe, aucune erreur JavaScript n'apparaît sur les 5 onglets et les feuilles principales, en clair comme en sombre, à 390×844 comme à 375×667. Les 102 recettes IBA sont conformes, la performance est bonne, et les noms saisis sont bien échappés (pas de faille XSS par la saisie). Je n'ai trouvé **aucun problème critique**, c'est-à-dire aucune perte de données ni aucun plantage en usage normal.

Ce qu'il faut corriger en priorité (**15 problèmes importants** distincts, plus une trentaine de mineurs) :

1. **Données.**
   - La restauration d'une sauvegarde perd une partie des données : le compteur de créations, les accords mets explorés, le nombre de verres pour l'alcoolémie, etc.
   - Le format de stockage n'a pas de version, donc aucune migration propre n'est possible.
   - Au chargement, l'app supprime en silence tout ce qui renvoie à une recette ou un ingrédient inconnu. Une future mise à jour qui renomme un identifiant effacerait donc de l'historique.
2. **Trophées.**
   - Les trophées à paliers peuvent redescendre (« Cave bien garnie » quand on vide des bouteilles).
   - « Un cocktail de chaque famille » se débloque à 8 familles, alors qu'il y en a 10.
3. **Tes exigences de design non tenues.**
   - Le réglage « Retour haptique » n'existe pas.
   - Quatre validations n'ont pas de « tac » : préparation lancée, note depuis l'accueil, « C'est prêt », création enregistrée.
   - 9 textes disent encore quoi faire (« Touche pour continuer »…).
   - Plusieurs zones tactiles font moins de 44 px : segments, chips des filtres, boutons fermer, « Passer ».
4. **Recettes et infos.**
   - 169 recettes classiques hors IBA n'ont aucune source enregistrée.
   - 1 erreur d'histoire est quasi certaine : le Corpse Reviver, dont la citation est inversée.
   - 1 attribution est probablement confondue : l'Illegal.
   - 12 histoires sont à vérifier.
   - Le sirop de sureau maison compte comme « en stock » 180 jours, alors que la fiche technique dit « un mois une fois ouvert ».
   - Il manque des substituts évidents : bourbon ↔ rye, champagne ↔ prosecco, etc. Le bar dit alors « il manque » à tort.

---

## Phase 1 — Cartographie (10 lignes)

1. **Architecture** : un seul fichier HTML hors ligne (`dist/zeste.html`, copié en `index.html`), en JS vanilla sans dépendance. `build.sh` le construit en concaténant 83 modules dans l'ordre de `src/ORDRE` : données, puis socle, puis 61 modules de version, puis le démarrage `ui_final.js`. S'y ajoutent un service worker « cache d'abord » (`sw.js`, `v130.js`) et les polices et icônes intégrées en base64.
2. **Convention** : chaque version enveloppe les fonctions précédentes (`const _f=f; f=function(){…_f()…}`), souvent en retouchant le HTML produit par des expressions régulières (176 enveloppes, 70 retouches de HTML). Les actions passent par `data-a` et le dictionnaire `ACT`.
3. **Données** : 382 recettes (`REC_RAW`), 181 ingrédients (`ING_RAW`), techniques et préparations du Labo (`TECH`, `PREP_TPL`), saisons, accords mets et occasions, dans `src/donnees/`. `buildRecipes()` les compile en `RECS` et `RMAP`.
4. **État** : un objet global `S`, sauvegardé en JSON dans `localStorage["zeste.v1"]` par `save()`. Une copie gzip va dans IndexedDB (au plus toutes les 3 s, et aussitôt quand l'app passe en arrière-plan). `healState()` et `fixState()` réparent l'état au chargement.
5. **Contenu de `S`** : `stock` (niveaux 0–4 ; 0/1 pour les softs), `ratings`, `rt`, `notes`, `hist` (`{id,t,m?,v?}`), `fav`, `custom` (créations), `preps`, `mix` (Labo), `tro`/`troT`/`tierSeen` (trophées), `adj` (« Ta version »), `settings`, plus les signaux de goût (`sig`, `duels`, `opens`, `skips`…).
6. **Écrans** : 5 onglets sans glissé entre eux.
   - Aujourd'hui : suggestion du soir, « Aussi pour toi », « À découvrir », alcoolémie.
   - Cocktails : recherche, segments Tous/Faisables/Favoris, filtres, Radar, Lignées, Monde.
   - Bar : faisables, « à racheter », meilleur achat, inventaire par catégorie.
   - Labo : Composer, Fait maison.
   - Profil : goût, trophées, créations, carnet, récaps.
7. **Feuilles** : fiche recette, fiche bouteille, niveau de bouteille, ajout de bouteilles, filtres, Paramètres (en groupes), trophée, préparation, plus les plein écran : mode préparation, roulette, Rewind, carte du monde.
8. **Flux « ce soir »** : à l'ouverture, la suggestion du soir est déjà affichée (`tonight()` : faisables, triés par le modèle de goût) ; une touche sur « Préparer » lance le pas-à-pas, et « C'est prêt » ajoute l'entrée à `hist` et propose une note.
9. **Flux « stock »** : dans Bar, toucher la fraction ouvre la feuille de niveau (`lvlset`), ou on glisse sur la jauge. « Vide » envoie la bouteille dans « À racheter ». `status(r)` dit si une recette est faisable, d'après `has()` (niveau > 0, basiques, préparations actives, `subs`).
10. **Progression** : `checkTrophies()` est appelée à chaque `changed()`. Il y a 55 trophées : 4 à paliers et les autres classiques, dont des secrets. L'export JSON se fait par `exportData` (partage ou téléchargement), et l'import par `sanitizeBackup` puis une feuille de confirmation.

---

## Méthode de l'audit et état de départ

- **Lecture** : `HANDOFF.md`, `CARTE.md`, le socle (`core.js`, `ui.js`, `ui_final.js`, `trophies.js`, `labo2.js`) et les modules de stockage, d'import, d'haptique, de trophées et de bar, avec leurs enveloppes. Toutes les recettes, histoires, techniques et préparations du Labo ont été extraites et relues.
- **Suite existante** (`tests/all.sh` sur une copie) : tout passe. Ce sont les données, IBA (102/102 conformes), la cohérence (5 points, voir REC-5), les formules, l'allègement, les enveloppes, ESLint, l'audit des recettes, la prédiction, le score du Labo, les 382 fiches dans Chromium (0 erreur), le contraste (12/12 vues), VoiceOver (6/6) et les 55 tests de fonctionnalités. Deux étapes n'ont pas pu tourner ici :
  - **WebKit n'est pas installé** : test sauté.
  - **Le fuzz n'a pas pu se lancer** : `fuzz.py` demande Python ≥ 3.12 avec Playwright, alors que cet environnement a Python 3.11 sans Playwright. C'est une limite de l'outillage, pas un défaut de l'app. À installer pour la phase 4.
- **Audit UI** (`review/outils/audit_ui.js`, Chromium sans écran, `isMobile`, tactile) :
  - tailles 390×844 (clair et sombre) et 375×667 ;
  - états : première ouverture (vide), bar presque vide (gin et tonic), bar très rempli (40 bouteilles, 1 an d'historique, 20 notes) ;
  - mesures sur 13 à 14 écrans par état : cibles tactiles (zone de toucher réelle, mesurée par un test d'impact à ±22 px), tailles de texte affichées, champs < 16 px, textes d'instruction, usage de l'accent, marges, défilement horizontal.
- **Sondes ciblées** (`review/outils/*.js`) :
  - aller-retour export → import ;
  - changement d'heure (fuseau Europe/Zurich, horloge simulée) ;
  - textes d'instruction dans les écrans secondaires ;
  - performance (processeur ralenti ×4).

### Mesures de départ (référence pour la phase 4)

| Mesure | Valeur (1.86) |
|---|---|
| Fichier livré | 1 037 Ko (371 Ko gzip) : JS 758 Ko, CSS 263 Ko, polices et icônes 102 Ko |
| Démarrage, CPU ×4, bar vide | fin du script 479–563 ms, premier affichage 576–712 ms, tâche longue 351–396 ms |
| Démarrage, CPU ×4, 1 an de données (730 verres) | fin du script 552–681 ms, premier affichage 644–840 ms, tâche longue 412–522 ms |
| Rendu des onglets (CPU ×4, 1 an) | Aujourd'hui 59 ms · Cocktails 131 ms · Bar 52 ms · Labo 29 ms · Profil 29 ms |
| Ouverture de la fiche Negroni (CPU ×4) | 110–227 ms (l'interaction la plus lente) |
| Recherche (CPU ×4, base complète) | 3 à 41 ms par frappe, plus 70 ms d'anti-rebond ; liste complète 87 ms |
| `save()` avec 1 an de données | 2 ms (28 Ko de JSON) |
| Écouteurs sur `document` après 20 changements d'onglet | 58 → 58 (aucune fuite) |
| Erreurs JS (tous écrans audités) | 0 |
| Défilement horizontal | aucun écran |
| Champs de saisie < 16 px (zoom involontaire) | aucun |

---

## Phase 2 — Audit

Gravité : **critique** = perte de données ou plantage · **important** = mauvais comportement fréquent, ou exigence explicite non tenue · **mineur** = rare, cosmétique ou sans effet visible. « Comportement » : ✱ = la correction change le comportement d'une fonctionnalité (à noter dans le journal des changements).

### Axe 1 — UI et ergonomie

| # | Gravité | Où | Problème (pourquoi) | Correction prévue |
|---|---|---|---|---|
| UI-1 | important | `versions/v144.js` (haptique), Paramètres (`ui_final.js:100`, `v137.js:109` `SET_GROUPS`) | **Le réglage « Retour haptique » n'existe pas** (HANDOFF § 8 le confirme). L'haptique est toujours active, sans moyen de la couper. | Ajouter un interrupteur « Retour haptique » dans Paramètres › Sons, réglage `S.settings.haptic`, actif par défaut (pas de migration nécessaire). Coupé, les actions restent des boutons, sans switch caché. Test : action déclenchée une seule fois dans les deux modes. ✱ |
| UI-2 | important | `versions/v144.js:6` (`HAPTIC`) | **Validations sans « tac »** : `startprep` (préparation lancée), `remind` (note depuis la carte « Alors, ce … ? »), `bmfinish` (« C'est prêt »), `savemix` (création enregistrée). Ta règle demande un tac sur niveau, note, testé et préparation. | Ajouter ces actions à `HAPTIC`, en vérifiant qu'un seul tac part par action (pas de label imbriqué). |
| UI-3 | important | `style.css:100` (`.seg button` 30 px), `:97` (`.chip` 32 px), `:192/911` (`.close-x` 32 px), `.link`, `.list-h.cat-h`, `.price-in`, `[data-a=mult]` | **Zones tactiles < 44 px** (mesurées par test d'impact) : segments Liste/Radar/…, Tous/Faisables, Composer/Fait maison, glace, contenance et tri (zone de 40 px de haut) ; chips des filtres et classiques du Labo (zone de 28 px) ; Fermer et Partager (40×40) ; − / + verres (40×36) ; « Passer » au premier lancement (40×20) ; « Réinitialiser » des filtres (20 px) ; en-tête de catégorie repliable du Bar (20 px) ; champ prix (32 px). | Agrandir la zone de toucher par `::after` à 44 px sans changer le dessin (méthode de la 1.57), puis revérifier avec le même script. |
| UI-4 | important | `trophies.js:71`, `v117.js:72`, `v167.js:10`, `ui.js:135`, `ui.js:464`, `ui.js:509`, `ui.js:533`, `ui10.js:75`, `ui_final.js:12` | **Textes qui disent quoi faire**, vus à l'écran :<br>• « Touche pour continuer » (trophée or ou platine)<br>• « Glisse pour te déplacer, pince pour zoomer, touche une ville » (carte)<br>• « Ajoute un second ingrédient » (Labo)<br>• « Essaie d'enlever un filtre… » (recherche vide)<br>• « choisis un niveau pour l'ajouter » (fiche bouteille)<br>• « Touche ce que tu as… » (ajout rapide)<br>• « Donne un nom à ta création… »<br>• « Choisis les sections et leur ordre… »<br>• « Tire l'accueil vers le bas… » (réglage des animations) | Retirer ces phrases ou les remplacer par un indice visuel (fermeture au toucher sans légende, poignée ou pictogramme, état vide avec bouton d'action). `ui10.js:176` (« Appuie longuement sur l'image ») est un dernier recours quand le partage n'existe pas : je le garde, avec un pictogramme. |
| UI-5 | mineur | `style.css:152/157` (étoiles), pastille « Noté 5 sur 5 », « Voir la recette », « Tout voir », « 89 % », « cocktails faisables », « Racheté », « Je l'ai fait » | **L'accent sert hors action principale et état actif** : étoiles, pastilles, boutons secondaires et liens « Tout voir ». | Passer ces éléments en neutre (`--label` / `--label2`) ; l'accent reste sur l'action principale (Préparer, Afficher N cocktails, OK) et les états actifs. |
| UI-6 | mineur | feuille Filtres (`ui.js:161`, `v117.js` `CTYPES`) | **Information répétée** : « Sans alcool » est à la fois dans Style et dans Famille. | N'en garder qu'un (Style). |
| UI-7 | mineur | feuilles Filtres et Ajout (`.sheet-body` : chips à x = 16) | **Marge latérale de 16 px**, au lieu de 20. | Aligner sur `--z-side`. |
| UI-8 | mineur | fiche bouteille (15 et 28 px), premier lancement (15 px) ; `font-size:calc(15rem/17)` ×12, `14rem` ×7 en ligne dans le JS | **Plus de 3 tailles de texte** sur ces écrans (ailleurs : 13 / 16 / 22, plus le titre de 34 : conforme). | Ramener les tailles écrites en ligne sur `--z-fs-*`. |
| UI-9 | mineur | styles en ligne du JS (`margin-top:6px` ×6, `18px` ×2, `4px`…) | **Espacements hors de la grille de 8 px**. | Passer aux jetons `--z-s*`. |
| UI-10 | mineur | `ui.js:135` | **Recherche sans résultat** : une phrase, mais aucune action. | Bouton « Effacer la recherche », et « Retirer les filtres » s'il y en a. |
| UI-11 | mineur | `ui.js:700` (`adjreset`) | **« Réinitialiser » Ta version** efface sans « Annuler ». | Toast avec « Annuler » (comme les autres suppressions). |
| UI-12 | mineur | tout l'app (aucun `visualViewport` pour le clavier) | **Clavier ouvert** : rien n'adapte la barre « Servir » collée ni la saisie des quantités du Labo. Pas vérifiable sans iPhone. | À tester sur iPhone (liste plus bas) ; corriger seulement si le problème est constaté. |
| UI-13 | mineur | fiche recette d'un cocktail déjà noté | **« 3 % pour toi » affiché à côté de « Fait 13 fois »** sur un cocktail que tu as noté 1 étoile : la prédiction s'affiche alors que ta note existe. | Montrer ta note à la place du pourcentage quand la recette est notée. ✱ |

Points conformes : pas de glissé entre onglets ; segments iOS (pastille claire sans bordure) ; chips sélectionnées avec bordure d'accent ; contrastes ≥ 4,5:1 (12 vues) ; mode sombre complet ; « Réduire les animations » respecté (`FX()`, 15 règles CSS, test `reduced_test`) ; champs ≥ 16 px ; zones sûres (`env(safe-area-inset-*)` : 43 usages) ; suppressions avec « Annuler » (bouteille retirée, création, préparation, ingrédient du Labo, note, boisson) ; « Tout réinitialiser » confirmé.

### Axe 2 — Exactitude des recettes et des infos

| # | Gravité | Où | Problème | Correction prévue |
|---|---|---|---|---|
| REC-1 | important | `data/verif.json`, `data/ibareport.json` | **169 recettes classiques (`c:1`) hors IBA sans source enregistrée** (liste en annexe A). Les 102 IBA et les 78 non classiques ont une source ; ces 169-là n'en ont aucune dans le dépôt (HANDOFF dit « vérifiées en 1.22 », sans trace). | Phase 3 : vérification en ligne (IBA, puis Difford's Guide, PUNCH, Savoy, Death & Co, sites de marque), en consignant la source dans `data/verif.json`. Je ne corrige qu'avec une source ; sinon la recette va en « à vérifier ». |
| REC-2 | important | `donnees/data_rec.js:20` (Corpse Reviver n° 2) | **Citation inversée** : l'app dit qu'en boire quatre « ranimerait le cadavre… aussitôt ». Craddock écrit le contraire : quatre bus d'affilée « dé-raniment » le cadavre. | Corriger après vérification sur le texte du Savoy (1930). |
| REC-3 | important | `donnees/data_iba.js:33` (Illegal) | **Attribution probablement confondue** : l'Illegal est attribué à Samuele Ambrosi, qui est le créateur du **Vento** (même fichier, ligne 39). | Vérifier sur la page IBA de l'Illegal, puis corriger ou retirer l'attribution. |
| REC-4 | mineur | voir annexe B | **12 histoires à vérifier** (dates ou anecdotes douteuses). | Vérification en ligne ; formulation prudente ou retrait si rien n'est trouvé. |
| REC-5 | mineur | `data_more.js:73` (Kamikaze), `data_118.js:4` (Fitzgerald), `data_more2.js:43` (Rum Swizzle), `data_iba.js:32` (IBA Tiki), `data_rec.js:58` (White Negroni) | **Incohérences internes** :<br>• Kamikaze : 95 ml dans un verre à shot de 50 ml.<br>• Fitzgerald : verre à old fashioned sans glace (« rocks, none »).<br>• Rum Swizzle et IBA Tiki : 307 et 322 ml dans un highball d'environ 190 ml.<br>• White Negroni : parts égales, alors que la recette de Wayne Collins est donnée 45 / 30 / 22,5.<br>Martini et Gibson ont des ingrédients identiques, mais c'est voulu (la différence est la garniture). | Vérifier chaque point avec une source, puis corriger le verre, la glace ou les doses. Kamikaze : coupe, ou « pour 2 shots ». |
| REC-6 | important | `donnees/data_ing.js` (champ `subs`) | **Substituts manquants, donc faux « il manque »** : bourbon ↔ rye, Tennessee → bourbon, scotch tourbé → scotch, rhums ambré / brun / jamaïcain entre eux, champagne ↔ prosecco ou crémant, ginger ale ↔ ginger beer. Aucun substitut non plus pour l'allspice dram ni la crème de violette. Exemple : avec du prosecco seulement, le French 75 et le Kir royal affichent « manque champagne », sans « avec prosecco à la place ». | Ajouter ces `subs` (substitutions courantes en bar, sourcées). Cela n'agit que sur « Il manque une chose » et l'indication « avec X à la place » : une recette ne devient jamais « faisable » grâce à un substitut. ✱ |
| REC-7 | mineur | `data_ing.js` (allspice, violette, falernum, cordial de camomille, jus de canne, Old Tom) | **Ingrédients difficiles à trouver en Suisse**. La plupart ont déjà une piste (maison, caviste, substitut). Manquent : allspice dram (caviste spécialisé ; substitut : quelques gouttes d'Angostura et de sirop de cannelle) et crème de violette (caviste ; sinon Casino, qui est l'Aviation sans violette). | Compléter les conseils (`tip`) avec ces pistes. |
| REC-8 | important | `donnees/data_lab.js:51` (`PREP_TPL` sureau = 180 j) et `:16` (technique) | **Sécurité alimentaire, contradiction interne** : la technique dit « plusieurs mois fermé, un mois une fois ouvert, au frigo », mais une préparation de sirop de sureau compte comme « en stock » 180 jours. | Ramener à 30 jours ; la durée reste réglable (`preplife`). ✱ |
| REC-9 | mineur | `data_lab.js` (technique « Dry shake ») | **Blanc d'œuf cru** : aucune mention des œufs très frais, ni du blanc pasteurisé pour les personnes à risque. | Ajouter une ligne (source : recommandations de sécurité alimentaire, OSAV). |
| REC-10 | mineur | `donnees/data_more.js` (`BASICS`) | **Faux positifs « faisable »** : menthe, basilic, concombre, espresso, crème, lait et blanc d'œuf comptent comme toujours disponibles, donc le Mojito ou le Gin Basil Smash sont « faisables » sans menthe ni basilic. C'est un choix assumé (désactivable dans « Basiques »). | À décider avec toi : herbes et concombre hors des basiques par défaut pour les nouveaux utilisateurs ? Sinon, je ne touche à rien. ✱ |

Les autres conseils du Labo (sirops, orgeat, oleo, cordial, infusions, fat-washing, milk punch, shrub, falernum) ont des durées prudentes et cohérentes entre la technique et la préparation.

### Axe 3 — Fiabilité des données et de la logique

| # | Gravité | Où | Problème | Correction prévue |
|---|---|---|---|---|
| DATA-1 | important | `versions/v120.js:13-28` (`sanitizeBackup`) | **La restauration d'une sauvegarde est incomplète** (vérifié par un aller-retour export → import). Elle perd :<br>• `labSaved` (remis à 0 : progression de « Créateur ») ;<br>• `dishes` (tableau traité comme un objet : les accords explorés pour « Fin gourmet » sont perdus) ;<br>• `hist[].m` et `hist[].v` (nombre de verres et « ta version » pour l'alcoolémie de la 1.76) ;<br>• `snooze`, `chalOn` (défi actif), `quizIntro`, `secondChance`, `fate`, `bubbleSaved`, `backupT`. | Liste complète des champs, avec leur type ; garder `m` et `v`. Test d'aller-retour : tout `S` exporté doit revenir à l'identique. |
| DATA-2 | important | `ui.js:4` (`DEF`, `v:1`), `ui_final.js:19-21` (`migrateIds`), `v120.js`, `v142.js:5`… | **Pas de schéma versionné** : `S.v` vaut 1 depuis toujours, les migrations sont dispersées et sans numéro, et l'export ne porte ni marque de l'app ni version de format. C'est le préalable de ta règle 3. | Table de migrations numérotées (`S.v` 1 → 2) appliquée au chargement et à l'import. L'export porte `app:"zeste"` et `format`. Tests sur des données d'exemple de l'ancien format (1.2x, 1.65, 1.86). |
| DATA-3 | important | `ui_final.js:31-41` (`healState`) | **Perte silencieuse au chargement** : historique d'une recette inconnue, stock d'un ingrédient inconnu, création dont un ingrédient n'existe plus. Tout cela est supprimé puis réenregistré au premier `save()`. Aujourd'hui ces cas n'arrivent pas, mais une future version qui renomme un identifiant sans alias effacerait l'historique, sans retour possible. | Ne plus jeter : mettre de côté (`S.orphans`), ignorer à l'usage, et le reprendre si l'identifiant revient. |
| DATA-4 | important | `versions/v126.js:51` (`tierTile`, `tierInfo`) | **Les trophées à paliers redescendent** : le palier affiché est recalculé en direct. « Cave bien garnie » repasse d'Argent à Bronze, voire à verrouillé, quand on vide des bouteilles. Le compteur « N sur M » et « Vitrine pleine » baissent aussi. Or `S.tierSeen` garde déjà le meilleur palier atteint. | Palier affiché et compté = maximum de `tierSeen` et du palier actuel. ✱ |
| DATA-5 | important | `ui.js:320` (`fam`), `trophies.js:36` (`allfam`) | **« Tour des familles — Un cocktail de chaque famille » se débloque à 8 familles**, alors que `FAMILIES` en compte 10 (Shots et Sans alcool ajoutés). Le Profil affiche « Familles explorées 0 sur 10 », mais le trophée affiche « 0 / 8 ». « Tour complet » (`allfam`) fait double emploi (10 familles). | Libellé exact (« 8 familles sur 10 ») sans changer le seuil, pour ne retirer aucun trophée déjà gagné. |
| DATA-6 | mineur | `ui.js:68` (`rel`) | **Changement d'heure** (vérifié, fuseau Europe/Zurich) : le lundi après le passage à l'heure d'été, un verre du dimanche est daté « Aujourd'hui », et le mardi « Hier » au lieu d'« Il y a 2 jours ». Toute la semaine suivante a un jour d'écart, parce que le calcul arrondit à l'inférieur sur une journée de 23 h. | Arrondir (`Math.round`) ; test aux deux changements d'heure. |
| DATA-7 | mineur | `core.js:130-131` (`has`) | Pour les catégories sans niveaux (jus, softs, frais), une bouteille n'est « présente » que si son niveau vaut **exactement** 1. Une valeur de 2 à 4 (import, ou catégorie changée d'une version à l'autre) la rend absente. | `> 0` pour toutes les catégories. |
| DATA-8 | mineur | `ui.js:417` (`opens`), `ui10.js:49` (`heroLog`) | **Écritures directes dans `localStorage`**, hors `save()` : pas de `SREV++` ni de copie de secours, et 28 Ko réécrits à chaque ouverture de fiche. | Passer par un enregistrement différé commun. |
| DATA-9 | mineur | `v120.js:13` | L'import accepte **n'importe quel JSON contenant un objet `stock`** (ex. `{"stock":{}}`), qui remplace tout après confirmation (« 0 bouteille, 0 note… »). | Exiger la marque Zeste, ou au moins un champ reconnu ; message clair sinon. |
| DATA-10 | mineur | `v120.js:23`, `ui.js:34` | Les **identifiants et couleurs des créations ne sont pas validés à l'import** : `data-id="${r.id}"` et `style="--c:${r.col}"` sont écrits sans échappement. Un fichier forgé pourrait injecter un attribut. La saisie, elle, est bien échappée (`esc`, test `inject_test`). | Valider à l'import : `id` doit respecter `^[\w-]{1,40}$` et la couleur `^#[0-9a-f]{6}$`. |
| DATA-11 | mineur | `ui.js:628` (`made` + « Annuler ») | « Annuler » sur « Je l'ai fait » retire le verre, mais **pas le trophée** qu'il venait de débloquer. | Revérifier les trophées débloqués dans les 5 dernières secondes. |
| DATA-12 | mineur | stockage | **Deux onglets ouverts** : le dernier qui écrit gagne, car rien n'écoute l'événement `storage`. Rare sur iPhone (Safari et l'app installée ont des stockages séparés). | Écouter `storage` : recharger l'état, ou prévenir. |
| DATA-13 | mineur | `ui.js:668` (`savemix`) | **Créations au nom en double** (« Negroni » possible). | Avertir et proposer « Negroni (2) ». |

Points conformes : données illisibles mises de côté, jamais écrasées ; copie de secours IndexedDB reprise si `localStorage` est vidé ou plein (testé) ; stockage persistant demandé ; « vide = à racheter » ; calcul de « faisable » cohérent partout (bar et liste) ; trophées classiques jamais débloqués deux fois (`S.tro`) ; formules testées (dilution d'Arnold corrigée, Widmark).

### Axe 4 — Performance

| # | Gravité | Où | Problème | Correction prévue |
|---|---|---|---|---|
| PERF-1 | mineur | démarrage (`buildRecipes`, `computeZones`, rendu de l'accueil) | **Une tâche longue de 350 à 520 ms au démarrage** (CPU ×4, soit environ 90 à 130 ms sur un iPhone récent). Acceptable, mais tout le moteur est calculé avant le premier affichage. | Mesurer le détail. Différer ce qui ne sert qu'au Labo (zones de style) si le gain dépasse 50 ms (×4), mesures avant et après. |
| PERF-2 | mineur | `recSheet` et ses enveloppes | **Ouverture d'une fiche recette : 110 à 227 ms (×4)**, l'interaction la plus lente. | Profiler, puis corriger seulement si une cause précise ressort (ex. le dessin SVG recalculé). |
| PERF-3 | mineur | `style.css` (2 308 lignes, 263 Ko, 55 `!important`) | Les règles se superposent de version en version : du poids et une cascade difficile à faire évoluer. | Pas de refonte dans cette review (risque de régression visuelle) ; recommandation. |
| PERF-4 | mineur | `sw.js` (`CACHE`) | Le numéro de cache se change **à la main** à chaque version : l'oublier bloque les iPhone sur l'ancienne version. | `build.sh` peut écrire la version dans `sw.js`. |

Points conformes : recherche fluide (≤ 41 ms par frappe à ×4, anti-rebond, champ jamais recréé) ; aucune fuite d'écouteurs ; `save()` en 2 ms ; liste par paquets ; hors ligne assuré par le service worker.

### Axe 5 — Qualité du code

| # | Gravité | Où | Problème | Correction prévue |
|---|---|---|---|---|
| CODE-1 | important (structurel) | `src/versions/*` | **Empilement d'enveloppes** : `vCompose` passe par 21 étapes, `vBar` et `renderView` par 9, et il y a 70 retouches du HTML produit par des expressions régulières. Une retouche peut cesser de correspondre en silence (piège 19 du HANDOFF). | Pas de refonte gratuite. Chaque fonction que je modifie est corrigée **au bon étage**, sans nouvelle retouche par regex. La fusion écran par écran va dans les recommandations. |
| CODE-2 | mineur | `ui.js:680` (`confirm()` remplacé), `ui_final.js:110` (texte « se synchronisent avec ton compte », faux depuis la 1.65 et retiré à l'affichage par une regex de `v142.js:38`), `ui.js:10-11` (`pushRemote` et `initRemote` vides), `core.js:22` (`if(!("sucre" in ING)) {}`) | **Code mort ou trompeur**. | Retirer. |
| CODE-3 | mineur | 49 `catch(e){}` vides | Des erreurs avalées en silence ; la plupart sont légitimes (stockage, API absentes). | Revoir ceux qui touchent aux données (import, migration) pour afficher un message. |
| CODE-4 | mineur | `v183.js` (`GLASS_FIX`), `ui_final.js:19` (`ID_ALIAS`), extensions de `FAMILIES` dans les données | **Données dans le code** : corriger un verre de recette demande de modifier un module de version. | Remettre les verres dans les recettes (`src/donnees`), où on les corrige sans toucher à la logique. |
| CODE-5 | mineur | `zeste_projet/HANDOFF.md` | **Documentation en retard** sur le code : 369 recettes (382 en réalité), 164 ingrédients (181), 81 modules (83), 33 tests de fonctionnalités (55). | Mise à jour en fin de review (règle 6). |

Sécurité : aucune requête réseau dans l'app (hors service worker et API `claude` facultative) ; saisies échappées par `esc` ; seuls points faibles, l'import d'un fichier forgé (DATA-9 et DATA-10).

### Axe 6 — Suggestions et envie d'ouvrir l'app

| # | Gravité | Où | Constat | Correction prévue |
|---|---|---|---|---|
| SUG-1 | — | Aujourd'hui | **« Qu'est-ce que je fais ce soir ? »** : 0 touche, la suggestion faisable est à l'écran dès l'ouverture, puis **1 touche** pour la recette ou « Préparer ». Les suggestions tiennent compte des notes, des signaux (refaits, favoris, duels) et du stock, et elles sont variées (MMR, pénalité sur les 3 derniers). | Rien. |
| SUG-2 | — | Bar | **Changer un niveau** : 2 touches (fraction, puis niveau) ou un glissé sur la jauge. « Le meilleur achat » montre le gain (« Cognac : +6 cocktails, dont Sazerac et Sidecar »). | Rien. |
| SUG-3 | important | voir REC-6 | Faute de substituts, « Il manque une chose » sous-estime ce qui est presque faisable. | Voir REC-6. |
| SUG-4 | mineur | voir UI-13 | Le pourcentage « pour toi » sur un cocktail déjà noté brouille la lecture. | Voir UI-13. |
| SUG-5 | mineur | voir DATA-4 et DATA-5 | Des trophées qui régressent, ou dont le libellé est faux, découragent au lieu de motiver. | Voir DATA-4 et DATA-5. |
| SUG-6 | mineur | Labo | Avec un seul ingrédient, la note est remplacée par la phrase « Ajoute un second ingrédient » (UI-4). | Indice visuel : emplacement vide pour le second ingrédient. |

Le Labo (score expliqué, conseils chiffrés, défis de la semaine), les trophées (55, avec progression visible) et les récaps (mois, trimestre, Rewind) donnent de vraies raisons de revenir. Les idées nouvelles iront dans les recommandations du rapport final.

---

## Annexe A — 169 recettes classiques sans source enregistrée (à vérifier en phase 3)

amaretto_sour, gimlet, gold_rush, brown_derby, jack_rose, army_navy, ward8, blood_sand, siesta, division_bell, breakfast_martini, gin_tonic, tom_collins, kir_royal, hugo, sbagliato, old_pal, white_negroni, rob_roy, toronto, bijou, godfather, white_russian, kafi_luz, queens_park, gin_gin_mule, absinthe_frappe, hurricane, painkiller, el_diablo, screwdriver, salty_dog, death_afternoon, absinthe_louche, pegu_club, jasmine, industry_sour, air_mail, ti_punch, whiskey_smash, eastside, el_presidente, hotel_nacional, bacardi_cocktail, floradora, pink_lady, bronx, scofflaw, alexander, golden_cadillac, mudslide, b52, baby_guinness, kamikaze, carajillo, hot_toddy, grog, vin_chaud, eggnog, brandy_milk_punch, gibson, dirty_martini, fifty_fifty, black_manhattan, red_hook, greenpoint, bobby_burns, la_louisiane, improved_whiskey, monte_carlo, revolver, fanciulli, kingston_negroni, contessa, adonis, bamboo, alaska, widows_kiss, seelbach, pink_gin, twentieth_century, corpse_reviver1, algonquin, chrysanthemum, charlie_chaplin, bourbon_renewal, final_ward, midnight_stinger, matador, mexican_firing_squad, mamie_taylor, presbyterian, whisky_highball, tinto_verano, gespritzter, bucks_fizz, batanga, ranch_water, gin_rickey, cape_codder, harvey, pastis, mauresque, perroquet, tomate, panache, michelada, kalimotxo, stone_fence, gin_buck, sloe_gin_fizz, navy_grog, fog_cutter, scorpion, saturn, blue_lagoon, blue_hawaii, porto_tonic, sangria, bicicletta, lillet_tonic, vermouth_soda, chilcano, el_capitan, piscola, kafi_fertig, suze_tonic, suze_cassis, picon_biere, brooklyn, pimms_cup, lynchburg, jack_coke, cable_car, alabama_slammer, caffe_corretto, malibu_ananas, jagerbomb, woo_woo, fuzzy_navel, greyhound, rum_swizzle, kafi_trasch, nojito, shirley_temple, roy_rogers, virgin_mary, virgin_colada, arnold_palmer, cinderella, diabolo_grenadine, diabolo_menthe, spicy_margarita, rossini, daiquiri_fraise, lumumba, bombardino, snowball, schumli_pflumli, whisky_ginger, rum_punch, satans_whiskers, fitzgerald, corn_oil, affinity, japanese_cocktail, honeymoon, diamondback, cameron_kick.

Ma relecture n'y trouve pas d'erreur flagrante de proportions (en dehors de REC-5) ; pour plusieurs recettes, j'ai retrouvé de mémoire les doses de la recette d'origine (Division Bell, Siesta, Cameron's Kick, Saturn…). Mais **une recette sans source écrite reste à vérifier** : rien n'a été corrigé de mémoire.

## Annexe B — Histoires et infos à vérifier

| Recette | Fichier | Ce qui est douteux |
|---|---|---|
| Corpse Reviver n° 2 | `data_rec.js:20` | Citation inversée (voir REC-2) : Craddock dit que quatre d'affilée « dé-raniment » le cadavre. |
| Illegal | `data_iba.js:33` | Attribué à Samuele Ambrosi, créateur du Vento : confusion probable (REC-3). |
| Schümli Pflümli | `data_final.js:19` | « rendu célèbre par une chanson de Hazy Osterwald dans les années 1960 » : je ne trouve pas trace de cette chanson. |
| Honeymoon | `data_118.js:9` | « Un classique des années 1910… servi au Brown Derby » : le Brown Derby n'ouvre qu'en 1926. |
| Casino | `data_iba.js:29` | « en 1909 dans The Reminder de Jacob Didier » : source et date à confirmer. |
| Don's Special Daiquiri | `data_iba.js:30` | « dérivé de son Mona Daiquiri de 1934 » : nom et date à confirmer. |
| Godfather | `data_rec.js:76` | « le préféré de Marlon Brando » : affirmation publicitaire (Disaronno), non sourcée. |
| Mary Pickford | `data_more.js:59` | « en tournage à Cuba avec Douglas Fairbanks » : aucun tournage attesté ; anecdote contestée. |
| Panaché | `data_more.js:144` | « De l'autre côté de la Sarine, on dit plutôt Radler » : en Suisse alémanique, « Panaché » est le mot courant (Radler est allemand et autrichien). |
| Pastis | `data_more.js:140` | Étymologie « pastisson » : le provençal donne « pastis » (mélange) ; « pastisson » est à confirmer. |
| French 75 | `data_rec.js:50` | « Codifié au Harry's New York Bar vers 1915 » : première publication connue vers 1922–1927 ; date à nuancer. |
| Tuxedo | `data_more.js:81` | « vers 1880 au club de Tuxedo Park » : le club est fondé en 1886. |
| Eggnog | `data_more.js:78` | « George Washington avait sa propre recette » : recette largement citée, mais d'authenticité discutée. |
| Rabo de Galo | `data_more.js:169` | « né dans les années 1950 quand les marques de vermouth italiennes se sont installées au Brésil » : à confirmer. |

Recettes à vérifier pour leur cohérence : Kamikaze, Fitzgerald, Rum Swizzle, IBA Tiki, White Negroni (voir REC-5) ; Presbyterian (`data_final.js:22`), servi ici au bourbon, alors que la version courante est au scotch.

---

## Plan pour la phase 3 (en attente de ton feu vert)

Ordre : critique (aucun), puis important, puis mineur à faible risque. Un commit par thème :

1. **données** : DATA-2 (migrations versionnées, testées sur d'anciennes sauvegardes), puis DATA-1, DATA-3, DATA-4, DATA-5, DATA-6, DATA-7, DATA-8, DATA-9, DATA-10, DATA-11 ;
2. **UI** : UI-1 à UI-4, puis les mineurs UI-5 à UI-11 et UI-13 ;
3. **recettes** : vérification en ligne de REC-1 à REC-5 et de l'annexe B (source consignée dans `data/verif.json`), REC-6 à REC-9 ;
4. **perf** : PERF-1, PERF-2 et PERF-4, mesures avant et après ;
5. **code** : CODE-2, CODE-3 et CODE-4 ;
6. **suggestions** : SUG-6 (UI-13 est traité avec l'UI) ;

puis la relecture des régressions, la phase 4 avec les mêmes scripts (`review/outils/`), la version 1.87, le HANDOFF, et le rapport final.

**Décisions qui te reviennent avant la phase 3** :
- REC-10 : sortir menthe, basilic et concombre des basiques par défaut ?
- UI-13 : remplacer « % pour toi » par ta note sur les cocktails déjà notés ?

## À tester sur ton iPhone (liste provisoire, complétée en phase 5)

1. Le « tac » haptique sur chaque validation, et son absence quand le réglage est coupé.
2. Le clavier ouvert : recherche, prénom, quantité au Labo, nom d'une création. Aucun champ ne doit être caché par la barre « Servir » ni par la barre d'onglets.
3. Les zones sûres réelles (encoche et barre d'accueil), en portrait et en paysage.
4. L'import d'une sauvegarde depuis Fichiers et iCloud, et l'export par la feuille de partage.
5. Le glissé « Finie » et le glissé sur la jauge de niveau, au doigt.
6. « Réduire les animations » activé dans iOS.
7. Le mode sombre qui suit l'iPhone, et l'ambiance « bar tamisé » le soir.
8. L'app installée sur l'écran d'accueil : hors ligne, puis l'annonce « Nouvelle version prête ».
9. Les sons en mode silencieux, puis au retour dans l'app.
10. VoiceOver sur les 5 onglets.
