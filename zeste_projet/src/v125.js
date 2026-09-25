// ================= 1.27 : étagère, accueil du matin =================
// ---------- Étagère : raccourcis de rayon, indication claire pour les basiques/softs, effet de profondeur ----------
function shelfView(ids){
  const segs=[["spirit","Spiritueux"],["liq","Liqueurs et amers"],["vin","Vins et vermouths"],["sirop","Sirops"],["soft","Softs et jus"]], LV=["Vide","¼","½","¾","Pleine"];
  const present=segs.filter(([sg])=>ids.some(id=>segOf(id)===sg));
  const tot=ids.length, empty=ids.filter(id=>tracked(id)&&S.stock[id]===0).length;
  let o=`<div class="bar2"><div class="b2-glow"></div><div class="b2-head"><b>${tot} bouteille${tot>1?"s":""}</b>${empty?`<span class="b2-warn">${empty} à racheter</span>`:""}</div>`;
  if(present.length>1) o+=`<div class="b2-jump">${present.map(([sg,n])=>`<button data-a="shelfjump" data-sg="${sg}"><i style="background:${SEGCOL[sg]}"></i>${esc(n)}</button>`).join("")}</div>`;
  let k=0;
  present.forEach(([sg,n])=>{ const L=ids.filter(id=>segOf(id)===sg).sort((a,b)=>(S.stock[b]>0)-(S.stock[a]>0)||ING[a].n.localeCompare(ING[b].n,"fr"));
    o+=`<div class="b2-shelf" id="b2-sg-${sg}"><div class="b2-lab">${esc(n)}<i>${L.length}</i></div><div class="b2-row">${L.map(id=>{ const tr=tracked(id), v=S.stock[id], lv=tr?v:(v===1?4:0), idx=k++;
      const tag= tr? `<span class="b2-l l${lv}">${LV[lv]}</span>` : `<span class="b2-l ${v===1?"l4":"l0"}">${v===1?"En stock":"À racheter"}</span>`;
      return `<button class="b2-b ${lv===0?"vide":""}" data-a="shelfpick" data-id="${id}" style="--i:${idx};--d:${(idx%9)*0.7}s"><span class="b2-svg">${bottleSVG(id,lv,false,FX("live")?((idx%9)*0.8).toFixed(1):0)}</span><span class="b2-tag"><span class="b2-n">${esc(shortN(id))}</span>${tag}</span></button>`; }).join("")}</div><div class="b2-board"><i></i></div></div>`; });
  return o+`</div><div class="gf" style="margin-top:10px">Touche une bouteille pour changer son niveau, son prix ou voir ce qu’elle permet de faire.</div>`;
}
Object.assign(ACT,{ shelfjump:(d)=>{ const el=document.getElementById("b2-sg-"+d.sg); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); } });

// ---------- Accueil du matin : pas de propositions de cocktails ----------
// Le matin n'est pas vraiment l'heure de l'apéro : la carrousel « Aussi pour toi » ne s'affiche pas dans ce cas.
// Le reste (préparation qui périme, mets, etc.) continue de s'afficher normalement.
const _suggestMorning=HOME_SEC.suggest;
HOME_SEC.suggest=(ctx)=>{ if(ctxInfo().moment==="matin") return ""; return _suggestMorning(ctx); };
