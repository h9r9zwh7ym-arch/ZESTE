// ================= TROPHÉES À PALIERS (1.27) et grille unifiée (1.28) =================
// Certains trophées montent en grade (bronze → argent → or → platine) dans un seul badge. Ils remplacent les
// anciens trophées séparés qui mesuraient la même chose (Premier verre, Habitué, Pilier de bar, Légende…), qui
// sont donc retirés de la grille et des annonces : un seul badge par progression, pas deux.
// Chargé après ui_final.js exprès : trophyGrid et checkTrophies y sont réassignés, toute correction doit passer après.
const TIER_TROPHIES=[
 {key:"tier_verres",n:"Habitué de bar",d:"Cocktails préparés au total",u:["cocktail préparé","cocktails préparés"],glyph:"glass",metric:()=>S.hist.length,tiers:[["bronze",1],["silver",10],["gold",50],["plat",100]]},
 {key:"tier_recettes",n:"Explorateur",d:"Recettes différentes préparées",u:["recette différente","recettes différentes"],glyph:"book",metric:()=>distinct().length,tiers:[["bronze",10],["silver",30],["gold",50],["plat",100]]},
 {key:"tier_notes",n:"Palais averti",d:"Cocktails notés",u:["cocktail noté","cocktails notés"],glyph:"star",metric:()=>rated().length,tiers:[["bronze",10],["silver",30],["gold",60],["plat",100]]},
 {key:"tier_bar",n:"Cave bien garnie",d:"Bouteilles ouvertes dans ton bar",u:["bouteille ouverte","bouteilles ouvertes"],glyph:"bottle",metric:()=>barCount(),tiers:[["bronze",5],["silver",15],["gold",30],["plat",50]]}
];
const TIER_SUBSUMED=new Set(["first","ten","fifty","hundred","d10","d30","d50","d100","critic","palate","palate60","bar15","bar30"]);
for(let i=TROPHIES.length-1;i>=0;i--) if(TIER_SUBSUMED.has(TROPHIES[i][0])) TROPHIES.splice(i,1);
TIER_TROPHIES.forEach(tt=>{ TRO_GLYPH[tt.key]=tt.glyph; });
function tierInfo(tt){
  const v=tt.metric(); let cur=-1; tt.tiers.forEach((t,i)=>{ if(v>=t[1]) cur=i; });
  return {v,cur,next:cur+1<tt.tiers.length?tt.tiers[cur+1]:null};
}
function tierLevels(){ return TIER_TROPHIES.reduce((a,tt)=>a+tierInfo(tt).cur+1,0); }
// « Vitrine pleine » : trophées classiques débloqués + paliers atteints
{ const c=TROPHIES.find(t=>t[0]==="collector"); if(c) c[4]=()=>(S.tro||[]).filter(k=>k!=="collector"&&!TIER_SUBSUMED.has(k)).length+tierLevels(); }

