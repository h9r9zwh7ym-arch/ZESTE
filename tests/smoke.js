// Test de fumée dans Chromium : ouvre chaque fiche de recette et vérifie qu'aucune erreur n'apparaît.
// usage : NODE_PATH=$(npm root -g) node tests/smoke.js [dossier-captures]
const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const out=process.argv[2];
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(1500);
  const res=await p.evaluate(()=>{const bad=[];
    for(const r of RECS){try{
      const st=buildSteps(r); if(!st.length||st.some(s=>!s.t||/undefined|NaN/.test(s.t))) bad.push(r.id+' : étapes '+JSON.stringify(st));
      r.ing.forEach(i=>{const q=fmtQ(i); if(/undefined|NaN/.test(q)) bad.push(r.id+' : quantité '+q);});
      const c=calc(r.ing,r.m,r.ice); if(!(c.vol>0)||!isFinite(c.abv)) bad.push(r.id+' : calc '+JSON.stringify(c));
      if(!glassSVG(r)) bad.push(r.id+' : pas de dessin');
      ACT.rec({id:r.id}); }catch(e){bad.push(r.id+' : '+e.message);} }
    return bad;});
  if(out){ for(const id of ['caipirinha','sazerac','zombie','penicillin','old_fashioned','mojito','spicy_fifty','sherry_cobbler','iba_tiki','dons_daiquiri']){
      await p.evaluate(()=>{document.querySelectorAll('.sheet').forEach(s=>s.remove&&0);});
      await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(3500);if(await p.getByText('Passer').count()){await p.getByText('Passer').first().click();await p.waitForTimeout(800);}
      await p.evaluate(id=>ACT.rec({id}),id);await p.waitForTimeout(900);
      await p.screenshot({path:path.join(out,id+'.png'),fullPage:false});
      const txt=await p.evaluate(()=>{const s=[...document.querySelectorAll('.ing-line,.steps li')].map(e=>e.innerText.replace(/\n/g,' '));return s.join('\n');});
      console.log('--- '+id+'\n'+txt);
  } }
  console.log(res.length?res.join('\n'):'Toutes les fiches s’ouvrent sans erreur ('+(await p.evaluate(()=>RECS.length))+' recettes).');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close();process.exit(res.length||errs.length?1:0);
})();
