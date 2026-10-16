// ================= ZESTE 1.49 : Labo (Composer) — retouches visuelles (rendu seulement) =================
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc();
    // pas de consigne sous « Les ingrédients » ; score pas encore donné : un anneau avec un tiret
    h=h.replace(/<div class="sh-sub[^"]*">Touche une bouteille pour verser\.<\/div>/,"");
    h=h.replace(/<b class="lab-score-t">[^<]*<\/b>/,'<span class="lab-ring" role="img" aria-label="Pas encore de note">–</span>');
    // conseils : une ligne compacte par conseil (icône, suggestion, bouton « + »), sans titre ni phrase
    h=h.replace(/<h2 class="sh[^"]*">Conseils du barman<\/h2>/,"");
    h=h.replace(/<div class="tip-r([^"]*)">(<svg[\s\S]*?<\/svg>)<div class="grow"><b>([^<]*)<\/b><span>[^<]*<\/span>(<button class="btn small sec"([^>]*)>([^<]*)<\/button>)?<\/div><\/div>/g,(m,cls,ic,title,btn,attrs,label)=>{
      if(!btn) return `<div class="tip-r tip-one${cls}">${ic}<span class="tip-t">${title}</span></div>`;
      const a=(attrs.match(/data-a="([^"]+)"/)||[])[1], v=(attrs.match(/data-v="([^"]+)"/)||[])[1];
      const add=a==="mixgar"||a==="mixfix"||a==="mixadd1";
      const sugg=a==="mixgar"&&typeof LGARTXT!=="undefined"&&LGARTXT[v]? esc(LGARTXT[v]) : (label.replace(/^(Ajouter|Prendre)\s+/,"")||title);
      return `<div class="tip-r tip-one${cls}">${ic}<span class="tip-t">${add||a==="mixglass"?sugg:title}</span><button class="btn small sec tip-b"${attrs} aria-label="${esc(label)}">${add?lu("plus"):esc(label)}</button></div>`; });
    return h; };
}
