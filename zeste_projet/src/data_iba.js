// ---- v1.21 : alignement sur les recettes officielles de l’IBA (iba-world.com, relevé d’août 2025) ----
ING_RAW.push(
["sucre_poudre","Sucre en poudre","frais",0,160,0,"",{u:"bs",bsml:2.5,tip:"Du sucre fin : il se dissout plus vite que le sucre cristallisé. Une cuillère à café pèse environ 4 g."}],
["sucre_vanille","Sucre vanillé","frais",0,160,0,"k2",{u:"bs",bsml:2.5,tip:"En sachets, au rayon pâtisserie."}],
["miel","Miel","frais",0,115,0,"l1",{col:"#E8B84A",tip:"Un miel liquide de fleurs, au goût neutre."}],
["sel","Sel","frais",0,0,0,"",{u:"u",uL:["pincée","pincées"]}],
["citron_vert_fr","Citron vert en quartiers","jus",0,1.6,6,"f2",{u:"u",uL:["fruit","fruits"],yml:25,col:"#E4EDB0",tip:"Un citron vert entier, coupé en quartiers et pilé : le zeste libère ses huiles parfumées."}],
["citron_fr","Citron frais","jus",0,2.5,6,"f1",{u:"u",uL:["quart de rondelle","quarts de rondelle"],yml:3,col:"#F4EFA8"}],
["orange_fr","Orange fraîche","jus",0,9,0.8,"f2",{u:"u",uL:["quart de rondelle","quarts de rondelle"],yml:5,col:"#F5A93A"}],
["ananas_fr","Ananas frais","jus",0,10,0.8,"f3",{u:"u",uL:["morceau","morceaux"],yml:10,col:"#F5DB7A"}],
["gingembre","Gingembre frais","frais",0,0,0,"e3",{u:"u",uL:["tranche","tranches"],col:"#E8D8A0",tip:"Une racine ferme et lisse ; inutile de l’éplucher pour la piler."}],
["clou_girofle","Clous de girofle","frais",0,0,0,"e3w1",{u:"u",uL:["clou","clous"],col:"#6A4030"}],
["vanille","Extrait de vanille","frais",0,0,0,"k2",{u:"gt",col:"#5A3A20",tip:"Un extrait naturel, au rayon pâtisserie. Quelques gouttes suffisent."}],
["jaune_oeuf","Jaune d’œuf","frais",0,0,0,"k3",{col:"#F2C84A"}],
["old_tom","Old Tom gin","spirit",40,1,0,"h2f1k1",{col:"#E8ECE4",subs:["gin"],tip:"Un gin légèrement adouci, dans le style du XIXe siècle. Hayman’s Old Tom est le plus facile à trouver."}],
["vodka_vanille","Vodka vanille","spirit",38,0,0,"k2",{col:"#EEE8DA",subs:["vodka"],tip:"Une vodka aromatisée à la vanille, comme Absolut Vanilia, ou une vodka où a infusé une gousse fendue."}],
["passion_puree","Purée de fruit de la passion","jus",0,11,3.5,"f3",{col:"#F2B830",tip:"Au rayon surgelé ou chez les grossistes. À défaut, la pulpe de fruits frais passée au tamis."}],
["jus_canne","Jus de canne","jus",0,18,0.1,"f1",{col:"#E8E4B0",subs:["sirop_sucre"],tip:"Le jus pressé de la canne à sucre, parfois vendu frais ou surgelé dans les épiceries antillaises ou asiatiques."}],
["sirop_cannelle","Sirop de cannelle","sirop",0,60,0,"e3w1",{col:"#C88A50",tip:"Monin, ou maison : un sirop de sucre dans lequel ont infusé des bâtons de cannelle."}],
["allspice","Liqueur de piment de la Jamaïque","liqueur",22.5,25,0,"e3w1",{ref:15,col:"#8A3A20",tip:"L’« allspice dram » (St. Elizabeth, Pimento Dram). Très épicée : quelques millilitres suffisent dans un cocktail tiki."}],
["frangelico","Liqueur de noisette","liqueur",20,30,0,"w2k1",{col:"#C8904A",tip:"Frangelico est la plus connue."}],
["cordial_camomille","Cordial de camomille","sirop",0,55,0.5,"l2",{col:"#F0E4A0",tip:"Rare dans le commerce : fais infuser de la camomille dans un sirop de sucre, avec un peu de jus de citron."}]
);
BASICS.push("sucre_poudre","miel","sel","citron_vert_fr","citron_fr","jaune_oeuf");
SPIRIT_GROUP.old_tom="gin"; SPIRIT_GROUP.vodka_vanille="vodka";
REC_RAW.push(
["angel_face","Angel Face","stirred","shake","coupe","none","#E8A860",[["gin",30],["abricot",30],["calvados",30]],"Aucune",{c:1,h:"Publié en 1930 dans le Savoy Cocktail Book de Harry Craddock. Trois spiritueux à parts égales : il est bien plus fort que son nom ne le laisse croire."}],
["casino","Casino","sour","shake","rocks","cubes","#F0EAD0",[["old_tom",40],["maraschino",10],["citron",10],["orange_bitters",2,"d"]],"Zeste de citron et cerise à cocktail",{c:1,v:["aviation"],h:"Il apparaît en 1909 dans « The Reminder » de Jacob Didier, puis chez Hugo Ensslin en 1916 et dans le Savoy Cocktail Book en 1930. Un cousin de l’Aviation, sans crème de violette."}],
["dons_daiquiri","Don’s Special Daiquiri","tiki","shake","vin","pilee","#F2C860",[["rhum_jam",30],["rhum_blanc",15],["sirop_passion",15],["citron_vert",15],["sirop_miel",15]],"Demi-fruit de la passion",{c:1,v:["daiquiri"],n:"L’IBA demande un rhum doré jamaïcain et un rhum cubain : un rhum blanc léger de style cubain convient pour le second.",h:"Une création de Donn Beach, alias Don the Beachcomber, dérivée de son Mona Daiquiri de 1934, déjà au miel et au fruit de la passion.",st:["Mets tous les ingrédients dans un blender avec de la glace pilée.","Mixe quelques secondes.","Verse dans un verre à pied et complète avec de la glace pilée."]}],
["grand_margarita","Grand Margarita","sour","shake","rocks","cubes","#F0D890",[["tequila",45],["grand_marnier",30],["citron_vert",15]],"Bord de sel et rondelle de citron vert",{c:1,v:["margarita","cadillac_margarita"]}],
["iba_tiki","IBA Tiki","tiki","shake","highball","pilee","#F2C050",[["rhum_ambre",60],["amaretto",15],["frangelico",5],["maraschino",5,"gt"],["passion_puree",30],["ananas",90],["citron_vert",30],["gingembre",1,"u"]],"Agrumes et tranche d’ananas séchée",{c:1,n:"L’IBA précise deux rhums Havana Club, Profundo et Smoky, 30 ml de chaque : un rhum ambré les remplace ici.",st:["Pile une fine tranche de gingembre au fond du shaker.","Ajoute tous les autres ingrédients et de la glace.",["Secoue vigoureusement.",12],"Filtre dans un verre tiki, ou un grand verre, rempli de glace pilée."]}],
["illegal","Illegal","sour","shake","coupe","none","#EEEED8",[["mezcal",30],["rhum_jam",15],["falernum",15],["maraschino",1,"bs"],["citron_vert",22.5],["sirop_sucre",15],["blanc_oeuf",15,"ml","opt"]],"Aucune",{c:1,n:"L’IBA demande un rhum blanc jamaïcain « overproof », à plus de 60 % : un rhum jamaïcain classique en donne une version plus douce. Il peut aussi se servir sur glace, dans une tasse en terre cuite.",h:"Attribué au barman italien Samuele Ambrosi, qui l’a mis au point au début des années 2000."}],
["paradise","Paradise","sour","shake","coupe","none","#F2B048",[["gin",30],["abricot",20],["orange",15]],"Aucune",{c:1,h:"Il apparaît en 1922 dans le livre de Harry MacElhone, puis dans le Savoy Cocktail Book de Harry Craddock en 1930."}],
["russian_spring_punch","Russian Spring Punch","bulles","shake","highball","cubes","#C84A6A",[["vodka",25],["citron",25],["cassis",15],["sirop_sucre",10],["champagne",90,"ml","top"]],"Mûres, et rondelle de citron (facultative)",{c:1,v:["kir_royal"],h:"Créé dans les années 1980 à Londres par Dick Bradsell, pour une fête où chaque invité apportait son champagne. Il le décrivait comme un Kir royal renforcé, servi sur glace."}],
["spicy_fifty","Spicy Fifty","sour","shake","coupe","none","#F0E0B0",[["vodka_vanille",50],["sirop_sureau",15],["citron_vert",15],["sirop_miel",10],["piment",2,"u"]],"Piment rouge",{c:1,h:"Créé par Salvatore Calabrese pour la carte d’ouverture de son bar Fifty, à Londres, en 2005 : vanille, sureau et piment rouge."}],
["vento","Ve.N.To","sour","shake","rocks","cubes","#F2E8C0",[["grappa",45],["citron",22.5],["sirop_miel",15],["cordial_camomille",15],["blanc_oeuf",15,"ml","opt"]],"Zeste de citron et raisins blancs",{c:1,n:"Pour le sirop de miel, l’IBA suggère de remplacer l’eau par une infusion de camomille.",h:"Le premier cocktail à la grappa entré dans la liste de l’IBA, en 2020. Créé par les barmen Samuele Ambrosi et Leonardo Veronesi, son nom vient de leurs régions : la Vénétie et le Trentin."}]
);
