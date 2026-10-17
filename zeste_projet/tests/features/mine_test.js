// 1.66 : Profil > « Mes créations » liste tous les cocktails créés (du plus récent au plus ancien),
// se replie au-delà de 3, ouvre la fiche, suit les suppressions, et propose le Labo quand la liste est vide.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const sec=()=>p.evaluate(()=>{ const h=[...document.querySelectorAll('#v-profil h2.sh')].find(x=>/^Mes créations/.test(x.textContent)); if(!h) return null;
    const g=h.nextElementSibling, carnet=[...document.querySelectorAll('#v-profil h2.sh')].findIndex(x=>/Ton carnet/.test(x.textContent)), me=[...document.querySelectorAll('#v-profil h2.sh')].indexOf(h);
    return {n:(h.querySelector('.more')||{}).textContent||"", names:[...g.querySelectorAll('[data-a="rec"] .t')].map(x=>x.textContent), more:!!g.querySelector('[data-a="more"]'), create:!!g.querySelector('[data-a="gocreate"]'), before:me>=0&&me<carnet}; });
  // 1) vide
  await p.evaluate(()=>switchTab('profil')); await p.waitForTimeout(700);
  let s=await sec(); if(!s) fail.push("section absente"); else { if(!s.create||s.names.length) fail.push("vide : pas de ligne « Crée ton premier cocktail »"); if(!s.before) fail.push("section pas avant « Ton carnet »"); }
  await p.click('#v-profil [data-a="gocreate"]'); await p.waitForTimeout(700);
  const lab=await p.evaluate(()=>({tab:document.querySelector('#v-labo')&&!document.querySelector('#v-labo').hidden&&getComputedStyle(document.querySelector('#v-labo')).display!=="none", lt:LT}));
  if(!lab.tab||lab.lt!=="compose") fail.push("« Crée ton premier cocktail » n’ouvre pas le Labo en Composer ("+JSON.stringify(lab)+")");
  // 2) 1 création
  await p.evaluate(()=>{ S.custom=[{id:"c_1000",n:"Alpha",fam:"sour",m:"shake",g:"coupe",ing:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]}]; buildRecipes(S.custom); changed(); switchTab('profil'); }); await p.waitForTimeout(700);
  s=await sec(); if(!s||s.n!=="1"||s.names.join()!=="Alpha") fail.push("1 création : "+JSON.stringify(s));
  await p.click('#v-profil [data-a="rec"][data-id="c_1000"]'); await p.waitForTimeout(700);
  const sh=await p.evaluate(()=>{ const e=document.querySelector('.sheet'); return e?e.textContent:""; }); if(!/Alpha/.test(sh)||!/Supprimer cette création/.test(sh)) fail.push("la ligne n’ouvre pas la fiche de la création");
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // 3) 5 créations, ordre et repli
  await p.evaluate(()=>{ const mk=(id,n)=>({id,n,fam:"sour",m:"shake",g:"coupe",ing:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]});
    S.custom=[mk("c_1000","Alpha"),mk("c_5000","Echo"),mk("c_2000","Bravo"),mk("c_4000","Delta"),mk("c_3000","Charlie")]; buildRecipes(S.custom); changed(); switchTab('profil'); }); await p.waitForTimeout(700);
  s=await sec(); if(!s||s.n!=="5"||s.names.join()!=="Echo,Delta,Charlie"||!s.more) fail.push("5 créations repliées : "+JSON.stringify(s));
  await p.click('#v-profil [data-a="more"][data-k="mine"]'); await p.waitForTimeout(600);
  s=await sec(); if(!s||s.names.join()!=="Echo,Delta,Charlie,Bravo,Alpha"||s.more) fail.push("5 créations dépliées : "+JSON.stringify(s));
  // 4) suppression
  await p.evaluate(()=>{ recSheet("c_4000"); }); await p.waitForTimeout(600);
  await p.click('.sheet [data-a="delcustom"]'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ closeAll(); switchTab('profil'); }); await p.waitForTimeout(600);
  s=await sec(); if(!s||s.n!=="4"||s.names.includes("Delta")) fail.push("après suppression : "+JSON.stringify(s));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Mes créations : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Mes créations : section du Profil avant « Ton carnet », plus récentes d’abord, repli à 3, fiche, suppression, Labo si vide.");
  await b.close(); process.exit(fail.length?1:0); })();
