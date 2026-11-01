// ================= ZESTE 1.83 : format paysage et grands écrans =================
// (chargé en tout dernier, après v130.js qui remplace moveTabInd : cette enveloppe doit venir après)
// En paysage sur iPhone (hauteur ≤ 540 px) et sur les grands écrans (iPad, ordinateur : largeur ≥ 1000 px), la barre
// d'onglets devient un rail vertical à gauche, l'accueil met le verre à côté du texte, et le Labo passe en deux
// colonnes (la scène du verre reste en place à gauche pendant qu'on compose à droite). Tout est en CSS (style.css,
// bloc « 1.83 ») ; ici, seulement la pastille de l'onglet actif, qui se déplace verticalement sur le rail.
function isRail(){ const tb=document.querySelector(".tabbar"); return !!tb&&getComputedStyle(tb).flexDirection==="column"; }
// (1.85) même pastille dans les deux modes : 30 px de haut, derrière l'icône, largeur de la colonne − 8 px (68 px au plus
// sur le rail, comme en portrait sur iPhone) ; en tournant l'appareil, elle se pose sans glisser à travers l'écran.
let TABIND_W=68;
{ const _m=moveTabInd;
  moveTabInd=function(){ const tb=document.querySelector(".tabbar"), on=tb&&tb.querySelector("button.on"), ind=tb&&tb.querySelector(".tab-ind"); if(!on||!ind) return;
    if(!isRail()){ ind.style.top=""; ind.style.height=""; const r=_m.apply(this,arguments); const w=parseFloat(ind.style.width); if(w>0) TABIND_W=w; return r; }
    const a=tb.getBoundingClientRect(), r=on.getBoundingClientRect(), w=Math.round(Math.min(TABIND_W,r.width-8));
    ind.style.width=w+"px"; ind.style.height=""; ind.style.top="0px";
    ind.style.transform=`translate(${Math.round(r.left-a.left+r.width/2-w/2)}px,${Math.round(r.top-a.top-1)}px)`; };
}
// rotation ou redimensionnement : la pastille se pose sans animation (classe tb-snap), puis se recale quand iOS a fini
// sa mise en page ; le mini-verre du Labo se recalcule
{ let t=[]; const re=()=>{ const tb=document.querySelector(".tabbar"); if(tb) tb.classList.add("tb-snap"); t.forEach(clearTimeout);
    const go=()=>{ try{ moveTabInd(); if(typeof miniSync==="function") miniSync(); }catch(e){} };
    requestAnimationFrame(go); t=[setTimeout(go,150),setTimeout(go,400),setTimeout(()=>{ go(); requestAnimationFrame(()=>tb&&tb.classList.remove("tb-snap")); },700)]; };
  addEventListener("resize",re); addEventListener("orientationchange",re); }
