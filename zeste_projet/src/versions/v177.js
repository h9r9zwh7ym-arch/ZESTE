// ================= ZESTE 1.73 : saisons et événements =================
// 1. Sept occasions de plus, dont trois à date mobile (Carnaval, Oktoberfest, Beaujolais nouveau) et deux qui durent
//    (Dry January tout le mois, Oktoberfest 16 jours, Escalade 2 jours) : affichées « En ce moment » pendant leur durée.
// 2. « De saison » : badge dans la fiche et filtre dans Cocktails > Filtres (sélection du mois de SEASON, fruits frais du moment,
//    cocktails chauds en hiver).
// 3. La carte « De saison » de l'accueil prend une teinte discrète de la saison.

OCCASIONS.push(
 {id:"dryjan",n:"Dry January",ic:"glass-water",d:[1,1],lead:3,span:31,r:["nojito","gt_0","hugo_0","crodino_spritz","sureau_tonic","virgin_mule","espresso_tonic","most_chaud"],t:"Un mois sans alcool, pas sans plaisir.",c:["#9BE7C4","#2E9E6B","#0F3D2E"]},
 {id:"carnaval",n:"Carnaval",ic:"party-popper",d:"mardigras",lead:9,r:["kafi_luz","kafi_fertig","kafi_trasch","schumli_pflumli","hot_toddy","bombardino"],t:"Des cafés arrosés pour tenir au froid du cortège.",c:["#FFD166","#EF476F","#3A0CA3"]},
 {id:"stpatrick",n:"Saint-Patrick",ic:"leaf",d:[3,17],lead:6,r:["irish_coffee","tipperary","cameron_kick","baby_guinness","pickleback","snakebite"],t:"Whiskey irlandais et vert à l’honneur.",c:["#7BD389","#1E8E3E","#0B3D1E"]},
 {id:"musique",n:"Fête de la musique",ic:"sun",d:[6,21],lead:5,r:["aperol_spritz","hugo","mojito","paloma","moscow_mule","tinto_verano"],t:"Des verres frais à boire entre deux concerts.",c:["#FFE08A","#F28C28","#7A1F5C"]},
 {id:"oktoberfest",n:"Oktoberfest",ic:"pretzel",d:"oktoberfest",lead:4,span:16,r:["panache","michelada","picon_biere","snakebite","panache_0"],t:"Prosit ! La bière en cocktail.",c:["#F6D365","#4A90D9","#1B3A6B"]},
 {id:"beaujolais",n:"Beaujolais nouveau",ic:"wine",d:"beaujolais",lead:6,r:["cardinal","new_york_sour","kalimotxo","sangria","tinto_verano","vin_chaud"],t:"Le vin nouveau arrive : de quoi le mettre en cocktail.",c:["#C96BA8","#7B1E4A","#2A0A1C"]},
 {id:"escalade",n:"Escalade",ic:"chocolate",d:[12,11],lead:5,span:2,r:["vin_chaud","hot_toddy","kafi_luz","most_chaud","grog","bombardino"],t:"Autour de la marmite : du chaud pour fêter Genève.",c:["#F2C14E","#B5452B","#3B1410"]}
);
// Dates mobiles : Mardi gras = Pâques − 47 j ; Oktoberfest : 1er samedi après le 15 septembre ; Beaujolais : 3e jeudi de novembre
{ const _d=occDate;
  occDate=function(o,year){
    if(o.d==="mardigras"){ const e=easterDate(year); return new Date(year,e.month-1,e.day-47); }
    if(o.d==="oktoberfest"){ const d=new Date(year,8,16); while(d.getDay()!==6) d.setDate(d.getDate()+1); return d; }
    if(o.d==="beaujolais"){ const d=new Date(year,10,1); while(d.getDay()!==4) d.setDate(d.getDate()+1); d.setDate(d.getDate()+14); return d; }
    return _d(o,year); };
}
// Une occasion qui dure : « En ce moment » du jour J au dernier jour (days = −1), avant les occasions à venir
function occOngoing(o,now){ if(!o.span) return false; const m=new Date(now||Date.now()); m.setHours(0,0,0,0);
  for(const y of [m.getFullYear(),m.getFullYear()-1]){ const s=occDate(o,y), e=new Date(s); e.setDate(e.getDate()+o.span-1); if(m>=s&&m<=e) return true; } return false; }
{ const _a=occActive;
  occActive=function(){ const A=_a(), on=OCCASIONS.filter(o=>occOngoing(o)).map(o=>({o,days:-1}));
    return on.concat(A.filter(x=>!on.some(y=>y.o.id===x.o.id))); };
}
{ const _l=occDaysLabel; occDaysLabel=function(days){ return days<0?"En ce moment":_l(days); }; }

// ---------- « De saison » ----------
const SEASON_FRESH={fraise_puree:[5,6,7],peche_puree:[7,8,9]};
function inSeason(r,mo){ mo=mo||new Date().getMonth()+1; const se=SEASON[mo];
  return !!r&&((se&&se.r.includes(r.id))||(r.m==="hot"&&[11,12,1,2].includes(mo))||r.ing.some(i=>(SEASON_FRESH[i.id]||[]).includes(mo))); }
XF.push(["season","De saison"]);
{ const _f=filtered; filtered=function(ig){ const L=_f(ig); return CF.x.includes("season")? L.filter(r=>inSeason(r)) : L; }; }
// badge dans la fiche, avec les autres
{ const _rs=recSheet;
  recSheet=function(id){ const ret=_rs(id), sh=SHEETS[SHEETS.length-1]; if(!sh||sh.recId!==id||!sh.render) return ret; const r0=sh.render;
    sh.render=()=>{ const o=r0(); if(!inSeason(RMAP[id])||o.body.includes('class="badge season"')) return o;
      o.body=o.body.replace(/(<div class="tags">[\s\S]*?)(<\/div>)/,`$1<span class="badge season">De saison</span>$2`); return o; };
    paintSheet(sh); return ret; };
}
// teinte de la saison sur la carte de l'accueil
function seasonKey(mo){ mo=mo||new Date().getMonth()+1; return [12,1,2].includes(mo)?"hiver":[3,4,5].includes(mo)?"printemps":[6,7,8].includes(mo)?"ete":"automne"; }
{ const _s=HOME_SEC.season; HOME_SEC.season=()=>_s().replace('<div class="card season">',`<div class="card season s-${seasonKey()}">`); }
// (1.74) pas de « Tout voir » ici : l'accueil est à son budget de choix (loi de Hick, 36) ; le filtre est dans Cocktails > Filtres