// Notifications : jamais par-dessus une annonce plein écran, et pas d'avalanche au lancement
const TRO_BOOT_UNTIL=Date.now()+7000;
function troIdle(){ return !TRO_SHOW&&!TRO_Q.length&&!document.querySelector(".tro-pop")&&!document.getElementById("serve"); }
function troToast(msg,k){ const go=()=>{ if(!troIdle()) return setTimeout(go,900); toast(msg,{icon:medal(k,true),trophy:1}); }; setTimeout(go,500); }
function checkTierTrophies(boot){
  S.tierSeen=S.tierSeen||{}; let did=false;
  TIER_TROPHIES.forEach(tt=>{ const info=tierInfo(tt); if(info.cur<0) return; const seen=S.tierSeen[tt.key]??-1;
    if(info.cur>seen){ S.tierSeen[tt.key]=info.cur; did=true; const tier=tt.tiers[info.cur][0]; TIER_OF[tt.key]=tier;
      if(!boot) troToast(TIERS[tier].n+" : "+tt.n,tt.key); } });
  if(did){ dirty.profil=1; save(); }
}
checkTrophies=function(){
  const boot=Date.now()<TRO_BOOT_UNTIL;
  S.tro=S.tro||[]; S.troT=S.troT||{}; const nw=[];
  TROPHIES.forEach(([k,n,,g,f])=>{ if(!S.tro.includes(k)){ let v=0; try{ v=f(); }catch(e){} if(v>=g){ S.tro.push(k); S.troT[k]=Date.now(); nw.push(k); } } });
  if(nw.length){ save(); dirty.profil=1; nw.sort((a,b)=>TIER_RANK[tierOf(b)]-TIER_RANK[tierOf(a)]);
    // au lancement, les trophées rattrapés (données déjà là) sont résumés en une ligne plutôt qu'annoncés un par un
    if(boot&&nw.length>1) troToast(nw.length+" trophées débloqués, à voir dans ton profil",nw[0]);
    else {
      // seuls l'or et le platine méritent l'annonce plein écran (une à la fois) ; le reste passe en notification discrète
      const big=nw.filter(k=>TIER_RANK[tierOf(k)]>=2&&!TRO_Q.length&&!TRO_SHOW).slice(0,1), rest=nw.filter(k=>!big.includes(k));
      if(big.length){ TRO_Q.push(big[0]); setTimeout(showTrophy,500); }
      if(rest.length){ const names=rest.map(k=>(TROPHIES.find(t=>t[0]===k)||[])[1]).filter(Boolean);
        troToast(rest.length===1?"Trophée débloqué : "+names[0]:rest.length+" trophées débloqués : "+names.slice(0,2).join(", ")+(rest.length>2?"…":""),rest[0]); } } }
  checkTierTrophies(boot);
};

