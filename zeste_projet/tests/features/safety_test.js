// Filet de sécurité et confort iOS (1.35) : un écran ou une fiche qui échoue affiche « Réessayer » au lieu de rester
// vide, et se répare ; pas de zoom au double tap ; les champs ne descendent jamais sous 16 px (sinon iOS zoome),
// même avec une petite taille de texte système ; « Entrée » referme le clavier.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[], fail=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,campari:2}})));
  try{
    await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(3000);
    // 1. écran qui échoue puis se répare
    await p.evaluate(()=>{ window.__vBar=vBar; vBar=()=>{ throw new Error("panne simulée"); }; switchTab("bar"); });
    await p.waitForTimeout(300);
    if(!await p.evaluate(()=>!!document.querySelector('#v-bar .fail [data-a="retryview"]'))) fail.push("pas de message de secours sur l'écran");
    await p.evaluate(()=>{ vBar=window.__vBar; }); await p.click('#v-bar [data-a="retryview"]'); await p.waitForTimeout(300);
    if(await p.evaluate(()=>!!document.querySelector('#v-bar .fail'))) fail.push("« Réessayer » ne répare pas l'écran");
    if(!errs.some(e=>/panne simulée/.test(e))) fail.push("l'erreur n'est plus signalée (tests aveugles)");
    // 2. fiche qui échoue puis se répare
    await p.evaluate(()=>{ let n=0; openSheet(()=>{ if(!n++) throw new Error("panne fiche"); return {title:"Réparée",body:"<p>ok</p>"}; }); }); await p.waitForTimeout(400);
    if(!await p.evaluate(()=>!!document.querySelector('.sheet [data-a="retrysheet"]'))) fail.push("pas de message de secours dans la fiche");
    await p.click('.sheet [data-a="retrysheet"]'); await p.waitForTimeout(300);
    if(!await p.evaluate(()=>/Réparée/.test(SHEETS[SHEETS.length-1].el.textContent))) fail.push("« Réessayer » ne répare pas la fiche");
    await p.evaluate(()=>closeAll()); await p.waitForTimeout(500);
    // 3. pas de zoom au double tap
    if(await p.evaluate(()=>getComputedStyle(document.body).touchAction)!=="manipulation") fail.push("double tap : touch-action n'est pas « manipulation »");
    // 4. champs à 16 px minimum avec une petite taille de texte système (88 %)
    await p.evaluate(()=>{ document.documentElement.style.fontSize=(17*0.88)+"px"; switchTab("cocktails"); });
    const fs=await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('#cq')).fontSize));
    if(fs<16) fail.push("recherche à "+fs+" px avec un petit texte système (iOS zoomerait)");
    // 5. « Entrée » referme le clavier
    await p.focus('#cq'); await p.keyboard.type('gin'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    if(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="cq")) fail.push("« Entrée » ne referme pas le clavier");
  }catch(e){ fail.push("exception : "+e.message.slice(0,200)); }
  const other=errs.filter(e=>!/panne simulée|panne fiche/.test(e)); if(other.length) fail.push("erreurs JS : "+other.join(" | "));
  console.log(fail.length?"ÉCHEC sécurité : "+fail.join(" ; "):"Sécurité : écran et fiche en échec affichent « Réessayer » et se réparent, pas de zoom au double tap, champs ≥ 16 px même en petit texte, « Entrée » referme le clavier.");
  await b.close(); process.exit(fail.length?1:0); })();
