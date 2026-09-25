// ================= DÉFIS DU LABO =================
function weekKey(){ const d=new Date(); d.setHours(0,0,0,0); const mon=new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7)); return Math.floor(mon.getTime()/(7*864e5)); }
function barPick(seed,filter){ const L=Object.keys(S.stock).filter(id=>ING[id]&&has(id)&&!ING[id].basic&&(!filter||filter(ING[id]))).sort(); if(!L.length) return null; return L[Math.floor(hrand(seed)*L.length)]; }
const SWISS_ING=["kirsch","williamine","pflumli","abricotine","trasch","appenzeller","genepi","sirop_sureau","absinthe","rivella","vin_blanc","gentiane"];
function hueOf(hex){ const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; if(!d) return {h:0,s:0,l:mx}; let h= mx===r?((g-b)/d)%6 : mx===g?(b-r)/d+2 : (r-g)/d+4; return {h:(h*60+360)%360,s:d/(1-Math.abs(mx+mn-1)),l:(mx+mn)/2}; }
// Chaque modèle fabrique un défi : titre, description, contraintes vérifiables, score minimum
const CHAL_T=[
 {id:"ing",lvl:1,make:w=>{ const x=barPick("ci"+w,i=>i.cat!=="soft")||"gin"; const a=art(x); return {t:"Autour "+(a.startsWith("le ")?"du "+a.slice(3):a.startsWith("les ")?"des "+a.slice(4):"de "+a),d:"Crée un cocktail qui met "+art(x)+" en valeur.",c:[["Contient "+lc(shortN(x)),A=>A.items.some(i=>i.id===x)]],min:70}; }},
 {id:"mini",lvl:1,make:()=>({t:"Minimaliste",d:"Trois ingrédients maximum, et un vrai équilibre.",c:[["3 ingrédients maximum",A=>A.items.length<=3]],min:78})},
 {id:"long",lvl:1,make:()=>({t:"Long drink d’été",d:"Un long drink rafraîchissant, pas trop fort.",c:[["Style long drink",A=>A.st==="long"],["12 % d’alcool maximum",A=>A.met.abv<=12]],min:75})},
 {id:"swiss",lvl:2,make:()=>({t:"Made in Switzerland",d:"Utilise au moins un produit suisse : kirsch, williamine, génépi, sureau, Appenzeller…",c:[["Un ingrédient suisse",A=>A.items.some(i=>SWISS_ING.includes(i.id))]],min:78})},
 {id:"zero",lvl:2,make:()=>({t:"Zéro degré",d:"Un mocktail aussi bon qu’un vrai cocktail.",c:[["Sans alcool",A=>A.met.abv<0.5],["Au moins 3 ingrédients",A=>A.items.length>=3]],min:80})},
 {id:"strong",lvl:2,make:()=>({t:"Sec et fort",d:"Un cocktail mélangé au verre, pour les amateurs de spiritueux.",c:[["Méthode : verre à mélange",()=>S.mix.m==="stir"],["20 % d’alcool minimum",A=>A.met.abv>=20]],min:82})},
 {id:"red",lvl:2,make:()=>({t:"Voir rouge",d:"Un cocktail d’un beau rouge profond.",c:[["Couleur rouge",A=>{ const c=hueOf(labBlendCol(A.items)); return (c.h<22||c.h>330)&&c.s>0.35&&c.l<0.62; }]],min:75})},
 {id:"deco",lvl:2,make:()=>({t:"Soigne le décor",d:"Deux garnitures au moins, dont une vraiment assortie.",c:[["2 garnitures ou plus",()=>(S.mix.gar||[]).length>=2],["Une garniture conseillée",A=>(S.mix.gar||[]).some(g=>labSuggestGar(A.items).includes(g))]],min:80})},
 {id:"bitter",lvl:2,make:()=>({t:"Éloge de l’amertume",d:"Intègre un amer (Campari, Suze, Aperol, amaro…).",c:[["Un amer",A=>A.items.some(i=>ING[i.id].cat==="amaro")]],min:80})},
 {id:"bubbles",lvl:2,make:()=>({t:"Ça pétille",d:"Un cocktail avec des bulles, bien équilibré.",c:[["Des bulles",A=>A.items.some(i=>ING[i.id].fizz)]],min:82})},
 {id:"light",lvl:1,make:()=>({t:"Apéro léger",d:"Un apéritif à 8 % d’alcool maximum.",c:[["Entre 0,5 et 8 % d’alcool",A=>A.met.abv>0.5&&A.met.abv<=8]],min:75})},
 {id:"mystery",lvl:3,make:w=>{ const L=Object.values(ING).filter(i=>!i.basic&&["liqueur","amaro","sirop"].includes(i.cat)).map(i=>i.id).sort(); const x=L[Math.floor(hrand("my"+w)*L.length)]; return {t:"Ingrédient mystère",d:"Cette semaine, l’ingrédient imposé est "+lc(ING[x].n)+". Sauras-tu en faire un grand cocktail ?",c:[["Contient "+lc(shortN(x)),A=>A.items.some(i=>i.id===x)]],min:88}; }},
 {id:"perfect",lvl:3,make:()=>({t:"La perfection",d:"Vise le score parfait, ou presque.",c:[],min:95})},
 {id:"five",lvl:3,make:()=>({t:"Chef d’orchestre",d:"Cinq ingrédients ou plus, et un équilibre impeccable.",c:[["5 ingrédients ou plus",A=>A.items.length>=5]],min:88})}
];
function weekChallenges(){
  const w=weekKey(), out=[];
  [1,2,3].forEach(l=>{ const L=CHAL_T.filter(t=>t.lvl===l); const t=L[Math.floor(hrand("w"+w+"l"+l)*L.length)]; const c=t.make(w); out.push(Object.assign({key:t.id+"_"+w,lvl:l},c)); });
  return out;
}
function chalDone(key){ return ((S.chal||{})[key])||0; }
function chalActive(){ return weekChallenges().find(c=>c.key===S.chalOn)||null; }
function chalCheck(c,A,SC){ const res=c.c.map(([n,f])=>{ let ok=false; try{ ok=!!f(A); }catch(e){} return [n,ok]; }); res.push(["Score de "+c.min+" ou plus",SC?SC.score>=c.min:false]); return res; }
function chalCards(){
  const W=weekChallenges(), LV=["","Facile","Moyen","Difficile"];
  const days=7-((new Date().getDay()+6)%7);
  return `<h2 class="sh">Défis de la semaine<span class="more muted" style="font-size:calc(14rem / 17)">encore ${days} jour${days>1?"s":""}</span></h2><div class="scroller chal-row">${W.map(c=>{ const done=chalDone(c.key), on=S.chalOn===c.key; return `<button class="chal lv${c.lvl} ${on?"on":""} ${done?"done":""}" data-a="chal" data-k="${c.key}"><span class="ch-lv">${LV[c.lvl]}</span><b>${esc(c.t)}</b><span class="ch-d">${esc(c.d)}</span><span class="ch-f">${done?`${IC.check} Réussi, ${done}/100`:on?"Défi en cours":"Relever le défi"}</span></button>`; }).join("")}</div>`;
}
function chalBanner(A,SC){
  const c=chalActive(); if(!c) return ""; const R=chalCheck(c,A||null,SC);
  return `<div class="chal-ban"><div class="cb-t"><b>${esc(c.t)}</b><button class="link" data-a="chal" data-k="${c.key}">Arrêter</button></div><div class="cb-c">${R.map(([n,ok])=>`<span class="${ok?"ok":""}">${ok?IC.check:"○"} ${esc(n)}</span>`).join("")}</div></div>`;
}
Object.assign(ACT,{ chal:(d)=>{ S.chalOn=S.chalOn===d.k?null:d.k; save(); dirty.labo=1; renderView("labo"); if(S.chalOn) toast("Défi activé : les contraintes s’affichent sous ton verre"); } });
TROPHIES.push(
 ["chal1","Premier défi","Réussis un défi du labo",1,()=>Object.keys(S.chal||{}).length],
 ["chalweek","Semaine parfaite","Réussis les trois défis d’une même semaine",3,()=>{ const by={}; Object.keys(S.chal||{}).forEach(k=>{ const w=k.split("_").pop(); by[w]=(by[w]||0)+1; }); return Math.max(0,...Object.values(by)); }],
 ["chalhard","Tête brûlée","Réussis un défi difficile",1,()=>(S.chalHard||0)],
 ["chal10","Maître des défis","Réussis 10 défis",10,()=>Object.keys(S.chal||{}).length]
);
Object.assign(TIER_OF,{chal1:"bronze",chalweek:"gold",chalhard:"gold",chal10:"plat"});
Object.assign(TRO_GLYPH,{chal1:"target",chalweek:"cal",chalhard:"star",chal10:"crown"});
// insertion dans le labo et dans la fenêtre de service
const _vCompose=vCompose;
vCompose=function(){ let h=_vCompose(); const M=mixState(); const A=M.items.length?analyze():null, SC=A?labScore(A):null;
  h=h.replace('<div class="sp16"></div>',`<div class="sp8"></div>${chalCards()}<div class="sp16"></div>`);
  const ban=chalBanner(A,SC); if(ban) h=h.replace('<h2 class="sh lab-h"><span class="lab-n">1</span>',ban+'<h2 class="sh lab-h"><span class="lab-n">1</span>');
  return h; };
const _openServe=openServe;
openServe=function(){ const c=chalActive(), M=mixState(); let res=null;
  if(c&&M.items.length){ const A=analyze(), SC=labScore(A), R=chalCheck(c,A,SC), win=R.every(x=>x[1]); res={c,R,win};
    if(win&&!chalDone(c.key)){ S.chal=S.chal||{}; S.chal[c.key]=SC.score; if(c.lvl===3) S.chalHard=(S.chalHard||0)+1; save(); } }
  _openServe();
  if(res&&SV){ const el=SV.el, box=document.createElement("div"); box.className="sv-chal "+(res.win?"win":"lose");
    box.innerHTML=res.win?`<span class="svc-ic">${IC.check}</span><div><b>Défi réussi !</b><span>${esc(res.c.t)}</span></div>`:`<span class="svc-ic">!</span><div><b>Défi pas encore réussi</b><span>${esc(res.R.filter(x=>!x[1]).map(x=>x[0]).join(", "))}</span></div>`;
    const g=el.querySelector(".sv-goals"); if(g) g.parentNode.insertBefore(box,g); }
};
