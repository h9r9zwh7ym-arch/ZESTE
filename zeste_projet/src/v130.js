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
