// ================= ZESTE 1.78 : gestes et « Annuler » cohérent =================
// 1. Bar : glisser le doigt sur le niveau d'une bouteille le change directement (¼ par 30 px), sans ouvrir la feuille.
//    Le glissé vers la gauche sur le reste de la ligne garde son rôle (« Finie »).
// 2. Appui long sur un cocktail (tuile, ligne, mini-tuile) : aperçu rapide (verre, ingrédients, Voir / Préparer).
// 3. « Annuler » après les retraits qui n'en avaient pas : note retirée, ingrédient du Labo, création supprimée,
//    préparation maison retirée, boisson retirée de l'alcoolémie.

// ---------- 1. Niveau au glissé ----------
let LVD=null;
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; const b=e.target.closest("#v-bar .lvl.one"); if(!b) return;
  const id=b.dataset.id; if(!id||!tracked(id)) return; e.stopPropagation(); // la ligne ne glisse pas (« Finie ») quand on part du niveau
  LVD={b,id,x:e.clientX,y:e.clientY,start:S.stock[id]||0,l:S.stock[id]||0,lock:null,pid:e.pointerId}; },{capture:true,passive:true});
document.addEventListener("pointermove",e=>{ if(!LVD||e.pointerId!==LVD.pid) return; const dx=e.clientX-LVD.x, dy=e.clientY-LVD.y;
  if(LVD.lock===null){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return; LVD.lock=Math.abs(dx)>Math.abs(dy)*1.2?"x":"y"; if(LVD.lock==="x"){ LVD.b.classList.add("lv-drag"); try{ LVD.b.setPointerCapture(e.pointerId); }catch(_){} } }
  if(LVD.lock!=="x") return;
  const l=Math.max(0,Math.min(4,LVD.start+Math.round(dx/30))); if(l===LVD.l) return; LVD.l=l;
  const t=LVD.b.querySelector(".lvl-txt"); if(t) t.textContent=LVN_SHORT(l);
  const row=LVD.b.closest(".bar-row"), th=row&&row.querySelector(".thumb"); if(th) th.innerHTML=bottleSVG(LVD.id,l);
  if(typeof SND!=="undefined"&&SND.tap) try{ SND.tap(); }catch(_){} },{capture:true,passive:true});
function LVN_SHORT(l){ return LVLN[l]; }
function lvdEnd(e){ if(!LVD||e.pointerId!==LVD.pid) return; const s=LVD; LVD=null; s.b.classList.remove("lv-drag"); if(s.lock!=="x") return;
  if(typeof SW_EAT!=="undefined") SW_EAT=Date.now(); LV_EAT=Date.now();
  if(e.type==="pointerup"&&s.l!==s.start) ACT.lvlset({id:s.id,l:s.l}); else { dirty.bar=1; renderView("bar"); } }
let LV_EAT=0;
document.addEventListener("pointerup",lvdEnd,{capture:true,passive:true});
document.addEventListener("pointercancel",lvdEnd,{capture:true,passive:true});
document.addEventListener("click",e=>{ if(Date.now()-LV_EAT<400&&e.target.closest("#v-bar .lvl.one")){ e.stopPropagation(); e.preventDefault(); } },true);

// ---------- 2. Aperçu à l'appui long ----------
let LP=null, LP_EAT=0;
const LP_SEL='.tile[data-a="rec"], .row[data-a="rec"], .mini[data-a="rec"]';
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; const t=e.target.closest(LP_SEL); if(!t||!RMAP[t.dataset.id]) return;
  if(LP) clearTimeout(LP.tm); LP={t,x:e.clientX,y:e.clientY,tm:setTimeout(()=>{ const id=t.dataset.id; LP=null; LP_EAT=Date.now(); recPeek(id); },480)}; },{passive:true});
