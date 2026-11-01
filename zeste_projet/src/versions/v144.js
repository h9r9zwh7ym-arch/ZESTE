// ================= ZESTE 1.44 : retour haptique sur iPhone =================
// Safari iOS ignore navigator.vibrate, mais un toucher du doigt sur un <label> contenant un <input type="checkbox" switch>
// fait vibrer (même invisible). Les boutons d'action ci-dessous deviennent donc des labels avec un switch caché :
// l'action part sur « change » du switch (jamais via un .click() programmatique, que iOS bloque pour l'haptique).
// Le distributeur de ui.js ignore les clics dans label.hap : pas de double déclenchement.
const HAPTIC=new Set(["lvlset","toggle","addtoggle","refill","rmstock","finish","rate","made","mixserve"]);
function hapt(root){
  if(!root||!root.querySelectorAll) return;
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
