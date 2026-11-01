// 1.81 : écran de lancement de saison. En janvier, avril, juillet et octobre : classe de la saison, halo et 16 éléments
// (flocons, pétales, éclats, feuilles) ; l'écran disparaît comme avant ; icône d'onglet SVG avec pastille de saison ;
// en mouvement réduit, pas d'écran de lancement (comme avant) et aucune erreur.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  for(const [k,mo,shape] of [["hiver",0,"flake"],["printemps",3,"petal"],["ete",6,"spark"],["automne",9,"leaf"]]){
    const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(mo=>{ const O=Date,T=new O(2026,mo,15,20).getTime(); globalThis.Date=class extends O{ constructor(...a){ if(!a.length) return new O(T); return new O(...a);} static now(){return T;} };
      localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{hintSwipe:1},stock:{gin:1}})); },mo);
    await p.goto(APP); await p.waitForTimeout(700);
    const s=await p.evaluate(()=>{ const e=document.getElementById('splash'); const f=document.querySelector('link[rel=icon][data-season]'); return e&&{cls:e.className, bits:[...e.querySelectorAll('.sb')].map(x=>x.classList[1]), halo:e.style.getPropertyValue('--halo'), fav:!!f&&f.href.startsWith('data:image/svg+xml')&&decodeURIComponent(f.href).includes('<circle cx="82"')}; });
    if(!s||!s.cls.includes("s-"+k)||s.bits.length!==16||s.bits.some(x=>x!==shape)||!s.halo||!s.fav) fail.push(k+" : "+JSON.stringify(s));
    await p.waitForTimeout(2900); if(await p.evaluate(()=>!!document.getElementById('splash'))) fail.push(k+" : l’écran de lancement ne disparaît pas");
    await p.close(); }
  const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{hintSwipe:1},stock:{gin:1}})));
  await p.goto(APP); await p.waitForTimeout(500); if(await p.evaluate(()=>!!document.getElementById('splash'))) fail.push("mouvement réduit : écran de lancement affiché");
  if(errs.length) fail.push("erreurs : "+errs.join(" | "));
  console.log(fail.length? "Lancement de saison : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Lancement de saison : hiver, printemps, été, automne (halo et 16 éléments chacun), disparition en ~2 s, icône d’onglet avec pastille, rien en mouvement réduit.");
  await b.close(); process.exit(fail.length?1:0); })();
