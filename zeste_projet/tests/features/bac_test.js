// Vérifie la bulle de taux d'alcoolémie : apparition après un cocktail, demande du poids, prise en compte
// d'une boisson ajoutée manuellement, décroissance dans le temps, disparition à zéro, et cohérence numérique.
const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html'));
  await p.waitForTimeout(1200);
  if(await p.getByText('Passer').count()){ await p.getByText('Passer').first().click(); await p.waitForTimeout(500); }
  const out=[];

  // 1) sans historique : rien ne doit s'afficher
  const r0=await p.evaluate(()=>{ switchTab('today'); return document.getElementById('bac-card')||document.querySelector('.bac-setup'); });
  if(r0) out.push('Étape 1 : une bulle apparaît sans aucun verre bu, ne devrait pas.');

  // 2) prépare un cocktail sans avoir renseigné le poids -> invite discrète à renseigner le poids
  await p.evaluate(()=>{ logMade('negroni'); dirty.today=1; renderView('today'); });
  await p.waitForTimeout(200);
  const hasSetup=await p.evaluate(()=>!!document.querySelector('.bac-setup'));
  if(!hasSetup) out.push('Étape 2 : après un cocktail sans poids renseigné, l’invite à renseigner le poids n’apparaît pas.');

  // 3) renseigne le poids -> la bulle affiche un vrai taux
  await p.evaluate(()=>{ S.settings.weightKg=75; S.settings.sex='h'; changed(); });
  await p.waitForTimeout(200);
  const v1=await p.evaluate(()=>{ const el=document.querySelector('.bac-v'); return el&&el.textContent; });
  if(!v1||!/‰/.test(v1)) out.push('Étape 3 : le taux ne s’affiche pas après avoir renseigné le poids (« '+v1+' »).');

  // 4) le calcul est cohérent avec la formule attendue (négroni : environ 25 % vol, 90 ml -> ~17.7 g d'alcool)
  const calc=await p.evaluate(()=>{ const st=bacState(); return st.perMille; });
  const expected=await p.evaluate(()=>{ const r=RMAP.negroni, m=metricsR(r); const g=m.vol*m.abv/100*0.789; return g/(75*0.66); });
  if(Math.abs(calc-expected)>0.02) out.push('Étape 4 : calcul incohérent (obtenu '+calc.toFixed(3)+', attendu ~'+expected.toFixed(3)+').');

  // 5) ajoute une bière -> le taux doit augmenter
  await p.evaluate(()=>{ closeAll(); bacAddSheet(); });
  await p.waitForTimeout(300);
  await p.evaluate(()=>{ ACT.bacpreset({d:'5'}); });
  await p.waitForTimeout(150);
  await p.evaluate(()=>{ ACT.bacconfirm(); });
  await p.waitForTimeout(300);
  const calc2=await p.evaluate(()=>bacState().perMille);
  if(!(calc2>calc)) out.push('Étape 5 : ajouter une bière ne fait pas augmenter le taux (avant '+calc.toFixed(3)+', après '+calc2.toFixed(3)+').');

  // 6) avance le temps de 8h (bien au-delà du retour à zéro) -> la bulle doit disparaître
  await p.evaluate(()=>{
    const OrigDate=Date, base=OrigDate.now()+8*3600*1000;
    globalThis.Date=class extends OrigDate{ constructor(...a){ if(a.length===0) return new OrigDate(base); return new OrigDate(...a); } static now(){ return base; } };
  });
  const st3=await p.evaluate(()=>{ dirty.today=1; renderView('today'); return bacState(); });
  const cardGone=await p.evaluate(()=>!document.getElementById('bac-card'));
  if(st3.active) out.push('Étape 6 : le taux estimé est encore actif 8h plus tard, ne devrait plus l’être.');
  if(!cardGone) out.push('Étape 6 : la bulle est toujours affichée après retour à zéro.');

  console.log(out.length?out.join('\n'):'Alcoolémie : apparition, invite au poids, calcul cohérent, prise en compte d’une autre boisson, et disparition à zéro : tout est correct.');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close(); process.exit(out.length||errs.length?1:0);
})();
