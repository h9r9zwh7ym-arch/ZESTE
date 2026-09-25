// ================= TROPHÉES : niveaux, médailles et célébrations =================
const TIERS={bronze:{n:"Bronze",c:["#F4C79A","#B8703A","#7A4418"]},silver:{n:"Argent",c:["#FFFFFF","#C9D0DA","#7E8896"]},gold:{n:"Or",c:["#FFF1B0","#F2B632","#A86A10"]},plat:{n:"Platine",c:["#F4FBFF","#A8D8F0","#6A7FC8"]}};
const TIER_OF={first:"bronze",crea:"bronze",alch:"bronze",roul:"bronze",night:"bronze",zero:"bronze",lab10:"silver",ten:"silver",d10:"bronze",sour:"silver",stir:"silver",tiki:"silver",swiss:"silver",bitter:"silver",critic:"bronze",bar15:"silver",loyal:"silver",fifty:"gold",d30:"gold",fam:"gold",hist:"gold",palate:"gold",bar30:"gold",labpro:"gold",hundred:"plat"};
const TRO_IC={ // pictogrammes des médailles
 glass:'<path d="M-9-9H9C9-1 5 3 0 3S-9-1-9-9Z" fill="#fff"/><path d="M0 3V10M-5 11H5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
 star:'<path d="M0-11l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L0 5.5l-6.5 3.4 1.3-7.2L-10.5-3.4l7.3-1z" fill="#fff"/>',
 flask:'<path d="M-3-11h6M-2-11v6l-7 11a2 2 0 0 0 1.7 3h14.6A2 2 0 0 0 9 6L2-5v-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M-6 3h12l2.5 4H-8.5z" fill="#fff"/>',
 heart:'<path d="M0 10s-10-6-10-12.5C-10-6-7-8.5-4-8.5c2 0 3.2 1.2 4 2.5.8-1.3 2-2.5 4-2.5 3 0 6 2.5 6 6C10 4 0 10 0 10z" fill="#fff"/>',
 leaf:'<path d="M-8 9C-8-3 0-10 10-10 10 2 3 9-8 9z" fill="#fff"/><path d="M-8 9L4-3" stroke-width="1.6" stroke="rgba(0,0,0,.25)"/>',
 book:'<path d="M-9-9h7a2 2 0 0 1 2 2v17a2 2 0 0 0-2-2h-7zM9-9H2a2 2 0 0 0-2 2v17a2 2 0 0 1 2-2h7z" fill="#fff"/>',
 bottle:'<path d="M-2.5-12h5v5l3.5 4v15a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15l3.5-4z" fill="#fff"/>',
 crown:'<path d="M-11 7l-1-13 6 5 6-9 6 9 6-5-1 13z" fill="#fff"/><path d="M-11 10H11" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
 moon:'<path d="M3-10a9 9 0 1 0 7 14.5A7.5 7.5 0 0 1 3-10z" fill="#fff"/>',
 dice:'<rect x="-9" y="-9" width="18" height="18" rx="4" fill="#fff"/><g fill="rgba(0,0,0,.35)"><circle cx="-4" cy="-4" r="1.8"/><circle cx="4" cy="4" r="1.8"/><circle cx="0" cy="0" r="1.8"/></g>',
 cross:'<path d="M-3.5-10h7v6.5H10v7H3.5V10h-7V3.5H-10v-7h6.5z" fill="#fff"/>',
 cal:'<rect x="-10" y="-8" width="20" height="18" rx="3" fill="#fff"/><path d="M-10-3H10" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M-5-11v5M5-11v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
 coin:'<circle r="10" fill="#fff"/><path d="M3.5-4c-.6-1.2-2-1.8-3.5-1.8-2 0-3.5 1-3.5 2.6 0 3.7 7.3 2 7.3 5.4 0 1.6-1.6 2.6-3.8 2.6-1.6 0-3-.7-3.6-1.9" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2" stroke-linecap="round"/>',
 fork:'<path d="M-6-11v8a3 3 0 0 0 6 0v-8M-3-11v22M6-11c-3 3-3 9 0 11v11" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
 target:'<circle r="10" fill="none" stroke="#fff" stroke-width="2.4"/><circle r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle r="1.8" fill="#fff"/>',
 num:''
};
const TRO_GLYPH={first:"glass",ten:"glass",fifty:"glass",hundred:"crown",d10:"book",d30:"book",fam:"leaf",sour:"target",stir:"glass",tiki:"leaf",swiss:"cross",bitter:"leaf",hist:"book",critic:"star",palate:"star",bar15:"bottle",bar30:"bottle",alch:"flask",crea:"flask",loyal:"heart",roul:"dice",night:"moon",zero:"leaf",labpro:"crown",lab10:"flask"};
// Nouveaux trophées, du plus simple au plus corsé
TROPHIES.push(
 ["quizdone","Fais connaissance","Termine le quiz de goût",1,()=>S.quiz?1:0],
 ["lab1","Premier mélange","Sers ta première création au labo",1,()=>S.labServes||0],
 ["price5","Comptable du bar","Renseigne le prix de 5 bouteilles",5,()=>Object.values(S.price||{}).filter(p=>p&&p.p>0).length],
 ["adj5","Sur mesure","Ajuste 5 recettes à ton goût",5,()=>Object.keys(S.adj||{}).length],
 ["dish6","Fin gourmet","Explore 6 accords mets et cocktails",6,()=>(S.dishes||[]).length],
 ["fav10","Collectionneur","Garde 10 favoris",10,()=>(S.fav||[]).length],
 ["prep3","Aux fourneaux","Lance 3 préparations maison",3,()=>S.prepCount||0],
 ["seasons4","Quatre saisons","Prépare un cocktail de saison pendant 4 mois différents",4,()=>new Set(S.hist.filter(h=>RMAP[h.id]&&(RMAP[h.id].se||[]).includes(new Date(h.t).getMonth()+1)).map(h=>new Date(h.t).getMonth())).size],
 ["weekend","Rituel du vendredi","Prépare un cocktail trois vendredis différents",3,()=>new Set(S.hist.filter(h=>new Date(h.t).getDay()===5).map(h=>new Date(h.t).toDateString())).size],
 ["d50","Encyclopédie vivante","Prépare 50 recettes différentes",50,()=>distinct().length],
 ["lab100","Perfection","Obtiens 100/100 au labo",100,()=>S.labBest||0],
 ["allfam","Tour complet","Au moins un cocktail de chaque famille, sans alcool compris",Object.keys(FAMILIES).length,()=>new Set(distinct().map(id=>RMAP[id].fam)).size],
 ["palate60","Palais d’or","Note 60 cocktails",60,()=>rated().length],
 ["d100","Maître Zeste","Prépare 100 recettes différentes",100,()=>distinct().length],
 ["collector","Vitrine pleine","Débloque 30 trophées",30,()=>(S.tro||[]).filter(k=>k!=="collector").length]
);
Object.assign(TIER_OF,{quizdone:"bronze",lab1:"bronze",price5:"bronze",adj5:"silver",dish6:"silver",fav10:"silver",prep3:"silver",seasons4:"gold",weekend:"silver",d50:"gold",lab100:"gold",allfam:"plat",palate60:"plat",d100:"plat",collector:"plat"});
Object.assign(TRO_GLYPH,{quizdone:"star",lab1:"flask",price5:"coin",adj5:"target",dish6:"fork",fav10:"heart",prep3:"flask",seasons4:"cal",weekend:"cal",d50:"book",lab100:"target",allfam:"leaf",palate60:"star",d100:"crown",collector:"crown"});
const TIER_RANK={bronze:0,silver:1,gold:2,plat:3};
function tierOf(k){ return TIER_OF[k]||"silver"; }
// Médaille : disque bombé, rayons, ruban, pictogramme ; anneau de progression si verrouillée
function medal(k,on,prog){
  const t=TIERS[tierOf(k)], id="md"+(++GID), c=on?t.c:["#E4E2DE","#B9B5AE","#8E8A84"], P=prog==null?0:Math.max(0,Math.min(1,prog)), R=31;
  return `<svg viewBox="0 0 80 88" class="medal ${on?"on":"off"} t-${tierOf(k)}"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><radialGradient id="${id}h" cx="35%" cy="28%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient><clipPath id="${id}k"><circle cx="40" cy="40" r="26"/></clipPath></defs>
  <path d="M27 58L20 84L31 78L37 86L40 62ZM53 58L60 84L49 78L43 86L40 62Z" fill="${on?c[2]:"#A9A59F"}" opacity="${on?1:.6}"/>
  ${[...Array(16)].map((_,i)=>{ const a=i*Math.PI/8; return `<path d="M${(40+Math.cos(a)*27).toFixed(1)} ${(40+Math.sin(a)*27).toFixed(1)}L${(40+Math.cos(a+0.2)*33).toFixed(1)} ${(40+Math.sin(a+0.2)*33).toFixed(1)}L${(40+Math.cos(a+0.39)*27).toFixed(1)} ${(40+Math.sin(a+0.39)*27).toFixed(1)}Z" fill="${c[2]}" opacity="${on?.9:.45}"/>`; }).join("")}
  <circle cx="40" cy="40" r="28" fill="url(#${id}g)"/><circle cx="40" cy="40" r="22.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>
  <g transform="translate(40 40)" opacity="${on?1:.75}">${TRO_IC[TRO_GLYPH[k]||"star"]}</g>
  <circle cx="40" cy="40" r="28" fill="url(#${id}h)"/>
  ${on?`<g clip-path="url(#${id}k)"><rect class="md-shine" x="-40" y="0" width="22" height="80" fill="#fff" opacity=".5" transform="skewX(-20)"/></g>`:""}
  ${!on&&P>0?`<circle cx="40" cy="40" r="${R+4}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="3.5"/><circle cx="40" cy="40" r="${R+4}" fill="none" stroke="var(--tint)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${(2*Math.PI*(R+4)*P).toFixed(1)} 400" transform="rotate(-90 40 40)"/>`:""}</svg>`;
}
function troProgress(k){ const T=TROPHIES.find(x=>x[0]===k); if(!T) return [0,1]; return [Math.min(T[3],T[4]()),T[3]]; }
// Vérification : note la date, puis célèbre chaque nouveau trophée
let TRO_Q=[], TRO_SHOW=false;
function checkTrophies(){
  S.tro=S.tro||[]; S.troT=S.troT||{}; const nw=[];
  TROPHIES.forEach(([k,n,,g,f])=>{ if(!S.tro.includes(k)){ let v=0; try{ v=f(); }catch(e){} if(v>=g){ S.tro.push(k); S.troT[k]=Date.now(); nw.push(k); } } });
  if(nw.length){ save(); dirty.profil=1; nw.sort((a,b)=>TIER_RANK[tierOf(b)]-TIER_RANK[tierOf(a)]);
    TRO_Q.push(...nw.slice(0,3)); if(nw.length>3) setTimeout(()=>toast("Et "+(nw.length-3)+" autres trophées débloqués, à voir dans ton profil"),500+3*3200); setTimeout(showTrophy,500); }
}
function showTrophy(){
  if(TRO_SHOW||!TRO_Q.length) return; if(document.getElementById("serve")||document.getElementById("rewind")?.classList.contains("open")){ setTimeout(showTrophy,1200); return; }
  const k=TRO_Q.shift(), T=TROPHIES.find(x=>x[0]===k); if(!T) return showTrophy(); TRO_SHOW=true; const tr=tierOf(k), tc=TIERS[tr];
  if(!FX("confetti")){ toast("Trophée débloqué : "+T[1],{icon:medal(k,true),trophy:1}); TRO_SHOW=false; setTimeout(showTrophy,2600); return; }
  const el=document.createElement("div"); el.className="tro-pop t-"+tr; el.style.setProperty("--tc",tc.c[1]);
  el.innerHTML=`<div class="tp-bg"></div><div class="tp-rays"></div><div class="tp-in"><div class="tp-k">Trophée débloqué</div><div class="tp-m">${medal(k,true)}</div><span class="tp-tier">${tc.n}</span><div class="tp-n">${esc(T[1])}</div><div class="tp-d">${esc(T[2])}</div><div class="tp-tap">Touche pour continuer${TRO_Q.length?` · encore ${TRO_Q.length}`:""}</div></div>`;
  document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add("open"));
  setTimeout(()=>{ const m=el.querySelector(".tp-m"); if(m){ const b=m.getBoundingClientRect(); confetti(b.left+b.width/2,b.top+b.height/2,tc.c[1]); if(tr==="gold"||tr==="plat") setTimeout(()=>confetti(b.left+b.width/2,b.top+b.height/3,tc.c[0]),350); } },650);
  const close=()=>{ el.classList.remove("open"); el.classList.add("out"); setTimeout(()=>{ el.remove(); TRO_SHOW=false; setTimeout(showTrophy,250); },380); };
  el.addEventListener("click",close); setTimeout(()=>{ if(el.isConnected) close(); },6500);
}
// Grille des trophées du profil, triée par niveau
function trophyGrid(){
  const got=S.tro||[], order=TROPHIES.slice().sort((a,b)=>(got.includes(b[0])-got.includes(a[0]))||(TIER_RANK[tierOf(a[0])]-TIER_RANK[tierOf(b[0])]));
  const cnt=t=>TROPHIES.filter(x=>tierOf(x[0])===t&&got.includes(x[0])).length+"/"+TROPHIES.filter(x=>tierOf(x[0])===t).length;
  return `<h2 class="sh">Trophées<span class="more" style="color:var(--label2)">${got.length} sur ${TROPHIES.length}</span></h2><div class="tro-tiers">${Object.entries(TIERS).map(([t,v])=>`<span class="tt t-${t}"><i style="background:linear-gradient(135deg,${v.c[0]},${v.c[2]})"></i>${v.n} ${cnt(t)}</span>`).join("")}</div>
  <div class="trophies">${order.map(([k,n,d,g,f])=>{ const on=got.includes(k), [v,G]=troProgress(k); return `<button class="trophy ${on?"":"locked"} t-${tierOf(k)}" data-a="trophy" data-k="${k}">${medal(k,on,on?null:v/G)}<div class="tn">${esc(n)}</div><div class="tp">${on?TIERS[tierOf(k)].n:v+" / "+g}</div></button>`; }).join("")}</div>`;
}
function trophySheet(k){
  const T=TROPHIES.find(x=>x[0]===k), on=(S.tro||[]).includes(k), [v,G]=troProgress(k), tr=tierOf(k), when=(S.troT||{})[k];
  openSheet(()=>({title:"",body:`<div class="ts-hero t-${tr} ${on?"on":""}"><div class="ts-rays"></div><div class="ts-m">${medal(k,on,on?null:v/G)}</div><span class="tp-tier">${TIERS[tr].n}</span><h1>${esc(T[1])}</h1><p>${esc(T[2])}</p></div>
    <div class="card" style="margin-top:8px">${on?`<div class="ts-done">${IC.checkc}<span>Débloqué${when?" le "+new Date(when).getDate()+" "+monthName(new Date(when).getMonth()+1)+" "+new Date(when).getFullYear():""}</span></div>`:`<div class="ts-prog"><div class="ts-bar"><i style="width:${Math.round(v/G*100)}%"></i></div><span>${v} sur ${G}</span></div><div class="gf" style="margin:10px 0 0">${G-v<=Math.max(1,G*0.2)?"Tu y es presque !":"Continue comme ça."}</div>`}</div>`}),{short:true});
}
Object.assign(ACT,{ trophy:(d)=>trophySheet(d.k) });
const _dish=ACT.dish; ACT.dish=(d)=>{ S.dishes=S.dishes||[]; if(!S.dishes.includes(d.id)){ S.dishes.push(d.id); save(); checkTrophies(); } _dish(d); };
