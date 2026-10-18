// ---------- NOUVELLES BOISSONS (1.68) : tonics aromatisés, softs, sans alcool, alcools ----------
// [id, nom, catégorie, degré %, sucre g/100 ml, acidité %, arômes, extra] — sucre relevé sur les étiquettes (fiches des distributeurs) :
// Tonic méditerranéen 7,4 (Fever-Tree, Woolworths NZ / Natural Grocery) ; tonic au sureau 7,8 (Fever-Tree, Tingstad) ;
// tonic léger 3,8 (Fever-Tree Refreshingly Light, Ocado / Waitrose) ; tonic au concombre ≈ 4,7 (déduit des 19 kcal/100 ml de Greendale) ;
// tonic aromatique 7,4 « approché » (seule la version Light est publiée, 4,4 : on reprend le tonic classique) ;
// limonade sicilienne 7,6 (Fever-Tree, Albert Heijn) ; kombucha 3 (médiane Open Food Facts, ~2 300 produits ; acide acétique ≈ 0,4-0,5 %) ;
// saké 15 %, sucre 0,5 à 4,2 (National Research Institute of Brewing, cité par Palate Project) → 2 ;
// bière sans alcool 1,3 (Heineken 0.0) ; prosecco sans alcool 4,5 (Not Guilty) ; gin rosé 37,5 %, 0 g (Gordon's Pink, étiquette) ;
// gin sans alcool 0 g (Seedlip). « Approché » : vin rosé (comme le vin blanc sec), bière blanche et IPA (comme la bière blonde), poiré 3 g.
// Les bières restent en « soft » comme la bière blonde : passées en « vin », elles deviendraient « liqueur » au Labo et fausseraient le style spritz.
ING_RAW.push(
["tonic_med","Tonic méditerranéen","soft",0,7.4,0.3,"b1h2",{fizz:1,col:"#EEF2E4",subs:["tonic"],tip:"Un tonic aux herbes (romarin, thym, citron), comme le Mediterranean de Fever-Tree. Parfait avec un gin herbacé et une branche de romarin."}],
["tonic_sureau","Tonic au sureau","soft",0,7.8,0.3,"b1l2",{fizz:1,col:"#F0F0DC",subs:["tonic"],tip:"Un tonic parfumé à la fleur de sureau, comme l’Elderflower de Fever-Tree. Doux et floral : bien avec un gin léger et du concombre."}],
["tonic_aromatique","Tonic aromatique","soft",0,7.4,0.3,"b2e1",{fizz:1,col:"#F2C8C0",subs:["tonic"],tip:"Un tonic rosé à l’écorce d’angostura, comme l’Aromatic de Fever-Tree : plus amer et épicé. Va bien avec un gin aux agrumes ou un rhum ambré."}],
["tonic_concombre","Tonic au concombre","soft",0,4.7,0.3,"b1h1",{fizz:1,col:"#E4F0DC",subs:["tonic"],tip:"Un tonic au concombre, peu sucré, comme le Cucumber de Fever-Tree. Le compagnon naturel d’un gin floral."}],
["tonic_leger","Tonic léger","soft",0,3.8,0.3,"b1",{fizz:1,col:"#F0F4F0",subs:["tonic"],tip:"Un tonic moitié moins sucré, comme le Refreshingly Light de Fever-Tree : laisse davantage parler le gin."}],
["limonade_sicilienne","Limonade sicilienne","soft",0,7.6,0.4,"f2",{fizz:1,col:"#F4EEB0",subs:["limonade"],tip:"Une limonade aux citrons de Sicile, plus acidulée qu’une limonade classique, comme la Sicilian Lemonade de Fever-Tree."}],
["kombucha","Kombucha","soft",0,3,0.45,"f1h1",{fizz:1,col:"#E8C88A",tip:"Du thé fermenté, légèrement pétillant et acidulé. Au gingembre, il remplace la ginger beer dans un mule sans alcool, en moins sucré."}],
["gin_0","Gin sans alcool","spirit",0,0,0,"h2f1",{col:"#E8EEE8",subs:["gin"],tip:"Un distillat de plantes sans alcool ni sucre, comme Seedlip ou un gin 0,0 %. Se sert comme un gin, 5 cl pour 15 cl de tonic."}],
["prosecco_0","Prosecco sans alcool","vin",0,4.5,0.5,"f1",{fizz:1,col:"#F2EDC0",tip:"Un mousseux désalcoolisé : un peu plus sucré qu’un prosecco brut. Remplace le prosecco dans un spritz ou un Hugo sans alcool."}],
["biere_0","Bière sans alcool","soft",0,1.3,0.2,"b1",{fizz:1,col:"#E8C050",subs:["biere"],tip:"Une blonde à 0,0 %, comme la Heineken 0.0 : pour un panaché sans alcool."}],
["vin_rose","Vin rosé","vin",12,0.3,0.55,"f2",{col:"#F4B8B0",tip:"Un rosé sec et fruité, comme un œil-de-perdrix de Neuchâtel ou un rosé de Provence. Bien frais pour un spritz."}],
["sake","Saké","vin",15,2,0.15,"f1l1",{col:"#F4F0E0",tip:"L’alcool de riz japonais, autour de 15 %. Un junmai sec se marie avec le tonic ou remplace le vermouth dans un Martini."}],
["biere_blanche","Bière blanche","soft",5,0.5,0.25,"f1e1",{fizz:1,col:"#F2E2A0",subs:["biere"],tip:"Une bière de blé non filtrée, à la coriandre et à l’écorce d’orange, comme la Hoegaarden ou une blanche artisanale suisse."}],
["ipa","IPA","soft",6.5,0.5,0.2,"b3f1",{fizz:1,col:"#D8A040",subs:["biere"],tip:"Une India Pale Ale, très houblonnée : amère et fruitée (agrumes, fruits exotiques). Le degré varie de 5 à 7 %."}],
["poire","Poiré","vin",5,3,0.4,"f2",{fizz:1,col:"#EEE0A0",subs:["cidre"],tip:"Le « cidre » de poire, pétillant et fruité. Se sert comme un cidre, frais, ou en kir avec un trait de cassis."}],
["tequila_repo","Tequila reposado","spirit",40,0,0,"w1h1e1",{col:"#E8C890",subs:["tequila"],tip:"Une tequila reposée de 2 à 12 mois en fût de chêne : plus ronde et vanillée qu’une blanco. La base de l’Oaxaca Old Fashioned."}],
["gin_rose","Gin rosé","spirit",37.5,0,0,"f2h1",{col:"#F4C0C8",subs:["gin"],tip:"Un gin aux fruits rouges, comme le Gordon’s Pink : plus fruité qu’un London Dry. Avec un tonic et des fraises."}]
);
// substituts dans les deux sens : un tonic aromatisé dépanne pour un tonic classique, et inversement (« avec substitut »)
{ const addSubs=(id,list)=>{ for(const r of ING_RAW){ if(r[0]===id){ r[7]=r[7]||{}; r[7].subs=[...new Set([...(r[7].subs||[]),...list])]; } } };
  addSubs("tonic",["tonic_med","tonic_sureau","tonic_aromatique","tonic_concombre","tonic_leger"]);
  addSubs("limonade",["limonade_sicilienne"]); addSubs("biere",["biere_blanche","ipa","biere_0"]); addSubs("cidre",["poire"]);
  addSubs("tequila",["tequila_repo"]); addSubs("gin",["gin_rose"]); }
