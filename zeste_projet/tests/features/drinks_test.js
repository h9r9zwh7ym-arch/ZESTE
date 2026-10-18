// 1.68 : nouvelles boissons (tonics aromatisés, softs, sans alcool, alcools) et leurs recettes.
// Elles se trouvent et s'ajoutent au bar ; un gin tonic devient « avec substitut » avec un seul tonic méditerranéen ;
// chaque nouvelle recette s'ouvre sans erreur ; la recherche « tonic » les trouve ; les recettes sans alcool le sont vraiment.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const NEW_ING=["tonic_med","tonic_sureau","tonic_aromatique","tonic_concombre","tonic_leger","limonade_sicilienne","kombucha","gin_0","prosecco_0","biere_0","vin_rose","sake","biere_blanche","ipa","poire","tequila_repo","gin_rose"];
const NEW_REC=["gt_med","gt_sureau","gt_concombre","gt_aromatique","pink_gt","gt_0","sake_tonic","saketini","rose_spritz","snakebite","kombucha_mule","hugo_0","panache_0"];
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1,tonic_med:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  // données
  const D=await p.evaluate(({I,R})=>({missI:I.filter(id=>!ING[id]), missR:R.filter(id=>!RMAP[id]), naBad:R.filter(id=>RMAP[id]&&RMAP[id].na&&RMAP[id].ing.some(i=>(ING[i.id].abv||0)>=0.5)),
    gt:{ok:status(RMAP.gin_tonic).ok, sub:status(RMAP.gin_tonic).subOk}, gtm:status(RMAP.gt_med).ok, kin:typeof ING_KIN!=="undefined"&&ING_KIN.tonic_med==="tonic", grp:SPIRIT_GROUP.gin_rose==="gin"&&SPIRIT_GROUP.tequila_repo==="agave"}),{I:NEW_ING,R:NEW_REC});
  if(D.missI.length) fail.push("ingrédients absents : "+D.missI.join(", ")); if(D.missR.length) fail.push("recettes absentes : "+D.missR.join(", "));
  if(D.naBad.length) fail.push("sans alcool avec alcool : "+D.naBad.join(", "));
  if(D.gt.ok||!D.gt.sub) fail.push("gin tonic avec un tonic méditerranéen : attendu « avec substitut », obtenu "+JSON.stringify(D.gt));
  if(!D.gtm) fail.push("gin tonic méditerranéen non faisable avec gin + tonic méditerranéen");
  if(!D.kin||!D.grp) fail.push("liens du modèle (ING_KIN / SPIRIT_GROUP) absents");
  // bar : la feuille d'ajout trouve « tonic » et ajoute le tonic au sureau
  await p.evaluate(()=>{ switchTab("bar"); addSheet(); }); await p.waitForTimeout(700);
  await p.locator('#aq').pressSequentially('tonic',{delay:15}); await p.waitForTimeout(500);
  const found=await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-a="addtoggle"]')].map(e=>e.dataset.id));
  const wantT=["tonic","tonic_med","tonic_sureau","tonic_aromatique","tonic_concombre","tonic_leger"].filter(id=>!found.includes(id));
  if(wantT.length) fail.push("recherche « tonic » au bar : manque "+wantT.join(", "));
  await p.click('.sheet [data-a="addtoggle"][data-id="tonic_sureau"]'); await p.waitForTimeout(400);
  if(!await p.evaluate(()=>inBar("tonic_sureau"))) fail.push("le tonic au sureau ne s’ajoute pas au bar");
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // recherche cocktails « tonic »
  await p.evaluate(()=>switchTab("cocktails")); await p.waitForTimeout(600);
  await p.locator('#cq').pressSequentially('tonic',{delay:15}); await p.waitForTimeout(700);
  const cq=await p.evaluate(()=>[...document.querySelectorAll('#v-cocktails [data-a="rec"]')].map(e=>e.dataset.id));
  const wantR=["gt_med","gt_sureau","gt_0","sake_tonic"].filter(id=>!cq.includes(id)); if(wantR.length) fail.push("recherche « tonic » : manque "+wantR.join(", "));
  // chaque fiche s'ouvre
  for(const id of NEW_REC){ const ok=await p.evaluate(id=>{ try{ recSheet(id); const L=document.querySelectorAll('.sheet'), s=L[L.length-1]; const t=s&&s.textContent||""; closeAll(); return t.includes(RMAP[id].n)||"titre absent"; }catch(e){ return "erreur "+e.message; } },id); if(ok!==true) fail.push("fiche "+id+" : "+ok); await p.waitForTimeout(450); }
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Nouvelles boissons : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : `Nouvelles boissons : ${NEW_ING.length} ingrédients et ${NEW_REC.length} recettes ; recherche « tonic » au bar et dans Cocktails ; gin tonic « avec substitut » avec un tonic aromatisé ; fiches ouvertes sans erreur.`);
  await b.close(); process.exit(fail.length?1:0); })();
