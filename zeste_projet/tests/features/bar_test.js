// 1.71 : « Mon bar » — ligne « À finir » (prosecco ouvert depuis 2 jours, vermouth en fin de vie ; pas pour un vermouth
// ouvert d'hier), carte « Le meilleur achat » = 1er de bottleRecs, « N cocktails » exact sous chaque bouteille,
// date d'ouverture enregistrée pour un vermouth entamé, fiche bouteille enrichie, feuille « À finir » sans doublon.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ const D=864e5,n=Date.now(); localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},
    stock:{gin:3,vodka:2,campari:3,vermouth_rouge:2,vermouth_dry:3,prosecco:3,aperol:2,citron:1,tonic:1,sirop_sucre:1,lillet:4},
    opened:{prosecco:n-2*D,vermouth_rouge:n-25*D,vermouth_dry:n-1*D}})); });
  await p.goto(APP); await p.waitForTimeout(2200);
  await p.evaluate(()=>switchTab('bar')); await p.waitForTimeout(900);
  const R=await p.evaluate(()=>{ const T=e=>e&&e.textContent.replace(/[\u00a0\u202f]/g," "); const fin=document.querySelector('#v-bar .fin-line'), card=document.querySelector('#v-bar .buy-card'), br=bottleRecs()[0];
    const counts={}; RECS.forEach(r=>{ if(!status(r).ok) return; new Set(r.ing.filter(i=>i.r!=="opt"&&i.r!=="rinse").map(i=>i.id)).forEach(id=>counts[id]=(counts[id]||0)+1); });
    const rows=[...document.querySelectorAll('#v-bar .bar-row')].map(r=>{ const id=r.id.slice(3), s=r.querySelector('.bar-n'); return [id,s?T(s):""]; });
    return {fin:T(fin), toF:toFinish().map(x=>x[0]), card:T(card), brN:br&&shortN(br.id), brC:br&&br.rs.length,
      bad:rows.filter(([id,t])=>{ const n=counts[id]||0, m=t.match(/^(\d+) cocktails?/); return n?!(m&&+m[1]===n):!!m; }).map(x=>x.join(":")), nrows:rows.length,
      foldBuy:!!document.querySelector('#v-bar details.bar-more [data-a="buysheet"]'), vdry:(rows.find(r=>r[0]==="vermouth_dry")||[])[1]}; });
  if(!R.fin||!/À finir : Prosecco, encore 1 jour \(\+1\)/.test(R.fin)) fail.push("ligne « À finir » : "+R.fin);
  if(R.toF.join()!=="prosecco,vermouth_rouge") fail.push("bouteilles à finir : "+R.toF.join());
  if(/encore/.test(R.vdry||"")) fail.push("vermouth dry ouvert d’hier signalé à finir");
  if(!R.card||!R.card.includes(R.brN+" : +"+R.brC+" cocktail")) fail.push("carte meilleur achat ≠ bottleRecs : "+R.card+" / "+R.brN+" +"+R.brC);
  if(R.foldBuy) fail.push("« Achats malins » encore dans le repli");
  if(R.bad.length||!R.nrows) fail.push("comptes faux : "+R.bad.join(", "));
  // date d'ouverture : lillet plein → ¾
  await p.evaluate(()=>ACT.setlvl({id:"lillet",l:"3"})); await p.waitForTimeout(300);
  const op=await p.evaluate(()=>{ const t=(S.opened||{}).lillet; return t&&Date.now()-t<6e4; }); if(!op) fail.push("ouverture du Lillet non enregistrée");
  await p.evaluate(()=>ACT.refill({id:"lillet"})); await p.waitForTimeout(300);
  if(await p.evaluate(()=>!!(S.opened||{}).lillet)) fail.push("Lillet rachetée : date d’ouverture non effacée");
  // feuille « À finir »
  await p.evaluate(()=>switchTab('bar')); await p.waitForTimeout(500);
  await p.click('#v-bar .fin-line'); await p.waitForTimeout(700);
  const F=await p.evaluate(()=>{ const s=[...document.querySelectorAll('.sheet')].pop(); const ids=[...s.querySelectorAll('[data-a="rec"]')].map(e=>e.dataset.id); return {ids, hs:[...s.querySelectorAll('.gh')].map(h=>h.textContent.replace(/[\u00a0\u202f]/g," ")), ok:ids.every(id=>status(RMAP[id]).ok)}; });
  if(F.hs.length!==2||!/Prosecco · encore 1 jour/.test(F.hs[0])) fail.push("feuille À finir : "+F.hs.join(" | "));
  if(new Set(F.ids).size!==F.ids.length||!F.ok||!F.ids.length) fail.push("feuille À finir : cocktails "+F.ids.join());
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(400);
  // fiche bouteille
  await p.evaluate(()=>ingSheet('campari')); await p.waitForTimeout(700);
  const I=await p.evaluate(()=>{ const s=[...document.querySelectorAll('.sheet')].pop(), st0=s.querySelector('.ing-stats'), st=st0&&{textContent:st0.textContent.replace(/[\u00a0\u202f]/g," ")}; const ok=RECS.filter(r=>status(r).ok&&r.ing.some(i=>i.id==="campari"&&i.r!=="opt")).length;
    const html=s.innerHTML; return {st:st&&st.textContent, ok, before:html.indexOf("ing-stats")<html.indexOf('class="gh">Prix'), near:s.querySelectorAll('.gh').length&&[...s.querySelectorAll('.gh')].some(h=>h.textContent==="À une bouteille près")}; });
  if(!I.st||!I.st.startsWith(I.ok+"faisable")||!/verres? restants?/.test(I.st)) fail.push("fiche : "+I.st+" (attendu "+I.ok+" faisables)");
  if(!I.before) fail.push("fiche : « Ce qu’elle t’apporte » pas avant le prix");
  if(!I.near) fail.push("fiche : pas de « À une bouteille près »");
  await p.evaluate(()=>closeAll()); await p.waitForTimeout(300);
  await p.evaluate(()=>ingSheet('vermouth_rouge')); await p.waitForTimeout(600);
  if(!await p.evaluate(()=>/Ouverte : encore 5 jours \(se garde 30 jours/.test([...document.querySelectorAll('.sheet')].pop().textContent.replace(/[\u00a0\u202f]/g," ")))) fail.push("fiche vermouth : durée d’ouverture absente");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Mon bar : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Mon bar : « À finir » (bulles tout de suite, vermouth en fin de vie), meilleur achat = bottleRecs, compte de cocktails exact par bouteille, date d’ouverture suivie, fiche enrichie, feuille sans doublon.");
  await b.close(); process.exit(fail.length?1:0); })();
