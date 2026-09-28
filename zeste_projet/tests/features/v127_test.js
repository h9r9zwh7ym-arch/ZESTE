const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html'));
  await p.waitForTimeout(1200);
  if(await p.getByText('Passer').count()){ await p.getByText('Passer').first().click(); await p.waitForTimeout(500); }
  const out=[];

  // 1) le sexe n'a plus que deux options
  await p.evaluate(()=>{ switchTab('profil'); settingsSheet(); });
  await p.waitForTimeout(300);
  const sexOpts=await p.evaluate(()=>[...document.querySelectorAll('[data-a="setsex"]')].map(b=>b.textContent.trim()));
  if(sexOpts.length!==2 || sexOpts.some(t=>/précisé/i.test(t))) out.push('1) Le choix du sexe ne contient pas exactement Homme/Femme (obtenu : '+JSON.stringify(sexOpts)+').');

  // 2) l'unité kg apparaît à côté du poids
  const weightUnit=await p.evaluate(()=>{ const inp=document.getElementById('bac-w-set'); const row=inp&&inp.closest('.row'); return row&&row.textContent; });
  if(!weightUnit||!/kg/.test(weightUnit)) out.push('2) L’unité « kg » n’apparaît pas à côté du champ Poids (obtenu : '+weightUnit+').');

  // sans sexe renseigné, la bulle doit rester à l'étape "à renseigner", même avec un poids
  await p.evaluate(()=>{ closeAll(); S.settings.weightKg=75; delete S.settings.sex; logMade('negroni'); switchTab('today'); dirty.today=1; renderView('today'); });
  await p.waitForTimeout(200);
  const stillSetup=await p.evaluate(()=>!!document.querySelector('.bac-setup'));
  if(!stillSetup) out.push('1bis) Sans le sexe renseigné, la bulle affiche déjà un chiffre alors qu’elle ne devrait pas.');

  // 3) le bouton + est bien le premier enfant de la ligne, une fois poids ET sexe renseignés
  await p.evaluate(()=>{ S.settings.sex='h'; dirty.today=1; renderView('today'); });
  await p.waitForTimeout(200);
  const order=await p.evaluate(()=>{ const row=document.querySelector('#bac-card .bac-row'); return row?[...row.children].map(c=>c.className):null; });
  if(!order || !/bac-add/.test(order[0]||'')) out.push('3) Le bouton + n’est pas le premier élément de la bulle (ordre observé : '+JSON.stringify(order)+').');

  // 4) l'étagère : raccourcis de rayon présents, et les softs affichent un statut clair
  await p.evaluate(()=>{ closeAll(); S.stock={gin:4,tonic:1,sucre:1}; S.settings.barView='shelf'; switchTab('bar'); dirty.bar=1; renderView('bar'); });
  await p.waitForTimeout(300);
  const jumps=await p.evaluate(()=>[...document.querySelectorAll('.b2-jump button')].length);
  const softTag=await p.evaluate(()=>{ const b=[...document.querySelectorAll('.b2-b')].find(x=>x.dataset.id==='tonic'); return b&&b.querySelector('.b2-l')&&b.querySelector('.b2-l').textContent; });
  if(!(jumps>=1)) out.push('4) Aucun raccourci de rayon dans l’étagère.');
  if(softTag!=='En stock') out.push('4) Le statut du soft ("tonic") dans l’étagère n’est pas clair (obtenu : '+softTag+').');

  // 5) trophées à paliers : présents dans le profil, avec le bon libellé de palier
  await p.evaluate(()=>{ closeAll(); S.hist=Array.from({length:12},(_,i)=>({id:'negroni',t:Date.now()-i*36e5})); checkTrophies(); switchTab('profil'); dirty.profil=1; renderView('profil'); });
  await p.waitForTimeout(300);
  const tierTile=await p.evaluate(()=>{ const b=document.querySelector('[data-a="tiertrophy"][data-k="tier_verres"]'); return b&&b.querySelector('.tp')&&b.querySelector('.tp').textContent; });
  if(!tierTile||!/Argent/.test(tierTile)) out.push('5) Le palier « Habitué de bar » n’affiche pas le bon niveau après 12 verres (obtenu : '+tierTile+').');
  const oldGoneOrHarder=await p.evaluate(()=>{ const tt=TIER_TROPHIES.find(x=>x.key==='tier_notes'); return tt.tiers[tt.tiers.length-1][1]; });
  if(!(oldGoneOrHarder>60)) out.push('5bis) Le palier le plus haut de « Palais averti » n’est pas plus long à débloquer qu’avant (60).');

  // 6) le matin, pas de section "Aussi pour toi"
  await p.evaluate(()=>{ closeAll(); S.settings.moment='matin'; S.stock={gin:4,campari:3,vermouth_rouge:2}; switchTab('today'); dirty.today=1; renderView('today'); });
  await p.waitForTimeout(200);
  const hasSuggestMorning=await p.evaluate(()=>!!document.querySelector('#v-today h2.sh'));
  const suggestTextMorning=await p.evaluate(()=>{ const hs=[...document.querySelectorAll('#v-today h2.sh')]; return hs.some(h=>/Aussi pour toi/.test(h.textContent)); });
  if(suggestTextMorning) out.push('6) La section « Aussi pour toi » apparaît encore le matin.');
  await p.evaluate(()=>{ S.settings.moment='soir'; dirty.today=1; renderView('today'); });
  await p.waitForTimeout(200);
  const suggestTextEvening=await p.evaluate(()=>{ const hs=[...document.querySelectorAll('#v-today h2.sh')]; return hs.some(h=>/Aussi pour toi/.test(h.textContent)); });
  if(!suggestTextEvening) out.push('6bis) La section « Aussi pour toi » a disparu même le soir (elle ne devrait disparaître que le matin).');

  console.log(out.length?out.join('\n'):'Les 6 points demandés sont bien pris en compte.');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close(); process.exit(out.length||errs.length?1:0);
})();
