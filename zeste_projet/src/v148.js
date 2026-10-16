// ================= ZESTE 1.48 : versement qui s'adapte à la place restante =================
// Avant : toucher une bouteille versait toujours la dose par défaut (4,5 cl de spiritueux, 10 cl de soda…) ou un pas
// de stepper ; si elle ne tenait pas, labTry refusait tout (« Plus de place dans ce verre ! »), même avec 2 cl de libre.
// Maintenant : dose = min(dose habituelle, place restante), arrondie vers le bas au plus petit pas des steppers (0,25 cl),
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
    if(u!=="ml") return labNope();                                          // traits, feuilles, pièces : pas de demi-dose
    let add=Math.floor(want/POUR_STEP)*POUR_STEP; while(add>=POUR_STEP&&!labFitsWith(withAdd(add))) add-=POUR_STEP;
    if(add<POUR_STEP) return labNope();
    if(t){ t.classList.remove("pour"); void t.offsetWidth; t.classList.add("pour"); }
    labTry(()=>{ if(ex) ex.q=Math.round((ex.q+add)*10)/10; else S.mix.items.push({id:d.id,q:add}); });
    if(typeof SND!=="undefined"&&SND.pour) SND.pour(0.4); };
}
