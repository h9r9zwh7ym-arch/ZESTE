// ================= ZESTE 1.48 : versement qui s'adapte à la place restante =================
// Avant : toucher une bouteille versait toujours la dose par défaut (4,5 cl de spiritueux, 10 cl de soda…) ou un pas
// de stepper ; si elle ne tenait pas, labTry refusait tout (« Plus de place dans ce verre ! »), même avec 2 cl de libre.
// Maintenant : dose = min(dose habituelle, place restante) (depuis 1.56 au 0,1 ml près, sans seuil minimal),
// sans jamais dépasser le verre (même test labFits, verre automatique compris). Moins d'un pas de place : la jauge
// tremble, sans message. Les doses des ingrédients déjà présents ne changent pas.
const POUR_STEP=2.5;
function labFitsWith(items){ const bk=S.mix.items; S.mix.items=items; try{ return labFits(items); } finally { S.mix.items=bk; } }
function labNope(){ const el=document.querySelector(".lab-stage"); if(!el) return; el.classList.remove("shake-no"); void el.offsetWidth; el.classList.add("shake-no"); }
{ const _mp=ACT.mixpour;
  ACT.mixpour=(d,t)=>{ const items=S.mix.items, ex=items.find(i=>i.id===d.id), u=unitOf(d.id);
    const want=ex? stepQ(ex.q,u,1)-ex.q : defaultQ(d.id);
    const withAdd=add=>ex? items.map(i=>i===ex?Object.assign({},i,{q:Math.round((i.q+add)*10)/10}):i) : items.concat([{id:d.id,q:add}]);
    if(labFitsWith(withAdd(want))) return _mp(d,t);                       // la dose habituelle tient : comportement inchangé
    if(u!=="ml") return labOverflow();                                      // traits, feuilles, pièces : pas de demi-dose
    // (1.56) plus de seuil minimal : on verse la plus grande quantité qui tient (au 0,1 ml près), même 1 cl ou moins ;
    // refus seulement verre plein, avec le message unique de labOverflow
    let lo=0, hi=want; for(let k=0;k<24;k++){ const mid=(lo+hi)/2; if(labFitsWith(withAdd(mid))) lo=mid; else hi=mid; }
    const add=Math.floor(lo*10)/10;
    if(add<0.1) return labOverflow();
    if(t){ t.classList.remove("pour"); void t.offsetWidth; t.classList.add("pour"); }
    labTry(()=>{ if(ex) ex.q=Math.round((ex.q+add)*10)/10; else S.mix.items.push({id:d.id,q:add}); });
    if(typeof SND!=="undefined"&&SND.pour) SND.pour(0.4); };
}
