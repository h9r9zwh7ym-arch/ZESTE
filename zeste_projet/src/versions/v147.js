// ================= ZESTE 1.47 : Bar et feuille de niveau — mise en page (rendu seulement) =================
// Le niveau ne s'affiche qu'une fois par ligne : la fraction devient le bouton (plus de barres) ; patchStock met
// toujours à jour le texte (.s) ; la feuille de niveau reste ouverte par « lvlpick ».
{ const _sr=stockRow;
  stockRow=function(id){ let h=_sr(id); if(!tracked(id)) return h;
    const m=h.match(/<span class="s lvl-txt">([\s\S]*?)<\/span>/); if(!m) return h;
    h=h.replace(m[0],"");
    return h.replace(/(<button class="lvl one[^"]*"[^>]*>)[\s\S]*?<\/button>/,(x,o)=>`${o}${m[0]}</button>`); };
}
// le gros bouton « Ajouter des ingrédients » seulement quand le bar est vide (le « + » reste en haut à droite)
{ const _vb=vBar;
  vBar=function(){ const h=_vb(); if(!Object.keys(S.stock).some(id=>ING[id]&&!ING[id].basic)) return h;
    return h.replace(/<div class="sp24"><\/div><div class="btn-row"><button class="btn sec" data-a="addsheet">[\s\S]*?<\/button><\/div>/,""); };
}
