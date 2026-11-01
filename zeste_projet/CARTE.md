# Carte du code de Zeste

_Générée par `tools/carte.js` à partir des sources (ne pas modifier à la main)._

82 fichiers, chargés dans l’ordre de `src/ORDRE`. Chaque version ajoute un module qui enveloppe des fonctions existantes (`const _f=f; f=function(){ … _f() … }`) : pour comprendre un écran, suivre sa chaîne ci-dessous, de haut en bas.

## Écrans

### Aujourd’hui (`vToday`) — 3 étapes

1. `socle/ui10.js` déclare — V10
2. `versions/v124.js` enveloppe — ALCOOLÉMIE (indicative)
3. `versions/v138.js` enveloppe — ZESTE 1.38 : chaque chose à sa place

### Cocktails (`vCocktails`) — 1 étape

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE

### Bar (`vBar`) — 9 étapes

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE
2. `versions/v137.js` enveloppe — ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation
3. `versions/v138.js` enveloppe — ZESTE 1.38 : chaque chose à sa place
4. `versions/v139.js` enveloppe — ZESTE 1.39 : hiérarchie visuelle
5. `versions/v140.js` enveloppe — ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées
6. `versions/v142.js` enveloppe — ZESTE 1.42 : bar épuré, pictos du labo, Paramètres et À propos, nuit soignée
7. `versions/v143.js` enveloppe — ZESTE 1.43 : « bouteille finie » d'un glissé, catégories repliables
8. `versions/v147.js` enveloppe — ZESTE 1.47 : Bar et feuille de niveau — mise en page (rendu seulement)
9. `versions/v175.js` enveloppe — ZESTE 1.71 : « Mon bar » plus utile

### Labo (`vLabo`) — 2 étapes

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE
2. `versions/v138.js` remplace — ZESTE 1.38 : chaque chose à sa place

### Labo — Composer (`vCompose`) — 21 étapes

1. `socle/labo2.js` déclare — LABO V2 : le jeu du barman
2. `socle/chal.js` enveloppe — DÉFIS DU LABO
3. `versions/v117.js` enveloppe — ZESTE 1.17
4. `versions/v137.js` enveloppe — ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation
5. `versions/v139.js` enveloppe — ZESTE 1.39 : hiérarchie visuelle
6. `versions/v140.js` enveloppe — ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées
7. `versions/v141.js` enveloppe — ZESTE 1.41 : glace naturelle dans le labo, bar plus simple à lire
8. `versions/v142.js` enveloppe — ZESTE 1.42 : bar épuré, pictos du labo, Paramètres et À propos, nuit soignée
9. `versions/v146.js` enveloppe — ZESTE 1.46 : Labo (Composer) — hiérarchie et mise en page
10. `versions/v149.js` enveloppe — ZESTE 1.49 : Labo (Composer) — retouches visuelles (rendu seulement)
11. `versions/v150.js` enveloppe — ZESTE 1.50 : Labo (Composer) — débordement en un seul message, retouches (rendu seulement)
12. `versions/v154.js` enveloppe — ZESTE 1.54 : Labo — conseils, composition (rendu seulement)
13. `versions/v156.js` enveloppe — ZESTE 1.56 : Labo — contenance des verres réglable
14. `versions/v159.js` enveloppe — ZESTE 1.58 : décisions de l'audit 1.57
15. `versions/v165.js` enveloppe — 1.61 (B) : score du Labo
16. `versions/v166.js` enveloppe — 1.62 (B) : barème du Labo v3
17. `versions/v167.js` enveloppe — 1.62 (C) : affichage du score du Labo
18. `versions/v167.js` enveloppe — 1.62 (C) : affichage du score du Labo
19. `versions/v168.js` enveloppe — ZESTE 1.63 : Labo — « Autre » sous 10 cl, « + » sans son, quantité au clavier
20. `versions/v171.js` enveloppe — ZESTE 1.67 : Labo — conseils vérifiés par la note ; plafonds adoucis ; prédiction — créations enregistrées
21. `versions/v173.js` enveloppe — ZESTE 1.69 : Labo — conseil de méthode (construit, verre à mélange, shaker)

