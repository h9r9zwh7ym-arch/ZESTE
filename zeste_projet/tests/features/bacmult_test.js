// 1.76 : l'alcoolémie tient compte du nombre de verres (fiche et mode barman) et de « Ta version ».
// Deux verres = deux fois l'alcool ; « Ta version » plus forte compte plus que l'originale ; le détail l'affiche
// (« Negroni × 2 », « (ta version) ») ; les compteurs (une entrée d'historique par préparation) ne changent pas.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false,clink:false},hintSwipe:1,weightKg:75,sex:"h"},stock:{gin:1,campari:1,vermouth_rouge:1}})); });
  await p.goto(APP); await p.waitForTimeout(2000);
  const one=await p.evaluate(()=>gramsOf(metricsR(RMAP.negroni).vol,metricsR(RMAP.negroni).abv));
  // 1) fiche : 2 verres puis « Je l'ai fait »
  await p.evaluate(()=>recSheet("negroni")); await p.waitForTimeout(700);
  await p.click('.sheet [data-a="mult"][data-d="1"]'); await p.waitForTimeout(300);
  await p.click('.sheet [data-a="made"]'); await p.waitForTimeout(500);
  let R=await p.evaluate(()=>{ const h=S.hist[S.hist.length-1], e=bacEventsRaw().filter(x=>x.kind==="c"); return {h, n:S.hist.length, g:e.reduce((a,x)=>a+x.g,0), lab:e.map(x=>x.n)}; });
  if(R.n!==1||R.h.m!==2) fail.push("fiche : entrée "+JSON.stringify(R.h));
  if(Math.abs(R.g-2*one)>0.01) fail.push(`fiche : ${R.g.toFixed(2)} g au lieu de ${(2*one).toFixed(2)} g`);
  if(!R.lab.includes("Negroni × 2")) fail.push("détail : "+R.lab.join());
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // 2) « Ta version » plus forte, un verre
  await p.evaluate(()=>{ S.hist=[]; S.adj={negroni:{f:1}}; S.settings.glasses=1; changed(); }); await p.waitForTimeout(300);
  const strong=await p.evaluate(()=>{ const m=calc(adjItems(RMAP.negroni),RMAP.negroni.m,RMAP.negroni.ice); return gramsOf(m.vol,m.abv); });
  await p.evaluate(()=>recSheet("negroni")); await p.waitForTimeout(700);
  await p.click('.sheet [data-a="made"]'); await p.waitForTimeout(500);
  R=await p.evaluate(()=>{ const e=bacEventsRaw().filter(x=>x.kind==="c"); return {h:S.hist[S.hist.length-1], g:e.reduce((a,x)=>a+x.g,0), lab:e.map(x=>x.n)}; });
  if(strong<=one+0.1) fail.push("test : ta version n’est pas plus forte ("+strong+" / "+one+")");
  if(R.h.v!=="mine"||Math.abs(R.g-strong)>0.01) fail.push(`ta version : ${JSON.stringify(R.h)} ${R.g.toFixed(2)} g au lieu de ${strong.toFixed(2)}`);
  if(!R.lab.includes("Negroni (ta version)")) fail.push("détail ta version : "+R.lab.join());
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // 3) mode barman, 3 verres
  await p.evaluate(()=>{ S.hist=[]; S.adj={}; changed(); barMode("negroni"); BM.mult=3; ACT.bmfinish(); }); await p.waitForTimeout(600);
  R=await p.evaluate(()=>({h:S.hist[S.hist.length-1], g:bacEventsRaw().filter(x=>x.kind==="c").reduce((a,x)=>a+x.g,0)}));
  if(R.h.m!==3||Math.abs(R.g-3*one)>0.01) fail.push("barman : "+JSON.stringify(R));
  // 4) un verre simple ne garde aucun champ en plus, et l'estimation est inchangée
  await p.evaluate(()=>{ S.hist=[]; changed(); recSheet("negroni"); }); await p.waitForTimeout(600); await p.click('.sheet [data-a="made"]'); await p.waitForTimeout(400);
  R=await p.evaluate(()=>({h:S.hist[S.hist.length-1], g:bacEventsRaw().filter(x=>x.kind==="c").reduce((a,x)=>a+x.g,0)}));
  if(R.h.m||R.h.v||Math.abs(R.g-one)>0.01) fail.push("un verre : "+JSON.stringify(R));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Alcoolémie (verres et version) : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : `Alcoolémie (verres et version) : 2 verres = ${(2*one).toFixed(1)} g, ta version plus forte comptée (${strong.toFixed(1)} g au lieu de ${one.toFixed(1)}), 3 verres en mode barman, détail « × 2 » et « (ta version) », un verre inchangé.`);
  await b.close(); process.exit(fail.length?1:0); })();
