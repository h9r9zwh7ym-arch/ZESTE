// ================= ZESTE 1.83 : format paysage et grands écrans =================
// (chargé en tout dernier, après v130.js qui remplace moveTabInd : cette enveloppe doit venir après)
// En paysage sur iPhone (hauteur ≤ 540 px) et sur les grands écrans (iPad, ordinateur : largeur ≥ 1000 px), la barre
// d'onglets devient un rail vertical à gauche, l'accueil met le verre à côté du texte, et le Labo passe en deux
// colonnes (la scène du verre reste en place à gauche pendant qu'on compose à droite). Tout est en CSS (style.css,
// bloc « 1.83 ») ; ici, seulement la pastille de l'onglet actif, qui se déplace verticalement sur le rail.
function isRail(){ const tb=document.querySelector(".tabbar"); return !!tb&&getComputedStyle(tb).flexDirection==="column"; }
{ const _m=moveTabInd;
  moveTabInd=function(){ const tb=document.querySelector(".tabbar"), on=tb&&tb.querySelector("button.on"), ind=tb&&tb.querySelector(".tab-ind"); if(!on||!ind) return;
    if(!isRail()){ ind.style.top=""; ind.style.height=""; return _m.apply(this,arguments); }
    const a=tb.getBoundingClientRect(), r=on.getBoundingClientRect(), w=Math.round(Math.min(64,r.width-12)), h=34;
    ind.style.width=w+"px"; ind.style.height=h+"px"; ind.style.top="0px";
    ind.style.transform=`translate(${Math.round(r.left-a.left+r.width/2-w/2)}px,${Math.round(r.top-a.top+4)}px)`; };
}
// rotation ou redimensionnement : la pastille suit, le mini-verre du Labo se recalcule
{ let t=0; const re=()=>{ clearTimeout(t); t=setTimeout(()=>{ try{ moveTabInd(); if(typeof miniSync==="function") miniSync(); }catch(e){} },120); };
  addEventListener("resize",re); addEventListener("orientationchange",re); }
