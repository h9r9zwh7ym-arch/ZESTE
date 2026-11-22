// ================= ZESTE 1.44 : retour haptique sur iPhone =================
// Safari iOS ignore navigator.vibrate, mais un toucher du doigt sur un <label> contenant un <input type="checkbox" switch>
// fait vibrer (même invisible). Les boutons d'action ci-dessous deviennent donc des labels avec un switch caché :
// l'action part sur « change » du switch (jamais via un .click() programmatique, que iOS bloque pour l'haptique).
// Le distributeur de ui.js ignore les clics dans label.hap : pas de double déclenchement.
// (1.87) + startprep (préparation lancée), remind (note depuis l'accueil), bmfinish (« Terminer » du mode préparation), savemix (création)
const HAPTIC=new Set(["lvlset","toggle","addtoggle","refill","rmstock","finish","rate","made","mixserve","startprep","remind","bmfinish","savemix"]);
// (1.87) réglage « Retour haptique » (Paramètres › Sons et animations) : coupé, les boutons restent de simples boutons, sans switch caché
const HAPT_ON=()=>!(typeof S!=="undefined"&&S&&S.settings&&S.settings.haptic===false);
function hapt(root){
  if(!root||!root.querySelectorAll||!HAPT_ON()) return;
  const list=root.matches&&root.matches("button[data-a]")?[root]:[];
  root.querySelectorAll("button[data-a]").forEach(b=>list.push(b));
  list.forEach(b=>{ if(!HAPTIC.has(b.dataset.a)||b.disabled||!b.parentNode) return;
    const l=document.createElement("label");
    for(const a of b.attributes) if(a.name!=="type") l.setAttribute(a.name,a.value);
    l.classList.add("hap"); if(!l.hasAttribute("role")) l.setAttribute("role","button"); l.tabIndex=0;
    while(b.firstChild) l.appendChild(b.firstChild);
    const i=document.createElement("input"); i.type="checkbox"; i.setAttribute("switch",""); i.className="hap-sw"; i.tabIndex=-1; i.setAttribute("aria-hidden","true");
    l.appendChild(i); b.replaceWith(l); });
}
if(typeof MutationObserver!=="undefined") new MutationObserver(ms=>{ for(const m of ms) m.addedNodes.forEach(n=>{ if(n.nodeType===1) hapt(n); }); }).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("change",e=>{ const i=e.target; if(!i.classList||!i.classList.contains("hap-sw")) return;
  const l=i.closest("label.hap"), a=l&&ACT[l.dataset.a]; if(a) a(l.dataset,l,e); });
document.addEventListener("keydown",e=>{ if(e.key!=="Enter"&&e.key!==" ") return; const l=e.target.closest&&e.target.closest("label.hap"); if(!l||e.target!==l) return;
  e.preventDefault(); const i=l.querySelector(".hap-sw"); if(i) i.click(); });
// (1.87) le réglage, dans le groupe « Sons et animations », avant les animations
Object.assign(LU,{vibrate:`<path d="m2 8 2 2-2 2 2 2-2 2"/><path d="m22 8-2 2 2 2-2 2 2 2"/><rect width="8" height="14" x="8" y="5" rx="1"/>`});
{ const g=SET_GROUPS.snd, r0=g[2]; g[2]=()=>{ const h=r0(), row=`<div class="gh">Toucher</div><div class="group">${srow("hapt","Retour haptique",sw(HAPT_ON(),"sethaptic","Retour haptique"))}</div>`, i=h.indexOf('<div class="gh">Animations</div>'); return i>=0? h.slice(0,i)+row+h.slice(i) : h+row; }; }
Object.assign(ACT,{ sethaptic:()=>{ S.settings.haptic=!HAPT_ON(); if(S.settings.haptic) delete S.settings.haptic; changed(); renderAll(); } });
