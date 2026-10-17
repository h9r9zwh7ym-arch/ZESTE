// ================= ZESTE 1.60 (A) : finitions, rendu seulement =================
// Radar de Cocktails : préréglage actif marqué, plus de consigne, la poignée la plus proche du doigt est saisie (zone de 44 px)
let RADSEL=null;
{ const _rv=radarView; radarView=function(){ let h=_rv();
    h=h.replace(/<div class="sh-sub"[^>]*>Fais glisser les points[^<]*<\/div>/,"").replace('<div class="chips" style="margin-bottom:6px">','<div class="chips rad-chips" style="margin-bottom:6px">');
    if(RADSEL) h=h.replace(RADSEL==="mine"?'<button class="chip" data-a="radmine">':`<button class="chip" data-a="radpreset" data-v="${RADSEL}">`,m=>m.replace('class="chip"','class="chip on" aria-pressed="true"'));
    return h.replace("<b>Les plus proches</b>","<b>Les plus proches de ton goût</b>"); };
  const _rp=ACT.radpreset, _rm=ACT.radmine; ACT.radpreset=d=>{ RADSEL=d.v; _rp(d); }; ACT.radmine=d=>{ RADSEL="mine"; _rm(d); };
  // lignes : « 71 % » seulement ; point vert si faisable, rien sinon
  radarResults=function(){ return radarMatches().map(([r,m])=>{ const h=recRow(r,m+" %"); return status(r).ok? h : h.replace(/<span class="dot [^"]*"><\/span>/,""); }).join(""); };
  if(typeof document!=="undefined") document.addEventListener("pointerdown",e=>{ const svg=e.target.closest&&e.target.closest("#radsvg"); if(!svg) return;
    let best=null, bd=1e9; svg.querySelectorAll(".rad-h").forEach(h=>{ const b=h.getBoundingClientRect(), d=Math.hypot(e.clientX-(b.left+b.width/2),e.clientY-(b.top+b.height/2)); if(d<bd){ bd=d; best=h; } });
    if(!best||bd>22) return; e.stopPropagation(); e.preventDefault(); RADDRAG=+best.dataset.ax; RADSEL=null; best.classList.add("drag");
    svg.querySelectorAll(".rad-chips .chip.on").forEach(c=>c.classList.remove("on")); document.querySelectorAll(".rad-chips .chip.on").forEach(c=>{ c.classList.remove("on"); c.removeAttribute("aria-pressed"); }); },true);
}
// Lignées : la carte d'intro garde sa phrase (le titre répète la chip) ; sous-titre des lignes = spiritueux de base
{ const _tv=treeView; treeView=function(){ return _tv().replace(/(<div class="card lin-card">)<b>[^<]*<\/b>/,"$1")
    .replace(/(<button class="tcard[^"]*" data-a="rec" data-id="([\w]+)">[\s\S]*?<span class="tt2"><b>[^<]*<\/b><span>)[^<]*(<\/span>)/g,(m,a,id,b)=>{ const r=RMAP[id], bs=r&&r.base; return a+(bs?esc(shortN(bs)):"")+b; }); }; }
