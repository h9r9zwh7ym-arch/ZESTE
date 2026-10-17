// 1.61 (C) : dans « Ça ressemble à » et toute liste de recettes, le point de statut à droite n'apparaît que vert (faisable) ;
// sinon rien (plus de point gris ni orange).
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{rhum_blanc:2,citron_vert:1,gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{ const ok=Object.values(RMAP).find(x=>status(x).ok), no=Object.values(RMAP).find(x=>!status(x).ok&&!status(x).subOk), sub=Object.values(RMAP).find(x=>!status(x).ok&&status(x).subOk);
    const seen={};
    S.mix={m:"shake",g:null,gUser:0,ice:null,gar:[],t:"auto",items:[{id:"rhum_blanc",q:60},{id:"citron_vert",q:20},{id:"sirop_sucre",q:15}]}; LT="compose";
    for(const [n,f] of [["labo",()=>switchTab('labo')],["cocktails",()=>switchTab('cocktails')],["aujourd’hui",()=>switchTab('today')],["fiche",()=>recSheet('daiquiri')]]){
      f(); await new Promise(z=>setTimeout(z,700)); const d=document.querySelector('.lab-more'); if(d) d.open=true;
      seen[n]={grey:document.querySelectorAll('.dot.no,.dot.sub').length, green:document.querySelectorAll('.dot.ok').length}; }
    return {ok:ok&&/class="dot ok"/.test(recRow(ok)), no:no&&!/class="dot/.test(recRow(no)), sub:sub?!/class="dot/.test(recRow(sub)):true, seen}; });
  if(!r.ok) fail.push("recette faisable : point vert absent"); if(!r.no) fail.push("recette non faisable : un point reste"); if(!r.sub) fail.push("faisable avec substitut : un point reste");
  for(const k in r.seen) if(r.seen[k].grey) fail.push(k+" : "+r.seen[k].grey+" point(s) gris ou orange");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Points de statut : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Points de statut : vert seulement pour une recette faisable, rien sinon ("+Object.entries(r.seen).map(([k,v])=>k+" "+v.green+" vert").join(", ")+").");
  await b.close(); process.exit(fail.length?1:0); })();
