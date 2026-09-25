// ---------- SANS ALCOOL ----------
FAMILIES.sansalcool="Sans alcool";
REC_RAW.forEach(r=>{ if(r[0]==="espresso_tonic") r[2]="sansalcool"; });
REC_RAW.push(
["nojito","Nojito","sansalcool","mbuild","highball","pilee","#DDEEC8",[["citron_vert",25],["sirop_sucre",20],["menthe",8,"f"],["eau_gazeuse",120,"ml","top"]],"Branche de menthe",{na:1,c:1,v:["mojito","basil_lemonade"],n:"Toute la fraîcheur du Mojito. Un trait de ginger beer à la place d’une partie de l’eau gazeuse lui donne du caractère."}],
["shirley_temple","Shirley Temple","sansalcool","build","highball","cubes","#F2A0A8",[["citron",10],["grenadine",15,"ml","float"],["ginger_ale",150,"ml","top"]],"Cerise et rondelle d’orange",{na:1,c:1,v:["roy_rogers"],h:"Dit-on créé dans les années 1930 pour l’enfant star Shirley Temple, qui accompagnait ses parents dans les restaurants d’Hollywood. Elle a toujours affirmé ne pas l’aimer, le trouvant trop sucré."}],
["roy_rogers","Roy Rogers","sansalcool","build","highball","cubes","#5A1E18",[["grenadine",15],["cola",150,"ml","top"]],"Cerise",{na:1,c:1,v:["shirley_temple"],h:"Le pendant du Shirley Temple, nommé d’après Roy Rogers, cow-boy chantant des westerns des années 1940."}],
["virgin_mary","Virgin Mary","sansalcool","build","highball","cubes","#C03A2A",[["tomate",120],["citron",15],["worcestershire",2,"d"],["tabasco",2,"d"]],"Branche de céleri, sel et poivre",{na:1,c:1,v:["bloody_mary"]}],
["virgin_colada","Virgin Colada","sansalcool","shake","highball","pilee","#F4EAD0",[["creme_coco",40],["ananas",90],["citron_vert",10]],"Quartier d’ananas",{na:1,c:1,v:["pina_colada"]}],
["sureau_fizz","Sureau pétillant","sansalcool","build","vin","cubes","#EEF0C8",[["sirop_sureau",25],["citron",15],["menthe",4,"f"],["eau_gazeuse",150,"ml","top"]],"Menthe et rondelle de citron",{na:1,s:1,v:["hugo","sureau_tonic"],se:[5,6,7,8],n:"L’apéritif sans alcool des terrasses suisses en été. Avec un sirop de sureau maison, c’est encore meilleur."}],
["arnold_palmer","Arnold Palmer","sansalcool","build","highball","cubes","#C8903A",[["the_froid",100],["citron",20],["sirop_sucre",15],["eau",60]],"Rondelle de citron",{na:1,c:1,h:"Moitié thé glacé, moitié citronnade : la boisson que le golfeur Arnold Palmer commandait après ses parcours, dans les années 1960."}],
["cinderella","Cinderella","sansalcool","shake","highball","cubes","#F5B060",[["orange",45],["ananas",45],["citron",15],["grenadine",10],["eau_gazeuse",60,"ml","top"]],"Rondelle d’orange et cerise",{na:1,c:1}],
["virgin_mule","Mule sans alcool","sansalcool","build","mug","cubes","#E8E0B8",[["citron_vert",15],["menthe",4,"f"],["concombre",2,"u"],["ginger_beer",150,"ml","top"]],"Menthe et citron vert",{na:1,v:["moscow_mule"]}],
["framboise_lemonade","Limonade à la framboise","sansalcool","build","highball","cubes","#E8607A",[["sirop_framboise",20],["citron",20],["eau_gazeuse",150,"ml","top"]],"Framboises et rondelle de citron",{na:1,se:[6,7,8]}],
["passion_fizz","Passion pétillant","sansalcool","build","highball","cubes","#F2C050",[["sirop_passion",20],["citron_vert",15],["eau_gazeuse",150,"ml","top"]],"Rondelle de citron vert",{na:1}],
["cafe_frappe","Café frappé vanille","sansalcool","shake","rocks","cubes","#B8906A",[["espresso",45],["lait",90],["sirop_vanille",15]],"Grains de café",{na:1,v:["espresso_tonic"],n:"Secoue longtemps : le lait mousse et le café devient crémeux."}],
["mangue_mule","Mule mangue sans alcool","sansalcool","build","mug","cubes","#F2B840",[["mangue",60],["citron_vert",15],["ginger_beer",100,"ml","top"]],"Rondelle de citron vert",{na:1,v:["mango_mule","virgin_mule"]}],
["pomme_gingembre","Pomme gingembre","sansalcool","build","highball","cubes","#E8C070",[["pomme",90],["sirop_gingembre",15],["citron",10],["eau_gazeuse",60,"ml","top"]],"Fine tranche de pomme",{na:1,s:1,cr:1,se:[9,10,11],n:"Avec un jus de pomme suisse trouble, le gingembre réveille le fruit."}],
["sureau_tonic","Sureau tonic","sansalcool","build","highball","cubes","#EEF2DC",[["sirop_sureau",20],["concombre",2,"u"],["tonic",150,"ml","top"]],"Rondelle de concombre",{na:1,s:1,cr:1,v:["sureau_fizz"]}],
["diabolo_grenadine","Diabolo grenadine","sansalcool","build","highball","cubes","#F07888",[["grenadine",20],["limonade",180,"ml","top"]],"Aucune",{na:1,c:1,v:["diabolo_menthe"],h:"Le diabolo, limonade et sirop, est la boisson des terrasses françaises et romandes depuis des générations."}],
["diabolo_menthe","Diabolo menthe","sansalcool","build","highball","cubes","#8AD890",[["sirop_menthe",20],["limonade",180,"ml","top"]],"Feuille de menthe",{na:1,c:1,v:["diabolo_grenadine"]}],
["virgin_sunrise","Sunrise sans alcool","sansalcool","build","highball","cubes","#F5A04A",[["orange",150],["grenadine",15,"ml","float"]],"Rondelle d’orange",{na:1,v:["tequila_sunrise"]}],
["basil_lemonade","Citronnade au basilic","sansalcool","mbuild","highball","cubes","#D8EBA8",[["basilic",8,"f"],["citron",25],["sirop_sucre",20],["eau_gazeuse",120,"ml","top"]],"Feuille de basilic",{na:1,v:["nojito","gin_basil_smash"]}]
);

