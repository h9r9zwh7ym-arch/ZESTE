// ================= ZESTE 1.55 : labo — accords sans alcool =================
// pairings() choisit les accords d'après l'alcool de base ; sans alcool (baseOf vide), il prenait ceux du gin
// (gin, chartreuse, vermouth…). Un mélange sans alcool à base de Crodino ou de Sanbitter prend les accords « amer_na »,
// et un mélange sans alcool ne se voit jamais proposer d'alcool.
{ const _pa=pairings;
  pairings=function(items){ if(baseOf(items)) return _pa(items);
    const inMix=new Set(items.map(i=>i.id)), g=items.map(i=>SPIRIT_GROUP[i.id]).find(Boolean);
    let L=(PAIR[g]||PAIR.amer_na).slice(); if(items.some(i=>i.id==="ginger_beer"||i.id==="sirop_gingembre")) L=L.concat(PAIR.gingembre);
    L=[...new Set(L)].filter(id=>!inMix.has(id)&&ING[id]&&!(ING[id].abv>0)); L.sort((a,b)=>has(b)-has(a)); return L.slice(0,4); };
}