// Grille : paliers d'abord, puis trophées classiques, puis une seule tuile pour les secrets restants
function tierTile(tt){
  const info=tierInfo(tt), on=info.cur>=0, tier=on?tt.tiers[info.cur][0]:"bronze"; TIER_OF[tt.key]=tier;
  const label= info.next? (on?TIERS[tier].n+" · "+TIERS[info.next[0]].n.toLowerCase()+" à "+info.next[1]:"Dès "+info.next[1]) : TIERS.plat.n+", complet";
  return `<button class="trophy ${on?"":"locked"} tiered t-${tier}" data-a="tiertrophy" data-k="${tt.key}">${medal(tt.key,on,on?null:info.v/tt.tiers[0][1])}<div class="tn">${esc(tt.n)}</div><div class="tp">${esc(label)}</div><div class="tier-dots">${tt.tiers.map((t,i)=>`<i class="${i<=info.cur?"on t-"+t[0]:""}"></i>`).join("")}</div></button>`;
}
trophyGrid=function(){
  const got=S.tro||[], vis=TROPHIES.filter(t=>!HIDDEN.has(t[0])||got.includes(t[0])), sec=TROPHIES.filter(t=>HIDDEN.has(t[0])&&!got.includes(t[0]));
  const order=vis.slice().sort((a,b)=>(got.includes(b[0])-got.includes(a[0]))||(TIER_RANK[tierOf(a[0])]-TIER_RANK[tierOf(b[0])]));
  const infos=TIER_TROPHIES.map(tierInfo), rank={bronze:0,silver:1,gold:2,plat:3};
  const cnt=t=>{ const cl=TROPHIES.filter(x=>tierOf(x[0])===t), a=cl.filter(x=>got.includes(x[0])).length+infos.filter(i=>i.cur>=rank[t]).length; return a+"/"+(cl.length+TIER_TROPHIES.length); };
  const doneN=TROPHIES.filter(x=>got.includes(x[0])).length+tierLevels(), totN=TROPHIES.length+TIER_TROPHIES.length*4;
  return `<h2 class="sh">Trophées<span class="more" style="color:var(--label2)">${doneN} sur ${totN}</span></h2><div class="tro-tiers">${Object.entries(TIERS).map(([t,v])=>`<span class="tt t-${t}"><i style="background:linear-gradient(135deg,${v.c[0]},${v.c[2]})"></i>${v.n} ${cnt(t)}</span>`).join("")}</div>
  <div class="trophies">${TIER_TROPHIES.map(tierTile).join("")}${order.map(([k,n,d,g])=>{ const on=got.includes(k), [v,G]=troProgress(k); return `<button class="trophy ${on?"":"locked"} t-${tierOf(k)}" data-a="trophy" data-k="${k}">${medal(k,on,on?null:v/G)}<div class="tn">${esc(n)}</div><div class="tp">${on?(HIDDEN.has(k)?"Secret · ":"")+TIERS[tierOf(k)].n:v+" / "+g}</div></button>`; }).join("")}${sec.length?`<button class="trophy locked secret" data-a="trophy" data-k="${sec[0][0]}">${medal(sec[0][0],false)}<div class="tn">${sec.length} secret${sec.length>1?"s":""}</div><div class="tp">À découvrir</div></button>`:""}</div>`;
};
function tierTrophySheet(key){
  const tt=TIER_TROPHIES.find(x=>x.key===key); if(!tt) return;
  openSheet(()=>{ const info=tierInfo(tt), on=info.cur>=0, tier=on?tt.tiers[info.cur][0]:"bronze";
    return {title:"",body:`<div class="ts-hero t-${tier} ${on?"on":""}"><div class="ts-rays"></div><div class="ts-m">${medal(key,on,on?null:info.v/tt.tiers[0][1])}</div><span class="tp-tier">${on?TIERS[tier].n:"À débloquer"}</span><h1>${esc(tt.n)}</h1><p>${esc(tt.d)} : <b>${info.v}</b></p></div>
    <div class="group tier-steps" style="margin-top:10px">${tt.tiers.map((t,i)=>{ const ok=i<=info.cur, prev=i?tt.tiers[i-1][1]:0, frac=ok?1:clamp01((info.v-prev)/(t[1]-prev)); return `<div class="row"><span class="tier-medal t-${t[0]}"><i style="background:linear-gradient(135deg,${TIERS[t[0]].c[0]},${TIERS[t[0]].c[2]})"></i></span><div class="grow"><div class="t">${TIERS[t[0]].n}</div><div class="s">${t[1]} ${esc(tt.u[t[1]>1?1:0])}</div></div>${ok?`<span class="tier-ok">${IC.check}</span>`:`<span class="tier-frac">${Math.round(frac*100)} %</span>`}</div>`; }).join("")}</div>
    <div class="gf">${info.next?`Encore ${info.next[1]-info.v} pour le palier ${TIERS[info.next[0]].n.toLowerCase()}.`:`Palier maximum atteint.`}</div>`};
  },{short:true});
}
Object.assign(ACT,{ tiertrophy:(d)=>tierTrophySheet(d.k) });
// les trophées cachés montrent « Secret » dans leur fiche ; la tuile regroupée ouvre la même fiche
// Une ancienne clé fusionnée dans un palier (lien, sauvegarde, test) ouvre la fiche du palier au lieu de planter.
const TIER_OF_OLD={first:"tier_verres",ten:"tier_verres",fifty:"tier_verres",hundred:"tier_verres",d10:"tier_recettes",d30:"tier_recettes",d50:"tier_recettes",d100:"tier_recettes",critic:"tier_notes",palate:"tier_notes",palate60:"tier_notes",bar15:"tier_bar",bar30:"tier_bar"};
const _trophySheetTier=trophySheet;
trophySheet=function(k){ if(TIER_OF_OLD[k]) return tierTrophySheet(TIER_OF_OLD[k]); if(!TROPHIES.find(x=>x[0]===k)) return; return _trophySheetTier(k); };
