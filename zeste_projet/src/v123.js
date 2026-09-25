// ================= OCCASIONS =================
// Des suggestions qui n'apparaissent qu'à l'approche d'une date (le temps d'acheter les bouteilles),
// puis disparaissent d'elles-mêmes une fois l'occasion passée.
// Algorithme de Gauss pour la date de Pâques (calendrier grégorien)
function easterDate(y){
  const a=y%19, b=Math.floor(y/100), c=y%100, d=Math.floor(b/4), e=b%4, f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3),
    h=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4, l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451),
    month=Math.floor((h+l-7*m+114)/31), day=((h+l-7*m+114)%31)+1;
  return {month,day};
}
const OCCASIONS=[
 {id:"valentin",n:"Saint-Valentin",e:"❤️",d:[2,14],lead:9,r:["french75","kir_royal","clover_club","champagne_cocktail","pink_lady","bellini"],t:"De quoi trinquer à deux.",c:["#FF7A9E","#D6336C","#6A1B4D"]},
 {id:"paques",n:"Pâques",e:"🐣",d:"easter",lead:7,r:["bellini","hugo","aperol_spritz","mimosa","french75","rossini"],t:"Des cocktails frais pour le printemps.",c:["#FDEB9E","#8CD790","#4FA8D8"]},
 {id:"fetenat",n:"Fête nationale",e:"🇨🇭",d:[8,1],lead:7,r:["kirsch_sour","chasselas_spritz","martini_alpes","mule_alpin","williams_tonic","alpine_sour"],t:"Des classiques bien suisses.",c:["#FF453A","#C8102E","#7A0C1E"]},
 {id:"halloween",n:"Halloween",e:"🎃",d:[10,31],lead:8,r:["corpse_reviver","corpse_reviver1","black_russian","jungle_bird","zombie","blood_sand"],t:"Des cocktails sombres et mystérieux.",c:["#FFA23C","#C2410C","#1F0B2E"]},
 {id:"noel",n:"Noël",e:"🎄",d:[12,25],lead:12,r:["vin_chaud","irish_coffee","hot_toddy","kafi_luz","eggnog","manhattan"],t:"Chaleur et épices pour les longues soirées.",c:["#E5484D","#2E7D4F","#123524"]},
 {id:"reveillon",n:"Réveillon",e:"🥂",d:[12,31],lead:6,r:["french75","champagne_cocktail","kir_royal","mimosa","old_cuban","sazerac"],t:"De quoi trinquer à la nouvelle année.",c:["#F5D67A","#C99A3A","#241A38"]}
];
function occDate(o,year){ if(o.d==="easter"){ const e=easterDate(year); return new Date(year,e.month-1,e.day); } return new Date(year,o.d[0]-1,o.d[1]); }
function occNext(o){ const now=new Date(), midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()); let dt=occDate(o,now.getFullYear()); if(dt<midnight) dt=occDate(o,now.getFullYear()+1); return dt; }
// Actives : entre `lead` jours avant et le jour même ; disparaissent le lendemain, sans intervention
function occActive(){
  const midnight=new Date(); midnight.setHours(0,0,0,0);
  return OCCASIONS.map(o=>{ const dt=occNext(o); const days=Math.round((dt-midnight)/864e5); return {o,days}; })
    .filter(x=>x.days>=0 && x.days<=x.o.lead).sort((a,b)=>a.days-b.days);
}
function occRecs(o){ return o.r.map(id=>RMAP[id]).filter(Boolean).sort((a,b)=>score(b)-score(a)); }
function occDaysLabel(days){ return days===0?"C’est aujourd’hui !":days===1?"C’est demain":"Dans "+days+" jours"; }
HOME_N.occasion="Occasions à venir";
{ const H=DEFAULT_HOME, i=H.findIndex(x=>x[0]==="table"); H.splice(i<0?H.length:i,0,["occasion",1]); }
HOME_SEC.occasion=()=>{
  const A=occActive(); if(!A.length) return "";
  const {o,days}=A[0], recs=occRecs(o), buy=[...new Set(recs.flatMap(r=>status(r).miss))].filter(id=>ING[id]&&!has(id));
  return `<button class="rw-card occ" data-a="occasion" data-id="${o.id}" style="background:linear-gradient(125deg,${o.c[0]},${o.c[1]} 45%,${o.c[2]})"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${o.e} ${esc(o.n)}</div><div class="rw-t">${occDaysLabel(days)}</div><div class="rw-s">${esc(o.t)}${buy.length?" Il te manque "+buy.length+" ingrédient"+(buy.length>1?"s":"")+" : le temps de les acheter.":""}</div></div><div class="rw-play" style="color:${o.c[1]}">${IC.chev}</div></button>`;
};
function occasionSheet(id){
  const o=OCCASIONS.find(x=>x.id===id); if(!o) return;
  const A=occActive().find(x=>x.o.id===id), days=A?A.days:Math.round((occNext(o)-new Date().setHours(0,0,0,0))/864e5);
  openSheet(()=>{ const recs=occRecs(o), buy=[...new Set(recs.flatMap(r=>status(r).miss))].filter(bid=>ING[bid]&&!has(bid));
    return {title:"",body:`<div class="dish-hero"><div class="dish-e">${o.e}</div><h1>${esc(o.n)}</h1><p>${esc(occDaysLabel(days))}. ${esc(o.t)}</p></div>`
      +(buy.length?`<h2 class="sh">À acheter à l’avance</h2><div class="sp8"></div><div class="group">${buy.map(bid=>{ const n=recs.filter(r=>status(r).miss.includes(bid)).length; return `<button class="row tap" data-a="ing" data-id="${bid}"><div class="grow"><div class="t">${esc(ING[bid].n)}</div><div class="s">Pour ${n} recette${n>1?"s":""} de cette sélection</div></div>${IC.chev}</button>`; }).join("")}</div>`:`<div class="gf" style="margin-top:4px">Tu as déjà tout ce qu’il faut pour ces recettes.</div>`)
      +`<h2 class="sh">Idées pour l’occasion</h2><div class="sp8"></div><div class="group">${recs.map(r=>recRow(r)).join("")}</div>`};
  });
}
Object.assign(ACT,{ occasion:(d)=>{ if(typeof SND!=="undefined") SND.pop(); occasionSheet(d.id); } });
