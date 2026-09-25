// ---------- LABO : TECHNIQUES ----------
const TECH = [
{id:"sirops",n:"Sirops de base",t:"5 min",lvl:"Facile",d:"La base de presque tout. Maison, c’est moins cher, meilleur, et tu contrôles le sucre.",
 st:["Sirop simple : un volume de sucre pour un volume d’eau chaude, remue jusqu’à dissolution.","Sirop riche : deux volumes de sucre pour un d’eau. Plus dense, il se garde plus longtemps ; utilises-en un tiers de moins.","Sirop de miel : trois parts de miel pour une part d’eau chaude, sinon le miel ne se mélange pas à froid.","Laisse refroidir et verse dans une bouteille propre, au frigo."],
 k:"Simple : environ 1 mois au frigo. Riche : 2 mois.",u:["sirop_sucre","sirop_miel"],p:["simple","riche","miel"]},
{id:"gingembre",n:"Sirop de gingembre",t:"15 min",lvl:"Facile",d:"Le piquant frais du gingembre, bien plus vif que n’importe quel sirop du commerce.",
 st:["Mixe 200 g de gingembre non pelé, lavé et coupé en morceaux, avec un peu d’eau.","Presse la purée dans un linge fin pour récupérer le jus.","Pèse le jus et ajoute le même poids de sucre, sans chauffer.","Remue jusqu’à dissolution complète."],
 k:"Environ 2 semaines au frigo.",u:["sirop_gingembre"],p:["gingembre"]},
{id:"grenadine",n:"Grenadine maison",t:"15 min",lvl:"Facile",d:"Une vraie grenadine est acidulée et profonde, rien à voir avec le sirop rouge fluo.",
 st:["Chauffe doucement 250 ml de jus de grenade 100 % avec 250 g de sucre, sans faire bouillir.","Remue jusqu’à dissolution, puis retire du feu.","Ajoute quelques gouttes d’eau de fleur d’oranger une fois refroidi."],
 k:"Environ 3 semaines au frigo.",u:["grenadine"],p:["grenadine"]},
{id:"orgeat",n:"Orgeat maison",t:"45 min",lvl:"Moyen",d:"Le sirop d’amande du Mai Tai. Fait maison, il a un goût d’amande torréfiée incomparable.",
 st:["Torréfie légèrement 200 g d’amandes émondées à la poêle, puis laisse refroidir.","Mixe-les avec 400 ml d’eau pendant une minute.","Filtre dans une étamine en pressant bien.","Pèse le lait obtenu et ajoute le même poids de sucre, remue jusqu’à dissolution.","Ajoute une cuillère à café d’eau de fleur d’oranger et 15 ml de cognac ou de vodka pour la conservation."],
 k:"Environ 2 semaines au frigo. Secoue avant usage.",u:["orgeat"],p:["orgeat"]},
{id:"sureau",n:"Sirop de sureau",t:"3 jours",lvl:"Facile",d:"La grande tradition suisse de fin mai et juin, quand les ombelles de sureau fleurissent partout.",
 st:["Cueille une vingtaine d’ombelles bien ouvertes, loin des routes, et secoue-les sans les laver.","Mets-les dans 1 litre d’eau froide avec 2 citrons non traités en tranches.","Laisse macérer 2 à 3 jours au frais, couvert, en remuant chaque jour.","Filtre, ajoute 1 kg de sucre (et 20 g d’acide citrique si tu en as), puis porte brièvement à ébullition.","Mets en bouteilles stérilisées encore chaud."],
 k:"Plusieurs mois fermé, au frais. Un mois une fois ouvert, au frigo.",u:["sirop_sureau"],p:["sureau"]},
{id:"oleo",n:"Oleo saccharum",t:"2 à 12 h",lvl:"Facile",d:"Le sucre extrait les huiles essentielles des zestes : c’est la base des grands punchs.",
 st:["Prélève les zestes de 4 citrons, sans le blanc amer.","Mélange-les avec 100 g de sucre dans un bol et écrase un peu.","Laisse reposer 2 heures au minimum, idéalement une nuit : le sucre devient un sirop parfumé.","Dissous avec un peu de jus de citron et filtre les zestes."],
 k:"Environ 1 semaine au frigo.",u:[],p:["oleo"]},
{id:"cordial",n:"Cordial de citron vert",t:"12 h",lvl:"Facile",d:"L’ancêtre du Gimlet : un concentré sucré-acide de citron vert qui se garde bien plus longtemps que le jus.",
 st:["Prélève les zestes de 4 citrons verts.","Mélange 200 ml de jus de citron vert et 200 g de sucre jusqu’à dissolution.","Ajoute les zestes et laisse infuser une nuit au frigo.","Filtre. Utilise-le à raison de 20 ml avec 50 ml de gin pour un Gimlet à l’ancienne."],
 k:"Environ 2 semaines au frigo.",u:[],p:["cordial"]},
{id:"infusion",n:"Infusions",t:"De 15 min à 1 semaine",lvl:"Facile",d:"L’alcool extrait les arômes très vite. La seule règle : goûter souvent.",
 st:["Mets l’ingrédient dans le spiritueux, dans un bocal fermé.","Repères : thé 30 à 60 min, piment 15 min à quelques heures, zestes 1 jour, fruits frais 2 à 4 jours, vanille ou épices 3 à 7 jours.","Goûte régulièrement et arrête dès que c’est bon : une infusion trop longue devient amère.","Filtre finement et mets en bouteille."],
 k:"Plusieurs mois pour les infusions filtrées, sauf les fruits frais (à consommer en quelques semaines).",u:[],p:["infusion"]},
{id:"fatwash",n:"Fat-washing",t:"Une nuit",lvl:"Moyen",d:"On donne à un spiritueux le goût d’une matière grasse, puis on retire la graisse. Le bourbon au beurre noisette est un classique.",
 st:["Fais fondre 50 g de beurre jusqu’à ce qu’il devienne noisette.","Verse-le encore chaud dans 350 ml de bourbon, dans un bocal, et secoue.","Laisse reposer 2 à 4 heures à température ambiante en secouant de temps en temps.","Mets le bocal au congélateur une nuit : la graisse fige en surface.","Retire le disque de graisse et filtre au filtre à café."],
 k:"Plusieurs mois, idéalement au frigo.",u:["bourbon"],p:["fatwash"]},
{id:"milkpunch",n:"Clarification au lait",t:"2 h",lvl:"Avancé",d:"La technique du milk punch : le lait caille au contact des agrumes et emporte les impuretés. Le résultat est limpide, soyeux et se garde longtemps.",
 st:["Prépare un punch : par exemple 200 ml de rhum ou de cognac, 100 ml de thé fort, 80 ml de jus de citron et 80 ml de sirop.","Verse ce mélange dans 150 ml de lait entier, jamais l’inverse.","Remue doucement une fois et laisse cailler 30 minutes.","Filtre au filtre à café. Repasse les premiers jus troubles sur le filtre : le caillé sert lui-même de filtre.","Mets en bouteille le liquide limpide."],
 k:"Plusieurs semaines au frigo.",u:[],p:["milkpunch"]},
{id:"shrub",n:"Shrub",t:"2 jours",lvl:"Facile",d:"Un sirop de fruits au vinaigre, acidulé et très rafraîchissant, parfait avec de l’eau gazeuse ou dans un sour.",
 st:["Mélange des fruits coupés avec leur poids de sucre.","Laisse macérer 1 à 2 jours au frigo, jusqu’à ce qu’un sirop se forme.","Filtre en pressant les fruits.","Ajoute un volume de vinaigre de cidre égal au volume de sirop, et mélange."],
 k:"Environ 1 mois au frigo.",u:[],p:["shrub"]},
{id:"falernum",n:"Falernum maison",t:"24 h",lvl:"Moyen",d:"L’épice secrète de nombreux cocktails tiki.",
 st:["Mets dans 250 ml de rhum blanc : les zestes de 6 citrons verts, 40 g de gingembre émincé, 20 clous de girofle et 50 g d’amandes grillées.","Laisse infuser 24 heures, puis filtre.","Ajoute 250 ml de sirop riche et 50 ml de jus de citron vert."],
 k:"Environ 1 mois au frigo.",u:["falernum"],p:["falernum"]},
{id:"dryshake",n:"Dry shake",t:"1 min",lvl:"Facile",d:"La technique pour une mousse parfaite dans les cocktails au blanc d’œuf.",
 st:["Verse tous les ingrédients dans le shaker, sans glace.","Secoue fort 10 secondes : le blanc d’œuf s’émulsionne sans être dilué.","Ajoute la glace et secoue encore 12 secondes.","Variante « reverse dry shake » : secoue d’abord avec glace, filtre, puis resecoue sans glace. La mousse est encore plus dense."],
 k:"",u:["blanc_oeuf"],p:[]},
{id:"glace",n:"Glace limpide",t:"24 h",lvl:"Moyen",d:"Les gros glaçons transparents des bars fondent lentement et changent un Old Fashioned.",
 st:["Remplis d’eau une petite glacière sans couvercle.","Mets-la au congélateur : l’eau gèle du haut vers le bas, et les bulles et impuretés descendent.","Retire le bloc après environ 24 heures, avant que le fond soit entièrement gelé.","Laisse-le tempérer quelques minutes, puis découpe des cubes avec un couteau à pain et un petit maillet."],
 k:"Garde les cubes dans un sac de congélation.",u:[],p:[]}
];

