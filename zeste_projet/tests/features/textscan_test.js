// 1.70 : aucun écran ni aucune fiche n'affiche « NaN », « undefined », « null », « [object …] » ou « Infinity », et aucune erreur JavaScript,
// pour un nouvel utilisateur (vide) et un utilisateur très actif (historique, notes, prix, préparations, alcoolémie, création, « Ta version »).
const {chromium}=require('playwright');
let NREC=0;
(async()=>{ const b=await chromium.launch(); const out=[];
for(const prof of ["vide","riche"]){
 const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
 await p.addInitScript(prof=>{ if(prof==="vide"){ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1}})); return; }
   const now=Date.now(), H=[]; ["negroni","mojito","daiquiri","gin_tonic","margarita","old_fashioned","aperol_spritz"].forEach((id,k)=>{ for(let j=0;j<3;j++) H.push({id,t:now-(k*5+j)*36e5}); });
   localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1,name:"Yaya",weightKg:75,sex:"h"},stock:{gin:3,rhum_blanc:2,citron_vert:1,citron:1,menthe:1,sirop_sucre:1,campari:2,vermouth_rouge:2,tonic:1,tequila:2,triple_sec:2,bourbon:2,angostura:1,aperol:2,prosecco:1},
     ratings:{negroni:5,mojito:4,daiquiri:5,margarita:2,gin_tonic:3},fav:["negroni"],hist:H,price:{gin:{p:35,v:700},campari:{p:25,v:700}},drinks:[{t:now-36e5,ml:330,abv:5}],preps:[{tpl:(typeof PREP_TPL!=="undefined"?PREP_TPL[0][0]:"x"),d:new Date(now-2*864e5).toISOString()}],
     custom:[{id:"c_1000",n:"Alpha",fam:"sour",m:"shake",g:"coupe",ing:[{id:"gin",q:50},{id:"citron",q:25},{id:"sirop_sucre",q:15}]}],adj:{daiquiri:{s:-1,a:1,f:0}}})); },prof);
 await p.goto('file://'+require('path').join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(2500);
 const scan=async where=>{ const t=await p.evaluate(()=>document.body.innerText); const m=t.match(/.{0,30}\b(NaN|undefined|null|\[object [A-Za-z]+\]|Infinity)\b.{0,30}/g); if(m) out.push(prof+" "+where+" : "+[...new Set(m)].slice(0,3).join(" | ")); };
 for(const t of ["today","cocktails","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(500); await scan(t); }
 const ids=await p.evaluate(()=>RECS.map(r=>r.id)); NREC=ids.length;
 for(const id of ids){ await p.evaluate(id=>{ closeAll(); recSheet(id); },id); await p.waitForTimeout(60); await scan("fiche "+id); }
 await p.evaluate(()=>closeAll()); await p.waitForTimeout(300);
 // feuilles et écrans secondaires
 for(const f of ["addSheet()","homeSheet()","typeof openSettings==='function'&&openSettings()","typeof bacDetailSheet==='function'&&bacDetailSheet()","ACT.alltro&&ACT.alltro()","typeof openBM==='function'&&openBM('negroni')"]){ try{ await p.evaluate(f=>{ closeAll(); eval(f); },f); await p.waitForTimeout(400); await scan(f); }catch(e){ out.push(prof+" "+f+" : "+e.message.slice(0,80)); } }
 if(errs.length) out.push(prof+" erreurs JS : "+[...new Set(errs)].slice(0,5).join(" | "));
 await p.close(); }
console.log(out.length? "Textes affichés : "+out.length+" problème(s)\n  "+out.join("\n  ") : "Textes affichés : aucun NaN, undefined ni erreur JS sur les 5 onglets, les "+NREC+" fiches et les feuilles, profil vide et profil riche."); await b.close(); process.exit(out.length?1:0); })();
