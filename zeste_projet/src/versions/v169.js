// ================= ZESTE 1.65 : données 100 % locales, copie de secours, sauvegardes (inspiré d'ASCEN) =================
// Rien ne quitte l'appareil : la synchronisation avec le compte claude.ai (capacité « db ») est retirée.
// (initRemote et pushRemote sont vides depuis la 1.65, dans ui.js)

// ---------- copie de secours IndexedDB, compressée ----------
// Chaque enregistrement est aussi copié (gzip natif) dans IndexedDB, au plus toutes les 3 s et tout de suite quand l'app
// passe en arrière-plan. Si localStorage est plein, vidé ou illisible, Zeste repart de cette copie au lancement suivant.
const ZIDB_NAME="zeste", ZIDB_STORE="state";
let ZIDB_PENDING=null, ZIDB_WRITING=false, ZIDB_LAST=0, ZIDB_TIMER=null, LS_FAIL=false;
function zidbOpen(){ return new Promise((ok,ko)=>{ if(typeof indexedDB==="undefined") return ko(new Error("indisponible"));
  const r=indexedDB.open(ZIDB_NAME,1); r.onupgradeneeded=()=>r.result.createObjectStore(ZIDB_STORE); r.onsuccess=()=>ok(r.result); r.onerror=()=>ko(r.error); }); }
function zidbPut(data,t){ return zidbOpen().then(db=>new Promise((ok,ko)=>{ const tx=db.transaction(ZIDB_STORE,"readwrite"); tx.objectStore(ZIDB_STORE).put({data,t},"main");
  tx.oncomplete=()=>{ db.close(); ok(); }; tx.onerror=()=>{ db.close(); ko(tx.error); }; })); }
function zidbGet(){ return zidbOpen().then(db=>new Promise((ok,ko)=>{ const r=db.transaction(ZIDB_STORE).objectStore(ZIDB_STORE).get("main");
  r.onsuccess=()=>{ db.close(); ok(r.result||null); }; r.onerror=()=>{ db.close(); ko(r.error); }; })); }
// octets bruts (pas de Blob : WebKit les refuse en navigation privée et pendant qu'on quitte la page)
async function zgz(str){ if(typeof CompressionStream==="undefined") return str; const cs=new CompressionStream("gzip"), w=cs.writable.getWriter();
  w.write(new TextEncoder().encode(str)).catch(()=>{}); w.close().catch(()=>{}); return await new Response(cs.readable).arrayBuffer(); }
async function zgunz(d){ if(typeof d==="string") return d; return await new Response(new Response(d).body.pipeThrough(new DecompressionStream("gzip"))).text(); }
function zidbMirror(str,t,now){ ZIDB_PENDING={str,t}; const wait=ZIDB_LAST+3000-Date.now();
  if(!now&&wait>0){ if(!ZIDB_TIMER) ZIDB_TIMER=setTimeout(()=>{ ZIDB_TIMER=null; if(ZIDB_PENDING) zidbMirror(ZIDB_PENDING.str,ZIDB_PENDING.t,true); },wait); return; }
  clearTimeout(ZIDB_TIMER); ZIDB_TIMER=null; ZIDB_LAST=Date.now(); if(ZIDB_WRITING) return; ZIDB_WRITING=true;
  (async()=>{ while(ZIDB_PENDING){ const j=ZIDB_PENDING; ZIDB_PENDING=null; try{ await zidbPut(await zgz(j.str),j.t); }catch(e){ try{ await zidbPut(j.str,j.t); }catch(e2){} } } ZIDB_WRITING=false; })(); }
function zidbFlush(){ if(ZIDB_PENDING) zidbMirror(ZIDB_PENDING.str,ZIDB_PENDING.t,true); }
save=function(){ SREV++; STC={}; MEMO={}; S.t=Date.now(); const j=JSON.stringify(S);
  try{ localStorage.setItem(KEY,j); LS_FAIL=false; }
  catch(e){ if(!LS_FAIL&&typeof toast==="function") toast("Stockage principal plein : tes données sont gardées dans la copie de secours. Fais une sauvegarde."); LS_FAIL=true; }
  zidbMirror(j,S.t); };
if(typeof addEventListener==="function") addEventListener("pagehide",zidbFlush);
if(typeof document!=="undefined"&&document.addEventListener) document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") zidbFlush(); });
// au lancement : la copie de secours plus récente que localStorage (plein, vidé ou illisible) est reprise ; sinon elle est créée
function zidbRecover(){ zidbGet().then(async rec=>{
    if(!rec||!rec.data){ zidbMirror(JSON.stringify(S),S.t||Date.now(),true); return; }
    let has=false; try{ has=!!localStorage.getItem(KEY); }catch(e){}
    if(has&&!(rec.t>(S.t||0))) return;
    const str=await zgunz(rec.data); let d; try{ d=JSON.parse(str); }catch(e){ return; }
    S=Object.assign(DEF(),d); fixState(); try{ localStorage.setItem(KEY,str); }catch(e){} buildRecipes(S.custom||[]); MODEL=null;
    renderAll(); refreshSheets(); toast("Tes données ont été récupérées depuis la copie de secours"); }).catch(()=>{}); }
setTimeout(zidbRecover,0);
// stockage protégé : le système ne l'efface pas pour libérer de la place (accordé surtout à l'app installée)
try{ if(typeof navigator!=="undefined"&&navigator.storage&&navigator.storage.persisted) navigator.storage.persisted().then(p=>{ if(!p&&navigator.storage.persist) navigator.storage.persist(); }).catch(()=>{}); }catch(e){}

