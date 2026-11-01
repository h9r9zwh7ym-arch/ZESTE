// ================= ZESTE 1.85 : grand titre qui s'efface sous la barre de titre =================
// En faisant défiler une vue, le grand titre (h1.lt) passait sous la barre de titre translucide et floutée : on voyait un
// fantôme flou du titre à gauche, en plus du petit titre net au centre. Il s'estompe désormais à mesure qu'il glisse
// sous la barre (comme dans les apps d'Apple), ainsi que la ligne juste au-dessus (date de l'accueil).
// (La pastille d'onglet identique en portrait et en paysage, et la rotation sans glissé, sont dans versions/v186.js.)
function fadeLargeTitle(v){ if(!v||!v.classList||!v.classList.contains("view")) return;
  const h=v.querySelector("h1.lt"); if(!h) return;
  // la barre de titre devient opaque, avec le petit titre, à 34 px de défilement (ui.js, onScroll) : le grand titre
  // s'efface entre 10 et 34 px, pour qu'on ne voie jamais les deux titres à la fois
  const y=v.scrollTop, k=Math.max(0,Math.min(1,1-(y-10)/24)), o=y<=10?"":k.toFixed(3);
  h.style.opacity=o; const prev=h.previousElementSibling; if(prev&&prev.getBoundingClientRect().bottom<=h.getBoundingClientRect().top+2) prev.style.opacity=o; }
document.addEventListener("scroll",e=>{ fadeLargeTitle(e.target); },{capture:true,passive:true});
{ const _rv=renderView; renderView=function(t){ const r=_rv.apply(this,arguments); try{ fadeLargeTitle(document.getElementById("v-"+t)); }catch(e){} return r; }; }
