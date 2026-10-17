// 1.65 : données 100 % locales (inspiré d'ASCEN). Rien n'est envoyé (aucune capacité « db » ni « user » demandée, même sur
// claude.ai) ; copie de secours compressée dans IndexedDB, reprise si localStorage est vidé ; données illisibles mises de côté ;
// sauvegarde en fichier datée ; écran « Espace de stockage » ; textes « Tes données » courts et vrais.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.__uses=[]; window.claude={use:async n=>{ window.__uses.push(n); if(n==="downloads") return {save:async()=>{ window.__saved=1; }}; return null; }};
    if(!localStorage.getItem("zeste.v1")&&!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:3},ratings:{negroni:5}})); } });
  await p.goto(APP); await p.waitForTimeout(2200);
  // une modification, puis passage en arrière-plan : la copie de secours est écrite
  await p.evaluate(()=>{ S.ratings.daiquiri=4; save(); document.dispatchEvent(new Event("visibilitychange")); zidbFlush(); });
  await p.waitForTimeout(800);
  const idb=await p.evaluate(()=>zidbGet().then(r=>r&&{t:r.t,bin:typeof r.data!=="string"}));
  ok(idb&&idb.t>1,"copie de secours absente : "+JSON.stringify(idb)); ok(!(await p.evaluate(()=>window.__uses)).some(u=>u==="db"||u==="user"),"une capacité de synchronisation est demandée");
  // localStorage vidé : reprise depuis la copie
  await p.evaluate(()=>localStorage.removeItem("zeste.v1")); await p.reload(); await p.waitForTimeout(2500);
  const rec=await p.evaluate(()=>({r:S.ratings.daiquiri,toast:(document.getElementById("toast")||{}).textContent||""}));
  ok(rec.r===4,"données non reprises depuis la copie de secours : "+JSON.stringify(rec));
  // données illisibles : mises de côté, jamais écrasées
  await p.evaluate(()=>localStorage.setItem("zeste.v1","{abîmé")); await p.reload(); await p.waitForTimeout(2500);
  const kept=await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith("zeste.v1.illisible.")).length);
  ok(kept>=1,"données illisibles écrasées"); ok(await p.evaluate(()=>S.ratings.daiquiri)===4,"pas de reprise après des données illisibles");
  // sauvegarde : date enregistrée, affichée ; écran de stockage
  await p.evaluate(()=>exportData()); await p.waitForTimeout(400);
  const bk=await p.evaluate(()=>({saved:window.__saved, t:S.backupT, age:zBackupAge().t}));
  ok(bk.saved===1&&bk.t>0&&bk.age==="aujourd’hui","sauvegarde : "+JSON.stringify(bk));
  await p.evaluate(()=>{ closeAll(); settingsSheet(); ACT.setgroup({g:"data"}); }); await p.waitForTimeout(500);
  const grp=await p.evaluate(()=>document.querySelector(".sheet:last-of-type, .sheet").closest("body").textContent);
  ok(/Faire une sauvegarde/.test(grp)&&/Espace de stockage/.test(grp)&&/rien n’est envoyé/.test(grp),"groupe Données incomplet");
  await p.evaluate(()=>ACT.storage()); await p.waitForTimeout(900);
  const sto=await p.evaluate(()=>({u:(document.querySelector(".sto-card b")||{}).textContent, idb:(document.getElementById("sto-idb")||{}).textContent, prot:(document.getElementById("sto-prot")||{}).textContent}));
  ok(/sur ~5 Mo/.test(sto.u||"")&&/(o|Ko|Mo)$/.test(sto.idb||"")&&sto.prot&&sto.prot!=="Vérification…","écran de stockage : "+JSON.stringify(sto));
  const ab=await p.evaluate(()=>aboutBody());
  ok(/rien n’est envoyé/.test(ab)&&!/synchronis/i.test(ab),"À propos : texte des données");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Stockage local : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Stockage local : rien n’est envoyé (ni « db » ni « user »), copie de secours compressée écrite et reprise si les données sont vidées, données illisibles mises de côté, sauvegarde datée, écran « Espace de stockage », À propos à jour.");
  await b.close(); process.exit(fail.length?1:0); })();
