// ================= ZESTE 1.46 : Labo (Composer) — hiérarchie et mise en page =================
// Rendu seulement : aucun calcul, score, versement ni enregistrement n'est modifié.
let LAB_PERSO_OPEN=false, LAB_CHAL_OPEN=false;
document.addEventListener("toggle",e=>{ const t=e.target; if(!t||!t.classList) return;
  if(t.classList.contains("lab-perso")) LAB_PERSO_OPEN=t.open; else if(t.classList.contains("lab-chal")) LAB_CHAL_OPEN=t.open; },true);
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc(); const M=mixState(), n=M.items.length;
    // carte du verre : le style deviné fait doublon avec « Style » ; un score vide se dit en clair
    h=h.replace(/<span class="lab-chip">[\s\S]*?<\/span>/,"");
    h=h.replace(/(<span class="lab-score[^"]*"[^>]*>)<b>\?<\/b><i>\/100<\/i>/,(m,o)=>`${o}<b class="lab-score-t">${n?"Sers pour noter":"Verse un ingrédient"}</b>`);
    // objectifs : une seule ligne si tout va bien, sinon seulement ce qui pose problème
    h=h.replace(/<div class="lab-goals">([\s\S]*?)<\/div>/,(m,inner)=>{
      const bad=(inner.match(/<button class="goal[^"]*"[\s\S]*?<\/button>/g)||[]).filter(b=>!/class="goal[^"]*\b(ok|bonus)\b/.test(b));
      return bad.length? `<div class="lab-goals warn">${bad.join("")}</div>` : `<div class="lab-allok">${lu("check")}Tout est bon</div>`; });
    // verre : « Auto » est un état cliquable
    h=h.replace(/<span class="more muted"[^>]*>Choisi par le barman<\/span>|<button class="more" data-a="mixglassauto">Auto<\/button>/,
      `<button class="lab-auto${M.gUser?"":" on"}" data-a="mixglassauto" aria-pressed="${!M.gUser}">Auto</button>`);
    // service : Décor, Méthode et Style repliés dans « Personnaliser » avec un résumé
    // (1.48) la carte s'arrête au premier élément qui ne relève pas du service : titre, Servir, analyse, actions
    const d0=h.indexOf('<div class="lab-sub">Décor'), d1=d0<0?-1:Math.min(...['<h2','<div class="sp16"></div><div class="btn-row','<details class="lab-more"','<div class="btn-row'].map(k=>h.indexOf(k,d0)).filter(x=>x>=0),h.lastIndexOf("</div>"));
    if(d0>=0){ const end=d1, part=h.slice(d0,end);
      const pick=re=>{ const x=h.match(re); return x?x[1].trim():""; };
      const g=pick(/class="lg on[^"]*"[^>]*>[\s\S]*?<b>([^<]+)<\/b>/), gar=(part.match(/class="lgar on[^"]*"[^>]*>[\s\S]*?<b>([^<]+)<\/b>/g)||[]).map(x=>x.match(/<b>([^<]+)<\/b>/)[1]),
        meth=(part.match(/<button class="on" data-a="mm"[^>]*>([^<]+)<\/button>/)||[])[1]||"", sty=(part.match(/<button class="chip on" data-a="mixtype"[^>]*>([^<]+)<\/button>/)||[])[1]||"";
      // (1.50) seulement ce qui est dans la section, libellés courts pour tenir sur une ligne
      const SHORT={"Verre à mélange":"Mélange","Cocktail court":"Court","Sec et fort":"Sec","Long drink":"Long","Je ne sais pas":"Style auto","Zeste de citron":"Zeste citron","Zeste d’orange":"Zeste orange"}, sh=x=>SHORT[x]||x;
      const sum=[gar.length?(gar.length>2?gar.length+" décors":gar.map(sh).join(", ")):"Sans décor",sh(meth),sh(sty)].filter(Boolean).map(esc).join(" · ");
      h=h.slice(0,d0)+`<details class="lab-perso"${LAB_PERSO_OPEN?" open":""}><summary><span class="lp-t">Personnaliser</span><span class="lp-s">${sum}</span>${IC.chev}</summary>${part}</details>`+h.slice(end); }
    // actions : Servir fixé au-dessus des onglets, Recommencer séparé
    h=h.replace('<div class="btn-row"><button class="btn lab-serve','<div class="btn-row lab-servebar"><button class="btn lab-serve');
    h=h.replace('<div class="btn-row"><button class="btn danger" data-a="mixclear"','<div class="btn-row lab-reset"><button class="btn danger" data-a="mixclear"');
    // défis : repliés par défaut
    h=h.replace(/<h2 class="sh[^"]*">Défis de la semaine(?:<span class="more muted"[^>]*>([^<]*)<\/span>)?<\/h2>(<div class="scroller chal-row[^"]*">[\s\S]*?<\/div>)/,(m,left,row)=>
      `<details class="lab-chal"${LAB_CHAL_OPEN?" open":""}><summary><span class="lp-t">Défis de la semaine</span><span class="lp-s">${left||""}</span>${IC.chev}</summary>${row}</details>`);
    return h; };
}
{ const _clr=ACT.mixclear;
  ACT.mixclear=(d,el)=>{ if(el&&!el.dataset.sure){ const t=el.textContent; el.dataset.sure="1"; el.textContent="Confirmer : tout effacer";
      clearTimeout(el._t); el._t=setTimeout(()=>{ delete el.dataset.sure; el.textContent=t; },3000); return; }
    return _clr(d,el); }; }
