// 1.74 : Rewind des 3 mois. Bornes des trimestres (changement d'année compris), dernier trimestre écoulé, éligibilité
// (≥ 3 verres), carte sur l'accueil du 1er au 10 du mois suivant seulement, ligne dans Profil > Tes récaps, diapositives
// sans valeur vide (NaN, undefined), mois fort exact, carte PNG aux libellés du trimestre ; Rewind annuel inchangé.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
const run=async(b,fakeISO,fn)=>{ const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(F=>{ const O=Date, T=new O(F).getTime(); globalThis.Date=class extends O{ constructor(...a){ if(!a.length) return new O(T); return new O(...a); } static now(){ return T; } };
    // 7 verres en octobre–décembre 2026 (4 en novembre), 2 en juillet–septembre 2026
    const d=(m,day,h)=>new O(2026,m,day,h||20).getTime(), hist=[["negroni",d(9,3)],["negroni",d(10,2)],["daiquiri",d(10,9)],["negroni",d(10,20)],["mojito",d(10,28)],["margarita",d(11,5)],["paloma",d(11,30,23)],["hugo",d(7,1)],["hugo",d(8,1)]].map(([id,t])=>({id,t}));
    localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false},hintSwipe:1},stock:{gin:1},ratings:{negroni:5,daiquiri:4},hist})); },fakeISO);
  await p.goto(APP); await p.waitForTimeout(2200); const r=await fn(p); await p.close(); return [r,errs]; };
