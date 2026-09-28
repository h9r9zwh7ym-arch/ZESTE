// Vérifie que la recherche (cocktails, bar, labo) ne perd pas de lettres en tapant vite,
// et que le champ lui-même n'est jamais recréé pendant la saisie (identité DOM stable).
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html'));
  await p.waitForTimeout(1200);
  if(await p.getByText('Passer').count()){ await p.getByText('Passer').first().click(); await p.waitForTimeout(500); }
  const out=[];

  // 1) recherche cocktails (#cq)
  await p.evaluate(()=>switchTab('cocktails')); await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.__stable=true; const el=document.getElementById('cq'); window.__ref=el; const mo=new MutationObserver(()=>{ if(document.getElementById('cq')!==window.__ref) window.__stable=false; }); mo.observe(document.getElementById('v-cocktails'),{childList:true,subtree:true}); });
  const word1='daiquiri fraise';
  await p.locator('#cq').pressSequentially(word1,{delay:12});
  await p.waitForTimeout(300);
  const val1=await p.inputValue('#cq'); if(val1!==word1) out.push('cocktails : attendu « '+word1+' », obtenu « '+val1+' »');
  const stable1=await p.evaluate(()=>window.__stable); if(!stable1) out.push('cocktails : le champ #cq a été recréé pendant la saisie');
  const cfq=await p.evaluate(()=>CF.q); if(cfq!==word1) out.push('cocktails : CF.q ne correspond pas à la saisie (« '+cfq+' »)');

  // 2) recherche ingrédients à ajouter au bar (#aq)
  await p.evaluate(()=>{ closeAll(); addSheet(); }); await p.waitForTimeout(500);
  await p.evaluate(()=>{ window.__stable2=true; const el=document.getElementById('aq'); window.__ref2=el; const mo=new MutationObserver(()=>{ if(document.getElementById('aq')!==window.__ref2) window.__stable2=false; }); mo.observe(document.querySelector('.sheet'),{childList:true,subtree:true}); });
  const word2='chartreuse jaune';
  await p.locator('#aq').pressSequentially(word2,{delay:12});
  await p.waitForTimeout(300);
  const val2=await p.inputValue('#aq'); if(val2!==word2) out.push('bar : attendu « '+word2+' », obtenu « '+val2+' »');
  const stable2=await p.evaluate(()=>window.__stable2); if(!stable2) out.push('bar : le champ #aq a été recréé pendant la saisie');

  // 3) recherche ingrédients dans le labo (#pq)
  await p.evaluate(()=>{ closeAll(); pickIngSheet(()=>{}); }); await p.waitForTimeout(500);
  await p.evaluate(()=>{ window.__stable3=true; const el=document.getElementById('pq'); window.__ref3=el; const mo=new MutationObserver(()=>{ if(document.getElementById('pq')!==window.__ref3) window.__stable3=false; }); mo.observe(document.querySelector('.sheet'),{childList:true,subtree:true}); });
  const word3='sirop de gingembre';
  await p.locator('#pq').pressSequentially(word3,{delay:12});
  await p.waitForTimeout(300);
  const val3=await p.inputValue('#pq'); if(val3!==word3) out.push('labo : attendu « '+word3+' », obtenu « '+val3+' »');
  const stable3=await p.evaluate(()=>window.__stable3); if(!stable3) out.push('labo : le champ #pq a été recréé pendant la saisie');

  console.log(out.length?out.join('\n'):'Recherche cocktails/bar/labo : aucune lettre perdue, champ jamais recréé pendant la saisie.');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close(); process.exit(out.length||errs.length?1:0);
})();