// ---------- LEXIQUE ----------
// [clé, expression à repérer, terme, définition]
const TERMS=[
["t1",/verre à mélange/i,"Verre à mélange","Un grand verre à fond épais dans lequel on remue les cocktails sans jus ni œuf. On remue au lieu de secouer pour garder une texture soyeuse et limpide. Un grand verre ou un pot mesureur dépanne très bien."],
["t2",/cuillère de bar/i,"Cuillère de bar","Une cuillère au long manche torsadé, pour remuer dans le verre à mélange. Elle mesure environ 5 ml. Une longue cuillère à café fait l’affaire."],
["t3",/sans glace pour monter la mousse/i,"Dry shake","Secouer d’abord sans glace : le blanc d’œuf s’émulsionne mieux et donne une mousse dense et durable. On ajoute la glace ensuite pour refroidir."],
["t4",/petite passoire/i,"Double filtrage","On verse à travers une seconde passoire fine pour retenir les éclats de glace et de fruit. La texture devient parfaitement lisse."],
["t5",/Filtre/,"Filtrer","Verser le cocktail en retenant la glace, avec la passoire du shaker ou une passoire à cocktail."],
["t6",/Écrase délicatement/i,"Piler","Presser doucement herbes ou fruits au fond du verre pour libérer leurs arômes (« muddle » en anglais). Trop fort, la menthe devient amère."],
["t7",/Rince/,"Rincer le verre","On fait tourner quelques gouttes d’un alcool très parfumé, souvent l’absinthe, pour en tapisser la paroi, puis on jette l’excédent. Il ne reste qu’un parfum."],
["t8",/dos d’une cuillère/i,"Faire flotter","Verser très lentement sur le dos d’une cuillère tenue juste au-dessus de la surface : le liquide reste en couche au lieu de se mélanger."],
["t9",/en filet/i,"En filet","Un mince filet continu. Les liqueurs très sucrées, plus denses, coulent alors lentement et dessinent un dégradé."],
["t10",/glace pilée/i,"Glace pilée","De la glace concassée. Elle refroidit très vite et dilue davantage, parfait pour les juleps, mojitos et tiki. Maison : des glaçons dans un torchon et quelques coups de rouleau à pâtisserie."],
["t11",/gros glaçon/i,"Gros glaçon","Un gros cube fond lentement : le cocktail reste froid sans se diluer trop vite. Voir la technique « Glace limpide » dans le labo."],
["t12",/Complète/,"Compléter","Ajouter en dernier la boisson gazeuse ou le vin pétillant, doucement, pour garder un maximum de bulles."],
["t13",/zeste/i,"Zeste","Un morceau de peau d’agrume sans le blanc amer. On le presse au-dessus du verre pour projeter ses huiles parfumées (on dit « l’exprimer »), puis on le dépose ou on le retire."],
["t14",/refroidie?\b/i,"Refroidir le verre","Un verre glacé garde le cocktail frais bien plus longtemps, surtout pour ceux servis sans glace."],
["t15",/remue doucement/i,"Remuer","Faire tourner la glace avec une cuillère de bar, le dos contre la paroi, pendant une trentaine de secondes. On refroidit et dilue sans aérer."],
["t16",/traits?\b/,"Trait","Une giclée de bouteille à bec verseur, soit environ 0,8 ml. On l’utilise surtout pour les bitters."],
["t17",/shaker/i,"Shaker","Le gobelet dans lequel on secoue le cocktail avec de la glace : il refroidit, dilue et aère en une douzaine de secondes. Pas de shaker ? Un bocal à confiture bien fermé fonctionne très bien."]
];