(async()=>{ const b=await chromium.launch(); const fail=[]; let E=[];
  // 1) 5 janvier 2027 : trimestre précédent = octobre–décembre 2026
  let [R,e]=await run(b,"2027-01-05T19:00:00",async p=>{
    const U=await p.evaluate(()=>{ const f=t=>{ const d=new Date(t); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); };
      return {lq:lastQuarter(), r4:quarterRange(2026,3).map(f), r1:quarterRange(2027,0).map(f), n:quarterCount(2026,3), n3:quarterCount(2026,2), el3:quarterEligible(2026,2), D:(({months,topM,count,distinct})=>({months,topM,count,distinct}))(quarterData(2026,3))}; });
    await p.evaluate(()=>switchTab('today')); await p.waitForTimeout(800);
    const card=await p.evaluate(()=>{ const c=document.querySelector('#v-today [data-a="rwquarter"]'); return c&&{y:c.dataset.y,q:c.dataset.q,t:c.textContent}; });
    await p.evaluate(()=>switchTab('profil')); await p.waitForTimeout(800);
    const row=await p.evaluate(()=>{ const c=document.querySelector('#v-profil [data-a="rwquarter"]'); return c&&c.textContent; });
    await p.evaluate(()=>openQuarterRewind(2026,3)); await p.waitForTimeout(400);
    const slides=await p.evaluate(()=>RW.slides.map(s=>{ const d=document.createElement("div"); d.innerHTML=s.h; return d.textContent; }));
    const png=await p.evaluate(async()=>{ let svg=""; const I=Image; window.Image=class extends I{ set src(v){ if(v.startsWith("data:image/svg")) svg=decodeURIComponent(v.split(",")[1]); super.src=v; } get src(){ return super.src; } };
      try{ await rwSave(); }catch(e){} window.Image=I; await new Promise(r=>setTimeout(r,400)); const im=document.querySelector('.sheet img'); return {svg:svg.replace(/<svg x="340"[\s\S]*?<\/svg>/,""), img:!!im}; });
    return {U,card,row,slides,png}; });
  E=E.concat(e);
  if(JSON.stringify(R.U.lq)!=='{"y":2026,"q":3}') fail.push("dernier trimestre au 5 janvier : "+JSON.stringify(R.U.lq));
  if(R.U.r4.join()!=="2026-10-1,2027-1-1"||R.U.r1.join()!=="2027-1-1,2027-4-1") fail.push("bornes : "+R.U.r4+" / "+R.U.r1);
  if(R.U.n!==7||R.U.n3!==2||R.U.el3) fail.push("comptes : T4 "+R.U.n+", T3 "+R.U.n3+" éligible="+R.U.el3);
  if(R.U.D.months.join()!=="1,4,2"||R.U.D.topM!==1||R.U.D.count!==7) fail.push("mois fort : "+JSON.stringify(R.U.D));
  if(!R.card||R.card.y!=="2026"||R.card.q!=="3"||!/Octobre–décembre 2026/.test(R.card.t)) fail.push("carte d’accueil : "+JSON.stringify(R.card));
  if(!R.row||!/Octobre–décembre 2026/.test(R.row)) fail.push("ligne du profil : "+R.row);
  if(R.slides.some(t=>/NaN|undefined|null/.test(t))) fail.push("diapositive avec une valeur vide : "+R.slides.find(t=>/NaN|undefined|null/.test(t)));
  if(!R.slides.some(t=>/Novembre/.test(t))) fail.push("mois fort absent des diapositives");
  if(!/MES 3 MOIS ZESTE/.test(R.png.svg)||!/Octobre–décembre 2026/.test(R.png.svg)||!/mon cocktail du trimestre/.test(R.png.svg)||/trophées/.test(R.png.svg)||!/découvertes/.test(R.png.svg)) fail.push("carte PNG sans les libellés du trimestre");
  if(!R.png.img) fail.push("carte PNG non affichée (repli appui long)");
  // 2) 15 janvier 2027 : plus de carte d'accueil, toujours la ligne du profil
  [R,e]=await run(b,"2027-01-15T19:00:00",async p=>{ await p.evaluate(()=>switchTab('today')); await p.waitForTimeout(700); const c=await p.evaluate(()=>!!document.querySelector('#v-today [data-a="rwquarter"]'));
    await p.evaluate(()=>switchTab('profil')); await p.waitForTimeout(700); const r=await p.evaluate(()=>!!document.querySelector('#v-profil [data-a="rwquarter"]'));
    await p.evaluate(()=>{ RW=null; openRewind(); }); await p.waitForTimeout(300); const yr=await p.evaluate(()=>!RW.lab&&RW.slides.length>2); return {c,r,yr}; });
  E=E.concat(e); if(R.c) fail.push("carte d’accueil encore là le 15 janvier"); if(!R.r) fail.push("ligne du profil absente le 15 janvier"); if(!R.yr) fail.push("Rewind annuel touché");
  // 3) 5 octobre 2026 : T3 (2 verres) non éligible → pas de carte ; la ligne montre le trimestre en cours seulement s'il a 3 verres (1 ici) → rien
  [R,e]=await run(b,"2026-10-05T19:00:00",async p=>{ await p.evaluate(()=>switchTab('today')); await p.waitForTimeout(700); const c=await p.evaluate(()=>!!document.querySelector('#v-today [data-a="rwquarter"]'));
    await p.evaluate(()=>switchTab('profil')); await p.waitForTimeout(700); const r=await p.evaluate(()=>!!document.querySelector('#v-profil [data-a="rwquarter"]')); return {c,r}; });
  E=E.concat(e); if(R.c||R.r) fail.push("trimestre de 2 verres proposé : "+JSON.stringify(R));
  if(E.length) fail.push("erreurs : "+E.join(" | "));
  console.log(fail.length? "Rewind des 3 mois : "+fail.length+" échec(s)\n  "+fail.join("\n  ") : "Rewind des 3 mois : bornes (changement d’année), dernier trimestre, éligibilité ≥ 3 verres, carte d’accueil du 1er au 10 seulement, ligne du profil, diapositives sans valeur vide, mois fort, carte PNG aux libellés du trimestre ; Rewind annuel intact.");
  await b.close(); process.exit(fail.length?1:0); })();
