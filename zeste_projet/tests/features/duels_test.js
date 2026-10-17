// 1.60 (B8, B9, B11, B12) : duels de goût (feuille depuis Ton carnet, choix en label.hap, fin après 10, état validé),
// signaux implicites (Préparer depuis la fiche, Surprends-moi écarté), précision mesurée dès 10 notes, explication par les duels.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(/[?&]r=1/.test(location.search)) return; localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2,vermouth_rouge:1},ratings:{negroni:5,daiquiri:4,mojito:2}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  await p.evaluate(()=>switchTab('profil')); await p.waitForTimeout(800);
  if(!await p.evaluate(()=>!!document.querySelector('#v-profil [data-a="duels"]'))) fail.push('pas de ligne « Affiner mon goût » dans Ton carnet');
  await p.evaluate(()=>document.querySelector('#v-profil [data-a="duels"]').scrollIntoView({block:"center"})); await p.waitForTimeout(300);
  await p.tap('#v-profil [data-a="duels"]'); await p.waitForTimeout(800);
  const s=await p.evaluate(()=>{ const sh=[...document.querySelectorAll('.sheet')].pop(); const c=[...sh.querySelectorAll('.duel-c')]; return {n:c.length, hap:c.every(x=>x.matches('label.hap')&&x.querySelector('input.hap-sw')), rated:c.some(x=>S.ratings[x.dataset.w]), txt:sh.querySelector('.sheet-body').textContent.replace(/\s+/g," ").trim()}; });
  if(s.n!==2||!s.hap||s.rated) fail.push('feuille : '+JSON.stringify(s));
  for(let i=0;i<12;i++){ if(!await p.evaluate(()=>!!document.querySelector('.sheet .duel-c'))) break; await p.tap('.sheet .duel-c:first-of-type'); await p.waitForTimeout(350); }
  const d=await p.evaluate(()=>({n:S.duels.length, open:SHEETS.length, saved:(JSON.parse(localStorage.getItem('zeste.v1')).duels||[]).length, distinct:new Set(S.duels.flatMap(x=>[x.a,x.b])).size}));
  if(d.n!==10||d.open||d.saved!==10||d.distinct!==20) fail.push('10 duels : '+JSON.stringify(d));
  // état : doublons, inconnus et gagnants invalides écartés
  const h=await p.evaluate(()=>{ S.duels=S.duels.concat([{a:"x",b:"negroni",w:"x"},{a:"negroni",b:"negroni",w:"negroni"},{a:"americano",b:"gimlet",w:"autre"}]); healState(); const n=S.duels.length; const bk=sanitizeBackup({stock:{gin:1},duels:[{a:"americano",b:"gimlet",w:"gimlet"},{a:"zz",b:"gimlet",w:"zz"}],sig:{p:{negroni:2,zz:1},r:{gimlet:-1}}}); return [n,(bk.duels||[]).length,JSON.stringify(bk.sig)]; });
  if(h[0]!==10||h[1]!==1||h[2]!=='{"p":{"negroni":2}}') fail.push('validation : '+h.join(" "));
  // le modèle tient compte des duels (explication possible) et ils pèsent moins qu'une note de 5
  const m=await p.evaluate(()=>{ MODEL=null; const T=getModel().T; const d=Object.values(T).filter(t=>t.duel); return {n:d.length, maxV:Math.max(...d.map(t=>t.v)), maxW:Math.max(...d.map(t=>t.w))}; });
  if(!m.n||m.maxV>=2||m.maxW>=1) fail.push('poids des duels : '+JSON.stringify(m));
  const why=await p.evaluate(()=>RECS.map(r=>reasons(r)).find(t=>/choisi dans tes duels/.test(t))||"");
  // signaux : Préparer depuis la fiche ouverte (+), Surprends-moi écarté tout de suite (−)
  await p.evaluate(()=>{ closeAll(); recSheet('americano'); }); await p.waitForTimeout(700);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll('.sheet [data-a="barmode"]')].pop(); b.click(); }); await p.waitForTimeout(500);
  await p.evaluate(()=>{ if(typeof closeOverlay==="function") closeOverlay(); closeAll(); ACT.roulette(); }); await p.waitForTimeout(1600);
  await p.evaluate(()=>ACT.bmclose()); await p.waitForTimeout(300);
  const g=await p.evaluate(()=>S.sig);
  if(!g||!g.p||!g.p.americano||!g.r||!Object.keys(g.r).length) fail.push('signaux : '+JSON.stringify(g));
  // précision : rien sous 10 notes, une phrase dès 10
  const a1=await p.evaluate(()=>{ closeAll(); ACT.about(); return new Promise(r=>setTimeout(()=>r(!!document.querySelector('.sheet .about-acc')),400)); });
  const a2=await p.evaluate(()=>{ closeAll(); ["americano","boulevardier","old_fashioned","manhattan","margarita","pina_colada","aperol_spritz","gin_tonic","whisky_sour"].forEach((id,i)=>S.ratings[id]=1+i%5); SREV++; ACT.about(); return new Promise(r=>setTimeout(()=>{ const e=document.querySelector('.sheet .about-acc'); r(e&&e.textContent); },500)); });
  if(a1||!/^Zeste a deviné \d+\s%\sde tes notes à une étoile près$/.test(a2||"")) fail.push('précision : '+a1+' / '+a2);
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC duels et signaux : '+fail.join(' ; '):`Duels de goût : feuille depuis Ton carnet, choix haptiques, 10 duels puis fermeture, état validé, poids < une note (${why?"« "+why+" »":"pas d'explication par les duels sur ce bar"}) ; signaux Préparer et Surprends-moi enregistrés ; précision affichée dès 10 notes (« ${a2} »).`);
  await b.close(); process.exit(fail.length?1:0); })();
