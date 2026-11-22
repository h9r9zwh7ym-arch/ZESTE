// 1.87 (review) : substituts courants (bourbon ↔ rye, champagne ↔ prosecco, ginger ale ↔ ginger beer, rhums…), histoires
// corrigées d'après leurs sources (data/verif.json, clé « histoires »), sirop de sureau maison compté 30 jours, IBA Tiki dans
// son verre tiki, Presbyterian au scotch, conseil œuf cru, ingrédients rares avec une piste.
const {chromium}=require('playwright'); const path=require('path'), http=require('http'), fs=require('fs');
const SRV=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}); r.end(fs.readFileSync(path.join(__dirname,'../../dist/zeste.html'))); });
const verif=require('../../data/verif.json');
(async()=>{ await new Promise(z=>SRV.listen(0,'127.0.0.1',z)); const APP='http://127.0.0.1:'+SRV.address().port+'/zeste.html';
  const b=await chromium.launch(); const fail=[], errs=[]; const ok=(c,m)=>{ if(!c) fail.push(m); };
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:2,app:"zeste",t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:4,prosecco:3,bourbon:3,vermouth_rouge:2}})));
  await p.goto(APP); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{ const st=id=>status(RMAP[id]);
    const f75=st("french75"), man=st("manhattan"), sazerac=RMAP.sazerac&&st("sazerac");
    switchTab("cocktails"); CF.q=""; CF.main=""; renderView("cocktails");
    const row=[...document.querySelectorAll('#cx-res .row')].find(x=>/French 75/.test(x.textContent));
    const H=["corpse_reviver","schumli_pflumli","honeymoon","mary_pickford","godfather","panache","pastis","french75","tuxedo","eggnog","illegal"].map(id=>[id,RMAP[id].h]);
    return {f75:{ok:f75.ok,subOk:f75.subOk,sub:f75.subs.champagne}, man:{ok:man.ok,miss:man.miss,subs:man.subs}, row:row&&row.textContent,
      H, sureau:PREP_TPL.find(t=>t[0]==="sureau")[3], tiki:RMAP.iba_tiki.g, presb:RMAP.presbyterian.ing[0].id,
      egg:(TECH.find(t=>t.id==="dryshake").st||[]).join(" "), allspice:ING.allspice.tip, violette:ING.violette.tip,
      subs:["bourbon","rye","tennessee","islay","champagne","prosecco","ginger_ale","ginger_beer","rhum_ambre","rhum_brun","rhum_jam","rhum_epice"].every(id=>(ING[id].subs||[]).length) }; });
  ok(!r.f75.ok&&r.f75.subOk&&r.f75.sub==="prosecco","French 75 avec prosecco : "+JSON.stringify(r.f75));
  ok(r.row&&/prosecco à la place/i.test(r.row),"liste : pas de « avec prosecco à la place » ("+r.row+")");
  ok(r.subs,"substituts manquants");
  const bad={corpse_reviver:/ranimerait le cadavre… aussitôt/,schumli_pflumli:/Hazy Osterwald/,honeymoon:/années 1910 à la pomme, servi/,mary_pickford:/en tournage à Cuba avec/,godfather:/On dit que c’était le préféré/,panache:/on dit plutôt Radler/,pastis:/pastisson/,french75:/vers 1915/,tuxedo:/Né vers 1880/,eggnog:/avait sa propre recette/,illegal:/qui l’a mis au point au début/};
  r.H.forEach(([id,h])=>ok(h&&!bad[id].test(h),"histoire non corrigée : "+id));
  r.H.forEach(([id])=>ok(verif.histoires&&verif.histoires[id]&&/^https:\/\//.test(verif.histoires[id].source),"histoire sans source dans data/verif.json : "+id));
  ok(r.sureau===30,"sirop de sureau maison : "+r.sureau+" jours"); ok(r.tiki==="tiki","IBA Tiki dans un verre "+r.tiki); ok(r.presb==="scotch","Presbyterian au "+r.presb);
  ok(/pasteuris/.test(r.egg),"technique du dry shake : rien sur l’œuf cru"); ok(/caviste/.test(r.allspice)&&/caviste/.test(r.violette),"ingrédients rares sans piste");
  if(errs.length) fail.push("erreurs : "+[...new Set(errs)].join(" | "));
  console.log(fail.length? "Review recettes : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Review recettes : substituts courants (French 75 « avec prosecco à la place »), 11 histoires corrigées et sourcées, sirop de sureau 30 jours, IBA Tiki en verre tiki, Presbyterian au scotch, œuf cru et ingrédients rares documentés.");
  await b.close(); SRV.close(); process.exit(fail.length?1:0); })();