// Modèles de préparations maison : [id, nom, ingrédient lié, durée de conservation en jours]
const PREP_TPL = [
["simple","Sirop simple","sirop_sucre",30],["riche","Sirop riche 2:1","sirop_sucre",60],["miel","Sirop de miel","sirop_miel",30],
["gingembre","Sirop de gingembre","sirop_gingembre",14],["grenadine","Grenadine maison","grenadine",21],["orgeat","Orgeat maison","orgeat",14],
["sureau","Sirop de sureau","sirop_sureau",180],["oleo","Oleo saccharum",null,7],["cordial","Cordial de citron vert",null,14],
["infusion","Infusion maison",null,120],["fatwash","Spiritueux fat-washé",null,90],["milkpunch","Milk punch clarifié",null,45],
["shrub","Shrub",null,30],["falernum","Falernum maison","falernum",30],["vanille","Sirop de vanille","sirop_vanille",30],["framboise","Sirop de framboise","sirop_framboise",14]
];

// ---------- SAISONS (Suisse) ----------
const SEASON = {
 1:{p:"agrumes, oranges sanguines",r:["kafi_luz","irish_coffee","garibaldi"],t:"Le cœur de la saison des agrumes : c’est le moment de faire un oleo saccharum."},
 2:{p:"agrumes",r:["kafi_luz","irish_coffee","sidecar"],t:"Encore quelques semaines de beaux agrumes pour tes sours."},
 3:{p:"derniers agrumes",r:["kafi_luz","whisky_sour","penicillin"],t:"Les soirées fraîches se prêtent encore aux sours ronds et aux cocktails chauds."},
 4:{p:"rhubarbe, premières herbes",r:["gin_basil_smash","southside","french75"],t:"Les herbes fraîches reviennent : place aux smashs."},
 5:{p:"fleurs de sureau, fraises",r:["hugo","chasselas_spritz","gin_basil_smash"],t:"Le sureau fleurit en fin de mois : prévois ton sirop maison."},
 6:{p:"fleurs de sureau, cerises, fraises",r:["hugo","kirsch_sour","chasselas_spritz"],t:"Dernière chance pour le sirop de sureau, et les cerises arrivent."},
 7:{p:"abricots du Valais, framboises",r:["valais_smash","aperol_spritz","mojito"],t:"La saison des abricots valaisans : écrase-en une tranche dans tes smashs."},
 8:{p:"abricots, pêches, mûres",r:["valais_smash","paloma","hugo"],t:"Les grandes chaleurs appellent les highballs et la glace pilée."},
 9:{p:"mûres, pommes, poires",r:["bramble","pomme_automne","williams_tonic"],t:"Mûres sauvages et premières pommes : la meilleure période pour un Bramble."},
 10:{p:"pommes, poires, coings",r:["jack_rose","pomme_automne","williams_tonic"],t:"Le verger est à son sommet : pommes et poires dans tous les verres."},
 11:{p:"pommes, poires, épices",r:["kafi_luz","old_fashioned","penicillin"],t:"Les soirées rallongent : cocktails bruns et chauds."},
 12:{p:"agrumes, épices",r:["irish_coffee","kafi_luz","manhattan"],t:"La saison des cocktails chauds et des grands classiques."}
};

