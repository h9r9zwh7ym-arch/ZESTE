// « Réduire les animations » (1.36) : rien ne doit bouger (pseudo-éléments compris), et aucun contenu ne doit
// rester caché parce que son apparition dépendait d'une animation (le service du labo affiche tout de suite son résultat).
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}); const errs=[], fail=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",weightKg:70,sex:"h"},stock:{gin:4,campari:3,vermouth_rouge:2,rhum_blanc:2,citron_vert:1,sirop_sucre:1},ratings:{negroni:5},hist:Array.from({length:12},(_,i)=>({id:["negroni","daiquiri"][i%2],t:Date.now()-i*864e5-1800e3}))})));
  const check=async name=>{ const r=await p.evaluate(()=>{ const out=[]; const H=innerHeight;
    document.querySelectorAll('body *').forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width||!r.height||r.bottom<0||r.top>H) return; const cs=getComputedStyle(el);
      if(cs.animationName!=="none"&&cs.animationPlayState!=="paused") out.push("animé : "+(el.className.baseVal??el.className));
      for(const ps of ["::before","::after"]){ const s=getComputedStyle(el,ps); if(s.content!=="none"&&s.animationName!=="none") out.push("pseudo animé "+ps+" : "+(el.className.baseVal??el.className)); }
      if(+cs.opacity<0.05&&el.textContent.trim().length>1&&!el.closest('[aria-hidden="true"],.navbar,#toast')&&getComputedStyle(el.parentElement).opacity>0.5) out.push("caché : "+(el.className.baseVal??el.className)); });
    return [...new Set(out)].slice(0,6); }); if(r.length) fail.push(name+" → "+r.join(", ")); };
  try{
    await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(2500);
    await check("accueil"); for(const t of ["cocktails","bar","labo","profil"]){ await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(400); await check(t); }
    await p.evaluate(()=>{ switchTab("today"); recSheet("negroni"); }); await p.waitForTimeout(600); await check("fiche");
    await p.evaluate(()=>{ closeAll(); switchTab("labo"); ACT.tolab({id:"daiquiri"}); }); await p.waitForTimeout(400);
    await p.evaluate(()=>ACT.mixserve()); await p.waitForTimeout(700); await check("service du labo");
  }catch(e){ fail.push("exception : "+e.message.slice(0,200)); }
  if(errs.length) fail.push("erreurs JS : "+errs.join(" | "));
  console.log(fail.length?"ÉCHEC animations réduites : "+fail.join(" ; "):"Animations réduites : rien ne bouge (pseudo-éléments compris), aucun contenu ne reste caché, le labo montre son résultat tout de suite.");
  await b.close(); process.exit(fail.length?1:0); })();
