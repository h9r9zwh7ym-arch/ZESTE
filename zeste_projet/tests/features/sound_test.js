// Son (1.33) : après un passage en arrière-plan, l'audio doit revenir au premier geste, sans rafale de sons en attente,
// et un contexte fermé ou coincé (cas connu de Safari après une interruption) doit être remplacé.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage(); const errs=[], fail=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{sound:true,fx:{splash:false}}})); });
  await p.goto('file://'+path.join(__dirname,'../../dist/zeste.html')); await p.waitForTimeout(3500);
  const st=()=>p.evaluate(()=>{ const c=SND._ctx(); return c?c.state:'none'; });
  const tapTab=async()=>{ await p.click('.tabbar button:nth-child(3)'); await p.waitForTimeout(300); await p.click('.tabbar button:nth-child(2)'); await p.waitForTimeout(700); };
  try{
    await tapTab(); if(await st()!=="running") fail.push("audio pas démarré au premier geste ("+await st()+")");
    // 1. l'app passe en arrière-plan : iOS met l'audio en pause
    // comme sur iOS, la relance sans geste est refusée pendant la pause (Chromium, lui, l'accepterait : test instable)
    await p.evaluate(async()=>{ const c=SND._ctx(); await c.suspend(); c.__res=c.resume; c.resume=()=>Promise.resolve(); document.dispatchEvent(new Event('visibilitychange')); });
    // un son demandé pendant la pause ne doit pas être mis en file
    const queued=await p.evaluate(()=>{ const c=SND._ctx(); let n=0; const o=c.createOscillator.bind(c); c.createOscillator=()=>{ n++; return o(); }; SND.tap(); SND.check(); const r=n; c.createOscillator=o; return r; });
    if(queued) fail.push(queued+" son(s) mis en file pendant la pause (rafale au retour)");
    await p.evaluate(()=>{ const c=SND._ctx(); c.resume=c.__res; delete c.__res; }); // le geste qui suit, lui, est autorisé
    await tapTab(); if(await st()!=="running") fail.push("audio pas relancé au retour ("+await st()+")");
    // 2. contexte fermé : il doit être recréé
    await p.evaluate(async()=>{ await SND._ctx().close(); }); await tapTab(); await tapTab();
    if(await st()!=="running") fail.push("contexte fermé non remplacé ("+await st()+")");
    // 3. contexte coincé : resume() ne fait rien ; après deux gestes, un contexte neuf doit le remplacer
    const old=await p.evaluate(async()=>{ const c=SND._ctx(); await c.suspend(); c.resume=()=>Promise.resolve(); window.__old=c; return true; });
    await tapTab(); await tapTab(); await tapTab(); await tapTab();
    const replaced=await p.evaluate(()=>SND._ctx()!==window.__old);
    if(!replaced) fail.push("contexte coincé jamais remplacé");
    else if(await st()!=="running") fail.push("nouveau contexte pas démarré ("+await st()+")");
  }catch(e){ fail.push("exception : "+e.message); }
  if(errs.length) fail.push("erreurs JS : "+errs.join(" | "));
  console.log(fail.length?"ÉCHEC son : "+fail.join(" ; "):"Son : relance au retour dans l'app, aucun son en file pendant la pause, contexte fermé ou coincé remplacé : tout est correct.");
  await b.close(); process.exit(fail.length?1:0); })();
