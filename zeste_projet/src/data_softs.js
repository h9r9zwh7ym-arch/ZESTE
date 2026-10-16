// ---------- SOFTS COURANTS EN SUISSE (1.55) ----------
// Sucre g/100 ml : Crodino 15 (fiche technique Campari, Crodino Biondo) ; Sanbitter 15,1 (étiquette, REWE 6×98 ml).
// Valeurs approchées (bases tierces, par 100 g ≈ 100 ml) : Elmer Citro 8,4 (wikifit) ; Gazosa 11 (CodeCheck, Gazosa 1883) ;
// Schorle de pomme 6,7 (CodeCheck, Ramseier) ; Rivella bleu 1,5 (wikifit). Acidité et arômes alignés sur les softs existants.
ING_RAW.push(
["crodino","Crodino","soft",0,15,0.3,"b2h2f1",{fizz:1,col:"#F08A1E",subs:["sanbitter"],tip:"Apéritif sans alcool italien (groupe Campari), amer et herbacé, en petites bouteilles de 10 cl. Il se sert simplement sur glace avec une rondelle d’orange."}],
["sanbitter","Sanbitter","soft",0,15.1,0.3,"b2f1",{fizz:1,col:"#D8222A",subs:["crodino"],tip:"L’apéritif amer sans alcool de San Pellegrino, rouge vif, en petites bouteilles d’environ 10 cl. Se sert sur glace avec une rondelle d’orange."}],
["elmer_citro","Elmer Citro","soft",0,8.4,0.4,"f2",{fizz:1,col:"#F2EFC0",tip:"La limonade au citron suisse, à base d’eau minérale d’Elm. Remplace la limonade dans toutes les recettes."}],
["gazosa","Gazosa tessinoise","soft",0,11,0.3,"f2",{fizz:1,col:"#F2F0D0",tip:"La limonade du Tessin, en bouteille à bouchon mécanique. Remplace la limonade dans toutes les recettes."}],
["schorle","Schorle de pomme","soft",0,6.7,0.3,"f2",{fizz:1,col:"#E8C878",tip:"Du jus de pomme coupé d’eau gazeuse, comme le Schorle de Ramseier : moins sucré qu’un jus pur."}],
["rivella_bleu","Rivella bleu","soft",0,1.5,0.3,"f1h1",{fizz:1,col:"#E8E4C8",subs:["rivella"],tip:"La version allégée du Rivella, très peu sucrée."}]
);
// les limonades suisses remplacent la limonade ; le Rivella bleu remplace le rouge
for(const r of ING_RAW){ if(r[0]==="limonade"){ r[7]=r[7]||{}; r[7].subs=[...new Set([...(r[7].subs||[]),"elmer_citro","gazosa"])]; }
  if(r[0]==="rivella"){ r[7]=r[7]||{}; r[7].subs=[...new Set([...(r[7].subs||[]),"rivella_bleu"])]; } }
REC_RAW.push(
["crodino_rocks","Crodino sur glace","sansalcool","build","vin","cubes","#F08A1E",[["crodino",100]],"Rondelle d’orange",{na:1,v:["sanbitter_rocks","crodino_spritz"],n:"Le service recommandé par la marque : bien froid, sur beaucoup de glace."}],
["sanbitter_rocks","Sanbitter sur glace","sansalcool","build","vin","cubes","#D8222A",[["sanbitter",100]],"Rondelle d’orange",{na:1,v:["crodino_rocks"]}],
["crodino_spritz","Spritz sans alcool au Crodino","sansalcool","build","vin","cubes","#F2A040",[["crodino",100],["eau_gazeuse",50,"ml","top"]],"Rondelle d’orange",{na:1,cr:1,v:["crodino_rocks","aperol_spritz","rivella_spritz"]}]
);
