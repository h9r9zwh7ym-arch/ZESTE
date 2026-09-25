# Outils de vérification (Zeste)

Tous les scripts se lancent depuis la racine et lisent directement `index.html`.

```sh
node tools/validate.js      # cohérence des données (ids, unités, rôles, verres, variantes)
node tools/ibacmp.js [-v]   # comparaison avec les recettes officielles IBA → data/ibareport.json
node tools/ibadump.js [nom] # affiche côte à côte la recette IBA et celle de Zeste
NODE_PATH=$(npm root -g) node tests/smoke.js [dossier]  # ouvre chaque fiche dans Chromium (captures facultatives)
```

- `data/iba.json` : recettes officielles de l’IBA, extraites d’iba-world.com le 16 août 2025
  (dépôt `kolaente/iba-cocktails-list`, commit 92cbe7f).
- `tools/ibapairs.json` : appariements IBA → Zeste que le nom seul ne permet pas de trouver.
- Dans `ibacmp.js`, `ALT` liste les substitutions d’ingrédients acceptées et `EXC` les écarts assumés ;
  chacun doit être expliqué dans la note (`n`) ou la garniture de la recette.

Clés de recette ajoutées en 1.21 : `st` (étapes propres à la recette, qui remplacent les étapes générées),
unités `br` (brin) et `gt` (goutte). Côté ingrédients : `u` (unité par défaut), `uL` (libellé de l’unité),
`yml` (jus libéré par unité) et `bsml` (volume d’une cuillère, pour le sucre en poudre).
