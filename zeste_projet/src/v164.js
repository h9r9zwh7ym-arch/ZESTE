// ================= ZESTE 1.61 (A) : Labo — verser quand il reste peu de place, par tous les chemins =================
// Cause du bug : seule la tuile (ACT.mixpour, v148) adaptait la dose à la place restante, et elle tolérait 3 % de débordement
// (labFits ×1,03). Le « + » d'un conseil (mixfix), l'ajout direct (mixadd1, utilisé par les suggestions) et le « + » du stepper
// passaient la dose entière à labTry, qui refusait tout dès qu'elle ne tenait pas : avec un soda (dose 10 cl), refus sous 10 cl.
// Règle : place restante > 0 → on verse min(dose prévue, place), arrondi vers le bas au 0,05 cl (traits, feuilles… : nombre entier),
// sans jamais dépasser la contenance effective (tolérance 1e-6) ; refus seulement verre plein, avec un seul message.
function labFitsStrict(items){ const bk=S.mix.items; S.mix.items=items; try{ const M=mixState(), {g,ice}=labGlass();
    return labVol(items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&M.m!=="build"?"top":""})),M.m,ice)<=labAvail(g,ice)+1e-6; } finally{ S.mix.items=bk; } }
function labPour(id,want,t){ const items=S.mix.items, ex=items.find(i=>i.id===id), u=unitOf(id);
  const withAdd=add=>ex? items.map(i=>i===ex?Object.assign({},i,{q:Math.round((i.q+add)*100)/100}):i) : items.concat([{id,q:add}]);
  let add=0;
  if(u==="ml"){ if(labFitsStrict(withAdd(want))) add=want; else { let lo=0, hi=want; for(let k=0;k<30;k++){ const mid=(lo+hi)/2; if(labFitsStrict(withAdd(mid))) lo=mid; else hi=mid; } add=Math.floor(lo*2+1e-6)/2; } }
  else { for(let n=Math.round(want);n>=1;n--) if(labFitsStrict(withAdd(n))){ add=n; break; } }
  if(!(add>0)) { labOverflow(); return false; }
  if(t&&t.classList){ t.classList.remove("pour"); void t.offsetWidth; t.classList.add("pour"); }
  if(ex) ex.q=Math.round((ex.q+add)*100)/100; else S.mix.items.push({id,q:add});
  LAB_SERVE=null; if(typeof hideToast==="function") hideToast(); changed(); if(typeof SND!=="undefined"&&SND.pour) SND.pour(0.4); return true; }
{ const _mq=ACT.mixq;
  ACT.mixpour=(d,t)=>{ const ex=S.mix.items.find(i=>i.id===d.id), u=unitOf(d.id); return labPour(d.id, ex? stepQ(ex.q,u,1)-ex.q : defaultQ(d.id), t); };
  ACT.mixq=(d)=>{ const it=S.mix.items[+d.k]; if(!it) return; if(+d.d<0) return _mq(d); return labPour(it.id, stepQ(it.q,unitOf(it.id),1)-it.q); };
  ACT.mixfix=(d)=>labPour(d.id,+d.q);
  ACT.mixadd1=(d)=>labPour(d.id,defaultQ(d.id));
  // « Ajuster au verre » : remplit la contenance effective, sans la dépasser
  ACT.mixfit=()=>{ const M=mixState(), cur=labVol(mixItems(),M.m,labGlass().ice); if(!cur) return; const {g,ice}=labGlass(), A=labAvail(g,ice);
    const scaled=k=>M.items.map(i=>unitOf(i.id)==="ml"?Object.assign({},i,{q:Math.max(0.5,Math.floor(i.q*k*2)/2)}):i);
    let lo=0.05, hi=Math.max(1,A/cur*1.2); for(let n=0;n<30;n++){ const mid=(lo+hi)/2; if(labFitsStrict(scaled(mid))) lo=mid; else hi=mid; }
    M.items=scaled(lo); LAB_SERVE=null; changed(); toast("Quantités ajustées au verre"); }; }
