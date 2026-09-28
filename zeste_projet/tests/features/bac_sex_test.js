// Vérifie que le sexe renseigné dans les réglages influence bien le calcul (facteur de Widmark),
// que la fiche détail liste et permet de retirer une boisson ajoutée à la main, et que le réglage se fait
// bien dans l'app (segment dans les réglages).
const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html'));
  await p.waitForTimeout(1200);
  if(await p.getByText('Passer').count()){ await p.getByText('Passer').first().click(); await p.waitForTimeout(500); }
  const out=[];

  // état de base : poids fixé, un cocktail préparé
  await p.evaluate(()=>{ S.settings.weightKg=75; logMade('negroni'); });

  const [hVal,fVal,noSexReady]=await p.evaluate(()=>{
    const r=v=>{ S.settings.sex=v; return bacState().perMille; };
    const h=r('h'), f=r('f');
    S.settings.sex=undefined; const st=bacState();
    return [h, f, !!st.ready];
  });
  console.log('homme :',hVal.toFixed(4),' femme :',fVal.toFixed(4),' prêt sans sexe :',noSexReady);
  if(!(hVal<fVal)) out.push('Le sexe ne change pas le calcul dans le bon sens (attendu homme < femme).');
  if(noSexReady) out.push('Sans sexe renseigné, le taux est quand même calculé (« non précisé » devait disparaître).');
  const rObs=await p.evaluate(()=>{ S.settings.sex="h"; const h=widmarkR(); S.settings.sex="f"; const f=widmarkR(); S.settings.sex="x"; const x=widmarkR(); S.settings.sex=undefined; const u=widmarkR(); return {h,f,x,u}; });
  if(Math.abs(rObs.h-0.68)>1e-9) out.push('widmarkR("h") ne vaut pas 0.68 (obtenu '+rObs.h+').');
  if(Math.abs(rObs.f-0.55)>1e-9) out.push('widmarkR("f") ne vaut pas 0.55 (obtenu '+rObs.f+').');
  if(Math.abs(rObs.x-0.66)>1e-9) out.push('widmarkR("x") ne vaut pas 0.66 (obtenu '+rObs.x+').');
  if(Math.abs(rObs.u-0.66)>1e-9) out.push('widmarkR(non défini) ne vaut pas 0.66 (obtenu '+rObs.u+').');

  // le réglage est bien accessible et sauvegardé depuis les Paramètres
  await p.evaluate(()=>{ delete S.settings.sex; switchTab('profil'); settingsSheet(); });
  await p.waitForTimeout(300);
  await p.evaluate(()=>{ ACT.setsex({v:'f'}); });
  await p.waitForTimeout(150);
  const savedSex=await p.evaluate(()=>S.settings.sex);
  if(savedSex!=='f') out.push('Le réglage du sexe depuis les Paramètres ne s’enregistre pas (obtenu « '+savedSex+' »).');
  const segShown=await p.evaluate(()=>!!document.querySelector('[data-a="setsex"][data-v="f"].on'));
  if(!segShown) out.push('Le segment Sexe n’affiche pas la sélection courante.');

  // la fiche détail liste bien le cocktail et une boisson ajoutée, et permet de la retirer
  await p.evaluate(()=>{ closeAll(); S.drinks=[]; ACT.bacadd(); });
  await p.waitForTimeout(300);
  await p.evaluate(()=>{ ACT.bacpreset({d:'12.5'}); ACT.bacconfirm(); });
  await p.waitForTimeout(300);
  await p.evaluate(()=>{ ACT.bacdetail(); });
  await p.waitForTimeout(300);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('.sheet .group .row .t')].map(e=>e.textContent));
  if(!rows.some(t=>/Negroni/i.test(t))) out.push('La fiche détail ne liste pas le cocktail préparé (« '+rows.join(', ')+' »).');
  if(!rows.some(t=>/Vin/i.test(t))) out.push('La fiche détail ne liste pas la boisson ajoutée (« '+rows.join(', ')+' »).');
  const beforeCount=await p.evaluate(()=>bacEventsRaw().length);
  await p.evaluate(()=>{ const id=(S.drinks||[])[0]&&S.drinks[0].id; if(id) ACT.bacrm({id}); });
  await p.waitForTimeout(200);
  const afterCount=await p.evaluate(()=>bacEventsRaw().length);
  if(!(afterCount<beforeCount)) out.push('Retirer une boisson depuis la fiche détail ne réduit pas les événements comptés ('+beforeCount+' -> '+afterCount+').');

  console.log(out.length?out.join('\n'):'Sexe pris en compte dans le calcul (sens correct), réglable depuis les Paramètres, et fiche détail correcte (liste + suppression).');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close(); process.exit(out.length||errs.length?1:0);
})();
