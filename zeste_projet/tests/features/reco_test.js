// 1.59 (G) : règles du moteur visibles dans l'app — « N % pour toi » plafonné (95 % sous 15 notes, jamais 100 %),
// « Surprends-moi » parmi les 15 meilleurs faisables (jamais noté ≤ 2 ni préparé récemment), explications réelles ou rien,
// « bientôt à racheter » en « ≈ N verres » trié par urgence, achats malins par gain attendu.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:1,campari:2,vermouth_rouge:1,chartreuse:2,tonic:4,vodka:0,citron:1,rhum_blanc:3},ratings:{negroni:5,daiquiri:2,boulevardier:5,americano:4},hist:[{id:"gin_tonic",t:Date.now()-5*864e5},{id:"negroni",t:Date.now()-864e5}]})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const out={};
    const pcts=RECS.map(x=>matchPct(x)); out.maxPct=Math.max(...pcts); out.minPct=Math.min(...pcts);
    out.pool=surprisePool().map(x=>x.id); out.poolBad=out.pool.filter(id=>S.ratings[id]<=2||["negroni","gin_tonic"].includes(id)||!status(RMAP[id]).ok);
    out.gen=RECS.map(x=>reasons(x)).filter(t=>/^(Un grand classique|Profil |Une création suisse)/.test(t)).length;
    out.why=RECS.map(x=>reasons(x)).find(t=>/^Parce que tu as aimé /.test(t))||"";
    const B=bottleRecs(); out.buyOk=B.every((x,i)=>!i||B[i-1].v>=x.v-1e-9);
    return out; });
  if(r.maxPct>95||r.maxPct>=100||r.minPct<1) fail.push('pourcentages : max '+r.maxPct+', min '+r.minPct);
  if(!r.pool.length||r.pool.length>15||r.poolBad.length) fail.push('Surprends-moi : '+JSON.stringify(r.pool)+' interdits '+JSON.stringify(r.poolBad));
  if(r.gen) fail.push(r.gen+' explications génériques');
  if(!r.buyOk) fail.push('achats malins non triés par gain attendu');
  // 15 notes ou plus : le plafond passe à 99 %, jamais 100
  const hi=await p.evaluate(()=>{ RECS.slice(0,16).forEach((x,i)=>S.ratings[x.id]=i%2?5:4); SREV++; MODEL=null; return Math.max(...RECS.map(x=>matchPct(x))); });
  if(hi>=100||hi>99) fail.push('plafond à 15 notes : '+hi);
  // bientôt à racheter : ≈ N verres, du plus urgent au moins urgent dans chaque niveau
  await p.evaluate(()=>{ S.ratings={negroni:5}; SREV++; MODEL=null; ACT.lowsheet(); }); await p.waitForTimeout(700);
  const L=await p.evaluate(()=>[...[...document.querySelectorAll('.sheet')].pop().querySelectorAll('.group')].map(g=>[...g.querySelectorAll('.low-row .grow>span')].map(s=>s.textContent)));
  const flat=L.flat(); if(!flat.length||flat.some(t=>/recette/.test(t))||!flat.some(t=>/^≈\s\d+\sverres?$/.test(t))) fail.push('autonomie : '+JSON.stringify(L));
  L.forEach(g=>{ const n=g.map(t=>+(t.match(/\d+/)||[0])[0]); if(n.some((v,i)=>i&&v<n[i-1])) fail.push('tri par urgence : '+JSON.stringify(g)); });
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC moteur : '+fail.join(' ; '):`Moteur : pourcentages calibrés et plafonnés (${r.maxPct} % au plus sous 15 notes, ${hi} % ensuite), Surprends-moi parmi ${r.pool.length} faisables autorisés, explications réelles (« ${r.why} ») ou rien, autonomie en verres triée par urgence, achats par gain attendu.`);
  await b.close(); process.exit(fail.length?1:0); })();
