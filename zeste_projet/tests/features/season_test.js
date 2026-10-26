// 1.73 : « De saison ». inSeason suit SEASON (sélection du mois), les fruits frais du moment et le chaud en hiver ;
// le filtre « De saison » de Cocktails > Filtres ne garde que ces recettes ; badge dans la fiche
// d'une recette de saison et pas ailleurs ; la carte de l'accueil porte la teinte de la saison ; aucune erreur.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2200);
  const U=await p.evaluate(()=>{ const o=[];
    for(let mo=1;mo<=12;mo++) SEASON[mo].r.forEach(id=>{ if(!RMAP[id]) o.push("SEASON["+mo+"] : "+id+" inconnu"); else if(!inSeason(RMAP[id],mo)) o.push(id+" pas de saison en "+mo); });
    if(!inSeason(RMAP.hot_toddy,1)||inSeason(RMAP.hot_toddy,7)) o.push("hot toddy : chaud en janvier, pas en juillet");
    const fr=RECS.find(r=>r.ing.some(i=>i.id==="fraise_puree")&&!SEASON[6].r.includes(r.id)&&r.m!=="hot"); if(fr&&(!inSeason(fr,6)||inSeason(fr,12))) o.push(fr.id+" : fraise en juin, pas en décembre");
    if(inSeason(RMAP.negroni,new Date().getMonth()+1)&&!SEASON[new Date().getMonth()+1].r.includes("negroni")) o.push("negroni de saison ?");
    return o; });
  fail.push(...U);
  // accueil : teinte et « Tout voir »
  await p.evaluate(()=>switchTab('today')); await p.waitForTimeout(800);
  const H=await p.evaluate(()=>{ const c=document.querySelector('#v-today .card.season'); return {cls:c&&c.className}; });
  const sk=await p.evaluate(()=>seasonKey());
  if(!H.cls||!H.cls.includes("s-"+sk)) fail.push("carte de saison sans teinte : "+H.cls);
  // filtre « De saison » depuis Cocktails > Filtres (puce « Autres »)
  await p.evaluate(()=>{ switchTab('cocktails'); }); await p.waitForTimeout(600);
  await p.evaluate(()=>ACT.filters()); await p.waitForTimeout(700);
  const chip=p.locator('.sheet .chip', {hasText:'De saison'}); if(!await chip.count()) fail.push("puce « De saison » absente des filtres");
  else { await chip.first().click(); await p.waitForTimeout(400); await p.evaluate(()=>closeAll()); await p.waitForTimeout(700);
    const C=await p.evaluate(()=>{ const ids=[...document.querySelectorAll('#v-cocktails [data-a="rec"]')].map(e=>e.dataset.id); const want=RECS.filter(r=>inSeason(r)).map(r=>r.id);
      return {x:CF.x.slice(), ids:[...new Set(ids)], want}; });
    if(C.x.join()!=="season") fail.push("filtre non activé : "+C.x.join());
    if(!C.ids.length||C.ids.some(id=>!C.want.includes(id))||C.want.some(id=>!C.ids.includes(id))) fail.push("liste filtrée ≠ inSeason : "+C.ids.join()+" / "+C.want.join()); }
  // badge dans la fiche
  const B=await p.evaluate(()=>{ const yes=RECS.find(r=>inSeason(r)), no=RECS.find(r=>!inSeason(r)); const g=id=>{ recSheet(id); const s=[...document.querySelectorAll('.sheet')].pop(); const v=!!s.querySelector('.tags .badge.season'); closeAll(); return v; }; return {yes:g(yes.id), no:g(no.id)}; });
  if(!B.yes||B.no) fail.push("badge de saison : "+JSON.stringify(B));
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "De saison : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "De saison : sélection du mois, fruits frais et chaud en hiver ; filtre exact depuis Cocktails > Filtres ; badge dans la fiche ; teinte de la saison sur l’accueil.");
  await b.close(); process.exit(fail.length?1:0); })();
