// ================= ZESTE 1.68 : modèle de goût — une variante compte comme son ingrédient de base =================
// Sans ce lien, aimer un gin tonic n'apprenait rien sur le gin tonic méditerranéen (tonic_med ≠ tonic pour le modèle) :
// banc m6 (300 utilisateurs, graines 1-3), NDCG à 8 notes 0,573 (1.67) → 0,561 avec les nouvelles recettes ; voir HANDOFF.
const ING_KIN={tonic_med:"tonic",tonic_sureau:"tonic",tonic_aromatique:"tonic",tonic_concombre:"tonic",tonic_leger:"tonic",
  limonade_sicilienne:"limonade",biere_blanche:"biere",ipa:"biere",biere_0:"biere",poire:"cidre",gin_rose:"gin",gin_0:"gin",tequila_repo:"tequila"};
{ const _sh=shares; shares=function(r){ const w=_sh(r); if(w.__k) return w; const o={};
    for(const k in w){ const b=ING_KIN[k]||k; o[b]=(o[b]||0)+w[k]; }
    Object.defineProperty(o,"__k",{value:1}); return r._sh=o; }; }
