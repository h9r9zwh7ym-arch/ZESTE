Tu es chargé de faire une review COMPLÈTE de l'app Zeste et de corriger directement ce que tu trouves. Zeste est mon app web de bar à cocktails pour iPhone : grande base de cocktails (ingrédients trouvables en Suisse, courte histoire pour les cocktails connus, variantes), stock de bouteilles avec niveaux (pleine, 3/4, 1/2, 1/4, vide = à racheter), notation des cocktails, suggestions de cocktails à tester et de bouteilles à acheter, labo (préparations maison, conseils, tendances), trophées et statistiques, thème clair/sombre qui suit l'iPhone. Elle tourne sur iPhone (Safari / écran d'accueil), les données restent 100 % locales, aucune API, et ça doit rester comme ça. Le fichier zeste_projet/HANDOFF.md décrit le projet : lis-le, mais le code fait foi s'il est en retard sur l'app.

## Règles de sécurité
1. Travaille sur la branche `review-complete`, avec le tag `avant-review` comme point de retour.
2. Un commit par thème (UI, données, recettes, perf, code, suggestions), message clair en français.
3. Ne casse jamais les données déjà stockées sur mon iPhone (stock, notes, cocktails testés, labo, trophées) : toute modification du format de stockage doit inclure une migration versionnée et testée sur des données d'exemple de l'ancien format.
4. Pas de nouvelle dépendance ni de framework, sauf justification écrite et validée dans le rapport. Pas de requête réseau dans l'app.
5. Si une correction change le comportement d'une fonctionnalité existante (pas juste son apparence ou sa fiabilité), note-le dans le journal des changements.
6. Numérotation : à la fin, incrémente la version (1.X → 1.X+1) à l'endroit où elle est affichée, vérifie que le « À propos » affiche « © Yannick Wahler », et mets HANDOFF.md à jour pour qu'il décrive l'app telle qu'elle est après la review.

## Méthode
Phase 1 : Cartographie. Lis tout le code et HANDOFF.md. Décris en 10 lignes max l'architecture, le modèle de données, les écrans et les flux principaux. Ne modifie rien.
Phase 2 : Audit. Pour chaque axe ci-dessous, liste les problèmes trouvés avec : gravité (critique / important / mineur), où (fichier, ligne), pourquoi c'est un problème, comment tu le corriges.
Phase 3 : Corrections. Applique les corrections par ordre de gravité, axe par axe. Corrige tout ce qui est critique et important, et le mineur quand le risque est faible.
Phase 4 : Vérification. Lance l'app dans un navigateur headless à la taille d'un iPhone (390×844, puis 375×667 pour un petit écran), prends des captures de chaque écran avant et après, teste les parcours complets (mettre à jour le stock, chercher un cocktail faisable, noter un cocktail, voir les suggestions, créer une préparation au labo, débloquer un trophée, exporter/importer). Teste aussi : état vide, première ouverture, bar presque vide, bar très rempli, recherche sans résultat, clavier ouvert, données corrompues ou absentes. Mesure avant/après quand tu touches à la performance.
Phase 5 : Rapport final dans REVIEW.md : ce qui a été corrigé, ce qui reste, ce que tu recommandes pour plus tard (grosses évolutions non faites), avec les mesures.

## Axes de la review

### 1. UI et ergonomie
- Usage à une main sur iPhone : zones tactiles ≥ 44 px, actions principales atteignables au pouce, safe areas (encoche, barre d'accueil), comportement avec le clavier, pas de zoom involontaire dans les champs.
- États vides, chargement, erreurs, annulation : chaque écran doit avoir un état propre, et chaque action destructive doit être annulable ou confirmée.
- Cohérence visuelle entre tous les écrans : mêmes composants, mêmes espacements, mêmes comportements.
- Mon cap de design, à faire respecter partout : rendu sobre proche des apps Apple ; ne jamais répéter une information à l'écran ; accent (jaune en mode sombre, vert en mode clair) réservé à l'action principale et à l'état actif ; vert = validation, orange/rouge = alerte ; 3 tailles de texte seulement ; espacements en multiples de 8 px ; marge latérale de 20 px ; contrôles segmentés style iOS (pastille claire, sans bordure) ; chips et tuiles avec bordure d'accent quand elles sont sélectionnées ; pas de swipe entre onglets.
- Supprime tout texte qui dit quoi faire (« touche… », « fais glisser… ») : l'interface doit le montrer visuellement, pas le dire.
- Haptique : un seul « tac » sur les validations (niveau de bouteille, note, testé, préparation), jamais sur la navigation, les fermetures ou les événements automatiques ; le réglage « Retour haptique » dans le Profil doit exister et fonctionner.
- Mode clair et sombre complets (suivent l'iPhone), contrastes lisibles, animations fluides et discrètes, respect de « réduire les animations ».

### 2. Exactitude des recettes et des infos
- Contrôle la cohérence interne de chaque recette : proportions, unités (cl / ml / oz), ingrédients, verre, méthode, garnitures, doublons, fautes.
- Compare avec des sources reconnues (IBA en priorité, puis ouvrages et sites de référence) quand tu as un accès web. Si tu n'en as pas, ou si tu n'es pas sûr, ne corrige pas de mémoire : marque la recette « à vérifier » dans REVIEW.md avec la raison.
- Vérifie les histoires de cocktails : pas d'anecdotes inventées ni de dates douteuses. En cas de doute, mets « à vérifier » plutôt que de laisser passer.
- Les ingrédients doivent être trouvables en Suisse ; signale les autres et propose un substitut.
- Vérifie les conseils sur les types de bouteilles et les préparations du labo (dosages, durées de conservation, sécurité alimentaire).

### 3. Fiabilité des données et de la logique
- Comment le stock, les notes, les cocktails testés, le labo et les trophées sont stockés (localStorage / IndexedDB) : risques de perte, de corruption, de dépassement de quota, d'écritures concurrentes.
- Logique du stock : correspondance entre ingrédients et bouteilles (équivalences, substituts, ingrédients génériques), niveau « vide = à racheter », calcul des cocktails faisables (ni faux positifs ni faux négatifs).
- Calculs des statistiques et des trophées : conditions de déblocage justes, pas de trophée débloqué deux fois ou jamais.
- Export / import : doit être complet, versionné, et résister à un fichier invalide ou d'une ancienne version.
- Cas limites : bouteille supprimée alors qu'elle est utilisée, cocktail noté puis modifié, nom en double, caractères spéciaux et accents dans les recherches.

### 4. Performance
- Temps de chargement, taille du code et de la base de cocktails, travail inutile au démarrage.
- Fluidité de la recherche, des filtres et des longues listes avec la base complète : re-rendus inutiles, calculs répétés, fuites d'écouteurs, animations trop coûteuses sur iPhone.
- Lectures/écritures de stockage trop fréquentes ou bloquantes.
- Fonctionnement hors ligne et comportement de la mise en cache.

### 5. Qualité du code
- Structure, nommage, duplication, fonctions trop longues, état global mal maîtrisé, code mort.
- Séparation entre les données (recettes) et le code, pour pouvoir corriger une recette sans toucher à la logique.
- Robustesse : erreurs non gérées, hypothèses fragiles, XSS ou injection via les noms saisis.
- Rends le code plus facile à faire évoluer sans tout réécrire. Pas de refonte gratuite : chaque refactor doit être justifié par un gain concret.

### 6. Utilité des suggestions et envie d'ouvrir l'app
- Les suggestions de cocktails à tester et de bouteilles à acheter sont-elles pertinentes, variées et expliquées visuellement (pas de texte qui dit quoi faire) ? Tiennent-elles compte des notes et du stock ?
- Rapidité pour répondre à « qu'est-ce que je peux faire ce soir ? » : combien de touches entre l'ouverture de l'app et une recette ?
- Mise à jour du stock : peut-on changer le niveau d'une bouteille en 1 ou 2 touches ?
- Le labo, les trophées et les statistiques donnent-ils une vraie raison de revenir sans être gadgets ?
- Corrige ce qui est une friction ou un défaut. Pour les nouvelles idées, mets-les dans la section « Recommandations » du rapport au lieu de les implémenter, sauf si c'est petit et évident.

## Livrables
- Branche `review-complete` avec tous les commits.
- REVIEW.md : résumé, tableau des problèmes (gravité, statut), liste des recettes et infos « à vérifier » avec la raison, mesures avant/après, captures avant/après, recommandations.
- Version incrémentée et HANDOFF.md à jour.
- Une courte liste « à tester sur mon iPhone » : les 10 points que tu ne peux pas vérifier toi-même (haptique, vrai clavier, safe areas réelles, etc.).

Ne t'arrête pas à un premier tour : à la fin de la phase 3, relis ton propre travail, cherche les régressions que tu as pu introduire, et corrige-les avant le rapport.
