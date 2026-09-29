// Barre d'onglets (1.36) : en mode mobile, l'écran qui arrive en glissant ne doit jamais élargir la page, et la
// pastille doit rester centrée sous l'onglet actif (elle dérivait de 10 à 31 px vers la droite).
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const fail=[];
  for(const w of [375,430]){ const p=await b.newPage({viewport:{width:w,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}}})));
    await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(2500);
    for(const t of ["cocktails","bar","labo","profil","today"]){
      const wid=await p.evaluate(t=>{ document.querySelector(`.tabbar button[data-t="${t}"]`).click(); return new Promise(r=>setTimeout(()=>r(innerWidth),120)); },t);
      if(wid!==w) fail.push(`${w} px, onglet ${t} : la page s'élargit à ${wid} px pendant l'animation`);
      await p.waitForTimeout(700);
      const d=await p.evaluate(()=>{ const on=document.querySelector('.tabbar button.on').getBoundingClientRect(), ind=document.querySelector('.tab-ind').getBoundingClientRect(); return Math.round((ind.left+ind.width/2)-(on.left+on.width/2)); });
      if(Math.abs(d)>1) fail.push(`${w} px, onglet ${t} : pastille décalée de ${d} px`); }
    if(errs.length) fail.push("erreurs JS : "+errs.join(" | ")); await p.close(); }
  console.log(fail.length?"ÉCHEC barre d’onglets : "+fail.join(" ; "):"Barre d’onglets : la page ne s’élargit jamais pendant les transitions, la pastille reste centrée sous l’onglet actif.");
  await b.close(); process.exit(fail.length?1:0); })();
