// ================= TROPHÉES À PALIERS =================
// Certains trophées montent en grade (bronze → argent → or → platine) dans un seul badge, au lieu de
// s'arrêter au premier palier atteint. Les paliers du haut demandent nettement plus que les anciens
// trophées séparés qu'ils remplacent (ex. Palais averti allait jusqu'à 60 notes, va maintenant jusqu'à 100).
// Chargé après ui_final.js exprès : trophyGrid et checkTrophies y sont réassignés (comme les trophées
// cachés en 1.20), donc toute correction doit se brancher après, pour ne pas être écrasée par la suite.
const TIER_TROPHIES=[
 {key:"tier_verres",n:"Habitué de bar",d:"Cocktails préparés au total",glyph:"glass",metric:()=>S.hist.length,tiers:[["bronze",1],["silver",10],["gold",50],["plat",100]]},
 {key:"tier_recettes",n:"Explorateur",d:"Recettes différentes préparées",glyph:"book",metric:()=>distinct().length,tiers:[["bronze",10],["silver",30],["gold",50],["plat",100]]},
 {key:"tier_notes",n:"Palais averti",d:"Cocktails notés",glyph:"star",metric:()=>rated().length,tiers:[["bronze",10],["silver",30],["gold",60],["plat",100]]},
 {key:"tier_bar",n:"Cave bien garnie",d:"Bouteilles ouvertes dans ton bar",glyph:"bottle",metric:()=>barCount(),tiers:[["bronze",5],["silver",15],["gold",30],["plat",50]]}
];
function tierInfo(tt){
  const v=tt.metric(); let cur=-1; tt.tiers.forEach((t,i)=>{ if(v>=t[1]) cur=i; });
  const next=cur+1<tt.tiers.length?tt.tiers[cur+1]:null;
  return {v,cur,next};
}
function tierTrophyTiles(){
  const rows=TIER_TROPHIES.map(tt=>{ const info=tierInfo(tt), on=info.cur>=0, tier=on?tt.tiers[info.cur][0]:"bronze";
    TIER_OF[tt.key]=tier; TRO_GLYPH[tt.key]=TRO_GLYPH[tt.key]||tt.glyph;
    const label= info.next? (on?TIERS[tier].n+" · encore "+(info.next[1]-info.v)+" pour "+TIERS[info.next[0]].n.toLowerCase():"Débloque à "+info.next[1])
                          : TIERS.plat.n+", complet";
    return `<button class="trophy ${on?"":"locked"} t-${tier}" data-a="tiertrophy" data-k="${tt.key}">${medal(tt.key,on,on?null:info.v/tt.tiers[0][1])}<div class="tn">${esc(tt.n)}</div><div class="tp">${esc(label)}</div></button>`;
  }).join("");
  return `<h2 class="sh">Paliers</h2><div class="sh-sub">Certains trophées montent en grade au lieu de s’arrêter au premier palier.</div><div class="trophies">${rows}</div>`;
}
function tierTrophySheet(key){
  const tt=TIER_TROPHIES.find(x=>x.key===key); if(!tt) return;
  openSheet(()=>{ const info=tierInfo(tt), on=info.cur>=0, tier=on?tt.tiers[info.cur][0]:"bronze";
    return {title:"",body:`<div class="ts-hero t-${tier} ${on?"on":""}"><div class="ts-rays"></div><div class="ts-m">${medal(key,on,on?null:info.v/tt.tiers[0][1])}</div><span class="tp-tier">${on?TIERS[tier].n:"Verrouillé"}</span><h1>${esc(tt.n)}</h1><p>${esc(tt.d)}</p></div>
    <div class="card" style="margin-top:8px"><div class="ts-prog"><span>${info.v} · ${tt.tiers.map(t=>TIERS[t[0]].n+" dès "+t[1]).join(" · ")}</span></div>${info.next?`<div class="gf" style="margin:10px 0 0">Encore ${info.next[1]-info.v} pour ${TIERS[info.next[0]].n.toLowerCase()}.</div>`:`<div class="gf" style="margin:10px 0 0">Palier maximum atteint.</div>`}</div>`};
  },{short:true});
}
Object.assign(ACT,{ tiertrophy:(d)=>tierTrophySheet(d.k) });
// palier franchi = petite notification, sans l'animation plein écran (réservée aux trophées classiques)
function checkTierTrophies(){
  S.tierSeen=S.tierSeen||{}; let did=false;
  TIER_TROPHIES.forEach(tt=>{ const info=tierInfo(tt); if(info.cur<0) return; const seen=S.tierSeen[tt.key]??-1;
    if(info.cur>seen){ S.tierSeen[tt.key]=info.cur; did=true; const tier=tt.tiers[info.cur][0]; TIER_OF[tt.key]=tier; TRO_GLYPH[tt.key]=TRO_GLYPH[tt.key]||tt.glyph;
      setTimeout(()=>toast(TIERS[tier].n+" débloqué : "+tt.n,{icon:medal(tt.key,true),trophy:1}),500); } });
  if(did){ dirty.profil=1; save(); }
}
const _checkTrophiesTier=checkTrophies;
checkTrophies=function(){ _checkTrophiesTier(); checkTierTrophies(); };
const _trophyGridTier=trophyGrid;
trophyGrid=function(){ return tierTrophyTiles()+_trophyGridTier(); };
setTimeout(()=>{ try{ checkTierTrophies(); }catch(e){} },2900);
