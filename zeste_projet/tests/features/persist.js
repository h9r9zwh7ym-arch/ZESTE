const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",fx:{splash:false}},stock:{gin:4},hist:[]})); });
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html')); await p.waitForTimeout(8000); // après la fenêtre de rattrapage du lancement
  const out=[];
  // 1) aller-retour de sauvegarde
  const r=await p.evaluate(()=>{ S.settings.weightKg=80; S.settings.sex="f"; S.drinks=[{id:"d1",abv:5,ml:330,t:Date.now()}]; S.tierSeen={tier_verres:1}; save();
    const c=sanitizeBackup(JSON.parse(JSON.stringify(S))); return {w:c.settings.weightKg,sex:c.settings.sex,dr:(c.drinks||[]).length,ts:c.tierSeen&&c.tierSeen.tier_verres}; });
  if(r.w!==80||r.sex!=="f"||r.dr!==1||r.ts!==1) out.push("Sauvegarde : champs perdus "+JSON.stringify(r));
  // 2) rechargement : l'état persiste
  await p.waitForTimeout(400); // laisse le navigateur de test enregistrer localStorage avant de recharger (course propre à Chromium automatisé)
  await p.reload(); await p.waitForTimeout(2500);
  const r2=await p.evaluate(()=>({w:S.settings.weightKg,sex:S.settings.sex,dr:(S.drinks||[]).length}));
  if(r2.w!==80||r2.sex!=="f"||r2.dr!==1) out.push("Rechargement : état perdu "+JSON.stringify(r2));
  // 3) plusieurs trophées d'un coup (hors lancement) : au plus une annonce plein écran
  await p.waitForTimeout(7500);
  const r3=await p.evaluate(async()=>{ S.labBest=100; S.labServes=12; S.quiz={a:1}; checkTrophies(); await new Promise(r=>setTimeout(r,900)); return {pops:document.querySelectorAll('.tro-pop').length,queue:TRO_Q.length,toast:document.getElementById('toast').textContent}; });
  if(r3.pops>1||r3.queue>0) out.push("Trophées : trop d'annonces "+JSON.stringify(r3));
  console.log(out.length?out.join("\n"):"Sauvegarde, rechargement et annonces de trophées : OK "+JSON.stringify(r3));
  console.log(errs.length?errs:"Aucune erreur JavaScript."); await b.close(); })();