// ---------- sauvegarde en fichier : Fichiers / iCloud (partage), sinon téléchargement ----------
function zBackupAge(){ const b=S.backupT; if(!b) return {t:"jamais",due:(S.hist||[]).length+Object.keys(S.ratings||{}).length>=5};
  const n=Math.floor((Date.now()-b)/864e5); return {t:n===0?"aujourd’hui":n===1?"hier":`il y a ${n} j`, due:n>=21}; }
exportData=async function(){ const json=JSON.stringify(S,null,1), d=new Date(), name=`zeste-sauvegarde-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}.json`;
  let ok=false;
  try{ const dl=window.claude&&await claude.use("downloads"); if(dl){ await dl.save({filename:name,data:json}); ok=true; } }catch(e){ if(e&&e.code&&e.code!=="unavailable") return; }
  if(!ok) try{ const f=new File([json],name,{type:"application/json"}); if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:"Sauvegarde Zeste"}); ok=true; } }catch(e){ if(e&&e.name==="AbortError") return; }
  if(!ok) try{ const a=document.createElement("a"), u=URL.createObjectURL(new Blob([json],{type:"application/json"})); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); ok=true; }catch(e){}
  if(!ok){ textSheet("Sauvegarde",json); return; }
  S.backupT=Date.now(); save(); refreshSheets(); toast("Sauvegarde prête"); };

// ---------- écran « Espace de stockage » ----------
Object.assign(LU,{"hard-drive":`<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01"/><path d="M10 16h.01"/>`,
  "shield-check":`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`});
const LS_QUOTA=5*1024*1024;
function zLsBytes(){ try{ let n=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(KEY)) n+=(k.length+(localStorage.getItem(k)||"").length)*2; } return n; }catch(e){ return 0; } }
function zBytes(b){ return b<1024? b+" o" : b<1024*1024? num(Math.round(b/1024))+" Ko" : num(Math.round(b/1024/1024*10)/10)+" Mo"; }
function zStandalone(){ try{ return !!(navigator.standalone||(matchMedia&&matchMedia("(display-mode: standalone)").matches)); }catch(e){ return false; } }
function zIcon(k,n){ if(!ICS[k]) ICS[k]=[ICS.up[0],lu(n)]; return k; }
function storageBody(){ const u=zLsBytes(), pct=Math.min(100,u/LS_QUOTA*100), nb=Object.values(S.stock||{}).filter(v=>v>0).length, nr=Object.keys(S.ratings||{}).length, nh=(S.hist||[]).length;
  return `<div class="card sto-card"><b>${zBytes(u)} sur ~5 Mo</b><span>${nb} bouteille${nb>1?"s":""} · ${nr} note${nr>1?"s":""} · ${nh} verre${nh>1?"s":""}</span><div class="ls-bar sto-bar"><i style="width:${Math.max(1.5,pct).toFixed(1)}%"></i></div></div>
    <div class="sp16"></div><div class="group">
      ${srow(zIcon("disk","hard-drive"),`Copie de secours<div class="s sto-s">Une seconde copie, compressée, au cas où.</div>`,`<span class="val" id="sto-idb">–</span>`)}
      ${srow(zIcon("phone2","house"),`Total sur l’appareil<div class="s sto-s">Données et fichiers gardés pour le hors ligne.</div>`,`<span class="val" id="sto-tot">–</span>`)}
      ${srow(zIcon("shield","shield-check"),`Protection<div class="s sto-s" id="sto-prot">Vérification…</div>`,"")}</div>
    <div class="gf">Rien ne quitte ton téléphone. Pour changer d’appareil sans rien perdre, garde une sauvegarde dans Fichiers ou iCloud.</div>
    <div class="sp16"></div><div class="group">${srow("up","Faire une sauvegarde",`<span class="val">${esc(zBackupAge().t)}</span>`,"export")}</div>`; }
function storageFill(){ const set=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  zidbGet().then(r=>{ if(r&&r.data) set("sto-idb",zBytes(typeof r.data==="string"?r.data.length*2:r.data.byteLength||0)); }).catch(()=>set("sto-idb","indisponible"));
  try{ if(navigator.storage&&navigator.storage.estimate) navigator.storage.estimate().then(x=>{ if(x&&x.usage!=null) set("sto-tot",zBytes(x.usage+zLsBytes())); }).catch(()=>{}); }catch(e){}
  const prot=p=>set("sto-prot", p? "Protégé : le système ne l’effacera pas pour faire de la place." : zStandalone()? "App installée : tes données restent sur l’appareil." : "Ajoute Zeste à l’écran d’accueil : Safari efface les sites non installés après 7 jours sans visite.");
  try{ if(navigator.storage&&navigator.storage.persisted) navigator.storage.persisted().then(prot).catch(()=>prot(false)); else prot(false); }catch(e){ prot(false); } }
Object.assign(ACT,{ storage:()=>{ subSheet("Espace de stockage",storageBody); setTimeout(storageFill,60); } });
// groupe « Données » des Paramètres
SET_GROUPS.data=["Données","up",()=>{ const a=zBackupAge();
  return `<div class="group">${srow("up","Faire une sauvegarde",`<span class="val${a.due?" due":""}">${esc(a.t)}</span>`,"export")}${srow("down","Restaurer une sauvegarde","","import")}${srow(zIcon("disk","hard-drive"),"Espace de stockage",`<span class="val">${zBytes(zLsBytes())}</span>`,"storage")}</div>
    <div class="gf">Tout reste sur cet appareil : rien n’est envoyé.</div><div class="sp16"></div><div class="group">${srow("trash",`<span style="color:var(--red)">Tout réinitialiser</span>`,"","reset")}</div>`; },()=>zBackupAge().t];
