// ================= 1.31 : mises à jour (repris d'ASCEN) =================
// Un service worker (sw.js, à côté d'index.html) ouvre l'app depuis une copie locale, avec ou sans réseau,
// et télécharge la nouvelle version en arrière-plan. Quand elle a changé, il prévient la page : on propose
// de recharger. Hors réseau, tout échoue en silence. Pas de service worker sur claude.ai ni en fichier local
// (tests), où il n'a pas sa place.
const SW_OK="serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost") && !/claude\.ai|claudeusercontent/.test(location.hostname);
let UPD_SHOWN=false, UPD_LAST=Date.now();
function updReady(){
  if(UPD_SHOWN) return; UPD_SHOWN=true;
  // on attend que l'écran soit libre (pas de fiche, de service ni d'annonce en cours) pour ne rien couvrir
  const go=()=>{ if(covered()||document.querySelector(".tro-pop")) return setTimeout(go,1500);
    toast("Nouvelle version de Zeste prête",{icon:lu("sparkles","t-ic"),action:{label:"Recharger",fn:()=>location.reload()},ms:9000}); };
  setTimeout(go,800);
}
if(SW_OK){
  try{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
    navigator.serviceWorker.addEventListener("message",e=>{ if(e.data&&e.data.type==="zeste-updated") updReady(); });
    // l'app installée sur l'écran d'accueil reste souvent ouverte des jours : on revérifie au retour au premier plan
    // (au plus toutes les 30 minutes), sans rien faire si le réseau manque
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState!=="visible"||Date.now()-UPD_LAST<30*60e3||!navigator.onLine) return;
      UPD_LAST=Date.now();
      navigator.serviceWorker.ready.then(r=>{ if(r.active) r.active.postMessage({type:"zeste-check"}); r.update().catch(()=>{}); }).catch(()=>{});
    });
  }catch(e){}
}

// ================= 1.35 : filet de sécurité et clavier =================
// Si un écran ou une fiche ne peut pas se dessiner (donnée imprévue, cas limite), on affiche un message avec
// « Réessayer » au lieu d'un écran vide ou figé. L'erreur est relancée à part : elle reste visible dans la
// console et pour les tests, mais l'app continue de répondre.
function failBox(retry){ return `<div class="empty fail">${lu("rotate-ccw")}<b>Cet écran n’a pas pu s’afficher</b>Réessaie ; si ça recommence, redémarre l’app.<div class="sp16"></div><button class="btn small sec" ${retry}>Réessayer</button></div>`; }
function rethrow(e){ setTimeout(()=>{ throw e; }); }
const _renderViewSafe=renderView;
renderView=function(t){ try{ return _renderViewSafe(t); }catch(e){ const el=document.getElementById("v-"+t); if(el) el.innerHTML=failBox(`data-a="retryview" data-t="${t}"`); dirty[t]=1; rethrow(e); } };
const _paintSheetSafe=paintSheet;
paintSheet=function(sh){ try{ return _paintSheetSafe(sh); }catch(e){ sh.el.innerHTML=`<div class="sheet-head"><div class="sl"></div><div class="st"></div><div class="sr"><button class="close-x" data-a="closesheet" aria-label="Fermer">${IC.x}</button></div></div><div class="sheet-body">${failBox('data-a="retrysheet"')}</div>`; rethrow(e); } };
Object.assign(ACT,{ retryview:(d)=>{ dirty[d.t]=1; renderView(d.t); }, retrysheet:()=>{ const sh=SHEETS[SHEETS.length-1]; if(sh) paintSheet(sh); } });
// « Entrée » / « Rechercher » sur un champ d'une ligne : on referme le clavier (le résultat est déjà à l'écran)
document.addEventListener("keydown",e=>{ const t=e.target; if(e.key==="Enter"&&t&&t.tagName==="INPUT"&&!e.isComposing){ e.preventDefault(); t.blur(); } });

// « Réduire les animations » (réglage iOS) : la mise en scène du service du labo saute directement au résultat,
// au lieu de laisser ~5 s d'écran vide (ses animations étant coupées, seule l'attente restait).
const _openServeRM=openServe;
openServe=function(){ _openServeRM.apply(this,arguments); if(REDUCED.matches&&SV) requestAnimationFrame(()=>{ if(SV) svSkip(); }); };

// ================= 1.36 : typographie française =================
// Espaces insécables là où le français les demande, pour qu'un « ? », un « : » ou une unité ne se retrouve jamais seul
// en début de ligne : fine insécable avant ? ! ; et après « / avant », insécable avant : et %, et entre un nombre et son
// unité (6 cl, 23 %, 2 h). Appliqué au texte affiché (les données et le code restent écrits normalement), dès qu'il
// apparaît à l'écran, jamais dans les champs de saisie.
const FRTYPO=[[/(\S) ([?!;])/g,"$1 $2"],[/(\S) :(?=\s|$)/g,"$1 :"],[/« /g,"« "],[/ »/g," »"],[/(\d) %/g,"$1 %"],[/(\d) (cl|ml|l|h|min|s|g|kg|cm|°|‰|CHF|€|jours?|ans|fois|verres?|recettes?|cocktails?|bouteilles?)\b/g,"$1 $2"]];
const FRTEST=/ [?!;:»%]|« |\d (cl|ml|l|h|min|s|g|kg|cm|°|‰|CHF|€|jours?|ans|fois|verres?|recettes?|cocktails?|bouteilles?)\b/;
function frTypo(root){
  if(!root) return; if(root.nodeType===3){ fixNode(root); return; } if(root.nodeType!==1||root.closest&&root.closest("textarea,input,[contenteditable],script,style")) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) fixNode(n);
}
function fixNode(n){ const t=n.data; if(t.length<3||!FRTEST.test(t)) return; const p=n.parentNode; if(!p||/^(TEXTAREA|SCRIPT|STYLE)$/.test(p.nodeName)) return;
  let u=t; for(const [re,to] of FRTYPO) u=u.replace(re,to); if(u!==t) n.data=u; }
try{ frTypo(document.body); new MutationObserver(ms=>{ for(const m of ms) m.addedNodes.forEach(frTypo); }).observe(document.body,{childList:true,subtree:true}); }catch(e){}

// Pastille des onglets : position mesurée par rapport à la barre (et non à la page), puis vérifiée à la fin de
// l'animation et à chaque changement de taille (rotation, clavier), pour qu'elle reste centrée sous l'onglet.
moveTabInd=function(){ const tb=document.querySelector(".tabbar"), on=tb&&tb.querySelector("button.on"), ind=tb&&tb.querySelector(".tab-ind"); if(!on||!ind) return;
  const a=tb.getBoundingClientRect(), r=on.getBoundingClientRect(); ind.style.transform=`translateX(${Math.round(r.left-a.left+r.width/2-ind.offsetWidth/2)}px)`; };
{ const _sw=switchTab; switchTab=function(){ const r=_sw.apply(this,arguments); setTimeout(moveTabInd,480); return r; };
  let rz=0; const onRz=()=>{ clearTimeout(rz); rz=setTimeout(moveTabInd,120); }; addEventListener("resize",onRz); window.visualViewport&&visualViewport.addEventListener("resize",onRz); }
