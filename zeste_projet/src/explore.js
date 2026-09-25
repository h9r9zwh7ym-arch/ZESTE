// ================= EXPLORER : monde, lignées, radar, étagère =================
// Villes d'origine : [nom, latitude, longitude, cocktails, phrase]
const CITIES=[
 ["La Havane",23.1,-82.4,["daiquiri","hemingway","mojito","cuba_libre","el_presidente","mary_pickford","hotel_nacional","bacardi_cocktail","canchanchara"],"Le berceau du Daiquiri et du Mojito, où les bars accueillaient les Américains pendant la Prohibition."],
 ["La Nouvelle-Orléans",29.95,-90.07,["sazerac","vieux_carre","ramos","la_louisiane","grasshopper","hurricane","brandy_crusta","absinthe_frappe","brandy_milk_punch"],"Peut-être la ville la plus importante de l’histoire du cocktail."],
 ["New York",40.71,-74.0,["manhattan","old_fashioned","cosmopolitan","bronx","penicillin","gold_rush","oaxaca_of","siesta","division_bell","naked_famous","final_ward","red_hook","greenpoint","old_cuban","gin_gin_mule","trinidad_sour","rob_roy","whiskey_smash","eastside","tuxedo","paper_plane"],"Des grands hôtels du XIXe siècle aux bars du renouveau des années 2000."],
 ["Philadelphie",39.95,-75.17,["clover_club"],"Le club d’avocats et de journalistes qui a donné son nom au Clover Club."],
 ["Boston",42.36,-71.06,["ward8","contessa"],"Politique et cocktails, depuis 1898."],
 ["Washington",38.9,-77.03,["gin_rickey"],"Le cocktail sans sucre d’un lobbyiste."],
 ["Detroit",42.33,-83.05,["last_word"],"Le Last Word y est né vers 1915."],
 ["Louisville",38.25,-85.76,["mint_julep","seelbach"],"Le Kentucky, pays du bourbon et du Derby."],
 ["Toronto",43.65,-79.38,["toronto"],"Le Fernet y avait ses fidèles."],
 ["Los Angeles",34.05,-118.24,["moscow_mule","brown_derby","zombie","navy_grog"],"Hollywood et la naissance du tiki avec Don the Beachcomber."],
 ["Baie de San Francisco",37.8,-122.27,["mai_tai","tommys","lemon_drop","cable_car","black_manhattan","revolver","jasmine","tequila_sunrise"],"Trader Vic à Oakland, et un renouveau du cocktail très créatif."],
 ["Portland",45.52,-122.68,["bourbon_renewal","amaretto_sour"],"Le terrain de jeu de Jeffrey Morgenthaler."],
 ["Honolulu",21.28,-157.83,["blue_hawaii"],"Le curaçao bleu à Waikiki."],
 ["Mexique",20.88,-103.84,["paloma","batanga","margarita","mexican_firing_squad","michelada"],"La tequila et ses cocktails, de Tequila à Mexico."],
 ["San Juan",18.47,-66.1,["pina_colada"],"La Piña Colada, boisson officielle de Porto Rico."],
 ["Bermudes",32.3,-64.78,["dark_stormy","rum_swizzle"],"Rhum noir et ginger beer."],
 ["Jamaïque",18.0,-76.8,["planters"],"Le punch des planteurs."],
 ["Îles Vierges",18.42,-64.62,["painkiller"],"Le bar de plage où l’on arrive à la nage."],
 ["Trinidad",10.66,-61.5,["queens_park"],"Le pays de l’Angostura."],
 ["Martinique",14.6,-61.07,["ti_punch"],"Le rhum agricole et son petit punch."],
 ["Lima",-12.05,-77.04,["pisco_sour","chilcano","el_capitan"],"Le pisco à l’honneur."],
 ["Santiago",-33.45,-70.67,["piscola"],"L’autre pays du pisco."],
 ["Rio de Janeiro",-22.9,-43.2,["caipirinha","rabo_galo"],"La cachaça et le citron vert."],
 ["Córdoba",-31.42,-64.18,["fernet_cola"],"La capitale du Fernet con coca."],
 ["Londres",51.5,-0.12,["bramble","espresso_martini","breakfast_martini","hanky_panky","corpse_reviver","twentieth_century","bucks_fizz","pornstar","pink_gin","gimlet","pimms_cup"],"Du Savoy aux bars de Soho."],
 ["Foynes",52.61,-9.1,["irish_coffee"],"L’aéroport irlandais où est né l’Irish Coffee."],
 ["Paris",48.86,2.35,["french75","sidecar","bloody_mary","white_lady","boulevardier","monkey_gland","mimosa","blue_lagoon","old_pal","scofflaw","between_sheets"],"Le Harry’s New York Bar et le Ritz, refuges des barmen américains."],
 ["Marseille",43.3,5.37,["pastis","mauresque","perroquet","tomate"],"L’anis et ses couleurs."],
 ["Dijon",47.32,5.04,["kir","kir_royal"],"Le chanoine Kir et le cassis."],
 ["Bordeaux",44.84,-0.58,["white_negroni"],"Le Negroni blanc est né pendant un salon du vin."],
 ["Bruxelles",50.85,4.35,["black_russian"],"L’hôtel Métropole, 1949."],
 ["Hambourg",53.55,9.99,["gin_basil_smash"],"Le bar Le Lion et son smash au basilic."],
 ["Florence",43.77,11.25,["negroni"],"Le comte Negroni et son Americano renforcé."],
 ["Milan",45.46,9.19,["americano","sbagliato","garibaldi"],"Le Campari et le Bar Basso."],
 ["Venise",45.44,12.33,["bellini","rossini","aperol_spritz"],"Le Harry’s Bar et la patrie du spritz."],
 ["Tyrol du Sud",46.67,11.16,["hugo"],"Le Hugo, star des Alpes."],
 ["Suisse",46.9,8.2,["kafi_luz","kafi_fertig","absinthe_louche","schumli_pflumli","caffe_corretto","gespritzter"],"Café arrosé, absinthe du Val-de-Travers et spritz au vin blanc."],
 ["Pays basque",43.35,-3.01,["kalimotxo"],"Vin rouge et cola, depuis 1972."],
 ["Espagne",40.42,-3.7,["tinto_verano","vermouth_soda","sangria","carajillo"],"L’heure du vermut et du vin d’été."],
 ["Porto",41.15,-8.61,["porto_tonic"],"Le porto blanc allongé de tonic."],
 ["Le Caire",30.04,31.24,["suffering_bastard"],"L’hôtel Shepheard’s, 1942."],
 ["Singapour",1.29,103.85,["singapore_sling"],"Le Long Bar de l’hôtel Raffles."],
 ["Kuala Lumpur",3.14,101.69,["jungle_bird"],"L’Aviary Bar du Hilton, 1978."],
 ["Rangoun",16.84,96.17,["pegu_club"],"Un club d’officiers britanniques."],
 ["Yokohama",35.44,139.64,["bamboo"],"Un barman allemand au Japon, dans les années 1890."]
];
const REGIONS={monde:["Monde","0 8 360 136"],amer:["Amériques","36 34 124 104"],carib:["Caraïbes","82 50 44 37"],europe:["Europe","166 26 45 38"],asie:["Asie","258 38 94 79"]};
const LABPOS={"Dijon":"l","Milan":"l","Tyrol du Sud":"u","San Juan":"l","Philadelphie":"l","Washington":"d","Bordeaux":"l","Suisse":"u","Kuala Lumpur":"l","Boston":"u"};
let WORLD_VB=null, WORLD_R="monde", WORLD_FIRST=true;
function cityXY(lat,lon){ return [lon+180, 90-lat]; }
function worldView(){
  const vb=WORLD_VB||REGIONS[WORLD_R][1], [x,y,w]=vb.split(" ").map(Number), r=Math.max(0.55,w/100), drop=WORLD_FIRST; WORLD_FIRST=false;
  const pins=CITIES.map((c,i)=>{ const [px,py]=cityXY(c[1],c[2]), ids=c[3].filter(id=>RMAP[id]), n=ids.length, made=ids.filter(id=>madeCount(id)).length, ok=ids.filter(id=>status(RMAP[id]).ok).length;
    return `<g class="pin ${made?"made":""} ${drop?"drop":""}" data-a="city" data-i="${i}" style="animation-delay:${(i%12)*30}ms"><circle class="pin-pulse" cx="${px}" cy="${py}" r="${(r*(1.6+Math.min(n,12)*0.14)).toFixed(2)}"/><circle class="pin-dot" cx="${px}" cy="${py}" r="${(r*(0.9+Math.min(n,12)*0.07)).toFixed(2)}"/>${WORLD_R!=="monde"?(()=>{ const pos=LABPOS[c[0]]||"r", fs=r*1.75; const [tx,ty,anc]= pos==="l"?[px-r*1.6,py+r*0.5,"end"]: pos==="u"?[px,py-r*1.6,"middle"]: pos==="d"?[px,py+r*2.6,"middle"]:[px+r*1.6,py+r*0.5,"start"]; return `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="${anc}" font-size="${fs.toFixed(2)}" class="pin-t">${esc(c[0])}</text>`; })():""}${ok?`<circle cx="${px+r*0.9}" cy="${py-r*0.9}" r="${(r*0.45).toFixed(2)}" fill="var(--green)"/>`:""}</g>`; }).join("");
  const done=new Set(distinct().map(id=>CITIES.findIndex(c=>c[3].includes(id))).filter(i=>i>=0)).size;
  return `<div class="sh-sub" style="margin-top:6px">Touche la carte pour l’ouvrir en grand, te balader et zoomer. Point vert : faisable avec ton bar.</div>
  <div class="chips" style="margin-bottom:8px">${Object.entries(REGIONS).map(([k,v])=>`<button class="chip ${WORLD_R===k?"on":""}" data-a="region" data-r="${k}">${v[0]}</button>`).join("")}</div>
  <div class="world ${WORLD_R==="monde"?"":"zoom"}" data-a="mapfs"><button class="world-open" data-a="mapfs" aria-label="Ouvrir la carte">${IC.map}Ouvrir la carte</button><svg id="worldsvg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><rect x="-20" y="-20" width="400" height="200" class="sea"/><g class="grat">${[...Array(13)].map((_,k)=>`<path d="M${k*30} 0V180"/>`).join("")}${[...Array(7)].map((_,k)=>`<path d="M0 ${k*30}H360"/>`).join("")}</g><path class="land" d="${WORLD_PATH}"/>${pins}</svg></div>
  <div class="gf">Tu as goûté des cocktails de ${done} ville${done>1?"s":""} sur ${CITIES.length}.</div>`;
}
function animateRegion(k){
  const from=(WORLD_VB||REGIONS[WORLD_R][1]).split(" ").map(Number), to=REGIONS[k][1].split(" ").map(Number); WORLD_R=k; const t0=performance.now();
  const step=t=>{ const p=Math.min(1,(t-t0)/650), e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2; const cur=from.map((v,i)=>v+(to[i]-v)*e); const svg=document.getElementById("worldsvg"); if(svg) svg.setAttribute("viewBox",cur.map(v=>v.toFixed(2)).join(" ")); if(p<1) requestAnimationFrame(step); else { WORLD_VB=null; renderView("cocktails"); } };
  WORLD_VB=from.join(" "); const w=document.querySelector(".world"); if(w) w.classList.toggle("zoom",k!=="monde"); requestAnimationFrame(step);
}
function citySheet(i){
  const c=CITIES[i], L=c[3].map(id=>RMAP[id]).filter(Boolean);
  openSheet(()=>({title:"",body:`<div class="city-hero"><div class="city-pin">${IC.map}</div><h1>${esc(c[0])}</h1><p>${esc(c[4])}</p></div><h2 class="sh">${L.length} cocktail${L.length>1?"s":""} né${L.length>1?"s":""} ici</h2><div class="sp8"></div><div class="group">${L.map(r=>recRow(r)).join("")}</div>`}));
}
// ---------- Arbre généalogique ----------
const LINEAGES=[
 {n:"Du Old Fashioned au Martini",d:"Le tout premier « cocktail » a donné naissance aux grands classiques au whisky, puis au Martini.",t:["old_fashioned","1806",[["sazerac","1850"],["improved_whiskey","1870"],["manhattan","1870",[["rob_roy","1894",[["bobby_burns",""]]],["martinez","1880",[["martini","1900",[["vesper","1953"],["gibson",""],["dirty_martini",""]]],["tuxedo","1880"]]],["vieux_carre","1938"],["red_hook","2003"],["black_manhattan","2005"]]],["oaxaca_of","2007"]]]},
 {n:"La famille Negroni",d:"Tout commence à Milan avec l’Americano, avant que Florence ne remplace l’eau gazeuse par du gin.",t:["americano","1860",[["negroni","1919",[["old_pal","1922"],["boulevardier","1927"],["cardinale","1950"],["sbagliato","1972"],["white_negroni","2001"],["kingston_negroni",""]]],["garibaldi",""]]]},
 {n:"De la Crusta à la Margarita",d:"Une vieille recette de La Nouvelle-Orléans, ancêtre de tous les sours à l’orange.",t:["brandy_crusta","1850",[["sidecar","1920",[["white_lady","1920"],["between_sheets","1930"],["margarita","1940",[["tommys","1990"],["kamikaze","1970",[["cosmopolitan","1988"]]]]]]]]]},
 {n:"Le Whisky Sour et ses héritiers",d:"Un des plus anciens cocktails imprimés, réinventé des dizaines de fois.",t:["whisky_sour","1862",[["new_york_sour","1880"],["ward8","1898"],["gold_rush","2000",[["penicillin","2005"]]],["bourbon_renewal","2004"],["amaretto_sour","2012"]]]},
 {n:"La descendance du Last Word",d:"Quatre ingrédients à parts égales : une formule copiée par toute une génération de barmen.",t:["last_word","1915",[["final_ward","2007"],["paper_plane","2008"],["division_bell","2009"],["naked_famous","2011"]]]},
 {n:"Les mules",d:"Spiritueux, citron vert et gingembre : une recette plus ancienne qu’on ne le croit.",t:["mamie_taylor","1899",[["moscow_mule","1941",[["kentucky_mule",""],["london_mule",""],["mezcal_mule",""],["gin_gin_mule","2000"]]],["dark_stormy","1920"]]]},
 {n:"L’arbre tiki",d:"Du punch des planteurs aux créations de Don the Beachcomber et Trader Vic.",t:["planters","1880",[["zombie","1934"],["navy_grog","1941"],["mai_tai","1944"],["hurricane","1940"],["jungle_bird","1978"]]]},
 {n:"Le spritz",d:"Du vin blanc allongé d’eau gazeuse aux spritz qui ont conquis le monde.",t:["gespritzter","1850",[["aperol_spritz","1919",[["campari_spritz",""],["limoncello_spritz",""]]],["hugo","2005"],["sbagliato","1972"]]]}
];
let TREE_I=0;
function treeView(){
  const L=LINEAGES[TREE_I]; let k=0;
  const node=(n,depth,last)=>{ const r=RMAP[n[0]]; if(!r) return ""; const i=k++, made=madeCount(n[0]), ok=status(r).ok, ch=(n[2]||[]).filter(c=>RMAP[c[0]]);
    return `<li class="tli ${last?"last":""}" style="--d:${i*70}ms"><button class="tcard ${made?"made":""}" data-a="rec" data-id="${r.id}"><span class="tg">${glassThumb(r)}</span><span class="tt2"><b>${esc(r.n)}</b><span>${esc(ingList(r))}</span></span>${n[1]?`<i class="ty">${n[1]}</i>`:""}${ok?`<span class="tok"></span>`:""}</button>${ch.length?`<ul class="tul">${ch.map((c,j)=>node(c,depth+1,j===ch.length-1)).join("")}</ul>`:""}</li>`; };
  return `<div class="chips lin-chips" style="flex-wrap:nowrap">${LINEAGES.map((l,i)=>`<button class="chip ${i===TREE_I?"on":""}" data-a="lineage" data-i="${i}">${esc(l.n)}</button>`).join("")}</div>
  <div class="card lin-card"><b>${esc(L.n)}</b><span>${esc(L.d)}</span></div>
  <ul class="ttree">${node(L.t,0,true)}</ul>
  <div class="gf">Chaque cocktail descend de celui du dessus. Touche-en un pour ouvrir sa fiche. Contour doré : déjà préparé ; point vert : faisable.</div>`;
}
// ---------- Radar inversé ----------
let RAD=null;
function radarTarget(){ if(!RAD) RAD=avgProfile().slice(0,8).map(v=>Math.round(v*100)/100); return RAD; }
function radarMatches(){ const t=radarTarget(); return RECS.filter(r=>!r.mine).map(r=>{ const p=profileR(r); let d=0; for(let i=0;i<8;i++) d+=Math.pow(p[i]-t[i],2); return [r,Math.max(0,Math.round(100-Math.sqrt(d/8)*230))]; }).sort((a,b)=>b[1]-a[1]).slice(0,12); }
function radarEditor(){
  const t=radarTarget(), S2=300, c=150, R=110, pt=(i,v)=>[c+Math.sin(i/8*2*Math.PI)*R*v, c-Math.cos(i/8*2*Math.PI)*R*v];
  let s=`<svg id="radsvg" viewBox="0 0 ${S2} ${S2}" class="rad-edit">`;
  [0.25,0.5,0.75,1].forEach(v=>s+=`<polygon points="${[...Array(8)].map((_,i)=>pt(i,v).join(",")).join(" ")}" class="rad-ring"/>`);
  for(let i=0;i<8;i++){ const [x,y]=pt(i,1), [lx,ly]=pt(i,1.2); s+=`<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="rad-ax"/><text x="${lx}" y="${ly+4}" text-anchor="middle" class="rad-lab">${DIMS[i]}</text>`; }
  s+=`<polygon id="radpoly" points="${t.map((v,i)=>pt(i,Math.max(0.03,v)).join(",")).join(" ")}" class="rad-poly"/>`;
  t.forEach((v,i)=>{ const [x,y]=pt(i,Math.max(0.03,v)); s+=`<circle class="rad-h" data-ax="${i}" cx="${x}" cy="${y}" r="11"/>`; });
  return s+`</svg>`;
}
function radarResults(){ return radarMatches().map(([r,m])=>recRow(r,m+" % proche de ton goût")).join(""); }
function radarView(){
  const P=[["Amer",[0.2,0.2,0.85,0.6,0.35,0.45,0.35,0.35]],["Frais",[0.35,0.7,0.1,0.3,0.55,0.6,0.15,0.1]],["Doux",[0.8,0.35,0.1,0.3,0.7,0.2,0.2,0.2]],["Fort",[0.3,0.1,0.35,0.95,0.2,0.3,0.4,0.7]],["Épicé",[0.4,0.4,0.3,0.55,0.3,0.25,0.9,0.45]],["Boisé",[0.3,0.15,0.3,0.8,0.25,0.2,0.4,0.9]]];
  return `<div class="sh-sub" style="margin-top:6px">Dessine le goût que tu veux : fais glisser les points, et les cocktails qui y correspondent apparaissent.</div><div class="chips" style="margin-bottom:6px"><button class="chip" data-a="radmine">Mon profil</button>${P.map(([n,v])=>`<button class="chip" data-a="radpreset" data-v="${v.join(",")}">${n}</button>`).join("")}</div>
  <div class="card rad-card">${radarEditor()}</div><div class="list-h"><b>Les plus proches</b><span></span></div><div class="group" id="radres">${radarResults()}</div>`;
}
let RADDRAG=null, RADT=null;
document.addEventListener("pointerdown",e=>{ const h=e.target.closest(".rad-h"); if(!h) return; RADDRAG=+h.dataset.ax; h.classList.add("drag"); e.preventDefault(); });
document.addEventListener("pointermove",e=>{ if(RADDRAG==null) return; const svg=document.getElementById("radsvg"); if(!svg) return; const b=svg.getBoundingClientRect(), k=300/b.width, x=(e.clientX-b.left)*k-150, y=(e.clientY-b.top)*k-150, i=RADDRAG, ax=[Math.sin(i/8*2*Math.PI),-Math.cos(i/8*2*Math.PI)];
  const v=Math.max(0,Math.min(1,(x*ax[0]+y*ax[1])/110)); RAD[i]=Math.round(v*100)/100; const pt=(j,vv)=>[150+Math.sin(j/8*2*Math.PI)*110*vv,150-Math.cos(j/8*2*Math.PI)*110*vv];
  document.getElementById("radpoly").setAttribute("points",RAD.map((vv,j)=>pt(j,Math.max(0.03,vv)).join(",")).join(" ")); const h=svg.querySelector(`.rad-h[data-ax="${i}"]`), p=pt(i,Math.max(0.03,RAD[i])); h.setAttribute("cx",p[0]); h.setAttribute("cy",p[1]);
  clearTimeout(RADT); RADT=setTimeout(()=>{ const el=document.getElementById("radres"); if(el) el.innerHTML=radarResults(); },90); });
