// ================= ZESTE 1.59 : lot A→G (rendu) =================
// A5 — « Le saviez-vous ? » : la carte prend la hauteur de la face affichée (plus de vide sous la citation)
function discFit(root){ (root||document).querySelectorAll(".disc").forEach(d=>{ const inn=d.querySelector(".disc-in"), f=d.querySelector(d.classList.contains("flipped")?".disc-b":".disc-f"); if(inn&&f&&f.offsetHeight) inn.style.height=f.offsetHeight+"px"; }); }
{ const _rv=renderView; renderView=function(t){ const r=_rv.apply(this,arguments); if(t==="today") requestAnimationFrame(()=>discFit(document.getElementById("v-today"))); return r; };
  const _fl=ACT.flip; ACT.flip=function(d,t){ const r=_fl.apply(this,arguments); const c=t&&t.closest(".disc"); if(c) discFit(c.parentNode); return r; };
  if(typeof addEventListener==="function") addEventListener("resize",()=>discFit()); if(typeof document!=="undefined"&&document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>discFit()); }
// F18 — Profil : titre, phrase et radar viennent tous du vecteur de goût final du modèle (getModel().DIR : notes, quiz, « Ta version »).
// Avant : titre = DIR, phrase = écart des notes à 2,5 (tasteVector().dir), radar = profil absolu des cocktails aimés → contradictions.
function tasteAxes(){ const M=getModel(); if(!M||M.n<2) return null; const D=M.DIR, mx=Math.max(...D.map(Math.abs)); if(!(mx>0.005)) return null;
  const s=D.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]), th=mx*0.25;
  return {D, mx, plus:s.filter(x=>x[0]>Math.max(th,0.005)).slice(0,3).map(x=>x[1]), minus:s.filter(x=>x[0]<-Math.max(th,0.005)).slice(-2).reverse().map(x=>x[1])}; }
function tasteRadar(){ const A=tasteAxes(); if(!A) return null; const av=avgProfile(), k=0.3/A.mx; return A.D.map((v,i)=>clamp01(av[i]+v*k)); }
tasteSentence=function(){ const A=tasteAxes(); if(!A) return ""; const n=i=>DIMS[i].toLowerCase(); let out="";
  if(A.plus.length) out+="Tu aimes ce qui est "+joinFr(A.plus.map(n)); if(A.minus.length) out+=(out?", un peu moins ce qui est ":"Tu aimes moins ce qui est ")+joinFr(A.minus.map(n));
  return out? out+".":""; };
focalTaste=function(){ const sty=tasteStyle(), rv=tasteRadar(), nR=rated().length;
  const src=nR&&S.quiz?"D’après tes notes et ton quiz.":nR?"D’après tes notes.":"D’après ton quiz.";
  const body= rv? `<div class="prof">${radarSVG(rv,avgProfile())}<div class="fc-txt">${esc(tasteSentence())||"Continue à noter pour affiner ton profil."}<span class="fc-note">${src}</span></div></div>`
    : `<div class="fc-txt">Note au moins trois cocktails, dont un qui t’a plu, pour voir apparaître ton profil de goût.</div>`;
  return `<div class="focal-card"><div class="fc-k">Ton profil de goût</div>${sty?`<div class="fc-t">${esc(sty)}</div>`:""}${body}</div>`; };
// F19 — Labo : « Conseillé » = ce que choisit « Auto ». Avant, le badge montrait labReco (le style seul) alors qu'Auto passait
// ensuite par l'échelle glace/contenance de v141 et pouvait prendre un autre verre. Une seule source : le choix automatique.
{ const _lg=labGlass;
  labGlass=function(){ const M=mixState(), mine=M.g; let auto;
    if(mine){ M.g=null; try{ auto=_lg().g; } finally { M.g=mine; } }
    const r=_lg(); if(!mine) auto=r.g;
    return auto===r.rec.g? r : Object.assign({},r,{rec:Object.assign({},r.rec,{g:auto})}); }; }
