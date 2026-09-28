// Robustesse (1.34) : l’app doit démarrer et rester utilisable quelles que soient les données enregistrées
// (illisibles, de mauvais type, identifiants inconnus, état ancien), avec un stockage qui refuse d’écrire,
// et sans accumuler de minuteurs au fil d’une longue session.
const {chromium}=require('playwright');
const path=require('path'); const URL='file://'+path.join(__dirname,'../../dist/zeste.html');
const CASES={
 "JSON illisible":'{"v":1,"stock":{',
 "tableau à la place de l'état":'[1,2,3]',
 "null":'null',
 "types faux":JSON.stringify({v:1,t:1,quizSkip:1,stock:[1,2],ratings:"x",hist:{a:1},settings:null,tro:"abc",custom:{},price:[],fav:"negroni",preps:null,mix:"x",drinks:5,tierSeen:[],dishes:"pizza"}),
 "identifiants inconnus":JSON.stringify({v:1,t:1,quizSkip:1,stock:{inconnu:3,gin:"beaucoup",vodka:-4,rhum_blanc:99},ratings:{fantome:5,negroni:12,daiquiri:-3},hist:[{id:"fantome",t:Date.now()},{id:"negroni",t:"hier"},{t:5},null,{id:"negroni",t:Date.now()+9e9}],fav:["fantome","negroni"],tro:["n_existe_pas"],troT:{x:"y"},settings:{txt:"9",unit:"xx",weightKg:"abc",sex:"z",vol:7,home:[["inconnu",1],["suggest"]]},mix:{m:"zz",items:[{id:"fantome",q:"a",u:"cl"}],gar:["nope"]},drinks:[{t:"x",ml:"a",abv:900},null],custom:[{id:"c1",n:null,ing:[{id:"fantome",q:2,u:"cl"}]}],preps:[{id:"p",tpl:"inconnu"}],opened:{gin:"x"},dishes:["fondue","raclette"]}),
 "état vieux (v0, champs manquants)":JSON.stringify({stock:{gin:4}}),
};
(async()=>{ const b=await chromium.launch(); const out=[];
 for(const [name,raw] of Object.entries(CASES)){
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==="error") errs.push("console: "+m.text().slice(0,120)); });
  await p.addInitScript(r=>{ if(!sessionStorage.getItem("done")){ localStorage.setItem("zeste.v1",r); sessionStorage.setItem("done",1);} },raw);
  await p.goto(URL); await p.waitForTimeout(3500);
  let ok=true; try{
    await p.evaluate(()=>{ if(document.getElementById('overlay').classList.contains('open')) ACT.qzskip&&ACT.qzskip(); });
    for(const t of ["today","cocktails","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(250); }
    await p.evaluate(()=>{ recSheet("negroni"); }); await p.waitForTimeout(300); await p.evaluate(()=>{ closeSheet(); settingsSheet(); }); await p.waitForTimeout(300); await p.evaluate(()=>closeSheet());
    await p.evaluate(()=>{ ACT.made&&ACT.made({id:"negroni"}); }); await p.waitForTimeout(400);
    await p.reload(); await p.waitForTimeout(3000);
    const st=await p.evaluate(()=>({tab:!!document.querySelector('.tabbar button'),stock:typeof S.stock,hist:Array.isArray(S.hist),ratings:typeof S.ratings}));
    if(!st.tab||st.stock!=="object"||!st.hist||st.ratings!=="object") { ok=false; errs.push("état après rechargement : "+JSON.stringify(st)); }
  }catch(e){ ok=false; errs.push("exception : "+e.message.slice(0,200)); }
  out.push([name,errs.length?"ÉCHEC":"ok",errs.slice(0,4)]); await p.close(); }
 // stockage qui refuse d'écrire (plein ou navigation privée)
 { const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
   await p.addInitScript(()=>{ Storage.prototype.setItem=function(){ throw new DOMException("QuotaExceededError","QuotaExceededError"); }; });
   await p.goto(URL); await p.waitForTimeout(3500);
   try{ await p.evaluate(()=>{ ACT.qzskip&&ACT.qzskip(); }); for(const t of ["bar","labo","profil","today"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(200);} await p.evaluate(()=>{ recSheet("negroni"); ACT.made&&ACT.made({id:"negroni"}); }); await p.waitForTimeout(500);}catch(e){errs.push(e.message)}
   out.push(["stockage plein",errs.length?"ÉCHEC":"ok",errs.slice(0,4)]); await p.close(); }
 // fuites : minuteurs actifs après une longue session
 { const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
   await p.addInitScript(()=>{ window.__iv=new Set(); const si=setInterval, ci=clearInterval; window.setInterval=(f,t,...a)=>{ const id=si(f,t,...a); __iv.add(id); return id; }; window.clearInterval=id=>{ __iv.delete(id); ci(id); };
     localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},weightKg:70,sex:"h"},stock:{gin:3,campari:2,vermouth_rouge:2},hist:[{id:"negroni",t:Date.now()-3600e3}]})); });
   await p.goto(URL); await p.waitForTimeout(3500);
   const n0=await p.evaluate(()=>__iv.size);
   for(let i=0;i<40;i++){ await p.evaluate(i=>{ switchTab(["today","cocktails","bar","labo","profil"][i%5]); if(i%3===0){ recSheet(RECS[i*7].id); } if(i%3===1) closeSheet(); if(i%7===0){ settingsSheet(); closeSheet(); } },i); await p.waitForTimeout(80); }
   await p.evaluate(()=>{ while(SHEETS.length) closeSheet(); switchTab("today"); }); await p.waitForTimeout(1500);
   const n1=await p.evaluate(()=>__iv.size); const nodes=await p.evaluate(()=>document.getElementsByTagName('*').length);
   out.push(["longue session",n1>n0+1?"FUITE":"ok",["minuteurs actifs "+n0+" → "+n1,"éléments DOM "+nodes,...errs.slice(0,3)]]); await p.close(); }
  const bad=out.filter(o=>o[1]!=="ok"); console.log(bad.length?"ÉCHEC robustesse : "+bad.map(o=>o[0]+" "+JSON.stringify(o[2])).join(" ; "):"Robustesse : données illisibles, de mauvais type ou inconnues, stockage plein et longue session ("+out[out.length-1][2][0]+") : l’app démarre et reste utilisable."); process.exitCode=bad.length?1:0;
 await b.close(); })();
