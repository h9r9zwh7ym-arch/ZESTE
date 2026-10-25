// ================= ZESTE 1.70 : corrections de l'audit — enveloppes perdues =================
// Une version plus récente avait réécrit entièrement des fonctions déjà enveloppées par une plus ancienne : l'ajout de
// l'ancienne disparaissait en silence (repéré par tests/wrappers.js, qui l'interdit désormais).

// 1. Réglages > Suggestions > « Inclure les créations à tester » : sans effet depuis la 1.59 (v161 réécrit tonightRaw sans le filtre de v120)
{ const _t=tonightRaw; tonightRaw=function(){ const L=_t(); return S.settings.untested===false? L.filter(r=>!r.cr) : L; }; }

// 2. Explication « Pour finir ton … ouvert » : perdue en 1.59 (v161 réécrit reasons ; le bonus de la liste du soir, lui, restait)
{ const _r=reasons; reasons=function(r){ const rt=S.ratings[r.id];
    if(!(rt>=4)&&typeof perishing==="function"){ const p=perishing(r); if(p){ const n=lc(shortN(p[0]));
      return "Pour finir "+(/^[aeiouyéèêàâîïôœ]/i.test(n)?"ton ":FEM.test(n)?"ta ":"ton ")+n+" ouvert"+(FEM.test(n)?"e":"")+" "+p[1]; } }
    return _r(r); }; }

// 3. Sons perdus quand l'action a été réécrite après le câblage de sound.js (le son est rejoué après l'action, comme dans sound.js)
{ const W=(k,f)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const r=g(d,t); try{ if(typeof SND!=="undefined") f(d||{}); }catch(e){} return r; }; };
  W("mixfit",()=>SND.pour(0.4));
  W("advdo",()=>SND.pop(1.3));
  W("mapclose",()=>SND.whoosh(false)); }
