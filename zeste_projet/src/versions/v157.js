// ================= ZESTE 1.56 (B) : accent réservé, profil de goût, ambiance, réglages de version =================
// onglet Profil : une personne (Lucide user-round) au lieu du trophée
{ const _init=init; init=function(){ const r=_init.apply(this,arguments); const b=document.querySelector('.tabbar button[data-t="profil"]'); if(b){ const s=b.querySelector('svg'); if(s) s.outerHTML=lu("user-round"); } return r; }; }
// « Ta version » : petits − et + aux extrémités de chaque piste
{ const _rp=recPolish; recPolish=function(o){ o=_rp(o); o.body=o.body.replace(/<div class="adj-dots">/g,'<div class="adj-dots"><span class="adj-end" aria-hidden="true">−</span>').replace(/(<div class="adj-dots">[\s\S]*?)(<\/div><\/div>)/g,(m,a,b)=>a+'<span class="adj-end" aria-hidden="true">+</span>'+b); return o; }; }
