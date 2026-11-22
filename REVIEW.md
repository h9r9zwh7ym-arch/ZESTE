# Review complète de Zeste — rapport final (1.86 → 1.87)

- **Branche** : `review-complete` (la branche principale n'a pas été touchée) · **point de retour** : tag `avant-review` (commit `cd79588`, version 1.86).
- **Consigne** : [`PROMPT-REVIEW.md`](PROMPT-REVIEW.md). L'audit détaillé (phases 1 et 2, tel que tu l'as validé) se lit dans la version de ce fichier au commit `74b6885`. Ce rapport-ci en reprend chaque point avec son statut.
- **Version livrée** : **1.87** (« À propos » : « Zeste 1.87 », « © 2026 Yannick Wahler. Tous droits réservés. »).
- **Mis à jour** : `index.html`, `sw.js` (cache `zeste-1.87`), `zeste_projet/HANDOFF.md` (décrit l'app après la review), `README.md`.
- **Preuves** : `review/captures/avant/` et `review/captures/apres/` (95 écrans chacun, mêmes états et mêmes tailles), `review/mesures_*` (mesures brutes), `review/parcours_*.txt`, `review/outils/` (scripts, pour refaire chaque mesure).

## Résumé

- **Aucun problème critique** (perte de données, plantage) n'existait. Les **15 problèmes importants** sont corrigés, ainsi que la grande majorité des mineurs. Ce qui reste est listé plus bas avec la raison.
- **Données** :
  - Le format de stockage est désormais numéroté (`S.v` = 2), avec des migrations testées sur des données d'exemple des formats 1.2x, 1.65 et 1.86.
  - Rien de bien formé n'est plus effacé au chargement : c'est mis de côté et repris si l'identifiant revient.
  - La restauration d'une sauvegarde rend tout, à l'identique (vérifié champ par champ).
  - Les trophées ne régressent plus.
  - « Hier » est juste après un changement d'heure.
- **UI** :
  - Le réglage « Retour haptique » existe et fonctionne.
  - Le « tac » porte sur toutes les validations.
  - Plus aucune consigne à l'écran.
  - Zones tactiles de 44 px : 7 types de petites cibles avant, aucune après.
  - L'accent est réservé à l'action principale (100 → 56 usages).
  - Une taille de texte hors échelle (15 px) sur 9 écrans avant, sur aucun après.
- **Recettes** :
  - 36 classiques hors IBA, plus l'IBA Tiki, et 14 histoires vérifiées en ligne, avec la source consignée.
  - 11 histoires et 3 recettes corrigées.
  - Substituts courants ajoutés.
  - Sirop de sureau maison ramené à 30 jours.
  - **133 classiques restent « à vérifier »** : rien n'a été corrigé de mémoire.
- **Performance** : inchangée (mesure répétée, écarts dans le bruit). Le cache du service worker suit désormais la version, sans oubli possible.
- **Vérification** :
  - `tests/all.sh` passe en entier, **WebKit et fuzz compris** (installés pour l'occasion).
  - 3 nouveaux tests bloquants.
  - Parcours complets : 22/22 après, contre 20/22 avant (les 2 échecs d'avant correspondent à des points corrigés).

## Phase 1 — Cartographie (rappel, 10 lignes)

1. Un seul fichier HTML hors ligne, en JS vanilla sans dépendance. `build.sh` concatène 83 modules dans l'ordre de `src/ORDRE` : données, socle, versions, puis `ui_final.js` qui démarre l'app. S'y ajoutent un service worker « cache d'abord » et les polices et icônes intégrées.
2. Chaque version enveloppe les fonctions précédentes (`const _f=f; f=function(){…_f()…}`), souvent en retouchant le HTML produit. Les actions passent par `data-a` et le dictionnaire `ACT`.
3. Données : 382 recettes, 181 ingrédients, techniques et préparations du Labo, saisons, occasions, accords mets (`src/donnees/`).
4. État : l'objet `S`, en JSON dans `localStorage["zeste.v1"]`, avec une copie gzip dans IndexedDB. Depuis la 1.87, son format est numéroté (`S.v`), migré par `migrateState()` puis réparé par `healState()`.
5. Contenu de `S` : stock (niveaux 0–4, 0/1 pour les softs), notes, historique, favoris, créations, préparations, Labo, trophées, « Ta version », réglages, signaux de goût, et `orphans` (1.87).
6. Écrans : 5 onglets sans glissé entre eux (Aujourd'hui, Cocktails, Bar, Labo, Profil), des feuilles et des plein écran (mode préparation, roulette, Rewind, carte).
7. Flux « ce soir » : la suggestion faisable est à l'écran dès l'ouverture, puis 1 touche mène à « Préparer » ou à la recette.
8. Flux « stock » : 2 touches (fraction, puis niveau) ou un glissé sur la jauge. « Vide » envoie la bouteille dans « À racheter ».
9. Progression : `checkTrophies()` à chaque modification, 55 trophées (4 à paliers) ; récaps du mois, du trimestre et de l'année.
10. Sauvegarde : export JSON marqué Zeste et numéroté (1.87) ; import migré, contrôlé, puis confirmé.

## Ce qui a été fait (un commit par thème)

| Commit | Thème | Contenu |
|---|---|---|
| `a2856f0` | Données | Format versionné et migrations, sauvegarde complète, mise de côté au lieu d'effacement, paliers acquis, « Annuler » qui reprend le trophée, changement d'heure, onglets multiples, noms uniques, `deferSave` ; test `migration_test.js` |
| `ca3105d` | UI | Réglage et actions haptiques, consignes retirées, état vide de la recherche, zones de 44 px, accent réservé, filtres, marges, tailles de texte, « % pour toi », « Réinitialiser » annulable ; test `review_ui_test.js` |
| `5109459` | Recettes | Sources en ligne (`data/verif.json`), 11 histoires, 3 recettes, substituts, sureau, œuf cru, ingrédients rares ; plancher de `m9` documenté ; test `review_recipes_test.js` |
| `ba0f522` | Perf | `CACHE` du service worker tiré de la version |
| `be40238` | Code | Code mort et texte de synchronisation périmé retirés |
| `a729df5` | UI (vérification) | Dernières zones de 44 px trouvées en phase 4 |
| `295c180` | Version | 1.87, HANDOFF, README |
| `3e43012` | Relecture | Régressions et oublis trouvés en relisant le diff (voir plus bas) |

Le thème « suggestions » n'a pas de commit à part. Ses quatre points sont corrigés dans les commits Recettes (SUG-3 : substituts), UI (SUG-4 et SUG-6) et Données (SUG-5 : trophées).

## Tableau des problèmes et statut

Statut : ✅ corrigé · ◐ corrigé en partie · ⏸ non fait (raison donnée) · ✱ = comportement changé (voir le journal).

### Axe 1 — UI et ergonomie

| # | Gravité | Problème | Statut |
|---|---|---|---|
| UI-1 | important | Pas de réglage « Retour haptique » | ✅ Paramètres › Sons et animations › Toucher ; coupé, aucune vibration et les actions marchent ✱ |
| UI-2 | important | Pas de tac sur préparation, note de l'accueil, « Terminer », création | ✅ |
| UI-3 | important | Zones tactiles < 44 px | ✅ « Passer », « Réinitialiser », chips des filtres et du Labo, en-têtes du bar, champ prix, interrupteurs des softs. **Correction de l'audit** : segments et boutons Fermer faisaient déjà 44 px ; mon premier script mesurait de 2 en 2 px et sous-estimait ces zones |
| UI-4 | important | Textes qui disent quoi faire | ✅ 9 de l'audit, plus 5 trouvés à la relecture (profil vide, « Continue à noter », À propos, familles, fiche d'un basique). Gardé : « Appuie longuement sur l'image » (dernier recours quand le partage n'existe pas) |
| UI-5 | mineur | Accent hors action principale | ✅ 100 → 56 usages mesurés |
| UI-6 | mineur | « Sans alcool » deux fois dans les filtres | ✅ cause : clé `sansalcool` absente de `FAM_AS_TYPE` |
| UI-7 | mineur | Marge de 16 px dans les feuilles | ✅ 20 px |
| UI-8 | mineur | Plus de 3 tailles de texte | ✅ la taille hors échelle (15 px) est ramenée à 16 px : 9 écrans → 0 |
| UI-9 | mineur | Espacements hors de la grille de 8 px | ◐ tous ceux écrits dans le JS ; il reste des `6px` dans `style.css` (voir recommandations) |
| UI-10 | mineur | Recherche vide sans action | ✅ « Effacer la recherche », « Retirer les filtres » |
| UI-11 | mineur | « Réinitialiser » Ta version sans Annuler | ✅ |
| UI-12 | mineur | Clavier ouvert | ✅ vérifié en simulation (champ visible et non couvert) ; reste à tester sur iPhone |
| UI-13 | mineur | « N % pour toi » sur un cocktail déjà noté | ✅ ✱ le bandeau garde le verre |

### Axe 2 — Recettes et infos

| # | Gravité | Problème | Statut |
|---|---|---|---|
| REC-1 | important | 169 classiques hors IBA sans source | ◐ 36 vérifiés en ligne (+ IBA Tiki), source et verdict dans `data/verif.json` ; **133 restent à vérifier** (annexe A) |
| REC-2 | important | Citation du Corpse Reviver n° 2 inversée | ✅ |
| REC-3 | important | Attribution de l'Illegal | ✅ nuancée. **Correction de l'audit** : Wikipédia rapporte bien l'attribution à Samuele Ambrosi, Difford's la dit inconnue ; ce n'était pas une confusion avec le Vento |
| REC-4 | mineur | 12 histoires douteuses | ✅ 9 corrigées, 3 confirmées (Casino, Don's Special Daiquiri, Rabo de Galo) |
| REC-5 | mineur | Incohérences internes | ✅ IBA Tiki dans un verre tiki (IBA), Presbyterian au scotch (Difford's), Godfather 2:1 ✱. **Corrections de l'audit** : le White Negroni à parts égales est bien l'original ; le Kamikaze suit Difford's et sa note dit déjà « pour deux shots » ; le Fitzgerald est servi sans glace dans un verre old fashioned, comme sa source. ⏸ Rum Swizzle : il déborde toujours du highball, car les sources ne s'accordent ni sur le verre ni sur la recette |
| REC-6 | important | Substituts manquants (faux « il manque ») | ✅ bourbon ↔ rye, Tennessee → bourbon, scotch tourbé → scotch, champagne ↔ prosecco, ginger ale ↔ ginger beer, rhums ✱ |
| REC-7 | mineur | Ingrédients rares en Suisse | ✅ pistes pour l'allspice dram et la crème de violette |
| REC-8 | important | Sirop de sureau maison compté 180 jours | ✅ 30 jours (sources : 2 à 6 semaines une fois ouvert) ✱ |
| REC-9 | mineur | Œuf cru | ✅ blanc pasteurisé ou aquafaba pour les personnes à risque |
| REC-10 | mineur | Herbes fraîches comptées d'office | ⏸ choix de produit, laissé tel quel faute de ta décision (désactivable dans « Basiques ») |

### Axe 3 — Données et logique

| # | Gravité | Problème | Statut |
|---|---|---|---|
| DATA-1 | important | Restauration incomplète | ✅ aller-retour identique champ par champ (test) |
| DATA-2 | important | Pas de format versionné | ✅ `SCHEMA` 2, `MIGRATIONS`, tests sur les formats 1.2x, 1.65, 1.86 et futur |
| DATA-3 | important | Effacement silencieux des inconnus | ✅ `S.orphans`, repris quand l'identifiant revient (test) |
| DATA-4 | important | Paliers de trophée qui redescendent | ✅ ✱ |
| DATA-5 | important | « Tour des familles » mal libellé | ✅ « 8 familles différentes » ; seuil inchangé, aucun trophée retiré |
| DATA-6 | mineur | Changement d'heure (« Aujourd'hui » au lieu d'« Hier ») | ✅ testé aux deux changements d'heure 2026 |
| DATA-7 | mineur | Softs à niveau 2–4 vus absents | ✅ migration et `> 0` partout (fiche, bar, interrupteurs) |
| DATA-8 | mineur | Écritures directes de tout l'état | ✅ `deferSave`, vidé aussi au passage en arrière-plan |
| DATA-9 | mineur | Import de n'importe quel JSON avec « stock » | ✅ refusé sans champ propre à Zeste |
| DATA-10 | mineur | Création forgée (id, couleur) | ✅ `cleanCustom` |
| DATA-11 | mineur | « Annuler » garde le trophée | ✅ |
| DATA-12 | mineur | Deux onglets s'écrasent | ✅ événement `storage` |
| DATA-13 | mineur | Noms de création en double | ✅ « Negroni (2) » ✱ |

### Axe 4 — Performance

| # | Gravité | Problème | Statut |
|---|---|---|---|
| PERF-1 | mineur | Tâche longue au démarrage | ⏸ mesuré : c'est surtout l'analyse du HTML et des SVG de l'accueil. Aucun gain sûr sans revoir le rendu (recommandation) |
| PERF-2 | mineur | Ouverture d'une fiche | ⏸ même cause ; mesurée sans recul (183 → 156 ms au premier coup, CPU ×4) |
| PERF-3 | mineur | CSS de 263 Ko | ⏸ pas de refonte (risque visuel) ; recommandation |
| PERF-4 | mineur | `CACHE` à changer à la main | ✅ écrit par `build.sh` |

### Axe 5 — Qualité du code

| # | Gravité | Problème | Statut |
|---|---|---|---|
| CODE-1 | important (structurel) | Empilement d'enveloppes | ◐ aucune nouvelle retouche par expression régulière : chaque correction est faite à l'étage concerné. La fusion des chaînes reste une recommandation |
| CODE-2 | mineur | Code mort ou trompeur | ✅ |
| CODE-3 | mineur | `catch` vides | ◐ l'import affiche un message en cas d'échec ; les autres sont légitimes (stockage, API absentes) |
| CODE-4 | mineur | Verres des recettes dans le code (`GLASS_FIX`) | ⏸ les déplacer demande de changer le validateur des recettes, pour un gain faible ; recommandation |
| CODE-5 | mineur | HANDOFF en retard | ✅ |

### Axe 6 — Suggestions et envie d'ouvrir l'app

| # | Statut |
|---|---|
| SUG-1 et SUG-2 (0 touche pour l'idée du soir, 1 pour la recette ; 2 touches ou un glissé pour un niveau) | conformes, vérifiés par les parcours |
| SUG-3 (substituts) · SUG-4 (% sur un cocktail noté) · SUG-5 (trophées) · SUG-6 (Labo à un rôle) | ✅ |

## Journal des changements de comportement (✱)

1. **Haptique** : un réglage permet de la couper ; elle vibre aussi sur « préparation lancée », sur la note depuis l'accueil, sur « Terminer » et sur « Enregistrer » une création.
2. **Fiche d'un cocktail déjà noté** : le bandeau ne montre plus « N % pour toi », mais le verre.
3. **Trophées à paliers** : un palier atteint reste acquis, même si l'on vide des bouteilles. « Annuler » un verre retire le trophée qu'il venait de débloquer.
4. **Restauration** : un fichier sans aucun champ Zeste est refusé ; une sauvegarde d'un ancien format est migrée.
5. **Substituts** : « Il manque une chose » propose « avec prosecco à la place », etc. Aucune recette ne devient « faisable » grâce à un substitut.
6. **Recettes** :
   - le Presbyterian passe au scotch ;
   - le Godfather passe de 45/15 à 45/22,5 ;
   - l'IBA Tiki est servi dans un verre tiki ;
   - les notes et les « % pour toi » de ces trois recettes peuvent légèrement bouger.
7. **Sirop de sureau maison** : il compte comme « en stock » pendant 30 jours (avant : 180), réglable comme avant.
8. **Créations** : un nom déjà pris devient « Nom (2) ».
9. **Recherche sans résultat** : des boutons remplacent la phrase.
10. **Labo à un seul ingrédient** : un tiret et deux pastilles au lieu de « Ajoute un second ingrédient » ; le message après un refus de service devient « Pas de note avec un seul ingrédient ».
11. **Deux onglets ouverts** : l'un reprend ce que l'autre enregistre.
12. **Banc `m9`** : le plancher « dégradées ≥ 85 » passe de 60 à 60,5 %. Il était à 60,0 % pile ; les corrections de recettes sourcées le portent à 60,2 % sans toucher au barème (AUC 0,722 → 0,727).

## Recettes et infos « à vérifier »

**Vérifiées en ligne pendant cette review**, avec source et verdict dans `zeste_projet/data/verif.json` :

- **Conformes** : Gold Rush, Amaretto Sour, Hugo, Painkiller, Brown Derby, Jack Rose, Gimlet, Toronto, Queen's Park Swizzle, Air Mail, El Presidente, Old Pal, White Negroni, Kamikaze, Fitzgerald, Rum Swizzle, Tom Collins, Sbagliato, White Russian, El Diablo, Death in the Afternoon, Hurricane, Pimm's Cup, B-52, Hot Toddy, Dirty Martini, Kir Royal, Gin Gin Mule, Bijou, Pegu Club, Jasmine, Ward 8, Army & Navy, Rob Roy.
- **Corrigées** : Godfather, Presbyterian, IBA Tiki.
- **Histoires** : Corpse Reviver n° 2, Schümli Pflümli, Honeymoon, Mary Pickford, Godfather, Panaché, Pastis, French 75, Tuxedo, Eggnog et Illegal corrigés ; Casino, Don's Special Daiquiri et Rabo de Galo confirmés.

**Encore à vérifier.** Ces recettes n'ont aucune source écrite ; je n'ai rien corrigé de mémoire.

- **133 classiques hors IBA** : blood_sand, siesta, division_bell, breakfast_martini, gin_tonic, kafi_luz, absinthe_frappe, screwdriver, salty_dog, absinthe_louche, industry_sour, ti_punch, whiskey_smash, eastside, hotel_nacional, bacardi_cocktail, floradora, pink_lady, bronx, scofflaw, alexander, golden_cadillac, mudslide, baby_guinness, carajillo, grog, vin_chaud, eggnog, brandy_milk_punch, gibson, fifty_fifty, black_manhattan, red_hook, greenpoint, bobby_burns, la_louisiane, improved_whiskey, monte_carlo, revolver, fanciulli, kingston_negroni, contessa, adonis, bamboo, alaska, widows_kiss, seelbach, pink_gin, twentieth_century, corpse_reviver1, algonquin, chrysanthemum, charlie_chaplin, bourbon_renewal, final_ward, midnight_stinger, matador, mexican_firing_squad, mamie_taylor, whisky_highball, tinto_verano, gespritzter, bucks_fizz, batanga, ranch_water, gin_rickey, cape_codder, harvey, pastis, mauresque, perroquet, tomate, panache, michelada, kalimotxo, stone_fence, gin_buck, sloe_gin_fizz, navy_grog, fog_cutter, scorpion, saturn, blue_lagoon, blue_hawaii, porto_tonic, sangria, bicicletta, lillet_tonic, vermouth_soda, chilcano, el_capitan, piscola, kafi_fertig, suze_tonic, suze_cassis, picon_biere, brooklyn, lynchburg, jack_coke, cable_car, alabama_slammer, caffe_corretto, malibu_ananas, jagerbomb, woo_woo, fuzzy_navel, greyhound, kafi_trasch, nojito, shirley_temple, roy_rogers, virgin_mary, virgin_colada, arnold_palmer, cinderella, diabolo_grenadine, diabolo_menthe, spicy_margarita, rossini, daiquiri_fraise, lumumba, bombardino, snowball, schumli_pflumli, whisky_ginger, rum_punch, satans_whiskers, corn_oil, affinity, japanese_cocktail, honeymoon, diamondback, cameron_kick.
- **Histoires** : les 245 histoires ont été relues. Seules les 14 signalées ont été vérifiées en ligne ; les autres ne m'ont pas paru douteuses, mais elles n'ont pas de source écrite.
- **Rum Swizzle** : les sources divergent (falernum chez Difford's, triple sec à la Swizzle Inn ; verre de cocktail ou sur glace). La recette suit Difford's, mais déborde du highball de l'app.

## Mesures avant / après

**Interface** (`review/outils/audit_ui.js`, 95 écrans : 390×844 et 375×667, clair et sombre, vide / presque vide / rempli) :

| Mesure | Avant (1.86) | Après (1.87) |
|---|---|---|
| Erreurs JavaScript | 0 | 0 |
| Types de petites cibles (< 44 px, zone mesurée pixel par pixel) | 7 | 0 |
| Usages de l'accent hors action principale | 100 | 56 |
| Écrans à plus de 2 tailles de texte courant (titres de 22, 28 et 34 px exclus) | 9 | 0 |
| Consignes distinctes visibles (11 écrans testés, `review_ui_test.js`) | 9 | 0 |
| Champs < 16 px, défilement horizontal | 0, 0 | 0, 0 |

Le script signale encore quelques éléments dans les deux versions, mais ce ne sont pas de petites cibles : ce sont des éléments en partie cachés au moment de la capture. Il s'agit du champ de recherche masqué, des vignettes du bar et des chips du bas des filtres sous la barre fixe du bas, et de « Tout voir » sous les onglets en 375×667. Une fois l'écran défilé, ils font 44 px.

**Performance** (`review/outils/perf3.js`, médiane de 5 lancements, processeur ralenti 4×, 1 an de données, en ms) :

| Mesure | Avant | Après |
|---|---|---|
| Rendu à froid : Aujourd'hui / Cocktails / Bar / Labo / Profil | 72 / 126 / 53 / 36 / 39 | 78 / 126 / 49 / 32 / 39 |
| Rendu à chaud : Aujourd'hui / Cocktails / Bar / Labo / Profil | 53 / 70 / 15 / 20 / 24 | 55 / 64 / 14 / 21 / 20 |
| `changed()` | 66 | 59 |
| Fiche Negroni (1re / 2e ouverture) | 183 / 151 | 156 / 160 |
| Fichier livré (gzip) | 1 037 Ko (371 Ko) | 1 043 Ko (373 Ko) |
| Recherche, par frappe | 3 à 41 | 0 à 37 |
| Écouteurs après 20 changements d'onglet | 58 → 58 | 58 → 58 |

Les écarts restent dans le bruit de mesure : pas de régression et pas de gain notable, ce qui est attendu puisque le rendu n'a pas été modifié. Mesures brutes : `review/mesures_*_perf.txt` et `review/mesures_perf_comparees.txt`.

**Tests** :

| Suite | Avant | Après |
|---|---|---|
| `tests/all.sh` | passe (WebKit et fuzz non lancés : outils absents) | **passe en entier, WebKit et fuzz compris** |
| Tests de fonctionnalités | 51 | 54 (+ `migration_test`, `review_ui_test`, `review_recipes_test`) |
| IBA | 102 / 102 conformes | 102 / 102 conformes |
| Cohérence (`audit2`) | 5 points | 4 points (martini et gibson identiques, voulu ; ti' punch sans glace, voulu ; Kamikaze et Rum Swizzle, voir plus haut) |
| Parcours complets (`review/outils/parcours.js`) | 20 / 22 | **22 / 22** |
| Prédiction (`m3`, 5 notes) | corrélation 0,63 | 0,62 (bruit lié aux 3 recettes corrigées ; 10 et 20 notes inchangés) |

## Captures avant / après

Mêmes états, même moment (le soir), 390×844. Les captures en 375×667 et en sombre sont dans les mêmes dossiers.

| Écran | Avant | Après |
|---|---|---|
| Aujourd'hui (bar rempli) | [avant](review/captures/avant/390x844_light_riche_01_aujourdhui.png) | [après](review/captures/apres/390x844_light_riche_01_aujourdhui.png) |
| Recherche sans résultat | [avant](review/captures/avant/390x844_light_vide_03_recherche_vide.png) | [après](review/captures/apres/390x844_light_vide_03_recherche_vide.png) |
| Bar | [avant](review/captures/avant/390x844_light_riche_04_bar.png) | [après](review/captures/apres/390x844_light_riche_04_bar.png) |
| Labo | [avant](review/captures/avant/390x844_light_riche_05_labo.png) | [après](review/captures/apres/390x844_light_riche_05_labo.png) |
| Profil (vide) | [avant](review/captures/avant/390x844_light_vide_07_profil.png) | [après](review/captures/apres/390x844_light_vide_07_profil.png) |
| Fiche Negroni (noté, sombre) | [avant](review/captures/avant/390x844_dark_riche_10_fiche_negroni.png) | [après](review/captures/apres/390x844_dark_riche_10_fiche_negroni.png) |
| Filtres | [avant](review/captures/avant/390x844_light_riche_14_filtres.png) | [après](review/captures/apres/390x844_light_riche_14_filtres.png) |
| Paramètres | [avant](review/captures/avant/390x844_light_riche_15_parametres.png) | [après](review/captures/apres/390x844_light_riche_15_parametres.png) |
| Petit écran, Aujourd'hui | [avant](review/captures/avant/375x667_light_riche_01_aujourdhui.png) | [après](review/captures/apres/375x667_light_riche_01_aujourdhui.png) |

## Phase 4 — Parcours et cas limites vérifiés

Tous les parcours ci-dessous passent par l'interface : touchers Playwright en mode mobile tactile, sur le fichier construit. Résultats détaillés : `review/parcours_avant.txt` et `review/parcours_apres.txt`.

- **Première ouverture** : accueil, puis quiz proposé ; « Passer » mène à l'accueil.
- **Bar vide** : état propre ; ajout rapide de 4 bouteilles ; le Negroni devient faisable ; niveau changé en 2 touches ; « Vide » range la bouteille dans « À racheter » et rend le Negroni infaisable.
- **Bar très rempli, 1 an de données** :
  - la suggestion du soir est faisable ;
  - la recherche « gin » filtrée sur « Faisables » ne donne que des faisables ;
  - une recherche sans résultat propose une action ;
  - une note de 4 étoiles est enregistrée ;
  - les suggestions sont faisables et variées (8 familles), avec des achats proposés ;
  - une préparation au Labo met le sirop en stock ;
  - un trophée se débloque ;
  - l'export est daté, marqué et numéroté ;
  - l'import rend tout.
- **Clavier ouvert** (fenêtre réduite à 500 px de haut) : le champ de recherche et le champ de quantité du Labo restent visibles et non couverts.
- **Données** : données illisibles mises de côté ; données de mauvais type réparées ; dans les deux cas l'app démarre sans erreur.
- **Migrations** (`migration_test.js`) : formats 1.2x, 1.65, 1.86 et « futur » ; mise de côté puis reprise ; deux onglets.
- **Changement d'heure** (Europe/Zurich) : 4 cas.

## Relecture du diff `avant-review..review-complete`

J'ai relu les 34 fichiers sources modifiés, ligne par ligne. Ce qui a été trouvé et corrigé (commit `3e43012`) :

1. **Interrupteurs « En stock » des softs** (bar et fiche) : ils testaient encore `=== 1`, alors que la présence est désormais `> 0`. Aucun effet avec des données migrées, mais c'était incohérent : aligné.
2. **Cinq consignes** que mon détecteur ne voyait pas (verbes « Note », « Continue », « Prépare », « Tu peux ») : reformulées en constats. Le test UI les couvre désormais.
3. **L'enregistrement différé** (fiche ouverte, suggestion du jour) pouvait se perdre si l'app était fermée dans les 1,5 s : il part maintenant aussi au passage en arrière-plan.
4. **`wave_test` dépendait de l'heure.** Le matin, l'accueil ne propose rien à préparer, donc le test ne trouvait pas le bouton « Préparer ». Il échouait aussi sur la 1.86 avant midi. Il fixe maintenant le moment « soir » et passe quelle que soit l'heure (commit final).

Contrôlé sans problème :

- les listes de validation des créations couvrent tous les verres, glaces et familles du Labo ;
- `sethaptic` rétablit bien l'état par défaut ;
- `troRevoke` ne retire que ce que le verre annulé avait débloqué ;
- le CSS ajouté ne passe pas devant des règles plus précises (bouton favori de la fiche, boutons du Labo) ;
- la baisse du compte de choix de l'accueil dans `hick_test` (35 → 19) vient de l'heure du test (11 h = « matin », l'accueil ne propose alors rien, comme prévu), pas d'une régression.

## Recommandations (non faites)

1. **Vérifier les 133 classiques restants** et les histoires sans source, avec la même méthode (source écrite dans `data/verif.json`, correction seulement avec une source).
2. **Fusionner les chaînes d'enveloppes** écran par écran (`vCompose` : 21 étapes, `vBar` : 9), avec la suite complète comme filet. C'est ce qui rendra l'app vraiment facile à faire évoluer.
3. **Alléger `style.css`** (263 Ko, règles superposées version après version, 55 `!important`) et finir la grille de 8 px (`6px` restants).
4. **Rendu de l'accueil et des fiches** : ne dessiner les SVG qu'à leur arrivée à l'écran, si l'iPhone montre des à-coups.
5. **Verres des recettes** (`GLASS_FIX`) : les ranger dans les données, en étendant le validateur.
6. **Herbes fraîches** (REC-10) : les compter d'office ou non pour les nouveaux utilisateurs ; c'est ton choix.
7. **Idées de rétention** :
   - liste de courses exportable (bouteilles vides et achats malins) ;
   - « Ce soir avec ce qui reste » quand une bouteille ouverte arrive en fin de vie ;
   - un défi de la semaine mis en avant sur l'accueil le vendredi.

## À tester sur ton iPhone (ce que je ne peux pas vérifier ici)

1. **Retour haptique** : un seul « tac » sur niveau, note (fiche et carte « Alors, ce … ? »), « Préparé », « Terminer », préparation lancée et création enregistrée ; aucun tac sur les onglets ni à la fermeture des feuilles.
2. **Réglage « Retour haptique » coupé** : plus aucune vibration, et chaque bouton marche toujours (niveau, note, Servir…).
3. **Vrai clavier** : recherche, prénom, quantité au Labo, nom d'une création. Aucun champ caché par la barre « Servir » ni par les onglets.
4. **Zones sûres réelles** (encoche, Dynamic Island, barre d'accueil), en portrait et en paysage.
5. **Restaurer une sauvegarde** d'avant la 1.87 depuis Fichiers ou iCloud : tout revient (notes, bouteilles, trophées, créations).
6. **Mise à jour de l'app installée** : l'annonce « Nouvelle version prête » apparaît, puis la 1.87 s'affiche dans À propos.
7. **Zones de 44 px au doigt** : chips des filtres, « Passer », « Réinitialiser », en-têtes repliables du bar, interrupteurs des softs.
8. **« Réduire les animations »** dans iOS, puis le mode sombre qui suit l'iPhone.
9. **Glissé « Finie »** et glissé sur la jauge de niveau, au doigt.
10. **VoiceOver** : le tiret et les deux pastilles du Labo (un seul ingrédient) sont lus comme « Pas encore de note… ».
