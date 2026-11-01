// ================= ZESTE 1.76 : alcoolémie juste =================
// Jusqu'ici, chaque « Je l'ai fait » comptait un verre de la recette d'origine, quels que soient le nombre de verres choisi
// dans la fiche (ou dans le mode barman) et « Ta version » (plus fort, plus léger…). L'entrée de l'historique garde
// maintenant m (nombre de verres) et v:"mine" (ta version), et l'estimation en tient compte.
// Le nombre de verres ne change pas les compteurs (historique, trophées, récaps) : une préparation reste une entrée.

// 1. La fiche recette expose son nombre de verres et sa version (variables locales de recSheet)
{ const _rs=recSheet;
  recSheet=function(id){ const ret=_rs(id), sh=SHEETS[SHEETS.length-1]; if(!sh||sh.recId!==id) return ret;
    sh._mult=S.settings.glasses||1; sh._ver=getAdj(id)?"mine":"orig";
    const sm=sh.setMult, sv=sh.setVer;
    if(sm) sh.setMult=d=>{ sh._mult=Math.max(1,Math.min(8,sh._mult+d)); return sm(d); };
    if(sv) sh.setVer=v=>{ sh._ver=v; return sv(v); };
    return ret; };
}
// 2. Au moment de « Je l'ai fait » (fiche) ou de la fin du mode barman : on note le contexte, logMade l'attache
let MADE_CTX=null;
{ const W=(k,ctx)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ MADE_CTX=ctx(d||{}); try{ return g(d,t); } finally { MADE_CTX=null; } }; };
  W("made",d=>{ const sh=[...SHEETS].reverse().find(s=>s.recId===d.id); return sh? {m:sh._mult||1, v:sh._ver==="mine"&&getAdj(d.id)?"mine":""} : null; });
  W("bmfinish",()=>BM&&BM.r? {m:BM.mult||1, v:getAdj(BM.r.id)?"mine":""} : null);
}
{ const _lm=logMade;
  logMade=function(id){ const n=S.hist.length, c=MADE_CTX; const r=_lm.apply(this,arguments);
    const h=S.hist[n]; if(h&&h.id===id&&c&&(c.m>1||c.v)){ if(c.m>1) h.m=c.m; if(c.v) h.v=c.v; save(); }
    return r; };
}
// 3. L'estimation : grammes d'alcool × nombre de verres, d'après ta version si c'est elle qui a été préparée
function bacGramsOf(h){ const r=RMAP[h.id]; if(!r||r.na) return 0;
  const m= h.v==="mine"&&getAdj(h.id)? calc(adjItems(r),r.m,r.ice) : metricsR(r);
  return m.abv>0? gramsOf(m.vol,m.abv)*(h.m>1?h.m:1) : 0; }
{ const _b=bacEventsRaw;
  bacEventsRaw=function(){ const cutoff=Date.now()-30*36e5, out=_b().filter(e=>e.kind!=="c");
    S.hist.forEach(h=>{ if(h.t<cutoff) return; const g=bacGramsOf(h); if(g<=0) return; const r=RMAP[h.id];
      out.push({t:h.t,g,kind:"c",n:r.n+(h.m>1?" × "+h.m:"")+(h.v==="mine"?" (ta version)":"")}); });
    return out.sort((a,b)=>a.t-b.t); };
}