// ---------- ACCORDS (labo) ----------
const PAIR = {
 rhum:["citron_vert","menthe","ananas","angostura","orgeat","falernum","sirop_gingembre","creme_coco","espresso","triple_sec"],
 gin:["citron","tonic","basilic","menthe","sirop_sureau","st_germain","chartreuse","vermouth_dry","campari","sirop_framboise","orange_bitters","pamplemousse"],
 agave:["citron_vert","pamplemousse","sirop_agave","triple_sec","campari","ginger_beer","cassis","soda_pamplemousse"],
 whisky:["citron","sirop_miel","angostura","vermouth_rouge","sirop_gingembre","pomme","amaretto","orange_bitters","benedictine"],
 vodka:["citron_vert","canneberge","ginger_beer","espresso","kahlua","sirop_framboise","triple_sec"],
 brandy:["citron","triple_sec","sirop_miel","pomme","benedictine","angostura","creme_cacao"],
 eaux:["citron","sirop_miel","tonic","pomme","menthe","sirop_sureau"],
 amer:["orange","vermouth_rouge","prosecco","pamplemousse","eau_gazeuse","gin"],
 gingembre:["citron_vert","menthe","angostura","rhum_brun"]
};
const SPIRIT_GROUP = {rhum_agricole:"rhum",pflumli:"eaux",abricotine:"eaux",cynar:"amer",rhum_blanc:"rhum",rhum_ambre:"rhum",rhum_jam:"rhum",rhum_brun:"rhum",cachaca:"rhum",gin:"gin",tequila:"agave",mezcal:"agave",bourbon:"whisky",rye:"whisky",scotch:"whisky",islay:"whisky",irish:"whisky",vodka:"vodka",cognac:"brandy",calvados:"brandy",pisco:"brandy",kirsch:"eaux",williamine:"eaux",campari:"amer",aperol:"amer",amaro:"amer",appenzeller:"amer",fernet:"amer",gentiane:"amer",ginger_beer:"gingembre",sirop_gingembre:"gingembre"};
const ROLE = {citron_vert:"l’acidité vive qui réveille le mélange",citron:"une acidité plus ronde que le citron vert",menthe:"une fraîcheur herbacée",ananas:"du fruit tropical et une belle mousse",angostura:"des épices et de la profondeur, en deux traits",orgeat:"une rondeur d’amande",falernum:"des épices douces et du citron vert",sirop_gingembre:"un piquant chaleureux",creme_coco:"une onctuosité tropicale",espresso:"une amertume torréfiée",triple_sec:"une note d’orange qui fait le lien",tonic:"de l’amertume et des bulles",basilic:"une note verte et poivrée",sirop_sureau:"une note florale alpine",st_germain:"du floral et du litchi",chartreuse:"une complexité herbacée intense",vermouth_dry:"de la sécheresse aromatique",campari:"une amertume d’orange qui structure",sirop_framboise:"du fruit rouge acidulé",orange_bitters:"du zeste d’orange concentré",pamplemousse:"une amertume fruitée",sirop_agave:"une douceur qui prolonge l’agave",ginger_beer:"des bulles et du gingembre",cassis:"du fruit noir profond",soda_pamplemousse:"des bulles acidulées",sirop_miel:"une douceur florale et ronde",vermouth_rouge:"une rondeur épicée",pomme:"du fruit de verger",amaretto:"une amande gourmande",benedictine:"du miel et des plantes",creme_cacao:"du cacao gourmand",orange:"une douceur fruitée",prosecco:"des bulles et de la légèreté",eau_gazeuse:"de la légèreté",gin:"une colonne vertébrale botanique",canneberge:"du fruit rouge acidulé",kahlua:"du café sucré",rhum_brun:"une mélasse profonde"};
