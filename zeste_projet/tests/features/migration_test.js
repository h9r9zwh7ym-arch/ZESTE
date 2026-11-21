// 1.87 (review) : format des données versionné et migrations testées sur des données d'exemple des anciens formats ;
// rien de bien formé n'est perdu (mis de côté puis repris), sauvegarde restaurée à l'identique, palier de trophée acquis,
// « Annuler » qui reprend le trophée, changement d'heure, onglets multiples, noms de création uniques.
const {chromium}=require('playwright'); const path=require('path'), http=require('http'), fs=require('fs');
const SRV=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}); r.end(fs.readFileSync(path.join(__dirname,'../../dist/zeste.html'))); });
const now=Date.now(), D=864e5;
// --- données d'exemple des anciens formats ---
const OLD={
  // 1.2x : identifiants fusionnés depuis (airmail, harvey_wallbanger), réglage « wow » d'avant les animations détaillées,
  // un soft enregistré avec un niveau (4), une recette et un ingrédient qui n'existent pas dans cette version
  "1.2x":{v:1,t:now-5*D,quizSkip:1,stock:{gin:4,rivella:4,ingredient_disparu:3},ratings:{airmail:5,negroni:4},
    hist:[{id:"airmail",t:now-3*D},{id:"negroni",t:now-2*D},{id:"recette_disparue",t:now-1*D}],fav:["harvey_wallbanger","recette_disparue"],
    settings:{unit:"cl",nobasic:[],wow:false,splash:false},dishes:{pizza:1}},
  // 1.65 : copie de secours, préparations, boissons, trophées, une création dont un ingrédient n'existe pas ici
  "1.65":{v:1,t:now-4*D,quizSkip:1,stock:{gin:3,campari:2,vermouth_rouge:4},ratings:{c_1:4},hist:[{id:"c_1",t:now-3*D},{id:"negroni",t:now-2*D}],
    preps:[{id:"p1",tpl:"simple",d:new Date(now-2*D).toISOString(),name:"Sirop simple"}],drinks:[{id:"x1",t:now-3600e3,ml:330,abv:5,n:"Bière"}],
    tro:["alch"],troT:{alch:now-3*D},tierSeen:{tier_verres:0},mix:{m:"stir",items:[{id:"gin",q:60}]},settings:{unit:"ml",nobasic:[],fx:{splash:false}},
    custom:[{id:"c_1",n:"Ma création",fam:"sour",m:"shake",g:"coupe",ice:"none",col:"#e8c050",ing:[{id:"gin",q:45,u:"ml",r:""},{id:"liqueur_future",q:15,u:"ml",r:""}]}]},
  // 1.86 : tous les champs récents (historique avec nombre de verres et « ta version », signaux, duels, contenance, sauvegarde)
  "1.86":{v:1,t:now-1*D,quizSkip:1,quizIntro:1,stock:{gin:4,campari:3,vermouth_rouge:2,tonic:1},ratings:{negroni:5},rt:{negroni:now-2*D},
    hist:[{id:"negroni",t:now-2*D,m:2,v:"mine"},{id:"gin_tonic",t:now-1*D}],adj:{negroni:{s:1}},labSaved:2,dishes:["pizza","sushi"],backupT:now-3*D,
    snooze:{mojito:now-D},chalOn:null,secondChance:1,settings:{unit:"cl",nobasic:[],fx:{splash:false},glassCap:{coupe:20}}},
  // une version plus récente (retour à une ancienne app) : jamais rétrogradée, champs inconnus gardés
  "future":{v:7,app:"zeste",t:now-D,quizSkip:1,stock:{gin:4},champFutur:{x:1},settings:{fx:{splash:false}}}
};
(async()=>{ await new Promise(z=>SRV.listen(0,'127.0.0.1',z)); const APP='http://127.0.0.1:'+SRV.address().port+'/zeste.html';
  const b=await chromium.launch(); const fail=[], errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const open=async(state,opt={})=>{ const ctx=await b.newContext(Object.assign({viewport:{width:390,height:844}},opt)); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
    if(state) await p.addInitScript(s=>{ if(!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("zeste.v1",s); } },JSON.stringify(state));
    await p.goto(APP); await p.waitForTimeout(1800); return {ctx,p}; };

  // 1. format 1.2x
  { const {ctx,p}=await open(OLD["1.2x"]);
    const r=await p.evaluate(()=>({v:S.v,app:S.app,air:S.ratings.air_mail,hist:S.hist.map(h=>h.id),oh:S.orphans.hist.map(h=>h.id),os:S.orphans.stock,fav:S.fav,of:S.orphans.fav,
      riv:S.stock.rivella,has:has("rivella"),fx:S.settings.fx,dishes:S.dishes}));
    ok(r.v===2&&r.app==="zeste","1.2x : format non migré "+JSON.stringify([r.v,r.app]));
    ok(r.air===5&&r.hist.join()==="air_mail,negroni","1.2x : identifiants fusionnés "+JSON.stringify(r));
    ok(r.oh.join()==="recette_disparue"&&r.os.ingredient_disparu===3&&r.of.join()==="recette_disparue","1.2x : rien de côté "+JSON.stringify(r));
    ok(r.fav.join()==="harvey","1.2x : favoris "+r.fav);
    ok(r.riv===1&&r.has===true,"1.2x : soft avec niveau 4 absent du bar");
    ok(r.fx&&r.fx.stream===false&&r.fx.splash===false,"1.2x : réglage wow perdu");
    ok(Array.isArray(r.dishes)&&r.dishes.join()==="pizza","1.2x : accords mets");
    // la mise de côté survit à un enregistrement et un rechargement
    await p.evaluate(()=>{ S.ratings.daiquiri=3; save(); }); await p.waitForTimeout(400); await p.reload(); await p.waitForTimeout(1500);
    const r2=await p.evaluate(()=>({v:S.v,oh:S.orphans.hist.length,os:Object.keys(S.orphans.stock).length,d:S.ratings.daiquiri}));
    ok(r2.v===2&&r2.oh===1&&r2.os===1&&r2.d===3,"1.2x : mise de côté perdue au rechargement "+JSON.stringify(r2));
    await ctx.close(); }

  // 2. format 1.65 : création dont un ingrédient manque → de côté avec son historique ; retour quand tout est connu
  { const {ctx,p}=await open(OLD["1.65"]);
    const r=await p.evaluate(()=>({c:S.custom.length,oc:S.orphans.custom.map(c=>c.id),oh:S.orphans.hist.map(h=>h.id),h:S.hist.map(h=>h.id),rt:S.ratings.c_1,unit:S.settings.unit,preps:S.preps.length,drinks:S.drinks.length,tro:S.tro,mix:S.mix.items.length}));
    ok(r.c===0&&r.oc.join()==="c_1"&&r.oh.join()==="c_1"&&r.h.join()==="negroni"&&r.rt===4,"1.65 : création mise de côté "+JSON.stringify(r));
    ok(r.unit==="ml"&&r.preps===1&&r.drinks===1&&r.tro.includes("alch")&&r.mix===1,"1.65 : champs perdus "+JSON.stringify(r));
    // l'ingrédient « revient » (comme dans une version qui l'ajouterait) : création et verre retrouvent leur place
    const back=await p.evaluate(()=>{ ING.liqueur_future={id:"liqueur_future",n:"Liqueur future",cat:"liqueur",abv:20,sug:20,ac:0,f:{}}; fixState(); buildRecipes(S.custom);
      return {c:S.custom.map(c=>c.id),h:S.hist.map(h=>h.id),oc:S.orphans.custom.length,oh:S.orphans.hist.length,rec:!!RMAP.c_1}; });
    ok(back.c.join()==="c_1"&&back.h.join()==="c_1,negroni"&&back.oc===0&&back.oh===0&&back.rec,"1.65 : la mise de côté ne revient pas "+JSON.stringify(back));
    await ctx.close(); }

  // 3. format 1.86 : rien ne se perd
  { const {ctx,p}=await open(OLD["1.86"]);
    const r=await p.evaluate(()=>({v:S.v,h0:S.hist[0],labSaved:S.labSaved,dishes:S.dishes,backupT:!!S.backupT,snooze:!!(S.snooze&&S.snooze.mojito),sc:S.secondChance,cap:S.settings.glassCap,adj:S.adj.negroni}));
    ok(r.v===2&&r.h0.m===2&&r.h0.v==="mine"&&r.labSaved===2&&r.dishes.length===2&&r.backupT&&r.snooze&&r.sc===1&&r.cap&&r.cap.coupe===20&&r.adj.s===1,"1.86 : champs perdus "+JSON.stringify(r));
    await ctx.close(); }

  // 4. données d'une version plus récente
  { const {ctx,p}=await open(OLD.future);
    const r=await p.evaluate(()=>{ switchTab("bar"); switchTab("profil"); return {v:S.v,f:S.champFutur&&S.champFutur.x}; });
    ok(r.v===7&&r.f===1,"version future rétrogradée ou tronquée "+JSON.stringify(r)); await ctx.close(); }

  // 5. sauvegarde : aller-retour exact, anciens fichiers migrés, fichiers étrangers ou forgés refusés
  { const {ctx,p}=await open(OLD["1.86"]);
    const r=await p.evaluate(()=>{ S.tro=["alch","crea"]; S.troT={alch:1,crea:2}; S.roul=2; S.labBest=88; S.labServes=4; S.prepCount=1; S.bmDone=3; S.chalHard=1; S.fate=1; S.bubbleSaved=1;
      S.quiz={amer:"love"}; S.price={gin:{p:30,v:70}}; S.notes={negroni:"top"}; S.opened={campari:Date.now()-864e5}; S.stockT={gin:Date.now()}; S.tierSeen={tier_verres:0}; S.chalOn="smoky";
      S.preps=[{id:"p1",tpl:"simple",d:new Date().toISOString(),name:"Sirop"}]; S.drinks=[{id:"x",t:Date.now(),ml:330,abv:5,n:"Bière"}]; S.heroLog=[{id:"negroni",d:20260101}]; save();
      const exp=JSON.parse(JSON.stringify(S)), back=sanitizeBackup(migrateState(JSON.parse(JSON.stringify(exp))));
      const norm=x=>JSON.stringify(x,Object.keys(x&&typeof x==="object"?x:{}).sort()), diff=[];
      for(const k of Object.keys(exp)){ if(k==="t") continue; const a=JSON.stringify(exp[k]), c=JSON.stringify(back[k]); const empty=x=>x==null||x==="[]"||x==="{}"; if(a!==c&&!(empty(a)&&empty(c))) diff.push(k+" : "+a.slice(0,80)+" ≠ "+String(c).slice(0,80)); }
      const old=sanitizeBackup(migrateState({stock:{gin:4},settings:{unit:"ml"},hist:[{id:"airmail",t:Date.now()-864e5}]}));
      const foreign=sanitizeBackup(migrateState({stock:{}})), arr=sanitizeBackup([1,2]);
      const forged=sanitizeBackup(migrateState({app:"zeste",stock:{},custom:[{id:'x" onmouseover="alert(1)',n:"A",ing:[{id:"gin",q:50}]},{id:"c_9",n:"B",col:"red;background:url(x)",g:"<b>",ing:[{id:"gin",q:50,u:"zz"}]}]}));
      return {diff,old:old&&{v:old.v,unit:old.settings.unit,h:old.hist.length},foreign,arr,forged:forged&&forged.custom.map(c=>c.id+"|"+c.col+"|"+c.g+"|"+c.ing[0].u)}; });
    ok(!r.diff.length,"sauvegarde incomplète : "+r.diff.join(" ; "));
    ok(r.old&&r.old.v===2&&r.old.unit==="ml"&&r.old.h===1,"ancienne sauvegarde refusée ou non migrée "+JSON.stringify(r.old));
    ok(r.foreign===null&&r.arr===null,"fichier étranger accepté");
    ok(r.forged&&r.forged.join()==="c_9|#C98A2E|coupe|ml","création forgée acceptée "+JSON.stringify(r.forged));
    await ctx.close(); }

  // 6. palier acquis, « Annuler » qui reprend le trophée, nom unique
  { const {ctx,p}=await open({v:2,app:"zeste",t:1,quizSkip:1,settings:{fx:{splash:false,confetti:false}},stock:{}});
    const r=await p.evaluate(()=>{ const ids=Object.keys(ING).filter(id=>!ING[id].basic&&tracked(id)).slice(0,16); ids.forEach(id=>S.stock[id]=4); changed();
      const tb=TIER_TROPHIES.find(t=>t.key==="tier_bar"), before=tierInfo(tb).cur; ids.forEach(id=>S.stock[id]=0); changed(); const after=tierInfo(tb).cur;
      S.hist=[1,2,3,4].map(k=>({id:"negroni",t:Date.now()-k*3600e3})); changed(); const hadLoyal=S.tro.includes("loyal");
      ACT.made({id:"negroni"}); const got=S.tro.includes("loyal"); document.querySelector("#toast .tbtn").click(); const kept=S.tro.includes("loyal");
      S.mix={m:"shake",items:[{id:"gin",q:45},{id:"citron",q:25},{id:"sirop_sucre",q:20}],gar:[]}; nameSheet(); document.getElementById("nm").value="Negroni"; ACT.savemix();
      return {before,after,hadLoyal,got,kept,hist:S.hist.length,name:S.custom.length&&S.custom[S.custom.length-1].n}; });
    ok(r.before===1&&r.after===1,"palier « Cave bien garnie » redescendu "+JSON.stringify(r));
    ok(!r.hadLoyal&&r.got&&!r.kept&&r.hist===4,"Annuler ne reprend pas le trophée "+JSON.stringify(r));
    ok(r.name==="Negroni (2)","nom de création en double "+r.name);
    await ctx.close(); }

  // 7. changement d'heure (Europe/Zurich)
  for(const [n,t,want] of [["2026-03-30T10:00:00","2026-03-29T12:00:00","Hier"],["2026-03-31T10:00:00","2026-03-29T12:00:00","Il y a 2 jours"],["2026-10-26T10:00:00","2026-10-24T12:00:00","Il y a 2 jours"],["2026-10-26T10:00:00","2026-10-25T23:30:00","Hier"]]){
    const ctx=await b.newContext({timezoneId:"Europe/Zurich"}); const p=await ctx.newPage(); await p.clock.setFixedTime(new Date(n)); await p.goto(APP); await p.waitForTimeout(400);
    const got=await p.evaluate(t=>rel(new Date(t).getTime()),t); ok(got===want,"changement d'heure : "+t+" vu le "+n+" → "+got+" (attendu "+want+")"); await ctx.close(); }

  // 8. deux onglets : le second enregistre, le premier reprend ses données
  { const {ctx,p}=await open({v:2,app:"zeste",t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:4}}); const q=await ctx.newPage(); await q.goto(APP); await q.waitForTimeout(1500);
    await q.evaluate(()=>{ S.ratings.negroni=5; save(); }); await p.waitForTimeout(600);
    ok(await p.evaluate(()=>S.ratings.negroni)===5,"autre onglet : données écrasées au lieu d'être reprises"); await ctx.close(); }

  if(errs.length) fail.push("erreurs : "+[...new Set(errs)].join(" | "));
  console.log(fail.length? "Migrations : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Migrations : formats 1.2x, 1.65 et 1.86 migrés vers le format 2 sans perte (identifiants fusionnés, softs à niveau, réglages anciens), inconnus mis de côté puis repris, version future jamais rétrogradée ; sauvegarde restaurée à l'identique, anciens fichiers migrés, fichiers étrangers et créations forgées refusés ; palier acquis, Annuler qui reprend le trophée, nom unique, changement d'heure, deux onglets.");
  await b.close(); SRV.close(); process.exit(fail.length?1:0); })();
