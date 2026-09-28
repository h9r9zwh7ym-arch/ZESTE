// Saisies (1.34) : un prénom, une création, une note ou une préparation contenant du HTML doivent s'afficher
// comme du texte, jamais être interprétés (pas de script exécuté, pas de mise en page cassée).
const {chromium}=require('playwright'); const path=require('path');
const BAD='<img src=x onerror="window.__pwn=1">"\'&<b>';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[], fail=[];
  p.on('pageerror',e=>errs.push(e.message));
  const st={v:1,t:1,quizSkip:1,settings:{name:BAD,weightKg:70,sex:"h",fx:{splash:false}},stock:{gin:4,campari:3,vermouth_rouge:2},
    ratings:{c_1:5,negroni:4},notes:{negroni:BAD},hist:[{id:"c_1",t:Date.now()-3600e3},{id:"negroni",t:Date.now()-7200e3}],fav:["c_1"],
    custom:[{id:"c_1",n:BAD,fam:"sour",m:"shake",g:"coupe",ice:"none",col:"#e8c",gar:BAD,ing:[{id:"gin",q:45,u:"ml",r:""},{id:"campari",q:30,u:"ml",r:""}]}],
    preps:[{id:"p1",tpl:"sirop_sucre",d:new Date().toISOString(),name:BAD}]};
  await p.addInitScript(s=>localStorage.setItem("zeste.v1",s),JSON.stringify(st));
  try{
    await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(3500);
    for(const t of ["today","cocktails","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(300); }
    await p.evaluate(()=>{ recSheet("c_1"); }); await p.waitForTimeout(400);
    await p.evaluate(()=>{ closeSheet(); recSheet("negroni"); }); await p.waitForTimeout(400);
    await p.evaluate(()=>{ closeSheet(); settingsSheet(); }); await p.waitForTimeout(400);
    await p.evaluate(()=>{ closeSheet(); if(typeof prepSheet==="function"&&PREP_TPL.some(t=>t[0]==="sirop_sucre")) prepSheet("p1"); }); await p.waitForTimeout(400);
    await p.evaluate(()=>{ closeSheet(); CF.q="<img"; switchTab("cocktails"); dirty.cocktails=1; renderView("cocktails"); }); await p.waitForTimeout(400);
    const r=await p.evaluate(()=>({pwn:!!window.__pwn, tags:document.querySelectorAll('img[src="x"]').length}));
    if(r.pwn) fail.push("du HTML saisi a été exécuté");
    if(r.tags) fail.push(r.tags+" balise(s) saisie(s) interprétée(s)");
  }catch(e){ fail.push("exception : "+e.message.slice(0,200)); }
  if(errs.length) fail.push("erreurs JS : "+errs.join(" | "));
  console.log(fail.length?"ÉCHEC saisies : "+fail.join(" ; "):"Saisies : prénom, création, note et préparation contenant du HTML s’affichent comme du texte, rien n’est exécuté.");
  await b.close(); process.exit(fail.length?1:0); })();