### Profil (`vProfil`) — 8 étapes

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE
2. `versions/v137.js` enveloppe — ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation
3. `versions/v138.js` enveloppe — ZESTE 1.38 : chaque chose à sa place
4. `versions/v139.js` enveloppe — ZESTE 1.39 : hiérarchie visuelle
5. `versions/v140.js` enveloppe — ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées
6. `versions/v151.js` enveloppe — ZESTE 1.51 : Profil — l'engrenage du haut suffit (rendu seulement)
7. `versions/v163.js` enveloppe — ZESTE 1.60 (B) : intelligence — duels de goût, signaux implicites, recherche en langage courant, précision mesurée
8. `versions/v170.js` enveloppe — ---------- 1.66 : Profil > « Mes créations » (tous les cocktails créés dans le Labo, du plus récent au plus ancien) ----------

### Fiche recette (`recSheet`) — 6 étapes

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE
2. `versions/v120.js` enveloppe — ZESTE 1.20
3. `versions/v140.js` enveloppe — ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées
4. `versions/v176.js` enveloppe — ZESTE 1.72 : carte recette à partager
5. `versions/v177.js` enveloppe — ZESTE 1.73 : saisons et événements
6. `versions/v180.js` enveloppe — ZESTE 1.76 : alcoolémie juste

### Fiche bouteille (`ingSheet`) — 3 étapes

1. `socle/ui.js` déclare — ÉTAT & SAUVEGARDE
2. `versions/v137.js` enveloppe — ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation
3. `versions/v175.js` enveloppe — ZESTE 1.71 : « Mon bar » plus utile

### Réglages (`settingsSheet`) — 5 étapes

1. `versions/v124.js` remplace — ALCOOLÉMIE (indicative)
2. `versions/v137.js` enveloppe — ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation
3. `versions/v142.js` enveloppe — ZESTE 1.42 : bar épuré, pictos du labo, Paramètres et À propos, nuit soignée
4. `versions/v158.js` enveloppe — ZESTE 1.56 (C) : Paramètres — « Sexe » sur une ligne
5. `socle/ui_final.js` déclare — VERSION FINALE

## Fonctions enveloppées le plus souvent

| Fonction | Étapes | Modules |
|---|---|---|
| `renderView` | 9 | ui.js → v140.js → v141.js → v143.js → v150.js → v160.js → v179.js → v187.js → v130.js |
| `switchTab` | 6 | ui.js → v140.js → v150.js → v179.js → ui_final.js → v130.js |
| `openServe` | 6 | labo2.js → chal.js → sound.js → v117.js → v167.js → v130.js |
| `trainSet` | 5 | core.js → v120.js → v163.js → v163.js → v171.js |
| `reasons` | 5 | core.js → v118.js → v161.js (remplace) → v163.js → v174.js |
| `stockRow` | 5 | ui.js → v141.js (remplace) → v143.js → v147.js → v175.js |
| `labScore` | 5 | labo2.js → v120.js → v165.js (remplace) → v166.js (remplace) → v171.js |
| `tonightRaw` | 4 | core.js → v120.js → v161.js (remplace) → v174.js |
| `filtered` | 4 | ui.js → v117.js → v163.js → v177.js |
| `openSheet` | 4 | ui.js → sound.js → v140.js → v152.js |
| `trophyGrid` | 4 | trophies.js → v120.js (remplace) → v137.js (remplace) → v126.js (remplace) |
| `sanitizeBackup` | 4 | v120.js → v156.js → v163.js → v163.js |
| `healState` | 4 | v156.js → v163.js → v163.js → ui_final.js |

## Modules