// recettes : sources dans data/verif.json
REC_RAW.push(
["gt_med","Gin tonic méditerranéen","highball","build","highball","cubes","#EEF2E4",[["gin",50],["tonic_med",150,"ml","top"]],"Branche de romarin et zeste de citron",{v:["gin_tonic","gt_sureau"],n:"Le service de Fever-Tree : 5 cl de gin pour 15 cl de tonic, sur beaucoup de glace. Un gin herbacé lui va bien."}],
["gt_sureau","Gin tonic au sureau","highball","build","highball","cubes","#F0F0DC",[["gin",50],["tonic_sureau",150,"ml","top"]],"Rondelle de concombre et menthe",{v:["gin_tonic","gt_concombre"]}],
["gt_concombre","Gin tonic au concombre","highball","build","highball","cubes","#E4F0DC",[["gin",50],["tonic_concombre",150,"ml","top"]],"Ruban de concombre",{v:["gin_tonic"]}],
["gt_aromatique","Gin tonic aromatique","highball","build","highball","cubes","#F2C8C0",[["gin",50],["tonic_aromatique",150,"ml","top"]],"Zeste d’orange",{v:["gin_tonic","pink_gt"],n:"Le tonic à l’angostura le teinte en rose : plus amer et épicé qu’un gin tonic classique."}],
["pink_gt","Pink gin tonic","highball","build","highball","cubes","#F4C0C8",[["gin_rose",50],["tonic",150,"ml","top"]],"Fraises coupées",{v:["gin_tonic","gin_fraise"]}],
["gt_0","Gin tonic sans alcool","sansalcool","build","highball","cubes","#E8EEE8",[["gin_0",50],["tonic",150,"ml","top"]],"Zeste de pamplemousse",{na:1,v:["gin_tonic"],n:"Le service de la marque Seedlip : 5 cl pour 15 cl de tonic, sur glace."}],
["sake_tonic","Saké tonic","highball","build","highball","cubes","#F4F0E0",[["sake",100],["tonic",70,"ml","top"]],"Tranches de pomme verte",{v:["gin_tonic","saketini"]}],
["saketini","Saketini","stirred","shake","coupe","none","#F2F0E4",[["gin",60],["sake",15]],"Rondelle de concombre",{v:["martini","vodka_martini","sake_tonic"],n:"Un Martini où le saké remplace le vermouth, autour de 4 pour 1."}],
["rose_spritz","Spritz rosé au sureau","bulles","build","vin","cubes","#F4B8B0",[["vin_rose",125],["sirop_sureau",25],["eau_gazeuse",75,"ml","top"]],"Rondelle de citron ou menthe",{v:["hugo","aperol_spritz"]}],
["snakebite","Snakebite","highball","build","highball","none","#E8C860",[["cidre",150],["biere",150,"ml","top"]],"Aucune",{v:["panache"],n:"Moitié cidre, moitié bière blonde, sans glace. Avec un trait de cassis, il devient un « Snakebite and Black »."}],
["kombucha_mule","Mule au kombucha","sansalcool","build","mug","cubes","#E8C88A",[["citron_vert",15],["kombucha",120,"ml","top"]],"Quartier de citron vert et menthe",{na:1,v:["virgin_mule","moscow_mule"],n:"Prends un kombucha au gingembre : il fait le travail de la ginger beer, en moins sucré."}],
["hugo_0","Hugo sans alcool","sansalcool","build","vin","cubes","#E8EDC8",[["prosecco_0",150],["sirop_sureau",20],["eau_gazeuse",30],["menthe",6,"f"],["citron_vert",10,"ml","opt"]],"Menthe et rondelle de citron vert",{na:1,v:["hugo"]}],
["panache_0","Panaché sans alcool","sansalcool","build","highball","none","#F2DC90",[["biere_0",150],["limonade",150]],"Aucune",{na:1,v:["panache"]}]

);
// familles de spiritueux (modèle de goût, Labo) : les nouvelles bases rejoignent leur famille
Object.assign(SPIRIT_GROUP,{gin_rose:"gin",gin_0:"gin",tequila_repo:"agave"});
