// ================= ZESTE 1.54 : Labo — conseils, composition (rendu seulement) =================
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc(); const M=mixState();
    // conseils : « ! » orange seulement pour un ingrédient manquant ; sinon une ampoule grise
    h=h.replace(/<div class="tip-r tip-one([^"]*)">(<svg[\s\S]*?<\/svg>)([\s\S]*?<\/div>)/g,(m,cls,ic,rest)=>{
      if(/\bbad\b/.test(cls)) return m;
      const miss=/data-a="mixfix"/.test(rest);
      return `<div class="tip-r tip-one${cls}${miss?" tip-miss":""}">${miss?ic:lu("lightbulb","tip-bulb")}${rest}`; });
    // composition : pas de point de couleur ; l'unité complète (« 4 feuilles ») comme dans la fiche recette
    h=h.replace(/(<div class="n">)<i style="[^"]*"><\/i>/g,"$1");
    h=h.replace(/(<button data-a="mixq" data-k="(\d+)" data-d="-1"[^>]*>[\s\S]*?<\/button><span>)([^<]*)(<\/span>)/g,(m,a,k,t,b)=>{
      const it=M.items[+k]; if(!it) return m; const u=unitOf(it.id); return u==="ml"? m : a+esc(fmtQ({q:it.q,u}))+b; });
    return h; };
}