| Fichier | Lignes | Rôle | Touche |
|---|---|---|---|
| `donnees/data_ing.js` | 107 | ---------- INGRÉDIENTS ---------- |  |
| `donnees/data_rec.js` | 123 | ---------- RECETTES ---------- |  |
| `donnees/data_lab.js` | 87 | ---------- LABO : TECHNIQUES ---------- |  |
| `donnees/data_more.js` | 194 | ---------- EXTENSION DE LA BASE ---------- |  |
| `donnees/data_more2.js` | 59 | ---------- EXTENSION 2 : bouteilles de grande surface ---------- |  |
| `donnees/data_na.js` | 47 | ---------- SANS ALCOOL ---------- |  |
| `donnees/data_food.js` | 18 | ---------- ACCORDS METS ET COCKTAILS ---------- |  |
| `donnees/data_final.js` | 33 | ---------- EXTENSION FINALE ---------- |  |
| `donnees/data_118.js` | 19 | ---------- Recettes 1.18 ---------- |  |
| `donnees/data_world.js` | 3 | Contours des continents : Natural Earth (domaine public), projection équirectangulaire sim |  |
| `donnees/data_iba.js` | 39 | ---- v1.21 : alignement sur les recettes officielles de l’IBA (iba-world.com, relevé d’aoû |  |
| `donnees/data_softs.js` | 21 | ---------- SOFTS COURANTS EN SUISSE (1.55) ---------- |  |
| `donnees/data_drinks.js` | 54 | ---------- NOUVELLES BOISSONS (1.68) : tonics aromatisés, softs, sans alcool, alcools ---- |  |
| `socle/core.js` | 667 | MOTEUR |  |
| `socle/icons.js` | 112 | 1.30 : système d'icônes |  |
| `socle/ui.js` | 759 | ÉTAT & SAUVEGARDE |  |
| `socle/ui10.js` | 218 | V10 |  ; actions : homeedit, made, bmfinish |
| `socle/labo2.js` | 209 | LABO V2 : le jeu du barman |  ; actions : mixtype, mixserve, mixq, mixadd1, mixfix, mixadd, mixrm, tolab |
| `socle/trophies.js` | 91 | TROPHÉES : niveaux, médailles et célébrations |  ; actions : trophy, dish |
| `socle/explore.js` | 129 | EXPLORER : monde, lignées, radar, étagère |  ; actions : cmode2 |
| `socle/chal.js` | 65 | DÉFIS DU LABO | ~vCompose, ~openServe ; actions : chal |
| `socle/sound.js` | 115 | SONS 2.0 (synthétisés, aucun fichier) | ~openSheet, ~confetti, ~paintRL, ~showTrophy, ~rwShow, ~openServe ; actions : setsound, setfx, homeon, stepck, bmck, toggle, addtoggle, refill |
| `versions/v117.js` | 114 | ZESTE 1.17 | ~filtered, ~nFilters, ~openServe, ~vCompose ; actions : svgoal, mapfs, famgo, resetf |
| `versions/v118.js` | 51 | ZESTE 1.18 | ~reasons, ~logMade ; actions : lvl, setlvl, refill, toggle |
| `versions/v120.js` | 208 | ZESTE 1.20 | ~barMode, ~closeOverlay, ~pendingRatings, ~tonightRaw, ~recSheet, ~mfSelect, ~medal, ~trophySheet, ~labScore, ~labSummary ; actions : rwmonth, rate, bmfinish, lineage, cmode2, city, lvl, setlvl |
| `versions/v122.js` | 30 | 1.22 | ~applyTheme ; actions : settxt |
| `versions/v123.js` | 46 | OCCASIONS |  ; actions : occasion |
| `versions/v124.js` | 127 | ALCOOLÉMIE (indicative) | ~vToday, !settingsSheet ; actions : bacdetail, setsex |
| `versions/v125.js` | 11 | 1.27 : accueil du matin (l'étagère a été retirée en 1.42) |  |
| `versions/v127.js` | 50 | 1.29 : identité visuelle « le ruban » | ~openQuiz, ~paintQuiz ; actions : qzintro |
| `versions/v137.js` | 135 | ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation | ~vProfil, ~patchStock, ~vBar, ~segChips, ~vCompose, ~ingSheet, ~settingsSheet, !trophyGrid, !lvlCtl ; actions : more, alltro, lvlpick, setgroup |
| `versions/v138.js` | 79 | ZESTE 1.38 : chaque chose à sa place | ~vToday, ~cocktailsResults, ~filterSheet, ~vBar, ~vProfil, !vLabo ; actions : nafilter, lowsheet |
| `versions/v139.js` | 82 | ZESTE 1.39 : hiérarchie visuelle | ~vProfil, ~trophySummary, ~vBar, ~vCompose ; actions : carnet, gofaisables, famgo |
| `versions/v140.js` | 94 | ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées | ~vBar, ~vProfil, ~vCompose, ~openSheet, ~recSheet, ~renderView, ~switchTab, ~revealIn, ~updateBarStats ; actions : buysheet |
| `versions/v141.js` | 50 | ZESTE 1.41 : glace naturelle dans le labo, bar plus simple à lire | ~labGlass, ~labTry, ~vCompose, ~renderView, !stockRow ; actions : mixice |
| `versions/v142.js` | 72 | ZESTE 1.42 : bar épuré, pictos du labo, Paramètres et À propos, nuit soignée | ~vBar, ~vCompose, ~settingsSheet, ~fxSheet, ~applyAmbient, !NEXT_SHEET_XFORM ; actions : about |
| `versions/v143.js` | 71 | ZESTE 1.43 : « bouteille finie » d'un glissé, catégories repliables | ~stockRow, ~renderView, ~vBar ; actions : finish, barfold |
| `versions/v144.js` | 24 | ZESTE 1.44 : retour haptique sur iPhone |  |
| `versions/v146.js` | 41 | ZESTE 1.46 : Labo (Composer) — hiérarchie et mise en page | ~vCompose ; actions : mixclear |
| `versions/v147.js` | 15 | ZESTE 1.47 : Bar et feuille de niveau — mise en page (rendu seulement) | ~stockRow, ~vBar |
| `versions/v148.js` | 25 | ZESTE 1.48 : versement qui s'adapte à la place restante |  ; actions : mixpour |
| `versions/v149.js` | 19 | ZESTE 1.49 : Labo (Composer) — retouches visuelles (rendu seulement) | ~vCompose |
| `versions/v150.js` | 26 | ZESTE 1.50 : Labo (Composer) — débordement en un seul message, retouches (rendu seulement) | ~vCompose, ~toast, ~renderView, ~switchTab ; actions : mixice |
| `versions/v151.js` | 4 | ZESTE 1.51 : Profil — l'engrenage du haut suffit (rendu seulement) | ~vProfil |
| `versions/v152.js` | 43 | ZESTE 1.52 : fiche recette — doublons retirés, structure, en-tête (rendu seulement) | ~openSheet, ~paintSheet, !NEXT_SHEET_XFORM |
| `versions/v154.js` | 15 | ZESTE 1.54 : Labo — conseils, composition (rendu seulement) | ~vCompose |
| `versions/v155.js` | 11 | ZESTE 1.55 : labo — accords sans alcool | ~pairings |
| `versions/v156.js` | 31 | ZESTE 1.56 : Labo — contenance des verres réglable | ~healState, ~sanitizeBackup, ~vCompose, !labAvail ; actions : capsheet |
| `versions/v157.js` | 6 | ZESTE 1.56 (B) : accent réservé, profil de goût, ambiance, réglages de version | ~init, ~recPolish |
| `versions/v158.js` | 7 | ZESTE 1.56 (C) : Paramètres — « Sexe » sur une ligne | ~settingsSheet |
| `versions/v159.js` | 16 | ZESTE 1.58 : décisions de l'audit 1.57 | ~recPolish, ~vCompose |
| `versions/v160.js` | 28 | ZESTE 1.59 : lot A→G (rendu) | ~renderView, ~labGlass, !tasteSentence, !focalTaste ; actions : flip |
| `versions/v161.js` | 98 | ZESTE 1.59 (G) : moteur de recommandation, réglé par simulation (tests/m6.js, tests/m7.js, | ~bottleRecsRaw, ~lowView, !predict, !matchPct, !tonightRaw, !roulette, !reasons |
| `versions/v162.js` | 19 | ZESTE 1.60 (A) : finitions, rendu seulement | ~radarView, ~treeView, !radarResults ; actions : radpreset, radmine |
| `versions/v163.js` | 120 | ZESTE 1.60 (B) : intelligence — duels de goût, signaux implicites, recherche en langage co | ~trainSet, ~vProfil, ~healState, ~sanitizeBackup, ~spin, ~filtered, ~cocktailsResults, ~aboutBody, ~reasons ; actions : duels, barmode, bmclose, nlrm |
| `versions/v164.js` | 28 | ZESTE 1.61 (A) : Labo — verser quand il reste peu de place, par tous les chemins |  ; actions : mixpour, mixq, mixfix, mixadd1, mixfit |
| `versions/v165.js` | 78 | 1.61 (B) : score du Labo | ~vCompose, !labScore, !labGrade ; actions : tolab |
| `versions/v166.js` | 85 | 1.62 (B) : barème du Labo v3 | ~vCompose, ~labOverflow, ~labNope, ~chalCheck, !labScore, !labSummary ; actions : mixserve |
| `versions/v167.js` | 46 | 1.62 (C) : affichage du score du Labo | ~vCompose, ~openServe, !labGrade |
| `versions/v168.js` | 28 | ZESTE 1.63 : Labo — « Autre » sous 10 cl, « + » sans son, quantité au clavier | ~vCompose ; actions : mixqedit, mixadd, mixq |
| `versions/v169.js` | 80 | ZESTE 1.65 : données 100 % locales, copie de secours, sauvegardes (inspiré d'ASCEN) | !save, !exportData ; actions : storage |
| `versions/v170.js` | 14 | ---------- 1.66 : Profil > « Mes créations » (tous les cocktails créés dans le Labo, du pl | ~vProfil ; actions : gocreate |
| `versions/v171.js` | 84 | ZESTE 1.67 : Labo — conseils vérifiés par la note ; plafonds adoucis ; prédiction — créati | ~analyze, ~vCompose, ~goalAdvice, ~labScore, ~trainSet, ~predict ; actions : mixfix |
| `versions/v172.js` | 9 | ZESTE 1.68 : modèle de goût — une variante compte comme son ingrédient de base | ~shares |
| `versions/v173.js` | 52 | ZESTE 1.69 : Labo — conseil de méthode (construit, verre à mélange, shaker) | ~vCompose |
| `versions/v174.js` | 19 | ZESTE 1.70 : corrections de l'audit — enveloppes perdues | ~tonightRaw, ~reasons ; actions : mixfit, advdo, mapclose |
| `versions/v175.js` | 78 | ZESTE 1.71 : « Mon bar » plus utile | ~vBar, ~stockRow, ~ingSheet ; actions : finsheet |
| `versions/v176.js` | 49 | ZESTE 1.72 : carte recette à partager | ~recSheet ; actions : sharecard |
| `versions/v177.js` | 51 | ZESTE 1.73 : saisons et événements | ~occDate, ~occActive, ~occDaysLabel, ~filtered, ~recSheet |
| `versions/v178.js` | 50 | ZESTE 1.74 : Rewind des 3 mois | ~recapRows ; actions : rwquarter |
| `versions/v179.js` | 102 | ZESTE 1.75 : liquide vivant, mini-verre du Labo, morphing du verre | ~labGlassSVG, ~renderView, ~switchTab ; actions : minigo, mixserve, mixglass |
| `versions/v180.js` | 37 | ZESTE 1.76 : alcoolémie juste | ~recSheet, ~logMade, ~bacEventsRaw ; actions : made, bmfinish |
| `versions/v181.js` | 23 | ZESTE 1.77 : accueil plus court |  ; actions : hometab |
| `versions/v182.js` | 56 | ZESTE 1.78 : gestes et « Annuler » cohérent |  ; actions : peekopen, rate, mixrm, delcustom, delprep, bacrm |
| `versions/v183.js` | 54 | ZESTE 1.79 : les vrais verres | ~buildRecipes, ~glassSVGRaw |
| `versions/v184.js` | 23 | ZESTE 1.80 : ambiance « bar tamisé » le soir | ~applyTheme ; actions : setwarm |
| `versions/v185.js` | 29 | ZESTE 1.81 : lancement et icône de saison | ~splash |
| `versions/v187.js` | 14 | ZESTE 1.85 : grand titre qui s'efface sous la barre de titre | ~renderView |
| `socle/ui_final.js` | 175 | VERSION FINALE | ~switchTab ; actions : setglasses, setamb, fav, rlagain, tab |
| `versions/v126.js` | 79 | TROPHÉES À PALIERS (1.27) et grille unifiée (1.28) | ~trophySheet, !checkTrophies, !trophyGrid ; actions : tiertrophy |
| `versions/v130.js` | 71 | 1.31 : mises à jour (repris d'ASCEN) | ~renderView, ~paintSheet, ~openServe, ~switchTab, !moveTabInd ; actions : retryview |
| `versions/v186.js` | 24 | ZESTE 1.83 : format paysage et grands écrans | ~moveTabInd |

_~ enveloppe (garde la version précédente), ! remplace entièrement._
