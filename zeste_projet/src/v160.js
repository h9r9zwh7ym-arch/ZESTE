// ================= ZESTE 1.59 : lot A→G (rendu) =================
// A5 — « Le saviez-vous ? » : la carte prend la hauteur de la face affichée (plus de vide sous la citation)
function discFit(root){ (root||document).querySelectorAll(".disc").forEach(d=>{ const inn=d.querySelector(".disc-in"), f=d.querySelector(d.classList.contains("flipped")?".disc-b":".disc-f"); if(inn&&f&&f.offsetHeight) inn.style.height=f.offsetHeight+"px"; }); }
{ const _rv=renderView; renderView=function(t){ const r=_rv.apply(this,arguments); if(t==="today") requestAnimationFrame(()=>discFit(document.getElementById("v-today"))); return r; };
  const _fl=ACT.flip; ACT.flip=function(d,t){ const r=_fl.apply(this,arguments); const c=t&&t.closest(".disc"); if(c) discFit(c.parentNode); return r; };
  if(typeof addEventListener==="function") addEventListener("resize",()=>discFit()); if(typeof document!=="undefined"&&document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>discFit()); }