document.addEventListener("pointermove",e=>{ if(LP&&(Math.abs(e.clientX-LP.x)>8||Math.abs(e.clientY-LP.y)>8)){ clearTimeout(LP.tm); LP=null; } },{passive:true});
["pointerup","pointercancel","scroll"].forEach(k=>document.addEventListener(k,()=>{ if(LP){ clearTimeout(LP.tm); LP=null; } },{passive:true,capture:k==="scroll"}));
document.addEventListener("click",e=>{ if(Date.now()-LP_EAT<500&&e.target.closest(LP_SEL)){ e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener("contextmenu",e=>{ if(e.target.closest(LP_SEL)) e.preventDefault(); });
function recPeek(id){ const r=RMAP[id]; if(!r) return;
  if(typeof SND!=="undefined"&&SND.pop) try{ SND.pop(1.2); }catch(_){}
  openSheet(()=>{ const st=status(r), m=metricsR(r);
    const ing=r.ing.filter(i=>i.r!=="rinse").map(it=>`<div class="pk-i ${!has(it.id)&&it.r!=="opt"?"miss":""}"><b>${termify(esc(fmtQ(it)))}</b><span>${esc(ING[it.id].n)}${it.r==="opt"?" (facultatif)":""}</span></div>`).join("");
    return {title:"",body:`<div class="peek"><div class="pk-g">${glassSVG(r)}</div><h1>${esc(r.n)}</h1><div class="pk-s">${esc([METH[r.m],GNAME[r.g],Math.round(m.abv)>0?Math.round(m.abv)+" %":"sans alcool"].filter(Boolean).join(" · "))}</div>
      <div class="status ${st.ok?"ok":"no"}">${st.ok?IC.checkc+"<span>Tu as tout ce qu’il faut.</span>":IC.warn+`<span>Il te manque ${esc(st.miss.map(x=>lc(shortN(x))).join(", "))}.</span>`}</div><div class="card pk-list">${ing}</div></div>`,
      foot:`<button class="btn sec" data-a="peekopen" data-id="${id}">Voir la recette</button><button class="btn" data-a="barmode" data-id="${id}">${IC.play}Préparer</button>`}; },{short:true}); }
Object.assign(ACT,{ peekopen:d=>{ closeAll(); setTimeout(()=>recSheet(d.id),60); } });

// ---------- 3. « Annuler » ----------
{ const W=(k,f)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const undo=f(d||{}); const r=g(d,t); try{ const u=undo&&undo(); if(u) toast(u[0],{action:{label:"Annuler",fn:u[1]}}); }catch(e){} return r; }; };
  // une note retirée en touchant la même étoile
  W("rate",d=>{ const old=S.ratings[d.id], n=+d.n; return ()=> old===n&&!S.ratings[d.id]? ["Note retirée",()=>{ S.ratings[d.id]=old; changed(); }] : null; });
  W("mixrm",d=>{ const k=+d.k, it=S.mix.items[k]&&JSON.parse(JSON.stringify(S.mix.items[k])); return ()=> it? [ING[it.id].n+" retiré du mélange",()=>{ S.mix.items.splice(Math.min(k,S.mix.items.length),0,it); changed(); }] : null; });
  W("delcustom",d=>{ const c=(S.custom||[]).find(x=>x.id===d.id), rt=S.ratings[d.id], note=(S.notes||{})[d.id]; return ()=> c? ["Création supprimée",()=>{ S.custom.push(c); if(rt) S.ratings[d.id]=rt; if(note!=null){ S.notes=S.notes||{}; S.notes[d.id]=note; } buildRecipes(S.custom); changed(); }] : null; });
  W("delprep",d=>{ const k=(S.preps||[]).findIndex(p=>p.id===d.pid), p=k>=0&&S.preps[k]; return ()=> p? ["Préparation retirée",()=>{ S.preps.splice(k,0,p); changed(); }] : null; });
  W("bacrm",d=>{ const x=(S.drinks||[]).find(y=>y.id===d.id); return ()=> x? ["Boisson retirée",()=>{ S.drinks=(S.drinks||[]).concat([x]).sort((a,b)=>a.t-b.t); changed(); refreshSheets(); }] : null; });
}
