// ================= 1.22 =================
// Économie d’énergie : les animations décoratives s’arrêtent après quelques cycles (voir style.css)
// et repartent au premier toucher, au plus toutes les 4 secondes.
let REANIM_T=0;
function reanimate(root){ const now=Date.now(); if(now-REANIM_T<4000) return; REANIM_T=now;
  // une animation CSS terminée ne se relance qu'en changeant de nom : on alterne entre deux copies (style.css)
  (root||document).querySelectorAll("svg.live").forEach(el=>{ const a=el.classList.contains("again1"); el.classList.toggle("again1",!a); el.classList.toggle("again2",a); }); }
document.addEventListener("pointerdown",()=>reanimate(document),{passive:true});

// Accessibilité (VoiceOver) : une passe légère après chaque rendu
function a11yPass(root){
  root.querySelectorAll('[data-a="jiggle"]:not([aria-hidden])').forEach(el=>el.setAttribute("aria-hidden","true")); // verre décoratif
  root.querySelectorAll('.backdrop:not([aria-hidden])').forEach(el=>el.setAttribute("aria-hidden","true"));
  root.querySelectorAll('button.thumb[data-a="ing"]:not([aria-label])').forEach(el=>{ const i=ING[el.dataset.id]; if(!i) return; const v=S.stock[el.dataset.id];
    el.setAttribute("aria-label",i.n+(tracked(el.dataset.id)&&v!=null?", niveau "+(["vide","un quart","la moitié","trois quarts","pleine"][v]||v):"")); });
}
let A11Y_Q=false;
if(typeof MutationObserver!=="undefined") new MutationObserver(()=>{ if(A11Y_Q) return; A11Y_Q=true; requestAnimationFrame(()=>{ A11Y_Q=false; try{ a11yPass(document.body); }catch(e){} }); }).observe(document.body,{childList:true,subtree:true});

// Taille du texte : suit le réglage d’iOS (Dynamic Type, via -apple-system-body) ou le choix fait dans Réglages.
// Toutes les tailles de police sont en rem : 1 rem = 17 px à la taille standard.
function textScale(){ const v=S&&S.settings&&S.settings.txt; if(v&&v!=="auto") return +v||1;
  try{ if(window.CSS&&CSS.supports&&CSS.supports("font","-apple-system-body")){ const d=document.createElement("span"); d.style.cssText="font:-apple-system-body;position:absolute;visibility:hidden"; document.body.appendChild(d);
    const k=parseFloat(getComputedStyle(d).fontSize)/17; d.remove(); if(k>0) return Math.max(0.88,Math.min(1.45,k)); } }catch(e){}
  return 1; }
function applyTextScale(){ const de=document.documentElement; if(!de||!de.style||!de.classList) return; const k=textScale(); de.style.fontSize=(17*k).toFixed(2)+"px"; de.classList.toggle("txt-big",k>1.12); }
const _applyTheme122=applyTheme; applyTheme=function(){ _applyTheme122(); applyTextScale(); };
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") applyTextScale(); });
Object.assign(ACT,{ settxt:(d)=>{ S.settings.txt=d.v==="auto"?"auto":d.v; applyTextScale(); changed(); requestAnimationFrame(()=>{ try{ moveTabInd(); animateSegs(document); }catch(e){} }); } });
