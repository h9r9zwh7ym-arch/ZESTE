// ================= 1.22 =================
// Économie d’énergie : les animations décoratives s’arrêtent après quelques cycles (voir style.css)
// et repartent au premier toucher, au plus toutes les 4 secondes.
let REANIM_T=0;
function reanimate(root){ const now=Date.now(); if(now-REANIM_T<4000) return; REANIM_T=now;
  // une animation CSS terminée ne se relance qu'en changeant de nom : on alterne entre deux copies (style.css)
  (root||document).querySelectorAll("svg.live").forEach(el=>{ const a=el.classList.contains("again1"); el.classList.toggle("again1",!a); el.classList.toggle("again2",a); }); }
document.addEventListener("pointerdown",()=>reanimate(document),{passive:true});
