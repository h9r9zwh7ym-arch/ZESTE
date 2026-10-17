// 1.59 (F19) : au Labo, le verre « Auto » est toujours celui marqué « Conseillé » (même fonction), sur toutes les recettes
// chargées dans le Labo, glace comprise ; quand on choisit un autre verre, « Conseillé » reste sur le choix automatique.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const bad=[]; let n=0;
    for(const rc of RECS){ if(!rc.ing||!rc.ing.length) continue;
      S.mix=Object.assign(S.mix,{m:rc.m==="build"||rc.m==="shake"||rc.m==="stir"?rc.m:"build",g:null,gUser:0,ice:null,gar:[],items:rc.ing.filter(i=>!i.u||i.u==="ml").map(i=>({id:i.id,q:i.q}))});
      if(!S.mix.items.length) continue; n++;
      const a=labGlass(); if(a.g!==a.rec.g) bad.push(rc.id+": auto "+a.g+" / conseillé "+a.rec.g);
      const other=LGLASS.map(x=>x[0]).find(x=>x!==a.g); S.mix.g=other; S.mix.gUser=1; const c=labGlass(); if(c.rec.g!==a.g) bad.push(rc.id+": choisi "+other+", conseillé "+c.rec.g+" au lieu de "+a.g); }
    // le badge affiché suit
    S.mix=Object.assign(S.mix,{m:"build",g:"coupe",gUser:1,ice:null,gar:[],items:[{id:"gin",q:50},{id:"tonic",q:120}]}); LT="compose"; switchTab("labo"); dirty.labo=1; renderView("labo");
    const em=[...document.querySelectorAll('#v-labo .lg')].filter(x=>x.querySelector('em')).map(x=>x.dataset.v); const auto=(()=>{ S.mix.g=null; const g=labGlass().g; S.mix.g="coupe"; return g; })();
    return {n,bad:bad.slice(0,5),nb:bad.length,em,auto}; });
  if(r.n<100) fail.push('trop peu de recettes testées : '+r.n);
  if(r.nb) fail.push(r.nb+' écarts, ex. '+r.bad.join(' | '));
  if(r.em.length!==1||r.em[0]!==r.auto) fail.push('badge « Conseillé » : '+JSON.stringify(r.em)+' / auto '+r.auto);
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC verre Auto : '+fail.join(' ; '):`Verre Auto : identique au « Conseillé » sur ${r.n} recettes (glace comprise), et le badge reste sur le choix automatique quand on choisit un autre verre.`);
  await b.close(); process.exit(fail.length?1:0); })();
