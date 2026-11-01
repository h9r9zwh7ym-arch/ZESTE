// ---------- EXTENSION FINALE ----------
ING_RAW.push(
["piment","Piment frais","frais",0,0,0,"e3",{}],
["fraise_puree","Purée de fraise","jus",0,9,0.8,"f3",{col:"#E0405A",tip:"Des fraises mixées et passées au tamis, avec une cuillère de sucre si elles manquent de goût. En hiver, des fraises surgelées font très bien l’affaire."}],
["chocolat_chaud","Chocolat chaud","frais",0,9,0,"w2k2",{}],
["eierlikor","Liqueur aux œufs","liqueur",20,25,0,"k3w1",{col:"#F2DC80",tip:"L’Eierlikör des pays alpins (Verpoorten est partout), épais et vanillé. Au frigo après ouverture."}]
);
REC_RAW.push(
["spicy_margarita","Margarita pimentée","sour","shake","rocks","cubes","#E0E8B0",[["tequila",50],["triple_sec",15],["citron_vert",25],["sirop_agave",10],["piment",2,"u"]],"Rondelle de piment, bord de sel",{c:1,v:["margarita","tommys"],n:"Écrase deux rondelles de piment dans le shaker. Goûte avant d’en ajouter : ça monte vite."}],
["london_mule","Gin Mule","highball","build","mug","cubes","#E4E8C8",[["gin",45],["citron_vert",15],["ginger_beer",120,"ml","top"]],"Rondelle de concombre et citron vert",{v:["moscow_mule","gin_gin_mule"]}],
["aperol_sour","Aperol Sour","sour","shake","coupe","none","#F2A060",[["aperol",45],["citron",25],["sirop_sucre",10],["blanc_oeuf",20]],"Zeste d’orange",{v:["aperol_spritz","amaretto_sour"],n:"L’Aperol n’est pas très fort : ce sour reste léger, parfait pour l’apéro."}],
["rossini","Rossini","bulles","build","flute","none","#E8606A",[["fraise_puree",40],["prosecco",100,"ml","top"]],"Aucune",{c:1,se:[5,6,7],v:["bellini","mimosa"],h:"Le cousin du Bellini à la fraise, nommé d’après le compositeur Gioachino Rossini."}],
["daiquiri_fraise","Daiquiri fraise","sour","shake","coupe","none","#E8506A",[["rhum_blanc",50],["fraise_puree",40],["citron_vert",20],["sirop_sucre",10]],"Une fraise sur le bord",{c:1,se:[5,6,7],v:["daiquiri"]}],
["mojito_fraise","Mojito fraise","herbes","mbuild","highball","pilee","#E87A8A",[["rhum_blanc",45],["fraise_puree",30],["citron_vert",20],["sirop_sucre",15],["menthe",8,"f"],["eau_gazeuse",60,"ml","top"]],"Branche de menthe et fraise",{se:[5,6,7,8],v:["mojito"]}],
["gin_fraise","Gin tonic fraise","highball","build","vin","cubes","#F2A0A8",[["gin",40],["fraise_puree",30],["tonic",120,"ml","top"]],"Fraises et basilic",{se:[5,6,7],v:["gin_tonic"]}],
["lumumba","Lumumba","chaud","hot","tasse","none","#5A3020",[["chocolat_chaud",200],["rhum_brun",40],["creme",30,"ml","float"]],"Cacao en poudre",{c:1,se:[11,12,1,2],v:["irish_coffee"],h:"Le chocolat chaud au rhum des pistes de ski et des marchés de Noël, en Allemagne, en Autriche et en Suisse alémanique."}],
["bombardino","Bombardino","chaud","hot","tasse","none","#F2D890",[["eierlikor",60],["cognac",30],["creme",30,"ml","float"]],"Cannelle en poudre",{c:1,se:[12,1,2],v:["lumumba","eggnog"],n:"Chauffe doucement la liqueur aux œufs et le cognac sans les faire bouillir.",h:"La boisson chaude des stations de ski italiennes. Son nom viendrait de l’effet « bombe » qu’elle fait après une journée dans le froid."}],
["snowball","Snowball","highball","build","highball","cubes","#F4E8B0",[["eierlikor",50],["citron_vert",10],["limonade",150,"ml","top"]],"Cerise",{c:1,se:[12,1],h:"Un classique des fêtes de Noël britanniques des années 1970, doux et crémeux."}],
["schumli_pflumli","Schümli Pflümli","chaud","hot","tasse","none","#7A5030",[["cafe",120],["sirop_sucre",10],["pflumli",30],["creme",30,"ml","float"]],"Aucune",{c:1,s:1,se:[10,11,12,1,2,3],v:["kafi_fertig","kafi_luz"],h:"Café, pflümli et crème fouettée : un classique des cafés suisses, rendu célèbre par une chanson de Hazy Osterwald dans les années 1960."}],
["vodka_tonic","Vodka tonic","highball","build","highball","cubes","#EEF3F2",[["vodka",50],["tonic",150,"ml","top"]],"Quartier de citron vert",{v:["gin_tonic"]}],
["mezcal_tonic","Mezcal tonic","highball","build","highball","cubes","#EEEFE4",[["mezcal",45],["tonic",150,"ml","top"]],"Rondelle d’orange",{v:["gin_tonic","mezcal_mule"]}],
["whisky_ginger","Whisky ginger","highball","build","highball","cubes","#E8C890",[["bourbon",50],["ginger_ale",150,"ml","top"]],"Quartier de citron",{c:1,v:["presbyterian","horses_neck"]}],
["kir_normand","Kir normand","bulles","build","vin","none","#B0506A",[["cassis",15],["cidre",120]],"Aucune",{v:["kir","kir_royal"]}],
["cynar_spritz","Cynar Spritz","bulles","build","vin","cubes","#6A4020",[["cynar",50],["prosecco",90],["eau_gazeuse",30]],"Rondelle d’orange",{v:["aperol_spritz","campari_spritz"]}],
["rum_punch","Rhum punch","tiki","build","highball","cubes","#E87A3A",[["rhum_ambre",45],["citron_vert",20],["grenadine",10],["orange",60],["ananas",60],["angostura",2,"d"]],"Rondelle d’orange et cerise",{c:1,v:["planters"]}],
["citronnade","Citronnade maison","sansalcool","build","highball","cubes","#F4F0B0",[["citron",30],["sirop_sucre",25],["menthe",4,"f","opt"],["eau_gazeuse",150,"ml","top"]],"Rondelle de citron",{na:1,v:["basil_lemonade","nojito"]}],
["the_peche","Thé glacé pêche maison","sansalcool","build","highball","cubes","#E8B070",[["the_froid",150],["peche_puree",30],["citron",10]],"Rondelle de citron",{na:1,se:[6,7,8]}],
["cranberry_fizz","Canneberge pétillante","sansalcool","build","highball","cubes","#D83A5A",[["canneberge",90],["citron_vert",15],["eau_gazeuse",90,"ml","top"]],"Quartier de citron vert",{na:1}],
["ginger_lemonade","Limonade au gingembre","sansalcool","build","highball","cubes","#EEDC98",[["sirop_gingembre",20],["citron",20],["eau_gazeuse",150,"ml","top"]],"Rondelle de citron",{na:1,v:["virgin_mule"]}],
["most_chaud","Jus de pomme chaud épicé","sansalcool","hot","tasse","none","#D8A050",[["pomme",180],["sirop_miel",10],["citron",5]],"Bâton de cannelle et clous de girofle",{na:1,s:1,se:[11,12,1,2],n:"Chauffe doucement le jus avec la cannelle et deux clous de girofle, sans bouillir. En Suisse alémanique, on l’appelle Glühmost."}],
["virgin_fraise","Fraise basilic pétillant","sansalcool","mbuild","highball","cubes","#E86A7A",[["fraise_puree",40],["citron",15],["sirop_sucre",10],["basilic",4,"f"],["eau_gazeuse",120,"ml","top"]],"Fraise et basilic",{na:1,se:[5,6,7]}]
);