document.addEventListener("pointerup",()=>{ if(RADDRAG==null) return; document.querySelectorAll(".rad-h.drag").forEach(h=>h.classList.remove("drag")); RADDRAG=null; const el=document.getElementById("radres"); if(el) el.innerHTML=radarResults(); if(typeof SND!=="undefined") SND.select(); });
// ---------- Étagère du bar ----------
function shelfView(ids){
  const segs=[["spirit","Spiritueux"],["liq","Liqueurs et amers"],["vin","Vins et vermouths"],["sirop","Sirops"],["soft","Softs et jus"]];
  let o=`<div class="bar-shelves"><div class="bar-lamp"></div>`;
  segs.forEach(([sg,n])=>{ const L=ids.filter(id=>segOf(id)===sg).sort((a,b)=>(S.stock[b]>0)-(S.stock[a]>0)||ING[a].n.localeCompare(ING[b].n,"fr")); if(!L.length) return;
    o+=`<div class="shelf-row"><div class="shelf-lab">${esc(n)}</div><div class="shelf-bottles">${L.map((id,k)=>{ const v=S.stock[id], lv=tracked(id)?v:(v===1?4:0); return `<button class="sbottle ${lv===0?"empty":""}" data-a="ing" data-id="${id}" style="animation-delay:${k*45}ms">${bottleSVG(id,lv)}<span>${esc(shortN(id))}</span>${lv===0?`<em>À racheter</em>`:""}</button>`; }).join("")}</div><div class="shelf-board"></div></div>`; });
  return o+`</div>`;
}
Object.assign(ACT,{
  cmode2:(d)=>{ if(d.v==="world"&&CF.mode!=="world") WORLD_FIRST=true; CF.mode=d.v; renderView("cocktails"); },
  region:(d)=>{ if(WORLD_R===d.r) return; animateRegion(d.r); document.querySelectorAll('[data-a="region"]').forEach(b=>b.classList.toggle("on",b.dataset.r===d.r)); },
  city:(d)=>citySheet(+d.i),
  lineage:(d)=>{ TREE_I=+d.i; renderView("cocktails"); },
  radpreset:(d)=>{ RAD=d.v.split(",").map(Number); renderView("cocktails"); },
  radmine:()=>{ const tv=tasteVector(); RAD=(tv&&tv.liked?tv.liked:avgProfile()).slice(0,8).map(v=>Math.round(v*100)/100); renderView("cocktails"); },
  barview:(d)=>{ S.settings.barView=d.v; save(); renderView("bar"); }
});
