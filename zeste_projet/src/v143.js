// ================= ZESTE 1.43 : « bouteille finie » d'un glissé, catégories repliables =================

// ---------- Glisser une bouteille vers la gauche : « Finie » (comme dans Mail) ----------
// Un petit glissé ouvre le bouton, un grand glissé (plus de la moitié de la ligne) termine la bouteille d'un coup.
// La bouteille passe à « Vide » et rejoint « À racheter », avec « Annuler » dans le message (ACT.lvlset, 1.37).
const SW_ACT=88;
let SW=null, SW_OPEN=null, SW_EAT=0;
{ const _sr=stockRow;
  stockRow=function(id){ const h=_sr(id); if(!(S.stock[id]>0)) return h;
    return h.replace(/<\/div>$/,`<button class="row-act" data-a="finish" data-id="${id}" tabindex="-1" aria-hidden="true"><span>${lu("check")}Finie</span></button></div>`); };
}
function swSet(row,x){ row.style.setProperty("--sx",x+"px"); row.classList.toggle("sw",x<0); }
function swClose(row){ if(!row) return; row.classList.remove("drag","full"); swSet(row,0); if(SW_OPEN===row) SW_OPEN=null; }
document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return;
  const row=e.target.closest("#v-bar .bar-row");
  if(SW_OPEN&&SW_OPEN!==row){ swClose(SW_OPEN); SW_EAT=Date.now(); }
  if(!row||!row.querySelector(".row-act")){ SW=null; return; }
  SW={row,x:e.clientX,y:e.clientY,base:row===SW_OPEN?-SW_ACT:0,dx:0,lock:null,id:e.pointerId,onAct:!!e.target.closest(".row-act")}; },{passive:true});
document.addEventListener("pointermove",e=>{ if(!SW||e.pointerId!==SW.id) return;
  const dx=e.clientX-SW.x, dy=e.clientY-SW.y;
  if(SW.lock===null){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
    SW.lock=Math.abs(dx)>Math.abs(dy)*1.2?"x":"y";
    if(SW.lock==="x"){ SW.row.classList.add("drag"); try{ SW.row.setPointerCapture(e.pointerId); }catch(_){} } }
  if(SW.lock!=="x") return;
  const W=SW.row.offsetWidth; let x=Math.min(0,SW.base+dx); if(x<-W*0.9) x=-W*0.9;
  const full=x<-W*0.55; if(full!==SW.row.classList.contains("full")&&typeof SND!=="undefined"&&SND.tap) SND.tap();
  SW.row.classList.toggle("full",full); SW.dx=x; swSet(SW.row,x); },{passive:true});
function swEnd(e){ if(!SW||e.pointerId!==SW.id) return; const s=SW; SW=null;
  if(s.lock!=="x"){ if(s.row===SW_OPEN&&e.type==="pointerup"&&!s.onAct){ swClose(s.row); SW_EAT=Date.now(); } return; }
  SW_EAT=Date.now(); s.row.classList.remove("drag");
  if(e.type==="pointerup"&&s.row.classList.contains("full")) return ACT.finish({id:s.row.id.slice(3)});
  s.row.classList.remove("full");
  if(e.type==="pointerup"&&s.dx<-SW_ACT/2){ swSet(s.row,-SW_ACT); SW_OPEN=s.row; } else swClose(s.row); }
document.addEventListener("pointerup",swEnd,{passive:true});
document.addEventListener("pointercancel",swEnd,{passive:true});
// un glissé ne doit pas ouvrir la fiche de la bouteille
document.addEventListener("click",e=>{ if(Date.now()-SW_EAT<400&&!e.target.closest(".row-act")){ e.stopPropagation(); e.preventDefault(); } },true);
Object.assign(ACT,{
  finish:(d)=>{ const row=document.getElementById("sr-"+d.id); SW_OPEN=null;
    const go=()=>ACT.lvlset({id:d.id,l:0});
    if(row&&!REDUCED.matches){ row.classList.add("sw","full","gone"); swSet(row,-row.offsetWidth); setTimeout(go,230); } else go(); }
});
// une fois, le bar montre le geste : la première bouteille glisse un peu et revient
{ const _rv=renderView;
  renderView=function(t){ const r=_rv.apply(this,arguments);
    if(t==="bar"&&!S.settings.hintSwipe&&!REDUCED.matches){ const row=document.querySelector("#v-bar .bar-row .row-act")?.parentNode;
      if(row){ S.settings.hintSwipe=1; save(); setTimeout(()=>{ if(TAB!=="bar"||!row.isConnected) return; row.classList.add("sw","peek"); setTimeout(()=>row.classList.remove("sw","peek"),1300); },900); } }
    return r; }; }

// ---------- Catégories repliables, quand le bar dépasse 15 bouteilles ----------
const FOLD_MIN=15;
function barFold(){ const f=S.settings.barFold; if(!f||typeof f!=="object"||Array.isArray(f)) S.settings.barFold={}; return S.settings.barFold; }
{ const _vb=vBar;
  vBar=function(){ let h=_vb(); if((h.match(/class="row bar-row"/g)||[]).length<=FOLD_MIN) return h; const F=barFold();
    return h.replace(/<div class="list-h cat-h"><b>((?:<i[^>]*><\/i>)?[^<]*)<\/b><span>(\d+)<\/span><\/div>(<div class="group)">/g,(m,b,n,g)=>{
      const k=b.replace(/<[^>]+>/g,"").trim(), shut=!!F[k];
      return `<button class="list-h cat-h fold${shut?" shut":""}" data-a="barfold" data-k="${esc(k)}" aria-expanded="${!shut}"><b>${b}</b><span class="fold-n">${n}${IC.chev}</span></button>${g} fold-g${shut?" folded":""}">`; }); };
}
Object.assign(ACT,{
  barfold:(d,el)=>{ const btn=el&&el.closest?el.closest(".cat-h.fold"):document.querySelector(`#v-bar .cat-h.fold[data-k="${CSS.escape(d.k)}"]`); if(!btn) return;
    const g=btn.nextElementSibling, F=barFold(), shut=!F[d.k];
    if(shut) F[d.k]=1; else delete F[d.k]; save();
    btn.classList.toggle("shut",shut); btn.setAttribute("aria-expanded",String(!shut));
    if(!g) return; const anim=!REDUCED.matches&&g.animate;
    if(shut){ if(!anim){ g.classList.add("folded"); return; } const hh=g.offsetHeight;
      g.animate([{height:hh+"px",opacity:1},{height:"0px",opacity:0}],{duration:240,easing:"cubic-bezier(.3,.7,.4,1)"}).onfinish=()=>{ if(btn.classList.contains("shut")) g.classList.add("folded"); }; }
    else { g.classList.remove("folded"); if(!anim) return; const hh=g.offsetHeight;
      g.animate([{height:"0px",opacity:0},{height:hh+"px",opacity:1}],{duration:280,easing:"cubic-bezier(.3,.7,.4,1)"}); }
    if(typeof SND!=="undefined"&&SND.tap) SND.tap(); }
});
